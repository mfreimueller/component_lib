// Where is a JSON syntax error? JSON.parse messages differ per browser and often have no position,
// so this small checker finds the first offending character itself.

export interface JsonErrorAt {
  /** Index of the first character that is wrong (source.length for an unexpected end). */
  index: number;
  line: number;
  column: number;
}

export function jsonErrorAt(source: string): JsonErrorAt | undefined {
  let i = 0;
  const fail = (): never => {
    throw i;
  };
  const ws = () => {
    while (i < source.length && ' \t\n\r'.includes(source[i]!)) i++;
  };
  const literal = (word: string) => {
    for (const ch of word) if (source[i++] !== ch) (i--, fail());
  };
  const string = () => {
    i++; // opening quote
    for (;;) {
      if (i >= source.length) fail();
      const ch = source[i]!;
      if (ch === '"') return void i++;
      if (ch < ' ') fail();
      if (ch === '\\') {
        i++;
        const e = source[i];
        if (e === 'u') {
          for (let k = 1; k <= 4; k++) if (!/[0-9a-fA-F]/.test(source[i + k] ?? '')) (i += k, fail());
          i += 5;
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) i++;
        else fail();
      } else i++;
    }
  };
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(source.slice(i));
    if (!m || m[0] === '-') fail();
    i += m![0].length;
  };
  const value = (): void => {
    ws();
    const ch = source[i];
    if (ch === '{') {
      i++;
      ws();
      if (source[i] === '}') return void i++;
      for (;;) {
        ws();
        if (source[i] !== '"') fail();
        string();
        ws();
        if (source[i] !== ':') fail();
        i++;
        value();
        ws();
        if (source[i] === ',') i++;
        else if (source[i] === '}') return void i++;
        else fail();
      }
    }
    if (ch === '[') {
      i++;
      ws();
      if (source[i] === ']') return void i++;
      for (;;) {
        value();
        ws();
        if (source[i] === ',') i++;
        else if (source[i] === ']') return void i++;
        else fail();
      }
    }
    if (ch === '"') return string();
    if (ch === 't') return literal('true');
    if (ch === 'f') return literal('false');
    if (ch === 'n') return literal('null');
    if (ch === '-' || (ch !== undefined && ch >= '0' && ch <= '9')) return number();
    fail();
  };
  try {
    value();
    ws();
    if (i < source.length) fail();
    return undefined;
  } catch (at) {
    if (typeof at !== 'number') throw at;
    const index = Math.min(at, source.length);
    const before = source.slice(0, index);
    const line = before.split('\n').length;
    return { index, line, column: index - before.lastIndexOf('\n') };
  }
}
