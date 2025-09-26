// Provide sane defaults so tests don’t crash if they rely on currentFlags implicitly.
(globalThis as any).__TEST_FLAGS__ = (globalThis as any).__TEST_FLAGS__ ?? {};
