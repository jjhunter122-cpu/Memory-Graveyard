import { defineConfig } from 'vitest/config';
import { devLevels } from './plugins/devLevels.ts';

export default defineConfig({
  base: './',
  plugins: [devLevels()],
  server: {
    host: true,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
