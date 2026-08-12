import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot, Home, MessageSquare, FolderOpen, Star, Brain, Cpu, Settings,
  HelpCircle, LogOut, Send, Plus, Zap, Search, Code2, Sun, Moon,
  User, Copy, Check, Trash2, ChevronRight, Sparkles, Clock, Activity,
  ArrowUpRight, Play, FileText
} from "lucide-react";
import { AgentRun, AuthResponse, apiClient } from "../api/client";

/* ── types ── */
type Theme = "light" | "dark";
type AuthMode = "login" | "register";
type Page = "home" | "chat";

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
   AUTH
══════════════════════════════════════════════════ */
function AuthPage({ theme, toggleTheme, onAuthenticated }: { theme: Theme; toggleTheme(): void; onAuthenticated(a: AuthResponse): void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
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
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            {(["login","register"] as AuthMode[]).map(m=>(
              <button key={m} className={`a-tab${mode===m?" a-tab-on":""}`} onClick={()=>{setMode(m);setError(null);}}>
                {m==="login"?"Sign in":"Register"}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <div className="nd-field"><label>Email</label><input className="nd-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></div>
            <div className="nd-field"><label>Password</label><input className="nd-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="register"?"Min 12 characters":"••••••••"} required minLength={mode==="register"?12:1} autoComplete={mode==="login"?"current-password":"new-password"}/></div>
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
  const [navActive, setNavActive] = useState<string>("Home");
  const [model, setModel] = useState(MODELS[0].id);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  useEffect(() => { apiClient.listAgentRuns(auth.access_token).then(setRuns).catch(()=>{}); }, [auth]);

  const username = auth.user.email.split("@")[0];
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  function openChat(run?: AgentRun) {
    setActiveRun(run ?? null);
    setPage("chat");
    setNavActive("Chats");
  }

  function addRun(run: AgentRun) {
    setRuns(prev => [run, ...prev]);
    setActiveRun(run);
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-top">
          <div className="sb-brand"><Bot size={20}/><span>NeuralDesk</span></div>
          <nav className="sb-nav">
            {[
              { label:"Home",      icon:<Home size={16}/>        },
              { label:"Chats",     icon:<MessageSquare size={16}/>},
              { label:"Agents",    icon:<Cpu size={16}/>         },
              { label:"Files",     icon:<FolderOpen size={16}/>  },
              { label:"Favorites", icon:<Star size={16}/>        },
              { label:"Knowledge", icon:<Brain size={16}/>       },
              { label:"Settings",  icon:<Settings size={16}/>    },
            ].map(item=>(
              <button key={item.label}
                className={`sb-item${navActive===item.label?" sb-item-on":""}`}
                onClick={()=>{
                  setNavActive(item.label);
                  if(item.label==="Home"){setPage("home");setActiveRun(null);}
                  else if(item.label==="Chats"){setPage("chat");}
                }}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sb-bottom">
          <button className="sb-item" onClick={toggleTheme}>
            {theme==="dark"?<Sun size={16}/>:<Moon size={16}/>}<span>{theme==="dark"?"Light mode":"Dark mode"}</span>
          </button>
          <button className="sb-item"><HelpCircle size={16}/><span>Help</span></button>
          <button className="sb-item sb-logout" onClick={onSignOut}><LogOut size={16}/><span>Logout</span></button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Top nav */}
        <header className="topbar">
          <nav className="top-nav">
            {["Chat","Research","Code","Documents","Agents"].map((t,i)=>(
              <button key={t} className={`top-tab${i===0&&page==="chat"?" top-tab-on":i===4&&page==="home"?" top-tab-on":""}`}
                onClick={()=>{i===0?openChat():setPage("home");}}>
                {t}
              </button>
            ))}
          </nav>
          <div className="user-chip">
            <div className="u-avatar">{displayName[0]}</div>
          </div>
        </header>

        {/* Content */}
        <div className="content-area">
          {page === "home"
            ? <HomePage
                displayName={displayName}
                runs={runs}
                model={model}
                onOpenChat={openChat}
                onQuickAction={(_text: string)=>{setPage("chat");setNavActive("Chats");}}
                auth={auth}
                onRunCreated={addRun}
                selectedModel={model}
                onModelChange={setModel}
              />
            : <ChatPage
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
          }
        </div>

        {/* Global bottom input — shown on home page */}
        {page==="home" && (
          <QuickInput
            auth={auth} model={model}
            onRunCreated={run=>{addRun(run);setPage("chat");setNavActive("Chats");}}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HOME PAGE (Dashboard)
══════════════════════════════════════════════════ */
function HomePage({ displayName, runs, model, onOpenChat, auth, onRunCreated, selectedModel, onModelChange }: any) {
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
            <div key={i} className="suggestion-item">
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
   QUICK INPUT (home bottom bar)
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
function ChatPage({ auth, runs, activeRun, model, temperature, maxTokens, onModelChange, onTemperatureChange, onMaxTokensChange, onRunCreated, onSelectRun, onDeleteRun }: any) {
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
