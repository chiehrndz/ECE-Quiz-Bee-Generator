import { useState, useRef, useEffect, useCallback } from "react";
import {
  ALL, EMPTY_STATS, MISTAKES_KEY, PROGRESS_KEY, SELECTED_KEY, SETTINGS_KEY, STATS_KEY,
  applyResult, customItems, generate, itemsOf, load, pick,
} from "./data.js";
import { Icon, Logo } from "./icons.jsx";
import { ConfirmDialog, Toasts } from "./ui.jsx";
import { FORMULA_LOG_KEY, formulasFromQuestion, mergeFormulas } from "./formulaLog.js";
import { ExamView, ResultsView, RetryModal } from "./exam.jsx";
import {
  Dashboard, FormulasView, MistakesView, PerformanceView, SettingsView, SetupView, TopicsView,
} from "./pages.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "practice", label: "Practice", icon: "target" },
  { id: "mock", label: "Mock Examination", icon: "clipboard" },
  { id: "topics", label: "Topics", icon: "book" },
  { id: "mistakes", label: "Review Mistakes", icon: "retry" },
  { id: "performance", label: "Performance", icon: "chart" },
  { id: "formulas", label: "Formula Reference", icon: "sigma" },
  { id: "settings", label: "Settings", icon: "sliders" },
];
const TITLES = { ...Object.fromEntries(NAV.map((n) => [n.id, n.label])), exam: "Examination", results: "Results" };

const setAt = (arr, i, v) => {
  const c = arr.slice();
  c[i] = v;
  return c;
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(() => load(SELECTED_KEY, []));
  const [progress, setProgress] = useState(() => load(PROGRESS_KEY, {}));
  const [stats, setStats] = useState(() => ({ ...EMPTY_STATS, ...load(STATS_KEY, {}) }));
  const [mistakes, setMistakes] = useState(() => load(MISTAKES_KEY, []));
  const [formulaLog, setFormulaLog] = useState(() => load(FORMULA_LOG_KEY, []));
  const [settings, setSettings] = useState(() => ({ theme: "system", collapsed: false, secPerQ: 90, ...load(SETTINGS_KEY, {}) }));
  const [custom, setCustom] = useState("");
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState("Board Level");
  const [type, setType] = useState("Mixed");
  const [count, setCount] = useState(0); // 0 = unlimited (the original behavior)
  const [setupErr, setSetupErr] = useState("");
  const [ex, setEx] = useState(null);
  const [result, setResult] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [retry, setRetry] = useState(null);
  const [tick, setTick] = useState(0);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

  const examId = useRef(0);
  const cfg = useRef(null);
  const recent = useRef([]);
  const pending = useRef({});
  const exRef = useRef(null);
  exRef.current = ex;

  /* ---------- persistence ---------- */
  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => { localStorage.setItem(SELECTED_KEY, JSON.stringify(selected)); }, [selected]);
  useEffect(() => { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes)); }, [mistakes]);
  useEffect(() => { localStorage.setItem(FORMULA_LOG_KEY, JSON.stringify(formulaLog)); }, [formulaLog]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  /* ---------- theme ---------- */
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const theme = settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  /* ---------- notifications ---------- */
  const notify = (msg, kind = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, msg, kind }].slice(-3));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  /* ---------- topic selection (original behavior) ---------- */
  const pool = () => {
    const set = new Set(selected);
    return [...ALL.filter((x) => set.has(x.key)), ...customItems(custom)];
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

  /* ---------- question loading ---------- */
  const loadQuestion = useCallback((i) => {
    const id = examId.current;
    if (pending.current[i] || !cfg.current) return;
    pending.current[i] = true;
    const c = cfg.current;
    generate(pick(c.pool), c.level, c.type, recent.current.slice(-6))
      .then((nq) => {
        if (examId.current !== id) return;
        recent.current.push(nq.question.slice(0, 80));
        setFormulaLog((log) => mergeFormulas(log, formulasFromQuestion(nq)));
        setEx((e) => (e && e.id === id ? { ...e, qs: setAt(e.qs, i, nq), err: { ...e.err, [i]: false } } : e));
      })
      .catch(() => {
        if (examId.current !== id) return;
        setEx((e) => (e && e.id === id ? { ...e, err: { ...e.err, [i]: true } } : e));
      })
      .finally(() => {
        if (examId.current !== id) return;
        delete pending.current[i];
        setTick((t) => t + 1);
      });
  }, []);

  // Keep the current and next question loaded (mock exams keep preloading in order).
  useEffect(() => {
    if (!ex || view !== "exam") return;
    const limit = ex.total ?? Infinity;
    const need = [ex.idx, ex.idx + 1];
    if (ex.mode === "mock") for (let i = 0; i < ex.total; i++) need.push(i);
    let slots = 2 - Object.keys(pending.current).length;
    for (const i of need) {
      if (i >= limit || ex.qs[i] || ex.err[i] || pending.current[i]) continue;
      if (i === ex.idx || slots > 0) {
        loadQuestion(i);
        slots--;
      }
    }
  }, [ex, view, tick, loadQuestion]);

  /* ---------- recording results ---------- */
  const recordAnswers = (list) => {
    if (!list.length) return;
    setProgress((p) => {
      const n = { ...p };
      for (const { q, choice } of list) {
        const b = n[q.item.key] || { n: 0, ok: 0 };
        n[q.item.key] = { n: b.n + 1, ok: b.ok + (choice === q.answer ? 1 : 0) };
      }
      return n;
    });
    setStats((s) => list.reduce((a, { q, choice }) => applyResult(a, q, choice), s));
    const wrong = list.filter(({ q, choice }) => choice !== q.answer);
    if (wrong.length) {
      setMistakes((m) => {
        const incoming = wrong.map(({ q, choice }) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ts: Date.now(),
          q,
          chosen: choice,
        }));
        const texts = new Set(incoming.map((x) => x.q.question));
        return [...incoming, ...m.filter((x) => !texts.has(x.q.question))].slice(0, 60);
      });
    }
  };

  /* ---------- exam lifecycle ---------- */
  const startExam = () => {
    const p = pool();
    if (!p.length) {
      setSetupErr("Pick at least one topic or add a custom topic.");
      return;
    }
    setSetupErr("");
    const mode = view === "mock" ? "mock" : "practice";
    const total = mode === "mock" ? count || 10 : count || null;
    examId.current += 1;
    pending.current = {};
    recent.current = [];
    cfg.current = { pool: p, level, type };
    setEx({
      id: examId.current, mode, total, qs: [], err: {}, idx: 0, answers: [], submitted: [], marked: [],
      startedAt: Date.now(), limit: mode === "mock" ? total * settings.secPerQ : null,
    });
    setResult(null);
    setView("exam");
  };

  const summarize = (e) => {
    const isMock = e.mode === "mock";
    const rows = [];
    const upto = isMock ? e.total : e.qs.length;
    for (let i = 0; i < upto; i++) {
      const q = e.qs[i];
      if (!q || (!isMock && !e.submitted[i])) continue;
      const choice = e.answers[i] ?? null;
      rows.push({ n: i + 1, q, choice, ok: choice === q.answer });
    }
    return {
      mode: e.mode,
      rows,
      ok: rows.filter((r) => r.ok).length,
      total: isMock ? e.total : rows.length,
      answered: rows.filter((r) => r.choice !== null).length,
      seconds: Math.round((Date.now() - e.startedAt) / 1000),
      level: cfg.current?.level,
      ts: Date.now(),
    };
  };
  const logHistory = (r) =>
    setStats((s) => ({
      ...s,
      history: [{ ts: r.ts, mode: r.mode, total: r.total, ok: r.ok, level: r.level, seconds: r.seconds }, ...s.history].slice(0, 50),
    }));

  const endSession = (e) => {
    examId.current += 1;
    pending.current = {};
    setEx(null);
    return e;
  };

  const finishExam = () => {
    const e = exRef.current;
    if (!e) return;
    const r = summarize(e);
    if (e.mode === "mock") recordAnswers(r.rows.filter((x) => x.choice !== null).map((x) => ({ q: x.q, choice: x.choice })));
    endSession(e);
    if (e.mode === "practice" && r.rows.length === 0) {
      setView("practice");
      notify("Session ended. No answers were submitted.");
      return;
    }
    logHistory(r);
    setResult(r);
    setView("results");
  };

  const requestFinish = () => {
    const e = exRef.current;
    if (!e) return;
    if (e.mode === "mock") {
      const unanswered = e.total - e.answers.filter((a) => a !== null && a !== undefined).length;
      const marked = e.marked.filter(Boolean).length;
      setDialog({
        title: "Submit your exam?",
        body: `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"} and ${marked} marked for review. You can't change answers after submitting.`,
        confirmLabel: "Submit exam",
        onConfirm: finishExam,
      });
    } else {
      setDialog({
        title: "End this session?",
        body: "Your submitted answers are already saved. You'll see a summary of this session next.",
        confirmLabel: "End session",
        onConfirm: finishExam,
      });
    }
  };

  const abandon = (target) => {
    const e = exRef.current;
    if (e && e.mode === "practice") {
      const r = summarize(e);
      if (r.rows.length) logHistory(r);
    }
    endSession(e);
    setView(target);
  };

  const go = (target) => {
    setNavOpen(false);
    if (view === "exam" && ex && target !== "exam") {
      const isMock = ex.mode === "mock";
      setDialog({
        title: "Leave this examination?",
        body: isMock
          ? "Your mock exam answers have not been submitted and will not be scored."
          : "Answers you've already submitted are saved. The current question will be discarded.",
        confirmLabel: "Leave",
        tone: "danger",
        onConfirm: () => abandon(target),
      });
      return;
    }
    setSetupErr("");
    setView(target);
  };

  /* ---------- exam interactions ---------- */
  const select = (i) =>
    setEx((e) => (!e || e.submitted[e.idx] ? e : { ...e, answers: setAt(e.answers, e.idx, i) }));
  const submitAnswer = () => {
    const e = exRef.current;
    if (!e) return;
    const q = e.qs[e.idx];
    const choice = e.answers[e.idx];
    if (!q || choice === null || choice === undefined || e.submitted[e.idx]) return;
    const at = e.idx;
    setEx((cur) => ({ ...cur, submitted: setAt(cur.submitted, at, true) }));
    recordAnswers([{ q, choice }]);
  };
  const goTo = (i) => setEx((e) => (e ? { ...e, idx: Math.max(0, i) } : e));
  const mark = () => setEx((e) => (e ? { ...e, marked: setAt(e.marked, e.idx, !e.marked[e.idx]) } : e));
  const retryGen = (i) => {
    setEx((e) => (e ? { ...e, err: { ...e.err, [i]: false } } : e));
    loadQuestion(i);
  };
  const onExpire = () => {
    notify("Time is up. Your exam was submitted automatically.", "error");
    finishExam();
  };

  /* ---------- mistakes & data ---------- */
  const onRetryResult = (m, ok) => {
    if (ok) {
      setMistakes((list) => list.filter((x) => x.id !== m.id));
      notify("Correct! Removed from your mistakes.", "success");
    } else {
      notify("Not yet. Review the explanation and try again.", "error");
    }
  };
  const confirmClearMistakes = () =>
    setDialog({
      title: "Clear all saved mistakes?",
      body: "This removes every question from Review Mistakes. Your accuracy statistics are not affected.",
      confirmLabel: "Clear mistakes",
      tone: "danger",
      onConfirm: () => {
        setMistakes([]);
        notify("Saved mistakes cleared.", "success");
      },
    });
  const confirmReset = () =>
    setDialog({
      title: "Reset all progress?",
      body: "This permanently deletes your answers, accuracy, streaks, history, and saved mistakes from this browser.",
      confirmLabel: "Reset everything",
      tone: "danger",
      onConfirm: () => {
        setProgress({});
        setStats(EMPTY_STATS);
        setMistakes([]);
        notify("All progress was reset.", "success");
      },
    });

  /* ---------- layout ---------- */
  const active = view === "exam" ? ex?.mode ?? "practice" : view === "results" ? result?.mode === "mock" ? "mock" : "practice" : view;
  const poolSize = selected.length + customItems(custom).length;
  const closeDialog = () => setDialog(null);

  return (
    <div className={`shell ${settings.collapsed ? "is-collapsed" : ""}`}>
      <a className="skip-link" href="#main">Skip to content</a>

      <aside className={`sidebar ${navOpen ? "open" : ""}`} aria-label="Primary">
        <div className="sb-brand">
          <Logo size={38} />
          <div className="sb-brand-text">
            <strong>ECE Quiz Bee</strong>
            <span>Question Generator</span>
          </div>
          <button className="icon-btn sb-close" aria-label="Close menu" onClick={() => setNavOpen(false)}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <nav className="sb-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`sb-item ${active === n.id ? "on" : ""}`}
              onClick={() => go(n.id)}
              aria-current={active === n.id ? "page" : undefined}
              data-tip={n.label}
            >
              <Icon name={n.icon} size={18} />
              <span className="sb-label">{n.label}</span>
              {n.id === "mistakes" && mistakes.length > 0 && <em className="badge">{mistakes.length}</em>}
            </button>
          ))}
        </nav>
        <button
          className="sb-item sb-collapse"
          onClick={() => setSettings((s) => ({ ...s, collapsed: !s.collapsed }))}
          data-tip={settings.collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={settings.collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={settings.collapsed ? "chevronRight" : "chevronLeft"} size={18} />
          <span className="sb-label">Collapse</span>
        </button>
      </aside>
      {navOpen && <div className="sb-backdrop" onClick={() => setNavOpen(false)} />}

      <div className="content">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <Icon name="menu" size={20} />
          </button>
          <div className="topbar-title">
            <span className="muted small">ECE Quiz Bee</span>
            <strong>{TITLES[view]}</strong>
          </div>
          <span className="spacer" />
          <div className="streak-pill" title="Current streak"><Icon name="flame" size={15} /> {stats.streak}</div>
          <button
            className="icon-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setSettings((s) => ({ ...s, theme: theme === "dark" ? "light" : "dark" }))}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
        </header>

        <main id="main" className="page" key={view === "exam" ? "exam" : view}>
          {view === "dashboard" && (
            <Dashboard
              progress={progress}
              stats={stats}
              onStart={startCategory}
              onPractice={() => go("practice")}
              onMock={() => go("mock")}
              onPerformance={() => go("performance")}
            />
          )}
          {(view === "practice" || view === "mock") && (
            <SetupView
              mode={view}
              setMode={(m) => setView(m)}
              selected={selected}
              setSelected={setSelected}
              onToggle={toggleKeys}
              filter={filter}
              setFilter={setFilter}
              custom={custom}
              setCustom={setCustom}
              level={level}
              setLevel={setLevel}
              type={type}
              setType={setType}
              count={count}
              setCount={setCount}
              secPerQ={settings.secPerQ}
              setSecPerQ={(v) => setSettings((s) => ({ ...s, secPerQ: v }))}
              poolSize={poolSize}
              onStart={startExam}
              progress={progress}
              error={setupErr}
            />
          )}
          {view === "exam" && ex && (
            <ExamView
              ex={ex}
              onSelect={select}
              onSubmit={submitAnswer}
              onGo={goTo}
              onMark={mark}
              onFinishRequest={requestFinish}
              onRetryGen={retryGen}
              onExpire={onExpire}
            />
          )}
          {view === "results" && result && (
            <ResultsView
              result={result}
              onAgain={() => setView(result.mode === "mock" ? "mock" : "practice")}
              onMistakes={() => setView("mistakes")}
              onHome={() => setView("dashboard")}
            />
          )}
          {view === "topics" && (
            <TopicsView
              selected={selected}
              onToggle={toggleKeys}
              filter={filter}
              setFilter={setFilter}
              progress={progress}
              onPractice={() => setView("practice")}
              onClear={() => setSelected([])}
            />
          )}
          {view === "mistakes" && (
            <MistakesView mistakes={mistakes} onRetry={setRetry} onClear={confirmClearMistakes} onPractice={() => setView("practice")} />
          )}
          {view === "performance" && <PerformanceView progress={progress} stats={stats} onPractice={() => setView("practice")} />}
          {view === "formulas" && <FormulasView learned={formulaLog} />}
          {view === "settings" && (
            <SettingsView settings={settings} setSettings={setSettings} onResetAll={confirmReset} onClearMistakes={confirmClearMistakes} />
          )}
        </main>
      </div>

      {retry && <RetryModal mistake={retry} onClose={() => setRetry(null)} onResult={(ok) => onRetryResult(retry, ok)} />}
      <ConfirmDialog
        open={!!dialog}
        title={dialog?.title}
        body={dialog?.body}
        confirmLabel={dialog?.confirmLabel}
        tone={dialog?.tone}
        onCancel={closeDialog}
        onConfirm={() => {
          const fn = dialog?.onConfirm;
          closeDialog();
          fn?.();
        }}
      />
      <Toasts items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
