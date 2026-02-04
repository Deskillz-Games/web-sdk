// =============================================================================
// Deskillz Web SDK - Vite Build Configuration
// Builds: ESM modules, CJS modules, minified UMD bundle
// =============================================================================

import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// Determine output format from mode
const getOutputConfig = (mode: string) => {
  switch (mode) {
    case 'cjs':
      return {
        dir: 'dist/cjs',
        format: 'cjs' as const,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named' as const,
      };
    case 'bundle':
      return {
        dir: 'dist',
        format: 'umd' as const,
        name: 'DeskillzSDK',
        entryFileNames: 'deskillz-sdk.min.js',
        globals: {
          'socket.io-client': 'io',
        },
      };
    case 'esm':
    default:
      return {
        dir: 'dist/esm',
        format: 'es' as const,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      };
  }
};

export default defineConfig(({ mode }) => {
  const outputConfig = getOutputConfig(mode);
  const isBundle = mode === 'bundle';

  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'DeskillzSDK',
        formats: [outputConfig.format],
      },
      outDir: outputConfig.dir,
      emptyOutDir: true,
      sourcemap: true,
      minify: isBundle ? 'terser' : false,
      target: 'es2020',
      rollupOptions: {
        external: isBundle
          ? ['socket.io-client']
          : [
              'socket.io-client',
              // Don't bundle Node.js built-ins (for CJS compatibility)
              /^node:/,
            ],
        output: {
          ...outputConfig,
          // Ensure consistent chunk naming
          chunkFileNames: '[name].js',
          assetFileNames: '[name][extname]',
        },
        // Preserve module structure for tree-shaking
        preserveEntrySignatures: 'strict',
      },
    },
    plugins: [
      // Generate TypeScript declarations (only for ESM build)
      ...(mode === 'esm'
        ? [
            dts({
              outDir: 'dist/types',
              include: ['src/**/*'],
              exclude: ['**/*.test.ts', '**/*.spec.ts'],
              rollupTypes: false,
              copyDtsFiles: true,
              insertTypesEntry: true,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // Ensure we're building for browser + modern Node
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'bundle' ? 'production' : 'development'),
    },
  };
});