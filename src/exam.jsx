import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { MathText, QuestionSkeleton, Ring, StatCard } from "./ui.jsx";
import { parseSolution, SECTION_LABELS } from "./mathParse.js";
import { LETTERS, fmtTime } from "./data.js";

/* ---------- Timer ---------- */
export function ExamTimer({ startedAt, limit, onExpire }) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = (now - startedAt) / 1000;
  const remaining = limit ? limit - elapsed : null;
  useEffect(() => {
    if (limit && remaining <= 0 && !fired.current) {
      fired.current = true;
      onExpire?.();
    }
  }, [limit, remaining, onExpire]);
  const low = limit && remaining <= 60;
  return (
    <div className={`timer ${low ? "low" : ""}`} aria-label={limit ? "Time remaining" : "Time elapsed"}>
      <Icon name="clock" size={16} />
      <span>{fmtTime(limit ? remaining : elapsed)}</span>
    </div>
  );
}

/* ---------- Solution: Given → Required → Formula → Solution → Final Answer ---------- */
export function Solution({ text, letter, answerText }) {
  const { sections } = useMemo(() => parseSolution(text), [text]);
  const finalSec = sections.find((s) => s.key === "final");
  const steps = sections.filter((s) => s.key !== "final");
  return (
    <div className="solution">
      <div className="solution-title"><Icon name="bulb" size={16} /> Step-by-step solution</div>
      {steps.map((s) => (
        <div key={s.key} className={`sol-sec sol-${s.key}`}>
          <div className="sol-label">{SECTION_LABELS[s.key]}</div>
          <div className="sol-body">
            {s.lines.map((l, i) =>
              s.key === "solution" ? (
                <div className="sol-step" key={i}>
                  <span className="sol-n">{i + 1}</span>
                  <MathText text={l} />
                </div>
              ) : (
                <div className={s.key === "formula" ? "sol-line formula-line" : "sol-line"} key={i}>
                  <MathText text={l} />
                </div>
              )
            )}
          </div>
        </div>
      ))}
      <div className="final-answer">
        <div className="sol-label">{SECTION_LABELS.final}</div>
        <div className="final-main">
          <span className="letter">{letter}</span>
          <MathText text={answerText} />
        </div>
        {finalSec && finalSec.lines.map((l, i) => (
          <div key={i} className="final-extra"><MathText text={l} /></div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Answer choices ---------- */
export function Choices({ q, choice, revealed, onSelect }) {
  return (
    <div className="choices" role="radiogroup" aria-label="Answer choices">
      {q.choices.map((c, i) => {
        const right = revealed && i === q.answer;
        const wrong = revealed && i === choice && i !== q.answer;
        const cls = [
          "choice",
          choice === i && !revealed ? "selected" : "",
          right ? "right" : "",
          wrong ? "wrong" : "",
          revealed && !right && !wrong ? "dim" : "",
        ].join(" ");
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={choice === i}
            className={cls}
            disabled={revealed}
            onClick={() => onSelect(i)}
          >
            <span className="letter">{LETTERS[i]}</span>
            <span className="choice-text"><MathText text={c} /></span>
            {right && <Icon name="checkCircle" size={20} className="choice-flag ok" />}
            {wrong && <Icon name="xCircle" size={20} className="choice-flag bad" />}
          </button>
        );
      })}
    </div>
  );
}

function Feedback({ q, choice }) {
  const ok = choice === q.answer;
  return (
    <div className={`feedback ${ok ? "ok" : "bad"}`} role="status">
      <Icon name={ok ? "checkCircle" : "xCircle"} size={22} />
      <div>
        <strong>{ok ? "Correct!" : "Not quite."}</strong>
        <span>
          {ok
            ? " Great work. Review the solution below to reinforce the method."
            : ` The correct answer is ${LETTERS[q.answer]}. Study the solution below.`}
        </span>
      </div>
    </div>
  );
}

/* ---------- Examination screen ---------- */
export function ExamView({ ex, onSelect, onSubmit, onGo, onMark, onFinishRequest, onRetryGen, onExpire }) {
  const { idx, mode, total } = ex;
  const q = ex.qs[idx];
  const failed = !q && ex.err[idx];
  const choice = ex.answers[idx] ?? null;
  const submitted = !!ex.submitted[idx];
  const isMock = mode === "mock";
  const lastIdx = total ? total - 1 : null;
  const isLast = lastIdx !== null && idx === lastIdx;
  const answeredCount = ex.answers.filter((a) => a !== null && a !== undefined).length;
  const progressPct = total ? Math.round(((idx + 1) / total) * 100) : 0;
  const navCount = total ?? Math.max(ex.qs.length, idx + 1);

  const handlers = useRef({});
  handlers.current = { onSelect, onSubmit, onGo, q, submitted, choice, isMock, isLast, idx };
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
      const h = handlers.current;
      if (!h.q) return;
      const k = e.key.toLowerCase();
      const n = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
      if (n >= 0 && !h.submitted) h.onSelect(n);
      else if (k === "enter" && !h.isMock && !h.submitted && h.choice !== null) h.onSubmit();
      else if (k === "arrowleft" && h.idx > 0) h.onGo(h.idx - 1);
      else if (k === "arrowright" && (h.isMock ? !h.isLast : h.submitted && !h.isLast)) h.onGo(h.idx + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navState = (i) => {
    const a = ex.answers[i];
    if (!isMock && ex.submitted[i]) return a === ex.qs[i]?.answer ? "right" : "wrong";
    return a !== null && a !== undefined ? "answered" : "";
  };

  return (
    <div className="exam">
      <div className="card exam-head">
        <div className="exam-head-top">
          <div>
            <div className="eyebrow">{isMock ? "Mock Examination" : "Practice Session"}</div>
            <h2 className="exam-title">
              Question {idx + 1}{total ? <span className="muted"> of {total}</span> : null}
            </h2>
          </div>
          <div className="exam-head-actions">
            <ExamTimer startedAt={ex.startedAt} limit={ex.limit} onExpire={onExpire} />
            <button className="btn btn-ghost btn-sm" onClick={onFinishRequest}>
              {isMock ? "Finish exam" : "End session"}
            </button>
          </div>
        </div>
        {total ? (
          <div className="meter" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Exam progress">
            <div className="meter-fill tone-accent" style={{ width: `${progressPct}%` }} />
          </div>
        ) : (
          <div className="muted small">{answeredCount} answered · unlimited practice</div>
        )}
      </div>

      <div className="exam-grid">
        <div className="exam-main">
          {!q && !failed && <QuestionSkeleton />}
          {failed && (
            <div className="card center-card">
              <Icon name="alert" size={28} />
              <h3>Couldn't generate this question</h3>
              <p className="muted">The AI service may be busy. Please try again.</p>
              <button className="btn btn-accent" onClick={() => onRetryGen(idx)}>Try again</button>
            </div>
          )}
          {q && (
            <article className="card question-card" key={idx}>
              <div className="chips-row">
                <span className="chip chip-navy">{q.item.catName}</span>
                <span className="chip">{q.item.subject}</span>
                <span className="chip chip-accent">{q.level}</span>
                <span className="chip">{q.type}</span>
              </div>
              <div className="q-sub">{q.item.sub}</div>
              <p className="question-text"><MathText text={q.question} /></p>

              <Choices q={q} choice={choice} revealed={!isMock && submitted} onSelect={onSelect} />

              {!isMock && submitted && (
                <>
                  <Feedback q={q} choice={choice} />
                  <Solution text={q.solution} letter={LETTERS[q.answer]} answerText={q.choices[q.answer]} />
                </>
              )}

              <div className="q-actions">
                <button className="btn btn-ghost" disabled={idx === 0} onClick={() => onGo(idx - 1)}>
                  <Icon name="arrowLeft" size={16} /> Previous
                </button>
                <button
                  className={`btn btn-ghost mark ${ex.marked[idx] ? "on" : ""}`}
                  onClick={onMark}
                  aria-pressed={!!ex.marked[idx]}
                >
                  <Icon name="flag" size={16} /> {ex.marked[idx] ? "Marked" : "Mark for review"}
                </button>
                <span className="spacer" />
                {!isMock && !submitted && (
                  <button className="btn btn-accent" disabled={choice === null} onClick={onSubmit}>
                    Submit answer <Icon name="check" size={16} />
                  </button>
                )}
                {!isMock && submitted && (isLast ? (
                  <button className="btn btn-accent" onClick={onFinishRequest}>See results <Icon name="trophy" size={16} /></button>
                ) : (
                  <button className="btn btn-accent" onClick={() => onGo(idx + 1)}>
                    Next question <Icon name="arrowRight" size={16} />
                  </button>
                ))}
                {isMock && (isLast ? (
                  <button className="btn btn-accent" onClick={onFinishRequest}>Finish exam <Icon name="check" size={16} /></button>
                ) : (
                  <button className="btn btn-accent" onClick={() => onGo(idx + 1)}>
                    Next <Icon name="arrowRight" size={16} />
                  </button>
                ))}
              </div>
              <div className="kbd-hint muted small">
                Shortcuts: A–D to choose{!isMock && ", Enter to submit"}, ← → to move.
              </div>
            </article>
          )}
        </div>

        <aside className="card qnav" aria-label="Question navigation">
          <h3>Question navigator</h3>
          <div className="qnav-grid">
            {Array.from({ length: navCount }, (_, i) => (
              <button
                key={i}
                className={`qn ${navState(i)} ${i === idx ? "current" : ""} ${ex.marked[i] ? "flagged" : ""}`}
                onClick={() => (isMock || i <= idx || ex.qs[i] ? onGo(i) : null)}
                disabled={!isMock && !ex.qs[i] && i > idx}
                aria-label={`Question ${i + 1}${ex.marked[i] ? ", marked for review" : ""}`}
                aria-current={i === idx ? "step" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <ul className="legend">
            <li><i className="qn current" /> Current</li>
            <li><i className="qn answered" /> Answered</li>
            {!isMock && <li><i className="qn right" /> Correct</li>}
            {!isMock && <li><i className="qn wrong" /> Incorrect</li>}
            <li><i className="qn flagged" /> Marked</li>
          </ul>
          <div className="qnav-foot">
            <div><strong>{answeredCount}</strong><span>Answered</span></div>
            <div><strong>{ex.marked.filter(Boolean).length}</strong><span>Marked</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Results ---------- */
export function ResultsView({ result, onAgain, onMistakes, onHome }) {
  const [filter, setFilter] = useState("all");
  const { rows, ok, total, answered, seconds, mode } = result;
  const pct = total ? Math.round((ok / total) * 100) : 0;
  const wrong = rows.filter((r) => r.choice !== null && !r.ok).length;
  const skipped = rows.filter((r) => r.choice === null).length;
  const msg =
    pct >= 85 ? "Outstanding! You're board-ready on these topics."
    : pct >= 70 ? "Great job. A little more practice will lock it in."
    : pct >= 50 ? "Solid effort. Review the mistakes to level up."
    : "Keep going. Every question you miss is a lesson learned.";
  const shown = rows.filter((r) => (filter === "wrong" ? !r.ok : true));

  return (
    <div className="results">
      <div className="card results-hero">
        <Ring value={pct} size={132} stroke={12} tone={pct >= 70 ? "success" : pct >= 50 ? "accent" : "danger"} sub="score" />
        <div className="results-copy">
          <div className="eyebrow">{mode === "mock" ? "Mock Examination Summary" : "Practice Session Summary"}</div>
          <h2>You scored {ok} out of {total}</h2>
          <p className="muted">{msg}</p>
          <div className="btn-row">
            <button className="btn btn-accent" onClick={onAgain}><Icon name="play" size={16} /> Practice again</button>
            {wrong > 0 && <button className="btn btn-ghost" onClick={onMistakes}><Icon name="retry" size={16} /> Review mistakes</button>}
            <button className="btn btn-ghost" onClick={onHome}>Dashboard</button>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="checkCircle" label="Correct" value={ok} tone="success" />
        <StatCard icon="xCircle" label="Incorrect" value={wrong} tone="danger" />
        <StatCard icon="flag" label={mode === "mock" ? "Unanswered" : "Skipped"} value={skipped} tone="navy" />
        <StatCard icon="clock" label="Time" value={fmtTime(seconds)} hint={answered ? `${fmtTime(seconds / answered)} per answer` : undefined} tone="accent" />
      </div>

      <div className="card">
        <div className="section-head">
          <h3>Question review</h3>
          <div className="seg seg-sm" role="radiogroup" aria-label="Filter questions">
            {[["all", "All"], ["wrong", "Missed"]].map(([v, l]) => (
              <button key={v} role="radio" aria-checked={filter === v} className={filter === v ? "on" : ""} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        {shown.length === 0 && <p className="muted center">Nothing missed. Perfect run!</p>}
        <div className="review-list">
          {shown.map((r) => (
            <details key={r.n} className={`review-item ${r.choice === null ? "skip" : r.ok ? "ok" : "bad"}`}>
              <summary>
                <span className="rv-badge"><Icon name={r.choice === null ? "flag" : r.ok ? "check" : "x"} size={14} /></span>
                <span className="rv-num">Q{r.n}</span>
                <span className="rv-text"><MathText text={r.q.question} /></span>
                <Icon name="chevronDown" size={16} className="rv-caret" />
              </summary>
              <div className="rv-body">
                <Choices q={r.q} choice={r.choice} revealed onSelect={() => {}} />
                <Solution text={r.q.solution} letter={LETTERS[r.q.answer]} answerText={r.q.choices[r.q.answer]} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Retry modal (Review Mistakes) ---------- */
export function RetryModal({ mistake, onClose, onResult }) {
  const q = mistake.q;
  const [choice, setChoice] = useState(null);
  const [done, setDone] = useState(false);
  const closeRef = useRef(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeFn.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const submit = () => {
    setDone(true);
    onResult(choice === q.answer);
  };
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Retry question">
        <div className="modal-top">
          <div className="eyebrow">Retry · {q.item.subject}</div>
          <button ref={closeRef} className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <p className="question-text"><MathText text={q.question} /></p>
        <Choices q={q} choice={choice} revealed={done} onSelect={setChoice} />
        {done && (
          <>
            <Feedback q={q} choice={choice} />
            <Solution text={q.solution} letter={LETTERS[q.answer]} answerText={q.choices[q.answer]} />
          </>
        )}
        <div className="modal-actions">
          {!done ? (
            <button className="btn btn-accent" disabled={choice === null} onClick={submit}>Submit answer</button>
          ) : (
            <button className="btn btn-accent" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}
