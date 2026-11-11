import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for Radix UI components in jsdom environment
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver as any;
  (global as any).ResizeObserver = ResizeObserver;
}