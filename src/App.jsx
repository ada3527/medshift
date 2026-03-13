import { useState, useEffect, useCallback, useRef } from "react";

const SHIFT_META = {
  temporary: { label: "Temp / Fill-in", bg: "var(--color-background-warning)", color: "var(--color-text-warning)" },
  "part-time": { label: "Part-Time", bg: "var(--color-background-info)", color: "var(--color-text-info)" },
  "full-time": { label: "Full-Time", bg: "var(--color-background-success)", color: "var(--color-text-success)" },
};

function Badge({ type }) {
  const m = SHIFT_META[type] || {};
  return <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: "var(--border-radius-md)", whiteSpace: "nowrap" }}>{m.label}</span>;
}

function Avatar({ name, color = "info", size = 36 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = { info: "var(--color-background-info)", success: "var(--color-background-success)", warning: "var(--color-background-warning)" };
  const fg = { info: "var(--color-text-info)", success: "var(--color-text-success)", warning: "var(--color-text-warning)" };
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg[color] || bg.info, color: fg[color] || fg.info, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: size * 0.35, flexShrink: 0 }}>{initials}</div>;
}

function Card({ children, onClick, style = {} }) {
  return (
    <div onClick={onClick}
      style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: 10, cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s", ...style }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = "var(--color-border-secondary)")}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = "var(--color-border-tertiary)")}
    >{children}</div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>}
      <input style={{ width: "100%", boxSizing: "border-box" }} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>}
      <select style={{ width: "100%", boxSizing: "border-box" }} {...props}>{children}</select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>}
      <textarea style={{ width: "100%", boxSizing: "border-box", minHeight: 72, resize: "vertical", fontFamily: "inherit", fontSize: 14, padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)" }} {...props} />
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg) var(--border-radius-lg) 0 0", width: "100%", maxWidth: wide ? 700 : 580, maxHeight: "90vh", overflow: "auto", padding: "1.5rem", border: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: 17, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg, type = "default" }) {
  if (!msg) return null;
  const styles = {
    default: { bg: "var(--color-text-primary)", fg: "var(--color-background-primary)" },
    success: { bg: "var(--color-background-success)", fg: "var(--color-text-success)" },
    error: { bg: "var(--color-background-danger)", fg: "var(--color-text-danger)" },
  };
  const s = styles[type] || styles.default;
  return <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: s.bg, color: s.fg, padding: "10px 20px", borderRadius: "var(--border-radius-lg)", fontSize: 14, fontWeight: 500, zIndex: 200, whiteSpace: "nowrap", border: "0.5px solid var(--color-border-tertiary)" }}>{msg}</div>;
}

function Chip({ children }) {
  return <span style={{ background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", fontSize: 12, padding: "3px 8px", borderRadius: "var(--border-radius-md)", display: "inline-block" }}>{children}</span>;
}

function StatCard({ value, label }) {
  return <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", flex: "1 1 100px", minWidth: 0 }}><div style={{ fontSize: 24, fontWeight: 500 }}>{value}</div><div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{label}</div></div>;
}

async function storageGet(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function storageSet(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), true); } catch {}
}

async function sendEmailNotification({ to, subject, body }) {
  if (!to || !to.includes("@")) return { ok: false };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        mcp_servers: [{ type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" }],
        messages: [{ role: "user", content: `Send an email via Gmail. To: "${to}", Subject: "${subject}", Body: "${body.replace(/"/g, "'")}". Send it now.` }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    return { ok: text.toLowerCase().includes("sent") || text.toLowerCase().includes("success") };
  } catch { return { ok: false }; }
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [userType, setUserType] = useState(null);
  const [profile, setProfile] = useState(null);

  const [positions, setPositions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState({});

  const [toast, setToast] = useState({ msg: "", type: "default" });
  const [loading, setLoading] = useState(false);

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authRole, setAuthRole] = useState("Dental Assistant");
  const [authOffice, setAuthOffice] = useState("");
  const [authLocation, setAuthLocation] = useState("");

  const [showPost, setShowPost] = useState(false);
  const [postForm, setPostForm] = useState({ role: "", practiceType: "dental", shiftType: "temporary", date: "", time: "", pay: "", location: "", description: "", requirements: "" });

  const [detailPos, setDetailPos] = useState(null);
  const [applyMsg, setApplyMsg] = useState("");
  const [aiMatch, setAiMatch] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");

  const [msgModal, setMsgModal] = useState(null);
  const [msgDraft, setMsgDraft] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const msgEndRef = useRef(null);

  const showToast = (msg, type = "default") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "default" }), 3500); };

  const loadData = useCallback(async () => {
    const [p, a, m] = await Promise.all([storageGet("ms3:positions"), storageGet("ms3:applications"), storageGet("ms3:messages")]);
    setPositions(p || []);
    setApplications(a || []);
    setMessages(m || {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, msgModal]);

  const openMessages = (app, fromOffice) => {
    setMsgModal({ app, threadId: `thread:${app.id}`, otherName: fromOffice ? app.applicantName : app.officeName, otherEmail: fromOffice ? app.applicantEmail : app.officeEmail, fromOffice });
    setMsgDraft("");
  };

  const sendMessage = async () => {
    if (!msgDraft.trim() || !msgModal) return;
    setSendingMsg(true);
    const newMsg = { id: Date.now().toString(), sender: profile.name, senderType: profile.type, text: msgDraft.trim(), ts: new Date().toISOString() };
    const updated = { ...messages, [msgModal.threadId]: [...(messages[msgModal.threadId] || []), newMsg] };
    setMessages(updated);
    await storageSet("ms3:messages", updated);
    setMsgDraft("");
    const emailRes = await sendEmailNotification({
      to: msgModal.otherEmail,
      subject: `New message from ${profile.name} — MedShift`,
      body: `Hi ${msgModal.otherName},\n\n${profile.name} sent you a message about the ${msgModal.app.positionRole} position:\n\n"${newMsg.text}"\n\nLog into MedShift to reply.\n\n— MedShift`,
    });
    setSendingMsg(false);
    showToast(emailRes.ok ? "Message sent + email delivered" : "Message saved (email unavailable)", emailRes.ok ? "success" : "default");
  };

  const MessagingModal = () => {
    if (!msgModal) return null;
    const thread = messages[msgModal.threadId] || [];
    return (
      <Modal open wide title={`Messages with ${msgModal.otherName}`} onClose={() => setMsgModal(null)}>
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 10 }}>Re: {msgModal.app.positionRole} at {msgModal.app.officeName}</div>
        <div style={{ minHeight: 200, maxHeight: 300, overflowY: "auto", marginBottom: 12, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          {thread.length === 0 && <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13, padding: "2rem 0" }}>No messages yet. Start the conversation.</div>}
          {thread.map(msg => {
            const mine = msg.sender === profile.name;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{ maxWidth: "78%", background: mine ? "var(--color-background-info)" : "var(--color-background-secondary)", color: mine ? "var(--color-text-info)" : "var(--color-text-primary)", padding: "8px 12px", borderRadius: "var(--border-radius-lg)", fontSize: 14, lineHeight: 1.5 }}>
                  {!mine && <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3, color: "var(--color-text-secondary)" }}>{msg.sender}</div>}
                  <div>{msg.text}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4, textAlign: "right" }}>{new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea value={msgDraft} onChange={e => setMsgDraft(e.target.value)} placeholder="Type a message… (Enter to send)" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} style={{ flex: 1, resize: "none", minHeight: 56, fontFamily: "inherit", fontSize: 14, padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", boxSizing: "border-box" }} />
          <button onClick={sendMessage} disabled={!msgDraft.trim() || sendingMsg} style={{ flexShrink: 0 }}>{sendingMsg ? "…" : "Send"}</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>An email notification is sent to {msgModal.otherName} with each message.</div>
      </Modal>
    );
  };

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (screen === "landing") return (
    <div style={{ padding: "2rem 1rem", maxWidth: 520, margin: "0 auto" }}>
      <Toast {...toast} />
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⚕️</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: "0 0 6px" }}>MedShift</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 15, margin: 0 }}>Connecting dental & medical offices with qualified staff</p>
        <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 6 }}>Positions & messages are shared across all users in real time</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[{ icon: "🏥", title: "I'm an office", sub: "Post shifts, find staff", type: "office" },
          { icon: "🩺", title: "I'm an assistant", sub: "Find shifts, apply fast", type: "assistant" }
        ].map(opt => (
          <Card key={opt.type} onClick={() => { setUserType(opt.type); setScreen("auth"); }} style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{opt.title}</div>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 12, marginTop: 4 }}>{opt.sub}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  // ── Auth ─────────────────────────────────────────────────────────────────────
  if (screen === "auth") {
    const isOffice = userType === "office";
    return (
      <div style={{ padding: "2rem 1rem", maxWidth: 420, margin: "0 auto" }}>
        <Toast {...toast} />
        <button onClick={() => setScreen("landing")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "1.5rem", padding: 0 }}>← Back</button>
        <h2 style={{ fontWeight: 500, fontSize: 20, margin: "0 0 1.5rem" }}>{isOffice ? "Set up your office" : "Set up your profile"}</h2>
        <Input label="Your name" placeholder={isOffice ? "Dr. Sarah Johnson" : "Maria Chen"} value={authName} onChange={e => setAuthName(e.target.value)} />
        <Input label="Email address (for notifications)" type="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
        {isOffice
          ? <><Input label="Office / Practice name" placeholder="Bright Smile Dental" value={authOffice} onChange={e => setAuthOffice(e.target.value)} /><Input label="City, State" placeholder="Austin, TX" value={authLocation} onChange={e => setAuthLocation(e.target.value)} /></>
          : <><Select label="Your role" value={authRole} onChange={e => setAuthRole(e.target.value)}>{["Dental Assistant", "Dental Hygienist", "Medical Assistant", "Front Desk / Receptionist", "Oral Surgery Assistant"].map(r => <option key={r}>{r}</option>)}</Select><Input label="City, State" placeholder="Austin, TX" value={authLocation} onChange={e => setAuthLocation(e.target.value)} /></>
        }
        <button disabled={!authName || !authEmail || (isOffice && !authOffice)} style={{ width: "100%", marginTop: 8 }} onClick={() => {
          setProfile(isOffice
            ? { name: authName, email: authEmail, office: authOffice, location: authLocation, type: "office" }
            : { name: authName, email: authEmail, role: authRole, location: authLocation, type: "assistant" }
          );
          setScreen(isOffice ? "office" : "assistant");
        }}>Get started →</button>
      </div>
    );
  }

  // ── Office ───────────────────────────────────────────────────────────────────
  if (screen === "office") {
    const myPositions = positions.filter(p => p.officeId === profile.office);
    const myApplicants = applications.filter(a => a.officeId === profile.office);

    const postPosition = async () => {
      if (!postForm.role) return;
      setLoading(true);
      const pos = { id: Date.now().toString(), officeId: profile.office, officeName: profile.office, officeEmail: profile.email, postedBy: profile.name, location: postForm.location || profile.location || "", role: postForm.role, practiceType: postForm.practiceType, shiftType: postForm.shiftType, date: postForm.date || "Flexible", time: postForm.time || "TBD", pay: postForm.pay || "Negotiable", description: postForm.description, requirements: postForm.requirements, postedAt: new Date().toISOString(), status: "active" };
      const next = [pos, ...positions];
      setPositions(next);
      await storageSet("ms3:positions", next);
      setShowPost(false);
      setPostForm({ role: "", practiceType: "dental", shiftType: "temporary", date: "", time: "", pay: "", location: "", description: "", requirements: "" });
      showToast("Position posted!", "success");
      setLoading(false);
    };

    const updateApp = async (appId, status) => {
      const app = applications.find(a => a.id === appId);
      const next = applications.map(a => a.id === appId ? { ...a, status } : a);
      setApplications(next);
      await storageSet("ms3:applications", next);
      if (app) {
        await sendEmailNotification({
          to: app.applicantEmail,
          subject: status === "hired" ? `You have been hired at ${profile.office}! — MedShift` : `Application update from ${profile.office} — MedShift`,
          body: status === "hired"
            ? `Hi ${app.applicantName},\n\nCongratulations! ${profile.office} has hired you for the ${app.positionRole} position. Log into MedShift to message them.\n\n— MedShift`
            : `Hi ${app.applicantName},\n\nThank you for applying to ${profile.office} for the ${app.positionRole} position. They have decided to move forward with other candidates. Keep applying — more shifts are posted daily!\n\n— MedShift`,
        });
      }
      showToast(status === "hired" ? "Hired! Candidate notified." : "Declined. Candidate notified.", status === "hired" ? "success" : "default");
    };

    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 0 2rem" }}>
        <Toast {...toast} />
        <MessagingModal />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚕️</span>
            <div><div style={{ fontWeight: 500, fontSize: 15 }}>{profile.office}</div><div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{profile.name}</div></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadData} style={{ fontSize: 12 }}>Refresh</button>
            <button onClick={() => setScreen("landing")} style={{ fontSize: 12 }}>Sign out</button>
          </div>
        </div>
        <div style={{ padding: "0 1.25rem" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <StatCard value={myPositions.filter(p => p.status === "active").length} label="Active postings" />
            <StatCard value={myApplicants.filter(a => a.status === "pending").length} label="Pending applications" />
            <StatCard value={myApplicants.filter(a => a.status === "hired").length} label="Hired" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 500, fontSize: 16 }}>Your positions</span>
            <button onClick={() => setShowPost(true)}>+ Post position</button>
          </div>
          {myPositions.length === 0 && <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-secondary)", fontSize: 14 }}>No positions posted yet.</div>}
          {myPositions.map(pos => {
            const posApps = applications.filter(a => a.positionId === pos.id);
            return (
              <Card key={pos.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div><div style={{ fontWeight: 500, fontSize: 15 }}>{pos.role}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}><Chip>{pos.date}</Chip><Chip>{pos.pay}</Chip><Chip>{pos.location}</Chip></div></div>
                  <Badge type={pos.shiftType} />
                </div>
                {posApps.length === 0 && <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>No applicants yet</div>}
                {posApps.map(app => (
                  <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "0.5px solid var(--color-border-tertiary)", flexWrap: "wrap" }}>
                    <Avatar name={app.applicantName} color="info" />
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{app.applicantRole} · {app.applicantLocation}</div>
                      {app.message && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic", marginTop: 2 }}>"{app.message}"</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      <button onClick={() => openMessages(app, true)} style={{ fontSize: 12 }}>
                        Message {messages[`thread:${app.id}`]?.length > 0 ? `(${messages[`thread:${app.id}`].length})` : ""}
                      </button>
                      {app.status === "pending"
                        ? <><button onClick={() => updateApp(app.id, "hired")} style={{ fontSize: 12, background: "var(--color-background-success)", color: "var(--color-text-success)", border: "0.5px solid var(--color-border-success)" }}>Hire</button><button onClick={() => updateApp(app.id, "declined")} style={{ fontSize: 12, background: "var(--color-background-danger)", color: "var(--color-text-danger)", border: "0.5px solid var(--color-border-danger)" }}>Decline</button></>
                        : <span style={{ fontSize: 12, fontWeight: 500, color: app.status === "hired" ? "var(--color-text-success)" : "var(--color-text-secondary)" }}>{app.status === "hired" ? "✓ Hired" : "Declined"}</span>
                      }
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
        <Modal open={showPost} onClose={() => setShowPost(false)} title="Post a position">
          <Input label="Role title" placeholder="e.g. Dental Assistant" value={postForm.role} onChange={e => setPostForm(p => ({ ...p, role: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Select label="Practice type" value={postForm.practiceType} onChange={e => setPostForm(p => ({ ...p, practiceType: e.target.value }))}><option value="dental">Dental</option><option value="medical">Medical</option></Select>
            <Select label="Position type" value={postForm.shiftType} onChange={e => setPostForm(p => ({ ...p, shiftType: e.target.value }))}><option value="temporary">Temp / Fill-in</option><option value="part-time">Part-Time</option><option value="full-time">Full-Time</option></Select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Date / Start" placeholder="2026-03-20" value={postForm.date} onChange={e => setPostForm(p => ({ ...p, date: e.target.value }))} />
            <Input label="Hours" placeholder="8AM – 5PM" value={postForm.time} onChange={e => setPostForm(p => ({ ...p, time: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Pay rate" placeholder="$22/hr" value={postForm.pay} onChange={e => setPostForm(p => ({ ...p, pay: e.target.value }))} />
            <Input label="Location" placeholder="Austin, TX" value={postForm.location} onChange={e => setPostForm(p => ({ ...p, location: e.target.value }))} />
          </div>
          <Textarea label="Description" placeholder="Describe the role and your office…" value={postForm.description} onChange={e => setPostForm(p => ({ ...p, description: e.target.value }))} />
          <Textarea label="Requirements (one per line)" placeholder={"X-ray certified\n1+ years experience"} value={postForm.requirements} onChange={e => setPostForm(p => ({ ...p, requirements: e.target.value }))} />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={() => setShowPost(false)} style={{ flex: 1 }}>Cancel</button>
            <button onClick={postPosition} disabled={!postForm.role || loading} style={{ flex: 2 }}>{loading ? "Posting…" : "Post position"}</button>
          </div>
        </Modal>
      </div>
    );
  }

  // ── Assistant ────────────────────────────────────────────────────────────────
  if (screen === "assistant") {
    const myApps = applications.filter(a => a.applicantId === profile.name);
    const appliedIds = new Set(myApps.map(a => a.positionId));

    const filtered = positions.filter(p => {
      if (p.status !== "active") return false;
      if (filterType !== "all" && p.practiceType !== filterType) return false;
      if (filterShift !== "all" && p.shiftType !== filterShift) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return [p.role, p.officeName, p.location, p.description, p.requirements].some(f => (f || "").toLowerCase().includes(q));
      }
      return true;
    });

    const submitApp = async () => {
      if (!detailPos) return;
      setLoading(true);
      const app = { id: Date.now().toString(), positionId: detailPos.id, officeId: detailPos.officeId, officeName: detailPos.officeName, officeEmail: detailPos.officeEmail, positionRole: detailPos.role, applicantId: profile.name, applicantName: profile.name, applicantEmail: profile.email, applicantRole: profile.role, applicantLocation: profile.location, message: applyMsg, status: "pending", appliedAt: new Date().toISOString() };
      const next = [app, ...applications];
      setApplications(next);
      await storageSet("ms3:applications", next);
      const emailRes = await sendEmailNotification({
        to: detailPos.officeEmail,
        subject: `New applicant for ${detailPos.role} — MedShift`,
        body: `Hi ${detailPos.postedBy},\n\n${profile.name} (${profile.role}, ${profile.location}) applied for your ${detailPos.role} position on MedShift.${applyMsg ? `\n\nTheir note: "${applyMsg}"` : ""}\n\nLog into MedShift to review and respond.\n\n— MedShift`,
      });
      setDetailPos(null); setApplyMsg(""); setAiMatch(null);
      showToast(emailRes.ok ? "Application sent! Office notified by email." : "Application sent!", "success");
      setLoading(false);
    };

    const getAiMatch = async (pos) => {
      setAiLoading(true); setAiMatch(null);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{ role: "user", content: `Assess fit. JSON only, no markdown.\nCANDIDATE: role=${profile.role}, location=${profile.location}\nPOSITION: role=${pos.role}, type=${pos.practiceType}/${pos.shiftType}, pay=${pos.pay}, requirements=${pos.requirements}\n{"score":<1-10>,"summary":"<2 sentences>","tips":["<tip1>","<tip2>"]}` }] }),
        });
        const data = await res.json();
        const text = (data.content?.find(b => b.type === "text")?.text || "{}").replace(/```json|```/g, "").trim();
        setAiMatch(JSON.parse(text));
      } catch { setAiMatch({ score: null, summary: "Could not load analysis.", tips: [] }); }
      setAiLoading(false);
    };

    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 0 2rem" }}>
        <Toast {...toast} />
        <MessagingModal />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={profile.name} color="success" />
            <div><div style={{ fontWeight: 500, fontSize: 15 }}>{profile.name}</div><div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{profile.role}</div></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadData} style={{ fontSize: 12 }}>Refresh</button>
            <button onClick={() => setScreen("landing")} style={{ fontSize: 12 }}>Sign out</button>
          </div>
        </div>
        <div style={{ padding: "0 1.25rem" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: "1.25rem", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
            {["browse", "applications"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, borderRadius: 0, border: "none", background: activeTab === tab ? "var(--color-background-secondary)" : "transparent", fontWeight: activeTab === tab ? 500 : 400, fontSize: 14 }}>
                {tab === "browse" ? `Browse (${positions.filter(p => p.status === "active").length})` : `My applications (${myApps.length})`}
              </button>
            ))}
          </div>

          {activeTab === "browse" && (
            <>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-tertiary)", pointerEvents: "none" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by role, office, location, keywords…" style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36 }} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
                {[["all", "All types"], ["dental", "Dental"], ["medical", "Medical"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterType(v)} style={{ fontSize: 12, background: filterType === v ? "var(--color-text-primary)" : "transparent", color: filterType === v ? "var(--color-background-primary)" : "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)" }}>{l}</button>
                ))}
                <span style={{ width: 1, background: "var(--color-border-tertiary)", margin: "0 2px" }} />
                {[["all", "All shifts"], ["temporary", "Temp"], ["part-time", "Part-time"], ["full-time", "Full-time"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterShift(v)} style={{ fontSize: 12, background: filterShift === v ? "var(--color-text-primary)" : "transparent", color: filterShift === v ? "var(--color-background-primary)" : "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)" }}>{l}</button>
                ))}
              </div>
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-secondary)", fontSize: 14 }}>{search ? `No results for "${search}"` : "No positions available yet."}</div>}
              {filtered.map(pos => {
                const applied = appliedIds.has(pos.id);
                return (
                  <Card key={pos.id} onClick={() => { setDetailPos(pos); setAiMatch(null); setApplyMsg(""); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 15 }}>{pos.role}</div>
                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{pos.officeName} · {pos.location}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}><Chip>{pos.date}</Chip><Chip>{pos.pay}</Chip></div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                        <Badge type={pos.shiftType} />
                        {applied && <span style={{ fontSize: 11, color: "var(--color-text-success)", fontWeight: 500 }}>✓ Applied</span>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          )}

          {activeTab === "applications" && (
            <>
              {myApps.length === 0 && <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-secondary)", fontSize: 14 }}>No applications yet.</div>}
              {myApps.map(app => (
                <Card key={app.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>{app.positionRole}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{app.officeName}</div>
                      {app.message && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic", marginTop: 3 }}>"{app.message}"</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: "var(--border-radius-md)", background: app.status === "hired" ? "var(--color-background-success)" : app.status === "declined" ? "var(--color-background-danger)" : "var(--color-background-secondary)", color: app.status === "hired" ? "var(--color-text-success)" : app.status === "declined" ? "var(--color-text-danger)" : "var(--color-text-secondary)" }}>
                        {app.status === "hired" ? "Hired!" : app.status === "declined" ? "Declined" : "Under review"}
                      </span>
                      <button onClick={() => openMessages(app, false)} style={{ fontSize: 12 }}>
                        Message office {messages[`thread:${app.id}`]?.length > 0 ? `(${messages[`thread:${app.id}`].length})` : ""}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>

        <Modal open={!!detailPos} onClose={() => { setDetailPos(null); setAiMatch(null); }} title={detailPos?.role} wide>
          {detailPos && <>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 10 }}>{detailPos.officeName} · {detailPos.location}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}><Badge type={detailPos.shiftType} /><Chip>{detailPos.date}</Chip><Chip>{detailPos.time}</Chip><Chip>{detailPos.pay}</Chip></div>
            {detailPos.description && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>About this position</div><div style={{ fontSize: 14, lineHeight: 1.6 }}>{detailPos.description}</div></div>}
            {detailPos.requirements && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>Requirements</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{detailPos.requirements.split("\n").filter(Boolean).map((r, i) => <Chip key={i}>{r}</Chip>)}</div></div>}
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>AI match analysis</span>
                <button onClick={() => getAiMatch(detailPos)} disabled={aiLoading} style={{ fontSize: 12 }}>{aiLoading ? "Analyzing…" : aiMatch ? "Re-analyze" : "Check my fit"}</button>
              </div>
              {aiMatch && <div style={{ marginTop: 10, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: 12 }}>
                {aiMatch.score && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 22, fontWeight: 500 }}>{aiMatch.score}/10</span><span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>match score</span></div>}
                <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>{aiMatch.summary}</div>
                {aiMatch.tips?.map((t, i) => <div key={i} style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3 }}>• {t}</div>)}
              </div>}
            </div>
            {appliedIds.has(detailPos.id)
              ? <div style={{ textAlign: "center", color: "var(--color-text-success)", fontWeight: 500, padding: "10px 0" }}>✓ You have already applied</div>
              : <>
                <Textarea label="Cover note (optional)" placeholder="A short note about why you are a great fit…" value={applyMsg} onChange={e => setApplyMsg(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setDetailPos(null)} style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitApp} disabled={loading} style={{ flex: 2 }}>{loading ? "Sending…" : "Apply now"}</button>
                </div>
              </>
            }
          </>}
        </Modal>
      </div>
    );
  }

  return null;
}
