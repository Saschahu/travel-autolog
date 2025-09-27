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
