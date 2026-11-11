#!/usr/bin/env node
// GENERATED from components/parsons/core (npm run build:skill). Do not edit.
import { readFileSync } from "node:fs";
// components/parsons/core/template.ts
var LIMITS = {
	chars: 6e3,
	lines: 80,
	gaps: 30,
	pieces: 60,
	pieceChars: 200,
	herrings: 15
};
/** Whitespace runs inside a piece count as one space. */
var normalisePiece = (s) => s.trim().replace(/\s+/g, " ");
function tokenise(line) {
	const items = [];
	let fixed = "";
	let i = 0;
	while (i < line.length) if (line.startsWith("\\{{", i)) {
		fixed += "{{";
		i += 3;
	} else if (line.startsWith("{{", i)) {
		let raw = "";
		let j = i + 2;
		for (;;) {
			if (j >= line.length) return "Marker “{{” is never closed with “}}”.";
			if (line.startsWith("\\}}", j)) {
				raw += "\\}}";
				j += 3;
			} else if (line.startsWith("}}", j)) break;
			else raw += line[j++];
		}
		if (fixed) items.push({ fixed });
		fixed = "";
		items.push({ marker: toMarker(raw) });
		i = j + 2;
	} else fixed += line[i++];
	if (fixed) items.push({ fixed });
	return items;
}
function toMarker(raw) {
	const trimmed = raw.trim();
	const anyOrder = trimmed.startsWith("~");
	return {
		text: normalisePiece((anyOrder ? trimmed.slice(1) : trimmed).trim().replace(/^\\~/, "~").replace(/\\\}\}/g, "}}")),
		anyOrder,
		empty: raw === ""
	};
}
function parseTemplate(source) {
	const errors = [];
	const out = {
		lines: [],
		gaps: [],
		pieces: [],
		errors
	};
	if (source.length > LIMITS.chars) errors.push({
		line: 1,
		message: `The template is longer than ${LIMITS.chars} characters.`
	});
	const rawLines = source.split(/\r?\n/);
	if (rawLines.length > LIMITS.lines) errors.push({
		line: LIMITS.lines + 1,
		message: `The template has more than ${LIMITS.lines} lines.`
	});
	for (const [n, rawLine] of rawLines.entries()) {
		const lineNo = n + 1;
		const items = tokenise(rawLine.trimEnd().replace(/^[ \t]+/, (ws) => ws.replace(/\t/g, "    ")));
		if (typeof items === "string") {
			errors.push({
				line: lineNo,
				message: items
			});
			out.lines.push([]);
			continue;
		}
		const segments = [];
		let run = null;
		const closeRun = () => {
			if (run) segments.push({ gap: addGap(run, lineNo, out) });
			run = null;
		};
		for (const item of items) if ("marker" in item) {
			if (run) run.push(item.marker);
			else run = [item.marker];
		} else if (run && /^[ \t]+$/.test(item.fixed)) {} else {
			closeRun();
			segments.push({ text: item.fixed });
		}
		closeRun();
		out.lines.push(segments);
	}
	if (out.gaps.length > LIMITS.gaps) errors.push({
		line: out.lines.findIndex((l) => l.some((s) => "gap" in s && s.gap === LIMITS.gaps)) + 1,
		message: `The template has more than ${LIMITS.gaps} gaps.`
	});
	return out;
}
function addGap(run, line, out) {
	const fail = (message) => out.errors.push({
		line,
		message
	});
	const index = out.gaps.length;
	const empty = run.some((m) => m.empty);
	if (empty && run.length > 1) fail("An empty gap “{{}}” must stand alone, not next to other markers.");
	if (run.slice(1).some((m) => m.anyOrder)) fail("Only the first marker of a gap may start with “~”.");
	const expected = [];
	for (const m of run) {
		if (m.empty) continue;
		if (!m.text) fail(m.anyOrder ? "“{{~}}” is not valid: a piece needs text." : "A marker must contain text (or be exactly “{{}}”).");
		else if (m.text.length > LIMITS.pieceChars) fail(`A piece is longer than ${LIMITS.pieceChars} characters.`);
		else expected.push(m.text);
	}
	out.pieces.push(...expected);
	if (out.pieces.length > LIMITS.pieces && out.pieces.length - expected.length <= LIMITS.pieces) fail(`The template has more than ${LIMITS.pieces} pieces.`);
	out.gaps.push({
		index,
		expected,
		anyOrder: run[0].anyOrder && !empty
	});
	return index;
}
/**
* The pool tiles for a puzzle: one tile per reusable text, one per occurrence of any other text,
* then the red herrings. Also checks the red herring and reusable lists.
*/
function buildPool(parsed, redHerrings, reusable) {
	const errors = [];
	const herrings = redHerrings.map(normalisePiece);
	if (herrings.length > LIMITS.herrings) errors.push(`At most ${LIMITS.herrings} red herrings are allowed.`);
	for (const h of herrings) if (!h) errors.push("A red herring must not be empty.");
	else if (h.length > LIMITS.pieceChars) errors.push(`A red herring is longer than ${LIMITS.pieceChars} characters.`);
	const known = /* @__PURE__ */ new Set([...parsed.pieces, ...herrings]);
	const reusableSet = new Set(reusable.map(normalisePiece));
	for (const r of reusableSet) if (!known.has(r)) errors.push(`Reusable “${r}” occurs neither in the solution nor in the red herrings.`);
	const tiles = [];
	const seenReusable = /* @__PURE__ */ new Set();
	const add = (text, herring) => {
		const isReusable = reusableSet.has(text);
		if (isReusable && seenReusable.has(text)) return;
		seenReusable.add(text);
		tiles.push({
			text,
			reusable: isReusable,
			herring
		});
	};
	for (const text of parsed.pieces) add(text, false);
	for (const text of herrings.filter(Boolean)) add(text, true);
	return {
		tiles,
		errors
	};
}
// components/parsons/core/validate.ts
var FILE_LIMITS = {
	puzzles: 50,
	title: 120,
	description: 2e3,
	solutionLines: 30,
	minSolutionLines: 2,
	herringLines: 10,
	lineChars: 200,
	maxIndent: 6
};
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function validatePuzzleFile(data) {
	const problems = [];
	const warnings = [];
	const bad = (path, message) => problems.push({
		path,
		message
	});
	const warn = (path, message) => warnings.push({
		path,
		message
	});
	const out = [];
	function checkLines(path, value, max) {
		if (!Array.isArray(value)) {
			bad(path, "must be an array of lines");
			return [];
		}
		if (value.length > max) bad(path, `at most ${max} lines`);
		const lines = [];
		value.forEach((line, i) => {
			const at = `${path}.${i}`;
			if (!isObject(line)) return bad(at, "must be an object {code, indent}");
			if ("id" in line) bad(`${at}.id`, "remove it, ids are generated");
			const { code, indent = 0 } = line;
			if (typeof code !== "string") return bad(`${at}.code`, "must be a string");
			const trimmed = code.trimEnd();
			if (trimmed.length === 0) bad(`${at}.code`, "must not be empty");
			if (trimmed.length > FILE_LIMITS.lineChars) bad(`${at}.code`, `at most ${FILE_LIMITS.lineChars} characters`);
			if (/[\r\n]/.test(trimmed)) bad(`${at}.code`, "must be a single line");
			if (trimmed !== trimmed.trimStart()) bad(`${at}.code`, "no leading spaces or tabs, use indent");
			if (!Number.isInteger(indent) || indent < 0 || indent > FILE_LIMITS.maxIndent) bad(`${at}.indent`, `must be an integer 0 to ${FILE_LIMITS.maxIndent}`);
			lines.push({
				code: trimmed,
				indent
			});
		});
		return lines;
	}
	function stringList(path, value) {
		if (value === void 0) return [];
		if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) {
			bad(path, "must be an array of strings");
			return [];
		}
		return value;
	}
	function checkLinePuzzle(at, p, head) {
		const solution = checkLines(`${at}.solution`, p.solution, FILE_LIMITS.solutionLines);
		if (Array.isArray(p.solution) && p.solution.length < FILE_LIMITS.minSolutionLines) bad(`${at}.solution`, `needs at least ${FILE_LIMITS.minSolutionLines} lines`);
		const redHerrings = p.redHerrings === void 0 ? [] : checkLines(`${at}.redHerrings`, p.redHerrings, FILE_LIMITS.herringLines);
		const codes = new Set(solution.map((l) => l.code));
		redHerrings.forEach((l, j) => {
			if (codes.has(l.code)) bad(`${at}.redHerrings.${j}`, "same code as a solution line, so it is not a red herring");
		});
		return {
			kind: "lines",
			...head,
			solution,
			redHerrings
		};
	}
	function checkTemplatePuzzle(at, p, head) {
		const redHerrings = stringList(`${at}.redHerrings`, p.redHerrings);
		const reusable = stringList(`${at}.reusable`, p.reusable);
		if (typeof p.template !== "string") {
			bad(`${at}.template`, "must be a string");
			return;
		}
		const parsed = parseTemplate(p.template);
		for (const e of parsed.errors) bad(`${at}.template`, `line ${e.line}: ${e.message}`);
		for (const m of buildPool(parsed, redHerrings, reusable).errors) bad(`${at}.redHerrings`, m);
		if (parsed.errors.length === 0 && parsed.pieces.length === 0) warn(`${at}.template`, "no pieces, there is nothing to place");
		for (const h of new Set(redHerrings.map(normalisePiece))) if (parsed.pieces.includes(h)) warn(`${at}.redHerrings`, `"${h}" is also a solution piece; it is only a decoy if it cannot be used validly`);
		return {
			kind: "template",
			...head,
			template: p.template,
			redHerrings,
			reusable
		};
	}
	const puzzles = isObject(data) ? data.puzzles : void 0;
	if (!Array.isArray(puzzles)) bad("puzzles", "the top level must be {\"puzzles\": [...]}");
	else {
		if (puzzles.length < 1 || puzzles.length > FILE_LIMITS.puzzles) bad("puzzles", `must contain 1 to ${FILE_LIMITS.puzzles} puzzles`);
		puzzles.forEach((p, i) => {
			const at = `puzzles.${i}`;
			if (!isObject(p)) return bad(at, "must be an object");
			const kind = p.kind ?? "lines";
			if (kind !== "lines" && kind !== "template") return bad(`${at}.kind`, "must be \"lines\" or \"template\" (or left out for lines)");
			const title = typeof p.title === "string" ? p.title.trim() : "";
			if (!title || title.length > FILE_LIMITS.title) bad(`${at}.title`, `required, at most ${FILE_LIMITS.title} characters`);
			let description = "";
			if (p.description !== void 0) {
				if (typeof p.description !== "string" || p.description.trim().length > FILE_LIMITS.description) bad(`${at}.description`, `must be a string of at most ${FILE_LIMITS.description} characters`);
				else description = p.description.trim();
			}
			const head = {
				title,
				description
			};
			const puzzle = kind === "template" ? checkTemplatePuzzle(at, p, head) : checkLinePuzzle(at, p, head);
			if (puzzle) out.push(puzzle);
		});
	}
	const ok = problems.length === 0;
	return ok ? {
		ok,
		problems,
		warnings,
		file: { puzzles: out }
	} : {
		ok,
		problems,
		warnings
	};
}
// components/parsons/core/cli.ts
var file = process.argv[2];
if (!file) {
	console.error("Usage: node cli.ts <file.json>");
	process.exit(2);
}
var data;
try {
	data = JSON.parse(readFileSync(file, "utf8"));
} catch (err) {
	console.error(`Not valid JSON: ${err.message}`);
	process.exit(1);
}
var result = validatePuzzleFile(data);
for (const w of result.warnings) console.warn(`warning: ${w.path}: ${w.message}`);
if (!result.ok) {
	for (const p of result.problems) console.error(`${p.path}: ${p.message}`);
	process.exit(1);
}
var puzzles = result.file.puzzles;
var templates = puzzles.filter((p) => p.kind === "template").length;
console.log(`OK: ${puzzles.length} puzzle(s) (${puzzles.length - templates} lines, ${templates} template)`);
export {};
