// =============================================================================
// Deskillz Vite Plugin: Service Worker Version Stamper
// Path: src/plugins/vite-plugin-sw-version.ts
//
// Replaces __BUILD_HASH__ in public/sw.js with a unique timestamp+hash
// during `npm run build`. Guarantees every build produces a new service
// worker file, forcing browsers to detect the update and purge old caches.
//
// Usage in vite.config.ts:
//
//   import { swVersionPlugin } from './src/plugins/vite-plugin-sw-version';
//
//   export default defineConfig({
//     base: './',
//     plugins: [react(), swVersionPlugin()],
//     ...
//   });
//
// That's it. No manual version bumping. Ever.
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function swVersionPlugin() {
  let resolvedRoot = process.cwd();
  let resolvedOutDir = 'dist';

  return {
    name: 'deskillz-sw-version',
    apply: 'build' as const,

    configResolved(config: any) {
      resolvedRoot = config.root || process.cwd();
      resolvedOutDir = config.build?.outDir || 'dist';
    },

    closeBundle() {
      const swPath = path.resolve(resolvedRoot, resolvedOutDir, 'sw.js');

      if (!fs.existsSync(swPath)) {
        console.warn('[sw-version] No sw.js found in output -- skipping stamp.');
        return;
      }

      // Generate a unique hash: timestamp + 8 random hex chars
      const timestamp = Date.now().toString(36);
      const random = crypto.randomBytes(4).toString('hex');
      const buildHash = `${timestamp}-${random}`;

      let content = fs.readFileSync(swPath, 'utf-8');

      if (!content.includes('__BUILD_HASH__')) {
        console.warn('[sw-version] sw.js has no __BUILD_HASH__ placeholder -- skipping.');
        return;
      }

      content = content.replace(/__BUILD_HASH__/g, buildHash);
      fs.writeFileSync(swPath, content, 'utf-8');

      console.log(`[sw-version] Stamped sw.js with build hash: ${buildHash}`);
    },
  };
}