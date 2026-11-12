import { useEffect, useMemo, useRef } from "react";
import { Icon } from "./icons.jsx";
import { parseMath } from "./mathParse.js";

/* ---------- Math typography ---------- */
function renderNodes(nodes, key = "") {
  return nodes.map((n, i) => {
    const k = `${key}.${i}`;
    switch (n.t) {
      case "sup":
        return <sup key={k}>{renderNodes(n.c, k)}</sup>;
      case "sub":
        return <sub key={k}>{renderNodes(n.c, k)}</sub>;
      case "frac":
        return (
          <span key={k} className="frac">
            <span className="num">{renderNodes(n.n, k + "n")}</span>
            <span className="den">{renderNodes(n.d, k + "d")}</span>
          </span>
        );
      case "sqrt":
        return (
          <span key={k} className="sqrt">
            <span className="rad">√</span>
            <span className="rad-body">{renderNodes(n.c, k)}</span>
          </span>
        );
      default:
        return n.v;
    }
  });
}

export function MathText({ text, className = "" }) {
  const nodes = useMemo(() => parseMath(text), [text]);
  return <span className={`math ${className}`}>{renderNodes(nodes)}</span>;
}

/* ---------- Segmented control ---------- */
export function Segmented({ label, options, value, onChange, size = "md" }) {
  return (
    <div className={`seg seg-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={value === v ? "on" : ""}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Dialog ---------- */
export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", tone = "primary", onConfirm, onCancel, children }) {
  const cancelRef = useRef(null);
  const cancelFn = useRef(onCancel);
  cancelFn.current = onCancel;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && cancelFn.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className={`modal-icon tone-${tone}`}>
          <Icon name={tone === "danger" ? "alert" : "info"} size={22} />
        </div>
        <h3>{title}</h3>
        {body && <p className="muted">{body}</p>}
        {children}
        <div className="modal-actions">
          <button ref={cancelRef} className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${tone === "danger" ? "btn-danger" : "btn-accent"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
export function Toasts({ items, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <Icon name={t.kind === "error" ? "xCircle" : t.kind === "success" ? "checkCircle" : "info"} size={18} />
          <span>{t.msg}</span>
          <button className="icon-btn" aria-label="Dismiss notification" onClick={() => onDismiss(t.id)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Empty state / skeleton ---------- */
export function EmptyState({ icon = "inbox", title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={28} /></div>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function QuestionSkeleton() {
  return (
    <div className="card q-skeleton" aria-busy="true" aria-label="Generating question">
      <div className="sk sk-line" style={{ width: "30%" }} />
      <div className="sk sk-line" style={{ width: "92%", height: 18 }} />
      <div className="sk sk-line" style={{ width: "78%", height: 18 }} />
      {[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-opt" />)}
    </div>
  );
}

/* ---------- Charts ---------- */
export function Ring({ value, size = 96, stroke = 10, label, sub, tone = "accent" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? pct + "%"} ${sub ?? ""}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring-fill tone-${tone}`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-text">
        <strong>{label ?? `${Math.round(pct)}%`}</strong>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

export function BarRow({ label, value, detail, tone = "accent", icon }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="bar-row">
      <div className="bar-row-head">
        <span className="bar-row-label">{icon && <Icon name={icon} size={15} />}{label}</span>
        <span className="muted small">{detail}</span>
      </div>
      <div className="meter" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`meter-fill tone-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ColumnChart({ data, height = 160, emptyText = "No data yet" }) {
  if (!data.length) return <p className="muted small center">{emptyText}</p>;
  return (
    <div className="cols" style={{ "--h": `${height}px` }} role="img" aria-label="Score by examination">
      <div className="cols-grid" aria-hidden="true">
        {[100, 50, 0].map((g) => <span key={g}><i>{g}</i></span>)}
      </div>
      <div className="cols-bars">
        {data.map((d, i) => (
          <div key={i} className="col" title={`${d.label}: ${d.value}%`}>
            <div className="col-track">
              <div className={`col-fill tone-${d.value >= 75 ? "success" : d.value >= 50 ? "accent" : "danger"}`} style={{ height: `${Math.max(d.value, 3)}%` }}>
                <span>{d.value}</span>
              </div>
            </div>
            <small>{d.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, hint, tone = "navy" }) {
  return (
    <div className="stat">
      <div className={`stat-icon tone-bg-${tone}`}><Icon name={icon} size={18} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}
