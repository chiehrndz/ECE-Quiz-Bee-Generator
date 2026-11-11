import { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "./topics";

const DIFFICULTIES = ["Easy", "Intermediate", "Board Level", "Hard", "Expert", "Olympiad"];
const TYPES = ["Mixed", "Conceptual", "Computational", "Application", "Problem-solving"];
const PROGRESS_KEY = "boardDrill.progress.v2";
const SELECTED_KEY = "boardDrill.selected.v2";

const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Flatten the hierarchy: every subtopic is one independent practice item.
const ALL = CATEGORIES.flatMap((c) =>
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
const itemsOf = (catId) => ALL.filter((x) => x.catId === catId);
const customItems = (text) =>
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

function buildPrompt(item, level, type, recent) {
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

async function generate(item, level, type, recent) {
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

export default function App() {
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(() => load(SELECTED_KEY, []));
  const [progress, setProgress] = useState(() => load(PROGRESS_KEY, {}));
  const [custom, setCustom] = useState("");
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState("Board Level");
  const [type, setType] = useState("Mixed");
  const [q, setQ] = useState(null);
  const [choice, setChoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ n: 0, ok: 0 });
  const recent = useRef([]);
  const next = useRef(null);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);
  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, JSON.stringify(selected));
  }, [selected]);
  useEffect(() => {
    next.current = null;
  }, [selected, custom, level, type]);

  const pool = () => {
    const set = new Set(selected);
    return [...ALL.filter((x) => set.has(x.key)), ...customItems(custom)];
  };
  const make = () => {
    const p = pool();
    if (!p.length) return Promise.reject(new Error("none"));
    return generate(pick(p), level, type, recent.current.slice(-6));
  };

  const nextQuestion = async () => {
    setErr("");
    setChoice(null);
    setLoading(true);
    try {
      const nq = (next.current && (await next.current)) || (await make());
      next.current = null;
      recent.current.push(nq.question.slice(0, 80));
      setQ(nq);
      next.current = make().catch(() => null);
    } catch {
      next.current = null;
      setErr(pool().length ? "Couldn't generate a question. Try again." : "Pick at least one topic.");
    }
    setLoading(false);
  };

  // Selecting a node toggles all of its leaves: all on -> clear, otherwise -> select all.
  const toggleKeys = (keys) =>
    setSelected((prev) => {
      const s = new Set(prev);
      const allOn = keys.every((k) => s.has(k));
      keys.forEach((k) => (allOn ? s.delete(k) : s.add(k)));
      return [...s];
    });

  const startCategory = (catId) => {
    setSelected(itemsOf(catId).map((x) => x.key));
    setView("practice");
  };

  const answer = (i) => {
    if (choice !== null) return;
    setChoice(i);
    const ok = i === q.answer ? 1 : 0;
    setSession((s) => ({ n: s.n + 1, ok: s.ok + ok }));
    setProgress((p) => {
      const b = p[q.item.key] || { n: 0, ok: 0 };
      return { ...p, [q.item.key]: { n: b.n + 1, ok: b.ok + ok } };
    });
  };

  const topicPicker = (
    <>
      <input
        className="search"
        placeholder="Search topics"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="scroll">
        <Tree selected={selected} onToggle={toggleKeys} filter={filter} />
      </div>
    </>
  );

  return (
    <div className="app">
      <style>{CSS}</style>
      <h1>Board Exam Drill</h1>
      <nav>
        {[
          ["dashboard", "Dashboard"],
          ["practice", "Practice"],
          ["browse", "Browse topics"],
        ].map(([id, label]) => (
          <button key={id} className={`tab ${view === id ? "on" : ""}`} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </nav>

      {view === "dashboard" && <Dashboard progress={progress} onStart={startCategory} />}

      {view === "browse" && (
        <section>
          <p className="muted">{selected.length} topics selected. Check any category, subject, or subtopic.</p>
          {topicPicker}
          <div className="bar">
            <button className="go" onClick={() => setView("practice")}>Practice selected</button>
          </div>
        </section>
      )}

      {view === "practice" && (
        <section>
          <details className="picker">
            <summary>Topics: {selected.length} selected (tap to change)</summary>
            {topicPicker}
          </details>
          <textarea
            rows={2}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Your own topics, one per line"
            className="custom"
          />
          <Chips label="Difficulty" options={DIFFICULTIES} value={level} onChange={setLevel} />
          <Chips label="Question type" options={TYPES} value={type} onChange={setType} />
          <div className="bar">
            <button className="go" disabled={loading} onClick={nextQuestion}>
              {loading ? "Generating…" : q ? "Next question" : "Start drilling"}
            </button>
            <span>Session {session.ok}/{session.n}</span>
          </div>
          {err && <p role="alert" className="err">{err}</p>}
          {q && <QuestionCard q={q} choice={choice} onAnswer={answer} />}
        </section>
      )}
    </div>
  );
}

function Dashboard({ progress, onStart }) {
  return (
    <section className="grid">
      {CATEGORIES.map((c) => {
        const items = itemsOf(c.id);
        const s = items.reduce(
          (a, x) => {
            const p = progress[x.key];
            if (p) {
              a.n += p.n;
              a.ok += p.ok;
              if (p.n) a.touched += 1;
            }
            return a;
          },
          { n: 0, ok: 0, touched: 0 }
        );
        const acc = s.n ? Math.round((s.ok / s.n) * 100) : 0;
        const pct = items.length ? Math.round((s.touched / items.length) * 100) : 0;
        return (
          <article key={c.id} className="card">
            <h2>{c.name}</h2>
            <p className="muted">{c.subtitle}</p>
            <ul className="stats">
              <li>{c.subjects.length} subjects</li>
              <li>{items.length} subtopics</li>
              <li>{s.n} answered</li>
              <li>{acc}% accuracy</li>
            </ul>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="muted">{pct}% of subtopics started</p>
            <button className="go" onClick={() => onStart(c.id)}>Start Practice</button>
          </article>
        );
      })}
    </section>
  );
}

function Tree({ selected, onToggle, filter }) {
  const set = new Set(selected);
  const term = filter.trim().toLowerCase();

  if (term) {
    const hits = ALL.filter((x) => `${x.catName} ${x.subject} ${x.sub}`.toLowerCase().includes(term));
    if (!hits.length) return <p className="muted">No topics match.</p>;
    return hits.map((x) => (
      <label key={x.key} className="leaf">
        <input type="checkbox" checked={set.has(x.key)} onChange={() => onToggle([x.key])} />
        <span>
          <b>{x.catName} · {x.subject}</b>
          <br />
          {x.sub}
        </span>
      </label>
    ));
  }

  return CATEGORIES.map((c) => {
    const cItems = itemsOf(c.id);
    const cOn = cItems.filter((x) => set.has(x.key)).length;
    return (
      <div key={c.id} className="node">
        <label className="row">
          <input type="checkbox" checked={cItems.length > 0 && cOn === cItems.length} onChange={() => onToggle(cItems.map((x) => x.key))} />
          <b>{c.name}</b>
          <span className="muted">{cOn}/{cItems.length}</span>
        </label>
        <div className="indent">
          {c.subjects.map(([subject]) => {
            const sItems = ALL.filter((x) => x.catId === c.id && x.subject === subject);
            const sOn = sItems.filter((x) => set.has(x.key)).length;
            return (
              <details key={subject} className="subject">
                <summary>
                  <input
                    type="checkbox"
                    checked={sOn === sItems.length}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onToggle(sItems.map((x) => x.key))}
                  />{" "}
                  {subject} <span className="muted">{sOn}/{sItems.length}</span>
                </summary>
                {sItems.map((x) => (
                  <label key={x.key} className="leaf">
                    <input type="checkbox" checked={set.has(x.key)} onChange={() => onToggle([x.key])} />
                    {x.sub}
                  </label>
                ))}
              </details>
            );
          })}
        </div>
      </div>
    );
  });
}

function Chips({ label, options, value, onChange }) {
  return (
    <div>
      <h2>{label}</h2>
      <div className="chips">
        {options.map((o) => (
          <button key={o} className="chip" aria-pressed={value === o} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ q, choice, onAnswer }) {
  const done = choice !== null;
  return (
    <article className="card">
      <div className="meta">{q.item.catName} · {q.item.subject}</div>
      <div className="strong">{q.item.sub}</div>
      <div className="meta">{q.level} · {q.type}</div>
      <p className="question">{q.question}</p>
      {q.choices.map((c, i) => {
        const right = done && i === q.answer;
        const wrong = done && i === choice && i !== q.answer;
        return (
          <button
            key={i}
            className="opt"
            disabled={done}
            onClick={() => onAnswer(i)}
            style={{ background: right ? "#D9F2E0" : wrong ? "#F9D9D5" : undefined }}
          >
            <b>{"ABCD"[i]}.</b>
            <span>{c}</span>
          </button>
        );
      })}
      {done && (
        <div className="solution">
          <b>{choice === q.answer ? "Correct." : `Answer: ${"ABCD"[q.answer]}.`}</b>
          <p>{q.solution}</p>
        </div>
      )}
    </article>
  );
}

const CSS = `
:root{--navy:#14213D;--orange:#F28C28;--mist:#F3F5F9;--line:#C9D1E0}
*{box-sizing:border-box}
body{margin:0;background:var(--mist);color:var(--navy);font-family:Arial,Helvetica,sans-serif}
.app{max-width:760px;margin:0 auto;padding:16px}
h1{margin:0 0 8px;font-size:26px}
h2{font-size:15px;margin:14px 0 8px}
nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.tab,.chip{border:1.5px solid var(--navy);background:#fff;color:var(--navy);padding:8px 12px;border-radius:6px;font:inherit;cursor:pointer}
.tab.on,.chip[aria-pressed=true]{background:var(--navy);color:#fff}
.go{background:var(--orange);color:var(--navy);border:2px solid var(--navy);padding:10px 18px;border-radius:6px;font:inherit;font-weight:700;cursor:pointer}
.go:disabled{opacity:.6}
.muted{color:#5A6785;font-size:14px}
.card{background:#fff;border:1.5px solid var(--navy);border-radius:8px;padding:16px;margin-top:12px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.stats{list-style:none;padding:0;margin:8px 0;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:14px}
.bar-track{height:8px;background:var(--line);border-radius:4px;overflow:hidden;margin:8px 0 4px}
.bar-fill{height:100%;background:var(--orange)}
.search,.custom{width:100%;padding:10px;border:1.5px solid var(--navy);border-radius:6px;font:inherit;margin:8px 0}
.scroll{max-height:380px;overflow:auto;border:1px solid var(--line);border-radius:6px;padding:8px;background:#fff}
.picker summary{cursor:pointer;font-weight:600;padding:8px 0}
.node{margin-bottom:6px}
.indent{margin-left:12px}
.subject{margin:4px 0}
.subject summary{cursor:pointer;padding:4px 0;font-size:14px}
.row,.leaf{display:flex;gap:6px;align-items:flex-start;font-size:14px;padding:3px 0;cursor:pointer}
.row{font-weight:600}
.leaf{margin-left:22px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:16px 0 8px}
.err{color:#A32020}
.meta{font-size:13px;color:#5A6785}
.strong{font-weight:700;font-size:15px;margin:2px 0}
.question{font-size:18px;line-height:1.5;white-space:pre-wrap;margin:10px 0}
.opt{display:flex;gap:10px;text-align:left;width:100%;padding:12px;margin:6px 0;border:1.5px solid var(--navy);background:var(--mist);color:var(--navy);border-radius:6px;font:inherit;font-size:16px;cursor:pointer}
.opt:disabled{cursor:default}
.solution{margin-top:12px;border-top:1.5px solid var(--navy);padding-top:10px;line-height:1.6;white-space:pre-wrap}
`;
