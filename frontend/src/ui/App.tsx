import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot, LogOut, Moon, Sun, Zap, Clock, User, Sparkles, Send,
  ChevronRight, Settings, Trash2, Copy, Check, Search,
  ChevronDown, Sliders
} from "lucide-react";
import { AgentRun, AuthResponse, apiClient } from "../api/client";

type Theme = "light" | "dark";
type AuthMode = "login" | "register";

const PRESETS = [
  { name: "💻 Code Gen", text: "Write a clean, efficient TypeScript implementation of a binary search tree with insert, delete, and search. Explain time and space complexity." },
  { name: "✍️ Copywriter", text: "Write an engaging product announcement email for a new developer tool called 'NeuralDesk' — an AI Agent Workspace with live tracking and premium UI." },
  { name: "🔍 Code Review", text: "Analyze this code for security vulnerabilities, bugs, and performance improvements:\n\n```python\ndef get_user_data(user_id):\n    query = f\"SELECT * FROM users WHERE id = '{user_id}'\"\n```" },
  { name: "💡 Tech Explainer", text: "Explain the differences between REST, GraphQL, and gRPC. Include a comparison table on when to use each." },
];

const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "LLaMA 3.3 70b" },
  { id: "llama-3.1-8b-instant",    label: "LLaMA 3.1 8b" },
  { id: "gemma2-9b-it",            label: "Gemma 2 9b" },
];

export function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const [auth, setAuth]   = useState<AuthResponse | null>(null);
  const [runs, setRuns]   = useState<AgentRun[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!auth) return;
    apiClient.listAgentRuns(auth.access_token).then(setRuns).catch(() => setRuns([]));
  }, [auth]);

  return (
    <div className={`app-shell ${theme}`}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <nav className="nav-bar">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-icon"><Bot size={20} /></div>
            <div>
              <h1 className="brand-name">NeuralDesk</h1>
              <p className="brand-tagline">{auth ? `${auth.user.email.split("@")[0]}'s workspace` : "AI-powered operations"}</p>
            </div>
          </div>
          <div className="nav-actions">
            <button className="icon-btn" type="button" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {auth && (
              <button className="icon-btn" type="button" onClick={() => { setAuth(null); setRuns([]); }} aria-label="Sign out">
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {auth
          ? <Workspace token={auth.access_token} runs={runs} onRunCreated={r => setRuns(prev => [r, ...prev])} onRunDeleted={id => setRuns(prev => prev.filter(r => r.id !== id))} />
          : <AuthPanel onAuthenticated={setAuth} />
        }
      </main>
    </div>
  );
}

/* ─────────────────────────── Auth ─────────────────────────── */

function AuthPanel({ onAuthenticated }: { onAuthenticated: (a: AuthResponse) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const result = mode === "login"
        ? await apiClient.login(email, password)
        : await apiClient.register(email, password);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="hero-badge"><Sparkles size={13} /><span>Powered by AI</span></div>
          <h2 className="hero-title">Your intelligent command&nbsp;center</h2>
          <p className="hero-sub">Run AI agents, pick models, tune parameters and track everything — all in one place.</p>
          <div className="hero-features">
            {[
              { icon: <Zap size={15} />, text: "Instant LLaMA & Gemma inference" },
              { icon: <Sliders size={15} />, text: "Fine-tune temperature & max tokens" },
              { icon: <Clock size={15} />, text: "Full run history with search & delete" },
            ].map((f, i) => (
              <div key={i} className="hero-feature">{f.icon}<span>{f.text}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-avatar"><User size={22} /></div>
            <h3 className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</h3>
            <p className="auth-sub">{mode === "login" ? "Sign in to your workspace" : "Register a local agent profile"}</p>
          </div>
          <div className="tab-bar">
            {(["login", "register"] as AuthMode[]).map(item => (
              <button key={item} className={`tab-btn ${mode === item ? "tab-btn--active" : ""}`} type="button" onClick={() => { setMode(item); setError(null); }}>
                {item === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="auth-email">Email address</label>
              <input id="auth-email" className="field-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="auth-password">Password</label>
              <input id="auth-password" className="field-input" type="password" placeholder={mode === "register" ? "Min 12 characters" : "Your password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === "register" ? 12 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
            {error && <div className="error-banner"><span>{error}</span></div>}
            <button className="submit-btn" type="submit" disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              <span>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</span>
              {!busy && <ChevronRight size={16} className="btn-arrow" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Workspace ─────────────────────────── */

function Workspace({ token, runs, onRunCreated, onRunDeleted }: {
  token: string;
  runs: AgentRun[];
  onRunCreated: (r: AgentRun) => void;
  onRunDeleted: (id: string) => void;
}) {
  const [prompt, setPrompt]             = useState("");
  const [busy, setBusy]                 = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [latestRun, setLatestRun]       = useState<AgentRun | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [model, setModel]               = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature]   = useState(0.7);
  const [maxTokens, setMaxTokens]       = useState(2048);

  // History sidebar
  const [search, setSearch]             = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return runs;
    const q = search.toLowerCase();
    return runs.filter(r => r.prompt.toLowerCase().includes(q) || r.response.toLowerCase().includes(q));
  }, [runs, search]);

  async function handleRun(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setBusy(true); setError(null); setLatestRun(null);
    try {
      const run = await apiClient.runAgent(prompt, token, model, temperature, maxTokens);
      setLatestRun(run);
      onRunCreated(run);
      // don't clear the prompt so the user can see what they asked
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed.");
    } finally {
      setBusy(false);
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  return (
    <div className="workspace workspace--chat">
      {/* ── Main chat column ── */}
      <div className="chat-column">

        {/* Header */}
        <div className="panel-header">
          <Zap size={17} className="panel-icon" />
          <h2 className="panel-title">Agent Control Panel</h2>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="icon-btn"
              type="button"
              title="Advanced parameters"
              style={showSettings ? { borderColor: "var(--accent)", background: "var(--accent-subtle)", color: "var(--accent)" } : {}}
              onClick={() => setShowSettings(s => !s)}
            >
              <Settings size={15} />
            </button>
            <span className="char-badge">{prompt.length}/8000</span>
          </div>
        </div>

        {/* Preset bar */}
        <div style={{ display: "flex", gap: 8, padding: "10px 20px 0", overflowX: "auto", flexWrap: "nowrap" }}>
          {PRESETS.map((p, i) => (
            <button key={i} type="button" onClick={() => setPrompt(p.text)} style={{
              background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 20,
              padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s ease", flexShrink: 0,
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--accent-subtle)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-input)"; }}
            >{p.name}</button>
          ))}
        </div>

        {/* Settings drawer */}
        {showSettings && (
          <div style={{ background: "var(--bg-surface-strong)", borderBottom: "1px solid var(--border)", padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, animation: "slideDown .25s ease-out" }}>
            <div className="field">
              <label className="field-label">Model</label>
              <select className="field-input" style={{ cursor: "pointer" }} value={model} onChange={e => setModel(e.target.value)}>
                {MODELS.map(m => <option key={m.id} value={m.id} style={{ background: "var(--bg)" }}>{m.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Temperature: <strong style={{ color: "var(--accent)" }}>{temperature}</strong></label>
              <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={e => setTemperature(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}><span>Deterministic</span><span>Creative</span></div>
            </div>
            <div className="field">
              <label className="field-label">Max Tokens: <strong style={{ color: "var(--accent)" }}>{maxTokens}</strong></label>
              <input type="range" min={256} max={8192} step={256} value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}><span>Short</span><span>Long</span></div>
            </div>
          </div>
        )}

        {/* Prompt form */}
        <form className="prompt-form" onSubmit={handleRun} style={{ flex: "none" }}>
          <div className="textarea-wrap">
            <textarea
              id="prompt"
              className="prompt-textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              maxLength={8000}
              required
              placeholder={"Describe what you want the AI agent to do…\n\ne.g. Summarize the latest trends in machine learning, or help me write a Python script that…"}
            />
          </div>
          {error && <div className="error-banner"><span>{error}</span></div>}
          <div className="prompt-footer">
            <span className="hint-tag" style={{ border: "1px solid var(--border)", fontSize: 11 }}>
              {MODELS.find(m => m.id === model)?.label ?? model}
            </span>
            <button className="run-btn" type="submit" disabled={busy || !prompt.trim()}>
              {busy ? <><span className="spinner spinner--sm" /><span>Running…</span></> : <><Send size={15} /><span>Run Agent</span></>}
            </button>
          </div>
        </form>

        {/* ── Response area — shows directly below the prompt ── */}
        {(busy || latestRun) && (
          <div ref={responseRef} className="response-area" style={{ animation: "fadeIn .3s ease-in-out" }}>
            {busy ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 20px", color: "var(--text-muted)" }}>
                <span className="spinner" />
                <span style={{ fontSize: 14 }}>Agent is thinking…</span>
              </div>
            ) : latestRun ? (
              <ResponseCard run={latestRun} />
            ) : null}
          </div>
        )}
      </div>

      {/* ── History sidebar ── */}
      <div className="history-panel">
        <div className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={17} className="panel-icon" />
            <h2 className="panel-title">Run History</h2>
            {filtered.length > 0 && <span className="count-badge">{filtered.length}</span>}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search runs…" className="field-input" value={search} onChange={e => setSearch(e.target.value)}
              style={{ height: 32, paddingLeft: 30, fontSize: 12, borderRadius: 8, width: "100%", background: "var(--bg-input)" }} />
          </div>
        </div>

        <div className="run-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Bot size={28} /></div>
              <p className="empty-title">{runs.length === 0 ? "No runs yet" : "No matches"}</p>
              <p className="empty-sub">{runs.length === 0 ? "Your agent history appears here" : "Try a different search"}</p>
            </div>
          ) : filtered.map(run => (
            <HistoryCard key={run.id} run={run} token={token} onDeleted={() => onRunDeleted(run.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Inline response card (below prompt) ─────────── */
function ResponseCard({ run }: { run: AgentRun }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(run.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Question bubble */}
      <div style={{
        background: "var(--accent-subtle)", border: "1px solid var(--accent)", borderRadius: "12px 12px 4px 12px",
        padding: "12px 16px", marginBottom: 12, fontSize: 14, color: "var(--text-primary)", fontWeight: 500,
        lineHeight: 1.55
      }}>
        {run.prompt}
      </div>

      {/* Answer bubble */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px 12px 12px 12px",
        padding: "16px", position: "relative"
      }}>
        {/* header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", display: "grid", placeItems: "center" }}>
              <Bot size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Response</span>
            {run.model && <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "2px 8px" }}>{run.model.split("-")[0]} • T:{run.temperature}</span>}
          </div>
          <button type="button" onClick={copy} style={{
            display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
            color: copied ? "var(--success)" : "var(--text-secondary)", border: "1px solid var(--border)",
            background: "var(--bg-surface-strong)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", transition: "all .15s",
          }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* response body */}
        <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {run.response}
        </div>

        {/* footer meta */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
          <Clock size={11} />
          <span>{new Date(run.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Compact history card (right sidebar) ─────────── */
function HistoryCard({ run, token, onDeleted }: { run: AgentRun; token: string; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(run.response);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function del(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this run?")) return;
    setDeleting(true);
    try { await apiClient.deleteAgentRun(run.id, token); onDeleted(); }
    catch { alert("Failed to delete."); setDeleting(false); }
  }

  return (
    <article className="run-card" onClick={() => setExpanded(x => !x)} style={{ opacity: deleting ? 0.4 : 1, pointerEvents: deleting ? "none" : "auto" }}>
      <div className="run-card-head">
        <div className="run-dot" />
        <p className="run-prompt">{run.prompt}</p>
        <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
          <button type="button" onClick={del} title="Delete" style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, borderRadius: 4, display: "grid", placeItems: "center", transition: "all .15s" }}
            onMouseOver={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "var(--danger-bg)"; }}
            onMouseOut={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
            <Trash2 size={12} />
          </button>
          <ChevronDown size={14} className="run-chevron" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s ease", color: "var(--text-muted)" }} />
        </div>
      </div>

      {expanded && (
        <div className="run-response" style={{ animation: "fadeIn .2s ease-in-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase" }}>Response</span>
            <button type="button" onClick={copy} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: copied ? "var(--success)" : "var(--text-secondary)", border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{run.response}</p>
        </div>
      )}

      <div className="run-meta" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} />
          <span>{new Date(run.created_at).toLocaleString()}</span>
        </div>
        {run.model && <span style={{ fontSize: 10 }}>{run.model.split("-")[0]} • T:{run.temperature}</span>}
      </div>
    </article>
  );
}
