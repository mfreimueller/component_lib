// Shared by svelte-check and vitest. Only the embed wrappers are custom elements here; the embed
// build (components/*/embed/vite.config.ts) compiles everything in custom element mode.
export default {
  compilerOptions: {
    customElement: ({ filename }) => filename.includes('/embed/'),
  },
};
