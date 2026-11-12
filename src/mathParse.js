// Lightweight, dependency-free formatter for the plain-text math the AI produces.
// Turns "V_out = (R_2)/(R_1 + R_2) x V_in", "x^2", "sqrt(L/C)", "1.5e-3" and
// Greek names into a small tree that <MathText> renders with real typography.

const GREEK = {
  pi: "π", omega: "ω", Omega: "Ω", theta: "θ", phi: "φ", lambda: "λ",
  Delta: "Δ", delta: "δ", sigma: "σ", tau: "τ", alpha: "α", beta: "β",
  gamma: "γ", epsilon: "ε", mu: "μ", rho: "ρ",
};
const GREEK_RE = new RegExp(`(${Object.keys(GREEK).join("|")})`, "y");
const SCI_RE = /(\d+(?:\.\d+)?)[eE]([+-]?\d+)(?![\w.])/y;
const NUM_FRAC_RE = /(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)(?![\w./])/y;
const isLetter = (c) => !!c && /[A-Za-z]/.test(c);
const isWord = (c) => !!c && /[A-Za-z0-9]/.test(c);

function findClose(s, i, open, close) {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === open) depth++;
    else if (s[j] === close && --depth === 0) return j;
  }
  return -1;
}

// Reads an exponent/subscript argument starting at s[i]. Returns [text, nextIndex] or null.
function readScript(s, i, allowSign) {
  const c = s[i];
  if (c === "(" || c === "{") {
    const close = findClose(s, i, c, c === "(" ? ")" : "}");
    if (close > i) return [s.slice(i + 1, close), close + 1];
    return null;
  }
  const re = allowSign ? /[+-]?(?:\d+(?:\.\d+)?|[A-Za-z]+\d*)/y : /(?:\d+|[A-Za-z]+\d*)/y;
  re.lastIndex = i;
  const m = re.exec(s);
  return m ? [m[0], i + m[0].length] : null;
}

const prepass = (s) =>
  s
    .replace(/(\d)\s*[x*]\s*10\^/g, "$1 × 10^")
    .replace(/\s\*\s/g, " × ")
    .replace(/(\w|\))\*(\w|\()/g, "$1·$2")
    .replace(/<=/g, "≤")
    .replace(/>=/g, "≥")
    .replace(/!=/g, "≠")
    .replace(/\+-/g, "±")
    .replace(/->/g, "→");

function parseInline(s, depth = 0) {
  const out = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  if (depth > 6) return [{ t: "text", v: s }];

  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const prev = s[i - 1];

    if (s.startsWith("sqrt(", i) && !isLetter(prev)) {
      const close = findClose(s, i + 4, "(", ")");
      if (close > 0) {
        flush();
        out.push({ t: "sqrt", c: parseInline(s.slice(i + 5, close), depth + 1) });
        i = close + 1;
        continue;
      }
    }

    if (c === "(" && !isWord(prev)) {
      const close = findClose(s, i, "(", ")");
      const dm = close > 0 && s[close + 1] === "/" ? /(\d+(?:\.\d+)?|[A-Za-z]\w*)(?![\w(])/y : null;
      if (dm) dm.lastIndex = close + 2;
      const dres = dm && s[close + 2] !== "(" ? dm.exec(s) : null;
      if (dres) {
        flush();
        out.push({
          t: "frac",
          n: parseInline(s.slice(i + 1, close), depth + 1),
          d: [{ t: "text", v: dres[0] }],
        });
        i = close + 2 + dres[0].length;
        continue;
      }
      if (close > 0 && s[close + 1] === "/" && s[close + 2] === "(") {
        const close2 = findClose(s, close + 2, "(", ")");
        if (close2 > 0) {
          flush();
          out.push({
            t: "frac",
            n: parseInline(s.slice(i + 1, close), depth + 1),
            d: parseInline(s.slice(close + 3, close2), depth + 1),
          });
          i = close2 + 1;
          continue;
        }
      }
    }

    if (/\d/.test(c) && !isWord(prev) && prev !== "." && prev !== "/") {
      NUM_FRAC_RE.lastIndex = i;
      const f = NUM_FRAC_RE.exec(s);
      if (f) {
        flush();
        out.push({ t: "frac", n: [{ t: "text", v: f[1] }], d: [{ t: "text", v: f[2] }] });
        i += f[0].length;
        continue;
      }
      const ng = /(\d+(?:\.\d+)?)\/\(/y;
      ng.lastIndex = i;
      const nm = ng.exec(s);
      if (nm) {
        const open = i + nm[0].length - 1;
        const close = findClose(s, open, "(", ")");
        if (close > 0) {
          flush();
          out.push({
            t: "frac",
            n: [{ t: "text", v: nm[1] }],
            d: parseInline(s.slice(open + 1, close), depth + 1),
          });
          i = close + 1;
          continue;
        }
      }
      SCI_RE.lastIndex = i;
      const m = SCI_RE.exec(s);
      if (m) {
        flush();
        out.push({ t: "text", v: `${m[1]} × 10` });
        out.push({ t: "sup", c: [{ t: "text", v: m[2].replace(/^\+/, "").replace(/^-/, "−") }] });
        i += m[0].length;
        continue;
      }
    }

    if (c === "^") {
      const r = readScript(s, i + 1, true);
      if (r) {
        flush();
        out.push({ t: "sup", c: parseInline(r[0].replace(/^-/, "−"), depth + 1) });
        i = r[1];
        continue;
      }
    }
    if (c === "_" && isWord(prev)) {
      const r = readScript(s, i + 1, false);
      if (r) {
        flush();
        out.push({ t: "sub", c: parseInline(r[0], depth + 1) });
        i = r[1];
        continue;
      }
    }

    if (isLetter(c) && !isLetter(prev)) {
      GREEK_RE.lastIndex = i;
      const g = GREEK_RE.exec(s);
      if (g && !isLetter(s[i + g[0].length])) {
        buf += GREEK[g[0]];
        i += g[0].length;
        continue;
      }
    }

    buf += c;
    i++;
  }
  flush();
  return out;
}

export const parseMath = (text) => parseInline(prepass(String(text ?? "")));

// ---------------------------------------------------------------------------
// Solution parsing: Given → Required → Formula → Solution → Final Answer.
// Works on whatever free text the model returns; falls back gracefully.

const HEADS = [
  ["given", /^(given|known|data)$/i],
  ["required", /^(required|find|unknown|to find|asked)$/i],
  ["formula", /^(formula|formulas|formula used|equation|equations|concept|principle)$/i],
  ["solution", /^(solution|steps|step-by-step|computation|analysis|explanation|verification|check|checking)$/i],
  ["final", /^(final answer|answer|therefore|conclusion|result)$/i],
];
export const SECTION_LABELS = {
  given: "Given",
  required: "Required",
  formula: "Formula",
  solution: "Solution",
  final: "Final Answer",
};
const HEAD_LINE = /^\s*(?:[#>*\-\s]*)\**\s*([A-Za-z][A-Za-z \-]{1,24}?)\s*\**\s*[:—–]\s*\**\s*(.*)$/;

export function parseSolution(text) {
  const raw = String(text ?? "").replace(/\r/g, "").replace(/\*\*/g, "");
  const lines = raw.split("\n");
  const sections = [];
  let cur = null;
  let sawHead = false;

  const push = (key) => {
    cur = { key, lines: [] };
    sections.push(cur);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = HEAD_LINE.exec(line);
    let key = null;
    if (m) {
      const hit = HEADS.find(([, re]) => re.test(m[1].trim()));
      if (hit) key = hit[0];
    }
    if (key) {
      sawHead = true;
      push(key);
      if (m[2].trim()) cur.lines.push(m[2].trim());
    } else {
      if (!cur) push("solution");
      cur.lines.push(trimmed.replace(/^[-•*]\s+/, "").replace(/^(?:step\s*)?\d{1,2}\s*[.):]\s+(?=\S)/i, ""));
    }
  }

  // Merge repeated sections of the same kind (e.g. several "Solution:" lines).
  const merged = [];
  for (const s of sections) {
    const last = merged.find((x) => x.key === s.key);
    if (last) last.lines.push(...s.lines);
    else merged.push({ ...s });
  }
  const order = ["given", "required", "formula", "solution", "final"];
  merged.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return { sections: merged.filter((s) => s.lines.length), structured: sawHead };
}
