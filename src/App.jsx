import { useState, useRef, useEffect } from "react";

const GROUPS = {
  "Data Communications": ["line codes and PCM", "delta modulation", "Shannon capacity and Nyquist rate", "error detection and correction (CRC, Hamming)", "QAM/PSK/FSK bandwidth and bit rate", "TDM/FDM and T-carrier", "serial interfaces and protocols (RS-232, HDLC)", "BER and noise in digital links"],
  "Advanced Networking": ["IPv4 subnetting and VLSM", "IPv6 addressing", "routing protocols (OSPF, RIP, BGP)", "TCP/UDP and flow control", "VLAN, STP, switching", "QoS and MPLS", "network security", "wireless LAN and throughput"],
  "Broadcast Production Engineering": ["video standards, scan rates, aspect ratio", "color theory and chroma/luma", "audio levels, dB, mixing", "studio acoustics and lighting", "MPEG compression and bitrates", "SDI/HD video data rates", "camera optics and exposure", "timecode and synchronization"],
  "Broadcast Transmission and Distribution": ["AM and FM broadcast (bandwidth, deviation)", "ERP, antenna gain, field strength", "transmission line, VSWR, return loss", "digital TV (ISDB-T, DVB, ATSC)", "STL and microwave links", "satellite broadcast link budget", "cable TV distribution levels", "RF combiners and filters"],
  "All EST": ["fiber optics link budget", "satellite communications", "cellular and mobile systems", "microwave and radar", "antennas and propagation", "telephony and traffic (Erlang)", "DSP basics", "control systems", "IoT and embedded systems"],
  "All ELECS": ["diodes and rectifiers", "BJT biasing and amplifiers", "FET/MOSFET circuits", "op-amp circuits", "oscillators and filters", "power supplies and regulators", "digital logic and Boolean algebra", "flip-flops, counters, memory", "microprocessors", "DC/AC circuit analysis", "AM/FM modulation and noise", "transmission lines and EM waves"],
};
const STYLES = ["Mixed", "Conceptual", "Computation"];
const LEVELS = ["Easy", "Board level", "Hard"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Calls OUR backend (/api/generate), which holds the secret API key.
async function generate(group, sub, style, level, recent) {
  const want = style === "Mixed" ? pick(["conceptual", "computational", "computational"]) : style.toLowerCase();
  const prompt = `Write ONE ${level} Philippine ECE board exam multiple-choice question.
Subject: ${group}. Subtopic: ${sub}. Type: ${want}${want === "computational" ? " (requires a numerical calculation with given values and units)" : ""}.
Avoid repeating these: ${recent.join(" | ") || "none"}.
Rules: plain text only (no LaTeX), 4 choices, exactly one correct, numeric choices must include units, distractors based on common mistakes. Keep the solution short with formulas and steps.
Return ONLY JSON: {"question":"","choices":["","","",""],"answer":0,"solution":""} where answer is the index 0-3.`;

  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error("server error");
  const d = await r.json();
  const q = JSON.parse(d.text.replace(/```json|```/g, "").trim());
  if (!q.question || q.choices?.length !== 4) throw new Error("bad");
  return { ...q, group, sub };
}

export default function App() {
  const [sel, setSel] = useState(Object.keys(GROUPS));
  const [custom, setCustom] = useState("");
  const [style, setStyle] = useState("Mixed");
  const [level, setLevel] = useState("Board level");
  const [q, setQ] = useState(null);
  const [choice, setChoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState({ n: 0, ok: 0, streak: 0, best: 0, by: {} });
  const recent = useRef([]);
  const next = useRef(null);

  const pool = () => {
    const p = sel.map((g) => [g, pick(GROUPS[g])]);
    const c = custom.split("\n").map((s) => s.trim()).filter(Boolean);
    if (c.length) p.push(["Custom topics", pick(c)]);
    return p.length ? pick(p) : null;
  };
  const make = () => {
    const t = pool();
    if (!t) return Promise.reject(new Error("none"));
    return generate(t[0], t[1], style, level, recent.current.slice(-6));
  };

  const load = async () => {
    setErr(""); setChoice(null); setLoading(true);
    try {
      const nq = next.current ? await next.current : await make();
      next.current = null;
      recent.current.push(nq.question.slice(0, 80));
      setQ(nq);
      next.current = make().catch(() => null);
    } catch (e) {
      next.current = null;
      setErr(sel.length || custom.trim() ? "Couldn't generate a question. Try again." : "Pick at least one topic.");
    }
    setLoading(false);
  };

  const answer = (i) => {
    if (choice !== null) return;
    setChoice(i);
    const ok = i === q.answer;
    setStats((s) => {
      const b = s.by[q.group] || { n: 0, ok: 0 };
      const streak = ok ? s.streak + 1 : 0;
      return { n: s.n + 1, ok: s.ok + (ok ? 1 : 0), streak, best: Math.max(s.best, streak), by: { ...s.by, [q.group]: { n: b.n + 1, ok: b.ok + (ok ? 1 : 0) } } };
    });
  };

  useEffect(() => { next.current = null; }, [sel, custom, style, level]);
  const toggle = (g) => setSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  const pct = stats.n ? Math.round((stats.ok / stats.n) * 100) : 0;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", background: "#E9EEF0", color: "#13222B", minHeight: "100vh", padding: "20px 16px" }}>
      <style>{`
        .chip{border:1.5px solid #13222B;background:transparent;color:#13222B;padding:7px 12px;border-radius:4px;font:inherit;font-size:14px;cursor:pointer}
        .chip[aria-pressed=true]{background:#13222B;color:#E9EEF0}
        .chip:focus-visible,.opt:focus-visible,.go:focus-visible{outline:3px solid #D4811F;outline-offset:2px}
        .opt{display:flex;gap:12px;text-align:left;width:100%;padding:12px 14px;margin:8px 0;border:1.5px solid #13222B;background:#F6F8F9;color:#13222B;border-radius:4px;font:inherit;font-size:16px;cursor:pointer}
        .opt:disabled{cursor:default}
        .go{background:#D4811F;color:#13222B;border:2px solid #13222B;padding:12px 20px;font:inherit;font-weight:600;font-size:16px;border-radius:4px;cursor:pointer}
        .go:disabled{opacity:.6}
        textarea{width:100%;box-sizing:border-box;font:inherit;font-size:14px;padding:8px;border:1.5px solid #13222B;border-radius:4px;background:#F6F8F9;color:#13222B}
        h2{font-size:15px;margin:18px 0 8px;font-weight:600}
      `}</style>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Board Exam Drill</h1>
        <p style={{ margin: 0, color: "#44565F" }}>Endless ECE board-style questions with worked solutions.</p>

        <h2>Topics</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.keys(GROUPS).map((g) => (
            <button key={g} className="chip" aria-pressed={sel.includes(g)} onClick={() => toggle(g)}>{g}</button>
          ))}
        </div>
        <h2>Your own topics (one per line)</h2>
        <textarea rows={2} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Smith chart, Erlang B" />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <div>
            <h2>Question type</h2>
            <div style={{ display: "flex", gap: 8 }}>{STYLES.map((s) => <button key={s} className="chip" aria-pressed={style === s} onClick={() => setStyle(s)}>{s}</button>)}</div>
          </div>
          <div>
            <h2>Difficulty</h2>
            <div style={{ display: "flex", gap: 8 }}>{LEVELS.map((s) => <button key={s} className="chip" aria-pressed={level === s} onClick={() => setLevel(s)}>{s}</button>)}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "22px 0 12px", flexWrap: "wrap" }}>
          <button className="go" disabled={loading} onClick={load}>{loading ? "Generating…" : q ? "Next question" : "Start drilling"}</button>
          <span style={{ fontSize: 14 }}>
            Score {stats.ok}/{stats.n}{stats.n ? ` (${pct}%)` : ""} · Streak {stats.streak} · Best {stats.best}
          </span>
        </div>
        {err && <p role="alert" style={{ color: "#A32020" }}>{err}</p>}

        {q && (
          <div style={{ background: "#fff", border: "2px solid #13222B", borderRadius: 6, padding: 18 }}>
            <div style={{ fontSize: 13, color: "#44565F", marginBottom: 8 }}>{q.group}: {q.sub}</div>
            <p style={{ fontSize: 18, lineHeight: 1.5, margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{q.question}</p>
            {q.choices.map((c, i) => {
              const done = choice !== null;
              const right = done && i === q.answer;
              const wrong = done && i === choice && i !== q.answer;
              return (
                <button key={i} className="opt" disabled={done} onClick={() => answer(i)}
                  style={{ background: right ? "#CDE8D2" : wrong ? "#F3CFCB" : undefined, borderColor: right ? "#1F7A3A" : wrong ? "#A32020" : undefined }}>
                  <b>{"ABCD"[i]}.</b><span>{c}</span>
                </button>
              );
            })}
            {choice !== null && (
              <div style={{ marginTop: 14, borderTop: "1.5px solid #13222B", paddingTop: 12 }}>
                <b>{choice === q.answer ? "Correct." : `Answer: ${"ABCD"[q.answer]}.`}</b>
                <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{q.solution}</p>
              </div>
            )}
          </div>
        )}

        {Object.keys(stats.by).length > 0 && (
          <>
            <h2>By subject</h2>
            {Object.entries(stats.by).map(([g, v]) => (
              <div key={g} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0", borderBottom: "1px solid #B9C4C9" }}>
                <span>{g}</span><span>{v.ok}/{v.n} ({Math.round((v.ok / v.n) * 100)}%)</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}