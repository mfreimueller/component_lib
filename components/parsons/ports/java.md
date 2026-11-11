# parsons in Java / JavaFX

Only what is specific to Java. Read `../PORTING.md` first; this file adds to it.

Reference project: Mars Rover (JavaFX 25, Java 25), a nested-block Parsons editor. Its program model
is a different variant, but the structure below worked well there.

## Structure

```
parsons/
  model/      records + sealed interfaces, no JavaFX (unit-tested without a toolkit)
  core/       Scoring, TemplateParser, Pool, Shuffle, Validator   (static methods, pure)
  view/       JavaFX panes (LinePuzzlePane, TemplatePuzzlePane, review panes)
```

Keep JavaFX out of `model/` and `core/`, like Mars Rover keeps it out of `program/`.

```java
public record Line(String code, int indent) {}
public record PlacedLine(String pieceId, int indent) {}
public record TemplateGap(List<String> expected, boolean anyOrder) {}

public sealed interface Puzzle permits LinePuzzle, TemplatePuzzle {
    String title();
    String description();
}
public record LinePuzzle(String title, String description, List<Line> solution, List<Line> redHerrings) implements Puzzle {}
public record TemplatePuzzle(String title, String description, String template,
                             List<String> redHerrings, List<String> reusable) implements Puzzle {}

public sealed interface Segment permits Text, GapRef {}
public record Text(String text) implements Segment {}
public record GapRef(int gap) implements Segment {}
```

Reading JSON: Jackson or Gson; map a missing `kind` to `"lines"`, a missing `indent` to 0, missing
lists to empty. Run the same validation as `core/validate.ts` (problem paths like
`puzzles.0.solution.2.code`).

## Numbers

```java
static double round2(double x) { return Math.round(x * 100) / 100.0; }      // Math.round = JS Math.round

static <T> List<T> shuffled(List<T> items, long seed) {
    int[] a = { (int) seed };                       // low 32 bits; wrap-around is free on int
    IntSupplier next = () -> {
        a[0] += 0x6D2B79F5;
        int t = a[0];
        t = (t ^ (t >>> 15)) * (t | 1);
        t ^= t + (t ^ (t >>> 7)) * (t | 61);
        return t ^ (t >>> 14);
    };
    List<T> out = new ArrayList<>(items);
    for (int i = out.size() - 1; i > 0; i--) {
        double r = Integer.toUnsignedLong(next.getAsInt()) / 4294967296.0;
        Collections.swap(out, i, (int) Math.floor(r * (i + 1)));
    }
    return out;
}

static long mixSeed(long seed, long salt) {
    int s = (int) seed, p = (int) salt;
    return Integer.toUnsignedLong((s ^ 0x9E3779B9) * 0x85EBCA6B + p * 0xC2B2AE35);
}
```

`int` multiplication in Java is exactly `Math.imul`; `>>>` is the same operator. Check against
`conformance/shuffle.json` and `mix-seed.json`.

## Conformance in JUnit 5

```java
@TestFactory
Stream<DynamicTest> conformance() throws IOException {
    ObjectMapper json = new ObjectMapper();
    try (var files = Files.list(Path.of("conformance"))) {
        return files.filter(f -> f.toString().endsWith(".json")).sorted().toList().stream()
            .flatMap(file -> {
                JsonNode data = read(json, file);
                String fn = data.get("function").asText();
                return StreamSupport.stream(data.get("cases").spliterator(), false)
                    .map(c -> DynamicTest.dynamicTest(file.getFileName() + ": " + c.get("name").asText(),
                        () -> assertEquals(c.get("expected"), json.valueToTree(Dispatch.run(fn, c.get("input"))))));
            });
    }
}
```

`Dispatch.run` maps each `function` to the core call (table in `conformance/README.md`) and throws
for an unknown one. Compare as `JsonNode` so key order does not matter; make sure numbers compare
equal (`100` vs `100.0`: convert whole doubles with `DoubleNode`/`IntNode` consistently, or compare
numerically).

## JavaFX UI

- **Drag and drop** (as in Mars Rover `EditorPane`): `node.setOnDragDetected` →
  `startDragAndDrop(TransferMode.MOVE)`, put a marker string in the `ClipboardContent`, keep the
  dragged piece in a field, and `db.setDragView(node.snapshot(params, null))` with a transparent fill
  for a proper drag image. Targets: `setOnDragOver` → `acceptTransferModes` and show an insertion
  indicator; compute the insertion index from `e.getSceneX()/getSceneY()`; `setOnDragDropped` does
  the move and `setDropCompleted(true)`.
- **Click**: `setOnMouseClicked` moves between pool and solution (or into the selected gap).
  Right-click is free for other uses (Mars Rover deletes a block with it).
- **Keyboard**: make pieces focus traversable; Enter moves, Alt+Left/Right indents or reorders.
  Consume handled `KeyEvent`s so they do not reach scene-level shortcuts.
- **Touch**: JavaFX maps touch to mouse drag events on most platforms; test on the target device.
- **Indentation**: `HBox.setMargin` or left padding of `indent × 24`; indent buttons on placed lines.
- **Styling**: one CSS file with looked-up colours mirroring the `--pz-*` tokens
  (`-pz-primary: #3d5afe;` on `.root`), so themes match the web version.
- **Review**: a `ListView`/`VBox` with right/wrong style classes; never let the review pane score,
  pass it the output of `evaluateLines` / `evaluateTemplate`.
