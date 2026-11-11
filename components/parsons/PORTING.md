# Porting parsons to another platform

For an agent rebuilding this component outside TypeScript/Svelte (Java, C#, Python, Kotlin, …).
Nothing here depends on a language. The TypeScript in `core/` is the reference; when this text and
the code disagree, the code and the conformance cases win, and this file must be fixed.

A port is correct when **every case in `conformance/*.json` passes** (§5).

## 1. Data model

Plain records. Names are suggestions; keep the JSON field names when reading and writing files.

```
Line            { code: string, indent: int 0..6 }
LinePuzzle      { kind: "lines", title, description, solution: Line[], redHerrings: Line[] }
TemplatePuzzle  { kind: "template", title, description, template: string,
                  redHerrings: string[], reusable: string[] }
PuzzleFile      { puzzles: (LinePuzzle | TemplatePuzzle)[] }      // "kind" may be missing = lines

LinePiece       { pieceId: string, code: string, indent?: int }   // what the solver sees
PlacedLine      { pieceId: string, indent: int }                  // arrangement, in placed order
Tile            { pieceId: string, text: string, reusable: bool } // template pool
GapState        map gapIndex(string) -> pieceId[]                 // empty gaps left out

TemplateGap     { expected: string[], anyOrder: bool }            // expected empty = decoy gap
Segment         { text: string } | { gap: int }                   // template lines for display
ParsedTemplate  { lines: Segment[][], gaps: (TemplateGap + index)[], pieces: string[],
                  errors: { line: int (1-based), message }[] }
PoolTile        { text, reusable: bool, herring: bool }
```

Validation and file limits: COMPONENT.md §3.

## 2. Algorithms

All string comparisons are exact (case-sensitive, code-unit equality).

### 2.1 Line scoring

```
lineFlags(solution, placed):            // one bool per placed line
  for i in 0..len(placed)-1:
    want = solution[i] if i < len(solution) else none
    flag[i] = want != none and placed[i].code == want.code and placed[i].indent == want.indent

linePercent(solution, placed):
  if len(solution) == 0: return 0
  return count(true in lineFlags(solution, placed)) / len(solution) * 100     // unrounded
```

### 2.2 Template scoring

```
correctFlags(gap, placed: string[]):    // one bool per placed piece
  flags = all false
  if gap.anyOrder:
    left = multiset(gap.expected)
    for j, text in placed:
      if left[text] > 0: flags[j] = true; left[text] -= 1
    return flags
  E = gap.expected, P = placed
  lcs = (len(E)+1) x (len(P)+1) table of 0
  for i from len(E)-1 down to 0:
    for j from len(P)-1 down to 0:
      lcs[i][j] = E[i] == P[j] ? lcs[i+1][j+1] + 1 : max(lcs[i+1][j], lcs[i][j+1])
  i = 0, j = 0
  while i < len(E) and j < len(P):
    if E[i] == P[j]: flags[j] = true; i += 1; j += 1
    else if lcs[i+1][j] >= lcs[i][j+1]: i += 1        // ">=" matters: earliest match
    else: j += 1
  return flags

templatePercent(gaps, placed: string[][]):            // placed[g] missing = []
  match = 0, denom = 0
  for g, gap in gaps:
    mine = placed[g] or []
    match += count(true in correctFlags(gap, mine))
    denom += max(len(gap.expected), len(mine))
  return denom == 0 ? 0 : match / denom * 100
```

### 2.3 Rounding and averages

```
round2(x) = roundHalfUp(x * 100) / 100    // in IEEE double
roundHalfUp(v) = nearest integer, ties towards +infinity (JavaScript Math.round, Java Math.round);
                 floor(v + 0.5) is the same except for v = 0.49999999999999994-like edge cases
mean(xs)  = len(xs) == 0 ? 0 : sum(xs) / len(xs)
```

Round once, at the end: `round2(mean(unroundedPercents))`. Multiply first, then round, so
`round2(1.005) == 1` (1.005 × 100 is 100.49999…) and `round2(0.135) == 0.14`. See `round.json`.

### 2.4 Seeded shuffle

All arithmetic is on **unsigned 32-bit** values with wrap-around. `imul(a, b)` = low 32 bits of
a × b. `>>>` = logical right shift of the 32-bit pattern.

```
shuffled(items, seed):
  a = seed mod 2^32                        // negative seeds wrap: -1 -> 4294967295
  rnd():
    a = (a + 0x6D2B79F5) mod 2^32
    t = a
    t = imul(t XOR (t >>> 15), t OR 1)
    t = t XOR ((t + imul(t XOR (t >>> 7), t OR 61)) mod 2^32)
    return ((t XOR (t >>> 14)) as unsigned) / 4294967296        // double in [0, 1)
  out = copy of items
  for i from len(out)-1 down to 1:
    j = floor(rnd() * (i + 1))
    swap out[i], out[j]
  return out

mixSeed(seed, salt) = (imul(seed XOR 0x9E3779B9, 0x85EBCA6B) + imul(salt, 0xC2B2AE35)) mod 2^32
```

### 2.5 Template parser

```
normalisePiece(s) = trim(s), then every run of whitespace -> one space

parseTemplate(source):
  errors = [], lines = [], gaps = [], pieces = []
  if len(source) > 6000: error(line 1, too long)
  rawLines = split source on "\n" or "\r\n"
  if len(rawLines) > 80: error(line 81, too many lines)
  for n, raw in rawLines:                        // lineNo = n + 1
    line = trimEnd(raw)                          // all trailing whitespace
    in the leading run of spaces/tabs only: each tab -> 4 spaces
    items = tokenise(line)
    if tokenise failed: error(lineNo, "marker never closed"); lines.add([]); continue
    segments = [], run = none
    for item in items:
      if item is marker: run = run ? run + [item] : [item]
      else if run and item.fixed consists only of spaces/tabs: skip   // blanks inside a gap run
      else: closeRun(); segments.add({ text: item.fixed })
    closeRun()                                   // closeRun: if run, segments.add({gap: addGap(run, lineNo)}); run = none
    lines.add(segments)
  if len(gaps) > 30: error(line of the gap with index 30, too many gaps)

tokenise(line):                                  // -> items or failure
  items = [], fixed = "", i = 0
  while i < len(line):
    if line[i..] starts with "\{{": fixed += "{{"; i += 3
    else if line[i..] starts with "{{":
      raw = "", j = i + 2
      loop:
        if j >= len(line): return failure
        if line[j..] starts with "\}}": raw += "\}}"; j += 3
        else if line[j..] starts with "}}": break
        else: raw += line[j]; j += 1
      if fixed != "": items.add({ fixed }); fixed = ""
      items.add(toMarker(raw)); i = j + 2
    else: fixed += line[i]; i += 1
  if fixed != "": items.add({ fixed })

toMarker(raw):
  t = trim(raw)
  anyOrder = t starts with "~"
  body = trim(anyOrder ? t without first char : t)
  body = (body starts with "\~" ? "~" + body[2..] : body), then replace every "\}}" with "}}"
  return { text: normalisePiece(body), anyOrder, empty: raw == "" }   // exactly "{{}}"; "{{ }}" is an error

addGap(run, lineNo):
  index = len(gaps)
  empty = any marker in run is empty
  if empty and len(run) > 1: error(lineNo, empty gap must stand alone)
  if any marker after the first has anyOrder: error(lineNo, only the first marker may have ~)
  expected = []
  for m in run, skipping empty markers:
    if m.text == "": error(lineNo, m.anyOrder ? "{{~}} is invalid" : "marker needs text")
    else if len(m.text) > 200: error(lineNo, piece too long)
    else expected.add(m.text)
  pieces.addAll(expected)
  if len(pieces) > 60 and len(pieces) - len(expected) <= 60: error(lineNo, too many pieces)   // once
  gaps.add({ index, expected, anyOrder: run[0].anyOrder and not empty })
  return index
```

### 2.6 Pool

```
buildPool(parsed, redHerrings, reusable):
  herrings = map normalisePiece over redHerrings
  if len(herrings) > 15: error
  for h in herrings: if h == "": error   else if len(h) > 200: error
  known = set(parsed.pieces) + set(herrings)
  for r in set(map normalisePiece over reusable): if r not in known: error
  tiles = [], seen = set()
  add(text, herring):
    isReusable = text in reusableSet
    if isReusable and text in seen: return
    seen.add(text); tiles.add({ text, reusable: isReusable, herring })
  for text in parsed.pieces: add(text, false)               // reading order
  for text in herrings where text != "": add(text, true)
```

Then shuffle the tiles and give them ids that do not reveal the order (`t0`, `t1`, … after
shuffling, or random ids on a server).

### 2.7 Evaluation (review data)

```
evaluateLines(solution, lineOf: id -> Line, placed: PlacedLine[]):
  lines = [ { code: lineOf[p.pieceId].code, indent: p.indent } for p in placed if p.pieceId in lineOf ]
  return { percent: linePercent(solution, lines),
           submission: lines with correct = lineFlags(solution, lines)[i] }

evaluateTemplate(template, textOf: id -> text, gaps: GapState):
  parsed = parseTemplate(template)
  placed[g] = [ textOf[id] for id in gaps[str(g)] if id in textOf ]
  each line segment: text stays; a gap becomes
    { gap, expected, anyOrder, submitted: [{ text, correct: correctFlags(gap, placed[g])[k] }] }
  percent = templatePercent(parsed.gaps, placed)
```

## 3. Number traps

| Language | 32-bit unsigned | imul | `>>>` | round2 |
|---|---|---|---|---|
| Java | `int` arithmetic wraps; convert at the end with `Integer.toUnsignedLong(t)` | `a * b` on `int` | `>>>` | `Math.round(x * 100) / 100.0` (avoid `BigDecimal` with `HALF_EVEN`) |
| C# | `uint` with `unchecked` | `unchecked(a * b)` on `uint` | `>>` on `uint` | `Math.Floor(x * 100 + 0.5) / 100` (`Math.Round` defaults to banker's rounding) |
| Python | mask with `& 0xFFFFFFFF` after every `+` and `*` | `(a * b) & 0xFFFFFFFF` | `>>` on the masked value | `math.floor(x * 100 + 0.5) / 100` (`round()` is banker's) |
| Kotlin | `Int` wraps; `toUInt()` at the end | `a * b` | `ushr` | as Java |

`seed mod 2^32` for negative seeds: Java `Integer.toUnsignedLong((int) seed)`, Python `seed & 0xFFFFFFFF`.

## 4. Interaction contract (every UI)

1. **Two areas** per line puzzle (pool, solution) or a code view with gaps plus a pool (template).
2. **Three ways to move a piece**: drag and drop (mouse and touch), tap/click (pool → end of the
   solution or into the *selected* gap; placed → back to the pool), keyboard (focusable pieces;
   Enter moves between areas; a key to pick up and arrow keys to move; Alt+←/→ indents a placed line
   or reorders a piece inside its gap).
3. **Indentation controls** on placed lines when the solver sets indentation (0–6), and the indent
   is shown as visual offset.
4. **Reusable pieces** stay in the pool; every placed copy is its own item with its own id.
5. **Every visible piece has a unique id**, even when texts repeat (two `)` pieces).
6. **Drag placeholders never count**: whatever the drag toolkit inserts while dragging is not part
   of the arrangement; save and score only after the drop.
7. **Report the arrangement** after every change (`PlacedLine[]` or `GapState`); the UI never scores.
8. **Disabled state**: nothing moves (used after Check, or when time is up).
9. **Accessible names**: each piece announces its text and, when placed, its position.
10. **Review**: placed items marked right/wrong; optionally the solution, red herrings, and for wrong
    gaps what was expected.
11. **Works when scaled** (presentation tools, zoom): hit-test at the pointer, not at a drag image.

## 5. Conformance

Format: `conformance/README.md`. Each file names a `function` and holds `cases` with `input` and
`expected`. Write one runner in the port's test framework:

```
for file in conformance/*.json:
  data = parse(file)
  for case in data.cases:
    actual = dispatch(data.function, case.input)        // the mapping is in the README table
    assert deepEqual(actual, case.expected), file + ": " + case.name
```

Rules: object key order does not matter, array order does; `percentRounded` values are compared after
`round2`; error messages are never compared (only line numbers or counts), so messages may be
translated. Fail on an unknown `function`, so new case files are not silently skipped.

## 6. Platform notes

- Java / JavaFX: `ports/java.md`.
