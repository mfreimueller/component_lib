/// <reference types="vite/client" />
// Entry of the embed build (npm run build:embed): registers <parsons-puzzle>.

import themeCss from '../svelte/theme.css?raw';
import ParsonsPuzzle from './ParsonsPuzzle.svelte';

// Token defaults for the whole page, once. They use :where(), so any page rule overrides them.
if (!document.getElementById('parsons-theme')) {
  const style = document.createElement('style');
  style.id = 'parsons-theme';
  style.textContent = themeCss;
  document.head.prepend(style);
}

export default ParsonsPuzzle;
