// jsdom has no Web Animations API; svelte's animate:flip needs it in component tests.
if (typeof Element !== 'undefined') {
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.animate ??= () => ({ cancel() {}, finished: Promise.resolve(), onfinish: null }) as unknown as Animation;
}
