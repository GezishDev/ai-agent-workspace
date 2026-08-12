import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot, Home, MessageSquare, FolderOpen, Star, Brain, Cpu, Settings,
  HelpCircle, LogOut, Send, Plus, Zap, Search, Code2, Sun, Moon,
  User, Copy, Check, Trash2, ChevronRight, Sparkles, Clock, Activity,
  ArrowUpRight, Play, FileText, Database, ShieldCheck, Key, Terminal,
  ExternalLink, FileCode, CheckCircle2, Sliders, Layers, Eye, EyeOff
} from "lucide-react";
import { AgentRun, AuthResponse, apiClient } from "../api/client";

/* ── types ── */
type Theme = "light" | "dark";
type AuthMode = "login" | "register";
type Page = "home" | "chat" | "agents" | "files" | "favorites" | "knowledge" | "settings" | "help";

/* ── constants ── */
const MODELS = [
  { id: "llama-3.3-70b-versatile", short: "LLaMA 3.3 · 70B", badge: "Pro" },
  { id: "llama-3.1-8b-instant",    short: "LLaMA 3.1 · 8B",  badge: "Fast" },
  { id: "gemma2-9b-it",            short: "Gemma 2 · 9B",     badge: "Compact" },
];

const QUICK_ACTIONS = [
  { icon: <Code2 size={16}/>,    label: "Generate Code",  color: "#6366f1", text: "Write a clean, well-documented TypeScript function that implements debounce with proper typing." },
  { icon: <Search size={16}/>,   label: "Start Research", color: "#06b6d4", text: "Research and summarize the latest developments in large language model efficiency improvements in 2025-2026." },
  { icon: <Zap size={16}/>,      label: "Debug Code",     color: "#f59e0b", text: "Analyze and fix this code snippet for bugs, performance issues, and best practices: " },
  { icon: <FileText size={16}/>, label: "Draft Document", color: "#10b981", text: "Draft a professional technical specification document for a REST API with authentication, rate limiting, and versioning." },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ══════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════ */
export function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const [auth, setAuth] = useState<AuthResponse | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="nd-root" data-theme={theme}>
      {auth
        ? <MainApp auth={auth} theme={theme} toggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} onSignOut={() => setAuth(null)} />
        : <AuthPage theme={theme} toggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} onAuthenticated={setAuth} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   AUTH PAGE
══════════════════════════════════════════════════ */
function AuthPage({ theme, toggleTheme, onAuthenticated }: { theme: Theme; toggleTheme(): void; onAuthenticated(a: AuthResponse): void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true); setError(null);
    try {
      const r = mode === "login" ? await apiClient.login(email, password) : await apiClient.register(email, password);
      onAuthenticated(r);
    } catch (err) { setError(err instanceof Error ? err.message : "Authentication failed."); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-1"/><div className="auth-orb auth-orb-2"/><div className="auth-orb auth-orb-3"/>
      <nav className="auth-nav">
        <div className="brand"><Bot size={22}/><span>NeuralDesk</span></div>
        <button className="icon-btn" onClick={toggleTheme}>{theme==="dark"?<Sun size={16}/>:<Moon size={16}/>}</button>
      </nav>
      <div className="auth-body">
        <div className="auth-hero">
          <div className="hero-pill"><Sparkles size={12}/><span>AI Agent Workspace</span></div>
          <h1>Think it. Type it.<br/><span className="g-text">Done.</span></h1>
          <p>Run AI agents, pick models, and track every run in one stunning workspace.</p>

          <div className="auth-features">
            <div className="af-item"><ShieldCheck size={16}/> <span>Enterprise JWT Auth &amp; Password Hashing</span></div>
            <div className="af-item"><Cpu size={16}/> <span>LLaMA 3.3 70B &amp; Gemma Multi-Model Support</span></div>
            <div className="af-item"><Zap size={16}/> <span>Non-blocking Async LangGraph Workflow Engine</span></div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            {(["login","register"] as AuthMode[]).map(m=>(
              <button key={m} className={`a-tab${mode===m?" a-tab-on":""}`} onClick={()=>{setMode(m);setError(null);setConfirmPassword("");}}>
                {m==="login"?"Sign in":"Register"}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <div className="nd-field">
              <label>Email</label>
              <input className="nd-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/>
            </div>

            <div className="nd-field">
              <label>Password</label>
              <div className="password-input-wrap">
                <input
                  className="nd-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder={mode==="register"?"Min 12 characters":"••••••••"}
                  required
                  minLength={mode==="register"?12:1}
                  autoComplete={mode==="login"?"current-password":"new-password"}
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(s => !s)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="nd-field">
                <label>Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    className="nd-input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e=>setConfirmPassword(e.target.value)}
                    placeholder="Retype password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(s => !s)} title={showConfirmPassword ? "Hide password" : "Show password"}>
                    {showConfirmPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="auth-err">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy?<span className="spin"/>:null}{busy?"Please wait…":mode==="login"?"Sign in →":"Create account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP SHELL
══════════════════════════════════════════════════ */
function MainApp({ auth, theme, toggleTheme, onSignOut }: { auth: AuthResponse; theme: Theme; toggleTheme(): void; onSignOut(): void }) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [page, setPage] = useState<Page>("home");
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [model, setModel] = useState(MODELS[0].id);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("fav_runs") || "[]"); } catch { return []; }
  });

  useEffect(() => { apiClient.listAgentRuns(auth.access_token).then(setRuns).catch(()=>{}); }, [auth]);

  useEffect(() => {
    localStorage.setItem("fav_runs", JSON.stringify(favorites));
  }, [favorites]);

  const username = auth.user.email.split("@")[0];
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  function openChat(run?: AgentRun, _promptText?: string) {
    setActiveRun(run ?? null);
    setPage("chat");
  }

  function addRun(run: AgentRun) {
    setRuns(prev => [run, ...prev]);
    setActiveRun(run);
  }

  function toggleFavorite(runId: string) {
    setFavorites(prev => prev.includes(runId) ? prev.filter(id => id !== runId) : [...prev, runId]);
  }

  const sidebarNav: { label: string; page: Page; icon: React.ReactNode }[] = [
    { label: "Home",      page: "home",      icon: <Home size={16}/> },
    { label: "Chats",     page: "chat",      icon: <MessageSquare size={16}/> },
    { label: "Agents",    page: "agents",    icon: <Cpu size={16}/> },
    { label: "Files",     page: "files",     icon: <FolderOpen size={16}/> },
    { label: "Favorites", page: "favorites", icon: <Star size={16}/> },
    { label: "Knowledge", page: "knowledge", icon: <Brain size={16}/> },
    { label: "Settings",  page: "settings",  icon: <Settings size={16}/> },
  ];

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-top">
          <div className="sb-brand"><Bot size={20}/><span>NeuralDesk</span></div>
          <nav className="sb-nav">
            {sidebarNav.map(item=>(
              <button key={item.label}
                className={`sb-item${page===item.page?" sb-item-on":""}`}
                onClick={()=>{
                  setPage(item.page);
                  if (item.page === "home") setActiveRun(null);
                }}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sb-bottom">
          <button className={`sb-item${page==="help"?" sb-item-on":""}`} onClick={() => setPage("help")}>
            <HelpCircle size={16}/><span>Help</span>
          </button>
          <button className="sb-item" onClick={toggleTheme}>
            {theme==="dark"?<Sun size={16}/>:<Moon size={16}/>}<span>{theme==="dark"?"Light mode":"Dark mode"}</span>
          </button>
          <button className="sb-item sb-logout" onClick={onSignOut}><LogOut size={16}/><span>Logout</span></button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Top nav */}
        <header className="topbar">
          <nav className="top-nav">
            {[
              { label: "Chat", page: "chat" as Page },
              { label: "Research", page: "knowledge" as Page },
              { label: "Code", page: "files" as Page },
              { label: "Documents", page: "files" as Page },
              { label: "Agents", page: "agents" as Page },
            ].map(t => (
              <button key={t.label}
                className={`top-tab${page===t.page?" top-tab-on":""}`}
                onClick={()=>setPage(t.page)}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="user-chip">
            <div className="u-avatar">{displayName[0]}</div>
          </div>
        </header>

        {/* Content */}
        <div className="content-area">
          {page === "home" && (
            <HomePage
              displayName={displayName}
              runs={runs}
              onOpenChat={openChat}
              selectedModel={model}
              onModelChange={setModel}
            />
          )}

          {page === "chat" && (
            <ChatPage
              auth={auth}
              runs={runs}
              activeRun={activeRun}
              model={model}
              temperature={temperature}
              maxTokens={maxTokens}
              onModelChange={setModel}
              onTemperatureChange={setTemperature}
              onMaxTokensChange={setMaxTokens}
              onRunCreated={addRun}
              onSelectRun={setActiveRun}
              onDeleteRun={(id: string)=>{setRuns(p=>p.filter(r=>r.id!==id));if(activeRun?.id===id)setActiveRun(null);}}
            />
          )}

          {page === "agents" && (
            <AgentsPage onLaunchAgent={(agentPrompt, agentModel) => {
              if (agentModel) setModel(agentModel);
              openChat(undefined, agentPrompt);
            }}/>
          )}

          {page === "files" && (
            <FilesPage runs={runs}/>
          )}

          {page === "favorites" && (
            <FavoritesPage
              runs={runs}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenRun={openChat}
            />
          )}

          {page === "knowledge" && (
            <KnowledgePage />
          )}

          {page === "settings" && (
            <SettingsPage
              theme={theme}
              toggleTheme={toggleTheme}
              auth={auth}
              model={model}
              onModelChange={setModel}
              temperature={temperature}
              onTemperatureChange={setTemperature}
              maxTokens={maxTokens}
              onMaxTokensChange={setMaxTokens}
            />
          )}

          {page === "help" && (
            <HelpPage />
          )}
        </div>

        {/* Global bottom input — shown on home page */}
        {page==="home" && (
          <QuickInput
            auth={auth} model={model}
            onRunCreated={run=>{addRun(run);setPage("chat");}}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HOME PAGE (Dashboard)
══════════════════════════════════════════════════ */
function HomePage({ displayName, runs, onOpenChat, selectedModel, onModelChange }: {
  displayName: string;
  runs: AgentRun[];
  onOpenChat: (run?: AgentRun) => void;
  selectedModel: string;
  onModelChange: (m: string) => void;
}) {
  const recent = runs.slice(0, 3);
  const currentModel = MODELS.find(m=>m.id===selectedModel) ?? MODELS[0];

  return (
    <div className="home-page">
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-left">
          <h1 className="hero-greeting">{getGreeting()}, {displayName}.</h1>
          <p className="hero-sub">
            {runs.length === 0
              ? "Welcome to your AI workspace. Start your first conversation below."
              : `${runs.length} agent run${runs.length!==1?"s":""} in your history.`}
          </p>
          {runs.length > 0 && (
            <div className="ai-summary-box">
              <div className="ai-summary-label"><Sparkles size={12}/><span>AI DAILY SUMMARY</span></div>
              <p>"{runs[0].prompt.slice(0,120)}{runs[0].prompt.length>120?"…":""}"</p>
              <p className="ai-summary-meta">Last run · {timeAgo(runs[0].created_at)} · {MODELS.find(m=>m.id===runs[0].model)?.short ?? runs[0].model ?? "Unknown model"}</p>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="suggestions-panel">
          <div className="panel-label"><span>SUGGESTIONS</span></div>
          {QUICK_ACTIONS.slice(0,2).map((a,i)=>(
            <div key={i} className="suggestion-item" onClick={() => onOpenChat()}>
              <p className="sug-title">{a.label}</p>
              <p className="sug-sub">{i===0?"Frequently used action":"Try something new"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="dashboard-row">
        {/* Quick actions */}
        <div className="dash-card">
          <div className="panel-label"><Zap size={12}/><span>QUICK ACTIONS</span></div>
          <div className="qa-list">
            {QUICK_ACTIONS.map((a,i)=>(
              <button key={i} className="qa-item" onClick={()=>onOpenChat()}>
                <span className="qa-icon" style={{background:`${a.color}22`,color:a.color}}>{a.icon}</span>
                <span className="qa-label">{a.label}</span>
                <ArrowUpRight size={13} className="qa-arrow"/>
              </button>
            ))}
          </div>
        </div>

        {/* Recent work */}
        <div className="dash-card dash-card--wide">
          <div className="panel-label-row">
            <div className="panel-label"><Clock size={12}/><span>RECENT WORK</span></div>
            {runs.length>0 && <button className="view-all-btn" onClick={()=>onOpenChat()}>View All</button>}
          </div>
          {recent.length === 0 ? (
            <div className="rw-empty"><Bot size={28}/><p>No runs yet</p></div>
          ) : (
            <div className="rw-grid">
              {recent.map((run:AgentRun,i:number)=>(
                <button key={run.id} className="rw-card" onClick={()=>onOpenChat(run)}>
                  <div className="rw-card-head">
                    <div className="rw-icon" style={{background:["#6366f122","#06b6d422","#f59e0b22"][i%3],color:["#6366f1","#06b6d4","#f59e0b"][i%3]}}>
                      <Activity size={16}/>
                    </div>
                    <span className="rw-badge">Done</span>
                  </div>
                  <p className="rw-title">{run.prompt.slice(0,40)}{run.prompt.length>40?"…":""}</p>
                  <p className="rw-sub">{run.response.slice(0,60)}{run.response.length>60?"…":""}</p>
                  <div className="rw-bar"><div className="rw-bar-fill" style={{width:`${Math.min(100,run.response.length/20)}%`}}/></div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System */}
        <div className="dash-card">
          <div className="panel-label"><Cpu size={12}/><span>SYSTEM</span></div>
          <div className="sys-rows">
            <div className="sys-row">
              <span className="sys-key">Model</span>
              <span className="sys-val sys-val--accent">{currentModel.short}</span>
            </div>
            <div className="sys-row">
              <span className="sys-key">Status</span>
              <span className="sys-online"><span className="dot-green"/>Online &amp; Connected</span>
            </div>
            <div className="sys-row">
              <span className="sys-key">Runs Total</span>
              <span className="sys-val">{runs.length}</span>
            </div>
            <div className="sys-row-stack">
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span className="sys-key">History Usage</span>
                <span className="sys-val">{Math.min(100,runs.length*5)}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${Math.min(100,runs.length*5)}%`}}/></div>
            </div>
            <div className="sys-model-picker">
              <p className="sys-key" style={{marginBottom:6}}>Switch Model</p>
              {MODELS.map(m=>(
                <button key={m.id} className={`model-pick-btn${selectedModel===m.id?" model-pick-btn-on":""}`}
                  onClick={()=>onModelChange(m.id)}>
                  <span>{m.short}</span><span className="mp-badge">{m.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   QUICK INPUT
══════════════════════════════════════════════════ */
function QuickInput({ auth, model, onRunCreated }: { auth: AuthResponse; model: string; onRunCreated(r: AgentRun): void }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!val.trim() || busy) return;
    setBusy(true);
    try {
      const run = await apiClient.runAgent(val, auth.access_token, model, 0.7, 2048);
      onRunCreated(run); setVal("");
    } catch { /* handled in chat page */ }
    finally { setBusy(false); }
  }

  return (
    <div className="quick-input-shell">
      <div className="quick-input-box">
        <button className="qi-plus"><Plus size={16}/></button>
        <input
          className="qi-input"
          value={val}
          onChange={e=>setVal(e.target.value)}
          placeholder="Message NeuralDesk or type '/' for commands…"
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        />
        <button className={`qi-send${val.trim()&&!busy?" qi-send-on":""}`} onClick={send} disabled={!val.trim()||busy}>
          {busy?<span className="spin spin-sm"/>:<Send size={15}/>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CHAT PAGE
══════════════════════════════════════════════════ */
function ChatPage({ auth, runs, activeRun, model, temperature, maxTokens, onModelChange, onTemperatureChange, onMaxTokensChange, onRunCreated, onSelectRun, onDeleteRun }: {
  auth: AuthResponse;
  runs: AgentRun[];
  activeRun: AgentRun | null;
  model: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (m: string) => void;
  onTemperatureChange: (t: number) => void;
  onMaxTokensChange: (mt: number) => void;
  onRunCreated: (r: AgentRun) => void;
  onSelectRun: (r: AgentRun | null) => void;
  onDeleteRun: (id: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[activeRun,busy]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!prompt.trim()||busy) return;
    const p = prompt; setPrompt(""); setBusy(true); setError(null);
    try {
      const run = await apiClient.runAgent(p, auth.access_token, model, temperature, maxTokens);
      onRunCreated(run);
    } catch(err) { setError(err instanceof Error ? err.message : "Failed."); setPrompt(p); }
    finally { setBusy(false); }
  }

  return (
    <div className="chat-page">
      {/* History sidebar */}
      <div className="chat-sidebar">
        <div className="cs-header">
          <MessageSquare size={14}/><span>Conversations</span>
        </div>
        {runs.length === 0 && <p className="cs-empty">No runs yet</p>}
        {runs.map((run: AgentRun)=>(
          <div key={run.id} className={`cs-item${activeRun?.id===run.id?" cs-item-on":""}`} onClick={()=>onSelectRun(run)}>
            <p className="cs-item-text">{run.prompt.slice(0,50)}{run.prompt.length>50?"…":""}</p>
            <div className="cs-item-meta">
              <span>{timeAgo(run.created_at)}</span>
              <button className="cs-del" onClick={e=>{e.stopPropagation();apiClient.deleteAgentRun(run.id,auth.access_token).then(()=>onDeleteRun(run.id)).catch(()=>alert("Delete failed"));}}><Trash2 size={11}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="chat-area">
        <div className="chat-messages">
          {!activeRun && !busy && (
            <div className="chat-welcome">
              <div className="cw-icon"><Bot size={32}/></div>
              <h2>How can I help you?</h2>
              <p>Type a message or choose a quick action to get started.</p>
              <div className="cw-presets">
                {QUICK_ACTIONS.map((a,i)=>(
                  <button key={i} className="cw-preset" onClick={()=>setPrompt(a.text)}>
                    <span style={{color:a.color}}>{a.icon}</span><span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeRun||busy) && (
            <>
              <div className="msg-user">
                <div className="msg-bubble-user">{activeRun?.prompt ?? prompt}</div>
                <div className="msg-av-user"><User size={14}/></div>
              </div>
              <div className="msg-ai">
                <div className="msg-av-ai"><Bot size={15}/></div>
                <div className="msg-bubble-ai">
                  {busy && !activeRun
                    ? <div className="think-dots"><span/><span/><span/></div>
                    : activeRun
                      ? <AiMsg run={activeRun}/>
                      : null}
                </div>
              </div>
            </>
          )}
          {error && <p className="chat-error">{error}</p>}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="chat-input-wrap">
          {showSettings && (
            <div className="settings-tray">
              <div className="st-field">
                <label className="st-label">Model</label>
                <select className="st-select" value={model} onChange={e=>onModelChange(e.target.value)}>
                  {MODELS.map(m=><option key={m.id} value={m.id}>{m.short}</option>)}
                </select>
              </div>
              <div className="st-field">
                <label className="st-label">Temperature <b style={{color:"#6366f1"}}>{temperature}</b></label>
                <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={e=>onTemperatureChange(+e.target.value)} className="st-range"/>
              </div>
              <div className="st-field">
                <label className="st-label">Max Tokens <b style={{color:"#6366f1"}}>{maxTokens}</b></label>
                <input type="range" min={256} max={8192} step={256} value={maxTokens} onChange={e=>onMaxTokensChange(+e.target.value)} className="st-range"/>
              </div>
            </div>
          )}
          <form className="ci-form" onSubmit={send}>
            <div className="ci-box">
              <button type="button" className="ci-plus" onClick={()=>setShowSettings(s=>!s)} title="Settings" style={showSettings?{color:"#6366f1"}:{}}>
                <Plus size={16}/>
              </button>
              <textarea
                className="ci-area"
                value={prompt}
                onChange={e=>setPrompt(e.target.value)}
                placeholder="Message NeuralDesk or type '/' for commands…"
                rows={1}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,180)+"px";}}
              />
              <button type="submit" className={`ci-send${prompt.trim()&&!busy?" ci-send-on":""}`} disabled={!prompt.trim()||busy}>
                {busy?<span className="spin spin-sm"/>:<Send size={15}/>}
              </button>
            </div>
          </form>
          <p className="ci-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   AI MESSAGE BUBBLE
══════════════════════════════════════════════════ */
function AiMsg({ run }: { run: AgentRun }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(run.response); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  return (
    <>
      <div className="ai-body">{run.response}</div>
      <div className="ai-footer">
        {run.model && <span className="ai-badge">{MODELS.find(m=>m.id===run.model)?.short ?? run.model} · T:{run.temperature}</span>}
        <button className="copy-chip" onClick={copy}>{copied?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}</button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   AGENTS PAGE
══════════════════════════════════════════════════ */
function AgentsPage({ onLaunchAgent }: { onLaunchAgent: (promptText: string, agentModel?: string) => void }) {
  const agentTemplates = [
    {
      title: "Code Architect Agent",
      badge: "Production Ready",
      desc: "Specialized in Python FastAPI, React TypeScript, and Clean Architecture refactoring.",
      icon: <Code2 size={20} color="#6366f1"/>,
      model: "llama-3.3-70b-versatile",
      prompt: "Refactor this architecture to follow strict Clean Architecture with domain, application, and infrastructure layers."
    },
    {
      title: "Deep Research Specialist",
      badge: "Analytical",
      desc: "Performs synthesis of technical documentation, scientific papers, and system trade-offs.",
      icon: <Search size={20} color="#06b6d4"/>,
      model: "llama-3.3-70b-versatile",
      prompt: "Perform a deep-dive research analysis comparing PostgreSQL vs SQLite for AI Agent persistence."
    },
    {
      title: "QA & Debugger Agent",
      badge: "High Precision",
      desc: "Analyzes stack traces, pytest failures, and runtime exceptions with exact root cause diagnosis.",
      icon: <Zap size={20} color="#f59e0b"/>,
      model: "llama-3.1-8b-instant",
      prompt: "Analyze the following error traceback, identify the exact line where the exception occurs, and provide the fix."
    },
    {
      title: "Technical Spec Writer",
      badge: "Documentation",
      desc: "Generates OpenAPI specifications, database schema diagrams, and README documentation.",
      icon: <FileText size={20} color="#10b981"/>,
      model: "gemma2-9b-it",
      prompt: "Write a comprehensive OpenAPI 3.0 technical specification for a multi-tenant AI Agent API."
    }
  ];

  return (
    <div className="generic-page">
      <div className="page-header">
        <div>
          <h2><Cpu size={22} color="var(--ac)"/> Agent Marketplace &amp; Roster</h2>
          <p>Deploy specialized AI agents tailored for specific software engineering workflows.</p>
        </div>
        <span className="cb-badge"><CheckCircle2 size={12}/> 4 Active Agents</span>
      </div>

      <div className="cards-grid">
        {agentTemplates.map((agent, i) => (
          <div key={i} className="card-box">
            <div className="cb-icon-head">
              <div className="cb-icon" style={{background:"var(--bg3)"}}>{agent.icon}</div>
              <span className="cb-badge">{agent.badge}</span>
            </div>
            <h3 className="cb-title">{agent.title}</h3>
            <p className="cb-desc">{agent.desc}</p>
            <div style={{marginTop:"auto", paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize:11, color:"var(--t3)"}}>{MODELS.find(m=>m.id===agent.model)?.short}</span>
              <button className="primary-btn" onClick={() => onLaunchAgent(agent.prompt, agent.model)}>
                Launch Agent <Play size={12}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FILES PAGE
══════════════════════════════════════════════════ */
function FilesPage({ runs }: { runs: AgentRun[] }) {
  const [search, setSearch] = useState("");

  const filteredRuns = useMemo(() => {
    if (!search.trim()) return runs;
    return runs.filter(r => r.prompt.toLowerCase().includes(search.toLowerCase()) || r.response.toLowerCase().includes(search.toLowerCase()));
  }, [runs, search]);

  return (
    <div className="generic-page">
      <div className="page-header">
        <div>
          <h2><FolderOpen size={22} color="var(--ac)"/> Workspace Files &amp; Outputs</h2>
          <p>Inspect code snippets, generated specs, and outputs produced by agent runs.</p>
        </div>
        <input
          className="search-bar-input"
          placeholder="Filter workspace files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filteredRuns.length === 0 ? (
        <div className="rw-empty"><FileCode size={32}/><p>No workspace files matching filter</p></div>
      ) : (
        <div className="files-list">
          {filteredRuns.map((run) => (
            <div key={run.id} className="file-row">
              <div className="file-left">
                <div className="file-icon"><FileText size={18}/></div>
                <div className="file-info">
                  <h4>Output_{run.id.slice(0, 8)}.txt</h4>
                  <p>Prompt: "{run.prompt.slice(0, 60)}…" · {timeAgo(run.created_at)}</p>
                </div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button className="secondary-btn" onClick={() => navigator.clipboard.writeText(run.response)}>
                  <Copy size={12}/> Copy Output
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FAVORITES PAGE
══════════════════════════════════════════════════ */
function FavoritesPage({ runs, favorites, onToggleFavorite, onOpenRun }: {
  runs: AgentRun[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenRun: (run: AgentRun) => void;
}) {
  const favRuns = runs.filter(r => favorites.includes(r.id));

  return (
    <div className="generic-page">
      <div className="page-header">
        <div>
          <h2><Star size={22} color="#f59e0b"/> Starred &amp; Favorite Runs</h2>
          <p>Quick access to bookmarked prompts and high-value agent responses.</p>
        </div>
        <span className="cb-badge">{favRuns.length} Saved Items</span>
      </div>

      {favRuns.length === 0 ? (
        <div className="rw-empty">
          <Star size={32} color="var(--t3)"/>
          <p>No favorites starred yet. Star any conversation run to save it here.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {favRuns.map((run) => (
            <div key={run.id} className="card-box">
              <div className="cb-icon-head">
                <div className="cb-icon" style={{background:"rgba(245,158,11,0.12)", color:"#f59e0b"}}><Star size={18}/></div>
                <button className="icon-btn" onClick={() => onToggleFavorite(run.id)} style={{color:"#f59e0b"}}>
                  <Star size={14} fill="#f59e0b"/>
                </button>
              </div>
              <h3 className="cb-title">{run.prompt.slice(0, 50)}</h3>
              <p className="cb-desc">{run.response.slice(0, 100)}…</p>
              <div style={{marginTop:"auto", paddingTop:12}}>
                <button className="primary-btn" onClick={() => onOpenRun(run)}>
                  Open Chat <ChevronRight size={12}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   KNOWLEDGE PAGE
══════════════════════════════════════════════════ */
function KnowledgePage() {
  const [docs, setDocs] = useState([
    { name: "FastAPI_Clean_Architecture_Spec.pdf", chunks: 42, size: "1.2 MB", status: "Indexed" },
    { name: "Database_Schema_v2_PostgreSQL.json", chunks: 18, size: "480 KB", status: "Indexed" },
    { name: "LangGraph_StateGraph_Reference.md", chunks: 29, size: "210 KB", status: "Indexed" },
  ]);

  return (
    <div className="generic-page">
      <div className="page-header">
        <div>
          <h2><Brain size={22} color="#06b6d4"/> Workspace Knowledge &amp; RAG</h2>
          <p>Manage documents, vector stores, and contextual memory used by agents.</p>
        </div>
        <button className="primary-btn" onClick={() => {
          setDocs(prev => [...prev, { name: `Context_Doc_${prev.length+1}.md`, chunks: 15, size: "150 KB", status: "Indexed" }]);
        }}>
          <Plus size={14}/> Add Context Document
        </button>
      </div>

      <div className="cards-grid" style={{gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))"}}>
        <div className="card-box" style={{background:"var(--bg3)"}}>
          <span style={{fontSize:12, color:"var(--t2)"}}>Vector DB Status</span>
          <h3 style={{fontSize:20, color:"var(--ok)"}}>Connected &amp; Ready</h3>
          <p style={{fontSize:12, color:"var(--t3)"}}>89 Total Chunks Embedded</p>
        </div>
        <div className="card-box" style={{background:"var(--bg3)"}}>
          <span style={{fontSize:12, color:"var(--t2)"}}>Embedding Model</span>
          <h3 style={{fontSize:18, color:"var(--ac2)"}}>text-embedding-3-small</h3>
          <p style={{fontSize:12, color:"var(--t3)"}}>1536 Dimension vectors</p>
        </div>
      </div>

      <div className="files-list">
        {docs.map((doc, i) => (
          <div key={i} className="file-row">
            <div className="file-left">
              <div className="file-icon" style={{color:"#06b6d4"}}><Database size={18}/></div>
              <div className="file-info">
                <h4>{doc.name}</h4>
                <p>{doc.chunks} chunks embedded · {doc.size}</p>
              </div>
            </div>
            <span className="cb-badge" style={{background:"rgba(34,197,94,0.12)", color:"var(--ok)"}}>{doc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════════════ */
function SettingsPage({ theme, toggleTheme, auth, model, onModelChange, temperature, onTemperatureChange, maxTokens, onMaxTokensChange }: {
  theme: Theme;
  toggleTheme: () => void;
  auth: AuthResponse;
  model: string;
  onModelChange: (m: string) => void;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  maxTokens: number;
  onMaxTokensChange: (mt: number) => void;
}) {
  return (
    <div className="generic-page">
      <div className="page-header">
        <div>
          <h2><Settings size={22} color="var(--ac)"/> System &amp; AI Settings</h2>
          <p>Configure model hyper-parameters, security preferences, and API keys.</p>
        </div>
      </div>

      <div className="settings-group">
        <div className="sg-header"><Sliders size={16}/> Default Model Configuration</div>
        <div className="st-field">
          <label className="st-label">Default LLM Model</label>
          <select className="st-select" value={model} onChange={e => onModelChange(e.target.value)}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.short} ({m.badge})</option>)}
          </select>
        </div>

        <div className="st-field">
          <label className="st-label">Temperature: <b>{temperature}</b></label>
          <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={e=>onTemperatureChange(+e.target.value)} className="st-range"/>
        </div>

        <div className="st-field">
          <label className="st-label">Max Token Limit: <b>{maxTokens}</b></label>
          <input type="range" min={256} max={8192} step={256} value={maxTokens} onChange={e=>onMaxTokensChange(+e.target.value)} className="st-range"/>
        </div>
      </div>

      <div className="settings-group">
        <div className="sg-header"><Key size={16}/> API Connections</div>
        <div className="file-row">
          <div className="file-left">
            <div className="file-icon"><ShieldCheck size={18}/></div>
            <div className="file-info">
              <h4>Groq Cloud API Key</h4>
              <p>Primary inference engine for LLaMA &amp; Gemma models</p>
            </div>
          </div>
          <span className="cb-badge">Configured</span>
        </div>
      </div>

      <div className="settings-group">
        <div className="sg-header"><User size={16}/> Account &amp; JWT Authentication</div>
        <div style={{fontSize:13, color:"var(--t2)"}}>
          <p><b>User Email:</b> {auth.user.email}</p>
          <p><b>Account Status:</b> Active</p>
          <p><b>Session Token:</b> Bearer JWT (30-minute expiration)</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HELP PAGE
══════════════════════════════════════════════════ */
function HelpPage() {
  return (
    <div className="generic-page">
      <div className="page-header">
        <div>
          <h2><HelpCircle size={22} color="var(--ac)"/> Help &amp; Command Reference</h2>
          <p>User manual, keyboard shortcuts, and backend API architecture documentation.</p>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card-box">
          <h3 className="cb-title"><Terminal size={18}/> Keyboard Shortcuts</h3>
          <div style={{fontSize:13, color:"var(--t2)", display:"flex", flexDirection:"column", gap:8}}>
            <div><kbd style={{background:"var(--bg3)", padding:"2px 6px", borderRadius:4}}>Enter</kbd> Send prompt</div>
            <div><kbd style={{background:"var(--bg3)", padding:"2px 6px", borderRadius:4}}>Shift + Enter</kbd> Insert line break</div>
            <div><kbd style={{background:"var(--bg3)", padding:"2px 6px", borderRadius:4}}>/</kbd> Trigger prompt command menu</div>
          </div>
        </div>

        <div className="card-box">
          <h3 className="cb-title"><Layers size={18}/> Backend Architecture</h3>
          <p className="cb-desc">FastAPI + LangGraph + Async SQLAlchemy with Repository Pattern &amp; User Isolation.</p>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="secondary-btn" style={{marginTop:"auto", alignSelf:"flex-start"}}>
            Swagger API Docs <ExternalLink size={12}/>
          </a>
        </div>
      </div>
    </div>
  );
}
