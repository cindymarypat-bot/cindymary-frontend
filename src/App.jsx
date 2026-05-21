// ═══════════════════════════════════════════════════════════
//  CINDYMARY COUTURE — App.jsx
//  Full client & admin portal — connects to Railway backend
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import api from "./api.js";
import "./App.css";

// ── Production stages (mirrors backend) ─────────────────────
const STAGES = [
  { id:1,  label:"Consultation Booking",        icon:"📅", days:1  },
  { id:2,  label:"Consultation Scheduled",      icon:"🗓️", days:2  },
  { id:3,  label:"Consultation Completed",      icon:"✅", days:1  },
  { id:4,  label:"Measurements Taken",          icon:"📐", days:1  },
  { id:5,  label:"Fabric Sourcing",             icon:"🧵", days:7  },
  { id:6,  label:"Pattern Drafting",            icon:"✏️", days:5  },
  { id:7,  label:"Sewing / Production",         icon:"🪡", days:14 },
  { id:8,  label:"Embellishment & Beading",     icon:"💎", days:7  },
  { id:9,  label:"Finishing & Quality Control", icon:"🔍", days:3  },
  { id:10, label:"Professional Video Review",   icon:"🎥", days:2  },
  { id:11, label:"Shipping",                    icon:"✈️", days:5  },
];

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = d =>
  new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

const today = () => new Date().toISOString().slice(0, 10);

function addDays(isoOrDate, n) {
  const d = new Date(isoOrDate);
  d.setDate(d.getDate() + n);
  return d;
}

function buildTimeline(order) {
  // Aggregate delays per stage
  const delayMap = {};
  (order.delays || []).forEach(d => {
    delayMap[d.stage_id] = (delayMap[d.stage_id] || 0) + d.days;
  });

  let cursor = new Date(order.start_date || order.stage_started || order.created_at);
return STAGES.map(s => {
  const delay = delayMap[s.id] || 0;
  const customDays = order.stage_days?.[s.id];
  const stageDays = customDays ?? s.days;
  const start = new Date(cursor);
  const end = addDays(cursor, stageDays + delay);
    cursor = end;
    return { ...s, start, end, delay };
  });
}
function deliveryRisk(order) {
  if (!order?.agreed_delivery_date) return null;

  const timeline = buildTimeline(order);
  const finalStage = timeline[timeline.length - 1];

  const finalDate = new Date(finalStage.end);
  const agreedDate = new Date(order.agreed_delivery_date);

  if (finalDate <= agreedDate) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLate = Math.ceil((finalDate - agreedDate) / msPerDay);

  return {
    daysLate,
    finalDate,
    agreedDate
  };
}

function stageProgress(order) {
  const done = (order.stage_history || []).length;
  return Math.round((done / STAGES.length) * 100);
}

function stagesDone(order) {
  return (order.stage_history || []).map(h => h.stage_id);
}

// ── Local demo fallback (when no backend yet) ─────────────────
const DEMO_ORDERS = [
  {
    id:"CM-2024-001", client_name:"Adaeze Okonkwo", client_email:"adaeze@example.com",
    client_phone:"+234 812 345 6789", location:"Nigeria", garment:"Aso-Oke Bridal Gown",
    current_stage:7, stage_started: new Date(Date.now()-3*86400000).toISOString(),
    assigned_to:"Amaka", notes:"Burgundy with gold beading. December wedding.",
    created_at: new Date(Date.now()-20*86400000).toISOString(),
    stage_history:[{stage_id:1},{stage_id:2},{stage_id:3},{stage_id:4},{stage_id:5},{stage_id:6}],
    delays:[{stage_id:5, days:2}],
    notifications:[
      {message:"Welcome to Cindymary Couture!", created_at:"2024-10-01"},
      {message:"Your consultation has been scheduled.", created_at:"2024-10-05"},
      {message:"Consultation completed — measurements taken.", created_at:"2024-10-10"},
      {message:"Fabric sourcing complete. Sewing has begun!", created_at:"2024-10-20"},
    ],
  },
  {
    id:"CM-2024-002", client_name:"Sophia Harrington", client_email:"sophia@example.com",
    client_phone:"+44 7911 123456", location:"UK", garment:"Evening Gown — Black-Tie",
    current_stage:9, stage_started: new Date(Date.now()-86400000).toISOString(),
    assigned_to:"Claire", notes:"Duchess satin, structured bodice. London delivery.",
    created_at: new Date(Date.now()-40*86400000).toISOString(),
    stage_history:[
      {stage_id:1},{stage_id:2},{stage_id:3},{stage_id:4},
      {stage_id:5},{stage_id:6},{stage_id:7},{stage_id:8}
    ],
    delays:[{stage_id:7, days:3}],
    notifications:[
      {message:"Welcome to Cindymary Couture!", created_at:"2024-09-15"},
      {message:"Consultation completed.", created_at:"2024-09-20"},
      {message:"Sewing & Production underway.", created_at:"2024-10-10"},
      {message:"Your gown is in Finishing & Quality Control.", created_at:"2024-10-20"},
    ],
  },
  {
    id:"CM-2024-003", client_name:"Funke Adeleke", client_email:"funke@example.com",
    client_phone:"+234 803 987 6543", location:"Nigeria", garment:"Birthday Dinner Dress",
    current_stage:3, stage_started: new Date().toISOString(),
    assigned_to:"Amaka", notes:"Coral tones. Specific embroidery references.",
    created_at: new Date(Date.now()-2*86400000).toISOString(),
    stage_history:[{stage_id:1},{stage_id:2}],
    delays:[],
    notifications:[
      {message:"Welcome to Cindymary Couture! Consultation booked.", created_at:"2024-10-28"},
    ],
  },
];

const DEMO_USERS = {
  "admin@cindymary.com":{ password:"admin123",  role:"admin",  name:"Admin" },
  "adaeze@example.com": { password:"client123", role:"client", name:"Adaeze Okonkwo",    orderId:"CM-2024-001" },
  "sophia@example.com": { password:"client123", role:"client", name:"Sophia Harrington", orderId:"CM-2024-002" },
  "funke@example.com":  { password:"client123", role:"client", name:"Funke Adeleke",     orderId:"CM-2024-003" },
};

// ═══════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{toast.type==="success"?"✓":toast.type==="error"?"✕":"ℹ"}</span>
      {toast.msg}
    </div>
  );
}

function Topbar({ user, onLogout, onMenuClick }) {
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick}>
  ☰
</button>
      <div className="topbar-brand">
        <span className="brand-cindy">CINDY</span>
        <span className="brand-mary">MARY</span>
        <span className="brand-couture"> COUTURE</span>
      </div>
      <div className="topbar-right">
        {user && (
          <>
            <span className="topbar-role">
              {user.role === "admin" ? "⚙ Admin Portal" : `◈ ${user.name.split(" ")[0]}`}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign Out</button>
          </>
        )}
      </div>
    </header>
  );
}

function Sidebar({ items, active, onSelect, bottom, menuOpen }) {
  return (
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <nav className="sidebar-nav">
        {items.map(group => (
          <div key={group.label} className="sidebar-group">
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map(item => (
              item.href
                ? <a key={item.key} href={item.href} target="_blank" rel="noreferrer"
                    className="sidebar-item">
                    <span className="sidebar-ico">{item.icon}</span>{item.label}
                  </a>
                : <button key={item.key}
                    className={`sidebar-item ${active===item.key?"sidebar-item--active":""}`}
                    onClick={() => onSelect(item.key)}>
                    <span className="sidebar-ico">{item.icon}</span>{item.label}
                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                  </button>
            ))}
          </div>
        ))}
      </nav>
      {bottom && <div className="sidebar-bottom">{bottom}</div>}
    </aside>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target.className==="modal-overlay" && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ pct, thin }) {
  return (
    <div className={`progress-track ${thin?"progress-thin":""}`}>
      <div className="progress-fill" style={{ width:`${pct}%` }} />
    </div>
  );
}

function Pill({ label, variant="dim" }) {
  return <span className={`pill pill-${variant}`}>{label}</span>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent?"stat-card--accent":""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return <input className="form-input" {...props} />;
}

function Select({ children, ...props }) {
  return <select className="form-input form-select" {...props}>{children}</select>;
}

function Textarea({ ...props }) {
  return <textarea className="form-input form-textarea" {...props} />;
}

// ── Tracking Rail ─────────────────────────────────────────────
function TrackingRail({ order }) {
  const tl   = buildTimeline(order);
  const done = stagesDone(order);

  return (
    <div className="track-rail">
      {tl.map((s, i) => {
        const isDone   = done.includes(s.id);
        const isActive = order.current_stage === s.id;
        const cls      = isDone ? "done" : isActive ? "active" : "pending";

        return (
          <div className={`track-step track-step--${cls}`} key={s.id}>
            <div className="track-dot-col">
              <div className={`track-dot track-dot--${cls}`}>
                {isDone ? "✓" : isActive ? s.icon : String(s.id).padStart(2,"0")}
              </div>
              {i < tl.length - 1 && (
                <div className={`track-line ${isDone?"track-line--done":""}`} />
              )}
            </div>
            <div className="track-content">
              <div className="track-label">{s.label}</div>
              <div className="track-meta">
                {fmtDate(s.start)} → {fmtDate(s.end)}
                {isActive && <span className="track-active-badge">● In Progress</span>}
                {isDone    && <span className="track-done-badge">Completed</span>}
              </div>
              {s.delay > 0 && (
                <div className="track-delay">⚠ +{s.delay} day{s.delay>1?"s":""} delay</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Notification list ─────────────────────────────────────────
function NotifList({ notifications }) {
  if (!notifications?.length) {
    return <div className="empty-state">No updates yet.</div>;
  }
  return (
    <div className="notif-list">
      {[...notifications].reverse().map((n, i) => (
        <div className="notif-item" key={i}>
          <div className="notif-dot" />
          <div>
            <div className="notif-msg">{n.message}</div>
            <div className="notif-date">{fmtDate(n.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin, showToast }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL;

    if (apiUrl) {
      // Real backend
      try {
        const data = await api.login(email, password);
        onLogin({ token: data.token, ...data.user });
      } catch (e) {
        setErr(e.message || "Invalid credentials.");
      }
    } else {
      // Demo mode (no backend connected yet)
      const u = DEMO_USERS[email.toLowerCase()];
      if (!u || u.password !== password) {
        setErr("Invalid email or password.");
      } else {
        onLogin({ ...u, email, token: "demo" });
      }
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-bg-ornament" aria-hidden>✦</div>

      <div className="login-box">
        <div className="login-wordmark">
          <div className="login-logo">CINDYMARY</div>
          <div className="login-logo-sub">COUTURE</div>
          <div className="login-logo-rule" />
          <div className="login-tagline">Client & Production Portal</div>
        </div>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <FormGroup label="Email Address">
            <Input type="email" value={email} required autoFocus
              placeholder="your@email.com"
              onChange={e => { setEmail(e.target.value); setErr(""); }} />
          </FormGroup>

          <FormGroup label="Password">
            <Input type="password" value={password} required
              placeholder="••••••••"
              onChange={e => { setPassword(e.target.value); setErr(""); }} />
          </FormGroup>

          {err && <div className="form-error">{err}</div>}

          <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>

          <div className="login-links">
            <a href="https://bit.ly/DressConsultation" target="_blank" rel="noreferrer">
              New client? Book a Consultation →
            </a>
            <a href="https://bit.ly/CindymaryPriceGuide" target="_blank" rel="noreferrer">
  View Price Guide →
</a>
          </div>
        </form>

        {!import.meta.env.VITE_API_URL && (
          <div className="demo-box">
            <div className="demo-box-title">Demo Accounts</div>
            <div className="demo-row"><b>Admin:</b> admin@cindymary.com / admin123</div>
            <div className="demo-row"><b>Client:</b> adaeze@example.com / client123</div>
            <div className="demo-row"><b>Client:</b> sophia@example.com / client123</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CLIENT PORTAL
// ═══════════════════════════════════════════════════════════
function ClientPortal({ user, token, menuOpen, setMenuOpen }) {
  const [tab, setTab]     = useState("overview");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDemo = token === "demo";

  useEffect(() => {
    if (isDemo) {
      // Use demo data
      const o = DEMO_ORDERS.find(o => o.id === user.orderId);
      setOrder(o || null);
      setLoading(false);
      return;
    }
    api.getOrder(user.orderId, token)
  .then(order => setOrder(order || null))
  .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, user.orderId, isDemo]);

  const navGroups = [
    { label:"My Order", items:[
      { key:"overview", label:"Overview",        icon:"◈" },
      { key:"tracking", label:"Track My Order",  icon:"◎" },
      { key:"timeline", label:"Timeline",        icon:"▦" },
      { key:"updates",  label:"Updates",         icon:"◉" },
    ]},
    { label:"Cindymary", items:[
      { key:"_book",  label:"Book Consultation", icon:"↗", href:"https://bit.ly/DressConsultation" },
      { key:"_price", label:"Price Guide",       icon:"↗", href:"https://bit.ly/CindymaryPriceGuide" },
      { key:"_wa",    label:"WhatsApp Us",       icon:"↗", href:"https://wa.me/2347067603022" },
    ]},
  ];

  if (loading) return <div className="page-loading"><span className="spinner-lg" /></div>;

  if (!order) return (
    <div className="shell">
      <div className="main main--center">
        <div className="empty-hero">
          <div className="empty-hero-icon">✦</div>
          <h1>Welcome, {user.name.split(" ")[0]}</h1>
          <p>You have no active order yet.</p>
          <a href="https://bit.ly/DressConsultation" target="_blank" rel="noreferrer">
            <button className="btn btn-gold">Book a Consultation →</button>
          </a>
          <a href="https://bit.ly/CindymaryPriceGuide" target="_blank" rel="noreferrer">
  <button className="btn btn-ghost" style={{ marginTop: "10px" }}>
    View Price Guide
  </button>
</a>
        </div>
      </div>
    </div>
  );

  const pct        = stageProgress(order);
  const curStage   = STAGES.find(s => s.id === order.current_stage);
  const delayCount = (order.delays||[]).reduce((a,d)=>a+d.days,0);

  return (
    <div className="shell">
      <Sidebar items={navGroups} active={tab} onSelect={(key) => { setTab(key); setMenuOpen(false); }} menuOpen={menuOpen}
        bottom={
          <div className="sidebar-user-card">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-id">{order.id}</div>
          </div>
        }
      />

      <main className="main">

        {/* ── OVERVIEW ─────────────────────────────── */}
        {tab === "overview" && (
          <div className="page-content">
            <div className="welcome-banner">
              <div className="welcome-text">
                <div className="welcome-greeting">Welcome back,</div>
                <div className="welcome-name">{user.name.split(" ")[0]}</div>
                <div className="welcome-sub">Your {order.garment} is being crafted with love</div>
              </div>
              <div className="welcome-ornament">✦</div>
            </div>

            <div className="stats-grid stats-grid--3">
              <StatCard label="Current Stage" value={`${curStage?.icon} ${curStage?.label}`} accent />
              <StatCard label="Overall Progress" value={`${pct}%`}
                sub={<ProgressBar pct={pct} thin />} />
              <StatCard label="Production" value={order.location === "UK" ? "🇬🇧 London" : "🇳🇬 Lagos"} />
            </div>

            {delayCount > 0 && (
              <div className="alert alert-warn">
                <span>⚠</span>
                Your timeline has a {delayCount}-day delay. We're working to minimise impact.
              </div>
            )}

            <div className="two-col">
              <div className="card">
                <div className="card-title">Order Details</div>
                {[
                  ["Order ID",    order.id],
                  ["Garment",     order.garment],
                  ["Location",    order.location],
                  ["Tailor",      order.assigned_to],
                  ["Order Date",  fmtDate(order.created_at)],
                ].map(([k,v]) => (
                  <div className="kv-row" key={k}>
                    <span className="kv-key">{k}</span>
                    <span className="kv-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">Latest Updates</div>
                <NotifList notifications={order.notifications?.slice(-4)} />
              </div>
            </div>

            <div className="quick-actions">
              <a href="https://wa.me/2347067603022" target="_blank" rel="noreferrer">
                <button className="btn btn-outline">💬 WhatsApp Us</button>
              </a>
              <a href="https://bit.ly/CindymaryPriceGuide" target="_blank" rel="noreferrer">
                <button className="btn btn-ghost">📖 Price Guide</button>
              </a>
            </div>
          </div>
        )}

        {/* ── TRACKING ─────────────────────────────── */}
        {tab === "tracking" && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Order Tracking</h1>
              <div className="page-sub">{order.id} · {order.garment}</div>
            </div>
            <div className="card">
              <div className="track-header">
                <Pill label={`${curStage?.icon} ${curStage?.label}`} variant="gold" />
                <div className="track-pct">
                  <span>{pct}%</span>
                  <ProgressBar pct={pct} thin />
                </div>
              </div>
              <TrackingRail order={order} />
            </div>
          </div>
        )}

        {/* ── TIMELINE ─────────────────────────────── */}
        {tab === "timeline" && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Production Timeline</h1>
              <div className="page-sub">Estimated schedule for your garment</div>
            </div>
            <div className="card card--flush">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Stage</th>
                    <th>Est. Start</th>
                    <th>Est. End</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buildTimeline(order).map(s => {
                    const isDone   = stagesDone(order).includes(s.id);
                    const isActive = order.current_stage === s.id;
                    return (
                      <tr key={s.id}>
                        <td className="td-num">{s.id}</td>
                        <td>{s.icon} {s.label}</td>
                        <td className="td-date">{fmtDate(s.start)}</td>
                        <td className="td-date">{fmtDate(s.end)}</td>
                        <td className="td-dur">
                          {s.days + s.delay}d
                          {s.delay > 0 && <span className="delay-tag">+{s.delay}</span>}
                        </td>
                        <td>
                          {isDone   && <Pill label="Done"    variant="ok" />}
                          {isActive && <Pill label="Active"  variant="gold" />}
                          {!isDone && !isActive && <Pill label="Pending" variant="dim" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── UPDATES ──────────────────────────────── */}
        {tab === "updates" && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">All Updates</h1>
              <div className="page-sub">Your complete order activity log</div>
            </div>
            <div className="card">
              <NotifList notifications={order.notifications} />
            </div>
            <div className="quick-actions">
              <a href="https://wa.me/2347067603022" target="_blank" rel="noreferrer">
                <button className="btn btn-outline">💬 WhatsApp Us</button>
              </a>
              <a href="https://bit.ly/DressConsultation" target="_blank" rel="noreferrer">
                <button className="btn btn-ghost">📋 Book Again</button>
              </a>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ADMIN PORTAL
// ═══════════════════════════════════════════════════════════
function AdminPortal({ user, token, showToast, menuOpen, setMenuOpen }) {
  const [tab, setTab]       = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [stats, setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // "create"|"manage"
  const [sel, setSel]       = useState(null);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [delayStage, setDelayStage] = useState(1);
  const [delayDays, setDelayDays]   = useState(1);
  const [delayReason, setDelayReason] = useState("");
  const [assignTo, setAssignTo]     = useState("");

  const isDemo = token === "demo";

  const load = useCallback(async () => {
    setLoading(true);
    if (isDemo) {
      setOrders(DEMO_ORDERS);
      const uk = DEMO_ORDERS.filter(o=>o.location==="UK").length;
      const ng = DEMO_ORDERS.filter(o=>o.location==="Nigeria").length;
      setStats({ total:DEMO_ORDERS.length, uk, nigeria:ng, delayed:1 });
      setLoading(false);
      return;
    }
    try {
      const [os, st] = await Promise.all([api.getOrders(token), api.getStats(token)]);
      setOrders(os);
      setStats(st);
    } catch(e) {
      showToast(e.message, "error");
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { load(); }, [load]);

  async function handleAdvance() {
    setSaving(true);
    if (isDemo) {
      setOrders(prev => prev.map(o => {
        if (o.id !== sel.id) return o;
        const ns = Math.min(o.current_stage+1, 11);
        return {
          ...o,
          current_stage: ns,
          stage_history: [...o.stage_history, {stage_id:o.current_stage}],
          notifications: [...o.notifications, {
            message: `Stage updated: ${STAGES.find(s=>s.id===ns)?.label}`,
            created_at: today(),
          }],
        };
      }));
      showToast("Stage advanced","success");
      setModal(null);
    } else {
      try {
        await api.advanceStage(sel.id, token);
        showToast("Stage advanced","success");
        await load();
        setModal(null);
      } catch(e) { showToast(e.message,"error"); }
    }
    setSaving(false);
  }

  async function handleDelay() {
    setSaving(true);
    if (isDemo) {
      setOrders(prev => prev.map(o =>
        o.id !== sel.id ? o :
        { ...o, delays: [...o.delays, {stage_id:delayStage, days:Number(delayDays)}] }
      ));
      showToast("Delay recorded","info");
      setModal(null);
    } else {
      try {
        await api.addDelay(sel.id, delayStage, delayDays, delayReason, token);
        showToast("Delay recorded","info");
        await load();
        setModal(null);
      } catch(e) { showToast(e.message,"error"); }
    }
    setSaving(false);
  }

  async function handleAssign() {
    if (!assignTo.trim()) { showToast("Enter a name","error"); return; }
    setSaving(true);
    if (isDemo) {
      setOrders(prev => prev.map(o => o.id!==sel.id ? o : {...o, assigned_to:assignTo.trim()}));
      showToast(`Assigned to ${assignTo.trim()}`,"success");
      setModal(null);
    } else {
      try {
        await api.assign(sel.id, assignTo.trim(), token);
        showToast(`Assigned to ${assignTo.trim()}`,"success");
        await load();
        setModal(null);
      } catch(e) { showToast(e.message,"error"); }
    }
    setSaving(false);
  }

  async function handleCreate() {
    const { client_name, client_email, client_password, garment, location } = form;
    if (!client_name || !client_email || !client_password || !garment || !location) {
      showToast("Fill in all required fields","error"); return;
    }
    setSaving(true);
    if (isDemo) {
      const id = `CM-${new Date().getFullYear()}-${String(orders.length+1).padStart(3,"0")}`;
      setOrders(prev => [...prev, {
        id, ...form,
        current_stage:1, stage_started: new Date().toISOString(),
        created_at: new Date().toISOString(),
        stage_history:[], delays:[],
        notifications:[{message:"Welcome to Cindymary Couture! Order created.", created_at:today()}],
      }]);
      showToast(`Order ${id} created!`,"success");
      setForm({}); setModal(null);
    } else {
      try {
        const res = await api.createOrder(form, token);
        showToast(`Order ${res.id} created!`,"success");
        setForm({}); setModal(null);
        await load();
      } catch(e) { showToast(e.message,"error"); }
    }
    setSaving(false);
  }

  const uk = orders.filter(o => o.location==="UK");
const ng = orders.filter(o => o.location==="Nigeria");
const delayed = orders.filter(o => (o.delays || []).length > 0);
const vis = tab==="uk" ? uk : tab==="nigeria" ? ng : tab==="delays" ? delayed : orders;

  const navGroups = [
    { label:"Dashboard", items:[
      { key:"dashboard", label:"Overview",         icon:"◈" },
      { key:"orders", label:"All Orders", icon:"◎", badge: orders.length },
      { key:"delays", label:"Delayed Orders", icon:"⚠️", badge: delayed.length },
      { key:"uk",        label:"UK Production",    icon:"▦", badge: uk.length },
      { key:"nigeria",   label:"Nigeria Prod.",    icon:"▦", badge: ng.length },
      { key:"booking",   label:"New Booking",      icon:"＋" },
    ]},
    { label:"Quick Links", items:[
      { key:"_wa",    label:"WhatsApp",       icon:"↗", href:"https://wa.me/2347067603022" },
      { key:"_book",  label:"Booking Form",   icon:"↗", href:"https://bit.ly/DressConsultation" },
      { key:"_price", label:"Price Guide",    icon:"↗", href:"https://bit.ly/CindymaryPriceGuide" },
    ]},
  ];

  if (loading) return <div className="page-loading"><span className="spinner-lg" /></div>;

  return (
    <div className="shell">
      <Sidebar items={navGroups} active={tab} onSelect={(key) => { setTab(key); setMenuOpen(false); }} menuOpen={menuOpen}
        bottom={<div className="sidebar-user-card"><div className="sidebar-user-name">Admin</div><div className="sidebar-user-id">Cindymary Couture</div></div>}
      />

      <main className="main">

        {/* ── DASHBOARD ────────────────────────────── */}
        {tab==="dashboard" && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Production Overview</h1>
              <div className="page-sub">Cindymary Couture — Internal Dashboard</div>
            </div>
            <div className="stats-grid stats-grid--4">
              <StatCard label="Total Orders"      value={stats.total||0}   sub="All active" accent />
              <StatCard label="UK Studio"         value={stats.uk||0}      sub="London" />
              <StatCard label="Nigeria Studio"    value={stats.nigeria||0} sub="Lagos" />
              <StatCard label="With Delays"       value={stats.delayed||0} sub="Need attention" />
            </div>

            {stats.delayed > 0 && (
              <div className="alert alert-warn">
                <span>⚠</span>
                <div>
                  <strong>{stats.delayed} order{stats.delayed>1?"s":""} with delays.</strong>
                  {" "}Review the timeline impact in each order.
                </div>
              </div>
            )}

            <div className="section-header">
              <h2 className="section-title">All Orders</h2>
              <button className="btn btn-gold btn-sm" onClick={()=>{setForm({});setModal("create");}}>
                + New Order
              </button>
            </div>
            <OrderTable orders={orders} onManage={o=>{setSel(o);setAssignTo(o.assigned_to);setDelayStage(o.current_stage);setModal("manage");}} />
          </div>
        )}

        {/* ── ORDERS / UK / NIGERIA ────────────────── */}
        {(tab==="orders"||tab==="uk"||tab==="nigeria"||tab==="delays") && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">
                {tab==="uk"?"UK Production":tab==="nigeria"?"Nigeria Production":tab==="delays"?"Delayed Orders":"All Orders"}
              </h1>
              <div className="page-sub">{vis.length} order{vis.length!==1?"s":""}</div>
            </div>
            <div className="section-header" style={{marginTop:"-8px"}}>
              <div/>
              <button className="btn btn-gold btn-sm" onClick={()=>{setForm({});setModal("create");}}>
                + New Order
              </button>
            </div>

            {vis.map(order => {
              const s   = STAGES.find(x => x.id===order.current_stage);
              const pct = stageProgress(order);
              const delayed = (order.delays||[]).length > 0;
              return (
                <div className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <div className="order-card-name">{order.client_name}</div>
                      <div className="order-card-meta">{order.id} · {order.garment}</div>
                    </div>
                    <div className="order-card-badges">
                      <Pill label={order.location==="UK"?"🇬🇧 UK":"🇳🇬 Nigeria"}
                        variant={order.location==="UK"?"inf":"gold"} />
                      {delayed && <Pill label="⚠ Delayed" variant="warn" />}
                      <button className="btn btn-gold btn-sm"
                        onClick={()=>{setSel(order);setAssignTo(order.assigned_to);setDelayStage(order.current_stage);setModal("manage");}}>
                        Manage
                      </button>
                    </div>
                  </div>
                  <div className="order-card-tags">
                    <span className="tag">Tailor: {order.assigned_to}</span>
                    <span className="tag">Stage {order.current_stage}/11: {s?.icon} {s?.label}</span>
                    <span className="tag">{pct}% complete</span>
                  </div>
                  <ProgressBar pct={pct} thin />
                  {order.notes && <div className="order-note">📝 {order.notes}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── NEW BOOKING ──────────────────────────── */}
        {tab==="booking" && (
          <AdminBookingForm orders={orders} setOrders={setOrders} showToast={showToast} token={token} isDemo={isDemo} onLoad={load} />
        )}
      </main>

      {/* CREATE MODAL */}
      <Modal open={modal==="create"} onClose={()=>setModal(null)} title="Create New Order"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
          <button className="btn btn-gold" onClick={handleCreate} disabled={saving}>
            {saving?<span className="spinner"/>:"Create Order"}
          </button>
        </>}>
        <div className="modal-form-grid">
          <FormGroup label="Client Full Name *">
            <Input value={form.client_name||""} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} placeholder="e.g. Adaeze Okonkwo" />
          </FormGroup>
          <FormGroup label="Email Address *">
            <Input type="email" value={form.client_email||""} onChange={e=>setForm(f=>({...f,client_email:e.target.value}))} placeholder="client@email.com" />
          </FormGroup>
          <FormGroup label="Client Temporary Password *">
  <Input
    value={form.client_password || ""}
    onChange={e=>setForm(f=>({...f, client_password:e.target.value}))}
    placeholder="e.g. client123"
  />
</FormGroup>
          <FormGroup label="Phone Number">
            <Input value={form.client_phone||""} onChange={e=>setForm(f=>({...f,client_phone:e.target.value}))} placeholder="+234 or +44…" />
          </FormGroup>
          <FormGroup label="Garment Description *">
            <Input value={form.garment||""} onChange={e=>setForm(f=>({...f,garment:e.target.value}))} placeholder="e.g. Bridal Gown — Aso-Oke" />
          </FormGroup>
          <FormGroup label="Assigned Tailor">
            <Input value={form.assigned_to||""} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} placeholder="e.g. Amaka" />
          </FormGroup>
          <FormGroup label="Production Location *">
            <Select value={form.location||""} onChange={e=>setForm(f=>({...f,location:e.target.value}))}>
              <option value="">Select…</option>
              <option value="UK">🇬🇧 United Kingdom</option>
              <option value="Nigeria">🇳🇬 Nigeria</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Start Date">
  <Input
    type="date"
    value={form.start_date || ""}
    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
  />
</FormGroup>

<FormGroup label="Agreed Delivery Date">
  <Input
    type="date"
    value={form.agreed_delivery_date || ""}
    onChange={e => setForm(f => ({ ...f, agreed_delivery_date: e.target.value }))}
  />
</FormGroup>
<FormGroup label="Custom Stage Days">
  <div>
    {STAGES.map(s => (
      <div key={s.id} style={{ marginBottom: "12px" }}>
        <label>{s.icon} {s.label}</label>
        <Input
          type="number"
          min="0"
          value={form.stage_days?.[s.id] ?? s.days}
          onChange={e =>
            setForm(f => ({
              ...f,
              stage_days: {
                ...(f.stage_days || {}),
                [s.id]: Number(e.target.value)
              }
            }))
          }
        />
      </div>
    ))}
  </div>
</FormGroup>
<FormGroup label="Measurements">
  <Textarea
    rows={3}
    value={form.measurements || ""}
    placeholder="e.g. Bust: 34, Waist: 26, Hip: 38..."
    onChange={e => setForm(f => ({ ...f, measurements: e.target.value }))}
  />
</FormGroup>

<FormGroup label="Style Reference Notes">
  <Textarea
    rows={3}
    value={form.style_reference_notes || ""}
    placeholder="Describe style or paste image link..."
    onChange={e => setForm(f => ({ ...f, style_reference_notes: e.target.value }))}
  />
</FormGroup>
        
        <FormGroup label="Notes & Special Instructions">
          <Textarea rows={3} value={form.notes||""} placeholder="Colours, deadlines, references…"
            onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        </FormGroup>
      </Modal>

      {/* MANAGE MODAL */}
      {sel && (
        <Modal open={modal==="manage"} onClose={()=>setModal(null)} title={`Manage — ${sel.client_name}`}>
          {/* Current stage */}
          <div className="manage-stage-box">
            <div className="manage-stage-label">Current Stage</div>
            <div className="manage-stage-name">
              {STAGES.find(s=>s.id===sel.current_stage)?.icon}{" "}
              {STAGES.find(s=>s.id===sel.current_stage)?.label}
            </div>
            <ProgressBar pct={stageProgress(sel)} />
            <div className="manage-stage-sub">
              {stageProgress(sel)}% complete · Stage {sel.current_stage} of {STAGES.length}
            </div>
          </div>

          {/* Advance */}
          <div className="manage-section">
            <div className="manage-section-label">Advance to Next Stage</div>
            {sel.current_stage < 11 ? (
              <button className="btn btn-gold btn-block" onClick={handleAdvance} disabled={saving}>
                {saving ? <span className="spinner"/> :
                  `▶ Move to: ${STAGES.find(s=>s.id===sel.current_stage+1)?.icon} ${STAGES.find(s=>s.id===sel.current_stage+1)?.label}`
                }
              </button>
            ) : (
              <div className="manage-complete">✓ Order is at the final stage</div>
            )}
          </div>

          <div className="manage-divider"/>

          {/* Assign tailor */}
          <div className="manage-section">
            <div className="manage-section-label">Assign Tailor</div>
            <div className="manage-row">
              <Input value={assignTo} placeholder="Tailor name"
                onChange={e=>setAssignTo(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={handleAssign} disabled={saving}>
                Assign
              </button>
            </div>
          </div>

          <div className="manage-divider"/>

          {/* Add delay */}
          <div className="manage-section">
            <div className="manage-section-label">Record a Delay</div>
            <div className="manage-delay-grid">
              <FormGroup label="Stage">
                <Select value={delayStage} onChange={e=>setDelayStage(Number(e.target.value))}>
                  {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Extra Days">
                <Input type="number" min={1} max={60} value={delayDays}
                  onChange={e=>setDelayDays(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="Reason (optional)">
              <Input value={delayReason} placeholder="e.g. Fabric delivery delayed"
                onChange={e=>setDelayReason(e.target.value)} />
            </FormGroup>
            <button className="btn btn-warn btn-sm" onClick={handleDelay} disabled={saving}>
              {saving?<span className="spinner"/>:"⚠ Record Delay"}
            </button>
          </div>

          <div className="manage-divider"/>

          {(() => {
  const risk = deliveryRisk(sel);
  if (!risk) return null;

  return (
    <div style={{
      background: "#2a1a1a",
      border: "1px solid #ff4d4f",
      padding: "10px",
      borderRadius: "6px",
      marginBottom: "12px",
      color: "#ffccc7"
    }}>
      ⚠️ Delivery risk: {risk.daysLate} day(s) late
    </div>
  );
})()}
          {/* Full tracking */}
          <div className="manage-section-label">Full Progress</div>
          <TrackingRail order={sel} />

          <div className="modal-footer" style={{marginTop:20}}>
            <button className="btn btn-ghost" onClick={()=>setModal(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Order Table (admin) ───────────────────────────────────────
function OrderTable({ orders, onManage }) {
  return (
    <div className="card card--flush">
      <table className="data-table">
        <thead>
          <tr>
            <th>Order ID</th><th>Client</th><th>Garment</th>
            <th>Location</th><th>Stage</th><th>Progress</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const s   = STAGES.find(x=>x.id===o.current_stage);
            const pct = stageProgress(o);
            return (
              <tr key={o.id}>
                <td className="td-id">{o.id}</td>
                <td>{o.client_name}</td>
                <td className="td-muted">{o.garment}</td>
                <td>
                  <Pill label={o.location==="UK"?"🇬🇧 UK":"🇳🇬 Nigeria"}
                    variant={o.location==="UK"?"inf":"gold"} />
                </td>
                <td className="td-stage">{s?.icon} {s?.label}</td>
                <td style={{width:110}}>
                  <div className="table-progress-wrap">
                    <ProgressBar pct={pct} thin />
                    <span className="table-progress-pct">{pct}%</span>
                  </div>
                </td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={()=>onManage(o)}>Manage</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Admin Booking Form ────────────────────────────────────────
function AdminBookingForm({ orders, setOrders, showToast, token, isDemo, onLoad }) {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({ location:"",client_name:"",client_email:"",client_phone:"",garment:"",notes:"",assigned_to:"" });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.client_name||!form.client_email||!form.location||!form.garment) {
      showToast("Complete all required fields","error"); return;
    }
    setSaving(true);
    if (isDemo) {
      const id=`CM-${new Date().getFullYear()}-${String(orders.length+1).padStart(3,"0")}`;
      setOrders(prev=>[...prev,{
        id,...form,current_stage:1,
        stage_started:new Date().toISOString(),
        created_at:new Date().toISOString(),
        stage_history:[],delays:[],
        notifications:[{message:"Welcome to Cindymary Couture! Order created.",created_at:today()}],
      }]);
      showToast(`Order ${id} created!`,"success");
      setForm({location:"",client_name:"",client_email:"",client_phone:"",garment:"",notes:"",assigned_to:""});
      setStep(1);
    } else {
      try {
        const res = await api.createOrder(form, token);
        showToast(`Order ${res.id} created!`,"success");
        setForm({location:"",client_name:"",client_email:"",client_phone:"",garment:"",notes:"",assigned_to:""});
        setStep(1);
        await onLoad();
      } catch(e) { showToast(e.message,"error"); }
    }
    setSaving(false);
  }

  return (
    <div className="page-content booking-page">
      <div className="page-header">
        <h1 className="page-title">New Client Booking</h1>
        <div className="page-sub">Register a new consultation or order</div>
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        {["Location","Details"].map((l,i)=>(
          <div key={l} className={`step-dot ${step>=i+1?"step-dot--active":""}`}>
            <div className="step-dot-circle">{i+1}</div>
            <div className="step-dot-label">{l}</div>
          </div>
        ))}
      </div>

      {step===1 && (
        <div className="booking-step">
          <div className="booking-step-title">Select Production Location</div>
          {[
            { v:"UK",      flag:"🇬🇧", name:"United Kingdom", note:"London studio — European deliveries" },
            { v:"Nigeria", flag:"🇳🇬", name:"Nigeria",         note:"Lagos studio — West Africa deliveries" },
          ].map(l=>(
            <div key={l.v}
              className={`location-card ${form.location===l.v?"location-card--selected":""}`}
              onClick={()=>setForm(f=>({...f,location:l.v}))}>
              <span className="location-flag">{l.flag}</span>
              <div>
                <div className="location-name">{l.name}</div>
                <div className="location-note">{l.note}</div>
              </div>
              {form.location===l.v && <span className="location-check">✓</span>}
            </div>
          ))}
          <div className="booking-actions">
            <button className="btn btn-gold" disabled={!form.location} onClick={()=>setStep(2)}>
              Continue →
            </button>
            <span className="booking-alt">
              Or send client to:{" "}
              <a href="https://bit.ly/DressConsultation" target="_blank" rel="noreferrer">
                bit.ly/DressConsultation
              </a>
            </span>
          </div>
        </div>
      )}

      {step===2 && (
        <div className="booking-step">
          <div className="booking-step-title">Client & Garment Details</div>
          <div className="card">
            <div className="selected-location-banner">
              <span>{form.location==="UK"?"🇬🇧":"🇳🇬"} {form.location} Production</span>
              <button className="btn-link" onClick={()=>setStep(1)}>← Change</button>
            </div>
            <div className="modal-form-grid">
              <FormGroup label="Client Full Name *">
                <Input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} />
              </FormGroup>
              <FormGroup label="Email Address *">
                <Input type="email" value={form.client_email} onChange={e=>setForm(f=>({...f,client_email:e.target.value}))} />
              </FormGroup>
              <FormGroup label="Phone Number">
                <Input value={form.client_phone} onChange={e=>setForm(f=>({...f,client_phone:e.target.value}))} />
              </FormGroup>
              <FormGroup label="Garment Description *">
                <Input value={form.garment} onChange={e=>setForm(f=>({...f,garment:e.target.value}))} />
              </FormGroup>
              <FormGroup label="Assigned Tailor">
                <Input value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} />
              </FormGroup>
            </div>
            <FormGroup label="Notes & Special Instructions">
              <Textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            </FormGroup>
            <div className="booking-actions">
              <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Back</button>
              <button className="btn btn-gold" onClick={submit} disabled={saving}>
                {saving?<span className="spinner"/>:"Create Order ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth]   = useState(() => {
    try {
      const s = localStorage.getItem("cm_auth");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = React.useRef(null);

  function showToast(msg, type="success") {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  function handleLogin(user) {
    setAuth(user);
    localStorage.setItem("cm_auth", JSON.stringify(user));
  }

  function handleLogout() {
    setAuth(null);
    localStorage.removeItem("cm_auth");
  }

  const isAdmin  = auth?.role === "admin";
  const isClient = auth?.role === "client";

  return (
    <>
      {auth && <Topbar user={auth} onLogout={handleLogout} onMenuClick={() => setMenuOpen(true)} />}
      {!auth && <LoginPage onLogin={handleLogin} showToast={showToast} />}
      {isClient && <ClientPortal user={auth} token={auth.token} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />}
      {isAdmin && <AdminPortal user={auth} token={auth.token} showToast={showToast} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />}
      <Toast toast={toast} />
    </>
  );
}
