// Builds catalog.json and llms.txt from components/*/component.json.
//   node scripts/build-catalog.ts          write both files
//   node scripts/build-catalog.ts --check  fail if they are out of date (CI)

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const REPO = 'mfreimueller/component_lib';
const SITE = 'https://mfreimueller.github.io/component_lib/';
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
const root = new URL('../', import.meta.url);

interface Manifest {
  name: string;
  version: string;
  title: string;
  summary: string;
  status: string;
  tags: string[];
  variants: { id: string; summary: string }[];
  docs: { contract: string; porting?: string; changelog?: string };
  embed?: { tag: string; url: string };
  skills?: string[];
}

export function loadManifests(): Manifest[] {
  const dir = new URL('components/', root);
  return readdirSync(dir)
    .filter((name) => existsSync(new URL(`${name}/component.json`, dir)))
    .sort()
    .map((name) => {
      const m = JSON.parse(readFileSync(new URL(`${name}/component.json`, dir), 'utf8')) as Manifest;
      if (m.name !== name) throw new Error(`components/${name}/component.json: name is "${m.name}"`);
      return m;
    });
}

export function buildCatalog(manifests: Manifest[]): string {
  const path = (m: Manifest, file: string) => `components/${m.name}/${file}`;
  const catalog = {
    repo: `https://github.com/${REPO}`,
    site: SITE,
    howToUse: 'Read AGENTS.md, then the component contract (COMPONENT.md). Copy files into the project; do not install a package.',
    components: manifests.map((m) => ({
      name: m.name,
      version: m.version,
      title: m.title,
      summary: m.summary,
      status: m.status,
      tags: m.tags,
      variants: m.variants,
      path: `components/${m.name}/`,
      contract: path(m, m.docs.contract),
      contractUrl: RAW + path(m, m.docs.contract),
      porting: m.docs.porting ? path(m, m.docs.porting) : undefined,
      embed: m.embed,
      skills: (m.skills ?? []).map((s) => path(m, s)),
      page: `${SITE}components/${m.name}/`,
    })),
  };
  return JSON.stringify(catalog, null, 2) + '\n';
}

export function buildLlmsTxt(manifests: Manifest[]): string {
  const lines = [
    '# component_lib',
    '',
    '> Reusable components to copy into projects (not a package). Each has a contract for agents',
    '> (COMPONENT.md: when to use, data format, rules, install, API, pitfalls), tested TypeScript core,',
    '> Svelte 5 UI, language-neutral conformance cases and a porting guide.',
    '',
    `Start with [AGENTS.md](${RAW}AGENTS.md). Machine-readable index: [catalog.json](${RAW}catalog.json).`,
    '',
    '## Components',
    '',
  ];
  for (const m of manifests) {
    lines.push(`- [${m.title} (${m.name}@${m.version})](${RAW}components/${m.name}/${m.docs.contract}): ${m.summary}`);
    if (m.docs.porting) lines.push(`  - [Porting guide](${RAW}components/${m.name}/${m.docs.porting})`);
    if (m.embed) lines.push(`  - Embed without a build: \`<script type="module" src="${m.embed.url}"></script>\`, tag \`<${m.embed.tag}>\``);
  }
  lines.push('', '## Optional', '', `- [Human showcase](${SITE})`, `- [Spec of this repo](${RAW}SPEC.md)`, '');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifests = loadManifests();
  const files = { 'catalog.json': buildCatalog(manifests), 'llms.txt': buildLlmsTxt(manifests) };
  const check = process.argv.includes('--check');
  let stale = false;
  for (const [name, content] of Object.entries(files)) {
    const url = new URL(name, root);
    const current = existsSync(url) ? readFileSync(url, 'utf8') : '';
    if (current === content) continue;
    if (check) {
      console.error(`${name} is out of date: run npm run catalog`);
      stale = true;
    } else {
      writeFileSync(url, content);
      console.log(`wrote ${name}`);
    }
  }
  if (stale) process.exit(1);
}
