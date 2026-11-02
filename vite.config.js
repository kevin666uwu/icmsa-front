import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { assertPublicEnvironment } from './src/core/publicEnvironment.js';
export default defineConfig(({ mode }) => {
  assertPublicEnvironment(loadEnv(mode, process.cwd(), 'VITE_'));
  return {
    plugins: [react()],
    test: { environment: 'jsdom', setupFiles: './tests/setup.js', restoreMocks: true },
  };
});
