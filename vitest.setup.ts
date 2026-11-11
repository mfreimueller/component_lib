// jsdom has no Web Animations API; svelte's animate:flip needs it in component tests.
if (typeof Element !== 'undefined') {
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.animate ??= () => ({ cancel() {}, finished: Promise.resolve(), onfinish: null }) as unknown as Animation;
}

// jsdom has no ResizeObserver; bind:clientWidth needs it. Sizes stay 0 in tests.
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
