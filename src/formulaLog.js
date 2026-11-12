// Collects the "Formula" section from each generated question's solution so the
// Formula Reference can show formulas the app has actually used.
import { parseSolution } from "./mathParse.js";

export const FORMULA_LOG_KEY = "eceQuizBee.formulaLog.v1";

const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function formulasFromQuestion(q) {
  const section = parseSolution(q.solution).sections.find((s) => s.key === "formula");
  if (!section) return [];
  const expr = section.lines.join(" ").trim();
  if (!expr || expr.length > 220) return [];
  return [
    {
      id: normalize(expr),
      expr,
      topic: q.item.sub,
      category: q.item.catName,
      subject: q.item.subject,
      addedAt: Date.now(),
    },
  ];
}

// Adds only formulas not already in the log. Newest first, capped at 500.
export function mergeFormulas(log, incoming) {
  const seen = new Set(log.map((f) => f.id));
  const fresh = [];
  for (const f of incoming) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      fresh.push(f);
    }
  }
  return fresh.length ? [...fresh, ...log].slice(0, 500) : log;
}
