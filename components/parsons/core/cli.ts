// Validates a puzzle file from the command line (Node 22.18+, no build):
//   node <path>/core/cli.ts <file.json>
// Exit code 0: valid (warnings may be printed). 1: invalid. 2: usage error.

import { readFileSync } from 'node:fs';
import { validatePuzzleFile } from './validate.ts';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node cli.ts <file.json>');
  process.exit(2);
}

let data: unknown;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`Not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

const result = validatePuzzleFile(data);
for (const w of result.warnings) console.warn(`warning: ${w.path}: ${w.message}`);
if (!result.ok) {
  for (const p of result.problems) console.error(`${p.path}: ${p.message}`);
  process.exit(1);
}
const puzzles = result.file!.puzzles;
const templates = puzzles.filter((p) => p.kind === 'template').length;
console.log(`OK: ${puzzles.length} puzzle(s) (${puzzles.length - templates} lines, ${templates} template)`);
