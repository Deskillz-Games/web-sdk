// =============================================================================
// Deskillz Web SDK - Host Service
// Path: src/host/host-service.ts
// Host dashboard and management: profile, tiers, badges, earnings,
// settlements, rooms, leaderboard, notifications, withdrawal, age verification
// Replicates: host.ts lines 224-576 (hostApi + helpers)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type {
  HostProfile,
  HostDashboardStats,
  TierInfo,
  LevelInfo,
  HostBadge,
  BadgeDefinition,
  BadgeProgressEntry,
  EarningsSummary,
  EarningsHistoryItem,
  EarningsHistoryFilters,
  SettlementRecord,
  SettlementFilters,
  ActiveRoom,
  RoomHistoryItem,
  RoomHistoryFilters,
  HostNotificationSettings,
  HostLeaderboardEntry,
  HostLeaderboardFilters,
  WithdrawRequest,
  WithdrawResponse,
  AgeVerificationResponse,
  AgeVerificationStatus,
  PaginatedHostResponse,
  MyRankResponse,
  TierDisplayInfo,
  LevelDisplayInfo,
  HostTier,
} from './host-types';
import type { QueryParams } from '../core/types';

// =============================================================================
// HOST SERVICE
// =============================================================================

/**
 * Service for the Host System.
 *
 * Hosts create and manage private/social rooms, earn revenue from entry fees
 * and rake, progress through 6 tiers (Bronze -> Elite) with 10 levels,
 * collect badges, and withdraw earnings.
 *
 * All endpoints require authentication.
 * All paths use the /api/v1/host/ prefix.
 *
 * 20 endpoints total. Replicates: host.ts hostApi (lines 224-466).
 */
export class HostService {
  private readonly http: HttpClient;
  private readonly debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ===========================================================================
  // PROFILE (2 endpoints)
  // Replicates: host.ts lines 229-243
  // ===========================================================================

  /**
   * Get host profile (auto-creates if the user has never hosted).
   * GET /api/v1/host/profile
   */
  async getProfile(): Promise<HostProfile> {
    this.log('getProfile');
    const res = await this.http.get<HostProfile>('/api/v1/host/profile');
    return res.data;
  }

  /**
   * Get full dashboard stats (single aggregate request).
   * Returns profile, tier info, level info, earnings, badges, active rooms,
   * and recent settlements in one call.
   * GET /api/v1/host/dashboard
   */
  async getDashboard(): Promise<HostDashboardStats> {
    this.log('getDashboard');
    const res = await this.http.get<HostDashboardStats>('/api/v1/host/dashboard');
    return res.data;
  }

  // ===========================================================================
  // TIERS & LEVELS (3 endpoints)
  // Replicates: host.ts lines 249-271
  // ===========================================================================

  /**
   * Get esports tier info with progression and revenue-share percentages.
   * GET /api/v1/host/tier/esports
   */
  async getEsportsTier(): Promise<TierInfo> {
    this.log('getEsportsTier');
    const res = await this.http.get<TierInfo>('/api/v1/host/tier/esports');
    return res.data;
  }

  /**
   * Get social tier info with progression and revenue-share percentages.
   * GET /api/v1/host/tier/social
   */
  async getSocialTier(): Promise<TierInfo> {
    this.log('getSocialTier');
    const res = await this.http.get<TierInfo>('/api/v1/host/tier/social');
    return res.data;
  }

  /**
   * Get current level info with progression and unlocked benefits.
   * 10 levels: Newcomer (1) -> Elite (10).
   * GET /api/v1/host/level
   */
  async getLevelInfo(): Promise<LevelInfo> {
    this.log('getLevelInfo');
    const res = await this.http.get<LevelInfo>('/api/v1/host/level');
    return res.data;
  }

  // ===========================================================================
  // BADGES (3 endpoints)
  // Replicates: host.ts lines 278-301
  // ===========================================================================

  /**
   * Get all earned badges.
   * GET /api/v1/host/badges
   */
  async getBadges(): Promise<HostBadge[]> {
    this.log('getBadges');
    const res = await this.http.get<HostBadge[]>('/api/v1/host/badges');
    return res.data;
  }

  /**
   * Get all available badge definitions (catalog).
   * GET /api/v1/host/badges/all
   */
  async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    this.log('getAllBadgeDefinitions');
    const res = await this.http.get<BadgeDefinition[]>('/api/v1/host/badges/all');
    return res.data;
  }

  /**
   * Get badge progress (each badge with current / max values).
   * GET /api/v1/host/badges/progress
   */
  async getBadgeProgress(): Promise<BadgeProgressEntry[]> {
    this.log('getBadgeProgress');
    const res = await this.http.get<BadgeProgressEntry[]>('/api/v1/host/badges/progress');
    return res.data;
  }

  // ===========================================================================
  // EARNINGS (3 endpoints)
  // Replicates: host.ts lines 307-341
  // ===========================================================================

  /**
   * Get earnings summary with time-period breakdowns.
   * GET /api/v1/host/earnings
   */
  async getEarnings(): Promise<EarningsSummary> {
    this.log('getEarnings');
    const res = await this.http.get<EarningsSummary>('/api/v1/host/earnings');
    return res.data;
  }

  /**
   * Get earnings history data points (for charts).
   * GET /api/v1/host/earnings/history
   *
   * @param filters - Optional period ('week' | 'month' | 'year'), startDate, endDate.
   */
  async getEarningsHistory(filters?: EarningsHistoryFilters): Promise<EarningsHistoryItem[]> {
    this.log('getEarningsHistory', filters);
    const res = await this.http.get<EarningsHistoryItem[]>(
      '/api/v1/host/earnings/history',
      filters as QueryParams
    );
    return res.data;
  }

  /**
   * Get settlement history (paginated).
   * GET /api/v1/host/settlements
   *
   * @param filters - Optional limit, offset.
   */
  async getSettlements(
    filters?: SettlementFilters
  ): Promise<PaginatedHostResponse<SettlementRecord>> {
    this.log('getSettlements', filters);
    const res = await this.http.get<PaginatedHostResponse<SettlementRecord>>(
      '/api/v1/host/settlements',
      filters as QueryParams
    );
    return res.data;
  }

  // ===========================================================================
  // ROOMS (2 endpoints)
  // Replicates: host.ts lines 347-368
  // ===========================================================================

  /**
   * Get currently active rooms hosted by the user.
   * GET /api/v1/host/rooms/active
   */
  async getActiveRooms(): Promise<ActiveRoom[]> {
    this.log('getActiveRooms');
    const res = await this.http.get<ActiveRoom[]>('/api/v1/host/rooms/active');
    return res.data;
  }

  /**
   * Get room history (completed rooms, paginated).
   * GET /api/v1/host/rooms/history
   *
   * @param filters - Optional limit, offset, category.
   */
  async getRoomHistory(
    filters?: RoomHistoryFilters
  ): Promise<PaginatedHostResponse<RoomHistoryItem>> {
    this.log('getRoomHistory', filters);
    const res = await this.http.get<PaginatedHostResponse<RoomHistoryItem>>(
      '/api/v1/host/rooms/history',
      filters as QueryParams
    );
    return res.data;
  }

  // ===========================================================================
  // NOTIFICATIONS (2 endpoints)
  // Replicates: host.ts lines 374-391
  // ===========================================================================

  /**
   * Get host notification settings.
   * GET /api/v1/host/notifications/settings
   */
  async getNotificationSettings(): Promise<HostNotificationSettings> {
    this.log('getNotificationSettings');
    const res = await this.http.get<HostNotificationSettings>(
      '/api/v1/host/notifications/settings'
    );
    return res.data;
  }

  /**
   * Update host notification settings (partial update).
   * PATCH /api/v1/host/notifications/settings
   *
   * @param settings - Partial notification preferences to update.
   */
  async updateNotificationSettings(
    settings: Partial<HostNotificationSettings>
  ): Promise<HostNotificationSettings> {
    this.log('updateNotificationSettings', settings);
    const res = await this.http.patch<HostNotificationSettings>(
      '/api/v1/host/notifications/settings',
      settings
    );
    return res.data;
  }

  // ===========================================================================
  // LEADERBOARD (2 endpoints)
  // Replicates: host.ts lines 397-422
  // ===========================================================================

  /**
   * Get host leaderboard.
   * GET /api/v1/host/leaderboard
   *
   * @param filters - Optional period, category, limit.
   */
  async getLeaderboard(filters?: HostLeaderboardFilters): Promise<HostLeaderboardEntry[]> {
    this.log('getLeaderboard', filters);
    const res = await this.http.get<HostLeaderboardEntry[]>(
      '/api/v1/host/leaderboard',
      filters as QueryParams
    );
    return res.data;
  }

  /**
   * Get the current user's rank on the host leaderboard.
   * GET /api/v1/host/leaderboard/me
   *
   * @param filters - Optional period, category.
   */
  async getMyRank(
    filters?: Omit<HostLeaderboardFilters, 'limit'>
  ): Promise<MyRankResponse> {
    this.log('getMyRank', filters);
    const res = await this.http.get<MyRankResponse>(
      '/api/v1/host/leaderboard/me',
      filters as QueryParams
    );
    return res.data;
  }

  // ===========================================================================
  // WITHDRAWAL (1 endpoint)
  // Replicates: host.ts lines 428-441
  // ===========================================================================

  /**
   * Request earnings withdrawal to an external wallet.
   * POST /api/v1/host/withdraw
   *
   * @param payload - Amount, currency, and destination wallet address.
   */
  async requestWithdrawal(payload: WithdrawRequest): Promise<WithdrawResponse> {
    this.log('requestWithdrawal', { amount: payload.amount, currency: payload.currency });
    const res = await this.http.post<WithdrawResponse>('/api/v1/host/withdraw', payload);
    return res.data;
  }

  // ===========================================================================
  // AGE VERIFICATION (2 endpoints)
  // Replicates: host.ts lines 446-464
  // ===========================================================================

  /**
   * Submit age verification (18+ self-declaration).
   * POST /api/v1/host/verify-age
   */
  async verifyAge(): Promise<AgeVerificationResponse> {
    this.log('verifyAge');
    const res = await this.http.post<AgeVerificationResponse>('/api/v1/host/verify-age');
    return res.data;
  }

  /**
   * Check if the current user is age-verified.
   * GET /api/v1/host/age-verified
   */
  async checkAgeVerified(): Promise<AgeVerificationStatus> {
    this.log('checkAgeVerified');
    const res = await this.http.get<AgeVerificationStatus>('/api/v1/host/age-verified');
    return res.data;
  }

  // ===========================================================================
  // DEBUG
  // ===========================================================================

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[HostService]', ...args);
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// Replicates: host.ts lines 468-575
// =============================================================================

/**
 * Get tier display info (name, icon, CSS color classes).
 * Replicates: host.ts lines 475-527 (getTierDisplayInfo).
 *
 * @param tier - The host tier.
 * @returns Display info with name, icon emoji, and Tailwind color classes.
 */
export function getTierDisplayInfo(tier: HostTier): TierDisplayInfo {
  const tiers: Record<string, TierDisplayInfo> = {
    BRONZE: {
      name: 'Bronze',
      icon: '[B]',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
    },
    SILVER: {
      name: 'Silver',
      icon: '[S]',
      color: 'text-gray-300',
      bgColor: 'bg-gray-400/20',
      borderColor: 'border-gray-400/30',
    },
    GOLD: {
      name: 'Gold',
      icon: '[G]',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
    },
    PLATINUM: {
      name: 'Platinum',
      icon: '[P]',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
    },
    DIAMOND: {
      name: 'Diamond',
      icon: '[D]',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/30',
    },
    ELITE: {
      name: 'Elite',
      icon: '[E]',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
    },
  };
  return tiers[tier] || tiers.BRONZE;
}

/**
 * Get level display info (title, CSS color, unlocked benefits).
 * 10 levels: Newcomer (1) -> Elite (10).
 * Replicates: host.ts lines 532-549 (getLevelDisplayInfo).
 *
 * @param level - Host level number (1-10).
 * @returns Display info with title, Tailwind color, and benefit descriptions.
 */
export function getLevelDisplayInfo(level: number): LevelDisplayInfo {
  const levels: Record<number, LevelDisplayInfo> = {
    1: { title: 'Newcomer', color: 'text-gray-400', benefits: ['Basic features'] },
    2: { title: 'Beginner', color: 'text-green-400', benefits: ['Room templates'] },
    3: { title: 'Intermediate', color: 'text-blue-400', benefits: ['Custom room names'] },
    4: { title: 'Experienced', color: 'text-purple-400', benefits: ['Room scheduling'] },
    5: { title: 'Advanced', color: 'text-yellow-400', benefits: ['Analytics dashboard'] },
    6: { title: 'Expert', color: 'text-orange-400', benefits: ['Priority support'] },
    7: { title: 'Master', color: 'text-pink-400', benefits: ['Custom themes'] },
    8: { title: 'Grandmaster', color: 'text-cyan-400', benefits: ['API access'] },
    9: { title: 'Legend', color: 'text-red-400', benefits: ['Beta features'] },
    10: { title: 'Elite', color: 'text-amber-400', benefits: ['Direct account manager'] },
  };
  return levels[level] || levels[1];
}

/**
 * Format a numeric amount as USD currency string.
 * Replicates: host.ts lines 555-562 (formatHostEarnings).
 *
 * @param amount - Numeric amount.
 * @returns Formatted string (e.g. "$1,234.56").
 */
export function formatHostEarnings(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate the effective revenue-share percentage with all bonuses applied.
 * Capped at 34% maximum for esports.
 * Replicates: host.ts lines 567-574 (calculateEffectiveShare).
 *
 * @param baseTierShare - Base share percentage from the current tier.
 * @param streakBonus - Bonus from consecutive hosting days.
 * @param volumeBonus - Bonus from monthly room volume.
 * @param permanentBonus - Permanent bonus from badges/achievements.
 * @returns Effective share percentage (max 34%).
 */
export function calculateEffectiveShare(
  baseTierShare: number,
  streakBonus: number,
  volumeBonus: number,
  permanentBonus: number
): number {
  return Math.min(baseTierShare + streakBonus + volumeBonus + permanentBonus, 34);
}