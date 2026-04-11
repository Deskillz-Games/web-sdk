// =============================================================================
// Deskillz Vite Plugin: Service Worker Version Stamper
// Path: src/plugins/vite-plugin-sw-version.mjs
//
// Replaces __BUILD_HASH__ in public/deskillz-sw.js with a unique
// timestamp+hash during `npm run build`. Guarantees every build produces
// a new service worker file, forcing browsers to detect the update and
// purge old caches.
//
// Named deskillz-sw.js (NOT sw.js) to prevent Cloud Build Docker worker
// from overwriting it with Workbox generateSW.
//
// WHY .mjs INSTEAD OF .ts:
// Vite uses esbuild to transpile .ts plugins at load time and caches the
// compiled output internally. When the .ts source is updated, Vite often
// loads the stale cached version -- causing closeBundle to run old code.
// Using .mjs bypasses esbuild entirely: Node loads it natively as an ES
// module with zero compilation, zero cache, zero stale code.
//
// Usage in vite.config.ts:
//
//   import { swVersionPlugin } from './src/plugins/vite-plugin-sw-version.mjs';
//
//   export default defineConfig({
//     base: './',
//     plugins: [react(), swVersionPlugin()],
//     ...
//   });
//
// That's it. No manual version bumping. No PowerShell workaround. Ever.
// =============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function swVersionPlugin() {
  let resolvedRoot = process.cwd();
  let resolvedOutDir = 'dist';

  return {
    name: 'deskillz-sw-version',
    apply: 'build',

    configResolved(config) {
      resolvedRoot = config.root || process.cwd();
      resolvedOutDir = config.build?.outDir || 'dist';
    },

    closeBundle() {
      const swPath = path.resolve(resolvedRoot, resolvedOutDir, 'deskillz-sw.js');

      if (!fs.existsSync(swPath)) {
        console.warn('[sw-version] No deskillz-sw.js found in output -- skipping stamp.');
        return;
      }

      const timestamp = Date.now().toString(36);
      const random = crypto.randomBytes(4).toString('hex');
      const buildHash = timestamp + '-' + random;

      let content = fs.readFileSync(swPath, 'utf-8');

      if (!content.includes('__BUILD_HASH__')) {
        console.warn('[sw-version] deskillz-sw.js has no __BUILD_HASH__ placeholder -- skipping.');
        return;
      }

      content = content.replace(/__BUILD_HASH__/g, buildHash);
      fs.writeFileSync(swPath, content, 'utf-8');

      console.log('[sw-version] Stamped deskillz-sw.js with build hash: ' + buildHash);
    },
  };
}
