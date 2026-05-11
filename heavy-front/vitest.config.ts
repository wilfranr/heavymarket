import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@core': resolve(__dirname, 'src/app/core'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    environmentMatchGlobs: [['**/*.spec.ts', 'jsdom']],
    setupFiles: ['src/test-setup.ts'],
  },
  optimizeDeps: {
    include: ['@angular/core', '@angular/common', '@angular/platform-browser', '@angular/forms', '@angular/router'],
  },
});