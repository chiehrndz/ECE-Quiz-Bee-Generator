import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "./topics";
import { FORMULA_SUBJECTS } from "./formulas";
import {
  ALL, CAT_META, DIFFICULTIES, TYPES, QUESTION_COUNTS, LETTERS, itemsOf, fmtTime, timeAgo,
} from "./data.js";
import { Icon, Logo } from "./icons.jsx";
import { BarRow, ColumnChart, EmptyState, MathText, Ring, Segmented, StatCard } from "./ui.jsx";
import { Solution } from "./exam.jsx";

const TAGLINE = "Test Your Knowledge. Master Electronics Engineering.";

export function catStats(progress, catId) {
  const items = itemsOf(catId);
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
  return {
    ...s,
    items: items.length,
    acc: s.n ? Math.round((s.ok / s.n) * 100) : 0,
    pct: items.length ? Math.round((s.touched / items.length) * 100) : 0,
  };
}

export const totalsOf = (progress) => {
  const n = Object.values(progress).reduce((a, p) => a + p.n, 0);
  const ok = Object.values(progress).reduce((a, p) => a + p.ok, 0);
  return { n, ok, wrong: n - ok, acc: n ? Math.round((ok / n) * 100) : 0 };
};

export function PageHeader({ title, children, icon }) {
  return (
    <header className="page-head">
      <div>
        <h1>{icon && <Icon name={icon} size={22} />}{title}</h1>
        {children && <p className="muted">{children}</p>}
      </div>
    </header>
  );
}

/* ====================================================================== */
/* Dashboard                                                               */
/* ====================================================================== */
export function Dashboard({ progress, stats, onStart, onPractice, onMock, onPerformance }) {
  const t = totalsOf(progress);
  const cats = CATEGORIES.map((c) => ({ c, s: catStats(progress, c.id) }));
  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-brand"><Logo size={44} /><span>ECE Quiz Bee</span></div>
          <h1>Welcome back, future engineer.</h1>
          <p className="hero-tag">{TAGLINE}</p>
          <p className="hero-desc">
            Generate unlimited board-style questions across Integrated Qualifying Subjects, Mathematics, Communications, and
            Electronics Engineering, then track your accuracy and streaks as you improve.
          </p>
          <div className="btn-row">
            <button className="btn btn-accent btn-lg" onClick={onPractice}><Icon name="play" size={18} /> Start Practicing</button>
            <button className="btn btn-hero-ghost btn-lg" onClick={onMock}><Icon name="clipboard" size={18} /> Take a Mock Exam</button>
          </div>
        </div>
        <div className="hero-ring">
          <Ring value={t.acc} size={150} stroke={12} sub="accuracy" tone="accent" />
          <div className="hero-ring-cap">{t.n ? `${t.ok} of ${t.n} correct` : "No answers yet"}</div>
        </div>
      </section>

      <section className="stat-grid" aria-label="Statistics">
        <StatCard icon="target" label="Questions answered" value={t.n} tone="navy" />
        <StatCard icon="checkCircle" label="Accuracy" value={`${t.acc}%`} hint={`${t.ok} correct`} tone="success" />
        <StatCard icon="flame" label="Current streak" value={stats.streak} hint="correct in a row" tone="accent" />
        <StatCard icon="trophy" label="Best streak" value={stats.best} tone="navy" />
      </section>

      <section className="two-col">
        <div className="card">
          <div className="section-head">
            <h3>Topic coverage</h3>
            <button className="link-btn" onClick={onPerformance}>Full performance <Icon name="arrowRight" size={14} /></button>
          </div>
          <div className="stack-sm">
            {cats.map(({ c, s }) => (
              <BarRow key={c.id} label={c.name} value={s.pct} detail={`${s.touched}/${s.items} subtopics`} tone="accent" icon={CAT_META[c.id].icon} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-head"><h3>Recent activity</h3></div>
          {stats.activity.length === 0 ? (
            <EmptyState icon="activity" title="No activity yet">Answer a few questions and your recent results will show up here.</EmptyState>
          ) : (
            <ul className="activity">
              {stats.activity.slice(0, 5).map((a, i) => (
                <li key={i}>
                  <span className={`dot ${a.ok ? "ok" : "bad"}`}><Icon name={a.ok ? "check" : "x"} size={13} /></span>
                  <div className="act-main">
                    <div className="act-title">{a.sub}</div>
                    <div className="muted small">{a.catName} · {a.level}</div>
                  </div>
                  <span className="muted small">{timeAgo(a.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="section-head"><h2>Examination categories</h2></div>
        <div className="cat-grid">
          {cats.map(({ c, s }) => (
            <article key={c.id} className={`card cat-card cat-${c.id}`}>
              <div className="cat-top">
                <div className="cat-icon"><Icon name={CAT_META[c.id].icon} size={22} /></div>
                <span className="chip">{s.acc}% accuracy</span>
              </div>
              <h3>{c.name}</h3>
              <div className="cat-sub">{c.subtitle}</div>
              <p className="muted">{CAT_META[c.id].blurb}</p>
              <ul className="cat-stats">
                <li><strong>{c.subjects.length}</strong> subjects</li>
                <li><strong>{s.items}</strong> subtopics</li>
                <li><strong>{s.n}</strong> answered</li>
              </ul>
              <div className="meter" role="progressbar" aria-valuenow={s.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name} coverage`}>
                <div className="meter-fill" style={{ width: `${s.pct}%` }} />
              </div>
              <div className="muted small">{s.pct}% of subtopics started</div>
              <button className="btn btn-primary btn-block" onClick={() => onStart(c.id)}>
                Start Practice <Icon name="arrowRight" size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ====================================================================== */
/* Topic tree                                                              */
/* ====================================================================== */
function Check({ checked, indeterminate, onChange, onClick, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return <input ref={ref} type="checkbox" className="cb" checked={checked} onChange={onChange} onClick={onClick} aria-label={label} />;
}

const acc = (p) => (p && p.n ? `${Math.round((p.ok / p.n) * 100)}%` : null);

export function Tree({ selected, onToggle, filter, progress }) {
  const set = new Set(selected);
  const term = filter.trim().toLowerCase();

  if (term) {
    const hits = ALL.filter((x) => `${x.catName} ${x.subject} ${x.sub}`.toLowerCase().includes(term));
    if (!hits.length) return <p className="muted center pad">No topics match.</p>;
    return hits.map((x) => (
      <label key={x.key} className="leaf leaf-hit">
        <Check checked={set.has(x.key)} onChange={() => onToggle([x.key])} label={x.sub} />
        <span>
          <span className="leaf-path">{x.catName} · {x.subject}</span>
          <span className="leaf-name">{x.sub}</span>
        </span>
      </label>
    ));
  }

  return CATEGORIES.map((c) => {
    const cItems = itemsOf(c.id);
    const cOn = cItems.filter((x) => set.has(x.key)).length;
    return (
      <details key={c.id} className={`node cat-${c.id}`}>
        <summary className="node-sum">
          <Icon name="chevronRight" size={16} className="caret" />
          <Check
            checked={cItems.length > 0 && cOn === cItems.length}
            indeterminate={cOn > 0}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggle(cItems.map((x) => x.key))}
            label={`Select all ${c.name}`}
          />
          <span className="node-icon"><Icon name={CAT_META[c.id].icon} size={15} /></span>
          <span className="node-name">{c.name}</span>
          <span className="count-pill">{cOn}/{cItems.length}</span>
        </summary>
        <div className="indent">
          {c.subjects.map(([subject]) => {
            const sItems = ALL.filter((x) => x.catId === c.id && x.subject === subject);
            const sOn = sItems.filter((x) => set.has(x.key)).length;
            return (
              <details key={subject} className="subject">
                <summary>
                  <Icon name="chevronRight" size={14} className="caret" />
                  <Check
                    checked={sOn === sItems.length}
                    indeterminate={sOn > 0}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onToggle(sItems.map((x) => x.key))}
                    label={`Select all ${subject}`}
                  />
                  <span className="subject-name">{subject}</span>
                  <span className="count-pill">{sOn}/{sItems.length}</span>
                </summary>
                <div className="leaves">
                  {sItems.map((x) => (
                    <label key={x.key} className="leaf">
                      <Check checked={set.has(x.key)} onChange={() => onToggle([x.key])} label={x.sub} />
                      <span className="leaf-name">{x.sub}</span>
                      {acc(progress?.[x.key]) && <span className="acc-pill">{acc(progress[x.key])}</span>}
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </details>
    );
  });
}

export function TopicPicker({ selected, onToggle, filter, setFilter, progress, tall }) {
  return (
    <div className="picker">
      <div className="search-box">
        <Icon name="search" size={16} />
        <input
          type="search"
          placeholder="Search topics or subjects"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Search topics"
        />
      </div>
      <div className={`tree-scroll ${tall ? "tall" : ""}`}>
        <Tree selected={selected} onToggle={onToggle} filter={filter} progress={progress} />
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Examination setup (Practice + Mock)                                     */
/* ====================================================================== */
function Section({ n, title, desc, children }) {
  return (
    <section className="card setup-sec">
      <div className="setup-sec-head">
        <span className="step-n">{n}</span>
        <div>
          <h3>{title}</h3>
          {desc && <p className="muted small">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SetupView(p) {
  const { mode, setMode, selected, setSelected, onToggle, filter, setFilter, custom, setCustom } = p;
  const { level, setLevel, type, setType, count, setCount, secPerQ, setSecPerQ, poolSize, onStart, progress, error } = p;
  const isMock = mode === "mock";
  const set = new Set(selected);
  const effCount = isMock && count === 0 ? 10 : count;
  const counts = isMock ? QUESTION_COUNTS : [...QUESTION_COUNTS, 0];
  const totalSec = effCount * secPerQ;

  return (
    <div className="setup">
      <PageHeader title={isMock ? "Mock Examination" : "Practice"} icon={isMock ? "clipboard" : "target"}>
        {isMock
          ? "Simulate a timed board-style exam. Answers and solutions are revealed when you finish."
          : "Answer one question at a time with instant feedback and a full step-by-step solution."}
      </PageHeader>

      <div className="setup-grid">
        <div className="stack">
          <Section n={1} title="Examination mode" desc="Choose how you want to be tested.">
            <div className="select-cards">
              {[
                ["practice", "target", "Practice mode", "Instant feedback after every question. Unlimited or fixed length."],
                ["mock", "clipboard", "Mock exam", "Timed set of questions. Review everything at the end."],
              ].map(([v, ic, t, d]) => (
                <button key={v} type="button" role="radio" aria-checked={mode === v} className={`select-card ${mode === v ? "on" : ""}`} onClick={() => setMode(v)}>
                  <span className="sc-icon"><Icon name={ic} size={20} /></span>
                  <span className="sc-title">{t}</span>
                  <span className="sc-desc">{d}</span>
                  <span className="sc-check"><Icon name="check" size={14} /></span>
                </button>
              ))}
            </div>
          </Section>

          <Section n={2} title="Topics" desc={`${selected.length} subtopics selected. Pick whole categories or drill down.`}>
            <div className="quick-cats">
              {CATEGORIES.map((c) => {
                const items = itemsOf(c.id);
                const on = items.filter((x) => set.has(x.key)).length;
                const full = on === items.length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={full}
                    className={`quick-cat cat-${c.id} ${full ? "on" : on ? "part" : ""}`}
                    onClick={() => onToggle(items.map((x) => x.key))}
                  >
                    <Icon name={CAT_META[c.id].icon} size={16} />
                    <span>{c.name}</span>
                    <small>{on}/{items.length}</small>
                  </button>
                );
              })}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected([])} disabled={!selected.length}>Clear</button>
            </div>
            <details className="expander">
              <summary><Icon name="list" size={16} /> Browse subjects and subtopics <Icon name="chevronDown" size={16} className="exp-caret" /></summary>
              <TopicPicker selected={selected} onToggle={onToggle} filter={filter} setFilter={setFilter} progress={progress} />
            </details>
          </Section>

          <Section n={3} title="Custom topics" desc="Optional. Add your own topics, one per line.">
            <textarea
              rows={3}
              className="textarea"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={"e.g. Smith chart applications\nPhase-locked loops"}
              aria-label="Custom topics"
            />
          </Section>

          <Section n={4} title="Question type">
            <Segmented label="Question type" options={TYPES} value={type} onChange={setType} />
          </Section>

          <Section n={5} title="Difficulty">
            <Segmented label="Difficulty" options={DIFFICULTIES} value={level} onChange={setLevel} />
          </Section>

          <Section n={6} title="Number of questions" desc={isMock ? "Mock exams run a fixed number of questions." : "Pick a fixed length or practice without limit."}>
            <Segmented
              label="Number of questions"
              options={counts.map((c) => ({ value: c, label: c === 0 ? "Unlimited" : String(c) }))}
              value={effCount}
              onChange={setCount}
            />
            {isMock && (
              <div className="field-row">
                <span className="field-label">Time per question</span>
                <Segmented
                  label="Time per question"
                  size="sm"
                  options={[{ value: 60, label: "60s" }, { value: 90, label: "90s" }, { value: 120, label: "120s" }, { value: 180, label: "180s" }]}
                  value={secPerQ}
                  onChange={setSecPerQ}
                />
              </div>
            )}
          </Section>
        </div>

        <aside className="card summary" aria-label="Examination summary">
          <h3>Examination summary</h3>
          <dl>
            <div><dt>Mode</dt><dd>{isMock ? "Mock exam" : "Practice"}</dd></div>
            <div><dt>Topics</dt><dd>{poolSize} selected</dd></div>
            <div><dt>Type</dt><dd>{type}</dd></div>
            <div><dt>Difficulty</dt><dd>{level}</dd></div>
            <div><dt>Questions</dt><dd>{effCount === 0 ? "Unlimited" : effCount}</dd></div>
            {isMock && <div><dt>Time limit</dt><dd>{fmtTime(totalSec)}</dd></div>}
          </dl>
          {error && <p role="alert" className="form-err"><Icon name="alert" size={15} /> {error}</p>}
          <button className="btn btn-accent btn-lg btn-block" onClick={onStart}>
            Start Examination <Icon name="arrowRight" size={18} />
          </button>
          <p className="muted small center">Questions are generated by AI and may take a few seconds.</p>
        </aside>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Topics browser                                                          */
/* ====================================================================== */
export function TopicsView({ selected, onToggle, filter, setFilter, progress, onPractice, onClear }) {
  return (
    <div className="stack">
      <PageHeader title="Topics" icon="book">
        Browse every category, subject, and subtopic. Check what you want to practice; accuracy badges show how you're doing.
      </PageHeader>
      <div className="card">
        <TopicPicker selected={selected} onToggle={onToggle} filter={filter} setFilter={setFilter} progress={progress} tall />
      </div>
      <div className="sticky-bar">
        <span><strong>{selected.length}</strong> topics selected</span>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={onClear} disabled={!selected.length}>Clear</button>
        <button className="btn btn-accent" onClick={onPractice}>Practice selected <Icon name="arrowRight" size={16} /></button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Performance                                                             */
/* ====================================================================== */
export function PerformanceView({ progress, stats, onPractice }) {
  const t = totalsOf(progress);
  const tracked = Object.values(stats.byLevel).reduce((a, l) => a + l.n, 0);
  const avg = stats.history.length ? Math.round(stats.history.reduce((a, h) => a + (h.total ? (h.ok / h.total) * 100 : 0), 0) / stats.history.length) : 0;
  const hist = [...stats.history].reverse().slice(-10);

  if (!t.n) {
    return (
      <div className="stack">
        <PageHeader title="Performance" icon="chart">Track accuracy, streaks, and progress by category and difficulty.</PageHeader>
        <div className="card">
          <EmptyState icon="chart" title="No performance data yet" action={<button className="btn btn-accent" onClick={onPractice}>Start practicing</button>}>
            Answer a few questions and your charts will appear here.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader title="Performance" icon="chart">Track accuracy, streaks, and progress by category and difficulty.</PageHeader>

      <div className="stat-grid stat-grid-6">
        <StatCard icon="target" label="Total answered" value={t.n} tone="navy" />
        <StatCard icon="checkCircle" label="Correct" value={t.ok} tone="success" />
        <StatCard icon="xCircle" label="Incorrect" value={t.wrong} tone="danger" />
        <StatCard icon="activity" label="Average score" value={stats.history.length ? `${avg}%` : "n/a"} hint={`${stats.history.length} session${stats.history.length === 1 ? "" : "s"}`} tone="accent" />
        <StatCard icon="flame" label="Current streak" value={stats.streak} tone="accent" />
        <StatCard icon="trophy" label="Highest streak" value={stats.best} tone="navy" />
      </div>

      <div className="two-col">
        <div className="card acc-card">
          <h3>Overall accuracy</h3>
          <Ring value={t.acc} size={160} stroke={14} sub={`${t.ok}/${t.n}`} tone={t.acc >= 70 ? "success" : t.acc >= 50 ? "accent" : "danger"} />
          <div className="legend-inline">
            <span><i className="sw sw-success" /> Correct {t.ok}</span>
            <span><i className="sw sw-danger" /> Incorrect {t.wrong}</span>
          </div>
        </div>
        <div className="card">
          <h3>Performance by category</h3>
          <div className="stack-sm">
            {CATEGORIES.map((c) => {
              const s = catStats(progress, c.id);
              return (
                <BarRow
                  key={c.id}
                  label={c.name}
                  icon={CAT_META[c.id].icon}
                  value={s.acc}
                  detail={s.n ? `${s.acc}% · ${s.ok}/${s.n}` : "No answers"}
                  tone={!s.n ? "muted" : s.acc >= 70 ? "success" : s.acc >= 50 ? "accent" : "danger"}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Performance by difficulty</h3>
          <div className="stack-sm">
            {DIFFICULTIES.map((d) => {
              const l = stats.byLevel[d] || { n: 0, ok: 0 };
              const a = l.n ? Math.round((l.ok / l.n) * 100) : 0;
              return <BarRow key={d} label={d} value={a} detail={l.n ? `${a}% · ${l.ok}/${l.n}` : "No answers"} tone={!l.n ? "muted" : a >= 70 ? "success" : a >= 50 ? "accent" : "danger"} />;
            })}
          </div>
          {tracked < t.n && <p className="muted small note">Difficulty tracking started with this version, so earlier answers aren't included here.</p>}
        </div>
        <div className="card">
          <h3>Recent examination scores</h3>
          <ColumnChart
            data={hist.map((h) => ({ label: new Date(h.ts).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }), value: h.total ? Math.round((h.ok / h.total) * 100) : 0 }))}
            emptyText="Finish a session to see your score trend."
          />
        </div>
      </div>

      <div className="card">
        <h3>Examination history</h3>
        {stats.history.length === 0 ? (
          <p className="muted">Finished sessions will be listed here.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Mode</th><th>Level</th><th>Score</th><th>Accuracy</th><th>Time</th></tr>
              </thead>
              <tbody>
                {stats.history.slice(0, 12).map((h, i) => {
                  const a = h.total ? Math.round((h.ok / h.total) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td data-label="Date">{new Date(h.ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td data-label="Mode"><span className={`chip ${h.mode === "mock" ? "chip-navy" : ""}`}>{h.mode === "mock" ? "Mock" : "Practice"}</span></td>
                      <td data-label="Level">{h.level}</td>
                      <td data-label="Score">{h.ok}/{h.total}</td>
                      <td data-label="Accuracy"><span className={`pill ${a >= 70 ? "ok" : a >= 50 ? "mid" : "bad"}`}>{a}%</span></td>
                      <td data-label="Time">{fmtTime(h.seconds)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Review mistakes                                                         */
/* ====================================================================== */
export function MistakesView({ mistakes, onRetry, onClear, onPractice }) {
  const [cat, setCat] = useState("all");
  const cats = useMemo(() => [...new Set(mistakes.map((m) => m.q.item.catId))], [mistakes]);
  const list = mistakes.filter((m) => cat === "all" || m.q.item.catId === cat);

  return (
    <div className="stack">
      <PageHeader title="Review Mistakes" icon="retry">
        Questions you answered incorrectly. Study the solution, then retry until you get it right.
      </PageHeader>
      {mistakes.length === 0 ? (
        <div className="card">
          <EmptyState icon="checkCircle" title="No mistakes to review" action={<button className="btn btn-accent" onClick={onPractice}>Start practicing</button>}>
            Incorrect answers are saved here automatically so you can learn from them.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <Segmented
              label="Filter by category"
              size="sm"
              options={[{ value: "all", label: `All (${mistakes.length})` }, ...cats.map((c) => ({ value: c, label: c === "MATH" ? "MATH OLYMPIAD" : c }))]}
              value={cat}
              onChange={setCat}
            />
            <span className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={onClear}><Icon name="trash" size={15} /> Clear all</button>
          </div>
          <div className="stack">
            {list.map((m) => (
              <article key={m.id} className="card mistake">
                <div className="chips-row">
                  <span className="chip chip-navy">{m.q.item.catName}</span>
                  <span className="chip">{m.q.item.subject}</span>
                  <span className="chip chip-accent">{m.q.level}</span>
                  <span className="muted small push-right">{timeAgo(m.ts)}</span>
                </div>
                <p className="question-text"><MathText text={m.q.question} /></p>
                <div className="mistake-answers">
                  <div className="ans bad"><Icon name="xCircle" size={16} /><span><small>Your answer</small><b>{LETTERS[m.chosen]}.</b> <MathText text={m.q.choices[m.chosen]} /></span></div>
                  <div className="ans ok"><Icon name="checkCircle" size={16} /><span><small>Correct answer</small><b>{LETTERS[m.q.answer]}.</b> <MathText text={m.q.choices[m.q.answer]} /></span></div>
                </div>
                <details className="expander">
                  <summary><Icon name="bulb" size={16} /> Explanation <Icon name="chevronDown" size={16} className="exp-caret" /></summary>
                  <Solution text={m.q.solution} letter={LETTERS[m.q.answer]} answerText={m.q.choices[m.q.answer]} />
                </details>
                <div className="btn-row">
                  <button className="btn btn-accent" onClick={() => onRetry(m)}><Icon name="retry" size={16} /> Retry</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ====================================================================== */
/* Formula reference                                                       */
/* ====================================================================== */
export function FormulasView({ learned = [] }) {
  const [term, setTerm] = useState("");
  const [subject, setSubject] = useState("all");
  const t = term.trim().toLowerCase();
  const subjects = learned.length
    ? [
        ...FORMULA_SUBJECTS,
        {
          id: "learned",
          name: "From your questions",
          formulas: learned.map((f) => ({
            name: f.topic,
            expr: f.expr,
            desc: `${f.category} · ${f.subject}. Taken from an AI-generated solution and not checked against a textbook.`,
            vars: [],
          })),
        },
      ]
    : FORMULA_SUBJECTS;
  const groups = subjects.filter((s) => subject === "all" || s.id === subject)
    .map((s) => ({
      ...s,
      formulas: s.formulas.filter((f) => !t || `${f.name} ${f.expr} ${f.desc} ${f.vars.map((v) => v.join(" ")).join(" ")}`.toLowerCase().includes(t)),
    }))
    .filter((s) => s.formulas.length);

  return (
    <div className="stack">
      <PageHeader title="Formula Reference" icon="sigma">Essential equations organized by subject, with variable definitions.</PageHeader>
      <div className="toolbar">
        <div className="search-box grow">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Search formulas, e.g. resonance, Shannon, Ohm" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Search formulas" />
        </div>
      </div>
      <div className="chip-scroll" role="radiogroup" aria-label="Subject">
        {[{ id: "all", name: "All subjects" }, ...subjects].map((s) => (
          <button key={s.id} role="radio" aria-checked={subject === s.id} className={`filter-chip ${subject === s.id ? "on" : ""}`} onClick={() => setSubject(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      {groups.length === 0 && (
        <div className="card"><EmptyState icon="search" title="No formulas found">Try a different search term or subject.</EmptyState></div>
      )}
      {groups.map((s) => (
        <section key={s.id}>
          <div className="section-head"><h2>{s.name}</h2><span className="count-pill">{s.formulas.length}</span></div>
          <div className="formula-grid">
            {s.formulas.map((f, i) => (
              <article key={`${f.name}-${i}`} className="card formula-card">
                <h4>{f.name}</h4>
                <div className="formula-box"><MathText text={f.expr} /></div>
                <p className="muted small">{f.desc}</p>
                <dl className="vars">
                  {f.vars.map(([sym, meaning]) => (
                    <div key={sym}><dt><MathText text={sym} /></dt><dd>{meaning}</dd></div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* Settings                                                                */
/* ====================================================================== */
export function SettingsView({ settings, setSettings, onResetAll, onClearMistakes }) {
  return (
    <div className="stack">
      <PageHeader title="Settings" icon="sliders">Personalize the app and manage your saved data.</PageHeader>
      <div className="card settings-card">
        <h3>Appearance</h3>
        <div className="setting-row">
          <div><div className="setting-title">Theme</div><div className="muted small">Choose light, dark, or follow your device.</div></div>
          <Segmented
            label="Theme"
            size="sm"
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]}
            value={settings.theme}
            onChange={(v) => setSettings((s) => ({ ...s, theme: v }))}
          />
        </div>
        <div className="setting-row">
          <div><div className="setting-title">Compact sidebar</div><div className="muted small">Show only icons in the desktop sidebar.</div></div>
          <button
            role="switch"
            aria-checked={settings.collapsed}
            className={`switch ${settings.collapsed ? "on" : ""}`}
            onClick={() => setSettings((s) => ({ ...s, collapsed: !s.collapsed }))}
            aria-label="Compact sidebar"
          ><i /></button>
        </div>
      </div>
      <div className="card settings-card">
        <h3>Examination defaults</h3>
        <div className="setting-row">
          <div><div className="setting-title">Mock exam time per question</div><div className="muted small">Used to calculate the total time limit.</div></div>
          <Segmented
            label="Time per question"
            size="sm"
            options={[{ value: 60, label: "60s" }, { value: 90, label: "90s" }, { value: 120, label: "120s" }, { value: 180, label: "180s" }]}
            value={settings.secPerQ}
            onChange={(v) => setSettings((s) => ({ ...s, secPerQ: v }))}
          />
        </div>
      </div>
      <div className="card settings-card">
        <h3>Data</h3>
        <p className="muted small">Your progress is stored in this browser only.</p>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClearMistakes}><Icon name="trash" size={16} /> Clear saved mistakes</button>
          <button className="btn btn-danger-ghost" onClick={onResetAll}><Icon name="alert" size={16} /> Reset all progress</button>
        </div>
      </div>
      <div className="card settings-card about">
        <Logo size={40} />
        <div>
          <div className="setting-title">ECE Quiz Bee Question Generator</div>
          <div className="muted small">{TAGLINE}</div>
        </div>
      </div>
    </div>
  );
}
