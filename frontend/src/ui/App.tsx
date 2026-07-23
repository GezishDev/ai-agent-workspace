import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, LogOut, Moon, Play, ShieldCheck, Sun, Zap, Clock, User, Sparkles, Send, ChevronRight, Sliders, Settings, Trash2, Copy, Check, Search, FileText } from "lucide-react";
import { AgentRun, AuthResponse, apiClient } from "../api/client";

type Theme = "light" | "dark";
type AuthMode = "login" | "register";

const PRESETS = [
  { name: "💻 Code Gen", text: "Write a clean, efficient TypeScript implementation of a binary search tree with operations for insert, delete, and search. Explain the time and space complexity." },
  { name: "✍️ Copywriter", text: "Write an engaging, high-converting product announcement email for a new developer tool called 'NeuralDesk'—an AI Agent Workspace that features live tracking, model parameters config, and premium glassmorphic UI." },
  { name: "🔍 Code Review", text: "Analyze the following code for security vulnerabilities, bugs, and performance improvements: \n\n```python\ndef get_user_data(user_id):\n    query = f\"SELECT * FROM users WHERE id = '{user_id}'\"\n    # execute query...\n```" },
  { name: "💡 Tech Explainer", text: "Explain the core differences between REST, GraphQL, and gRPC in simple terms. Include a Markdown comparison table highlighting when to use which." }
];

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "LLaMA 3.3 70b (Fast & Smart)" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7b (Deep Reasoning)" },
  { id: "gemma2-9b-it", name: "Gemma 2 9b (Compact & Clever)" },
  { id: "llama-3.1-8b-instant", name: "LLaMA 3.1 8b (Instant Speed)" }
];

export function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!auth) return;
    apiClient.listAgentRuns(auth.access_token).then(setRuns).catch(() => setRuns([]));
  }, [auth]);

  const workspaceName = useMemo(() => {
    return auth?.user.email.split("@")[0] ?? "workspace";
  }, [auth]);

  return (
    <div className={`app-shell ${theme}`}>
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* Nav */}
      <nav className="nav-bar">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-icon">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="brand-name">NeuralDesk</h1>
              <p className="brand-tagline">
                {auth ? `${workspaceName}'s workspace` : "AI-powered operations"}
              </p>
            </div>
          </div>
          <div className="nav-actions">
            <button
              className="icon-btn"
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {auth && (
              <button
                className="icon-btn"
                type="button"
                aria-label="Sign out"
                onClick={() => { setAuth(null); setRuns([]); }}
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        {auth ? (
          <Workspace
            token={auth.access_token}
            runs={runs}
            onRunCreated={(run) => setRuns([run, ...runs])}
            onRunDeleted={(id) => setRuns(runs.filter(r => r.id !== id))}
          />
        ) : (
          <AuthPanel onAuthenticated={setAuth} />
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────── Auth ──────────────────────────────── */

function AuthPanel({ onAuthenticated }: { onAuthenticated: (auth: AuthResponse) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result =
        mode === "login"
          ? await apiClient.login(email, password)
          : await apiClient.register(email, password);
      onAuthenticated(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper">
      {/* Left panel – hero */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="hero-badge">
            <Sparkles size={13} />
            <span>Powered by AI</span>
          </div>
          <h2 className="hero-title">Your intelligent command&nbsp;center</h2>
          <p className="hero-sub">
            Run AI agents, configure model parameters, track history, and manage operations in real time.
          </p>
          <div className="hero-features">
            {[
              { icon: <Zap size={15} />, text: "Instant LLaMA & Mixtral inference" },
              { icon: <Sliders size={15} />, text: "Fine-tune Temperature & Max Tokens" },
              { icon: <Clock size={15} />, text: "Expanded run log with delete options" },
            ].map((f, i) => (
              <div key={i} className="hero-feature">
                {f.icon}
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-avatar">
              <User size={22} />
            </div>
            <h3 className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</h3>
            <p className="auth-sub">
              {mode === "login" ? "Sign in to your workspace" : "Register a local agent profile"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="tab-bar">
            {(["login", "register"] as AuthMode[]).map((item) => (
              <button
                key={item}
                className={`tab-btn ${mode === item ? "tab-btn--active" : ""}`}
                type="button"
                onClick={() => { setMode(item); setError(null); }}
              >
                {item === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="field-input"
                type="password"
                placeholder={mode === "register" ? "Min 12 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "register" ? 12 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="error-banner">
                <span>{error}</span>
              </div>
            )}

            <button className="submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="spinner" />
              ) : (
                <ShieldCheck size={17} />
              )}
              <span>{isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</span>
              {!isSubmitting && <ChevronRight size={16} className="btn-arrow" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Workspace ───────────────────────────── */

function Workspace({
  token,
  runs,
  onRunCreated,
  onRunDeleted,
}: {
  token: string;
  runs: AgentRun[];
  onRunCreated: (run: AgentRun) => void;
  onRunDeleted: (id: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced settings states
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  // Search filter state
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return runs;
    const query = searchQuery.toLowerCase();
    return runs.filter(run => 
      run.prompt.toLowerCase().includes(query) || 
      run.response.toLowerCase().includes(query)
    );
  }, [runs, searchQuery]);

  async function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setError(null);
    try {
      const run = await apiClient.runAgent(prompt, token, selectedModel, temperature, maxTokens);
      onRunCreated(run);
      setPrompt("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Agent run failed.");
    } finally {
      setIsRunning(false);
    }
  }

  const handleSelectPreset = (presetText: string) => {
    setPrompt(presetText);
  };

  return (
    <div className="workspace">
      {/* Prompt panel */}
      <div className="prompt-panel">
        <div className="panel-header">
          <Zap size={17} className="panel-icon" />
          <h2 className="panel-title">Agent Control Panel</h2>
          <div className="panel-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className={`icon-btn ${showSettings ? "icon-btn--active" : ""}`}
              style={showSettings ? { borderColor: 'var(--accent)', background: 'var(--accent-subtle)', color: 'var(--accent)' } : {}}
              type="button"
              title="Toggle Advanced Parameters"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={16} />
            </button>
            <span className="char-badge">{prompt.length}/8000</span>
          </div>
        </div>

        {/* Prompt Presets Bar */}
        <div className="presets-container" style={{ padding: '12px 20px 0 20px', display: 'flex', gap: '8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-tag"
              onClick={() => handleSelectPreset(p.text)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--accent-subtle)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'var(--bg-input)';
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Advanced Settings Drawer */}
        {showSettings && (
          <div className="settings-drawer" style={{
            background: 'var(--bg-surface-strong)',
            borderBottom: '1px solid var(--border)',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            animation: 'slideDown 0.25s ease-out'
          }}>
            <div className="field">
              <label className="field-label">Model Selection</label>
              <select
                className="field-input"
                style={{ width: '100%', cursor: 'pointer' }}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Temperature: <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{temperature}</span></label>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                className="temp-slider"
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                  height: '6px',
                  borderRadius: '4px',
                  background: 'var(--border)',
                  cursor: 'pointer'
                }}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Deterministic (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Max Tokens: <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{maxTokens}</span></label>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                  height: '6px',
                  borderRadius: '4px',
                  background: 'var(--border)',
                  cursor: 'pointer'
                }}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Short (256)</span>
                <span>Long (8192)</span>
              </div>
            </div>
          </div>
        )}

        <form className="prompt-form" onSubmit={handleRun}>
          <div className="textarea-wrap">
            <textarea
              id="prompt"
              className="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={8000}
              required
              placeholder="Describe what you want the AI agent to do…&#10;&#10;e.g. Summarize the latest trends in machine learning, or help me write a Python script that…"
            />
          </div>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          <div className="prompt-footer">
            <div className="prompt-hints">
              <span className="hint-tag" style={{ border: '1px solid var(--border)' }}>
                Active model: {MODELS.find(m => m.id === selectedModel)?.name.split(" (")[0]}
              </span>
            </div>
            <button
              className="run-btn"
              type="submit"
              disabled={isRunning || prompt.trim().length === 0}
            >
              {isRunning ? (
                <>
                  <span className="spinner spinner--sm" />
                  <span>Running…</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Run Agent</span>
                  <Play size={14} className="btn-play" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History panel */}
      <div className="history-panel">
        <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={17} className="panel-icon" />
            <h2 className="panel-title">Run History</h2>
            {filteredRuns.length > 0 && <span className="count-badge">{filteredRuns.length}</span>}
          </div>
          
          {/* Search bar inside header */}
          <div className="search-wrap" style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search runs..."
              className="field-input"
              style={{
                height: '32px',
                paddingLeft: '32px',
                fontSize: '12px',
                borderRadius: '8px',
                width: '100%',
                background: 'var(--bg-input)'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="run-list">
          {filteredRuns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bot size={28} />
              </div>
              <p className="empty-title">{runs.length === 0 ? "No runs yet" : "No matches found"}</p>
              <p className="empty-sub">{runs.length === 0 ? "Your agent results will appear here" : "Try a different search query"}</p>
            </div>
          ) : (
            filteredRuns.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                token={token}
                onDeleted={() => onRunDeleted(run.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RunCard({
  run,
  token,
  onDeleted
}: {
  run: AgentRun;
  token: string;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(run.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this run?")) {
      setIsDeleting(true);
      try {
        await apiClient.deleteAgentRun(run.id, token);
        onDeleted();
      } catch (err) {
        console.error("Failed to delete agent run", err);
        alert("Failed to delete agent run.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <article
      className="run-card"
      onClick={() => setExpanded(!expanded)}
      style={{
        opacity: isDeleting ? 0.4 : 1,
        pointerEvents: isDeleting ? 'none' : 'auto',
        transition: 'all 0.25s ease'
      }}
    >
      <div className="run-card-head">
        <div className="run-dot" />
        <p className="run-prompt">{run.prompt}</p>
        
        {/* Actions inside header */}
        <div className="run-card-actions" style={{ display: 'flex', gap: '4px', marginLeft: '6px', alignItems: 'center' }}>
          <button
            type="button"
            className="card-action-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.background = 'var(--danger-bg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={handleDelete}
            title="Delete Run"
          >
            <Trash2 size={13} />
          </button>
          
          <ChevronRight size={14} className={`run-chevron ${expanded ? "run-chevron--open" : ""}`} />
        </div>
      </div>
      
      {expanded && (
        <div className="run-response" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Response
            </span>
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopy}
              style={{
                display: 'flex',
                align_items: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '600',
                color: copied ? 'var(--success)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                if (!copied) e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseOut={(e) => {
                if (!copied) e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{run.response}</p>
        </div>
      )}
      
      <div className="run-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} />
          <span>{new Date(run.created_at).toLocaleString()}</span>
        </div>
        {run.model && (
          <div style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)', fontSize: '10px' }}>
            <span>{run.model.split("-")[0]}</span>
            <span>•</span>
            <span>T:{run.temperature}</span>
          </div>
        )}
      </div>
    </article>
  );
}
