import { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwAnitAIx33BQDw0I8sHv0RDP0lulz3_8",
  authDomain: "medshift-bcfba.firebaseapp.com",
  projectId: "medshift-bcfba",
  storageBucket: "medshift-bcfba.firebasestorage.app",
  messagingSenderId: "1006751462011",
  appId: "1:1006751462011:web:841177128f8c075e7ae8de"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const COLORS = {
  teal: "#0B6E6E",
  tealLight: "#E6F4F4",
  tealMid: "#0D8585",
  navy: "#0D2137",
  navyLight: "#162D47",
  cream: "#F8F6F1",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray800: "#1F2937",
  green: "#059669",
  greenLight: "#D1FAE5",
  amber: "#D97706",
  amberLight: "#FEF3C7",
  blue: "#2563EB",
  blueLight: "#DBEAFE",
  red: "#DC2626",
  redLight: "#FEE2E2",
};

const WORKER_URL = "https://medshift-ai.ada3527.workers.dev";
const PAYPAL_CLIENT_ID = "AemJL8NuAPnEF4MTbqnsZvcuUDP7YQh1_6f-uqdzBJtYBbdWYu0Op7J7QLa_uG4pu7uCNlr92y3qrFAQ";
const ADMIN_EMAIL = "ada3527@gmail.com";

const SHIFT_META = {
  temporary: { label: "Temp / Fill-in", bg: COLORS.amberLight, color: COLORS.amber },
  "part-time": { label: "Part-Time", bg: COLORS.blueLight, color: COLORS.blue },
  "full-time": { label: "Full-Time", bg: COLORS.greenLight, color: COLORS.green },
};

const PROVIDER_ROLES = ["Dentist", "Physician / MD", "Orthodontist", "Oral Surgeon", "Periodontist", "Endodontist", "Prosthodontist", "Pediatric Dentist", "Psychiatrist", "Nurse Practitioner"];
const SUPPORT_ROLES = ["Dental Assistant", "Dental Hygienist", "Medical Assistant", "Front Desk / Receptionist", "Oral Surgery Assistant", "Radiologic Technologist", "Phlebotomist"];

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: ${COLORS.cream}; color: ${COLORS.navy}; -webkit-font-smoothing: antialiased; }
    input, select, textarea, button { font-family: 'Plus Jakarta Sans', sans-serif; }
    input, select, textarea {
      width: 100%; padding: 11px 14px; border: 1.5px solid ${COLORS.gray200};
      border-radius: 10px; font-size: 14px; color: ${COLORS.navy};
      background: ${COLORS.white}; transition: border-color 0.15s, box-shadow 0.15s; outline: none;
    }
    input:focus, select:focus, textarea:focus {
      border-color: ${COLORS.teal}; box-shadow: 0 0 0 3px ${COLORS.tealLight};
    }
    input::placeholder, textarea::placeholder { color: ${COLORS.gray400}; }
    textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
    button {
      padding: 10px 18px; border-radius: 10px; border: 1.5px solid ${COLORS.gray200};
      background: ${COLORS.white}; color: ${COLORS.gray800}; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.15s ease;
    }
    button:hover:not(:disabled) { background: ${COLORS.gray50}; border-color: ${COLORS.gray400}; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.primary {
      background: ${COLORS.teal}; color: ${COLORS.white}; border-color: ${COLORS.teal};
    }
    button.primary:hover:not(:disabled) { background: ${COLORS.tealMid}; border-color: ${COLORS.tealMid}; }
    button.danger { background: ${COLORS.redLight}; color: ${COLORS.red}; border-color: ${COLORS.redLight}; }
    button.danger:hover:not(:disabled) { border-color: ${COLORS.red}; }
    button.success { background: ${COLORS.greenLight}; color: ${COLORS.green}; border-color: ${COLORS.greenLight}; }
    button.success:hover:not(:disabled) { border-color: ${COLORS.green}; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.35s ease both; }
    .card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,110,110,0.12) !important; }
  `}</style>
);

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ type }) {
  const m = SHIFT_META[type] || {};
  return <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{m.label}</span>;
}

function Avatar({ name, size = 38, teal }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: teal ? COLORS.teal : COLORS.navyLight, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.33, flexShrink: 0, letterSpacing: "0.03em" }}>
      {initials}
    </div>
  );
}

function Card({ children, onClick, style = {}, className = "" }) {
  return (
    <div onClick={onClick} className={`${onClick ? "card-hover" : ""} ${className}`}
      style={{ background: COLORS.white, border: `1.5px solid ${COLORS.gray200}`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: 12, cursor: onClick ? "pointer" : "default", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.gray400, marginBottom: 6 }}>{children}</div>;
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}>{label && <Label>{label}</Label>}{children}</div>;
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(13,33,55,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: COLORS.white, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: wide ? 720 : 560, maxHeight: "92vh", overflow: "auto", padding: "2rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", animation: "slideUp 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy }}>{title}</span>
          <button onClick={onClose} style={{ background: COLORS.gray100, border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: COLORS.gray600, padding: 0, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg, type = "default" }) {
  if (!msg) return null;
  const colors = { default: { bg: COLORS.navy, fg: COLORS.white }, success: { bg: COLORS.green, fg: COLORS.white }, error: { bg: COLORS.red, fg: COLORS.white } };
  const c = colors[type] || colors.default;
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: c.bg, color: c.fg, padding: "12px 24px", borderRadius: 40, fontSize: 14, fontWeight: 600, zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", animation: "fadeUp 0.3s ease" }}>
      {msg}
    </div>
  );
}

function Chip({ children, accent }) {
  return <span style={{ background: accent ? COLORS.tealLight : COLORS.gray100, color: accent ? COLORS.teal : COLORS.gray600, fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>;
}

function StatCard({ value, label, icon }) {
  return (
    <div style={{ background: COLORS.white, borderRadius: 14, padding: "1.1rem 1.25rem", flex: "1 1 110px", minWidth: 0, border: `1.5px solid ${COLORS.gray200}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.teal, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.gray400, fontWeight: 500, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: COLORS.gray200, margin: "1rem 0" }} />;
}

// ─── Storage & Email ──────────────────────────────────────────────────────────

async function storageGet(key) {
  try {
    const ref = doc(db, "appdata", key.replace(/:/g, "_"));
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().value : null;
  } catch { return null; }
}

async function storageSet(key, value) {
  try {
    const ref = doc(db, "appdata", key.replace(/:/g, "_"));
    await setDoc(ref, { value });
  } catch (e) { console.error("storageSet error", e); }
}

async function getAllProfiles() {
  try {
    const snap = await getDocs(collection(db, "appdata"));
    const profiles = [];
    snap.forEach(d => {
      if (d.id.startsWith("ms4_profile_")) {
        const val = d.data().value;
        try {
          profiles.push(typeof val === "string" ? JSON.parse(val) : val);
        } catch { profiles.push(val); }
      }
    });
    return profiles.filter(Boolean);
  } catch { return []; }
}
async function sendEmailNotification({ to, subject, body }) {
  if (!to || !to.includes("@")) return { ok: false };
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, mcp_servers: [{ type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" }], messages: [{ role: "user", content: `Send an email via Gmail. To: "${to}", Subject: "${subject}", Body: "${body.replace(/"/g, "'")}". Send it now.` }] }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    return { ok: text.toLowerCase().includes("sent") || text.toLowerCase().includes("success") };
  } catch { return { ok: false }; }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [screen, setScreen] = useState("landing");
  const navigateTo = (scr) => setScreen(scr);
  const [positions, setPositions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState({});
  const [toast, setToast] = useState({ msg: "", type: "default" });
  const [loading, setLoading] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [setupUserType, setSetupUserType] = useState("assistant");
  const [setupRole, setSetupRole] = useState("Dental Assistant");
  const [setupOffice, setSetupOffice] = useState("");
  const [setupLocation, setSetupLocation] = useState("");
  const [setupAddress, setSetupAddress] = useState("");
  const [setupPhone, setSetupPhone] = useState("");
  const [showPost, setShowPost] = useState(false);
  const [postForm, setPostForm] = useState({ role: "", practiceType: "dental", shiftType: "temporary", positionLevel: "support", date: "", time: "", pay: "", location: "", expiresAt: "", description: "", requirements: "" });
  const [detailPos, setDetailPos] = useState(null);
  const [applyMsg, setApplyMsg] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [aiMatch, setAiMatch] = useState(null);
  const [postingCredits, setPostingCredits] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [proCode, setProCode] = useState("");
  const [proCodeError, setProCodeError] = useState("");
  const [publicDetailPos, setPublicDetailPos] = useState(null);
  const [dashDetailPos, setDashDetailPos] = useState(null);
  const [editingPos, setEditingPos] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [landingSearch, setLandingSearch] = useState("");
  const [landingType, setLandingType] = useState("all");
  const [landingShift, setLandingShift] = useState("all");
  const [editName, setEditName] = useState("");
  const [editOffice, setEditOffice] = useState("");
  const [editRole, setEditRole] = useState("Dental Assistant");
  const [editLocation, setEditLocation] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState({ text: "", ok: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");
  const [msgModal, setMsgModal] = useState(null);
  const [msgDraft, setMsgDraft] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const msgEndRef = useRef(null);
  const applyRef = useRef(null);

  const showToast = (msg, type = "default") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "default" }), 3500); };
  const loadData = useCallback(async () => {
    const [p, a, m] = await Promise.all([storageGet("ms4:positions"), storageGet("ms4:applications"), storageGet("ms4:messages")]);
    setPositions(p || []); setApplications(a || []); setMessages(m || {});
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        const saved = await storageGet(`ms4:profile:${user.uid}`);
        if (saved) {
          setProfile(saved);
          if (saved.userType === "office") setScreen("dashboard");
          else if (saved.userType === "provider") setScreen("dashboard");
          else setScreen("dashboard");
        } else setScreen("setup");
        loadData();
        const postCredits = await storageGet(`ms4:postcredits:${user.uid}`);
        setPostingCredits(postCredits || 0);
      } else { setProfile(null); setScreen("landing"); loadData(); }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, msgModal]);

  useEffect(() => {
    if (screen === "admin") getAllProfiles().then(setAllProfiles);
  }, [screen]);

  const handleEmailAuth = async () => {
    setAuthError(""); setLoading(true);
    try {
      if (authTab === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        const prof = { uid: cred.user.uid, name: displayName || email.split("@")[0], email: cred.user.email, userType: setupUserType, ...(setupUserType === "office" ? { office: setupOffice, location: setupLocation, address: setupAddress, phone: setupPhone } : { role: setupRole, location: setupLocation }) };
        await storageSet(`ms4:profile:${cred.user.uid}`, prof);
        setProfile(prof);
        if (setupUserType === "office") {
          const reg = await storageGet("ms4:officeregistry") || {};
          reg[cred.user.uid] = { id: cred.user.uid, name: setupOffice, email: cred.user.email, address: setupAddress, phone: setupPhone, joinedAt: new Date().toISOString() };
          await storageSet("ms4:officeregistry", reg);
        }
        if (setupUserType === "office") setScreen("office");
        else setScreen("dashboard");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const msgs = { "auth/email-already-in-use": "That email is already registered.", "auth/invalid-email": "Please enter a valid email.", "auth/weak-password": "Password must be at least 6 characters.", "auth/invalid-credential": "Incorrect email or password.", "auth/user-not-found": "No account found." };
      setAuthError(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setAuthError(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await storageGet(`ms4:profile:${cred.user.uid}`);
      if (!existing) setScreen("setup");
    } catch (e) { setAuthError(e.message); }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setAuthError("Enter your email address above first."); return; }
    setLoading(true);
    try {
      const actionCodeSettings = { url: window.location.origin };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setAuthError("");
      showToast("Reset email sent — check your inbox!", "success");
    } catch (e) {
      const msgs = { "auth/invalid-email": "Please enter a valid email.", "auth/user-not-found": "No account found with that email." };
      setAuthError(msgs[e.code] || "Could not send reset email. Try again.");
    }
    setLoading(false);
  };

  const handleSetup = async () => {
    if (!authUser) return;
    const prof = { uid: authUser.uid, name: authUser.displayName || displayName || authUser.email.split("@")[0], email: authUser.email, userType: setupUserType, ...(setupUserType === "office" ? { office: setupOffice, location: setupLocation, address: setupAddress, phone: setupPhone } : { role: setupRole, location: setupLocation }) };
    await storageSet(`ms4:profile:${authUser.uid}`, prof);
    setProfile(prof); setScreen(setupUserType === "office" ? "office" : "dashboard");
  };

  const goToProfile = () => {
    setEditName(profile.name || "");
    setEditOffice(profile.office || "");
    setEditRole(profile.role || "Dental Assistant");
    setEditLocation(profile.location || "");
    setEditAddress(profile.address || "");
    setEditPhone(profile.phone || "");
    setProfileMsg("");
    setPwMsg({ text: "", ok: false });
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setScreen("profile");
  };

  const handleSignOut = () => signOut(auth);

  const openMessages = (app, fromOffice) => {
    setMsgModal({ app, threadId: `thread:${app.id}`, otherName: fromOffice ? app.applicantName : app.officeName, otherEmail: fromOffice ? app.applicantEmail : app.officeEmail });
    setMsgDraft("");
  };

  const sendMessage = async () => {
    if (!msgDraft.trim() || !msgModal) return;
    setSendingMsg(true);
    const newMsg = { id: Date.now().toString(), sender: profile.name, text: msgDraft.trim(), ts: new Date().toISOString() };
    const updated = { ...messages, [msgModal.threadId]: [...(messages[msgModal.threadId] || []), newMsg] };
    setMessages(updated); await storageSet("ms4:messages", updated); setMsgDraft("");
    const r = await sendEmailNotification({ to: msgModal.otherEmail, subject: `New message from ${profile.name} - MedShift`, body: `Hi ${msgModal.otherName}, ${profile.name} sent you a message: "${newMsg.text}". Log into MedShift to reply.` });
    setSendingMsg(false);
    showToast(r.ok ? "Message sent + email delivered" : "Message saved", r.ok ? "success" : "default");
  };

  const MessagingModal = () => {
    if (!msgModal) return null;
    const thread = messages[msgModal.threadId] || [];
    return (
      <Modal open wide title={`Chat with ${msgModal.otherName}`} onClose={() => setMsgModal(null)}>
        <div style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 12, fontWeight: 500 }}>Re: {msgModal.app.positionRole} at {msgModal.app.officeName}</div>
        <div style={{ minHeight: 220, maxHeight: 320, overflowY: "auto", marginBottom: 16, padding: "12px 0", borderTop: `1px solid ${COLORS.gray200}`, borderBottom: `1px solid ${COLORS.gray200}` }}>
          {thread.length === 0 && <div style={{ textAlign: "center", color: COLORS.gray400, fontSize: 13, padding: "2.5rem 0" }}>No messages yet. Start the conversation!</div>}
          {thread.map(msg => {
            const mine = msg.sender === profile.name;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{ maxWidth: "75%", background: mine ? COLORS.teal : COLORS.gray100, color: mine ? COLORS.white : COLORS.navy, padding: "10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.5 }}>
                  {!mine && <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: COLORS.teal }}>{msg.sender}</div>}
                  <div>{msg.text}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea value={msgDraft} onChange={e => setMsgDraft(e.target.value)} placeholder="Type a message… (Enter to send)" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} style={{ flex: 1, minHeight: 52, maxHeight: 120 }} />
          <button className="primary" onClick={sendMessage} disabled={!msgDraft.trim() || sendingMsg} style={{ flexShrink: 0, height: 52 }}>{sendingMsg ? "…" : "Send"}</button>
        </div>
      </Modal>
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16, background: COLORS.navy }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚕️</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500 }}>Loading MedShift…</div>
      </div>
    </>
  );

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (screen === "landing") return (
    <>
      <GlobalStyles />
      <Toast {...toast} />

      {/* Nav */}
      <div style={{ background: COLORS.navy, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚕️</div>
            <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>MedShift</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {profile ? (
              <>
                <button onClick={() => setScreen("dashboard")} style={{ fontSize: 13, fontWeight: 700, background: COLORS.teal, border: "none", color: COLORS.white, padding: "8px 18px", borderRadius: 8 }}>My Dashboard →</button>
                <button onClick={handleSignOut} style={{ fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.1)", border: "none", color: COLORS.white, padding: "8px 18px", borderRadius: 8 }}>Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => { setAuthTab("login"); setScreen("login"); }} style={{ fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.1)", border: "none", color: COLORS.white, padding: "8px 18px", borderRadius: 8 }}>Log in</button>
                <button onClick={() => { setAuthTab("signup"); setScreen("login"); }} style={{ fontSize: 13, fontWeight: 700, background: COLORS.teal, border: "none", color: COLORS.white, padding: "8px 18px", borderRadius: 8 }}>Sign up free →</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0a3352 60%, ${COLORS.navyLight} 100%)`, padding: "1.75rem 1.5rem", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(11,110,110,0.3)", border: "1px solid rgba(11,110,110,0.5)", borderRadius: 20, padding: "3px 10px", marginBottom: "0.6rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.teal }} />
              <span style={{ color: COLORS.teal, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Now hiring in your area</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: COLORS.white, lineHeight: 1.2, marginBottom: "0.5rem", letterSpacing: "-0.3px", textAlign: "left" }}>
              The smarter way to staff your<br/>dental or medical practice.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, marginBottom: "1.1rem", maxWidth: 420, textAlign: "left" }}>
              Browse open positions for dental and medical support staff. Free to apply — no account needed to browse.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => document.getElementById("positions-section")?.scrollIntoView({ behavior: "smooth" })}
                style={{ background: COLORS.teal, color: COLORS.white, border: "none", padding: "9px 18px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 14px rgba(11,110,110,0.4)" }}>
                🩺 Browse open positions
              </button>
              <button onClick={() => { if (profile) setScreen("office"); else { setAuthTab("signup"); setScreen("login"); } }}
                style={{ background: "transparent", color: COLORS.white, border: "1.5px solid rgba(255,255,255,0.25)", padding: "9px 18px", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                🏥 Post a job
              </button>
            </div>
          </div>

          {/* Stats panel */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "📋", value: `${positions.filter(p => p.status === "active").length}`, label: "Open positions" },
              { icon: "🦷", value: `${positions.filter(p => p.status === "active" && p.practiceType === "dental").length}`, label: "Dental" },
              { icon: "🩺", value: `${positions.filter(p => p.status === "active" && p.practiceType === "medical").length}`, label: "Medical" },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{value}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 500, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positions */}
      <div id="positions-section" style={{ background: COLORS.cream, minHeight: "60vh", padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>

          {/* Search + filters */}
          <div style={{ background: COLORS.white, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1.5px solid ${COLORS.gray200}` }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.gray400, fontSize: 16 }}>🔍</span>
              <input value={landingSearch} onChange={e => setLandingSearch(e.target.value)} placeholder="Search by role, office, or location…" style={{ paddingLeft: 40, width: "100%", boxSizing: "border-box", background: COLORS.gray50 }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["all", "All types"], ["dental", "🦷 Dental"], ["medical", "🩺 Medical"]].map(([v, l]) => (
                <button key={v} onClick={() => setLandingType(v)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: landingType === v ? COLORS.teal : COLORS.gray100, color: landingType === v ? COLORS.white : COLORS.gray600, border: "none", fontWeight: 500, cursor: "pointer" }}>{l}</button>
              ))}
              <div style={{ width: 1, background: COLORS.gray200, margin: "0 2px" }} />
              {[["all", "All shifts"], ["temporary", "Temp"], ["part-time", "Part-time"], ["full-time", "Full-time"]].map(([v, l]) => (
                <button key={v} onClick={() => setLandingShift(v)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: landingShift === v ? COLORS.navy : COLORS.gray100, color: landingShift === v ? COLORS.white : COLORS.gray600, border: "none", fontWeight: 500, cursor: "pointer" }}>{l}</button>
              ))}
              {(landingSearch || landingType !== "all" || landingShift !== "all") && (
                <button onClick={() => { setLandingSearch(""); setLandingType("all"); setLandingShift("all"); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: COLORS.redLight, color: COLORS.red, border: "none", fontWeight: 600, cursor: "pointer" }}>✕ Clear</button>
              )}
            </div>
          </div>

          {(() => {
            const base = positions.filter(p => p.status === "active" && p.positionLevel !== "provider" && p.status !== "hidden");
            const filtered = base.filter(p => {
              if (landingType !== "all" && p.practiceType !== landingType) return false;
              if (landingShift !== "all" && p.shiftType !== landingShift) return false;
              if (landingSearch.trim()) {
                const q = landingSearch.toLowerCase();
                return [p.role, p.officeName, p.location, p.description].some(f => (f || "").toLowerCase().includes(q));
              }
              return true;
            });
            const isFiltering = landingSearch || landingType !== "all" || landingShift !== "all";
            if (filtered.length === 0) return (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: COLORS.white, borderRadius: 16, border: `1.5px dashed ${COLORS.gray200}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{isFiltering ? "🔍" : "📋"}</div>
                <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>{isFiltering ? "No matching positions" : "No positions yet"}</div>
                <div style={{ color: COLORS.gray400, fontSize: 14 }}>{isFiltering ? "Try different filters or clear your search" : "Be the first — sign up and post a position"}</div>
              </div>
            );
            if (isFiltering) return (
              <div>
                <div style={{ fontSize: 13, color: COLORS.gray400, marginBottom: "1rem" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {filtered.map((pos, i) => {
                    const sm = SHIFT_META[pos.shiftType] || {};
                    return (
                      <div key={pos.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s`, background: COLORS.white, borderRadius: 14, padding: "1.25rem", border: `1.5px solid ${COLORS.gray100}`, cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                        onClick={() => setPublicDetailPos(pos)}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(11,110,110,0.10)"; e.currentTarget.style.borderColor = COLORS.teal; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = COLORS.gray100; }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.navy, lineHeight: 1.3 }}>{pos.role}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sm.bg, color: sm.color, flexShrink: 0, marginLeft: 8 }}>{sm.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600, marginBottom: 10 }}>{pos.officeName} · {pos.location}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          <span style={{ fontSize: 11, background: COLORS.gray50, color: COLORS.gray600, padding: "3px 8px", borderRadius: 8, fontWeight: 500 }}>📅 {pos.date}</span>
                          <span style={{ fontSize: 11, background: COLORS.greenLight, color: COLORS.green, padding: "3px 8px", borderRadius: 8, fontWeight: 700 }}>💰 {pos.pay}</span>
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.teal, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>View details <span style={{ fontSize: 14 }}>→</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
                {[
                  { key: "dental", label: "🦷 Dental", positions: filtered.filter(p => p.practiceType === "dental") },
                  { key: "medical", label: "🩺 Medical", positions: filtered.filter(p => p.practiceType === "medical") },
                ].map(cat => (
                  <div key={cat.key} style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, overflow: "hidden" }}>
                    <div style={{ background: COLORS.navy, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ fontWeight: 800, fontSize: 16, color: COLORS.white, margin: 0 }}>{cat.label}</h2>
                      <span style={{ fontSize: 11, fontWeight: 700, background: COLORS.teal, color: COLORS.white, padding: "2px 10px", borderRadius: 20 }}>{cat.positions.length} open</span>
                    </div>
                    <div style={{ padding: "14px" }}>
                      {cat.positions.length === 0 && <div style={{ textAlign: "center", padding: "2rem 1rem", color: COLORS.gray400, fontSize: 13 }}>No open positions</div>}
                      {["temporary", "part-time", "full-time"].map(shiftType => {
                        const group = cat.positions.filter(p => p.shiftType === shiftType);
                        if (group.length === 0) return null;
                        const sm = SHIFT_META[shiftType];
                        return (
                          <div key={shiftType} style={{ marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sm.bg, color: sm.color }}>{sm.label}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {group.map((pos, i) => (
                                <div key={pos.id} className="fade-up" style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${COLORS.gray100}`, cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                                  onClick={() => setPublicDetailPos(pos)}
                                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(11,110,110,0.10)"; e.currentTarget.style.borderColor = COLORS.teal; }}
                                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = COLORS.gray100; }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.navy, lineHeight: 1.3 }}>{pos.role}</div>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: sm.bg, color: sm.color, flexShrink: 0, marginLeft: 8 }}>{sm.label}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600, marginBottom: 8 }}>{pos.officeName} · {pos.location}</div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 11, background: COLORS.gray50, color: COLORS.gray600, padding: "3px 8px", borderRadius: 8, fontWeight: 500 }}>📅 {pos.date}</span>
                                    <span style={{ fontSize: 11, background: COLORS.greenLight, color: COLORS.green, padding: "3px 8px", borderRadius: 8, fontWeight: 700 }}>💰 {pos.pay}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

            {/* Footer CTA */}
      <div style={{ background: COLORS.navy, padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: "2rem" }}>

            {/* Support Staff CTA */}
            <div style={{ background: "rgba(11,110,110,0.2)", border: "1.5px solid rgba(11,110,110,0.4)", borderRadius: 16, padding: "1.75rem" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🩺</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.white, marginBottom: 6 }}>Looking for shifts?</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
                Dental assistants, hygienists, front desk, and medical support staff — browse and apply to open positions near you.
              </div>
              <button onClick={() => { setAuthTab("signup"); setScreen("login"); }}
                style={{ background: COLORS.teal, color: COLORS.white, border: "none", padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
                Sign up as support staff →
              </button>
            </div>

            {/* Provider CTA */}
            <div style={{ background: "rgba(245,158,11,0.15)", border: "1.5px solid rgba(245,158,11,0.4)", borderRadius: 16, padding: "1.75rem" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>👨‍⚕️</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.white, marginBottom: 6 }}>Doctor or dentist?</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
                Dentists, physicians, specialists and more — find fill-in, part-time, or full-time provider positions. Provider listings are exclusive to logged-in members.
              </div>
              <button onClick={() => { setAuthTab("signup"); setScreen("login"); }}
                style={{ background: COLORS.amber, color: COLORS.white, border: "none", padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
                Sign up as a provider →
              </button>
            </div>
          </div>

          {/* Office CTA */}
          <div style={{ textAlign: "center", padding: "1.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 10 }}>
              🏥 Running a dental or medical practice?
            </div>
            <button onClick={() => { setAuthTab("signup"); setScreen("login"); }}
              style={{ background: "transparent", color: COLORS.white, border: "1.5px solid rgba(255,255,255,0.3)", padding: "9px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Post positions for free →
            </button>
          </div>
        </div>
      </div>

      {/* Public position detail modal */}
      {publicDetailPos && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,33,55,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setPublicDetailPos(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: COLORS.white, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", padding: "2rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.navy }}>{publicDetailPos.role}</span>
              <button onClick={() => setPublicDetailPos(null)} style={{ background: COLORS.gray100, border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, color: COLORS.gray600, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: COLORS.teal }}>{publicDetailPos.officeName?.slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, color: COLORS.teal }}>{publicDetailPos.officeName}</div>
                <div style={{ fontSize: 12, color: COLORS.gray400 }}>{publicDetailPos.location}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <Badge type={publicDetailPos.shiftType} />
              <Chip>📅 {publicDetailPos.date}</Chip>
              {publicDetailPos.time && publicDetailPos.time !== "TBD" && <Chip>🕐 {publicDetailPos.time}</Chip>}
              <Chip accent>💰 {publicDetailPos.pay}</Chip>
            </div>
            {publicDetailPos.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.gray400, marginBottom: 6 }}>About this position</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.gray600, background: COLORS.gray50, padding: "12px 14px", borderRadius: 10 }}>{publicDetailPos.description}</div>
              </div>
            )}
            {publicDetailPos.requirements && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.gray400, marginBottom: 6 }}>Requirements</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {publicDetailPos.requirements.split("\n").filter(Boolean).map((r, i) => <Chip key={i} accent>✓ {r}</Chip>)}
                </div>
              </div>
            )}
            <div style={{ height: 1, background: COLORS.gray200, margin: "1rem 0" }} />
            <div style={{ background: COLORS.tealLight, borderRadius: 14, padding: "1.25rem", textAlign: "center", border: `1px solid ${COLORS.teal}22` }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.navy, marginBottom: 6 }}>Ready to apply?</div>
              <div style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 16 }}>Create a free account or log in to apply in seconds</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => { setPublicDetailPos(null); setAuthTab("login"); setScreen("login"); }} style={{ padding: "10px 22px", fontWeight: 600, fontSize: 14, background: COLORS.white, border: `1.5px solid ${COLORS.gray200}`, borderRadius: 10, cursor: "pointer" }}>Log in</button>
                <button onClick={() => { setPublicDetailPos(null); setAuthTab("signup"); setScreen("login"); }} style={{ padding: "10px 22px", fontWeight: 700, fontSize: 14, background: COLORS.teal, color: COLORS.white, border: "none", borderRadius: 10, cursor: "pointer" }}>Sign up free →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );


  // ── Login / Signup ───────────────────────────────────────────────────────────
  if (screen === "login" || screen === "signup") return (
    <>
      <GlobalStyles />
      <Toast {...toast} />
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: COLORS.white }}>
        {/* Left panel */}
        <div style={{ background: COLORS.navy, padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(11,110,110,0.25)" }} />
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(11,110,110,0.15)" }} />
          <div style={{ position: "relative" }}>
            <div onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "4rem", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚕️</div>
              <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>MedShift</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem, 3vw, 2.8rem)", color: COLORS.white, lineHeight: 1.2, marginBottom: "1.5rem" }}>
              The smarter way to staff your practice
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
              Connect dental and medical offices with qualified assistants. Post shifts, review applicants, and hire — all in one place.
            </p>
          </div>
          <div style={{ display: "flex", gap: "2rem", position: "relative" }}>
            {[["500+", "Qualified staff"], ["200+", "Practices"], ["24h", "Average hire time"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.white }}>{n}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", background: COLORS.cream }}>
          <div style={{ width: "100%", maxWidth: 400 }} className="fade-up">
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: COLORS.navy }}>{authTab === "login" ? "Welcome back" : "Create an account"}</h2>
            <p style={{ color: COLORS.gray400, fontSize: 14, marginBottom: "2rem" }}>{authTab === "login" ? "Log in to your MedShift account" : "Join thousands of healthcare professionals"}</p>
            <button onClick={() => setScreen("landing")} style={{ background: "none", border: "none", color: COLORS.teal, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: "1.5rem", cursor: "pointer" }}>← Back to listings</button>

            {/* Tab toggle */}
            <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", background: COLORS.gray100, borderRadius: 12, padding: 4 }}>
              {["login", "signup"].map(tab => (
                <button key={tab} onClick={() => { setAuthTab(tab); setAuthError(""); }} style={{ flex: 1, borderRadius: 8, border: "none", background: authTab === tab ? COLORS.white : "transparent", fontWeight: 600, fontSize: 14, color: authTab === tab ? COLORS.navy : COLORS.gray400, boxShadow: authTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none", padding: "8px 0" }}>
                  {tab === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={handleGoogleAuth} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, padding: "12px", background: COLORS.white, border: `1.5px solid ${COLORS.gray200}`, fontWeight: 600, fontSize: 14 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.5-2.9-11.2-7.1l-6.5 5C9.8 39.8 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: COLORS.gray200 }} />
              <span style={{ fontSize: 12, color: COLORS.gray400, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: COLORS.gray200 }} />
            </div>

            {authTab === "signup" && <Field label="Full name"><input placeholder="Maria Chen" value={displayName} onChange={e => setDisplayName(e.target.value)} /></Field>}
            <Field label="Email address"><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <Field label="Password"><input type="password" placeholder={authTab === "signup" ? "At least 6 characters" : "Your password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()} /></Field>
            {authTab === "login" && (
              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 14 }}>
                <button onClick={handleForgotPassword} style={{ background: "none", border: "none", color: COLORS.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  Forgot password?
                </button>
              </div>
            )}

            {authTab === "signup" && (
              <>
                <Field label="I am a…">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[{ type: "assistant", icon: "🩺", label: "Support Staff" }, { type: "provider", icon: "👨‍⚕️", label: "Provider / Doctor" }, { type: "office", icon: "🏥", label: "Office" }].map(opt => (
                      <div key={opt.type} onClick={() => setSetupUserType(opt.type)} style={{ textAlign: "center", padding: "10px 8px", border: `2px solid ${setupUserType === opt.type ? COLORS.teal : COLORS.gray200}`, borderRadius: 12, cursor: "pointer", background: setupUserType === opt.type ? COLORS.tealLight : COLORS.white, transition: "all 0.15s" }}>
                        <span style={{ fontSize: 20 }}>{opt.icon}</span>
                        <div style={{ fontSize: 12, fontWeight: 700, color: setupUserType === opt.type ? COLORS.teal : COLORS.navy, marginTop: 4 }}>{opt.label}</div>
                      </div>
                    ))}
                  </div>
                </Field>
                {setupUserType === "office"
                  ? <><Field label="Practice name"><input placeholder="Bright Smile Dental" value={setupOffice} onChange={e => setSetupOffice(e.target.value)} /></Field>
                    <Field label="Street address"><input placeholder="123 Main St, Suite 100" value={setupAddress} onChange={e => setSetupAddress(e.target.value)} /></Field>
                    <Field label="Phone number"><input placeholder="(555) 123-4567" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} /></Field></>
                  : setupUserType === "provider"
                  ? <Field label="Your specialty"><select value={setupRole} onChange={e => setSetupRole(e.target.value)}>{PROVIDER_ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
                  : <Field label="Your role"><select value={setupRole} onChange={e => setSetupRole(e.target.value)}>{SUPPORT_ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
                }
                <Field label="City, State"><input placeholder="Austin, TX" value={setupLocation} onChange={e => setSetupLocation(e.target.value)} /></Field>
              </>
            )}

            {authError && <div style={{ background: COLORS.redLight, color: COLORS.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 14 }}>{authError}</div>}

            <button className="primary" onClick={handleEmailAuth} disabled={loading || !email || !password || (authTab === "signup" && (!displayName || (setupUserType === "office" && !setupOffice)))} style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
              {loading ? "Please wait…" : authTab === "login" ? "Log in to MedShift" : "Create my account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (screen === "setup") return (
    <>
      <GlobalStyles />
      <Toast {...toast} />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.cream, padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 480, background: COLORS.white, borderRadius: 24, padding: "2.5rem", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }} className="fade-up">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: COLORS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 1rem" }}>👋</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>One last step!</h2>
            <p style={{ color: COLORS.gray400, fontSize: 14 }}>Tell us how you'll use MedShift</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ type: "assistant", icon: "🩺", title: "Support Staff", sub: "Looking for shifts" }, { type: "provider", icon: "👨‍⚕️", title: "Provider / Doctor", sub: "Seeking positions" }, { type: "office", icon: "🏥", title: "I'm an office", sub: "Looking for staff" }].map(opt => (
              <div key={opt.type} onClick={() => setSetupUserType(opt.type)} style={{ textAlign: "center", padding: "1rem 0.5rem", border: `2px solid ${setupUserType === opt.type ? COLORS.teal : COLORS.gray200}`, borderRadius: 16, cursor: "pointer", background: setupUserType === opt.type ? COLORS.tealLight : COLORS.white, transition: "all 0.15s" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{opt.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: setupUserType === opt.type ? COLORS.teal : COLORS.navy }}>{opt.title}</div>
                <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>{opt.sub}</div>
              </div>
            ))}
          </div>

          {setupUserType === "office"
            ? <><Field label="Practice name"><input placeholder="Bright Smile Dental" value={setupOffice} onChange={e => setSetupOffice(e.target.value)} /></Field>
               <Field label="Street address"><input placeholder="123 Main St, Suite 100" value={setupAddress} onChange={e => setSetupAddress(e.target.value)} /></Field>
               <Field label="Phone number"><input placeholder="(555) 123-4567" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} /></Field>
               <Field label="City, State"><input placeholder="Austin, TX" value={setupLocation} onChange={e => setSetupLocation(e.target.value)} /></Field></>
            : setupUserType === "provider"
            ? <><Field label="Your specialty"><select value={setupRole} onChange={e => setSetupRole(e.target.value)}>{PROVIDER_ROLES.map(r => <option key={r}>{r}</option>)}</select></Field><Field label="City, State"><input placeholder="Austin, TX" value={setupLocation} onChange={e => setSetupLocation(e.target.value)} /></Field></>
            : <><Field label="Your role"><select value={setupRole} onChange={e => setSetupRole(e.target.value)}>{SUPPORT_ROLES.map(r => <option key={r}>{r}</option>)}</select></Field><Field label="City, State"><input placeholder="Austin, TX" value={setupLocation} onChange={e => setSetupLocation(e.target.value)} /></Field></>
          }

          <button className="primary" onClick={handleSetup} disabled={setupUserType === "office" && !setupOffice} style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 12, marginTop: 4 }}>
            Get started →
          </button>
        </div>
      </div>
    </>
  );

  // ── Header ───────────────────────────────────────────────────────────────────
  const Header = ({ title, sub }) => (
    <div style={{ background: COLORS.navy, padding: "0", marginBottom: 0 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚕️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.white, letterSpacing: "-0.3px" }}>{title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{sub}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {authUser?.email === ADMIN_EMAIL && (
            <button onClick={() => setScreen("admin")} style={{ fontSize: 12, background: COLORS.amber, border: "none", color: COLORS.white, padding: "6px 12px", borderRadius: 8, fontWeight: 700 }}>⚙️ Admin</button>
          )}
          <button onClick={() => setScreen("dashboard")} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>← All listings</button>
          <button onClick={loadData} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>↻ Refresh</button>
          <button onClick={() => goToProfile()} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>👤 My Account</button>
          <button onClick={handleSignOut} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>Sign out</button>
        </div>
      </div>
    </div>
  );

  // ── Shared Dashboard ─────────────────────────────────────────────────────────
  if (screen === "dashboard") {
    const isProvider = profile.userType === "provider";
    const levelFilter = isProvider ? "provider" : "support";
    const activePositions = positions.filter(p => p.status === "active" && (p.positionLevel === levelFilter || (!p.positionLevel && !isProvider)));
    const dental = activePositions.filter(p => p.practiceType === "dental");
    const medical = activePositions.filter(p => p.practiceType === "medical");
    const myApps = applications.filter(a => a.applicantId === profile.uid);
    const appliedIds = new Set(myApps.map(a => a.positionId));

    const categories = [
      { key: "dental", label: "🦷 Dental", positions: dental },
      { key: "medical", label: "🩺 Medical", positions: medical },
    ].filter(c => c.positions.length > 0);

    return (
      <>
        <GlobalStyles />
        <Toast {...toast} />
        <MessagingModal />

        {/* Header */}
        <div style={{ background: COLORS.navy, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
            <div onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚕️</div>
              <div>
                <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>MedShift</span>
                {isProvider && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: COLORS.teal, color: COLORS.white, padding: "2px 8px", borderRadius: 20 }}>Providers</span>}
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 500, marginLeft: 8 }}>Hi, {profile.name?.split(" ")[0]} 👋</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={loadData} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>↻ Refresh</button>
              {profile.userType !== "office" && (
                <button onClick={() => setScreen("assistant")} style={{ fontSize: 13, fontWeight: 700, background: COLORS.teal, border: "none", color: COLORS.white, padding: "8px 16px", borderRadius: 8 }}>
                  {isProvider ? "👨‍⚕️ My Applications" : "🩺 My Applications"} →
                </button>
              )}
              {profile.userType === "office" && (
                <button onClick={() => setScreen("office")} style={{ fontSize: 13, fontWeight: 700, background: COLORS.teal, border: "none", color: COLORS.white, padding: "8px 16px", borderRadius: 8 }}>🏥 My Office →</button>
              )}
              <button onClick={() => goToProfile()} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>👤 Account</button>
              <button onClick={handleSignOut} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>Sign out</button>
            </div>
          </div>
        </div>

        {/* Hero bar */}
        <div style={{ background: COLORS.teal, padding: "1.25rem 1.5rem" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 18 }}>{isProvider ? "Provider positions" : "Open positions"}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>{activePositions.length} available · updated live</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["🦷", dental.length, "Dental"], ["🩺", medical.length, "Medical"]].map(([icon, count, label]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                  <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 18 }}>{icon} {count}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: COLORS.cream, minHeight: "80vh", padding: "2rem 1.5rem" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>

            {activePositions.length === 0 && (
              <div style={{ textAlign: "center", padding: "5rem 2rem", background: COLORS.white, borderRadius: 16, border: `1.5px dashed ${COLORS.gray200}` }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.navy, marginBottom: 8 }}>{isProvider ? "No provider positions yet" : "No open positions yet"}</div>
                <div style={{ color: COLORS.gray400, fontSize: 14, marginBottom: 20 }}>{isProvider ? "Check back soon — offices are adding provider roles" : "Be the first to post a position"}</div>
                {profile.userType === "office" && <button className="primary" onClick={() => setScreen("office")} style={{ padding: "10px 24px", fontWeight: 700 }}>Post a position →</button>}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
              {categories.map(cat => (
                <div key={cat.key} style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, overflow: "hidden" }}>
                  {/* Column header */}
                  <div style={{ background: COLORS.navy, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontWeight: 800, fontSize: 16, color: COLORS.white, margin: 0 }}>{cat.label}</h2>
                    <span style={{ fontSize: 11, fontWeight: 700, background: COLORS.teal, color: COLORS.white, padding: "2px 10px", borderRadius: 20 }}>{cat.positions.length} open</span>
                  </div>

                  <div style={{ padding: "14px" }}>
                    {cat.positions.length === 0 && (
                      <div style={{ textAlign: "center", padding: "2rem 1rem", color: COLORS.gray400, fontSize: 13 }}>No open positions</div>
                    )}
                    {["temporary", "part-time", "full-time"].map(shiftType => {
                      const group = cat.positions.filter(p => p.shiftType === shiftType);
                      if (group.length === 0) return null;
                      const sm = SHIFT_META[shiftType];
                      return (
                        <div key={shiftType} style={{ marginBottom: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sm.bg, color: sm.color }}>{sm.label}</span>
                            <span style={{ fontSize: 11, color: COLORS.gray400 }}>{group.length} position{group.length > 1 ? "s" : ""}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {group.map((pos, i) => {
                              const applied = appliedIds.has(pos.id);
                              return (
                                <div key={pos.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s`, background: COLORS.white, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${applied ? COLORS.green : COLORS.gray100}`, cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                                  onClick={() => { if (profile.userType === "office") setScreen("office"); else setDashDetailPos(pos); }}
                                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(11,110,110,0.10)"; e.currentTarget.style.borderColor = applied ? COLORS.green : COLORS.teal; }}
                                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = applied ? COLORS.green : COLORS.gray100; }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.navy, flex: 1, paddingRight: 8, lineHeight: 1.3 }}>{pos.role}</div>
                                    {applied && <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.green, background: COLORS.greenLight, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>✓ Applied</span>}
                                  </div>
                                  <div style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600, marginBottom: 8 }}>{pos.officeName} · {pos.location}</div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, background: COLORS.gray50, color: COLORS.gray600, padding: "3px 8px", borderRadius: 8, fontWeight: 500 }}>📅 {pos.date}</span>
                                    <span style={{ fontSize: 11, background: COLORS.greenLight, color: COLORS.green, padding: "3px 8px", borderRadius: 8, fontWeight: 700 }}>💰 {pos.pay}</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: COLORS.teal, fontWeight: 700 }}>
                                    {profile.userType === "office" ? "View applicants →" : (applied ? "✓ Applied" : "View & apply →")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: COLORS.navy, padding: "2rem 1.5rem", textAlign: "center", marginTop: "2rem" }}>
          <div onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚕️</div>
            <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 15 }}>MedShift</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>Connecting dental & medical offices with qualified assistants.</p>
        </div>

        {/* Position detail modal */}
        {dashDetailPos && (() => {
          const applied = appliedIds.has(dashDetailPos.id);
          return (
            <Modal open wide title={dashDetailPos.role} onClose={() => setDashDetailPos(null)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: COLORS.teal }}>{dashDetailPos.officeName?.slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, color: COLORS.teal }}>{dashDetailPos.officeName}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray400 }}>{dashDetailPos.location}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <Badge type={dashDetailPos.shiftType} />
                <Chip>📅 {dashDetailPos.date}</Chip>
                {dashDetailPos.time && dashDetailPos.time !== "TBD" && <Chip>🕐 {dashDetailPos.time}</Chip>}
                <Chip accent>💰 {dashDetailPos.pay}</Chip>
              </div>
              {dashDetailPos.description && (
                <div style={{ marginBottom: 14 }}>
                  <Label>About this position</Label>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.gray600, background: COLORS.gray50, padding: "12px 14px", borderRadius: 10 }}>{dashDetailPos.description}</div>
                </div>
              )}
              {dashDetailPos.requirements && (
                <div style={{ marginBottom: 16 }}>
                  <Label>Requirements</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dashDetailPos.requirements.split("\n").filter(Boolean).map((r, i) => <Chip key={i} accent>✓ {r}</Chip>)}
                  </div>
                </div>
              )}
              <Divider />
              {applied
                ? <div style={{ textAlign: "center", color: COLORS.green, fontWeight: 700, padding: "14px", background: COLORS.greenLight, borderRadius: 12 }}>✓ You have already applied to this position</div>
                : <>
                  <div ref={applyRef} style={{ background: COLORS.tealLight, borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: `1px solid ${COLORS.teal}22` }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.teal, marginBottom: 2 }}>📝 Apply for this position</div>
                    <div style={{ fontSize: 12, color: COLORS.gray600 }}>Cover note and resume are both optional</div>
                  </div>
                  <Field label="Cover note (optional)">
                    <textarea placeholder="Tell them why you are a great fit…" value={applyMsg} onChange={e => setApplyMsg(e.target.value)} />
                  </Field>
                  <Field label="Resume (optional — PDF or Word)">
                    <div onClick={() => document.getElementById("dash-resume-upload").click()}
                      style={{ border: `2px dashed ${resumeFile ? COLORS.teal : COLORS.gray200}`, borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", background: resumeFile ? COLORS.tealLight : COLORS.gray50, transition: "all 0.15s" }}>
                      {resumeFile ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.teal }}>{resumeFile.name}</div>
                            <div style={{ fontSize: 11, color: COLORS.gray400 }}>{(resumeFile.size / 1024).toFixed(0)} KB · Click to change</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray600 }}>Click to attach your resume</div>
                          <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>PDF or Word · Max 4MB</div>
                        </div>
                      )}
                    </div>
                    <input id="dash-resume-upload" type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) { showToast("File too large — max 4MB", "error"); return; }
                      setResumeFile(file);
                      const reader = new FileReader();
                      reader.onload = ev => setResumeData(ev.target.result);
                      reader.readAsDataURL(file);
                    }} />
                  </Field>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => { setDashDetailPos(null); setApplyMsg(""); setResumeFile(null); setResumeData(null); }} style={{ flex: 1 }}>Cancel</button>
                    <button className="primary" disabled={loading} onClick={async () => {
                      setLoading(true);
                      const pos = dashDetailPos;
                      const app = { id: Date.now().toString(), positionId: pos.id, officeId: pos.officeId, officeName: pos.officeName, officeEmail: pos.officeEmail, positionRole: pos.role, applicantId: profile.uid, applicantName: profile.name, applicantEmail: profile.email, applicantRole: profile.role, applicantLocation: profile.location, message: applyMsg, resumeName: resumeFile ? resumeFile.name : null, status: "pending", appliedAt: new Date().toISOString() };
                      const next = [app, ...applications]; setApplications(next); await storageSet("ms4:applications", next);
                      if (resumeData) { try { await storageSet(`ms4:resume:${app.id}`, resumeData); } catch {} }
                      setDashDetailPos(null); setApplyMsg(""); setResumeFile(null); setResumeData(null);
                      showToast("Application sent!", "success"); setLoading(false);
                    }} style={{ flex: 2, fontWeight: 700, padding: "13px" }}>{loading ? "Sending…" : "Apply now →"}</button>
                  </div>
                </>
              }
            </Modal>
          );
        })()}
      </>
    );
  }
  if (screen === "profile") {
    const isOffice = profile.userType === "office";
    const isProvider = profile.userType === "provider";

    const saveProfile = async () => {
      setSavingProfile(true);
      const updated = { ...profile, name: editName, location: editLocation, ...(isOffice ? { office: editOffice, address: editAddress, phone: editPhone } : { role: editRole }) };
      await storageSet(`ms4:profile:${profile.uid}`, updated);
      setProfile(updated);
      if (authUser && editName !== authUser.displayName) await updateProfile(authUser, { displayName: editName });
      if (isOffice) {
        const reg = await storageGet("ms4:officeregistry") || {};
        reg[profile.uid] = { ...reg[profile.uid], id: profile.uid, name: editOffice, email: profile.email, address: editAddress, phone: editPhone };
        await storageSet("ms4:officeregistry", reg);
      }
      setProfileMsg("Profile saved!");
      setTimeout(() => setProfileMsg(""), 3000);
      setSavingProfile(false);
    };

    const changePassword = async () => {
      setPwMsg({ text: "", ok: false });
      if (!currentPw) { setPwMsg({ text: "Enter your current password.", ok: false }); return; }
      if (newPw.length < 6) { setPwMsg({ text: "New password must be at least 6 characters.", ok: false }); return; }
      if (newPw !== confirmPw) { setPwMsg({ text: "New passwords don't match.", ok: false }); return; }
      setSavingPw(true);
      try {
        const credential = EmailAuthProvider.credential(authUser.email, currentPw);
        await reauthenticateWithCredential(authUser, credential);
        await updatePassword(authUser, newPw);
        setPwMsg({ text: "Password changed successfully!", ok: true });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } catch (e) {
        const msgs = { "auth/wrong-password": "Current password is incorrect.", "auth/invalid-credential": "Current password is incorrect.", "auth/too-many-requests": "Too many attempts — try again later." };
        setPwMsg({ text: msgs[e.code] || "Could not change password. Try again.", ok: false });
      }
      setSavingPw(false);
    };

    const isGoogleUser = authUser?.providerData?.[0]?.providerId === "google.com";

    return (
      <>
        <GlobalStyles />
        <Toast {...toast} />
        <Header title="My Account" sub={profile.email} />

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1.5rem" }}>

          {/* Profile info */}
          <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, padding: "1.5rem", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.5rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: COLORS.white, flexShrink: 0 }}>
                {(profile.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.navy }}>{profile.name}</div>
                <div style={{ fontSize: 13, color: COLORS.gray400 }}>{profile.email}</div>
                <span style={{ fontSize: 11, fontWeight: 700, background: isOffice ? COLORS.tealLight : isProvider ? COLORS.amberLight : COLORS.blueLight, color: isOffice ? COLORS.teal : isProvider ? COLORS.amber : COLORS.blue, padding: "2px 10px", borderRadius: 20, marginTop: 4, display: "inline-block" }}>
                  {isOffice ? "🏥 Office" : isProvider ? "👨‍⚕️ Provider / Doctor" : "🩺 Support Staff"}
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: COLORS.gray100, marginBottom: "1.25rem" }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.navy, marginBottom: "1rem" }}>Edit profile</div>

            <Field label={isOffice ? "Office manager name" : "Full name"}>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
            </Field>
            {isOffice
              ? <><Field label="Practice name"><input value={editOffice} onChange={e => setEditOffice(e.target.value)} placeholder="Bright Smile Dental" /></Field>
                  <Field label="Street address"><input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="123 Main St, Suite 100" /></Field>
                  <Field label="Phone number"><input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(555) 123-4567" /></Field></>
              : isProvider
              ? <Field label="Your specialty"><select value={editRole} onChange={e => setEditRole(e.target.value)}>{PROVIDER_ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
              : <Field label="Your role"><select value={editRole} onChange={e => setEditRole(e.target.value)}>{SUPPORT_ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
            }
            <Field label="City, State">
              <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Austin, TX" />
            </Field>

            {profileMsg && <div style={{ background: COLORS.greenLight, color: COLORS.green, fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 10, marginBottom: 12 }}>✓ {profileMsg}</div>}
            <button className="primary" onClick={saveProfile} disabled={savingProfile} style={{ width: "100%", fontWeight: 700, padding: "11px" }}>
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* Change password — only for email users */}
          {!isGoogleUser && (
            <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, padding: "1.5rem", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.navy, marginBottom: "1rem" }}>🔒 Change password</div>
              <Field label="Current password">
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Your current password" />
              </Field>
              <Field label="New password">
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" />
              </Field>
              <Field label="Confirm new password">
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" onKeyDown={e => e.key === "Enter" && changePassword()} />
              </Field>
              {pwMsg.text && <div style={{ background: pwMsg.ok ? COLORS.greenLight : COLORS.redLight, color: pwMsg.ok ? COLORS.green : COLORS.red, fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 10, marginBottom: 12 }}>{pwMsg.ok ? "✓ " : "⚠ "}{pwMsg.text}</div>}
              <button className="primary" onClick={changePassword} disabled={savingPw} style={{ width: "100%", fontWeight: 700, padding: "11px" }}>
                {savingPw ? "Updating…" : "Change password"}
              </button>
            </div>
          )}

          {isGoogleUser && (
            <div style={{ background: COLORS.gray50, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, padding: "1.25rem 1.5rem", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: COLORS.gray600 }}>
                <span style={{ fontWeight: 700 }}>Signed in with Google</span> — password is managed by your Google account.
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.redLight}`, padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.red, marginBottom: 6 }}>Sign out</div>
            <div style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 14 }}>You can log back in anytime with your email and password.</div>
            <button onClick={handleSignOut} style={{ background: COLORS.redLight, color: COLORS.red, border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sign out of MedShift</button>
          </div>
        </div>
      </>
    );
  }

  // ── Admin Dashboard ──────────────────────────────────────────────────────────
  if (screen === "admin") {
    if (authUser?.email !== ADMIN_EMAIL) return null;

    const officeProfiles = allProfiles.filter(p => p?.userType === "office");
    const candidateProfiles = allProfiles.filter(p => p?.userType === "assistant" || p?.userType === "provider");
    const activePositions = positions.filter(p => p.status === "active");
    const closedPositions = positions.filter(p => p.status === "closed");
    const hiredApps = applications.filter(a => a.status === "hired");

    if (screen === "admin" && allProfiles.length === 0) {
      // Still loading — show spinner
      return (
        <>
          <GlobalStyles />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.navy, flexDirection: "column", gap: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading admin data…</div>
          </div>
        </>
      );
    }

    const adminHidePos = async (posId) => {
      const next = positions.map(p => p.id === posId ? { ...p, status: "hidden" } : p);
      setPositions(next); await storageSet("ms4:positions", next);
      showToast("Position hidden from all listings.", "success");
    };

    const adminUnhidePos = async (posId) => {
      const next = positions.map(p => p.id === posId ? { ...p, status: "active" } : p);
      setPositions(next); await storageSet("ms4:positions", next);
      showToast("Position restored to active.", "success");
    };

    const adminDeletePos = async (posId) => {
      if (!window.confirm("Permanently delete this position? This cannot be undone.")) return;
      const next = positions.filter(p => p.id !== posId);
      setPositions(next); await storageSet("ms4:positions", next);
      showToast("Position deleted.", "default");
    };

    return (
      <>
        <GlobalStyles />
        <Toast {...toast} />
        <div style={{ background: COLORS.navy, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙️</div>
              <div>
                <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 16 }}>MedShift Admin</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginLeft: 10 }}>Internal dashboard</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={loadData} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>↻ Refresh</button>
              <button onClick={() => setScreen("dashboard")} style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>← Back</button>
            </div>
          </div>
        </div>

        <div style={{ background: COLORS.cream, minHeight: "100vh", padding: "2rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: "2rem" }}>
              {[
                { icon: "📋", value: activePositions.length, label: "Active positions", color: COLORS.teal },
                { icon: "🏥", value: officeProfiles.length, label: "Offices", color: COLORS.blue },
                { icon: "👥", value: candidateProfiles.length, label: "Candidates", color: COLORS.green },
                { icon: "📝", value: applications.length, label: "Total applications", color: COLORS.navy },
                { icon: "✅", value: hiredApps.length, label: "Hired", color: COLORS.green },
                { icon: "🔒", value: closedPositions.length, label: "Closed positions", color: COLORS.gray400 },
                { icon: "🙈", value: positions.filter(p => p.status === "hidden").length, label: "Hidden by admin", color: COLORS.amber },
              ].map(({ icon, value, label, color }) => (
                <div key={label} style={{ background: COLORS.white, borderRadius: 14, padding: "1.1rem 1.25rem", border: `1.5px solid ${COLORS.gray200}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray400, fontWeight: 500, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: "2rem" }}>

              {/* All Positions */}
              <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, overflow: "hidden" }}>
                <div style={{ background: COLORS.navy, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.white }}>📋 All Positions ({positions.length})</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{activePositions.length} active · {positions.filter(p => p.status === "hidden").length} hidden</span>
                </div>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {positions.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: COLORS.gray400, fontSize: 13 }}>No positions yet</div>}
                  {[...positions].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)).map(pos => (
                    <div key={pos.id} style={{ padding: "10px 18px", borderBottom: `1px solid ${COLORS.gray100}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, opacity: pos.status === "hidden" ? 0.5 : 1 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.navy }}>{pos.role}</div>
                        <div style={{ fontSize: 11, color: COLORS.gray400 }}>{pos.officeName} · {pos.location}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                          background: pos.status === "active" ? COLORS.greenLight : pos.status === "hidden" ? COLORS.amberLight : COLORS.gray100,
                          color: pos.status === "active" ? COLORS.green : pos.status === "hidden" ? COLORS.amber : COLORS.gray400
                        }}>{pos.status}</span>
                        <button onClick={() => setPublicDetailPos(pos)} style={{ fontSize: 11, padding: "3px 8px", background: COLORS.tealLight, color: COLORS.teal, border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>👁</button>
                        {pos.status === "hidden"
                          ? <button onClick={() => adminUnhidePos(pos.id)} style={{ fontSize: 11, padding: "3px 8px", background: COLORS.greenLight, color: COLORS.green, border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Restore</button>
                          : <button onClick={() => adminHidePos(pos.id)} style={{ fontSize: 11, padding: "3px 8px", background: COLORS.amberLight, color: COLORS.amber, border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Hide</button>
                        }
                        <button onClick={() => adminDeletePos(pos.id)} style={{ fontSize: 11, padding: "3px 8px", background: COLORS.redLight, color: COLORS.red, border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Applications */}
              <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, overflow: "hidden" }}>
                <div style={{ background: COLORS.navy, padding: "14px 18px" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.white }}>📝 All Applications ({applications.length})</span>
                </div>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {applications.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: COLORS.gray400, fontSize: 13 }}>No applications yet</div>}
                  {[...applications].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).map(app => (
                    <div key={app.id} style={{ padding: "10px 18px", borderBottom: `1px solid ${COLORS.gray100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.navy }}>{app.applicantName}</div>
                        <div style={{ fontSize: 11, color: COLORS.gray400 }}>{app.positionRole} at {app.officeName}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: app.status === "hired" ? COLORS.greenLight : app.status === "declined" ? COLORS.redLight : COLORS.amberLight, color: app.status === "hired" ? COLORS.green : app.status === "declined" ? COLORS.red : COLORS.amber }}>{app.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Offices */}
              <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, overflow: "hidden" }}>
                <div style={{ background: COLORS.navy, padding: "14px 18px" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.white }}>🏥 Offices ({officeProfiles.length})</span>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {officeProfiles.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: COLORS.gray400, fontSize: 13 }}>No offices yet</div>}
                  {officeProfiles.map(office => {
                    const officePositions = positions.filter(p => p.officeId === office.uid);
                    const officeApps = applications.filter(a => a.officeId === office.uid);
                    return (
                      <div key={office.uid} style={{ padding: "10px 18px", borderBottom: `1px solid ${COLORS.gray100}` }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.navy }}>{office.office || office.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.gray400 }}>{office.name} · {office.email}</div>
                        {office.address && <div style={{ fontSize: 11, color: COLORS.gray600, marginTop: 1 }}>📍 {office.address}</div>}
                        {office.phone && <div style={{ fontSize: 11, color: COLORS.gray600, marginTop: 1 }}>📞 {office.phone}</div>}
                        <div style={{ fontSize: 11, color: COLORS.teal, marginTop: 2 }}>{officePositions.length} positions · {officeApps.length} applicants · {officeApps.filter(a => a.status === "hired").length} hired</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Candidates */}
              <div style={{ background: COLORS.white, borderRadius: 16, border: `1.5px solid ${COLORS.gray200}`, overflow: "hidden" }}>
                <div style={{ background: COLORS.navy, padding: "14px 18px" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.white }}>👥 Candidates ({candidateProfiles.length})</span>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {candidateProfiles.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: COLORS.gray400, fontSize: 13 }}>No candidates yet</div>}
                  {candidateProfiles.map(candidate => {
                    const appCount = applications.filter(a => a.applicantId === candidate.uid).length;
                    const hired = applications.filter(a => a.applicantId === candidate.uid && a.status === "hired").length;
                    return (
                      <div key={candidate.uid} style={{ padding: "10px 18px", borderBottom: `1px solid ${COLORS.gray100}` }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.navy }}>{candidate.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.gray400 }}>{candidate.email} · {candidate.role} · <span style={{ fontWeight: 600, color: candidate.userType === "provider" ? COLORS.amber : COLORS.blue }}>{candidate.userType}</span></div>
                        <div style={{ fontSize: 11, color: COLORS.teal, marginTop: 2 }}>{appCount} application{appCount !== 1 ? "s" : ""}{hired > 0 ? ` · ${hired} hired` : ""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* View position modal */}
        {publicDetailPos && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(13,33,55,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setPublicDetailPos(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: COLORS.white, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", padding: "2rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.navy }}>{publicDetailPos.role}</span>
                <button onClick={() => setPublicDetailPos(null)} style={{ background: COLORS.gray100, border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, color: COLORS.gray600, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 600, marginBottom: 10 }}>{publicDetailPos.officeName} · {publicDetailPos.location}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <Badge type={publicDetailPos.shiftType} />
                <Chip>📅 {publicDetailPos.date}</Chip>
                <Chip accent>💰 {publicDetailPos.pay}</Chip>
              </div>
              {publicDetailPos.description && <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.gray600, background: COLORS.gray50, padding: "12px 14px", borderRadius: 10, marginBottom: 14 }}>{publicDetailPos.description}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {publicDetailPos.status === "hidden"
                  ? <button onClick={() => { adminUnhidePos(publicDetailPos.id); setPublicDetailPos(null); }} style={{ flex: 1, background: COLORS.greenLight, color: COLORS.green, border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, cursor: "pointer" }}>✓ Restore to active</button>
                  : <button onClick={() => { adminHidePos(publicDetailPos.id); setPublicDetailPos(null); }} style={{ flex: 1, background: COLORS.amberLight, color: COLORS.amber, border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, cursor: "pointer" }}>🙈 Hide from listings</button>
                }
                <button onClick={() => { adminDeletePos(publicDetailPos.id); setPublicDetailPos(null); }} style={{ flex: 1, background: COLORS.redLight, color: COLORS.red, border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, cursor: "pointer" }}>🗑 Delete permanently</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  if (screen === "office") {
    const FREE_POSITIONS = 2;
    const POSTING_PRICE = "$15";

    const myPositions = positions.filter(p => p.officeId === profile.uid);
    const myApplicants = applications.filter(a => a.officeId === profile.uid);
    const freePostingsUsed = myPositions.length;
    const atPositionLimit = freePostingsUsed >= FREE_POSITIONS;

    // Auto-expire positions past their expiry date
    const today = new Date().toISOString().split("T")[0];
    const hasExpired = myPositions.some(p => p.status === "active" && p.expiresAt && p.expiresAt < today);
    if (hasExpired) {
      const next = positions.map(p => p.status === "active" && p.expiresAt && p.expiresAt < today ? { ...p, status: "closed" } : p);
      storageSet("ms4:positions", next);
      setPositions(next);
    }
    const PaywallModal = () => {
      const isPosting = true;
      const amount = isPosting ? "15.00" : "15.00";
      const containerId = "paypal-posting-btn";

      useEffect(() => {
        if (!showUpgrade) return;
        const scriptId = "paypal-sdk";
        const existing = document.getElementById(scriptId);
        const renderButtons = () => {
          const container = document.getElementById(containerId);
          if (!container || container.children.length > 0) return;
          window.paypal.Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
            createOrder: (data, actions) => actions.order.create({
              purchase_units: [{ amount: { value: amount }, description: isPosting ? "MedShift — Job Posting" : "MedShift — Resume Analysis" }]
            }),
            onApprove: async (data, actions) => {
              await actions.order.capture();
              const newCredits = (postingCredits || 0) + 1;
              setPostingCredits(newCredits);
              await storageSet(`ms4:postcredits:${profile.uid}`, newCredits);
              setShowUpgrade(false);
              showToast("✅ Posting credit added!", "success");
            },
            onError: () => showToast("Payment failed — please try again", "error")
          }).render(`#${containerId}`);
        };
        if (!existing) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
          script.onload = renderButtons;
          document.body.appendChild(script);
        } else if (window.paypal) {
          renderButtons();
        } else {
          existing.addEventListener("load", renderButtons);
        }
      }, [showUpgrade]);

      if (!showUpgrade) return null;
      return (
        <Modal open onClose={() => setShowUpgrade(false)} title={isPosting ? "Post a position" : "Resume match analysis"}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{isPosting ? "📋" : "✨"}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.navy, marginBottom: 6 }}>
              {isPosting ? "Post an additional position" : "Unlock resume analysis"}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.teal }}>${amount}</div>
            <div style={{ fontSize: 13, color: COLORS.gray400, marginTop: 4 }}>one-time · per posting</div>
          </div>

          <div style={{ background: COLORS.gray50, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy, marginBottom: 8 }}>What you get:</div>
            {(isPosting
              ? ["Position listed publicly to all candidates", "Unlimited applicants", "Resume uploads + AI match analysis", "Hire, decline & message candidates"]
              : ["AI reads the full PDF resume", "Match score out of 10", "Strengths & gaps vs your requirements", "2-sentence hiring recommendation"]
            ).map(t => (
              <div key={t} style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${COLORS.teal}` }}>✓ {t}</div>
            ))}
          </div>

          <div id={containerId} style={{ marginBottom: "1rem" }} />
          <div style={{ fontSize: 11, color: COLORS.gray400, textAlign: "center" }}>Secure payment via PayPal · Credit added instantly after payment</div>
        </Modal>
      );
    };

    const redeemCode = async () => {
      setProCodeError("");
      const code = proCode.trim().toUpperCase();
      if (code.startsWith("POST-")) {
        const newCredits = (postingCredits || 0) + 1;
        setPostingCredits(newCredits);
        await storageSet(`ms4:postcredits:${profile.uid}`, newCredits);
        showToast("✅ Posting credit added!", "success");
        setShowUpgrade(false); setProCode("");
      } else {
        setProCodeError("Invalid code — posting codes start with POST-");
      }
    };

    const closePosition = async (posId) => {
      const next = positions.map(p => p.id === posId ? { ...p, status: "closed" } : p);
      setPositions(next); await storageSet("ms4:positions", next);
      showToast("Position marked as filled/closed.", "success");
    };

    const postPosition = async () => {
      if (!postForm.role) return;
      if (atPositionLimit && (postingCredits || 0) < 1) { setShowUpgrade("posting"); return; }
      setLoading(true);
      const usedCredit = atPositionLimit && (postingCredits || 0) >= 1;
      if (usedCredit) {
        const newCredits = postingCredits - 1;
        setPostingCredits(newCredits);
        await storageSet(`ms4:postcredits:${profile.uid}`, newCredits);
      }
      const pos = { id: Date.now().toString(), officeId: profile.uid, officeName: profile.office, officeEmail: profile.email, officeAddress: profile.address || "", officePhone: profile.phone || "", postedBy: profile.name, location: postForm.location || profile.location || "", role: postForm.role, practiceType: postForm.practiceType, shiftType: postForm.shiftType, positionLevel: postForm.positionLevel || "support", date: postForm.date || "Flexible", time: postForm.time || "TBD", pay: postForm.pay || "Negotiable", expiresAt: postForm.expiresAt || null, description: postForm.description, requirements: postForm.requirements, postedAt: new Date().toISOString(), status: "active" };
      const next = [pos, ...positions]; setPositions(next); await storageSet("ms4:positions", next);
      setShowPost(false); setPostForm({ role: "", practiceType: "dental", shiftType: "temporary", positionLevel: "support", date: "", time: "", pay: "", location: "", expiresAt: "", description: "", requirements: "" });
      showToast("Position posted!", "success"); setLoading(false);
    };

    const updateApp = async (appId, status) => {
      const app = applications.find(a => a.id === appId);
      const next = applications.map(a => a.id === appId ? { ...a, status } : a);
      setApplications(next); await storageSet("ms4:applications", next);
      if (app) await sendEmailNotification({ to: app.applicantEmail, subject: status === "hired" ? `You have been hired at ${profile.office}! - MedShift` : `Application update - MedShift`, body: status === "hired" ? `Hi ${app.applicantName}, congratulations! ${profile.office} has hired you. - MedShift` : `Hi ${app.applicantName}, thank you for applying. ${profile.office} has moved forward with other candidates. - MedShift` });
      showToast(status === "hired" ? "Hired! Candidate notified." : "Declined.", status === "hired" ? "success" : "default");
    };


    const savePosition = async () => {
      if (!editingPos) return;
      setLoading(true);
      const next = positions.map(p => p.id === editingPos.id ? { ...editingPos } : p);
      setPositions(next); await storageSet("ms4:positions", next);
      setEditingPos(null);
      showToast("Position updated!", "success"); setLoading(false);
    };

    return (
      <>
        <GlobalStyles />
        <Toast {...toast} />
        <MessagingModal />
        <PaywallModal />
        <Header title={profile.office} sub={profile.name + " · Office dashboard"} />

        {/* Edit Position Modal */}
        {editingPos && (
          <Modal open wide title="Edit position" onClose={() => setEditingPos(null)}>
            <Field label="Role title"><input value={editingPos.role} onChange={e => setEditingPos(p => ({ ...p, role: e.target.value }))} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Practice type"><select value={editingPos.practiceType} onChange={e => setEditingPos(p => ({ ...p, practiceType: e.target.value }))}><option value="dental">🦷 Dental</option><option value="medical">🩺 Medical</option></select></Field>
              <Field label="Position type"><select value={editingPos.shiftType} onChange={e => setEditingPos(p => ({ ...p, shiftType: e.target.value }))}><option value="temporary">Temp / Fill-in</option><option value="part-time">Part-Time</option><option value="full-time">Full-Time</option></select></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Date / Start"><input value={editingPos.date} onChange={e => setEditingPos(p => ({ ...p, date: e.target.value }))} /></Field>
              <Field label="Hours"><input value={editingPos.time} onChange={e => setEditingPos(p => ({ ...p, time: e.target.value }))} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Pay rate"><input value={editingPos.pay} onChange={e => setEditingPos(p => ({ ...p, pay: e.target.value }))} /></Field>
              <Field label="Location"><input value={editingPos.location} onChange={e => setEditingPos(p => ({ ...p, location: e.target.value }))} /></Field>
            </div>
            <Field label="Description"><textarea value={editingPos.description || ""} onChange={e => setEditingPos(p => ({ ...p, description: e.target.value }))} /></Field>
            <Field label="Requirements (one per line)"><textarea value={editingPos.requirements || ""} onChange={e => setEditingPos(p => ({ ...p, requirements: e.target.value }))} /></Field>
            <Field label="Expiration date (optional)"><input type="date" value={editingPos.expiresAt || ""} onChange={e => setEditingPos(p => ({ ...p, expiresAt: e.target.value }))} min={new Date().toISOString().split("T")[0]} /></Field>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setEditingPos(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="primary" onClick={savePosition} disabled={!editingPos.role || loading} style={{ flex: 2, fontWeight: 700 }}>{loading ? "Saving…" : "Save changes"}</button>
            </div>
          </Modal>
        )}

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.75rem 1.5rem" }}>
          {/* Stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: "1.75rem", flexWrap: "wrap" }}>
            <StatCard value={myPositions.filter(p => p.status === "active").length} label="Active postings" icon="📋" />
            <StatCard value={myApplicants.filter(a => a.status === "pending").length} label="Pending review" icon="👥" />
            <StatCard value={myApplicants.filter(a => a.status === "hired").length} label="Hired this month" icon="✅" />
          </div>

          {/* Plan banner */}
          <div style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0a3352 100%)`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 4px 16px rgba(13,33,55,0.15)" }}>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(11,110,110,0.3)", border: "1px solid rgba(11,110,110,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Free postings remaining</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 22 }}>{Math.max(0, FREE_POSITIONS - freePostingsUsed)}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 500 }}>/ {FREE_POSITIONS}</span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 120, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ width: `${(Math.max(0, FREE_POSITIONS - freePostingsUsed) / FREE_POSITIONS) * 100}%`, height: "100%", background: COLORS.teal, borderRadius: 10, transition: "width 0.3s" }} />
              </div>
              {postingCredits > 0 && (
                <div style={{ background: "rgba(11,110,110,0.25)", border: "1px solid rgba(11,110,110,0.4)", borderRadius: 10, padding: "6px 14px" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>Paid credits</div>
                  <div style={{ color: COLORS.teal, fontWeight: 800, fontSize: 16 }}>{postingCredits} posting{postingCredits !== 1 ? "s" : ""}</div>
                </div>
              )}
            </div>
            {atPositionLimit && postingCredits < 1 && (
              <button onClick={() => setShowUpgrade("posting")} style={{ background: COLORS.teal, color: COLORS.white, border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, flexShrink: 0, boxShadow: "0 2px 8px rgba(11,110,110,0.4)" }}>
                + Buy more postings · {POSTING_PRICE}
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, color: COLORS.navy }}>Your positions</h2>
              <p style={{ color: COLORS.gray400, fontSize: 13, marginTop: 2 }}>{myPositions.filter(p => p.status === "active").length} active · {myPositions.filter(p => p.status === "closed").length} closed</p>
            </div>
            <button className="primary" onClick={() => atPositionLimit && postingCredits < 1 ? setShowUpgrade("posting") : setShowPost(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px" }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Post position
            </button>
          </div>

          {myPositions.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: COLORS.white, borderRadius: 16, border: `1.5px dashed ${COLORS.gray200}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.navy, marginBottom: 6 }}>No positions yet</div>
              <div style={{ color: COLORS.gray400, fontSize: 14 }}>Click "Post position" to find your first candidate</div>
            </div>
          )}

          {myPositions.map((pos, i) => {
            const posApps = applications.filter(a => a.positionId === pos.id);
            return (
              <Card key={pos.id} style={{ animationDelay: `${i * 0.05}s` }} className="fade-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: pos.status === "closed" ? COLORS.gray400 : COLORS.navy }}>{pos.role}</div>
                      {pos.status === "closed" && <span style={{ fontSize: 11, fontWeight: 700, background: COLORS.gray100, color: COLORS.gray400, padding: "2px 8px", borderRadius: 20 }}>Filled / Closed</span>}
                      {pos.status === "active" && pos.expiresAt && (
                        <span style={{ fontSize: 11, fontWeight: 600, background: COLORS.amberLight, color: COLORS.amber, padding: "2px 8px", borderRadius: 20 }}>
                          ⏳ Expires {new Date(pos.expiresAt + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Chip>📅 {pos.date}</Chip>
                      <Chip>💰 {pos.pay}</Chip>
                      <Chip>📍 {pos.location}</Chip>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    <Badge type={pos.shiftType} />
                    <button onClick={() => setPublicDetailPos(pos)} style={{ fontSize: 11, padding: "4px 10px", background: COLORS.tealLight, color: COLORS.teal, border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                      👁 View
                    </button>
                    {pos.status === "active" && (
                      <button onClick={() => setEditingPos({ ...pos })} style={{ fontSize: 11, padding: "4px 10px", background: COLORS.blueLight, color: COLORS.blue, border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                        ✏️ Edit
                      </button>
                    )}
                    {pos.status === "active" && (
                      <button onClick={() => { if (window.confirm("Mark this position as filled/closed? It will be removed from public listings.")) closePosition(pos.id); }} style={{ fontSize: 11, padding: "4px 10px", background: COLORS.redLight, color: COLORS.red, border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {posApps.length > 0 && <Divider />}

                {posApps.length === 0 && <div style={{ fontSize: 13, color: COLORS.gray400, fontStyle: "italic" }}>No applicants yet — share your posting to get responses!</div>}


                {posApps.map((app, appIndex) => {
                  return (
                    <div key={app.id} style={{ borderTop: `1px solid ${COLORS.gray100}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                        <Avatar name={app.applicantName} teal />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{app.applicantName}</div>
                          <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 1 }}>{app.applicantRole} · {app.applicantLocation}</div>
                          {app.message && <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 4, fontStyle: "italic", background: COLORS.gray50, padding: "4px 10px", borderRadius: 8, borderLeft: `3px solid ${COLORS.teal}` }}>"{app.message}"</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button onClick={() => openMessages(app, true)} style={{ fontSize: 12, padding: "6px 12px" }}>
                            💬 {messages[`thread:${app.id}`]?.length > 0 ? `(${messages[`thread:${app.id}`].length})` : "Chat"}
                          </button>
                          {app.resumeName && (
                            <button onClick={async () => {
                              const data = await storageGet(`ms4:resume:${app.id}`);
                              if (data) { const a = document.createElement("a"); a.href = data; a.download = app.resumeName; a.click(); }
                              else showToast("Resume not found", "error");
                            }} style={{ fontSize: 12, padding: "6px 12px", background: COLORS.blueLight, color: COLORS.blue, border: `1.5px solid ${COLORS.blueLight}` }}>
                              📄 Resume
                            </button>
                          )}
                          {app.status === "pending"
                            ? <><button className="success" onClick={() => updateApp(app.id, "hired")} style={{ fontSize: 12, padding: "6px 12px" }}>Hire</button><button className="danger" onClick={() => updateApp(app.id, "declined")} style={{ fontSize: 12, padding: "6px 12px" }}>Decline</button></>
                            : <span style={{ fontSize: 12, fontWeight: 700, color: app.status === "hired" ? COLORS.green : COLORS.gray400 }}>{app.status === "hired" ? "✓ Hired" : "Declined"}</span>
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>

        <Modal open={showPost} onClose={() => setShowPost(false)} title="Post a new position">
          <Field label="Role title"><input placeholder="e.g. Dental Assistant, Dentist, Medical Assistant" value={postForm.role} onChange={e => setPostForm(p => ({ ...p, role: e.target.value }))} /></Field>
          <Field label="Position level">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ v: "support", icon: "🩺", label: "Support Staff", sub: "Assistants, hygienists, front desk" }, { v: "provider", icon: "👨‍⚕️", label: "Provider / Doctor", sub: "Dentists, physicians, specialists" }].map(opt => (
                <div key={opt.v} onClick={() => setPostForm(p => ({ ...p, positionLevel: opt.v }))} style={{ padding: "10px 12px", border: `2px solid ${postForm.positionLevel === opt.v ? COLORS.teal : COLORS.gray200}`, borderRadius: 10, cursor: "pointer", background: postForm.positionLevel === opt.v ? COLORS.tealLight : COLORS.white }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: postForm.positionLevel === opt.v ? COLORS.teal : COLORS.navy }}>{opt.icon} {opt.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>{opt.sub}</div>
                </div>
              ))}
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Practice type"><select value={postForm.practiceType} onChange={e => setPostForm(p => ({ ...p, practiceType: e.target.value }))}><option value="dental">🦷 Dental</option><option value="medical">🩺 Medical</option></select></Field>
            <Field label="Position type"><select value={postForm.shiftType} onChange={e => setPostForm(p => ({ ...p, shiftType: e.target.value }))}><option value="temporary">Temp / Fill-in</option><option value="part-time">Part-Time</option><option value="full-time">Full-Time</option></select></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date / Start"><input placeholder="2026-03-20 or Immediate" value={postForm.date} onChange={e => setPostForm(p => ({ ...p, date: e.target.value }))} /></Field>
            <Field label="Hours"><input placeholder="8AM – 5PM" value={postForm.time} onChange={e => setPostForm(p => ({ ...p, time: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Pay rate"><input placeholder="$22/hr" value={postForm.pay} onChange={e => setPostForm(p => ({ ...p, pay: e.target.value }))} /></Field>
            <Field label="Location"><input placeholder="Austin, TX" value={postForm.location} onChange={e => setPostForm(p => ({ ...p, location: e.target.value }))} /></Field>
          </div>
          <Field label="Description"><textarea placeholder="Describe the role and your practice…" value={postForm.description} onChange={e => setPostForm(p => ({ ...p, description: e.target.value }))} /></Field>
          <Field label="Requirements (one per line)"><textarea placeholder={"X-ray certified\n1+ years experience\nEaglesoft familiarity"} value={postForm.requirements} onChange={e => setPostForm(p => ({ ...p, requirements: e.target.value }))} /></Field>
          <Field label="Expiration date (optional — position auto-closes after this date)">
            <input type="date" value={postForm.expiresAt} onChange={e => setPostForm(p => ({ ...p, expiresAt: e.target.value }))} min={new Date().toISOString().split("T")[0]} />
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setShowPost(false)} style={{ flex: 1 }}>Cancel</button>
            <button className="primary" onClick={postPosition} disabled={!postForm.role || loading} style={{ flex: 2, fontWeight: 700 }}>{loading ? "Posting…" : "Post position"}</button>
          </div>
        </Modal>

        {/* View posting modal */}
        {publicDetailPos && (
          <Modal open wide title={publicDetailPos.role} onClose={() => setPublicDetailPos(null)}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.tealLight, border: `1px solid ${COLORS.teal}33`, borderRadius: 20, padding: "4px 12px", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.teal }}>👁 This is how your posting appears to candidates</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: COLORS.teal }}>{publicDetailPos.officeName?.slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, color: COLORS.teal }}>{publicDetailPos.officeName}</div>
                <div style={{ fontSize: 12, color: COLORS.gray400 }}>{publicDetailPos.location}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <Badge type={publicDetailPos.shiftType} />
              <Chip>📅 {publicDetailPos.date}</Chip>
              {publicDetailPos.time && publicDetailPos.time !== "TBD" && <Chip>🕐 {publicDetailPos.time}</Chip>}
              <Chip accent>💰 {publicDetailPos.pay}</Chip>
            </div>
            {publicDetailPos.description && (
              <div style={{ marginBottom: 14 }}>
                <Label>About this position</Label>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.gray600, background: COLORS.gray50, padding: "12px 14px", borderRadius: 10 }}>{publicDetailPos.description}</div>
              </div>
            )}
            {publicDetailPos.requirements && (
              <div style={{ marginBottom: 16 }}>
                <Label>Requirements</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {publicDetailPos.requirements.split("\n").filter(Boolean).map((r, i) => <Chip key={i} accent>✓ {r}</Chip>)}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => { setPublicDetailPos(null); setEditingPos({ ...publicDetailPos }); }} style={{ flex: 1, fontWeight: 600 }}>✏️ Edit this posting</button>
              <button onClick={() => setPublicDetailPos(null)} className="primary" style={{ flex: 1, fontWeight: 700 }}>Done</button>
            </div>
          </Modal>
        )}
      </>
    );
  }
  if (screen === "assistant") {
    const myApps = applications.filter(a => a.applicantId === profile.uid);
    const appliedIds = new Set(myApps.map(a => a.positionId));
    const filtered = positions.filter(p => {
      if (p.status !== "active") return false;
      if (filterType !== "all" && p.practiceType !== filterType) return false;
      if (filterShift !== "all" && p.shiftType !== filterShift) return false;
      if (search.trim()) { const q = search.toLowerCase(); return [p.role, p.officeName, p.location, p.description, p.requirements].some(f => (f || "").toLowerCase().includes(q)); }
      return true;
    });

    const submitApp = async () => {
      if (!detailPos) return; setLoading(true);
      const app = { id: Date.now().toString(), positionId: detailPos.id, officeId: detailPos.officeId, officeName: detailPos.officeName, officeEmail: detailPos.officeEmail, positionRole: detailPos.role, applicantId: profile.uid, applicantName: profile.name, applicantEmail: profile.email, applicantRole: profile.role, applicantLocation: profile.location, message: applyMsg, resumeName: resumeFile ? resumeFile.name : null, status: "pending", appliedAt: new Date().toISOString() };
      const next = [app, ...applications]; setApplications(next); await storageSet("ms4:applications", next);
      if (resumeData) {
        try { await storageSet(`ms4:resume:${app.id}`, resumeData); } catch { /* resume too large, skip */ }
      }
      await sendEmailNotification({ to: detailPos.officeEmail, subject: `New applicant for ${detailPos.role} - MedShift`, body: `Hi ${detailPos.postedBy}, ${profile.name} (${profile.role}, ${profile.location}) applied for your ${detailPos.role} position.${applyMsg ? ` Note: "${applyMsg}"` : ""} - MedShift` });
      setDetailPos(null); setApplyMsg(""); setAiMatch(null); setResumeFile(null); setResumeData(null);
      showToast("Application sent!", "success"); setLoading(false);
    };

    return (
      <>
        <GlobalStyles />
        <Toast {...toast} />
        <MessagingModal />
        <Header title={profile.name} sub={profile.role + " · " + (profile.location || "MedShift")} />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.75rem 1.5rem" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", background: COLORS.white, borderRadius: 14, padding: 4, border: `1.5px solid ${COLORS.gray200}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {["browse", "applications"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, borderRadius: 10, border: "none", background: activeTab === tab ? COLORS.teal : "transparent", color: activeTab === tab ? COLORS.white : COLORS.gray400, fontWeight: 600, fontSize: 14, padding: "10px 0", transition: "all 0.2s" }}>
                {tab === "browse" ? `Browse positions (${positions.filter(p => p.status === "active").length})` : `My applications (${myApps.length})`}
              </button>
            ))}
          </div>

          {activeTab === "browse" && (
            <>
              {/* Search */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.gray400, fontSize: 16 }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, offices, locations…" style={{ paddingLeft: 40, background: COLORS.white }} />
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {[["all", "All types"], ["dental", "🦷 Dental"], ["medical", "🩺 Medical"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterType(v)} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, background: filterType === v ? COLORS.teal : COLORS.white, color: filterType === v ? COLORS.white : COLORS.gray600, border: `1.5px solid ${filterType === v ? COLORS.teal : COLORS.gray200}`, fontWeight: 500 }}>{l}</button>
                ))}
                <div style={{ width: 1, background: COLORS.gray200, margin: "0 2px" }} />
                {[["all", "All shifts"], ["temporary", "Temp"], ["part-time", "Part-time"], ["full-time", "Full-time"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterShift(v)} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, background: filterShift === v ? COLORS.navy : COLORS.white, color: filterShift === v ? COLORS.white : COLORS.gray600, border: `1.5px solid ${filterShift === v ? COLORS.navy : COLORS.gray200}`, fontWeight: 500 }}>{l}</button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", background: COLORS.white, borderRadius: 16, border: `1.5px dashed ${COLORS.gray200}` }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>{search ? `No results for "${search}"` : "No positions yet"}</div>
                  <div style={{ color: COLORS.gray400, fontSize: 14 }}>Try different filters or check back soon</div>
                </div>
              )}

              {filtered.map((pos, i) => {
                const applied = appliedIds.has(pos.id);
                return (
                  <Card key={pos.id} onClick={() => { setDetailPos(pos); setAiMatch(null); setApplyMsg(""); }} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.navy }}>{pos.role}</div>
                          {applied && <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, background: COLORS.greenLight, padding: "2px 8px", borderRadius: 20 }}>✓ Applied</span>}
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 600, marginBottom: 8 }}>{pos.officeName} · {pos.location}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Chip>📅 {pos.date}</Chip>
                          <Chip>💰 {pos.pay}</Chip>
                          {pos.time && pos.time !== "TBD" && <Chip>🕐 {pos.time}</Chip>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <Badge type={pos.shiftType} />
                        <span style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600 }}>View details →</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          )}

          {activeTab === "applications" && (
            <>
              {myApps.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", background: COLORS.white, borderRadius: 16, border: `1.5px dashed ${COLORS.gray200}` }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                  <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>No applications yet</div>
                  <div style={{ color: COLORS.gray400, fontSize: 14 }}>Browse positions and apply to get started</div>
                </div>
              )}
              {myApps.map(app => (
                <Card key={app.id} className="fade-up">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.navy }}>{app.positionRole}</div>
                      <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 600, marginTop: 2 }}>{app.officeName}</div>
                      {app.message && <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 8, fontStyle: "italic", background: COLORS.gray50, padding: "4px 10px", borderRadius: 8, borderLeft: `3px solid ${COLORS.teal}` }}>"{app.message}"</div>}
                      {app.resumeName && <div style={{ fontSize: 11, color: COLORS.blue, marginTop: 6, fontWeight: 600 }}>📄 {app.resumeName}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: app.status === "hired" ? COLORS.greenLight : app.status === "declined" ? COLORS.redLight : COLORS.amberLight, color: app.status === "hired" ? COLORS.green : app.status === "declined" ? COLORS.red : COLORS.amber }}>
                        {app.status === "hired" ? "🎉 Hired!" : app.status === "declined" ? "Declined" : "Under review"}
                      </span>
                      <button onClick={() => openMessages(app, false)} style={{ fontSize: 12, padding: "6px 12px" }}>
                        💬 Message {messages[`thread:${app.id}`]?.length > 0 ? `(${messages[`thread:${app.id}`].length})` : "office"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Position detail */}
        <Modal open={!!detailPos} onClose={() => { setDetailPos(null); setAiMatch(null); setResumeFile(null); setResumeData(null); }} title={detailPos?.role} wide>
          {detailPos && (
            <>
              {!appliedIds.has(detailPos.id) && (
                <button onClick={() => applyRef.current?.scrollIntoView({ behavior: "smooth" })} style={{ width: "100%", marginBottom: 16, background: COLORS.teal, color: COLORS.white, border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14 }}>
                  📝 Apply for this role ↓
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: COLORS.teal }}>{detailPos.officeName?.slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, color: COLORS.teal }}>{detailPos.officeName}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray400 }}>{detailPos.location}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                <Badge type={detailPos.shiftType} />
                <Chip>📅 {detailPos.date}</Chip>
                {detailPos.time && detailPos.time !== "TBD" && <Chip>🕐 {detailPos.time}</Chip>}
                <Chip accent>💰 {detailPos.pay}</Chip>
              </div>

              {detailPos.description && (
                <div style={{ marginBottom: 16 }}>
                  <Label>About this position</Label>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.gray600, background: COLORS.gray50, padding: "12px 14px", borderRadius: 10 }}>{detailPos.description}</div>
                </div>
              )}

              {detailPos.requirements && (
                <div style={{ marginBottom: 16 }}>
                  <Label>Requirements</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {detailPos.requirements.split("\n").filter(Boolean).map((r, i) => <Chip key={i} accent>✓ {r}</Chip>)}
                  </div>
                </div>
              )}

              <Divider />

              {appliedIds.has(detailPos.id)
                ? <div style={{ textAlign: "center", color: COLORS.green, fontWeight: 700, padding: "14px", background: COLORS.greenLight, borderRadius: 12 }}>✓ You have already applied to this position</div>
                : <>
                  <div ref={applyRef} style={{ background: COLORS.tealLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1.5px solid ${COLORS.teal}33` }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.teal, marginBottom: 2 }}>📝 Apply for this position</div>
                    <div style={{ fontSize: 12, color: COLORS.gray600 }}>Cover note and resume are both optional</div>
                  </div>
                  <Field label="Cover note (optional)">
                    <textarea placeholder="Tell them why you are a great fit…" value={applyMsg} onChange={e => setApplyMsg(e.target.value)} />
                  </Field>
                  <Field label="Resume (optional — PDF or Word)">
                    <div
                      onClick={() => document.getElementById("resume-upload").click()}
                      style={{ border: `2px dashed ${resumeFile ? COLORS.teal : COLORS.gray200}`, borderRadius: 12, padding: "16px", textAlign: "center", cursor: "pointer", background: resumeFile ? COLORS.tealLight : COLORS.gray50, transition: "all 0.15s" }}
                    >
                      {resumeFile ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.teal }}>{resumeFile.name}</div>
                            <div style={{ fontSize: 11, color: COLORS.gray400 }}>{(resumeFile.size / 1024).toFixed(0)} KB · Click to change</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray600 }}>Click to attach your resume</div>
                          <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>PDF or Word · Max 4MB</div>
                        </div>
                      )}
                    </div>
                    <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) { showToast("File too large — max 4MB", "error"); return; }
                      setResumeFile(file);
                      const reader = new FileReader();
                      reader.onload = ev => setResumeData(ev.target.result);
                      reader.readAsDataURL(file);
                    }} />
                  </Field>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => { setDetailPos(null); setAiMatch(null); setResumeFile(null); setResumeData(null); }} style={{ flex: 1 }}>Cancel</button>
                    <button className="primary" onClick={submitApp} disabled={loading} style={{ flex: 2, fontWeight: 700, padding: "13px" }}>{loading ? "Sending…" : "Apply now →"}</button>
                  </div>
                </>
              }
            </>
          )}
        </Modal>
      </>
    );
  }

  return null;
}
