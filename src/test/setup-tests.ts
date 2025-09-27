// src/test/setup-tests.ts
import { vi } from 'vitest';

// Deterministische Timer für async/Timeout-Tests
vi.useFakeTimers();

// Häufig fehlende Browser-APIs stubben
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error: Test-Env shim
globalThis.ResizeObserver = ResizeObserver as any;

// DOMPurify neutral mock (Tests sollen nicht an Sanitizer scheitern)
vi.mock('dompurify', () => {
  return {
    default: {
      sanitize: (html: string) => html,
    },
  };
});

// Minimaler Tiptap-Mock, damit UI/Renderer nicht crashen
vi.mock('@tiptap/react', () => {
  return {
    useEditor: () => ({
      commands: { setContent: () => {}, focus: () => {} },
      chain: () => ({ focus: () => ({ run: () => {} }) }),
      getHTML: () => '<p></p>',
      destroy: () => {},
    }),
    EditorContent: () => null,
  };
});

/**
 * Make Trusted Types re-definable in tests.
 * jsdom hard-freezes window.trustedTypes, so we keep it configurable to avoid
 * brittle errors when suites stub or polyfill Trusted Types in setup.
 */
try {
  Object.defineProperty(window as any, 'trustedTypes', {
    value: undefined,
    writable: true,
    configurable: true,
  });
} catch {
  /* ignore */
}

/** Mapbox CSS side-effect (Vitest needs a default export object) */
vi.mock(
  'mapbox-gl/dist/mapbox-gl.css',
  () => ({ default: {} }),
  { virtual: true }
);

/**
 * Capacitor Core: mock both named + default exports.
 * Avoid re-mocking @capacitor/core inside individual tests—Vitest hoists the
 * first mock declaration and later attempts cause confusing double-register
 * failures.
 */
vi.mock('@capacitor/core', () => {
  const registerPlugin = vi.fn(() => ({}));
  const Capacitor = { getPlatform: () => 'web' };
  return {
    registerPlugin,
    Capacitor,
    default: { registerPlugin, Capacitor },
  };
});
