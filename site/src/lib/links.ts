// Where things live on GitHub. The site only links there; agents read the files directly.
export const REPO = 'https://github.com/mfreimueller/component_lib';
export const blob = (path: string) => `${REPO}/blob/main/${path}`;
export const tree = (path: string) => `${REPO}/tree/main/${path}`;
