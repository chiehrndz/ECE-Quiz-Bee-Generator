import { CATEGORIES } from "./topics";

// ---------------------------------------------------------------------------
// Question generation logic: moved verbatim from the original App.jsx.
// Prompt text, JSON parsing, topic flattening, and storage keys are unchanged.
// ---------------------------------------------------------------------------
export const DIFFICULTIES = ["Easy", "Intermediate", "Board Level", "Hard", "Expert", "Olympiad"];
export const TYPES = ["Mixed", "Conceptual", "Computational", "Application", "Problem-solving"];
export const PROGRESS_KEY = "boardDrill.progress.v2";
export const SELECTED_KEY = "boardDrill.selected.v2";

// New keys (additive; existing progress is preserved).
export const STATS_KEY = "eceQuizBee.stats.v1";
export const MISTAKES_KEY = "eceQuizBee.mistakes.v1";
export const SETTINGS_KEY = "eceQuizBee.settings.v1";

export const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Flatten the hierarchy: every subtopic is one independent practice item.
export const ALL = CATEGORIES.flatMap((c) =>
  c.subjects.flatMap(([subject, subs]) =>
    (subs.length ? subs : [subject]).map((sub) => ({
      key: `${c.id}|${subject}|${sub}`,
      catId: c.id,
      catName: c.name,
      subject,
      sub,
    }))
  )
);
export const itemsOf = (catId) => ALL.filter((x) => x.catId === catId);
export const customItems = (text) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sub) => ({
      key: `CUSTOM|Custom topics|${sub}`,
      catId: "CUSTOM",
      catName: "Custom",
      subject: "Custom topics",
      sub,
    }));

export function buildPrompt(item, level, type, recent) {
  const kind = type === "Mixed" ? pick(["Conceptual", "Computational", "Application", "Problem-solving"]) : type;
  const calc = kind === "Computational" || kind === "Problem-solving"
    ? "The answer must require a calculation with given numerical values and units."
    : "";
  const olympiad = level === "Olympiad"
    ? "Make it an olympiad-style, multi-step mathematics problem."
    : "";
  return `Write ONE ${level} difficulty ${kind.toLowerCase()} multiple-choice question for the Philippine ECE board exam.
Category: ${item.catName}. Major subject: ${item.subject}. Subtopic: ${item.sub}.
Stay strictly inside this subtopic. ${calc} ${olympiad}
Avoid repeating these questions: ${recent.join(" | ") || "none"}.
Rules: plain text only (no LaTeX), exactly 4 choices, exactly one correct, numeric choices include units, wrong choices reflect common mistakes. The solution must show formulas and steps, and verify the final answer.
Return ONLY JSON: {"question":"","choices":["","","",""],"answer":0,"solution":"","type":"${kind}"} where answer is the index 0-3.`;
}

export async function generate(item, level, type, recent) {
  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildPrompt(item, level, type, recent) }),
  });
  if (!r.ok) throw new Error("server");
  const d = await r.json();
  const q = JSON.parse(d.text.replace(/```json|```/g, "").trim());
  if (!q.question || q.choices?.length !== 4) throw new Error("bad");
  return { ...q, item, level, type: q.type || type };
}

// ---------------------------------------------------------------------------
// Presentation metadata for the four examination categories.
// ---------------------------------------------------------------------------
export const CAT_META = {
  IQS: {
    icon: "cap",
    blurb: "Core qualifying subjects: calculus, circuits, electronics, physics, and engineering fundamentals.",
  },
  MATH: {
    icon: "calculator",
    blurb: "Calculus, differential equations, series, transforms, and olympiad-style problem solving.",
  },
  COMMQUEST: {
    icon: "radio",
    blurb: "Modulation, transmission lines, antennas, networking, and modern communication systems.",
  },
  EES: {
    icon: "cpu",
    blurb: "Analog and digital electronics, microelectronics, devices, and applied ECE subjects.",
  },
  CUSTOM: { icon: "bulb", blurb: "Your own topics." },
};

export const QUESTION_COUNTS = [5, 10, 20, 50];
export const LETTERS = "ABCD";

export const fmtTime = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

export const timeAgo = (ts) => {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const EMPTY_STATS = { streak: 0, best: 0, byLevel: {}, activity: [], history: [] };

// Pure reducer: fold one answered question into the stats object.
export function applyResult(stats, q, choice) {
  const ok = choice === q.answer;
  const streak = ok ? stats.streak + 1 : 0;
  const lv = stats.byLevel[q.level] || { n: 0, ok: 0 };
  return {
    ...stats,
    streak,
    best: Math.max(stats.best, streak),
    byLevel: { ...stats.byLevel, [q.level]: { n: lv.n + 1, ok: lv.ok + (ok ? 1 : 0) } },
    activity: [
      {
        ts: Date.now(),
        ok,
        catId: q.item.catId,
        catName: q.item.catName,
        sub: q.item.sub,
        level: q.level,
      },
      ...stats.activity,
    ].slice(0, 30),
  };
}
