// =============================================================================
// Deskillz Web SDK - HTTP Client
// Path: src/core/http-client.ts
// Native fetch-based HTTP client replacing axios
// Replicates the EXACT interceptor chain from: api-client.ts (lines 1-118)
//   - Request interceptor: attach Authorization Bearer token (lines 37-46)
//   - Response interceptor: 401 auto-refresh with _retry flag (lines 48-86)
//   - Error extraction: message || error || fallback (lines 88-98)
// =============================================================================

import type { ResolvedConfig } from './config';
import type { TokenManager } from './storage';
import type { TypedEventEmitter } from './event-emitter';
import type { ApiResponse, SDKEventMap, QueryParams } from './types';
import { SDKEventName } from './types';
import {
  DeskillzError,
  NetworkError,
  createErrorFromResponse,
  createNetworkError,
  ErrorCode,
} from './errors';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

/**
 * Progress callback for file uploads.
 * @param progress - Percentage complete (0-100).
 */
type UploadProgressCallback = (progress: number) => void;

// Internal flag type for preventing infinite refresh loops
// Replicates: api-client.ts line 52 (_retry flag)
interface RetryState {
  isRetrying: boolean;
}

// -----------------------------------------------------------------------------
// HTTP Client
// -----------------------------------------------------------------------------

export class HttpClient {
  private config: ResolvedConfig;
  private tokenManager: TokenManager;
  private events: TypedEventEmitter<SDKEventMap>;

  // Mutex to prevent concurrent token refresh attempts
  private refreshPromise: Promise<boolean> | null = null;

  constructor(
    config: ResolvedConfig,
    tokenManager: TokenManager,
    events: TypedEventEmitter<SDKEventMap>
  ) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.events = events;
  }

  // ---------------------------------------------------------------------------
  // Public API - Matches the interface defined in the roadmap
  // ---------------------------------------------------------------------------

  /**
   * GET request.
   * Params are serialized as query string.
   */
  async get<T>(path: string, params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * POST request with JSON body.
   */
  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, data, options);
  }

  /**
   * PUT request with JSON body.
   */
  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, data, options);
  }

  /**
   * PATCH request with JSON body.
   */
  async patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PATCH', url, data, options);
  }

  /**
   * DELETE request.
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * Upload a file with progress tracking via XMLHttpRequest.
   * Used for game build uploads to presigned URLs and direct uploads.
   *
   * @param url - Full URL (for presigned) or path (for API).
   * @param formData - FormData containing the file.
   * @param onProgress - Optional progress callback (0-100).
   * @param options - Additional request options.
   * @returns ApiResponse with the server response.
   */
  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: UploadProgressCallback,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const isFullUrl = url.startsWith('http://') || url.startsWith('https://');
    const fullUrl = isFullUrl ? url : `${this.config.apiBaseUrl}${url}`;

    const headers: Record<string, string> = {
      ...this.config.customHeaders,
      ...options?.headers,
    };

    // Attach auth token unless uploading to external presigned URL or skipped
    if (!options?.skipAuth && !isFullUrl) {
      const token = await this.tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return new Promise<ApiResponse<T>>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', fullUrl, true);
      xhr.timeout = this.config.timeout;

      // Set headers (do NOT set Content-Type for FormData - browser sets boundary)
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      }

      // Progress tracking
      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve({ data: data as T, success: true });
          } catch {
            resolve({ data: {} as T, success: true });
          }
        } else {
          try {
            const body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            reject(createErrorFromResponse(xhr.status, body));
          } catch {
            reject(createErrorFromResponse(xhr.status, null, 'Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new NetworkError('Upload failed. Please check your connection.'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new NetworkError('Upload timed out.', ErrorCode.TIMEOUT));
      });

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new DeskillzError('Upload cancelled', ErrorCode.REQUEST_FAILED));
        });
      }

      xhr.send(formData);
    });
  }

  // ---------------------------------------------------------------------------
  // Core Request Engine
  // Replicates the full axios interceptor chain from api-client.ts
  // ---------------------------------------------------------------------------

  private async request<T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    options?: RequestOptions,
    retryState: RetryState = { isRetrying: false }
  ): Promise<ApiResponse<T>> {
    // --- REQUEST INTERCEPTOR (api-client.ts lines 37-46) ---
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.customHeaders,
      ...options?.headers,
    };

    // Attach Bearer token
    if (!options?.skipAuth) {
      const token = await this.tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Build fetch options
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: options?.signal ?? controller.signal,
    };

    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    // Debug logging
    if (this.config.debug) {
      console.log(`[DeskillzSDK] ${method} ${url}`, body ?? '');
    }

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // --- RESPONSE INTERCEPTOR: Handle 401 (api-client.ts lines 48-86) ---
      if (response.status === 401 && !retryState.isRetrying && !options?.skipAuth) {
        // Set _retry flag to prevent infinite loops (api-client.ts line 56)
        const refreshed = await this.attemptTokenRefresh();

        if (refreshed) {
          // Retry original request with new token (api-client.ts lines 68-72)
          return this.request<T>(method, url, body, options, { isRetrying: true });
        }

        // Refresh failed - clear tokens and emit logout (api-client.ts lines 74-79)
        await this.tokenManager.clearTokens();
        this.events.emit(SDKEventName.AUTH_LOGOUT);

        // Parse error body for better error message
        const errorBody = await this.safeParseJson(response);
        throw createErrorFromResponse(401, errorBody);
      }

      // --- SUCCESSFUL RESPONSE ---
      if (response.ok) {
        const data = await this.safeParseJson(response);

        if (this.config.debug) {
          console.log(`[DeskillzSDK] ${method} ${url} -> ${response.status}`, data);
        }

        // Backend wraps responses in { data, message, success } sometimes,
        // and sometimes returns the data directly. Handle both shapes.
        if (data && typeof data === 'object' && 'success' in data) {
          return data as unknown as ApiResponse<T>;
        }

        return { data: data as unknown as T, success: true };
      }

      // --- ERROR RESPONSE (api-client.ts lines 82-85) ---
      const errorBody = await this.safeParseJson(response);
      throw createErrorFromResponse(response.status, errorBody);

    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw SDK errors as-is
      if (error instanceof DeskillzError) {
        throw error;
      }

      // Network/fetch errors (api-client.ts lines 93-98)
      throw createNetworkError(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Token Refresh
  // Replicates: api-client.ts lines 58-79
  // Uses mutex to prevent concurrent refresh attempts
  // ---------------------------------------------------------------------------

  private async attemptTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const refreshToken = await this.tokenManager.getRefreshToken();

      if (!refreshToken) {
        if (this.config.debug) {
          console.log('[DeskillzSDK] No refresh token available');
        }
        return false;
      }

      if (this.config.debug) {
        console.log('[DeskillzSDK] Attempting token refresh...');
      }

      // Direct fetch to refresh endpoint (api-client.ts line 61)
      // Uses a separate fetch call (not this.request) to avoid interceptor recursion
      const response = await fetch(
        `${this.config.apiBaseUrl}/api/v1/auth/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        if (this.config.debug) {
          console.log('[DeskillzSDK] Token refresh failed:', response.status);
        }
        return false;
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data;

      // Store new tokens (api-client.ts lines 65-66)
      await this.tokenManager.setTokens(accessToken, newRefreshToken);

      if (this.config.debug) {
        console.log('[DeskillzSDK] Token refresh successful');
      }

      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error('[DeskillzSDK] Token refresh error:', error);
      }
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // URL Building
  // ---------------------------------------------------------------------------

  /**
   * Build full URL from path and optional query params.
   * Handles both absolute URLs and relative paths.
   */
  private buildUrl(path: string, params?: QueryParams): string {
    const isAbsolute = path.startsWith('http://') || path.startsWith('https://');
    const base = isAbsolute ? path : `${this.config.apiBaseUrl}${path}`;

    if (!params) return base;

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        for (const item of value) {
          searchParams.append(key, String(item));
        }
      } else {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    if (!queryString) return base;

    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}${queryString}`;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Safely parse JSON from a Response.
   * Returns null for empty bodies or parse failures.
   */
  private async safeParseJson(response: Response): Promise<Record<string, unknown> | null> {
    const text = await response.text();
    if (!text || text.trim().length === 0) return null;

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}