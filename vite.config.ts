import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup-tests.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    deps: {
      inline: [/^@tiptap\//],
    },
  },
});
