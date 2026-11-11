// Turns theme.css (the single source of the token values) into rules for the custom element's
// `theme` attribute: :host([theme='light']) and :host([theme='dark']).

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`theme.css: no block for ${selector}`);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open)).trim();
}

export function hostThemeCss(themeCss: string): string {
  const light = block(themeCss, ':where(:root)');
  const dark = block(themeCss, ":where(:root[data-theme='dark'])");
  return `:host([theme='light']) {\n${light}\n}\n:host([theme='dark']) {\n${light}\n${dark}\n}\n`;
}
