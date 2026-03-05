import { useState, useEffect, useRef } from 'react'

// ── API helpers ──────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const STATUS_CLS = { Match: 'ss-match', 'Not Match': 'ss-notmatch', 'Not Found': 'ss-notfound', 'N/A': 'ss-na' }
const STATUS_COLORS = {
  Match: 'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7',
  'Not Match': 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5',
  'Not Found': 'background:#fef3c7;color:#92400e;border:1px solid #fcd34d',
  'N/A': 'background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ── PDF Download ─────────────────────────────────────────────
function downloadAsPdf(html, filename) {
  const win = window.open('', '_blank', 'width=1100,height=800')
  win.document.write(`<!DOCTYPE html><html><head><title>${filename}</title><style>@page{margin:.5in;size:A4 landscape}body{margin:0;font-family:Arial,sans-serif}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${html}</body></html>`)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 600)
}

// ── Toast ────────────────────────────────────────────────────
function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>
}

// ── Logo — transparent, uses your actual brand mark ──────────
function SkySourceLogo({ size = 28, style = {} }) {
  // Transparent background — just the chevron/arrow shapes
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Left chevron */}
      <path d="M18 8L6 20L18 32" stroke="#7c5bff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Right chevron */}
      <path d="M26 8L38 20L26 32" stroke="#5b31f4" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ── Top Nav ──────────────────────────────────────────────────
function TopNav({ user, activeTab, onTab, onLogout, onChangePassword }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <nav className="topnav no-print">
      <div className="topnav-brand">
        <SkySourceLogo size={30} />
        <span className="topnav-name">Sky<span>Source</span></span>
      </div>
      <div className="topnav-links">
        <button className={`nav-link ${activeTab==='dashboard'?'active':''}`} onClick={() => onTab('dashboard')}>📋 Checklists</button>
        {(user?.role==='admin'||user?.role==='master_admin') && <button className={`nav-link ${activeTab==='admin'?'active':''}`} onClick={() => onTab('admin')}>🛡 Admin</button>}
        {user?.username==='Rudra' && <button className={`nav-link ${activeTab==='ai-review'?'active':''}`} style={{background:'linear-gradient(90deg,rgba(91,49,244,.25),rgba(124,91,255,.2))',border:'1px solid rgba(124,91,255,.4)',borderRadius:8}} onClick={() => onTab('ai-review')}>✨ AI Review</button>}
      </div>
      <div className="topnav-right" ref={ref} style={{position:'relative'}}>
        <button onClick={() => setProfileOpen(p=>!p)} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',borderRadius:10,padding:'5px 10px 5px 6px',cursor:'pointer'}}>
          <div className="user-avatar">{(user?.fullname||user?.username||'U')[0].toUpperCase()}</div>
          <span className="user-badge">{user?.fullname||user?.username}</span>
          {user?.role==='admin' && <span className="admin-chip">ADMIN</span>}
          {user?.role==='master_admin' && <span className="admin-chip" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff'}}>MASTER</span>}
          <span style={{color:'rgba(255,255,255,.4)',fontSize:10}}>▼</span>
        </button>
        {profileOpen && (
          <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#fff',border:'1.5px solid var(--border)',borderRadius:12,boxShadow:'0 8px 32px rgba(91,49,244,.18)',minWidth:190,zIndex:400,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #f0edfe',background:'#faf8ff'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--ink)'}}>{user?.fullname||user?.username}</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{user?.email||user?.role?.toUpperCase()}</div>
            </div>
            <button onClick={() => {setProfileOpen(false);onChangePassword()}} style={{width:'100%',padding:'11px 16px',background:'none',border:'none',textAlign:'left',fontSize:13,cursor:'pointer',color:'var(--text)',display:'flex',alignItems:'center',gap:9,fontFamily:'Sora,sans-serif'}} onMouseOver={e=>e.currentTarget.style.background='#faf8ff'} onMouseOut={e=>e.currentTarget.style.background='none'}>
              🔑 Change Password
            </button>
            <button onClick={() => {setProfileOpen(false);onLogout()}} style={{width:'100%',padding:'11px 16px',background:'none',border:'none',borderTop:'1px solid #f0edfe',textAlign:'left',fontSize:13,cursor:'pointer',color:'#dc2626',display:'flex',alignItems:'center',gap:9,fontFamily:'Sora,sans-serif'}} onMouseOver={e=>e.currentTarget.style.background='#fff5f5'} onMouseOut={e=>e.currentTarget.style.background='none'}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

// ── Change Password Modal ─────────────────────────────────────
function ChangePasswordModal({ onClose, showToast }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [showPw, setShowPw] = useState(false)
  async function handleSave() {
    setErr('')
    if (!current||!next||!confirm) return setErr('All fields are required')
    if (next.length < 6) return setErr('New password must be at least 6 characters')
    if (next !== confirm) return setErr('New passwords do not match')
    setLoading(true)
    try {
      await api('/api/auth/change-password', { method:'POST', body:{ currentPassword:current, newPassword:next } })
      showToast('✅ Password changed successfully!')
      onClose()
    } catch(e) { setErr(e.message) }
    setLoading(false)
  }
  return (
    <div className="modal-overlay open" style={{zIndex:500}}>
      <div className="modal-box" style={{width:400}}>
        <div className="modal-header"><div className="modal-title">🔑 Change Password</div><button className="modal-close" onClick={onClose}>×</button></div>
        <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
          {err && <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,padding:'9px 13px',fontSize:13,color:'#dc2626'}}>⚠ {err}</div>}
          {[['Current Password',current,setCurrent],['New Password',next,setNext],['Confirm New Password',confirm,setConfirm]].map(([label,val,setter]) => (
            <div key={label}><div className="hf-label" style={{marginBottom:5}}>{label}</div><input className="hf-input" type={showPw?'text':'password'} value={val} onChange={e=>setter(e.target.value)} placeholder={label} /></div>
          ))}
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--muted)',cursor:'pointer'}}>
            <input type="checkbox" checked={showPw} onChange={e=>setShowPw(e.target.checked)} /> Show passwords
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-modal-apply" onClick={handleSave} disabled={loading}>{loading?'Saving…':'Save Password'}</button>
        </div>
      </div>
    </div>
  )
}


// ── Login Screen ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e?.preventDefault()
    if (!username||!password) return
    setLoading(true); setError('')
    try {
      const { user } = await api('/api/auth/login', { method:'POST', body:{ username, password } })
      onLogin(user)
    } catch(err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div style={{background:'#0a0814',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0}}>
        <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(#5b31f4,#3b1fa8)',filter:'blur(80px)',opacity:.55,top:-200,left:-150}} />
        <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(#7c5bff,#5b31f4)',filter:'blur(80px)',opacity:.55,bottom:-150,right:-100}} />
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',backgroundSize:'50px 50px'}} />
      </div>
      <div style={{position:'relative',zIndex:10,display:'flex',alignItems:'center',gap:80,maxWidth:1000,width:'100%',padding:40}}>
        <div style={{flex:1,color:'#fff'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
            <SkySourceLogo size={48} />
            <span style={{fontSize:28,fontWeight:800,letterSpacing:-.5}}>Sky<span style={{color:'#a78bfa'}}>Source</span></span>
          </div>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:-1.5,lineHeight:1.1,marginBottom:12}}>
            Policy<br/><span style={{background:'linear-gradient(135deg,#a78bfa,#e0e7ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Verification</span><br/>Platform
          </div>
          <div style={{fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:320,marginBottom:28}}>Compare policy documents against Nexsure data with precision and speed.</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {['Multi-LOB checklist management','Real-time Nexsure comparison','PDF export with snapshots','Master Admin role management','AI-powered policy review (beta)','Full audit trail per checklist'].map(f => (
              <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(255,255,255,.55)'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#7c5bff',flexShrink:0}}/>{f}
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,.06)',backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,.12)',borderRadius:28,width:400,flexShrink:0,overflow:'hidden',boxShadow:'0 40px 100px rgba(0,0,0,.5)'}}>
          <div style={{padding:'30px 32px 22px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Welcome back</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.4)',marginTop:4}}>Sign in to your SkySource workspace</div>
          </div>
          <form onSubmit={handleLogin} style={{padding:'26px 32px 32px'}}>
            {error && <div style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:14}}>⚠ {error}</div>}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>Username or Email</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:14,opacity:.4}}>👤</span>
                <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username or email address" autoComplete="username"
                  style={{width:'100%',padding:'12px 14px 12px 38px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,color:'#fff',fontSize:14,fontFamily:'Sora,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>Password</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:14,opacity:.4}}>🔒</span>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"
                  style={{width:'100%',padding:'12px 38px 12px 38px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,color:'#fff',fontSize:14,fontFamily:'Sora,sans-serif',outline:'none',boxSizing:'border-box'}}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:14,opacity:.5,color:'#fff',padding:0}}>{showPw?'🙈':'👁'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{width:'100%',padding:14,background:'linear-gradient(135deg,#5b31f4,#7c31ea)',border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:700,fontFamily:'Sora,sans-serif',cursor:'pointer',boxShadow:'0 6px 20px rgba(91,49,244,.5)',opacity:loading?.7:1}}>
              {loading?'Signing in…':'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ user, onOpen, onNew, onDelete, checklists, loading }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const h = new Date().getHours()
  const greet = h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  const recent = checklists.filter(c => c.status==='complete'&&c.completed_at&&(Date.now()-new Date(c.completed_at).getTime())/86400000<=5)
  const filtered = checklists.filter(c => {
    if (filter!=='all'&&c.status!==filter) return false
    if (search) { const s=search.toLowerCase(); return (c.insured||'').toLowerCase().includes(s)||(c.policy||'').toLowerCase().includes(s) }
    return true
  })
  const total=checklists.length, complete=checklists.filter(c=>c.status==='complete').length, draft=total-complete
  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">{greet}, {(user?.fullname||user?.username||'').split(' ')[0]} 👋</div>
          <div className="page-sub">Here's what's happening across your checklists</div>
        </div>
        <button className="btn-primary" onClick={onNew}>＋ New Checklist</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
        {[{label:'Total',value:total,icon:'📋',color:'#5b31f4'},{label:'Complete',value:complete,icon:'✅',color:'#059669'},{label:'In Progress',value:draft,icon:'✏️',color:'#d97706'}].map(s => (
          <div key={s.label} style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:14,padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:42,height:42,borderRadius:12,background:s.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{s.icon}</div>
            <div><div style={{fontSize:24,fontWeight:800,color:s.color,letterSpacing:-1}}>{s.value}</div><div style={{fontSize:11,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:.6}}>{s.label}</div></div>
          </div>
        ))}
      </div>
      {recent.length>0 && (
        <div style={{marginBottom:28}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
            🕐 Recently Completed <span style={{fontSize:10,fontWeight:400,textTransform:'none'}}>(visible 5 days)</span>
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          <div className="recent-strip">
            {recent.map(c => (
              <div key={c.id} className="recent-card" onClick={()=>onOpen(c.id)}>
                <div style={{fontSize:10,color:'#86efac',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>✅ Complete</div>
                <div className="recent-card-insured">{c.insured}</div>
                <div className="recent-card-policy">{c.policy}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:8}}>{(c.lobs||[]).join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="search-wrap">
        <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--muted)'}}>🔍</span>
        <input className="search-input" placeholder="Search by insured name or policy number…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div className="cl-filters">
        {[['all','All'],['draft','In Progress'],['complete','Complete']].map(([f,l]) => (
          <button key={f} className={`cl-filter-btn ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{textAlign:'center',padding:60}}><div className="loading-spinner"/></div>
      : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:'80px 24px',color:'var(--muted)'}}>
          <div style={{fontSize:52,opacity:.2,marginBottom:14}}>📋</div>
          <div style={{fontWeight:700,fontSize:16}}>No checklists found</div>
          <div style={{fontSize:13,marginTop:6}}>{search?'Try a different search term':'Create your first checklist to get started'}</div>
        </div>
      ) : (
        <div className="checklist-grid">
          {filtered.map(c => (
            <div key={c.id} className="cl-card" onClick={()=>onOpen(c.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div style={{flex:1,minWidth:0,marginRight:8}}>
                  <div className="cl-insured">{c.insured}</div>
                  <div className="cl-policy">{c.policy}</div>
                </div>
                <span className={`status-chip ${c.status==='complete'?'chip-complete':'chip-draft'}`}>{c.status==='complete'?'Complete':'In Progress'}</span>
              </div>
              <div className="cl-meta">👤 {c.username} · 📅 {fmtDate(c.updated_at)}</div>
              <div className="cl-footer">
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{(c.lobs||[]).slice(0,2).map(l=><span key={l} className="cl-lob">{l}</span>)}{(c.lobs||[]).length>2&&<span className="cl-lob">+{c.lobs.length-2}</span>}</div>
                <button onClick={e=>{e.stopPropagation();if(window.confirm(`Delete checklist for "${c.insured}"? This cannot be undone.`))onDelete(c.id)}}
                  style={{background:'none',border:'none',cursor:'pointer',color:'#e5e7eb',padding:'5px',borderRadius:7,fontSize:15}}
                  onMouseOver={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#dc2626'}}
                  onMouseOut={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#e5e7eb'}}
                  title="Delete checklist">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Policy Term Date Picker ───────────────────────────────────
function TermPicker({ value, onChange, className }) {
  function parseTermDates(term) {
    if (!term) return { from:'', to:'' }
    const parts = term.split(/\s*(?:–|—| - | to )\s*/i).map(s=>s.trim()).filter(Boolean)
    function toISO(s) {
      if (!s) return ''
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`
      return ''
    }
    return { from:toISO(parts[0]||''), to:toISO(parts[1]||'') }
  }
  const init = parseTermDates(value)
  const [from, setFrom] = useState(init.from)
  const [to, setTo] = useState(init.to)
  const prevVal = useRef(value)
  useEffect(() => {
    if (value !== prevVal.current) {
      const p = parseTermDates(value); setFrom(p.from); setTo(p.to); prevVal.current=value
    }
  }, [value])
  function toDisplay(iso) { if(!iso)return''; const[y,m,d]=iso.split('-'); return`${m}/${d}/${y}` }
  function emit(f,t) { onChange([f&&toDisplay(f),t&&toDisplay(t)].filter(Boolean).join(' – ')) }
  return (
    <div style={{display:'flex',gap:6,alignItems:'center'}}>
      <input className={className} type="date" value={from} onChange={e=>{setFrom(e.target.value);emit(e.target.value,to)}} style={{flex:1,minWidth:0}} title="Policy start date"/>
      <span style={{color:'var(--muted)',fontSize:12,flexShrink:0,fontWeight:700}}>→</span>
      <input className={className} type="date" value={to} onChange={e=>{setTo(e.target.value);emit(from,e.target.value)}} style={{flex:1,minWidth:0}} title="Policy end date"/>
    </div>
  )
}

// ── New Checklist Form ────────────────────────────────────────
function NewChecklistModal({ user, lobs, onCreated, onClose }) {
  const [form, setForm] = useState({ insured:'', policy:'', term:'', date:new Date().toISOString().split('T')[0], checkedby:user?.fullname||user?.username||'', am:'', lob:'' })
  const [lobsSelected, setLobsSelected] = useState([])
  const [showLobPicker, setShowLobPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nonLockedLobs = lobs.filter(l=>!l.locked)

  async function handleCreate() {
    setErr('')
    if (!form.insured.trim()) return setErr('Insured Name is required')
    let selectedLobs = []
    if (form.lob==='PKG') {
      if (lobsSelected.length===0) return setErr('Select at least one LOB for package')
      selectedLobs = lobsSelected
    } else {
      const l = lobs.find(x=>x.id===form.lob)
      if (!l) return setErr('Please select a Line of Business')
      selectedLobs = [l.name]
    }
    setLoading(true)
    try {
      const { checklist } = await api('/api/checklists', { method:'POST', body:{ ...form, lobs:selectedLobs } })
      onCreated(checklist.id)
    } catch(e) { setErr(e.message) }
    setLoading(false)
  }

  return (
    <div className="modal-overlay open" style={{zIndex:500}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal-box" style={{width:560,maxWidth:'95vw',borderRadius:20,overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'20px 24px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,#5b31f4,#7c5bff)'}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>＋ New Checklist</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.6)',marginTop:2}}>Fill in policy details to get started</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,color:'#fff',width:28,height:28,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>

        <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
          {err && <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,padding:'9px 13px',fontSize:13,color:'#dc2626'}}>⚠ {err}</div>}

          {/* Row 1: Insured + Policy */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div className="hf-label" style={{marginBottom:5}}>Insured Name <span className="hf-required">*</span></div>
              <input className="hf-input" value={form.insured} onChange={e=>setForm(p=>({...p,insured:e.target.value}))} placeholder="e.g. Sunrise Logistics LLC" autoFocus/>
            </div>
            <div>
              <div className="hf-label" style={{marginBottom:5}}>Policy Number</div>
              <input className="hf-input" value={form.policy} onChange={e=>setForm(p=>({...p,policy:e.target.value}))} placeholder="e.g. GL-2024-00142"/>
            </div>
          </div>

          {/* Row 2: Term + Date */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div className="hf-label" style={{marginBottom:5}}>Policy Term</div>
              <TermPicker value={form.term} onChange={v=>setForm(p=>({...p,term:v}))} className="hf-input"/>
            </div>
            <div>
              <div className="hf-label" style={{marginBottom:5}}>Date Checked</div>
              <input className="hf-input" type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
            </div>
          </div>

          {/* Row 3: Checked By + AM */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div className="hf-label" style={{marginBottom:5}}>Checked By</div>
              <input className="hf-input" value={form.checkedby} onChange={e=>setForm(p=>({...p,checkedby:e.target.value}))}/>
            </div>
            <div>
              <div className="hf-label" style={{marginBottom:5}}>Account Manager</div>
              <input className="hf-input" value={form.am} onChange={e=>setForm(p=>({...p,am:e.target.value}))}/>
            </div>
          </div>

          {/* Row 4: LOB */}
          <div>
            <div className="hf-label" style={{marginBottom:5}}>Line of Business <span className="hf-required">*</span></div>
            <select className="hf-input" style={{appearance:'auto'}} value={form.lob} onChange={e=>{setForm(p=>({...p,lob:e.target.value}));if(e.target.value==='PKG')setShowLobPicker(true)}}>
              <option value="">— Select LOB —</option>
              <option value="PKG">📦 Package (multiple LOBs)</option>
              {nonLockedLobs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {form.lob==='PKG' && (
              <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
                {lobsSelected.length===0
                  ? <span style={{fontSize:12,color:'var(--muted)'}}>No LOBs selected</span>
                  : lobsSelected.map(l=><span key={l} className="pkg-tag">{l}</span>)
                }
                <button type="button" onClick={()=>setShowLobPicker(true)} style={{fontSize:11,color:'var(--vivid)',background:'none',border:'1px solid var(--vivid)',borderRadius:6,padding:'2px 8px',cursor:'pointer'}}>✏ {lobsSelected.length?'Change':'Select'}</button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-modal-apply" onClick={handleCreate} disabled={loading} style={{minWidth:140}}>
            {loading ? 'Creating…' : '📄 Create Checklist'}
          </button>
        </div>
      </div>

      {/* LOB picker sub-modal */}
      {showLobPicker && (
        <div className="modal-overlay open" style={{zIndex:600}}>
          <div className="modal-box">
            <div className="modal-header"><div className="modal-title">Select LOBs for Package</div><button className="modal-close" onClick={()=>setShowLobPicker(false)}>×</button></div>
            <div className="modal-list">
              {nonLockedLobs.map(l=>(
                <div key={l.id} className={`modal-item ${lobsSelected.includes(l.name)?'selected':''}`} onClick={()=>setLobsSelected(p=>p.includes(l.name)?p.filter(x=>x!==l.name):[...p,l.name])}>
                  <span>{l.name}</span>{lobsSelected.includes(l.name)&&<span style={{color:'var(--vivid)',fontWeight:700}}>✓</span>}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={()=>setShowLobPicker(false)}>Cancel</button>
              <button className="btn-modal-apply" onClick={()=>setShowLobPicker(false)}>Apply ({lobsSelected.length} selected)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Audit Trail Panel ─────────────────────────────────────────
function AuditTrailPanel({ checklistId }) {
  const [trail, setTrail] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api(`/api/audit?checklistId=${checklistId}`)
      .then(d => setTrail(d.trail||[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [checklistId])

  const CHANGE_COLORS = {
    status_change: { bg:'#f0fdf4', border:'#86efac', color:'#166534', icon:'🔄' },
    field_edit:    { bg:'#eff6ff', border:'#93c5fd', color:'#1e40af', icon:'✏️' },
    header_edit:   { bg:'#faf5ff', border:'#c4b5fd', color:'#5b21b6', icon:'📋' },
    completed:     { bg:'#f0fdf4', border:'#6ee7b7', color:'#065f46', icon:'✅' },
    reset:         { bg:'#fff7ed', border:'#fcd34d', color:'#92400e', icon:'↺'  },
    created:       { bg:'#f0f9ff', border:'#7dd3fc', color:'#0369a1', icon:'🆕' },
  }

  if (loading) return <div style={{textAlign:'center',padding:40}}><div className="loading-spinner"/></div>

  return (
    <div style={{padding:'20px 24px'}}>
      <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>📜 Audit Trail</div>
      <div style={{fontSize:12,color:'var(--muted)',marginBottom:20}}>Complete history of every change made to this checklist</div>
      {trail.length===0 ? (
        <div style={{textAlign:'center',padding:'40px 20px',color:'var(--muted)',background:'#faf8ff',borderRadius:14,border:'1.5px dashed #e0e7ff'}}>
          <div style={{fontSize:32,opacity:.3,marginBottom:8}}>📜</div>
          <div style={{fontWeight:700}}>No changes recorded yet</div>
          <div style={{fontSize:12,marginTop:4}}>Changes will appear here as you edit the checklist</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {trail.map((t,i) => {
            const style = CHANGE_COLORS[t.change_type]||CHANGE_COLORS.field_edit
            return (
              <div key={i} style={{display:'flex',gap:14,padding:'12px 16px',background:style.bg,border:`1.5px solid ${style.border}`,borderRadius:12,alignItems:'flex-start'}}>
                <div style={{fontSize:18,flexShrink:0,marginTop:1}}>{style.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                    <div>
                      <span style={{fontWeight:700,fontSize:13,color:style.color}}>{t.username}</span>
                      {t.field_label && <span style={{fontSize:13,color:'#374151'}}> changed <b>{t.field_label}</b></span>}
                      {t.section && <span style={{fontSize:11,color:'var(--muted)'}}> in {t.section}</span>}
                    </div>
                    <div style={{fontSize:11,color:'var(--muted)',flexShrink:0,whiteSpace:'nowrap'}}>{fmtDateTime(t.created_at)}</div>
                  </div>
                  {(t.old_value||t.new_value) && (
                    <div style={{marginTop:6,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                      {t.old_value && <span style={{fontSize:11,background:'rgba(0,0,0,.05)',padding:'2px 8px',borderRadius:6,textDecoration:'line-through',color:'#9ca3af'}}>{t.old_value}</span>}
                      {t.old_value&&t.new_value && <span style={{fontSize:11,color:'var(--muted)'}}>→</span>}
                      {t.new_value && <span style={{fontSize:11,background:'rgba(0,0,0,.05)',padding:'2px 8px',borderRadius:6,fontWeight:600,color:style.color}}>{t.new_value}</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Editor ────────────────────────────────────────────────────
function Editor({ checklistId, user, lobs, coverageFields, onBack, showToast }) {
  const [cl, setCl] = useState(null)
  const [entries, setEntries] = useState({})
  const [snapshots, setSnapshots] = useState([])
  const [activeTab, setActiveTab] = useState('checklist')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewStyle, setPreviewStyle] = useState('excel')
  const [withSnaps, setWithSnaps] = useState(true)
  const [lobModalOpen, setLobModalOpen] = useState(false)
  const [lobsSelected, setLobsSelected] = useState([])
  const [previewDropOpen, setPreviewDropOpen] = useState(false)
  const [downloadDropOpen, setDownloadDropOpen] = useState(false)
  const saveTimerRef = useRef(null)
  const previewRef = useRef(null)
  const downloadRef = useRef(null)

  useEffect(() => {
    function h(e) {
      if (previewRef.current&&!previewRef.current.contains(e.target)) setPreviewDropOpen(false)
      if (downloadRef.current&&!downloadRef.current.contains(e.target)) setDownloadDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { loadData() }, [checklistId])

  async function loadData() {
    setLoading(true)
    try {
      const data = await api(`/api/checklists/${checklistId}`)
      setCl(data.checklist); setEntries(data.entries||{}); setSnapshots(data.snapshots||[])
    } catch { showToast('⚠ Failed to load checklist') }
    setLoading(false)
  }

  const allSections = cl ? ['Common Declarations',...(cl.lobs||[])] : []
  function getFields(name) { return coverageFields[name]||[] }

  async function saveHeader(updated) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      try { await api(`/api/checklists/${checklistId}`, { method:'PUT', body:{ ...cl,...updated, entries } }) } catch {}
      setSaving(false)
    }, 800)
  }

  function updateCl(field, val) { const updated={...cl,[field]:val}; setCl(updated); saveHeader(updated) }

  async function saveEntry(fieldId, field, val, fieldLabel, section) {
    const oldVal = entries[fieldId]?.[field] || ''
    const newEntries = { ...entries, [fieldId]:{ ...(entries[fieldId]||{}), [field]:val } }
    setEntries(newEntries)
    setSaving(true)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api(`/api/checklists/${checklistId}`, { method:'PUT', body:{ ...cl, entries:newEntries } })
        // Log audit trail for meaningful changes
        if (val !== oldVal && val.length > 0) {
          await api('/api/audit', { method:'POST', body:{
            checklistId, fieldId, fieldLabel: fieldLabel||fieldId, section: section||'',
            changeType: 'field_edit', oldValue: oldVal||null, newValue: val
          }}).catch(() => {})
        }
      } catch {}
      setSaving(false)
    }, 1200)
  }

  async function updateStatus(fieldId, val, fieldLabel, section) {
    const oldVal = entries[fieldId]?.status || 'N/A'
    const newEntries = { ...entries, [fieldId]:{ ...(entries[fieldId]||{}), status:val } }
    setEntries(newEntries)
    setSaving(true)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api(`/api/checklists/${checklistId}`, { method:'PUT', body:{ ...cl, entries:newEntries } })
        if (val !== oldVal) {
          await api('/api/audit', { method:'POST', body:{
            checklistId, fieldId, fieldLabel: fieldLabel||fieldId, section: section||'',
            changeType: 'status_change', oldValue: oldVal, newValue: val
          }}).catch(() => {})
        }
      } catch {}
      setSaving(false)
    }, 400)
  }

  function calcProgress() {
    if (!cl) return 0
    let total=0,filled=0
    allSections.forEach(s=>getFields(s).filter(f=>!f.isHeader).forEach(f=>{
      total++
      const e=entries[f.id]
      if(e&&(e.pol||e.nex||e.status!=='N/A'))filled++
    }))
    return total>0?Math.round(filled/total*100):0
  }

  async function markComplete() {
    try {
      await api(`/api/checklists/${checklistId}`, { method:'PUT', body:{ ...cl,status:'complete',entries } })
      await api('/api/audit', { method:'POST', body:{ checklistId, changeType:'completed', fieldLabel:'Status', oldValue:'In Progress', newValue:'Complete' } }).catch(()=>{})
      setCl(p=>({ ...p,status:'complete',completed_at:new Date().toISOString() }))
      showToast('✅ Marked as complete!')
    } catch { showToast('⚠ Failed to save') }
  }

  async function resetChecklist() {
    if (!confirm('Reset all entries? This cannot be undone.')) return
    setEntries({})
    await api(`/api/checklists/${checklistId}`, { method:'PUT', body:{ ...cl,entries:{} } })
    await api('/api/audit', { method:'POST', body:{ checklistId, changeType:'reset', fieldLabel:'All fields', newValue:'Reset to empty' } }).catch(()=>{})
    showToast('↺ Checklist reset')
  }

  async function applyLobSelection() {
    const updated = { ...cl,lobs:lobsSelected }
    setCl(updated); setLobModalOpen(false)
    await api(`/api/checklists/${checklistId}`, { method:'PUT', body:{ ...updated,entries } })
    showToast('✓ LOBs updated')
  }

  function getRowClass(fieldId) { const s=entries[fieldId]?.status; return s==='Match'||s==='N/A'?'row-locked':s==='Not Match'?'row-notmatch':'' }
  function isLocked(fieldId) { const s=entries[fieldId]?.status; return s==='Match'||s==='N/A' }

  function buildPreviewHtml(style, includeSnaps) {
    const isExcel=style==='excel'
    const headerHtml=`<div style="background:linear-gradient(135deg,#130f2a,#5b31f4);color:#fff;padding:22px 30px 18px;font-family:Arial,sans-serif"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:11px;letter-spacing:1.5px;opacity:.55;margin-bottom:6px;text-transform:uppercase">SkySource Insurance Services</div><div style="font-size:22px;font-weight:800;letter-spacing:-.5px">Policy Verification Checklist</div><div style="font-size:11px;margin-top:5px;opacity:.65;background:rgba(255,255,255,.12);display:inline-block;padding:3px 10px;border-radius:20px">${isExcel?'Excel':'Clean'} Report${includeSnaps?' + Snapshots':''}</div></div><div style="font-size:11px;opacity:.5;text-align:right;padding-top:4px">Generated ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div></div><div style="background:#f5f3ff;padding:14px 28px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px 20px;font-size:12px;border-bottom:2px solid #e0e7ff;font-family:Arial,sans-serif"><div><div style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">Insured</div><div style="font-weight:700;margin-top:2px;color:#1e1b4b">${cl?.insured||'—'}</div></div><div><div style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">Policy #</div><div style="font-weight:700;margin-top:2px;color:#1e1b4b;font-family:monospace">${cl?.policy||'—'}</div></div><div><div style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">Policy Term</div><div style="font-weight:600;margin-top:2px;color:#1e1b4b">${cl?.term||'—'}</div></div><div><div style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">Date Checked</div><div style="margin-top:2px">${cl?.date?new Date(cl.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</div></div><div><div style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">Checked By</div><div style="margin-top:2px">${cl?.checkedby||'—'}</div></div><div><div style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">Account Manager</div><div style="margin-top:2px">${cl?.am||'—'}</div></div></div>`
    const snapshotsHtml=includeSnaps&&snapshots.length>0?`<div style="padding:24px 28px;background:#faf8ff;border-top:2px solid #e0e7ff;font-family:Arial,sans-serif;page-break-before:always"><div style="font-size:16px;font-weight:800;color:#1e1b4b;margin-bottom:18px">📷 Comparison Snapshots</div>${snapshots.map((s,i)=>`<div style="margin-bottom:22px;padding:18px;background:#fff;border:1.5px solid #e0e7ff;border-radius:12px"><div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #f0edfe">Snapshot ${i+1}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:12px"><div><div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.8px;margin-bottom:6px;text-transform:uppercase">Policy Document</div>${s.policy_image_url?`<img src="${s.policy_image_url}" style="width:100%;border-radius:8px;border:1px solid #e0e7ff"/>`:'<div style="height:80px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:11px">No image</div>'}</div><div><div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.8px;margin-bottom:6px;text-transform:uppercase">Nexsure Screenshot</div>${s.nexsure_image_url?`<img src="${s.nexsure_image_url}" style="width:100%;border-radius:8px;border:1px solid #e0e7ff"/>`:'<div style="height:80px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:11px">No image</div>'}</div></div>${s.notes?`<div style="font-size:12px;color:#4b5563;padding:9px 12px;background:#f8f7ff;border-radius:8px;border-left:3px solid #6366f1">${s.notes}</div>`:''}</div>`).join('')}</div>`:(includeSnaps?'<div style="padding:16px 28px;background:#faf8ff;border-top:2px solid #e0e7ff;font-family:Arial;color:#9ca3af;font-size:13px;text-align:center">No snapshots for this checklist.</div>':'')
    const notesHtml=cl?.notes?`<div style="padding:16px 28px;background:#f8f7ff;border-top:1px solid #e0e7ff;font-family:Arial"><div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Notes</div><div style="font-size:13px;color:#374151">${cl.notes}</div></div>`:''
    if (isExcel) {
      const rows=allSections.flatMap(name=>{const fields=getFields(name);return[`<tr><td colspan="7" style="background:#1e1b4b;color:#fff;font-weight:700;padding:9px 14px;font-size:13px;font-family:Arial">${name}</td></tr>`,...fields.map(f=>{if(f.isHeader)return`<tr><td colspan="7" style="background:#e0e7ff;color:#3730a3;font-weight:700;padding:6px 14px;font-size:11px;text-transform:uppercase;font-family:Arial">${f.label}</td></tr>`;const e=entries[f.id]||{};const sc=STATUS_COLORS[e.status||'N/A']||STATUS_COLORS['N/A'];const nm=e.status==='Not Match'?'background:#fff5f5;':'';return`<tr style="${nm}"><td style="padding:6px 10px;font-size:12px;border-bottom:1px solid #f0edff;font-family:Arial;${e.status==='Not Match'?'border-left:3px solid #dc2626':''}">${f.label}</td><td style="padding:6px 8px;font-size:12px;text-align:center;color:#6b7280;font-family:Arial">${e.pg||''}</td><td style="padding:6px 10px;font-size:12px;font-family:Arial">${e.pol||''}</td><td style="padding:6px 10px;font-size:12px;font-family:Arial">${e.nex||''}</td><td style="padding:6px 8px;text-align:center;font-family:Arial"><span style="${sc};padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700">${e.status||'N/A'}</span></td><td style="padding:6px 10px;font-size:12px;color:#6b7280;font-family:Arial">${e.skyComments||''}</td><td style="padding:6px 10px;font-size:12px;color:#6b7280;font-family:Arial">${e.amComments||''}</td></tr>`})]}).join('')
      return `<div style="font-family:Arial">${headerHtml}<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#312e81;color:#fff"><th style="padding:9px 10px;text-align:left;font-size:11px;width:22%">Field</th><th style="padding:9px 6px;text-align:center;font-size:11px;width:5%">Pg</th><th style="padding:9px 10px;text-align:left;font-size:11px;width:18%">Policy Data</th><th style="padding:9px 10px;text-align:left;font-size:11px;width:18%">Nexsure Data</th><th style="padding:9px 6px;text-align:center;font-size:11px;width:10%">Status</th><th style="padding:9px 10px;text-align:left;font-size:11px;width:14%">Sky Source</th><th style="padding:9px 10px;text-align:left;font-size:11px;width:13%">AM</th></tr></thead><tbody>${rows}</tbody></table>${notesHtml}${snapshotsHtml}</div>`
    } else {
      const sections=allSections.map(name=>{const fields=getFields(name);const rows=fields.map(f=>{if(f.isHeader)return`<div style="font-size:11px;font-weight:700;color:#4338ca;padding:7px 0 4px;border-bottom:1px solid #e0e7ff;margin-bottom:4px;text-transform:uppercase;font-family:Arial">${f.label}</div>`;const e=entries[f.id]||{};const sc=STATUS_COLORS[e.status||'N/A']||STATUS_COLORS['N/A'];const nm=e.status==='Not Match'?'background:#fff5f5;border-left:3px solid #dc2626;':'';return`<div style="display:grid;grid-template-columns:180px 1fr 1fr 95px;gap:8px;padding:8px 10px;border-bottom:1px solid #f8f7ff;font-size:12px;align-items:start;${nm}"><div style="font-weight:600;color:#374151;font-family:Arial">${f.label}</div><div><div style="font-size:10px;color:#9ca3af;font-weight:600;margin-bottom:2px">POLICY</div><div>${e.pol||'—'}</div></div><div><div style="font-size:10px;color:#9ca3af;font-weight:600;margin-bottom:2px">NEXSURE</div><div>${e.nex||'—'}</div></div><div><span style="${sc};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;display:inline-block">${e.status||'N/A'}</span></div></div>`}).join('');return`<div style="margin-bottom:22px"><h2 style="font-size:14px;font-weight:700;color:#1e1b4b;padding:9px 14px;background:linear-gradient(90deg,#e0e7ff,#f5f3ff);border-left:4px solid #6366f1;margin:0 0 10px;font-family:Arial">${name}</h2><div>${rows}</div></div>`}).join('')
      return `<div style="font-family:Arial">${headerHtml}<div style="padding:22px 28px">${sections}</div>${notesHtml}${snapshotsHtml}</div>`
    }
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:400}}><div className="loading-spinner"/></div>
  if (!cl) return null
  const pct=calcProgress()
  const nonLockedLobs=lobs.filter(l=>!l.locked)

  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      <div className="sticky-bar no-print">
        <div className="sticky-top-row">
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={onBack} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'Sora,sans-serif',fontSize:13}}>← Back</button>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--ink)'}}>{cl.insured||'Checklist'}</div>
              <div style={{fontSize:11,color:'var(--vivid)',fontFamily:'monospace'}}>{cl.policy||'—'}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:saving?'#8b5cf6':'var(--match)',fontWeight:600}}>{saving?'⟳ Saving…':'✓ Saved'}</span>
            <div className="export-row">
              <div ref={previewRef} className={`download-dropdown-wrap ${previewDropOpen?'open':''}`}>
                <button className="btn-sm btn-outline" onClick={()=>{setPreviewDropOpen(p=>!p);setDownloadDropOpen(false)}}>👁 Preview ▾</button>
                <div className="download-menu" style={{minWidth:220}}>
                  {[['clean','📄 Clean Report'],['excel','📊 Excel Report']].map(([s,l])=>(
                    <div key={s}>
                      <div className="download-menu-item" style={{fontWeight:700,padding:'9px 14px 4px',fontSize:13}}>{l}</div>
                      <div className="download-menu-item" style={{paddingLeft:22,paddingTop:2,paddingBottom:6,color:'#6b7280',fontSize:12}} onClick={()=>{setPreviewStyle(s);setWithSnaps(false);setPreviewOpen(true);setPreviewDropOpen(false)}}>Without snapshots</div>
                      <div className="download-menu-item" style={{paddingLeft:22,paddingTop:2,paddingBottom:9,color:'var(--vivid)',fontSize:12,fontWeight:600}} onClick={()=>{setPreviewStyle(s);setWithSnaps(true);setPreviewOpen(true);setPreviewDropOpen(false)}}>+ Snapshots ✨</div>
                    </div>
                  ))}
                </div>
              </div>
              <div ref={downloadRef} className={`download-dropdown-wrap ${downloadDropOpen?'open':''}`}>
                <button className="btn-sm btn-filled" onClick={()=>{setDownloadDropOpen(p=>!p);setPreviewDropOpen(false)}}>⬇ Download PDF ▾</button>
                <div className="download-menu" style={{minWidth:220}}>
                  {[['clean','📄 Clean Report'],['excel','📊 Excel Report']].map(([s,l])=>(
                    <div key={s}>
                      <div className="download-menu-item" style={{fontWeight:700,padding:'9px 14px 4px',fontSize:13}}>{l}</div>
                      <div className="download-menu-item" style={{paddingLeft:22,paddingTop:2,paddingBottom:6,color:'#6b7280',fontSize:12}} onClick={()=>{downloadAsPdf(buildPreviewHtml(s,false),`SkySource-${cl.insured||'checklist'}-${s}`);setDownloadDropOpen(false)}}>Without snapshots</div>
                      <div className="download-menu-item" style={{paddingLeft:22,paddingTop:2,paddingBottom:9,color:'var(--vivid)',fontSize:12,fontWeight:600}} onClick={()=>{downloadAsPdf(buildPreviewHtml(s,true),`SkySource-${cl.insured||'checklist'}-${s}-snapshots`);setDownloadDropOpen(false)}}>+ Snapshots ✨</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-sm btn-success" onClick={markComplete}>✓ Complete</button>
              <button className="btn-sm btn-danger" onClick={resetChecklist}>↺ Reset</button>
            </div>
          </div>
        </div>
        <div style={{display:'flex',borderTop:'1px solid var(--border)',padding:'0 22px'}}>
          <button className={`tab-btn ${activeTab==='checklist'?'active':''}`} onClick={()=>setActiveTab('checklist')}>📋 Checklist</button>
          <button className={`tab-btn ${activeTab==='snapshots'?'active':''}`} onClick={()=>setActiveTab('snapshots')}>
            🖼 Snapshots{snapshots.length>0&&<span style={{background:'var(--vivid)',color:'#fff',borderRadius:20,padding:'1px 6px',fontSize:10,marginLeft:4}}>{snapshots.length}</span>}
          </button>
          <button className={`tab-btn ${activeTab==='audit'?'active':''}`} onClick={()=>setActiveTab('audit')}>📜 Audit Trail</button>
        </div>
      </div>

      {activeTab==='checklist'&&(
        <div className="main-content" style={{paddingTop:18}}>
          {cl.status==='complete'&&<div className="complete-banner">✅ This checklist is complete · {fmtDate(cl.completed_at)}</div>}
          <div className="header-panel">
            <div className="panel-title"><span>📄</span> Policy Header</div>
            <div className="header-grid">
              <div><div className="hf-label">Insured Name</div><input className="hf-input" value={cl.insured||''} onChange={e=>updateCl('insured',e.target.value)}/></div>
              <div><div className="hf-label">Policy Number</div><input className="hf-input" value={cl.policy||''} onChange={e=>updateCl('policy',e.target.value)}/></div>
              <div><div className="hf-label">Policy Term</div><TermPicker value={cl.term||''} onChange={v=>updateCl('term',v)} className="hf-input"/></div>
              <div><div className="hf-label">Date Checked</div><input className="hf-input" type="date" value={cl.date||''} onChange={e=>updateCl('date',e.target.value)}/></div>
              <div><div className="hf-label">Checked By</div><input className="hf-input" value={cl.checkedby||''} onChange={e=>updateCl('checkedby',e.target.value)}/></div>
              <div><div className="hf-label">Account Manager</div><input className="hf-input" value={cl.am||''} onChange={e=>updateCl('am',e.target.value)}/></div>
              <div style={{gridColumn:'span 2'}}>
                <div className="hf-label">LOB</div>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{(cl.lobs||[]).map(l=><span key={l} className="pkg-tag">{l}</span>)}</div>
                  <button className="btn-sm btn-outline" style={{fontSize:11,padding:'5px 11px'}} onClick={()=>{setLobsSelected(cl.lobs||[]);setLobModalOpen(true)}}>✏ Change LOB</button>
                </div>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--muted)',marginBottom:4}}>
                <span>Completion Progress</span>
                <span style={{fontWeight:700,color:pct===100?'var(--match)':'var(--vivid)'}}>{pct}%</span>
              </div>
              <div className="progress-wrap"><div className="progress-fill" style={{width:pct+'%'}}/></div>
            </div>
          </div>
          {allSections.map(sName => {
            const fields=getFields(sName)
            if (!fields.length) return (
              <div key={sName} className="section-wrap">
                <div className="section-header"><span className="section-name">{sName}</span><span style={{color:'rgba(255,255,255,.5)',fontSize:12}}>No fields — edit in Admin Panel</span></div>
              </div>
            )
            return <SectionTable key={sName} sName={sName} fields={fields} entries={entries} onEntry={(fId,field,val,fLabel)=>saveEntry(fId,field,val,fLabel,sName)} onStatus={(fId,val,fLabel)=>updateStatus(fId,val,fLabel,sName)} getRowClass={getRowClass} isLocked={isLocked}/>
          })}
          <div className="note-section">
            <div className="note-header"><span style={{fontSize:16}}>📝</span><span className="note-title">Notes</span></div>
            <div style={{padding:'16px 20px'}}>
              <textarea className="note-textarea" value={cl.notes||''} onChange={e=>updateCl('notes',e.target.value)} placeholder="Add important notes…" rows={4}/>
            </div>
          </div>
        </div>
      )}
      {activeTab==='snapshots'&&<SnapshotsPanel checklistId={checklistId} snapshots={snapshots} setSnapshots={setSnapshots} showToast={showToast}/>}
      {activeTab==='audit'&&(
        <div className="main-content" style={{paddingTop:18}}>
          <div className="header-panel" style={{padding:0,overflow:'hidden'}}>
            <AuditTrailPanel checklistId={checklistId}/>
          </div>
        </div>
      )}

      {lobModalOpen&&(
        <div className="modal-overlay open">
          <div className="modal-box">
            <div className="modal-header">
              <div><div className="modal-title">Select LOBs</div><div style={{fontSize:12,opacity:.6,marginTop:2}}>Common Declarations always included</div></div>
              <button className="modal-close" onClick={()=>setLobModalOpen(false)}>×</button>
            </div>
            <div className="modal-list">
              {nonLockedLobs.map(l=>(
                <div key={l.id} className={`modal-item ${lobsSelected.includes(l.name)?'selected':''}`} onClick={()=>setLobsSelected(p=>p.includes(l.name)?p.filter(x=>x!==l.name):[...p,l.name])}>
                  <span>{l.name}</span>{lobsSelected.includes(l.name)&&<span style={{color:'var(--vivid)',fontWeight:700}}>✓</span>}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={()=>setLobModalOpen(false)}>Cancel</button>
              <button className="btn-modal-apply" onClick={applyLobSelection}>Apply ({lobsSelected.length} selected)</button>
            </div>
          </div>
        </div>
      )}
      {previewOpen&&(
        <div className="modal-overlay open" style={{zIndex:300}}>
          <div className="modal-box" style={{width:'92vw',maxWidth:1100,maxHeight:'92vh'}}>
            <div className="modal-header" style={{flexShrink:0}}>
              <div>
                <div className="modal-title">{previewStyle==='excel'?'📊 Excel Report':'📄 Clean Report'}{withSnaps?' + Snapshots':''}</div>
                <div style={{fontSize:11,opacity:.6,marginTop:3}}>Preview — use Download PDF to save</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button style={{background:'linear-gradient(135deg,#5b31f4,#7c5bff)',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Sora,sans-serif'}} onClick={()=>downloadAsPdf(buildPreviewHtml(previewStyle,withSnaps),`SkySource-${cl?.insured||'checklist'}`)}>⬇ Download PDF</button>
                <button className="modal-close" onClick={()=>setPreviewOpen(false)}>×</button>
              </div>
            </div>
            <div style={{flex:1,overflow:'auto'}} dangerouslySetInnerHTML={{__html:buildPreviewHtml(previewStyle,withSnaps)}}/>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section Table ─────────────────────────────────────────────
function SectionTable({ sName, fields, entries, onEntry, onStatus, getRowClass, isLocked }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="section-wrap">
      <div className="section-header" onClick={()=>setOpen(p=>!p)}>
        <span className="section-name">{sName}</span>
        <span style={{color:'rgba(255,255,255,.7)',fontSize:12,transition:'transform .2s',transform:open?'rotate(180deg)':'none',display:'inline-block'}}>▼</span>
      </div>
      {open&&(
        <table className="checklist-table">
          <thead><tr><th style={{width:'26%'}}>Field</th><th style={{width:'6%',textAlign:'center'}}>Pg #</th><th style={{width:'18%'}}>Policy Data</th><th style={{width:'18%'}}>Nexsure Data</th><th style={{width:'12%',textAlign:'center'}}>Status</th><th style={{width:'12%'}}>Sky Source</th><th style={{width:'8%'}}>AM</th></tr></thead>
          <tbody>
            {fields.map(f => {
              if (f.isHeader) return <tr key={f.id} className="header-row"><td colSpan={7}>{f.label}</td></tr>
              const e=entries[f.id]||{}
              const locked=isLocked(f.id)
              const sc=STATUS_CLS[e.status||'N/A']||'ss-na'
              return (
                <tr key={f.id} className={getRowClass(f.id)}>
                  <td style={{fontSize:12,fontWeight:500,padding:'6px 10px'}}>{f.label}</td>
                  <td style={{textAlign:'center'}}><input className="cell-input cell-pg" value={e.pg||''} onChange={ev=>onEntry(f.id,'pg',ev.target.value,f.label)} placeholder="—"/></td>
                  <td><input className="cell-input" value={e.pol||''} onChange={ev=>onEntry(f.id,'pol',ev.target.value,f.label)} placeholder="Policy data" readOnly={locked}/></td>
                  <td><input className="cell-input" value={e.nex||''} onChange={ev=>onEntry(f.id,'nex',ev.target.value,f.label)} placeholder="Nexsure data" readOnly={locked}/></td>
                  <td style={{textAlign:'center'}}>
                    <select className={`status-select ${sc}`} value={e.status||'N/A'} onChange={ev=>onStatus(f.id,ev.target.value,f.label)}>
                      {['Match','Not Match','Not Found','N/A'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><input className="cell-input" value={e.skyComments||''} onChange={ev=>onEntry(f.id,'skyComments',ev.target.value,f.label)} placeholder="Sky Source…"/></td>
                  <td><input className="cell-input" value={e.amComments||''} onChange={ev=>onEntry(f.id,'amComments',ev.target.value,f.label)} placeholder="AM…"/></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Snapshots Panel ───────────────────────────────────────────
function SnapshotsPanel({ checklistId, snapshots, setSnapshots, showToast }) {
  async function addSnapshot() {
    const pos=(snapshots.length>0?Math.max(...snapshots.map(s=>s.position)):0)+1
    setSnapshots(p=>[...p,{checklist_id:checklistId,position:pos,policy_image_url:null,nexsure_image_url:null,notes:''}])
  }
  async function deleteSnapshot(pos) {
    if (!confirm('Delete this snapshot?')) return
    setSnapshots(p=>p.filter(s=>s.position!==pos))
    await api(`/api/snapshots?checklistId=${checklistId}`,{method:'DELETE',body:{position:pos}})
    showToast('Snapshot deleted')
  }
  function handleImageUpload(pos,side,file) {
    if (!file) return
    const reader=new FileReader()
    reader.onload=async(e)=>{
      const b64=e.target.result.split(',')[1]
      try {
        const{snapshot}=await api(`/api/snapshots?checklistId=${checklistId}`,{method:'POST',body:{position:pos,[`${side}ImageB64`]:b64,[`${side}Mime`]:file.type}})
        setSnapshots(p=>p.map(s=>s.position===pos?{...s,...snapshot}:s))
        showToast('✓ Image uploaded')
      } catch { showToast('⚠ Upload failed') }
    }
    reader.readAsDataURL(file)
  }
  async function updateNotes(pos,notes) {
    setSnapshots(p=>p.map(s=>s.position===pos?{...s,notes}:s))
    await api(`/api/snapshots?checklistId=${checklistId}`,{method:'POST',body:{position:pos,notes}})
  }
  return (
    <div className="main-content" style={{paddingTop:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>Comparison Snapshots</div>
          <div className="page-sub">Upload policy and Nexsure screenshots side by side · Included by default in PDF download</div>
        </div>
        <button className="btn-primary" onClick={addSnapshot}>＋ Add Snapshot</button>
      </div>
      {snapshots.length===0?(
        <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted)',background:'var(--card)',border:'2px dashed #e0e7ff',borderRadius:'var(--radius)'}}>
          <div style={{fontSize:40,opacity:.2,marginBottom:12}}>🖼️</div>
          <div style={{fontWeight:700,fontSize:15}}>No snapshots yet</div>
          <div style={{fontSize:13,marginTop:6}}>Add a snapshot to compare policy documents with Nexsure data</div>
          <button className="btn-primary" style={{marginTop:16}} onClick={addSnapshot}>＋ Add First Snapshot</button>
        </div>
      ):snapshots.map(snap=>(
        <div key={snap.position} className="snapshot-card">
          <div style={{fontSize:15,fontWeight:700,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Snapshot {snap.position}</span>
            <button onClick={()=>deleteSnapshot(snap.position)} style={{background:'none',border:'1.5px solid #fca5a5',borderRadius:8,color:'#dc2626',padding:'4px 10px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>🗑 Delete</button>
          </div>
          <div className="snap-grid">
            {[['policy','Policy Document'],['nexsure','Nexsure Screenshot']].map(([side,label])=>(
              <div key={side}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'var(--muted)',marginBottom:8}}>{label}</div>
                {snap[`${side}_image_url`]?(
                  <div className="snap-img-wrap" style={{position:'relative',cursor:'pointer'}} onClick={()=>document.getElementById(`snap-${snap.position}-${side}`).click()}>
                    <img src={snap[`${side}_image_url`]} alt={label}/>
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',opacity:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:600,transition:'opacity .15s',borderRadius:10}}
                      onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0}>📤 Replace</div>
                  </div>
                ):(
                  <div className="snap-upload-area" onClick={()=>document.getElementById(`snap-${snap.position}-${side}`).click()}>
                    <div style={{fontSize:30,opacity:.25}}>🖼️</div>
                    <div style={{fontSize:13,fontWeight:600}}>Click to upload</div>
                    <div style={{fontSize:11,opacity:.6}}>PNG, JPG up to 10 MB</div>
                  </div>
                )}
                <input id={`snap-${snap.position}-${side}`} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleImageUpload(snap.position,side,e.target.files[0])}/>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'var(--muted)',marginBottom:6}}>Notes</div>
            <textarea style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:10,fontFamily:'Sora,sans-serif',fontSize:13,resize:'none',outline:'none'}} rows={2}
              placeholder="e.g. Page 4 — deductible amounts differ" value={snap.notes||''} onChange={e=>updateNotes(snap.position,e.target.value)}
              onFocus={e=>e.target.style.borderColor='var(--vivid)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── AI Review Page (Rudra only) ───────────────────────────────
function AIReviewPage({ showToast }) {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  function handleFile(f) {
    if (!f) return
    if (f.type!=='application/pdf'&&!f.type.startsWith('image/')) { showToast('⚠ Please upload a PDF or image file'); return }
    setFile(f); setFileName(f.name); setResult(null)
  }
  async function runReview() {
    if (!file) return showToast('⚠ Please upload a policy document first')
    setProcessing(true); setResult(null)
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=()=>rej(new Error('Read failed'));r.readAsDataURL(file)})
      const isImage=file.type.startsWith('image/')
      const contentBlock=isImage?{type:'image',source:{type:'base64',media_type:file.type,data:b64}}:{type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}}
      const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:4000,system:`You are an expert insurance policy analyst for SkySource Insurance Services.\nAnalyze the provided policy document and extract key coverage information.\nReturn ONLY valid JSON:\n{"insured":"...","policy_number":"...","policy_term":"...","fields":[{"section":"Common Declarations","field":"Field Name","value":"Extracted Value","page":"3","confidence":"high|medium|low","match_suggestion":"Match|Not Match|Not Found|N/A"}],"summary":"Brief summary"}`,messages:[{role:'user',content:[contentBlock,{type:'text',text:'Analyze this insurance policy document and extract all coverage fields, values, and page numbers. Return structured JSON.'}]}]})})
      const data=await response.json()
      const text=data.content?.map(c=>c.text||'').join('')
      let parsed=null
      try { parsed=JSON.parse(text.replace(/```json|```/g,'').trim()) } catch { parsed={summary:text,fields:[]} }
      setResult(parsed); showToast('✅ AI analysis complete!')
    } catch(e) { showToast('⚠ Analysis failed: '+e.message) }
    setProcessing(false)
  }
  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{background:'linear-gradient(135deg,#5b31f4,#7c5bff)',borderRadius:10,padding:'5px 10px',fontSize:14,color:'#fff'}}>✨ BETA</span>
            AI Policy Review
          </div>
          <div className="page-sub">Drop a policy document or ACORD form — Claude AI will extract fields, values, and page numbers automatically</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        {[['📄','Policy Documents','Upload PDF or image of the full policy'],['📋','ACORD Forms','Certificate of Insurance, ACORD 25, 28, etc.'],['🔍','Auto-Extract','AI finds field values and page numbers'],['✅','Smart Matching','Suggests Match/Not Match based on analysis']].map(([icon,title,desc])=>(
          <div key={title} style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:14,padding:'16px 20px',display:'flex',gap:14,alignItems:'flex-start'}}>
            <div style={{fontSize:24,flexShrink:0}}>{icon}</div>
            <div><div style={{fontWeight:700,fontSize:14,color:'var(--ink)'}}>{title}</div><div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>{desc}</div></div>
          </div>
        ))}
      </div>
      <div className="header-panel" style={{borderRadius:18,padding:30}}>
        <div className="panel-title"><span>📤</span> Upload Document</div>
        <div style={{border:`2px dashed ${dragOver?'var(--vivid)':'#d0c8ff'}`,borderRadius:16,padding:40,textAlign:'center',cursor:'pointer',transition:'all .2s',background:dragOver?'#faf8ff':'transparent',marginBottom:20}}
          onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}} onClick={()=>fileRef.current?.click()}>
          <div style={{fontSize:48,marginBottom:12,opacity:.4}}>📄</div>
          {fileName?<div><div style={{fontWeight:700,color:'var(--vivid)',fontSize:15}}>✓ {fileName}</div><div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Click to change file</div></div>
          :<div><div style={{fontWeight:700,fontSize:15,color:'var(--ink)'}}>Drop your policy document here</div><div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>or click to browse · PDF or image · Max 10MB</div></div>}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
        <button className="btn-primary" style={{width:'100%',padding:'14px 0',fontSize:15,opacity:processing||!file?.6:1}} onClick={runReview} disabled={processing||!file}>
          {processing?<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}><span className="loading-spinner" style={{width:18,height:18,borderWidth:2}}/> Analyzing with Claude AI…</span>:'✨ Run AI Review'}
        </button>
      </div>
      {result&&(
        <div className="header-panel" style={{borderRadius:18,padding:0,overflow:'hidden',marginTop:20}}>
          <div style={{background:'linear-gradient(135deg,#130f2a,#5b31f4)',padding:'18px 24px',color:'#fff'}}>
            <div style={{fontSize:16,fontWeight:800}}>✨ AI Analysis Results</div>
            {result.summary&&<div style={{fontSize:13,opacity:.7,marginTop:4}}>{result.summary}</div>}
          </div>
          {(result.insured||result.policy_number||result.policy_term)&&(
            <div style={{background:'#f5f3ff',padding:'14px 24px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,fontSize:13,borderBottom:'1px solid #e0e7ff'}}>
              {result.insured&&<div><div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.6}}>Insured</div><div style={{fontWeight:700,marginTop:2}}>{result.insured}</div></div>}
              {result.policy_number&&<div><div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.6}}>Policy #</div><div style={{fontWeight:700,marginTop:2,fontFamily:'monospace'}}>{result.policy_number}</div></div>}
              {result.policy_term&&<div><div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.6}}>Policy Term</div><div style={{fontWeight:700,marginTop:2}}>{result.policy_term}</div></div>}
            </div>
          )}
          {result.fields&&result.fields.length>0?(
            <table className="checklist-table" style={{margin:0}}>
              <thead><tr style={{background:'#312e81',color:'#fff'}}><th>Section</th><th>Field</th><th>Extracted Value</th><th style={{textAlign:'center'}}>Page</th><th style={{textAlign:'center'}}>Confidence</th><th style={{textAlign:'center'}}>Suggestion</th></tr></thead>
              <tbody>
                {result.fields.map((f,i)=>(
                  <tr key={i} style={{background:i%2===0?'#fff':'#faf8ff'}}>
                    <td style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{f.section}</td>
                    <td style={{fontWeight:600,fontSize:13}}>{f.field}</td>
                    <td style={{fontSize:13}}>{f.value}</td>
                    <td style={{textAlign:'center',fontFamily:'monospace',fontSize:12,color:'var(--vivid)'}}>{f.page?`p.${f.page}`:'—'}</td>
                    <td style={{textAlign:'center'}}><span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:700,background:f.confidence==='high'?'#d1fae5':f.confidence==='medium'?'#fef3c7':'#fee2e2',color:f.confidence==='high'?'#065f46':f.confidence==='medium'?'#92400e':'#991b1b'}}>{f.confidence||'low'}</span></td>
                    <td style={{textAlign:'center'}}><span style={{fontSize:10,padding:'2px 9px',borderRadius:20,fontWeight:700,...(()=>{const sc=STATUS_COLORS[f.match_suggestion||'N/A']||STATUS_COLORS['N/A'];return Object.fromEntries(sc.split(';').map(x=>{const[k,v]=x.split(':');return k&&v?[k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v.trim()]:null}).filter(Boolean))})()}}>{f.match_suggestion||'N/A'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ):<div style={{padding:24,color:'var(--muted)',textAlign:'center',fontSize:13}}>No structured fields extracted — check the summary above.</div>}
        </div>
      )}
    </div>
  )
}

// ── Admin Panel ───────────────────────────────────────────────
function AdminPanel({ user, showToast, lobs, setLobs, coverageFields, setCoverageFields }) {
  const [tab, setTab] = useState('stats')
  const [users, setUsers] = useState([])
  const [checklists, setChecklists] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [actFilter, setActFilter] = useState({ from:'', to:'', userId:'all', type:'all' })
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({ username:'', fullname:'', email:'', password:'', role:'user' })
  const [addLobOpen, setAddLobOpen] = useState(false)
  const [lobForm, setLobForm] = useState({ name:'', code:'' })
  const [lobFieldsOpen, setLobFieldsOpen] = useState(false)
  const [editingLob, setEditingLob] = useState(null)
  const [editingFields, setEditingFields] = useState([])

  useEffect(() => {
    api('/api/users').then(d=>setUsers(d.users||[])).catch(()=>{})
    api('/api/checklists').then(d=>setChecklists(d.checklists||[])).catch(()=>{})
  }, [])
  useEffect(() => { if(tab==='activity') loadActivity() }, [tab])

  async function loadActivity(filters=actFilter) {
    setActivityLoading(true)
    try {
      const params=new URLSearchParams()
      if(filters.from)params.set('from',filters.from)
      if(filters.to)params.set('to',filters.to)
      if(filters.userId!=='all')params.set('userId',filters.userId)
      if(filters.type!=='all')params.set('type',filters.type)
      const data=await api(`/api/activity?${params}`)
      setActivityLogs(data.logs||[])
    } catch { showToast('⚠ Could not load activity log') }
    setActivityLoading(false)
  }
  function applyActFilter(updates) { const f={...actFilter,...updates}; setActFilter(f); loadActivity(f) }

  async function saveUser() {
    try {
      if (editingUser) {
        const body={...userForm}; if(!body.password)delete body.password
        const{user}=await api(`/api/users/${editingUser.id}`,{method:'PUT',body})
        setUsers(p=>p.map(u=>u.id===editingUser.id?user:u))
      } else {
        const{user}=await api('/api/users',{method:'POST',body:userForm})
        setUsers(p=>[...p,user])
      }
      setAddUserOpen(false); setEditingUser(null)
      setUserForm({username:'',fullname:'',email:'',password:'',role:'user'})
      showToast('✓ User saved')
    } catch(err) { showToast('⚠ '+err.message) }
  }

  async function deleteUser(u) {
    if (!confirm(`Delete user "${u.username}"?`)) return
    try { await api(`/api/users/${u.id}`,{method:'DELETE'}); setUsers(p=>p.filter(x=>x.id!==u.id)); showToast('User deleted') }
    catch(err) { showToast('⚠ '+err.message) }
  }

  async function transferMasterAdmin(targetUser) {
    if (!confirm(`Transfer Master Admin role to "${targetUser.username}"?\n\nYou will become a regular Admin. This cannot be undone without the new master admin's help.`)) return
    try {
      await api(`/api/users/${targetUser.id}`, { method:'PUT', body:{ username:targetUser.username, fullname:targetUser.fullname, email:targetUser.email, role:'master_admin' } })
      showToast(`👑 Master Admin role transferred to ${targetUser.username}. Please refresh.`)
      // Reload users list
      const d = await api('/api/users')
      setUsers(d.users || [])
    } catch(err) { showToast('⚠ '+err.message) }
  }

  async function adminResetPassword(u) {
    const newPw=prompt(`Set new password for "${u.username}":`)
    if (!newPw||newPw.length<6) return showToast('⚠ Password must be at least 6 chars')
    try {
      await api(`/api/users/${u.id}`,{method:'PUT',body:{username:u.username,fullname:u.fullname,email:u.email,role:u.role,password:newPw}})
      showToast(`✓ Password reset for ${u.username}`)
    } catch(err) { showToast('⚠ '+err.message) }
  }

  async function addLob() {
    if (!lobForm.name||!lobForm.code) return showToast('⚠ Name and code required')
    try {
      const{lob}=await api('/api/lobs',{method:'POST',body:lobForm})
      setLobs(p=>[...p,lob]); if(!coverageFields[lob.name])setCoverageFields(p=>({...p,[lob.name]:[]}))
      setAddLobOpen(false); setLobForm({name:'',code:''})
      showToast(`✓ LOB "${lob.name}" added`)
      setEditingLob(lob); setEditingFields([]); setLobFieldsOpen(true)
    } catch(err) { showToast('⚠ '+err.message) }
  }

  async function deleteLob(l) {
    if (l.locked) return showToast('⚠ This LOB is locked')
    if (!confirm(`Remove LOB "${l.name}"?`)) return
    try { await api(`/api/lobs/${l.id}`,{method:'DELETE'}); setLobs(p=>p.filter(x=>x.id!==l.id)); showToast('LOB removed') }
    catch(err) { showToast('⚠ '+err.message) }
  }

  function openFieldsEditor(lob) { setEditingLob(lob); setEditingFields([...(coverageFields[lob.name]||[])]); setLobFieldsOpen(true) }

  async function saveFields() {
    try {
      await api(`/api/lobs/${editingLob.id}`,{method:'PUT',body:{fields:editingFields,lobName:editingLob.name}})
      setCoverageFields(p=>({...p,[editingLob.name]:editingFields})); setLobFieldsOpen(false)
      showToast(`✓ Fields saved for ${editingLob.name}`)
    } catch(err) { showToast('⚠ '+err.message) }
  }

  function addField(isHeader) { const id=`${editingLob.id}-${Date.now()}`; setEditingFields(p=>[...p,{id,label:isHeader?'New Section Header':'New Field',isHeader:isHeader||false}]) }

  const totalComplete=checklists.filter(c=>c.status==='complete').length
  const ACTION_TYPES=['all','checklist_created','checklist_completed','checklist_updated','checklist_deleted','password_changed','login']
  const ACTION_LABELS={checklist_created:'📋 Created',checklist_completed:'✅ Completed',checklist_updated:'✏️ Updated',checklist_deleted:'🗑 Deleted',password_changed:'🔑 Password',login:'🔐 Login',all:'All Actions'}
  const ACTION_COLORS={checklist_created:'#d1fae5',checklist_completed:'#a7f3d0',checklist_updated:'#dbeafe',checklist_deleted:'#fee2e2',password_changed:'#fef3c7',login:'#ede9fe'}

  return (
    <div className="main-content fade-in">
      <div className="page-header" style={{marginBottom:28}}>
        <div><div className="page-title">🛡 Admin Panel</div><div className="page-sub">Manage users, LOBs, and monitor all system activity</div></div>
      </div>
      <div className="admin-tab-bar">
        {[['stats','📊 Overview'],['users','👥 Users'],['lobs','📋 LOBs'],['activity','📜 Activity Log']].map(([t,l])=>(
          <button key={t} className={`admin-tab-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab==='stats'&&(
        <>
          <div className="stat-grid">
            <div className="stat-card stat-1"><div className="stat-label">Total Checklists</div><div className="stat-value">{checklists.length}</div><div className="stat-trend">{checklists.filter(c=>c.status==='draft').length} in progress</div></div>
            <div className="stat-card stat-2"><div className="stat-label">Total Users</div><div className="stat-value">{users.length}</div><div className="stat-trend">{users.filter(u=>u.role==='admin').length} admin(s) · {users.filter(u=>u.role==='master_admin').length} master</div></div>
            <div className="stat-card stat-3"><div className="stat-label">Completed</div><div className="stat-value">{totalComplete}</div><div className="stat-trend">{Math.round(totalComplete/(checklists.length||1)*100)}% rate</div></div>
            <div className="stat-card stat-4"><div className="stat-label">Active LOBs</div><div className="stat-value">{lobs.filter(l=>!l.locked).length}</div><div className="stat-trend">+{lobs.filter(l=>l.locked).length} system</div></div>
          </div>
          <div className="section-wrap" style={{borderRadius:'var(--radius)'}}>
            <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)'}}><b style={{fontSize:15}}>Recent Checklists</b></div>
            <table className="admin-table">
              <thead><tr><th>Insured</th><th>User</th><th>LOB</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {checklists.slice(0,8).map(c=>(
                  <tr key={c.id}>
                    <td><b>{c.insured}</b><div style={{fontSize:11,color:'var(--vivid)',fontFamily:'monospace'}}>{c.policy}</div></td>
                    <td>{c.username}</td>
                    <td><span className="pkg-tag">{(c.lobs||[]).slice(0,2).join(', ')}{(c.lobs||[]).length>2?` +${c.lobs.length-2}`:''}</span></td>
                    <td><span className={`status-chip ${c.status==='complete'?'chip-complete':'chip-draft'}`}>{c.status==='complete'?'Complete':'In Progress'}</span></td>
                    <td style={{color:'var(--muted)',fontSize:12}}>{fmtDate(c.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab==='users'&&(
        <>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
            {user?.role==='master_admin' && (
              <button className="btn-primary" onClick={()=>{setEditingUser(null);setUserForm({username:'',fullname:'',email:'',password:'',role:'user'});setAddUserOpen(true)}}>＋ Add User</button>
            )}
            {user?.role==='admin' && (
              <button className="btn-primary" onClick={()=>{setEditingUser(null);setUserForm({username:'',fullname:'',email:'',password:'',role:'user'});setAddUserOpen(true)}}>＋ Add User</button>
            )}
          </div>
          <div className="section-wrap" style={{borderRadius:'var(--radius)'}}>
            <table className="admin-table">
              <thead><tr><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.id}>
                    <td><b>{u.username}</b>{u.id===user?.id&&<span style={{fontSize:10,marginLeft:6,background:'#ede9fe',color:'#5b21b6',padding:'2px 7px',borderRadius:10,fontWeight:700}}>YOU</span>}</td>
                    <td>{u.fullname}</td><td style={{color:'var(--muted)'}}>{u.email}</td>
                    <td>
                      {u.role==='master_admin'
                        ? <span className="role-badge" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',border:'none'}}>MASTER ADMIN</span>
                        : <span className={`role-badge ${u.role==='admin'?'role-admin':'role-user'}`}>{u.role.toUpperCase()}</span>
                      }
                    </td>
                    <td style={{color:'var(--muted)',fontSize:12}}>{fmtDate(u.created_at)}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        {/* Edit: master_admin can edit anyone; admin can only edit non-admin/non-master */}
                        {(user?.role==='master_admin' || (user?.role==='admin' && u.role==='user')) && (
                          <button onClick={()=>{setEditingUser(u);setUserForm({username:u.username,fullname:u.fullname,email:u.email,password:'',role:u.role});setAddUserOpen(true)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,padding:'3px 6px',color:'var(--vivid)'}} title="Edit">✏️</button>
                        )}
                        {/* Reset password */}
                        {(user?.role==='master_admin' || (user?.role==='admin' && u.role==='user')) && (
                          <button onClick={()=>adminResetPassword(u)} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,padding:'3px 6px',color:'#d97706'}} title="Reset password">🔑</button>
                        )}
                        {/* Transfer master_admin role — only master_admin, only to other users */}
                        {user?.role==='master_admin' && u.id!==user?.id && u.role!=='master_admin' && (
                          <button onClick={()=>transferMasterAdmin(u)} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,padding:'3px 6px',color:'#f59e0b'}} title="Transfer Master Admin role">👑</button>
                        )}
                        {/* Delete: master_admin can delete admins/users; admin can only delete users; cannot delete master_admin */}
                        {u.role!=='master_admin' && (user?.role==='master_admin' || (user?.role==='admin' && u.role==='user')) && (
                          <button onClick={()=>deleteUser(u)} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,padding:'3px 6px',color:'#fca5a5'}} title="Delete">🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab==='lobs'&&(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div><div style={{fontSize:14,fontWeight:700}}>Lines of Business</div><div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Manage LOBs available in the checklist creator</div></div>
            <button className="btn-primary" onClick={()=>setAddLobOpen(true)}>＋ Add LOB</button>
          </div>
          {lobs.map(l=>(
            <div key={l.id} className="lob-manage-card">
              <div style={{fontSize:18}}>{l.locked?'🔒':'📋'}</div>
              <div className="lob-manage-name">{l.name}</div>
              <span className="pkg-tag">{l.code}</span>
              <div className="lob-manage-fields" style={{marginLeft:4}}>{(coverageFields[l.name]||[]).filter(f=>!f.isHeader).length} fields</div>
              <button className="lob-edit-btn" onClick={()=>openFieldsEditor(l)}>✏ Edit Fields</button>
              {!l.locked&&<button onClick={()=>deleteLob(l)} style={{background:'none',border:'1.5px solid #fca5a5',borderRadius:8,color:'#dc2626',padding:'4px 10px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Remove</button>}
              {l.locked&&<span className="lob-locked-badge">SYSTEM LOB</span>}
            </div>
          ))}
        </>
      )}

      {tab==='activity'&&(
        <>
          <div style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:14,padding:'16px 20px',marginBottom:18,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
            <div><div className="hf-label" style={{marginBottom:4}}>From</div><input className="hf-input" type="date" style={{width:140}} value={actFilter.from} onChange={e=>applyActFilter({from:e.target.value})}/></div>
            <div><div className="hf-label" style={{marginBottom:4}}>To</div><input className="hf-input" type="date" style={{width:140}} value={actFilter.to} onChange={e=>applyActFilter({to:e.target.value})}/></div>
            <div><div className="hf-label" style={{marginBottom:4}}>User</div>
              <select className="hf-input" style={{appearance:'auto',width:160}} value={actFilter.userId} onChange={e=>applyActFilter({userId:e.target.value})}>
                <option value="all">All Users</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
            <div><div className="hf-label" style={{marginBottom:4}}>Action</div>
              <select className="hf-input" style={{appearance:'auto',width:180}} value={actFilter.type} onChange={e=>applyActFilter({type:e.target.value})}>
                {ACTION_TYPES.map(t=><option key={t} value={t}>{ACTION_LABELS[t]||t}</option>)}
              </select>
            </div>
            <button className="btn-sm btn-outline" onClick={()=>{const f={from:'',to:'',userId:'all',type:'all'};setActFilter(f);loadActivity(f)}}>↺ Clear</button>
          </div>
          <div className="section-wrap" style={{borderRadius:'var(--radius)'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <b style={{fontSize:15}}>Activity Log</b>
              <span style={{fontSize:12,color:'var(--muted)'}}>{activityLogs.length} records</span>
            </div>
            {activityLoading?<div style={{textAlign:'center',padding:40}}><div className="loading-spinner"/></div>
            :activityLogs.length===0?<div style={{textAlign:'center',padding:40,color:'var(--muted)',fontSize:13}}>No activity found{actFilter.from||actFilter.to||actFilter.userId!=='all'||actFilter.type!=='all'?' for current filters':' yet — activity will appear here as users log in and work on checklists'}</div>
            :(
              <table className="admin-table">
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>
                  {activityLogs.map((log,i)=>{
                    let detail={}; try{detail=JSON.parse(log.detail||'{}')}catch{}
                    return(
                      <tr key={i}>
                        <td style={{color:'var(--muted)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDateTime(log.created_at)}</td>
                        <td><b style={{fontSize:13}}>{log.username}</b></td>
                        <td><span style={{fontSize:11,padding:'3px 9px',borderRadius:20,fontWeight:700,background:ACTION_COLORS[log.action_type]||'#f3f4f6',color:'#374151'}}>{ACTION_LABELS[log.action_type]||log.action_type}</span></td>
                        <td style={{fontSize:12,color:'var(--muted)'}}>
                          {detail.insured&&<span><b style={{color:'var(--ink)'}}>{detail.insured}</b>{detail.policy?` · ${detail.policy}`:''}</span>}
                          {log.action_type==='password_changed'&&<span>Password changed</span>}
                          {log.action_type==='login'&&<span>Signed in</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {addUserOpen&&(
        <div className="modal-overlay open">
          <div className="modal-box" style={{width:420}}>
            <div className="modal-header"><div className="modal-title">{editingUser?'Edit User':'Add New User'}</div><button className="modal-close" onClick={()=>setAddUserOpen(false)}>×</button></div>
            <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
              {[['username','Username','text'],['fullname','Full Name','text'],['email','Email','email']].map(([field,label,type])=>(
                <div key={field}><div className="hf-label" style={{marginBottom:5}}>{label}</div><input className="hf-input" type={type} value={userForm[field]} onChange={e=>setUserForm(p=>({...p,[field]:e.target.value}))}/></div>
              ))}
              <div><div className="hf-label" style={{marginBottom:5}}>{editingUser?'New Password (leave blank to keep)':'Password'}</div><input className="hf-input" type="password" value={userForm.password} onChange={e=>setUserForm(p=>({...p,password:e.target.value}))} placeholder={editingUser?'(unchanged)':'Set password'}/></div>
              <div><div className="hf-label" style={{marginBottom:5}}>Role</div><select className="hf-input" style={{appearance:'auto'}} value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))} disabled={editingUser?.role==='master_admin'}>
                <option value="user">User</option>
                {(user?.role==='master_admin') && <option value="admin">Admin</option>}
                {editingUser?.role==='master_admin' && <option value="master_admin">Master Admin</option>}
              </select></div>
            </div>
            <div className="modal-footer"><button className="btn-modal-cancel" onClick={()=>setAddUserOpen(false)}>Cancel</button><button className="btn-modal-apply" onClick={saveUser}>Save User</button></div>
          </div>
        </div>
      )}
      {addLobOpen&&(
        <div className="modal-overlay open">
          <div className="modal-box" style={{width:400}}>
            <div className="modal-header"><div className="modal-title">Add New LOB</div><button className="modal-close" onClick={()=>setAddLobOpen(false)}>×</button></div>
            <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
              <div><div className="hf-label" style={{marginBottom:5}}>LOB Name</div><input className="hf-input" value={lobForm.name} onChange={e=>setLobForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Cyber Liability"/></div>
              <div><div className="hf-label" style={{marginBottom:5}}>Short Code</div><input className="hf-input" value={lobForm.code} onChange={e=>setLobForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="e.g. CY" maxLength={6}/></div>
            </div>
            <div className="modal-footer"><button className="btn-modal-cancel" onClick={()=>setAddLobOpen(false)}>Cancel</button><button className="btn-modal-apply" onClick={addLob}>Add LOB</button></div>
          </div>
        </div>
      )}
      {lobFieldsOpen&&editingLob&&(
        <div className="modal-overlay open">
          <div className="modal-box" style={{width:520,maxHeight:'88vh'}}>
            <div className="modal-header">
              <div><div className="modal-title">Edit Fields — {editingLob.name}</div><div style={{fontSize:12,opacity:.6,marginTop:2}}>Add or remove fields</div></div>
              <button className="modal-close" onClick={()=>setLobFieldsOpen(false)}>×</button>
            </div>
            <div className="lob-fields-modal-body">
              {editingFields.length===0&&<div style={{textAlign:'center',padding:24,color:'var(--muted)',fontSize:13}}>No fields yet. Add fields below.</div>}
              {editingFields.map((f,i)=>(
                <div key={i} className="lob-field-row">
                  <span className={`lob-field-type-tag ${f.isHeader?'header-tag':''}`}>{f.isHeader?'HEADER':'FIELD'}</span>
                  <input value={f.label} onChange={e=>setEditingFields(p=>p.map((x,j)=>j===i?{...x,label:e.target.value}:x))}/>
                  <button className="lob-field-del" onClick={()=>setEditingFields(p=>p.filter((_,j)=>j!==i))}>🗑</button>
                </div>
              ))}
            </div>
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:8}}>
              <button onClick={()=>addField(false)} style={{flex:1,padding:9,border:'1.5px dashed #d0c8ff',borderRadius:9,background:'none',color:'var(--vivid)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>＋ Add Field</button>
              <button onClick={()=>addField(true)} style={{flex:1,padding:9,border:'1.5px dashed #fcd34d',borderRadius:9,background:'none',color:'#92400e',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>＋ Add Section Header</button>
            </div>
            <div className="modal-footer"><button className="btn-modal-cancel" onClick={()=>setLobFieldsOpen(false)}>Cancel</button><button className="btn-modal-apply" onClick={saveFields}>Save Fields</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [checklists, setChecklists] = useState([])
  const [clLoading, setClLoading] = useState(false)
  const [activeChecklistId, setActiveChecklistId] = useState(null)
  const [lobs, setLobs] = useState([])
  const [coverageFields, setCoverageFields] = useState({})
  const [toast, setToast] = useState('')
  const [changePwOpen, setChangePwOpen] = useState(false)
  const [newChecklistOpen, setNewChecklistOpen] = useState(false)
  const toastRef = useRef(null)

  function showToast(msg) { setToast(msg); clearTimeout(toastRef.current); toastRef.current=setTimeout(()=>setToast(''),3500) }

  useEffect(() => {
    api('/api/auth/me').then(({user})=>{setUser(user);loadData(user)}).catch(()=>{}).finally(()=>setAuthLoading(false))
  }, [])

  async function loadData(u) {
    if (!u) return
    setClLoading(true)
    try {
      const [clData,lobData]=await Promise.all([api('/api/checklists'),api('/api/lobs')])
      setChecklists(clData.checklists||[]); setLobs(lobData.lobs||[]); setCoverageFields(lobData.fields||{})
    } catch {}
    setClLoading(false)
  }

  async function handleLogin(loggedInUser) { setUser(loggedInUser); await loadData(loggedInUser); setTab('dashboard') }
  async function handleLogout() { await api('/api/auth/logout',{method:'POST'}); setUser(null); setTab('dashboard'); setChecklists([]) }
  function handleOpenChecklist(id) { setActiveChecklistId(id); setTab('editor') }
  async function handleDeleteChecklist(id) {
    try { await api(`/api/checklists/${id}`,{method:'DELETE'}); setChecklists(p=>p.filter(c=>c.id!==id)); showToast('Checklist deleted') }
    catch(err) { showToast('⚠ '+err.message) }
  }
  function handleCreated(id) { setActiveChecklistId(id); setTab('editor'); loadData(user) }

  if (authLoading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--surface)'}}><div className="loading-spinner" style={{width:40,height:40,borderWidth:3}}/></div>
  if (!user) return <LoginScreen onLogin={handleLogin}/>

  return (
    <>
      <TopNav user={user} activeTab={tab} onTab={t=>{if(t!=='editor')setActiveChecklistId(null);setTab(t)}} onLogout={handleLogout} onChangePassword={()=>setChangePwOpen(true)}/>
      {tab==='dashboard'&&<Dashboard user={user} checklists={checklists} loading={clLoading} onOpen={handleOpenChecklist} onNew={()=>setNewChecklistOpen(true)} onDelete={handleDeleteChecklist}/>}
      {tab==='editor'&&activeChecklistId&&<Editor checklistId={activeChecklistId} user={user} lobs={lobs} coverageFields={coverageFields} onBack={()=>{setTab('dashboard');loadData(user)}} showToast={showToast}/>}
      {tab==='admin'&&<AdminPanel user={user} showToast={showToast} lobs={lobs} setLobs={setLobs} coverageFields={coverageFields} setCoverageFields={setCoverageFields}/>}
      {tab==='ai-review'&&user?.username==='Rudra'&&<AIReviewPage showToast={showToast}/>}
      {newChecklistOpen&&<NewChecklistModal user={user} lobs={lobs} onCreated={id=>{setNewChecklistOpen(false);handleCreated(id)}} onClose={()=>setNewChecklistOpen(false)}/>}
      {changePwOpen&&<ChangePasswordModal onClose={()=>setChangePwOpen(false)} showToast={showToast}/>}
      <Toast message={toast}/>
    </>
  )
}
