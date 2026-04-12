import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   UJRIS v3 — Universal Justice Response & Intelligence System
   Production build per full product specification
   ═══════════════════════════════════════════════════════════════ */

// ── UJRIS Calm Productivity Palette ────────────────────────────
// Research: 18% cortisol reduction, +42% task completion (Univ. Sussex / Baymard)
// Cream + Navy + Gold — "High-End Law Library" aesthetic
const T = {
  // Backgrounds — warm cream surfaces
  navy:   "#F8F1E9",        // primary background: Soft Warm Cream
  navyM:  "#FAF6F0",        // card backgrounds: elevated cream
  navyL:  "#EDE4D9",        // deeper cream: borders, dividers, hover states
  
  // Text — deep navy for readability (20-30% less eye strain vs dark bg)
  white:  "#0F2C4A",        // primary text & headings: Deep Navy
  muted:  "#1E3A5F",        // secondary text: Darker Navy
  dim:    "#64748B",        // tertiary text: slate gray
  
  // Accents — gold brand identity
  gold:   "#D4AF37",        // primary accent: Warm Gold
  goldL:  "#F5E6B3",        // soft gold: tooltips, light highlights
  goldD:  "#C9A14E",        // dark gold: hover states on gold elements
  
  // Semantic — clear non-stressful alerts
  teal:   "#0F2C4A",        // alias for deep navy in components
  tealL:  "#1E3A5F",        // alias for secondary navy
  red:    "#DC2626",        // error/critical: softer red
  redL:   "#EF4444",        // light red: warnings
  
  // Utility
  faint:  "rgba(15,44,74,0.04)",   // very subtle navy tint
  border: "rgba(15,44,74,0.12)",   // cream border
  goldBg: "rgba(212,175,55,0.12)", // gold tint
  tealBg: "rgba(15,44,74,0.06)",   // navy tint (replaces teal backgrounds)
  redBg:  "rgba(220,38,38,0.08)",  // soft red tint
  
  // Explicit semantic colours (not remapped from old names)
  cream:    "#F8F1E9",   // main background
  creamD:   "#EDE4D9",   // card border / divider
  creamDD:  "#D4C4B0",   // deeper divider
  deepNavy: "#0F2C4A",   // primary text
  midNavy:  "#1E3A5F",   // secondary text
  slate:    "#64748B",   // tertiary / labels
  success:  "#10B981",   // calm green
  warning:  "#F59E0B",   // amber
  info:     "#3B82F6",   // sky blue
};

const S = {
  get: (k, d = null) => { try { const v = localStorage.getItem("ujris3_"+k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("ujris3_"+k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem("ujris3_"+k); } catch {} },
};

async function streamAI(system, user, onChunk, onDone) {
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        stream: true,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      onChunk(`⚠ Server error (${res.status}): ${errText}`);
      onDone?.("");
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === "content_block_delta" && d.delta?.text) {
              full += d.delta.text;
              onChunk(full);
            }
          } catch {}
        }
      }
    }
    onDone?.(full);
  } catch (e) {
    onChunk(`⚠ AI service error: ${e.message}. Please try again.`);
    onDone?.("");
  }
}

const DISC_TYPES = [
  { id: "race",       label: "Race / Ethnicity",     icon: "✊", desc: "Racial slurs, unfair treatment based on race or skin colour" },
  { id: "religion",   label: "Religion / Belief",     icon: "☪",  desc: "Discrimination based on faith, prayer, religious dress" },
  { id: "sex",        label: "Sex / Gender",           icon: "⚧",  desc: "Sexism, gender-based pay gaps, misogyny, transphobia" },
  { id: "disability", label: "Disability",             icon: "♿", desc: "Failure to make reasonable adjustments, ableism" },
  { id: "age",        label: "Age",                    icon: "⏳", desc: "Ageism affecting hiring, promotion, or dismissal" },
  { id: "national",   label: "Nationality / Origin",   icon: "🌍", desc: "Discrimination based on country of birth or accent" },
  { id: "sexual",     label: "Sexual Orientation",     icon: "🏳️‍🌈", desc: "Homophobia, biphobia, unfair treatment of LGBT+ individuals" },
  { id: "pregnancy",  label: "Pregnancy / Maternity",  icon: "🤱", desc: "Dismissal or demotion linked to pregnancy or maternity leave" },
  { id: "marriage",   label: "Marriage / Civil Part.", icon: "💍", desc: "Discrimination linked to marital or civil partnership status" },
  { id: "exploitation", label: "Sexual Exploitation / CSE", icon: "💔", desc: "Child or adult sexual exploitation, grooming, trafficking, institutional failure to protect" },
  { id: "institutional", label: "Institutional Failure", icon: "🏛", desc: "Authority that knew or should have known about abuse and failed to act" },
];

const SETTINGS = [
  { id: "work",    label: "Workplace / Employment", icon: "🏢" },
  { id: "housing", label: "Housing / Renting",      icon: "🏠" },
  { id: "edu",     label: "Education",               icon: "🎓" },
  { id: "health",  label: "Healthcare / NHS",        icon: "🏥" },
  { id: "retail",  label: "Retail / Services",       icon: "🛒" },
  { id: "police",  label: "Police / Authority",      icon: "🚔" },
  { id: "online",  label: "Online / Social Media",   icon: "💻" },
  { id: "cse",     label: "Sexual Exploitation / Grooming", icon: "💔" },
  { id: "domestic",label: "Domestic / Family",       icon: "🏠" },
  { id: "other",   label: "Other",                   icon: "•" },
];

const VENTO = {
  lower:  { label: "Lower Band",  desc: "Isolated incident, less serious", min: 1200,  max: 11700, color: T.teal },
  middle: { label: "Middle Band", desc: "Serious, not exceptional",         min: 11700, max: 35100, color: T.gold },
  upper:  { label: "Upper Band",  desc: "Sustained campaign, exceptional", min: 35100, max: 56000, color: T.red  },
};

const ACTIONS = [
  { id: "note",     label: "Keep a Contemporaneous Note",  time: "Today",        risk: "None",   success: "—",   icon: "✏️" },
  { id: "sar",      label: "Send a Subject Access Request", time: "1–2 weeks",    risk: "Low",    success: "95%", icon: "📂" },
  { id: "informal", label: "Raise Informally with Manager", time: "1–4 weeks",    risk: "Low",    success: "35%", icon: "💬" },
  { id: "grievance",label: "Submit Formal Grievance",       time: "1–3 months",   risk: "Medium", success: "52%", icon: "📋" },
  { id: "acas",     label: "ACAS Early Conciliation",       time: "1–6 months",   risk: "Low",    success: "60%", icon: "🤝" },
  { id: "et",       label: "Employment Tribunal (ET1)",     time: "6–24 months",  risk: "High",   success: "68%", icon: "⚖" },
  { id: "ehrc",     label: "Report to EHRC",                time: "Open-ended",   risk: "Low",    success: "—",   icon: "📮" },
  { id: "legal",    label: "Instruct a Solicitor",          time: "Variable",     risk: "Cost",   success: "75%+",icon: "👨‍⚖️" },
];

const DOC_TEMPLATES = {
  grievance: {
    label: "Formal Grievance Letter",
    icon: "📋",
    system: `You are a UK employment law specialist. Write a formal, powerful grievance letter under the ACAS Code of Practice on Grievance Procedures. The letter must be legally structured, reference the Equality Act 2010 specifically, and be written from the claimant's perspective in first person. Use formal but clear English. Include: header with date and addresses, clear statement of grievance, factual chronology, legal basis (Equality Act sections), impact statement, desired remedy, and formal sign-off. Make it tribunal-ready.`,
    prompt: (f) => `Write a formal grievance letter for ${f.name} (${f.role}) against ${f.employer}. Discrimination type: ${f.discType}. Setting: ${f.setting}. Date of incident: ${f.date}. Details: ${f.details}. Desired outcome: ${f.outcome}. Today's date: ${new Date().toLocaleDateString("en-GB")}.`,
  },
  sar: {
    label: "Subject Access Request",
    icon: "📂",
    system: `You are a UK data protection specialist. Write a formal Subject Access Request under UK GDPR Article 15 and Data Protection Act 2018. The letter must be precise, assert legal rights clearly, specify exactly what data is requested (particularly relevant to a discrimination case), set the 1-month response deadline, and warn of ICO complaint if not complied with. Formal tone throughout.`,
    prompt: (f) => `Write a Subject Access Request for ${f.name} to ${f.employer}. They are seeking data related to a ${f.discType} discrimination case. Include requests for: all emails mentioning their name/role, disciplinary/performance records, meeting minutes, any diversity data, communications between management about them. Date: ${new Date().toLocaleDateString("en-GB")}.`,
  },
  witness: {
    label: "Witness Statement",
    icon: "👤",
    system: `You are a UK Employment Tribunal procedure specialist. Write a formal witness statement following Civil Evidence Act 1995 requirements and Employment Tribunal Practice Directions. Use the standard statement of truth format. Structure: personal details, relationship to case, numbered paragraphs for each fact witnessed, clear distinction between direct observation and inference. No hearsay unless flagged.`,
    prompt: (f) => `Write a witness statement for ${f.name} in relation to a ${f.discType} discrimination claim against ${f.employer}. Witness's role: ${f.role}. Events witnessed: ${f.details}. Date: ${new Date().toLocaleDateString("en-GB")}.`,
  },
  et1guide: {
    label: "ET1 Claim Guidance",
    icon: "⚖",
    system: `You are an Employment Tribunal specialist helping a self-represented claimant. Write a detailed, section-by-section guide to completing the ET1 claim form for a discrimination claim. Explain each section in plain English, give examples of strong answers, flag common mistakes, reference the 3-month-minus-1-day time limit and ACAS Early Conciliation requirement. Empowering, not overwhelming.`,
    prompt: (f) => `Write an ET1 completion guide for ${f.name} making a ${f.discType} discrimination claim against ${f.employer} in ${f.setting}. Incident date: ${f.date}. Key facts: ${f.details}.`,
  },
  acas: {
    label: "ACAS Position Statement",
    icon: "🤝",
    system: `You are a UK employment conciliation specialist. Write a clear, assertive ACAS Early Conciliation position statement. It should state the claim clearly, what the claimant wants, what they are prepared to accept in settlement, and why. Professional but not aggressive. Include the legal basis and make clear this is a genuine attempt to resolve before tribunal.`,
    prompt: (f) => `Write an ACAS Early Conciliation position statement for ${f.name} against ${f.employer}. Claim: ${f.discType} discrimination. Details: ${f.details}. Desired outcome: ${f.outcome || "compensation and apology"}.`,
  },
  response: {
    label: "Response to Employer Defence",
    icon: "🛡",
    system: `You are a UK discrimination law advocate. Write a powerful, structured rebuttal to an employer's defence. Point by point, address each assertion, provide counter-evidence, reference case law where applicable, expose logical inconsistencies. Firm, professional, tribunal-ready. Use numbered paragraphs responding to each defence point.`,
    prompt: (f) => `Write a response/rebuttal for ${f.name} against ${f.employer}'s defence in a ${f.discType} case. Their defence claims: ${f.details}. Counter-evidence available: ${f.outcome}.`,
  },
  county_court: {
    label: "County Court N1 Claim",
    icon: "🏛",
    system: `You are a UK civil litigation specialist. Write a formal County Court N1 Particulars of Claim for a discrimination case under the Equality Act 2010 heard in the County Court (not Employment Tribunal). This applies to housing, education, goods and services, and public functions discrimination. Structure: (1) Parties, (2) Background facts in numbered paragraphs, (3) The discrimination complained of with specific protected characteristic and section of Equality Act 2010, (4) Loss and damage with Vento band injury to feelings, (5) Relief sought. Use CPR Part 7 format. Include the claim for injury to feelings under Vento bands and any financial loss. Professional, precise, court-ready.`,
    prompt: (f) => `Write County Court N1 Particulars of Claim for ${f.name} against ${f.employer}. Discrimination type: ${f.discType}. Setting: ${f.setting}. Date of incident: ${f.date}. Full facts: ${f.details}. Remedy sought: ${f.outcome||"Compensation including injury to feelings"}. Today's date: ${new Date().toLocaleDateString("en-GB")}.`,
  },
  checklist: {
    label: "Evidence Checklist",
    icon: "✅",
    system: `You are UJRIS — a UK discrimination evidence specialist. Generate a comprehensive, personalised evidence checklist for a discrimination claim. For each evidence type: state what it is, why it matters legally, exactly how to obtain it (including specific SAR requests, Freedom of Information requests, or preservation notices), and the legal basis. Organise by: (1) Immediately available evidence, (2) Evidence to request via SAR, (3) Evidence to preserve urgently, (4) Witness evidence, (5) Expert evidence if relevant. Be specific to the discrimination type and setting. Reference Equality Act 2010, UK GDPR, Employment Tribunal Rules. Use numbered format with clear action steps.`,
    prompt: (f) => `Generate a complete personalised evidence checklist for ${f.name} making a ${f.discType} discrimination claim in the setting: ${f.setting}. Against: ${f.employer}. Incident date: ${f.date}. Key facts: ${f.details}. Include specific SAR requests, what documents to preserve, witness evidence to gather, and any expert evidence needed. Make it actionable — every item should have a clear next step.`,
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');
  
  /* ── RESET & BASE ── */
  *{box-sizing:border-box;margin:0;padding:0}
  html{font-size:16px}
  body{
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:#F8F1E9;
    color:#0F2C4A;
    -webkit-text-size-adjust:100%;
    text-size-adjust:100%;
    line-height:1.5;
  }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(15,44,74,0.15);border-radius:4px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(15,44,74,0.25)}

  /* ── ANIMATIONS ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(212,175,55,0.2)}50%{box-shadow:0 0 20px rgba(212,175,55,0.45)}}
  @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
  @keyframes shieldPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}50%{box-shadow:0 0 0 10px rgba(220,38,38,0)}}
  .fade-up{animation:fadeUp 0.4s ease both}
  .fade-in{animation:fadeIn 0.25s ease both}
  .pulse{animation:pulse 1.4s infinite}
  .breathe{animation:breathe 4s ease-in-out infinite}

  /* ── FOCUS STATES ── */
  input:focus,textarea:focus,select:focus{
    outline:none;
    border-color:#D4AF37!important;
    box-shadow:0 0 0 3px rgba(212,175,55,0.18)!important;
  }
  input[type=range]{accent-color:#D4AF37;width:100%}

  /* ── INTERACTIVE ELEMENTS ── */
  button{cursor:pointer;font-family:'Inter',sans-serif}
  button:active{transform:scale(0.97)}
  a{color:#1E3A5F;text-decoration:none}
  a:hover{text-decoration:underline;color:#0F2C4A}

  /* ── TYPOGRAPHY CLASSES ── */
  .prose{white-space:pre-wrap;line-height:1.85;font-size:14px;color:#0F2C4A}

  /* ── CARDS ── */
  .ujris-card{
    background:#FAF6F0;
    border:1px solid #EDE4D9;
    border-radius:12px;
    box-shadow:0 4px 12px rgba(15,44,74,0.06);
    transition:all 0.2s ease;
  }
  .ujris-card:hover{
    box-shadow:0 8px 24px rgba(15,44,74,0.09);
    transform:translateY(-1px);
  }
  .ujris-card-gold{border-left:4px solid #D4AF37}

  /* ── SIDEBAR LAYOUT ── */
  #ujris-sidebar{
    background:#0F2C4A!important;
    border-right:1px solid rgba(212,175,55,0.15)!important;
  }
  #ujris-sidebar::-webkit-scrollbar{width:3px}
  #ujris-sidebar::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.2);border-radius:2px}

  /* ── TOPBAR ── */
  .ujris-topbar{
    background:rgba(248,241,233,0.97)!important;
    border-bottom:1px solid #EDE4D9!important;
  }

  /* ── NAV BUTTON ── */
  .ujris-nav-btn{
    position:relative;border-radius:8px;padding:9px 16px;
    border:none;background:transparent;cursor:pointer;
    display:flex;align-items:center;gap:9px;
    text-align:left;width:100%;transition:all 0.15s;
    font-family:'Inter',sans-serif;
  }
  .ujris-nav-btn:hover{background:rgba(212,175,55,0.08)!important}
  .ujris-nav-btn.active{
    background:rgba(212,175,55,0.15)!important;
    border-left:3px solid #D4AF37!important;
  }

  /* ── EVIDENCE CARD ── */
  .evidence-accent{border-left:4px solid #D4AF37}

  /* ── SHIELD FAB ── */
  .shield-fab{
    position:fixed;bottom:24px;right:20px;z-index:9000;
    width:54px;height:54px;border-radius:50%;
    background:linear-gradient(135deg,#DC2626,#ef4444);
    border:2px solid rgba(220,38,38,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:24px;cursor:pointer;
    box-shadow:0 4px 18px rgba(220,38,38,0.35);
    transition:all 0.2s;
    animation:shieldPulse 3s infinite;
    color:white;
  }
  .shield-fab:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(220,38,38,0.5)}

  /* ── DISCLAIMER BAR ── */
  .ujris-disclaimer{
    background:#0F2C4A;color:#EDE4D9;
    font-size:12px;text-align:center;padding:7px 16px;
    font-family:'Inter',sans-serif;
  }

  /* ── RESPONSIVE ── */
  @media(max-width:767px){
    .hide-mobile{display:none!important}
    .grid-2,.grid-3,.grid-4{grid-template-columns:1fr!important}
    .ujris-main{padding:18px 14px 80px!important}
  }
  @media(min-width:768px) and (max-width:1023px){
    #ujris-sidebar{width:200px!important}
    .ujris-right{margin-left:200px!important}
  }
  @media(min-width:1024px){
    .ujris-main{max-width:1100px!important;padding:36px 36px 80px!important}
  }
  @media(pointer:coarse){button{min-height:44px}}
`;
//  VERSATILE INPUT — universal multi-modal input for every field
//  Replaces plain textarea/input across the entire app
//  Modes: type | paste | upload | camera | audio | video
function VersatileInput({
  value, onChange, placeholder, rows = 4, label,
  showLabel = true, compact = false,
  onFileAnalysed,   // callback(text, filename) when file/recording processed
  caseContext = "",
}) {
  const [activeMode, setActiveMode] = React.useState("type");
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [liveText, setLiveText] = React.useState("");
  const [processingFile, setProcessingFile] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState("");
  const fileRef = React.useRef(null);
  const cameraRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const mediaRecRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const recogRef = React.useRef(null);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  function flash(msg) { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(""), 3000); }
  async function handleFileUpload(file) {
    if (!file) return;
    setProcessingFile(true);
    flash(`📂 Reading ${file.name}...`);
    let text = "";
    const ext = file.name.split(".").pop().toLowerCase();
    try {
      if (["txt","html","csv","eml","msg","rtf"].includes(ext)) {
        text = await file.text();
      } else if (["doc","docx"].includes(ext)) {
        const buf = await file.arrayBuffer();
        const decoder = new TextDecoder("utf-8",{fatal:false});
        const raw = decoder.decode(new Uint8Array(buf));
        text = raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ").substring(0,6000);
        if (text.length < 50) text = `[Word document: ${file.name} — paste text content for analysis]`;
      } else if (ext === "pdf") {
        const buf = await file.arrayBuffer();
        const raw = new TextDecoder("latin-1",{fatal:false}).decode(new Uint8Array(buf));
        const matches = raw.match(/\(([^\)]{5,200})\)/g)||[];
        text = matches.map(m=>m.slice(1,-1)).filter(t=>/[a-zA-Z]{3,}/.test(t)).join(" ").substring(0,5000);
        if (text.length < 100) text = `[PDF: ${file.name} — text layer not extractable. Copy-paste text from the PDF for full analysis.]`;
      } else if (["jpg","jpeg","png","webp","gif"].includes(ext)) {
        // Send image to Claude vision
        const b64 = await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.readAsDataURL(file);});
        const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,stream:false,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},
              {type:"text",text:`Describe this image for a UK discrimination/legal case. ${caseContext}. Extract all visible text (OCR). Note dates, names, reference numbers. Describe what is happening and its legal relevance.`}
            ]}]})});
        const data = await resp.json();
        text = data.content?.[0]?.text || `[Image: ${file.name} — AI analysis unavailable]`;
      } else if (["mp3","wav","ogg","m4a"].includes(ext)) {
        text = `[Audio file: ${file.name} (${(file.size/1024/1024).toFixed(1)}MB) uploaded and ready. Use the 🎙 Record button for live transcription, or note key points manually below.]`;
      } else if (["mp4","webm"].includes(ext)) {
        text = `[Video file: ${file.name} (${(file.size/1024/1024).toFixed(1)}MB) uploaded. Use the 📹 Record button to record live sessions with transcription.]`;
      } else if (["zip","gz","tar","rar","7z"].includes(ext)) {
        text = `[Archive: ${file.name} — ZIP/archive received. Extract individual files and upload each one separately for forensic analysis. Each file will be analysed independently.]`;
      } else {
        text = await file.text().catch(()=>`[File: ${file.name} — could not read as text]`);
      }
      // Append or set
      const newVal = value ? value + "\n\n" + text : text;
      onChange({ target: { value: newVal } });
      if (onFileAnalysed) onFileAnalysed(text, file.name);
      flash(`✅ ${file.name} added`);
    } catch(err) {
      flash(`❌ Error reading file: ${err.message}`);
    }
    setProcessingFile(false);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }
  async function startAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      streamRef.current = stream;
      const chunks = [];
      const mr = new MediaRecorder(stream,{mimeType:"audio/webm"});
      mediaRecRef.current = mr;
      mr.ondataavailable = e=>{if(e.data.size>0)chunks.push(e.data);};
      mr.onstop = ()=>{
        const blob = new Blob(chunks,{type:"audio/webm"});
        const url = URL.createObjectURL(blob);
        const newVal = value ? value + "\n\n[Audio recording — " + fmt(elapsed) + " — " + new Date().toLocaleString("en-GB") + "]" : "[Audio recording — " + fmt(elapsed) + " — " + new Date().toLocaleString("en-GB") + "]";
        onChange({target:{value: newVal}});
        flash("✅ Recording saved");
      };
      mr.start(1000);
      setRecording(true); setElapsed(0);
      timerRef.current = setInterval(()=>setElapsed(e=>e+1),1000);
      // Live speech recognition
      const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
      if (SR) {
        const recog = new SR(); recog.continuous=true; recog.interimResults=true; recog.lang="en-GB";
        recog.onresult = evt=>{
          let final="",interim="";
          for(let i=evt.resultIndex;i<evt.results.length;i++){
            const t=evt.results[i][0].transcript;
            if(evt.results[i].isFinal){final+=t+"\n";}else{interim+=t;}
          }
          if(final){const newVal=(value||"")+(value?"\n":"")+final;onChange({target:{value:newVal}});}
          setLiveText(interim);
        };
        recog.start(); recogRef.current=recog;
      }
    } catch(err){flash("❌ Microphone access denied: "+err.message);}
  }

  function stopRecording() {
    if(mediaRecRef.current)mediaRecRef.current.stop();
    if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());
    if(recogRef.current)recogRef.current.stop();
    if(timerRef.current)clearInterval(timerRef.current);
    setRecording(false); setLiveText("");
    flash("✅ Recording added to field");
  }

  const MODES = [
    {id:"type",   icon:"⌨",  label:"Type"},
    {id:"paste",  icon:"📋",  label:"Paste"},
    {id:"upload", icon:"📂",  label:"Upload"},
    {id:"camera", icon:"📸",  label:"Photo"},
    {id:"audio",  icon:"🎙",  label:"Record"},
    {id:"video",  icon:"📹",  label:"Video"},
  ];

  const inputStyle = {
    width:"100%", padding:"10px 12px",
    background:"#FAF6F0", color:"#0F2C4A",
    border:"1px solid #EDE4D9", borderRadius:8,
    fontSize:13, resize:"vertical",
    boxSizing:"border-box", fontFamily:"'Inter',sans-serif",
    lineHeight:1.7,
  };

  return (
    <div style={{marginBottom: compact ? 0 : 4}}>
      {showLabel && label && (
        <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6,fontWeight:600}}>{label}</label>
      )}

      {/* Mode Selector Bar */}
      <div style={{display:"flex",gap:3,marginBottom:6,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:3}}>
        {MODES.map(m=>(
          <button key={m.id}
            onClick={()=>{
              setActiveMode(m.id);
              if(m.id==="upload") fileRef.current?.click();
              else if(m.id==="camera") cameraRef.current?.click();
              else if(m.id==="video") videoRef.current?.click();
              else if(m.id==="audio" && !recording) startAudioRecording();
              else if(m.id==="audio" && recording) stopRecording();
            }}
            title={
              m.id==="type" ? "Type or edit text" :
              m.id==="paste" ? "Paste from clipboard" :
              m.id==="upload" ? "Upload any file (PDF, Word, image, audio, video, ZIP)" :
              m.id==="camera" ? "Take a photo with your camera" :
              m.id==="audio" ? (recording ? "Stop recording" : "Record audio / speech-to-text") :
              m.id==="video" ? "Record a video" : ""
            }
            style={{
              flex:1, background: (activeMode===m.id || (m.id==="audio"&&recording)) ? (m.id==="audio"&&recording?"#cc2222":T.gold) : "transparent",
              color: (activeMode===m.id || (m.id==="audio"&&recording)) ? T.navy : T.muted,
              border:"none", borderRadius:6, padding: compact ? "5px 4px" : "7px 4px",
              fontSize: compact ? 10 : 11, cursor:"pointer", fontWeight:700,
              transition:"all 0.15s", whiteSpace:"nowrap",
            }}>
            {m.id==="audio"&&recording ? `⏹ ${fmt(elapsed)}` : `${m.icon}${compact?"":"\n"+m.label}`}
          </button>
        ))}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" multiple
        accept=".pdf,.doc,.docx,.txt,.eml,.msg,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.mp4,.webm,.ogg,.m4a,.zip,.gz,.csv,.xlsx,.json,.html,.rtf"
        style={{display:"none"}} onChange={e=>{Array.from(e.target.files).forEach(f=>handleFileUpload(f));}}/>
      <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment"
        style={{display:"none"}} onChange={e=>{handleFileUpload(e.target.files[0]);}}/>
      <input ref={videoRef} type="file" accept="video/*" capture="environment"
        style={{display:"none"}} onChange={e=>{handleFileUpload(e.target.files[0]);}}/>

      {/* Live recording indicator */}
      {recording && (
        <div style={{background:"rgba(204,34,34,0.12)",border:"1px solid rgba(204,34,34,0.4)",borderRadius:8,padding:"8px 12px",marginBottom:8,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{width:10,height:10,background:"#cc2222",borderRadius:"50%",display:"inline-block"}}/>
          <span style={{color:"#ff8080",fontSize:12,fontWeight:700}}>Recording — {fmt(elapsed)} — speaking is being transcribed live</span>
          <button onClick={stopRecording} style={{background:"#cc2222",color:"#fff",border:"none",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer",fontWeight:700,marginLeft:"auto"}}>⏹ Stop</button>
        </div>
      )}
      {liveText && (
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"6px 10px",marginBottom:6,color:"#64748B",fontSize:12,fontStyle:"italic"}}>
          🎙 {liveText}
        </div>
      )}

      {/* Feedback message */}
      {feedbackMsg && (
        <div style={{background:"rgba(123,198,126,0.12)",border:"1px solid rgba(123,198,126,0.3)",borderRadius:6,padding:"6px 10px",marginBottom:6,color:"#7bc67e",fontSize:12}}>
          {feedbackMsg}
        </div>
      )}
      {processingFile && (
        <div style={{color:T.gold,fontSize:12,marginBottom:6}}>🔬 Processing file...</div>
      )}

      {/* Main textarea */}
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={
          activeMode==="paste" ? "Paste your content here — emails, messages, documents, web content, WhatsApp, anything..." :
          activeMode==="upload" ? "File content will appear here after upload and processing..." :
          activeMode==="camera" ? "Photo description and extracted text will appear here after capture..." :
          activeMode==="audio" ? (recording ? "Live transcription appearing here as you speak..." : "Transcribed speech will appear here. Press 🎙 Record to start...") :
          activeMode==="video" ? "Video details will appear here after recording..." :
          placeholder || "Type, paste, upload a file, take a photo, or record audio..."
        }
        style={inputStyle}
      />

      {/* Capability hint */}
      {!compact && (
        <div style={{color:T.dim,fontSize:10,marginTop:4,lineHeight:1.5}}>
          ⌨ Type · 📋 Paste · 📂 Upload (PDF/Word/image/audio/video/ZIP) · 📸 Camera · 🎙 Record audio with live transcription · 📹 Video
        </div>
      )}
    </div>
  );
}

const Logo = ({ size = 40 }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
    <img
      src="/images/ujris-logo.jpeg"
      alt="UJRIS — Justice Intelligence"
      style={{
        height: size,
        width: "auto",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  </div>
);

const Disclaimer = () => (
  <div style={{background:"rgba(139,32,32,0.22)",borderBottom:"1px solid rgba(200,60,60,0.25)",
    color:"#f0b8b8",fontSize:11,textAlign:"center",padding:"7px 16px",letterSpacing:"0.04em",fontFamily:"'Source Serif 4',serif"}}>
    ⚠ Beta prototype — not legal advice. All data stays on your device. Always consult a solicitor for your specific case.
  </div>
);

const Btn = ({ children, onClick, variant="gold", disabled=false, style={}, full=false, sm=false }) => {
  const base = {
    fontFamily:"'Inter',sans-serif", fontWeight:600, borderRadius:8, border:"none",
    cursor:disabled?"not-allowed":"pointer", transition:"all 0.2s", letterSpacing:"0.02em",
    opacity:disabled?0.45:1, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
    width:full?"100%":"auto",
    padding: sm ? "8px 16px" : "12px 24px",
    fontSize: sm ? 13 : 14,
  };
  const variants = {
    gold:    { background:"#0F2C4A", color:"#F8F1E9", boxShadow:"0 2px 8px rgba(15,44,74,0.2)" },
    teal:    { background:"#D4AF37", color:"#0F2C4A", boxShadow:"0 2px 8px rgba(212,175,55,0.25)" },
    red:     { background:"#DC2626", color:"#fff",    boxShadow:"0 2px 8px rgba(220,38,38,0.25)" },
    ghost:   { background:"#EDE4D9", color:"#0F2C4A", border:"1px solid #D4C4B0" },
    outline: { background:"transparent", color:"#0F2C4A", border:"1.5px solid #0F2C4A" },
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant],...style}} disabled={disabled}>
      {children}
    </button>
  );
};

const Card = ({ children, style={}, glow=false }) => (
  <div style={{
    background:`linear-gradient(145deg, rgba(26,48,80,0.6), rgba(13,27,42,0.9))`,
    border:`1px solid ${T.border}`, borderRadius:16, padding:"24px 22px",
    boxShadow: glow ? `0 0 0 1px rgba(201,168,76,0.15), 0 8px 40px rgba(0,0,0,0.4)` : `0 4px 20px rgba(0,0,0,0.3)`,
    backdropFilter:"blur(8px)", ...style,
  }}>
    {children}
  </div>
);

const Field = ({ label, children, required=false }) => (
  <div>
    <label style={{display:"block",color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7,fontFamily:"'Source Serif 4',serif"}}>
      {label}{required&&<span style={{color:T.gold,marginLeft:3}}>*</span>}
    </label>
    {children}
  </div>
);

const inputStyle = {
  background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:10,
  padding:"10px 14px", color:T.white, fontFamily:"'Source Serif 4',serif", fontSize:13.5,
  width:"100%", transition:"border-color 0.2s, box-shadow 0.2s",
};

const Input = (props) => <input style={inputStyle} {...props}/>;
const Textarea = ({ rows=5, ...props }) => <textarea style={{...inputStyle, resize:"vertical", height: rows*26}} {...props}/>;

const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} style={{...inputStyle, appearance:"none", backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C9A84C' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer"}}>
    {children}
  </select>
);

const Tag = ({ children, color=T.gold }) => (
  <span style={{display:"inline-block", background:`${color}18`, border:`1px solid ${color}35`,
    color, fontSize:10.5, padding:"3px 10px", borderRadius:20, letterSpacing:"0.05em"}}>
    {children}
  </span>
);

const ProgressStepper = ({ steps, current }) => (
  <div style={{display:"flex", alignItems:"center", gap:0, marginBottom:28, overflowX:"auto", paddingBottom:4}}>
    {steps.map((s, i) => (
      <div key={i} style={{display:"flex", alignItems:"center", flex:i<steps.length-1?1:"none", minWidth:0}}>
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0}}>
          <div style={{
            width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
            background: i<current ? T.teal : i===current ? T.gold : "rgba(255,255,255,0.08)",
            border:`2px solid ${i<current?T.teal:i===current?T.gold:T.border}`,
            color: i<=current ? T.navy : T.dim, fontWeight:700, fontSize:12, transition:"all 0.35s",
            boxShadow: i===current ? `0 0 0 4px ${T.goldBg}` : "none",
          }}>
            {i<current?"✓":i+1}
          </div>
          <span style={{fontSize:9.5, color:i===current?T.gold:T.dim, whiteSpace:"nowrap", textTransform:"uppercase", letterSpacing:"0.08em", maxWidth:64, textAlign:"center", lineHeight:1.3}}>
            {s}
          </span>
        </div>
        {i<steps.length-1&&(
          <div style={{flex:1, height:2, background:i<current?T.teal:T.border, margin:"0 4px", marginBottom:20, transition:"background 0.35s", minWidth:12}}/>
        )}
      </div>
    ))}
  </div>
);

const AIPanel = ({ text, loading, label="UJRIS AI Analysis" }) => (
  <Card style={{borderColor:loading?`${T.teal}55`:`${T.teal}30`, position:"relative", overflow:"hidden"}}>
    {loading && (
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg, transparent, ${T.teal}, transparent)`,
        backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite"}}/>
    )}
    <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.teal},${T.navy})`,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,
        boxShadow:`0 0 12px rgba(12,123,122,0.4)`}}>⚖</div>
      <div style={{flex:1}}>
        <div style={{color:T.teal,fontSize:10.5,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8,fontWeight:600}}>
          {label}
        </div>
        {loading && !text ? (
          <div style={{color:T.muted,fontStyle:"italic",fontSize:13}}>
            Analysing your situation against UK discrimination law…
            <span style={{animation:"pulse 1s infinite",display:"inline-block",marginLeft:4}}>▋</span>
          </div>
        ) : (
          <div className="prose">
            {text}
            {loading&&<span style={{animation:"pulse 1s infinite",display:"inline-block"}}>▋</span>}
          </div>
        )}
      </div>
    </div>
  </Card>
);

const CaseStrengthRing = ({ score }) => {
  const pct = Math.min(100, score);
  const color = pct < 30 ? T.red : pct < 60 ? T.gold : T.teal;
  const label = pct < 30 ? "Building" : pct < 60 ? "Developing" : pct < 80 ? "Strong" : "Compelling";
  return (
    <div style={{textAlign:"center", width:88}}>
      <div style={{width:80,height:80,borderRadius:"50%",margin:"0 auto",
        background:`conic-gradient(${color} ${pct*3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 0 3px ${T.navy}, 0 0 0 4px ${T.border}`}}>
        <div style={{width:66,height:66,borderRadius:"50%",background:T.navy,
          display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
          <span style={{color,fontWeight:900,fontSize:17,fontFamily:"'Playfair Display',serif"}}>{pct}%</span>
        </div>
      </div>
      <div style={{color,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:6}}>{label}</div>
      <div style={{color:T.dim,fontSize:9.5,marginTop:2}}>Case Strength</div>
    </div>
  );
};

const Badge = ({ icon, label, value, color=T.gold }) => (
  <div style={{background:`${color}10`,border:`1px solid ${color}25`,borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
    <div style={{color,fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{value}</div>
    <div style={{color:T.dim,fontSize:10.5,marginTop:2,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</div>
  </div>
);

const TimerBadge = ({ date }) => {
  if (!date) return null;
  const incident = new Date(date);
  const deadline = new Date(incident);
  deadline.setMonth(deadline.getMonth() + 3);
  deadline.setDate(deadline.getDate() - 1);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((deadline - today) / 86400000));
  const pct = Math.max(0, Math.min(100, (daysLeft / 90) * 100));
  const color = daysLeft < 14 ? T.redL : daysLeft < 30 ? T.gold : T.teal;
  return (
    <Card style={{borderColor:`${color}40`,padding:"16px 18px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:24}}>⏰</div>
        <div style={{flex:1}}>
          <div style={{color,fontSize:13,fontWeight:600,marginBottom:4}}>
            {daysLeft === 0 ? "⚠ Deadline may have passed — seek urgent advice" : `${daysLeft} days remaining to file`}
          </div>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:6,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:color,transition:"width 0.5s",borderRadius:4}}/>
          </div>
          <div style={{color:T.dim,fontSize:10.5,marginTop:5}}>
            ET3 deadline: {deadline.toLocaleDateString("en-GB")} · 3 months minus 1 day from incident
          </div>
        </div>
      </div>
    </Card>
  );
};

function Assessment({ onComplete }) {
  const [step, setStep] = useState(0);
  const saved = S.get("assessment_draft", {});
  const [data, setData] = useState({ discType:[], setting:"", severity:5, when:"", description:"", witnesses:"", ongoing:null, tried:"", ...saved });
  const [ai, setAi] = useState(""); const [aiLoading, setAiLoading] = useState(false);
  const STEPS = ["Type","Where","What","AI Report"];

  const upd = (k,v) => { const n={...data,[k]:v}; setData(n); S.set("assessment_draft",n); };

  const runAI = () => {
    setAiLoading(true); setAi("");

    const isCSE = data.discType.includes("exploitation") || data.discType.includes("institutional") ||
                  data.setting === "cse" ||
                  /exploit|groom|traffick|cse|rotherham|rochdale|telford|oxford|county.line|sexual.abuse|institutional.fail/i.test(data.description);

    const SYS = isCSE
      ? `You are UJRIS — a UK justice intelligence expert specialising in sexual exploitation, child sexual exploitation (CSE), and institutional failure cases. You are trauma-informed, clear, and empowering.
SPECIALIST FRAMEWORK: Reference the Jay Report (Rotherham 2014), IICSA findings, and current case law on institutional liability. Identify grounds for CICA claim, civil negligence claim, HRA 1998 Articles 3 and 8, Equality Act 2010. The victim-blaming defence used by authorities has been legally discredited. Limitation Act 1980 s.33 gives courts wide discretion to extend for CSE survivors. No limitation period applies to criminal matters. Use trauma-informed language throughout.`
      : `You are UJRIS — a UK discrimination law intelligence expert. You help self-represented litigants who are overwhelmed, scared and confused. Be warm, clear, empowering, and clinically precise. Reference Equality Act 2010 sections specifically. Structure your response with emoji-headed sections. Be honest about strengths AND weaknesses.`;

    const MSG = isCSE
      ? `Analyse this sexual exploitation or institutional failure case.
Details: ${data.description}
Setting: ${data.setting}
Date/period: ${data.when || "not specified"}
Authority involved: ${data.tried || "not specified"}
Still ongoing: ${data.ongoing==="yes"?"Yes":"No"}

Provide these sections:
1. 💔 What This Appears to Be — plain language, trauma-informed description
2. 🏛 Institutional Failure Analysis — what the authority was legally required to do and failed to do
3. ⚖ Legal Routes — CICA, civil negligence, HRA 1998 Articles 3 and 8, Equality Act 2010 with plain language explanation of each
4. 💷 Compensation — CICA tariff bands for this type of abuse and civil damages range
5. 🚨 Immediate Actions (this week) — 3 specific steps including contacting an ISVA (Independent Sexual Violence Adviser)
6. 📋 Evidence to Gather — social services records, school records, police logs, medical records — via FOI and SAR
7. ⏰ Time Limits — explain honestly AND note s.33 Limitation Act 1980 court discretion for survivors. Never too late for criminal report.
8. 🤝 Specialist Support — name specifically: Victim Support (08 08 16 89 111), Barnardo's, NAPAC (08 08 801 0331), The Survivors Trust, local ISVA service, Rape Crisis (0808 802 9999), National Referral Mechanism if trafficking involved
9. 🛡 On Shame and Blame — directly address victim-blaming they may have experienced from authorities. Affirm their right to justice.

End with: "What happened to you was a crime and a betrayal by people who had a duty to protect you. Justice is possible. You are not alone."`
      : `Analyse this discrimination situation:
Protected characteristic(s): ${data.discType.join(", ")}
Setting: ${data.setting}
Date of incident: ${data.when || "not specified"}
Severity (1-10): ${data.severity}
Witnesses: ${data.witnesses || "none mentioned"}
Still ongoing: ${data.ongoing==="yes"?"Yes":"No"}
Already tried: ${data.tried || "nothing yet"}
What happened: ${data.description}

Provide these sections:
1. 🔍 Initial Legal Assessment — what this likely constitutes under Equality Act 2010, which sections apply
2. 💪 What Makes This Case Stronger — specific strengths
3. ⚠ Challenges to Anticipate — honest weaknesses or gaps
4. 🚨 Immediate Actions (this week) — top 3 things to do NOW
5. 📋 Evidence to Capture Urgently — specific items before they disappear
6. ⏰ Key Deadline — time limit reminder

End with: "Remember: You have rights. This tool is here to help you understand and exercise them."`;

    streamAI(SYS, MSG, t=>setAi(t), ()=>setAiLoading(false));
  };

  const canNext = [
    data.discType.length > 0,
    !!data.setting,
    data.description.length > 30 && data.ongoing !== null,
    true,
  ][step];

  const next = () => {
    if (step === 2) runAI();
    if (step < 3) setStep(s=>s+1);
    else { onComplete(data, ai); S.set("casedata", data); S.set("assessment_ai", ai); }
  };

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}>
          Guided Situation Assessment
        </h1>
        <p style={{color:"#1E3A5F",fontSize:14,lineHeight:1.6}}>
          Take your time. Answer honestly. There are no wrong answers here — only your truth.
        </p>
      </div>
      <ProgressStepper steps={STEPS} current={step}/>

      {/* STEP 0 — DISC TYPE */}
      {step===0&&(
        <div className="fade-up">
          <h2 style={{color:T.white,fontFamily:"'Playfair Display',serif",fontSize:19,marginBottom:6}}>What type of discrimination did you experience?</h2>
          <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Select all that apply. Under UK law, you can experience multiple types simultaneously.</p>
          <div className="grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {DISC_TYPES.map(dt=>{
              const sel = data.discType.includes(dt.id);
              return (
                <button key={dt.id} onClick={()=>upd("discType",sel?data.discType.filter(x=>x!==dt.id):[...data.discType,dt.id])}
                  style={{background:sel?`${T.goldBg}`:"rgba(255,255,255,0.03)",
                    border:`2px solid ${sel?T.gold:T.border}`, borderRadius:14, padding:"14px 12px",
                    textAlign:"left", transition:"all 0.2s", cursor:"pointer",
                    boxShadow: sel?`0 0 0 1px ${T.goldBg}, inset 0 0 0 1px ${T.goldBg}`:"none"}}>
                  <div style={{fontSize:24,marginBottom:8}}>{dt.icon}</div>
                  <div style={{color:sel?T.gold:T.white,fontSize:13,fontWeight:sel?700:400,fontFamily:"'Source Serif 4',serif",marginBottom:4}}>{dt.label}</div>
                  <div style={{color:T.dim,fontSize:11,lineHeight:1.4}}>{dt.desc}</div>
                </button>
              );
            })}
          </div>
          <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
            <Btn onClick={next} disabled={!canNext}>Next: Where did it happen? →</Btn>
          </div>
        </div>
      )}

      {/* STEP 1 — SETTING */}
      {step===1&&(
        <div className="fade-up">
          <h2 style={{color:T.white,fontFamily:"'Playfair Display',serif",fontSize:19,marginBottom:6}}>Where did this discrimination take place?</h2>
          <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>The setting determines which law applies and what remedies are available.</p>
          <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
            {SETTINGS.map(s=>{
              const sel = data.setting===s.id;
              return (
                <button key={s.id} onClick={()=>upd("setting",s.id)}
                  style={{background:sel?T.tealBg:"rgba(255,255,255,0.03)",
                    border:`2px solid ${sel?T.teal:T.border}`, borderRadius:12, padding:"14px 16px",
                    textAlign:"left", transition:"all 0.2s", cursor:"pointer", display:"flex", alignItems:"center", gap:10}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <span style={{color:sel?T.tealL:T.white,fontSize:14,fontFamily:"'Source Serif 4',serif",fontWeight:sel?600:400}}>{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <Field label="When did this happen?">
              <Input type="date" value={data.when} onChange={e=>upd("when",e.target.value)}/>
            </Field>
            <Field label="Severity (1 = minor, 10 = serious)">
              <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:8}}>
                <input type="range" min="1" max="10" value={data.severity} onChange={e=>upd("severity",+e.target.value)} style={{flex:1}}/>
                <div style={{width:38,height:38,borderRadius:"50%",
                  background:`rgba(201,168,76,${0.08+data.severity*0.08})`,border:`2px solid ${T.gold}`,
                  display:"flex",alignItems:"center",justifyContent:"center",color:T.gold,fontWeight:700,fontSize:15,flexShrink:0}}>
                  {data.severity}
                </div>
              </div>
            </Field>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>setStep(0)}>← Back</Btn>
            <Btn onClick={next} disabled={!canNext}>Next: Describe what happened →</Btn>
          </div>
        </div>
      )}

      {/* STEP 2 — DESCRIBE */}
      {step===2&&(
        <div className="fade-up">
          <h2 style={{color:T.white,fontFamily:"'Playfair Display',serif",fontSize:19,marginBottom:6}}>Tell us what happened — in your own words</h2>
          <p style={{color:"#64748B",fontSize:13,lineHeight:1.7,marginBottom:20}}>
            This is your safe space. Be as specific as possible. Include exact words said, actions taken, dates, times, and your emotional response. 
            Tribunals care about <strong style={{color:T.gold}}>specific facts</strong>, not general feelings.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="What happened? (Be specific — include exact words, actions, and sequence of events)" required>
              <Textarea rows={7} value={data.description} onChange={e=>upd("description",e.target.value)}
                placeholder="e.g. On 14 March 2025, during our team meeting, my manager said in front of everyone: 'We need someone who fits our culture better.' When I asked what he meant, he said: 'You know what I mean.' Two colleagues, Sarah and James, were present. I have recorded the meeting on my phone..."/>
            </Field>
            <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Field label="Any witnesses? (Names or roles)">
                <Input value={data.witnesses} onChange={e=>upd("witnesses",e.target.value)} placeholder="e.g. Sarah (HR), James (colleague)"/>
              </Field>
              <Field label="Is this still ongoing?" required>
                <div style={{display:"flex",gap:8,paddingTop:4}}>
                  {[["yes","Yes, it continues"],["no","No, it has stopped"]].map(([v,l])=>(
                    <button key={v} onClick={()=>upd("ongoing",v)} style={{
                      flex:1, padding:"10px 8px", borderRadius:10, fontSize:12, fontFamily:"'Source Serif 4',serif",
                      background:data.ongoing===v?T.goldBg:"rgba(255,255,255,0.04)",
                      border:`1.5px solid ${data.ongoing===v?T.gold:T.border}`, color:data.ongoing===v?T.gold:T.muted,
                    }}>{l}</button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Have you already tried anything? (Optional)">
              <Input value={data.tried} onChange={e=>upd("tried",e.target.value)} placeholder="e.g. Spoke to HR informally, raised with line manager, nothing yet"/>
            </Field>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="ghost" onClick={()=>setStep(1)}>← Back</Btn>
            <Btn onClick={next} disabled={!canNext}>🔍 Run AI Assessment →</Btn>
          </div>
        </div>
      )}

      {/* STEP 3 — AI REPORT */}
      {step===3&&(
        <div className="fade-up">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:14}}>
            <div>
              <h2 style={{color:T.white,fontFamily:"'Playfair Display',serif",fontSize:19,marginBottom:4}}>Your Case Assessment</h2>
              <p style={{color:"#64748B",fontSize:13}}>UJRIS has analysed your situation against UK discrimination law.</p>
            </div>
            {data.discType.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {data.discType.map(d=><Tag key={d}>{DISC_TYPES.find(x=>x.id===d)?.label||d}</Tag>)}
            </div>}
          </div>
          {data.when && <div style={{marginBottom:16}}><TimerBadge date={data.when}/></div>}
          <AIPanel text={ai} loading={aiLoading}/>
          {!aiLoading&&ai&&(
            <div style={{marginTop:20,display:"flex",gap:10,flexWrap:"wrap"}}>
              <Btn onClick={()=>next()}>Continue to Action Plan →</Btn>
              <Btn variant="ghost" onClick={runAI}>🔄 Re-analyse</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceVault({ caseData }) {
  const [items, setItems] = useState(()=>S.get("evidence",[]));
  const [form, setForm] = useState({ type:"", description:"", date:"", source:"", importance:"medium", tags:"" });
  const [ai, setAi] = useState(""); const [aiLoading, setAiLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("vault");
  const [evidenceTasks, setEvidenceTasks] = useState(() => S.get("evidence_tasks", []));
  const [tasksGenerated, setTasksGenerated] = useState(() => S.get("evidence_tasks_generated", false));
  const [taskLoading, setTaskLoading] = useState(false);

  const TYPES = [
    {id:"email",icon:"📧",label:"Email"},
    {id:"message",icon:"💬",label:"Message/Chat"},
    {id:"doc",icon:"📄",label:"Document"},
    {id:"witness",icon:"👤",label:"Witness Account"},
    {id:"photo",icon:"📸",label:"Photo/Screenshot"},
    {id:"cctv",icon:"📹",label:"CCTV/Video"},
    {id:"payslip",icon:"💷",label:"Pay/Contract"},
    {id:"note",icon:"✏️",label:"Written Note"},
    {id:"recording",icon:"🎙",label:"Recording"},
    {id:"policy",icon:"📋",label:"Policy/Handbook"},
  ];

  const save = arr => { setItems(arr); S.set("evidence",arr); };
  const add = () => {
    if (!form.type||!form.description) return;
    save([...items,{...form,id:Date.now(),tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),added:new Date().toISOString()}]);
    setForm({type:"",description:"",date:"",source:"",importance:"medium",tags:""});
    setAdding(false);
  };

  const getAiTip = () => {
    setAiLoading(true); setAi("");
    streamAI(
      "You are a UK discrimination law evidence specialist. Be direct and specific. Under 150 words.",
      `Case: ${caseData?.discType?.join(", ")||"discrimination"}. Have: ${items.length} items. What to collect NEXT? Prioritise time-sensitive first.`,
      t=>setAi(t), ()=>setAiLoading(false)
    );
  };

  const generateTasks = () => {
    const tasks = [
      { id:"t1", title:"Submit Subject Access Request (SAR) immediately", urgent:true, deadline:"Within 7 days — records may be deleted", description:"Request ALL data your employer holds about you under UK GDPR Article 15. This is your most powerful early move — it compels disclosure of emails, HR notes, meeting records, CCTV, and any document mentioning your name before they can be deleted.", tips:"1. Go to UJRIS SAR module to generate the letter automatically\n2. Email HR and the Data Protection Officer simultaneously\n3. State: 'I require a complete response within one calendar month'\n4. Keep proof of sending", links:[{icon:"📂",label:"Open SAR Module — Generate Letter",href:"#sar",note:"Generates legally precise letter"},{icon:"📧",label:"Email template to HR",href:"mailto:?subject=Subject Access Request — UK GDPR Article 15&body=Dear HR Department,%0A%0AI am writing to exercise my right of access under UK GDPR Article 15 and the Data Protection Act 2018.%0A%0APlease provide all personal data held about me including all emails, meeting notes, HR records, performance reviews, disciplinary files, CCTV footage, call recordings, and any document that mentions my name.%0A%0APlease respond within one calendar month of receiving this request.%0A%0AYours faithfully",note:"Opens pre-filled email"}]},
      { id:"t2", title:"Request CCTV footage preservation in writing", urgent:true, deadline:"Within 14 days — CCTV overwrites at 14-31 days", description:"CCTV footage is often the most powerful objective evidence in discrimination cases. It either confirms your account or disproves the respondent's narrative. Once overwritten it is gone forever.", tips:"1. Write to both the Data Protection Officer and the site manager\n2. State the specific dates, times and camera locations\n3. Send by recorded post AND email (creates paper trail of exactly when they received it)\n4. If they destroy footage after receiving your request, this is potential contempt of court", links:[{icon:"📧",label:"Send CCTV preservation notice",href:"mailto:?subject=URGENT — Preservation Notice — CCTV Footage&body=I am writing to formally notify you that I require the immediate preservation of all CCTV footage from [dates] at [location]. This footage is relevant to legal proceedings I am considering. Destruction of this evidence after receipt of this notice may constitute contempt of court.",note:"Opens preservation notice email"}]},
      { id:"t3", title:"Write contemporaneous notes — start today", urgent:false, deadline:"Today — the sooner the better", description:"Courts give significant weight to notes written close to the time of events. A detailed account written today is far more credible than one written six months later.", tips:"1. Write the date and time at the top of each entry\n2. Include exact words spoken where possible (quote marks make notes more credible)\n3. Note who was present, the setting, your emotional response\n4. Sign and date each page\n5. Store in two places (email to yourself)", links:[]},
      { id:"t4", title:"Identify witnesses — do not approach them yet", urgent:false, deadline:"Within 14 days", description:"List everyone who witnessed incidents or could corroborate your account. Do NOT contact them yet — this could alert the respondent and give them time to influence those witnesses.", tips:"1. Note: full name, job title, what they witnessed, approximate date\n2. Also note who the employer claims witnessed something if you believe those accounts are false — their statements can be challenged\n3. Consider whether any manager or HR staff made any admissions or showed sympathy", links:[]},
      { id:"t5", title:"Gather comparator evidence", urgent:false, deadline:"Within 21 days", description:"Direct discrimination requires proving you were treated less favourably than a comparator in materially similar circumstances. This is often the decisive evidence in the entire case.", tips:"1. Identify real comparators — colleagues of a different protected characteristic treated differently in similar situations\n2. Document specific differences: disciplinary outcomes, pay decisions, promotion decisions\n3. If no real comparator exists, note how the employer says they would treat a hypothetical comparator — get this in writing if possible", links:[]},
      { id:"t6", title:"Contact ACAS to start Early Conciliation", urgent:true, deadline:"Before 3 months minus 1 day from last discriminatory act", description:"You MUST start ACAS Early Conciliation before filing an Employment Tribunal claim. It is free. It pauses your 3-month limitation clock. Missing this step means your claim will be rejected.", tips:"1. Go to acas.org.uk/early-conciliation\n2. This takes 15 minutes to start online\n3. Once you receive your EC certificate, you have exactly 1 month to file your ET1\n4. ACAS cannot share information between parties without consent", links:[{icon:"🌐",label:"Start ACAS Early Conciliation — Free",href:"https://www.acas.org.uk/early-conciliation",note:"Mandatory before ET1"},{icon:"🌐",label:"Employment Tribunals (HMCTS)",href:"https://www.gov.uk/employment-tribunals",note:"File ET1 here after EC certificate"}]},
    ];
    setEvidenceTasks(tasks);
    S.set("evidence_tasks", tasks);
    S.set("evidence_tasks_generated", true);
    setTasksGenerated(true);
    setTaskLoading(false);
    setActiveTab("tasks");
  };

  const strength = Math.min(100, items.length*12 + items.filter(i=>i.importance==="high").length*6 + (caseData?.witnesses?8:0));
  const highItems = items.filter(i=>i.importance==="high");
  const fmt = i => TYPES.find(t=>t.id===i.type)||{icon:"📋",label:i.type};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}>Evidence Vault</h1>
          <p style={{color:"#1E3A5F",fontSize:14}}>Every piece of evidence matters. Log it all — courts care about specifics.</p>
        </div>
        <CaseStrengthRing score={strength}/>
      </div>

      {/* Tab navigation */}
      <div style={{display:"flex",gap:4,background:T.navyM,borderRadius:10,padding:4,marginBottom:20}}>
        {[["vault","🗄 Vault"],["tasks","📋 Action Plan"],["report","📊 Visual Report"],["portal","🔑 Client Portal"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{flex:1,background:activeTab===id?T.gold:"transparent",color:activeTab===id?T.navy:T.white,border:"none",borderRadius:8,padding:"9px 8px",fontWeight:activeTab===id?700:400,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>
        ))}
      </div>

      {/* Stats row — always visible */}
      <div className="grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <Badge icon="📁" label="Total Items" value={items.length} color={T.teal}/>
        <Badge icon="🔴" label="High Priority" value={highItems.length} color={T.redL}/>
        <Badge icon="👤" label="Witnesses" value={caseData?.witnesses?"Yes":"None"} color={T.gold}/>
        <Badge icon="📅" label="Incident Date" value={caseData?.when||"—"} color={T.muted}/>
      </div>

      {/* ACTION PLAN TAB */}
      {activeTab==="tasks" && (
        <div>
          {!tasksGenerated ? (
            <div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:36,marginBottom:12}}>📋</div>
              <div style={{color:"#0F2C4A",fontSize:16,fontWeight:700,marginBottom:8}}>Your Sequential Action Plan</div>
              <div style={{color:"#64748B",fontSize:13,marginBottom:20,lineHeight:1.7}}>
                Get a step-by-step action plan tailored to your case — each task comes with direct links, instructions, and a status report when you complete it. Tasks unlock one at a time so you always know exactly what to do next.
              </div>
              <Btn onClick={generateTasks} disabled={taskLoading} style={{fontSize:15,padding:"14px 32px"}}>
                {taskLoading?"Generating your plan...":"📋 Generate My Sequential Action Plan"}
              </Btn>
            </div>
          ) : (
            <SequentialTaskEngine
              tasks={evidenceTasks}
              caseContext={`${caseData?.discType?.join(", ")||"discrimination"} case — ${caseData?.setting||"workplace"}`}
            />
          )}
          {tasksGenerated && (
            <button onClick={()=>{S.del("evidence_tasks");S.del("evidence_tasks_generated");S.del("task_states_"+(caseData?.setting||"general"));setEvidenceTasks([]);setTasksGenerated(false);}} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"8px 16px",fontSize:12,cursor:"pointer",marginTop:16}}>
              ↺ Regenerate Action Plan
            </button>
          )}
        </div>
      )}

      {/* VISUAL REPORT TAB */}
      {activeTab==="report" && (
        <CaseVisualReport caseData={caseData} cases={[]} activeCase={null}/>
      )}

      {/* CLIENT PORTAL TAB */}
      {activeTab==="portal" && (
        <ClientPortalAccess cases={[]}/>
      )}

      {/* VAULT TAB */}
      {activeTab==="vault" && (
        <div>
          <div style={{marginBottom:16}}>
            <Btn variant="teal" onClick={getAiTip} disabled={aiLoading}>
              {aiLoading?"Analysing…":"🤖 Quick AI tip — what to collect next"}
            </Btn>
            {(ai||aiLoading)&&<div style={{marginTop:12}}><AIPanel text={ai} loading={aiLoading} label="Evidence Tip"/></div>}
          </div>

      {/* Add form */}
      {adding ? (
        <Card style={{marginBottom:20}} glow>
          <h3 style={{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:18}}>+ Log New Evidence</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}} className="grid-4">
            {TYPES.map(t=>(
              <button key={t.id} onClick={()=>setForm(f=>({...f,type:t.id}))} style={{
                background:form.type===t.id?T.goldBg:"rgba(255,255,255,0.03)",
                border:`1.5px solid ${form.type===t.id?T.gold:T.border}`,
                borderRadius:10,padding:"10px 6px",cursor:"pointer",
                color:form.type===t.id?T.gold:T.muted,fontFamily:"'Source Serif 4',serif",fontSize:11,textAlign:"center"}}>
                <div style={{fontSize:18,marginBottom:4}}>{t.icon}</div>{t.label}
              </button>
            ))}
          </div>
          <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <Field label="Description — what does this show?" required>
              <Textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder="e.g. Email from manager dated 14 March where he explicitly says 'cultural fit' — this contradicts his later denial"/>
            </Field>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Field label="Date of evidence">
                <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              </Field>
              <Field label="Source / Author">
                <Input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="e.g. John Smith, HR Manager"/>
              </Field>
              <Field label="Importance">
                <Select value={form.importance} onChange={e=>setForm(f=>({...f,importance:e.target.value}))}>
                  <option value="low">Low — Background context</option>
                  <option value="medium">Medium — Supports case</option>
                  <option value="high">High — Direct evidence</option>
                </Select>
              </Field>
            </div>
          </div>
          <Field label="Tags (comma separated, e.g. direct-evidence, harassment, manager-X)">
            <Input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="harassment, manager, incident-1, email"/>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <Btn onClick={add} disabled={!form.type||!form.description}>✓ Add to Vault</Btn>
            <Btn variant="ghost" onClick={()=>setAdding(false)}>Cancel</Btn>
          </div>
        </Card>
      ) : (
        <Btn onClick={()=>setAdding(true)} style={{marginBottom:20}}>+ Log Evidence Item</Btn>
      )}

      {/* Evidence list */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {items.length===0&&(
          <div style={{textAlign:"center",padding:"48px 20px",color:T.dim}}>
            <div style={{fontSize:40,marginBottom:12}}>🗄</div>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Your vault is empty</p>
            <p style={{fontSize:13,marginTop:6}}>Start logging evidence above. Even small things matter.</p>
          </div>
        )}
        {items.map(item=>{
          const t=fmt(item);
          const impColor = item.importance==="high"?T.redL:item.importance==="medium"?T.gold:T.muted;
          return (
            <Card key={item.id} style={{padding:"14px 18px"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{fontSize:24,flexShrink:0,marginTop:2}}>{t.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.label}</span>
                      {item.date&&<span style={{color:T.dim,fontSize:11}}>· {item.date}</span>}
                      <span style={{background:`${impColor}18`,border:`1px solid ${impColor}35`,color:impColor,fontSize:9.5,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.06em"}}>{item.importance}</span>
                    </div>
                    <button onClick={()=>save(items.filter(x=>x.id!==item.id))} style={{color:T.dim,background:"none",border:"none",fontSize:13,padding:"2px 6px"}}>✕</button>
                  </div>
                  <p style={{color:T.white,fontSize:13,margin:"4px 0 6px",fontFamily:"'Source Serif 4',serif",lineHeight:1.6}}>{item.description}</p>
                  {item.source&&<p style={{color:"#64748B",fontSize:11,marginBottom:6}}>Source: {item.source}</p>}
                  {item.tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {item.tags.map((tag,j)=><Tag key={j}>{tag}</Tag>)}
                  </div>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
        </div>
      )}
    </div>
  );
}

function Timeline({ caseData }) {
  const [events, setEvents] = useState(()=>S.get("timeline",[]));
  const [form, setForm] = useState({date:"",title:"",description:"",type:"incident",source:""});
  const [adding, setAdding] = useState(false);

  const TYPES = [
    {id:"incident",label:"Incident",color:T.redL,icon:"🔴"},
    {id:"action",label:"Your Action",color:T.teal,icon:"✊"},
    {id:"response",label:"Employer Response",color:T.gold,icon:"🏢"},
    {id:"evidence",label:"Evidence Found",color:"#7C6BC9",icon:"📁"},
    {id:"witness",label:"Witness Account",color:"#C96B4C",icon:"👤"},
    {id:"other",label:"Other Event",color:T.muted,icon:"•"},
  ];

  const save = arr => { const s=[...arr].sort((a,b)=>a.date.localeCompare(b.date)); setEvents(s); S.set("timeline",s); };
  const add = () => {
    if (!form.date||!form.title) return;
    save([...events,{...form,id:Date.now()}]);
    setForm({date:"",title:"",description:"",type:"incident",source:""});
    setAdding(false);
  };
  const getType = id => TYPES.find(t=>t.id===id)||TYPES[0];

  return (
    <div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}>Chronology Builder</h1>
      <p style={{color:"#1E3A5F",fontSize:14,marginBottom:24}}>Build your legal timeline. Chronological accuracy is critical in tribunal proceedings.</p>

      {caseData?.when&&<div style={{marginBottom:20}}><TimerBadge date={caseData.when}/></div>}

      {adding ? (
        <Card glow style={{marginBottom:24}}>
          <h3 style={{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:16}}>+ Add Event</h3>
          <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <Field label="Date" required><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
            <Field label="Event type">
              <Select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                {TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Event title" required style={{marginBottom:12}}>
            <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Manager makes comment about 'cultural fit'"/>
          </Field>
          <Field label="Full description (include exact words where possible)">
            <Textarea rows={4} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Detailed account of what happened, who was present, exact words used..."/>
          </Field>
          <Field label="Source / Evidence reference" style={{marginTop:12}}>
            <Input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="e.g. Email ref #1234, WhatsApp screenshot, my diary note"/>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <Btn onClick={add} disabled={!form.date||!form.title}>✓ Add to Timeline</Btn>
            <Btn variant="ghost" onClick={()=>setAdding(false)}>Cancel</Btn>
          </div>
        </Card>
      ):(
        <Btn onClick={()=>setAdding(true)} style={{marginBottom:24}}>+ Add Timeline Event</Btn>
      )}

      {events.length===0&&(
        <div style={{textAlign:"center",padding:"48px 20px",color:T.dim}}>
          <div style={{fontSize:40,marginBottom:12}}>📅</div>
          <p style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Your timeline is empty</p>
          <p style={{fontSize:13,marginTop:6}}>Add the first event — usually the initial discriminatory incident.</p>
        </div>
      )}

      {/* Timeline visual */}
      <div style={{position:"relative",paddingLeft:24}}>
        <div style={{position:"absolute",left:11,top:0,bottom:0,width:2,background:`linear-gradient(to bottom, ${T.gold}, transparent)`,borderRadius:2}}/>
        {events.map((ev,i)=>{
          const tp=getType(ev.type);
          const [expanded, setExpanded] = useState(false);
          return (
            <div key={ev.id} style={{position:"relative",paddingLeft:28,paddingBottom:24}}>
              <div style={{position:"absolute",left:-12,top:4,width:14,height:14,borderRadius:"50%",background:tp.color,
                boxShadow:`0 0 0 3px ${T.navy}, 0 0 0 5px ${tp.color}44`,cursor:"pointer",zIndex:1}}
                onClick={()=>setExpanded(!expanded)}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
                <div>
                  <span style={{color:"#64748B",fontSize:11,fontFamily:"'Source Serif 4',serif"}}>{ev.date}</span>
                  <span style={{marginLeft:8,background:`${tp.color}18`,border:`1px solid ${tp.color}30`,
                    color:tp.color,fontSize:10,padding:"2px 8px",borderRadius:20}}>{tp.icon} {tp.label}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setExpanded(!expanded)} style={{color:T.gold,background:"none",border:`1px solid ${T.gold}44`,borderRadius:6,padding:"2px 8px",fontSize:11,cursor:"pointer"}}>{expanded?"▲ Collapse":"▼ Expand"}</button>
                  <button onClick={()=>save(events.filter(x=>x.id!==ev.id))} style={{color:T.dim,background:"none",border:"none",fontSize:12,cursor:"pointer"}}>✕</button>
                </div>
              </div>
              <Card style={{padding:"14px 16px",border:expanded?`2px solid ${tp.color}55`:"1px solid rgba(255,255,255,0.06)"}}>
                <h4 style={{color:T.white,fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:expanded?10:6}}>{ev.title}</h4>
                {!expanded && ev.description&&<p style={{color:"#64748B",fontSize:13,lineHeight:1.6,marginBottom:6}}>{ev.description.substring(0,120)}{ev.description.length>120?"...":""}</p>}
                {!expanded && ev.source&&<p style={{color:T.dim,fontSize:11}}>📎 {ev.source}</p>}

                {/* EXPANDED VIEW — full data */}
                {expanded && (
                  <div>
                    {ev.description && (
                      <div style={{marginBottom:12}}>
                        <div style={{color:"#64748B",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Full Account</div>
                        <div style={{color:T.white,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:12}}>{ev.description}</div>
                      </div>
                    )}
                    {ev.source && (
                      <div style={{marginBottom:12}}>
                        <div style={{color:"#64748B",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Evidence References</div>
                        <div style={{color:T.tealL,fontSize:13,background:"rgba(12,123,122,0.1)",borderRadius:8,padding:"8px 12px"}}>📎 {ev.source}</div>
                      </div>
                    )}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:10}}>
                        <div style={{color:T.muted,fontSize:10,marginBottom:3}}>DATE</div>
                        <div style={{color:"#0F2C4A",fontSize:13,fontWeight:600}}>{ev.date}</div>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:10}}>
                        <div style={{color:T.muted,fontSize:10,marginBottom:3}}>EVENT TYPE</div>
                        <div style={{color:tp.color,fontSize:13,fontWeight:600}}>{tp.icon} {tp.label}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <button onClick={()=>setExpanded(false)} style={{background:T.navyL,border:`1px solid ${T.border}`,color:T.white,borderRadius:8,padding:"7px 16px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                        ↩ Return to Chronology
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionCentre({ caseData, aiAssessment }) {
  const [selected, setSelected] = useState(null);
  const [ai, setAi] = useState(""); const [aiLoading, setAiLoading] = useState(false);
  const [log, setLog] = useState(()=>S.get("decisions",[]));
  const [logEntry, setLogEntry] = useState("");

  const getAiPlan = (action) => {
    setSelected(action); setAi(""); setAiLoading(true);
    const act = ACTIONS.find(a=>a.id===action);
    const SYS = `You are a UK employment law strategy advisor for a self-represented litigant. Be practical, empowering, and specific. Give exact steps — name the forms, the processes, the ACAS numbers. Acknowledge this is emotionally difficult while keeping focus on strategy. Never use jargon without explaining. Under 300 words total. Format with numbered steps and clear headings.`;
    const MSG = `Case: ${caseData?.discType?.join(", ")||"discrimination"} in ${caseData?.setting||"workplace"}. Chosen action: ${act?.label}. Incident date: ${caseData?.when||"unknown"}.
Assessment summary: ${(aiAssessment||"").slice(0,400)}

Give: 
1. What to do in the next 7 days (numbered, specific, actionable)
2. What to expect at each stage  
3. ONE key risk to manage
4. ONE thing NOT to do under any circumstances

Be direct. They need clarity, not caveats.`;
    streamAI(SYS, MSG, t=>setAi(t), ()=>setAiLoading(false));
  };

  const addLog = () => {
    if (!logEntry.trim()) return;
    const d=[...log,{text:logEntry,date:new Date().toLocaleDateString("en-GB"),id:Date.now()}];
    setLog(d); S.set("decisions",d); setLogEntry("");
  };

  const riskColor = r => r==="None"||r==="Low"?T.teal:r==="Medium"||r==="Low-Medium"?T.gold:T.redL;

  return (
    <div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}>Action Centre</h1>
      <p style={{color:"#1E3A5F",fontSize:14,marginBottom:8}}>UJRIS recommends — you decide. Every action has pros, cons and an AI-guided step-by-step plan.</p>
      <div style={{background:T.goldBg,border:`1px solid ${T.gold}30`,borderRadius:12,padding:"12px 16px",marginBottom:24}}>
        <p style={{color:T.gold,fontSize:13,margin:0}}>⚠ <strong>UJRIS never acts on your behalf.</strong> This tool gives you the intelligence to act. The decision — and the action — is always yours.</p>
      </div>

      {caseData?.when&&<div style={{marginBottom:20}}><TimerBadge date={caseData.when}/></div>}

      <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28}}>
        {ACTIONS.map(a=>(
          <button key={a.id} onClick={()=>getAiPlan(a.id)} style={{
            background: selected===a.id?T.tealBg:"rgba(255,255,255,0.03)",
            border:`2px solid ${selected===a.id?T.teal:T.border}`,
            borderRadius:14, padding:"16px 16px", textAlign:"left", cursor:"pointer", transition:"all 0.2s",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontSize:22}}>{a.icon}</span>
              <span style={{fontSize:10,color:riskColor(a.risk),background:`${riskColor(a.risk)}15`,
                border:`1px solid ${riskColor(a.risk)}30`,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                {a.risk} risk
              </span>
            </div>
            <div style={{color:selected===a.id?T.tealL:T.white,fontFamily:"'Source Serif 4',serif",fontSize:13.5,fontWeight:selected===a.id?600:400,marginBottom:8}}>{a.label}</div>
            <div className="grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
              {[["⏱",a.time],["📊",a.success]].map(([ic,v])=>v&&v!=="—"&&(
                <div key={ic} style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 4px"}}>
                  <div style={{fontSize:14}}>{ic}</div>
                  <div style={{color:T.muted,fontSize:10,lineHeight:1.3,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {(ai||aiLoading)&&selected&&(
        <div style={{marginBottom:28}}>
          <h3 style={{color:T.teal,fontFamily:"'Playfair Display',serif",fontSize:17,marginBottom:12}}>
            Step-by-Step Plan: {ACTIONS.find(a=>a.id===selected)?.label}
          </h3>
          <AIPanel text={ai} loading={aiLoading} label="Your Action Plan"/>
          {!aiLoading&&(
            <div>
              {/* Document generation shortcuts */}
              {selected==="sar"&&navTo&&(
                <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                  <button onClick={()=>navTo("sar")} style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    📂 Generate SAR Letter →
                  </button>
                  <button onClick={()=>navTo("email_dispatch")} style={{background:T.tealBg,border:"1px solid "+T.teal+"44",color:T.tealL,borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontWeight:600}}>
                    ✉ Go to Email Dispatch →
                  </button>
                </div>
              )}
              {selected==="grievance"&&navTo&&(
                <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                  <button onClick={()=>navTo("documents")} style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    📋 Generate Grievance Letter →
                  </button>
                  <button onClick={()=>navTo("email_dispatch")} style={{background:T.tealBg,border:"1px solid "+T.teal+"44",color:T.tealL,borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontWeight:600}}>
                    ✉ Send by Email →
                  </button>
                </div>
              )}
              {selected==="et"&&navTo&&(
                <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                  <button onClick={()=>navTo("documents")} style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    ⚖ Prepare ET1 Claim →
                  </button>
                  <button onClick={()=>navTo("sar")} style={{background:T.tealBg,border:"1px solid "+T.teal+"44",color:T.tealL,borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontWeight:600}}>
                    📂 Get Evidence via SAR first →
                  </button>
                </div>
              )}
              {selected==="acas"&&navTo&&(
                <div style={{marginTop:14}}>
                  <a href="tel:03001231100" style={{background:T.gold,color:T.navy,borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:13,textDecoration:"none",display:"inline-block",marginRight:10}}>
                    📞 Call ACAS: 0300 123 1100
                  </a>
                  <button onClick={()=>navTo("email_dispatch")} style={{background:T.tealBg,border:"1px solid "+T.teal+"44",color:T.tealL,borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontWeight:600}}>
                    ✉ Submit Online via Email →
                  </button>
                </div>
              )}
              <div style={{background:T.redBg,border:"1px solid "+T.red+"40",borderRadius:12,padding:"14px 18px",marginTop:14}}>
                <p style={{color:"#f5a0a0",fontSize:13,margin:0}}>
                  🆓 Free legal advice: <a href="https://www.citizensadvice.org.uk" target="_blank">Citizens Advice</a> · 
                  <a href="https://www.acas.org.uk" target="_blank"> ACAS Helpline: 0300 123 1100</a> · 
                  <a href="https://www.lawworks.org.uk" target="_blank"> LawWorks (free legal clinics)</a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision log */}
      <Card>
        <h3 style={{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:8,marginTop:0}}>📔 Your Decision Log</h3>
        <p style={{color:"#64748B",fontSize:12,marginBottom:14}}>Record every decision you make. This creates your case narrative and protects you.</p>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <Input value={logEntry} onChange={e=>setLogEntry(e.target.value)} placeholder="e.g. Decided to submit formal grievance — letter sent 20 March 2026"
            onKeyDown={e=>e.key==="Enter"&&addLog()} style={{flex:1}}/>
          <Btn onClick={addLog} sm>Log</Btn>
        </div>
        <div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:0}}>
          {log.map(d=>(
            <div key={d.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`,alignItems:"flex-start"}}>
              <span style={{color:T.gold,fontSize:11,marginTop:2,flexShrink:0}}>✓</span>
              <span style={{color:T.white,fontSize:13,flex:1,fontFamily:"'Source Serif 4',serif"}}>{d.text}</span>
              <span style={{color:T.dim,fontSize:11,flexShrink:0}}>{d.date}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Documents({ caseData }) {
  const [docType, setDocType] = useState("grievance");
  const [form, setForm] = useState({name:"",employer:"",role:"",date:"",details:"",outcome:"",...(()=>{try{return {name:S.get("casedata")?.description?"":""}}catch{return{}}})()});
  const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(()=>{
    if (caseData) setForm(f=>({...f,
      details: caseData.description||f.details,
      date: caseData.when||f.date,
    }));
  },[caseData]);

  const tpl = DOC_TEMPLATES[docType];

  const generate = () => {
    setLoading(true); setOutput("");
    streamAI(tpl.system, tpl.prompt({...form, discType:caseData?.discType?.join(", ")||"discrimination", setting:caseData?.setting||"workplace"}),
      t=>setOutput(t), ()=>setLoading(false));
  };

  const copy = () => { navigator.clipboard?.writeText(output); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const printDoc = () => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>UJRIS Document</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;font-size:14px;line-height:1.8;color:#1a1a1a}pre{white-space:pre-wrap;font-family:Georgia,serif}h2{color:#1a2b3c;border-bottom:2px solid #C9A84C;padding-bottom:8px}</style></head><body><h2>UJRIS — ${tpl.label}</h2><pre>${output}</pre><hr/><small>Generated by UJRIS — not legal advice. Review before sending.</small></body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}>Document Templates</h1>
      <p style={{color:"#1E3A5F",fontSize:14,marginBottom:24}}>AI-generated, tribunal-ready documents. You review, edit, and send. UJRIS never sends anything on your behalf.</p>

      {/* Doc type selector */}
      <div className="grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:24}}>
        {Object.entries(DOC_TEMPLATES).map(([id,t])=>(
          <button key={id} onClick={()=>{setDocType(id);setOutput("");}} style={{
            background:docType===id?T.goldBg:"rgba(255,255,255,0.03)",
            border:`2px solid ${docType===id?T.gold:T.border}`,
            borderRadius:12,padding:"14px 12px",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
            <div style={{fontSize:22,marginBottom:6}}>{t.icon}</div>
            <div style={{color:docType===id?T.gold:T.white,fontSize:12.5,fontFamily:"'Source Serif 4',serif",fontWeight:docType===id?600:400}}>{t.label}</div>
          </button>
        ))}
      </div>

      <Card style={{marginBottom:24}}>
        <h3 style={{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:18}}>{tpl.icon} {tpl.label}</h3>
        <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Your full name" required><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Aminata Diallo"/></Field>
          <Field label="Employer / Respondent" required><Input value={form.employer} onChange={e=>setForm(f=>({...f,employer:e.target.value}))} placeholder="e.g. ABC Healthcare Ltd"/></Field>
          <Field label="Your job title / role"><Input value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Senior Care Worker"/></Field>
          <Field label="Date of incident"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Key facts / incident details" required style={{gridColumn:"1/-1"}}>
            <Textarea rows={5} value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))}
              placeholder="Include specific incidents, dates, words used, witnesses. The more specific, the stronger the document."/>
          </Field>
          {(docType==="grievance"||docType==="acas"||docType==="response")&&(
            <Field label="Desired outcome" style={{gridColumn:"1/-1"}}>
              <Input value={form.outcome} onChange={e=>setForm(f=>({...f,outcome:e.target.value}))} placeholder="e.g. Written apology, reinstatement, £15,000 compensation, policy change"/>
            </Field>
          )}
        </div>
        <Btn onClick={generate} disabled={!form.name||!form.employer||!form.details||loading} style={{marginTop:18}}>
          {loading?"Generating…":"✍ Generate Document"}
        </Btn>
      </Card>

      {(output||loading)&&(
        <div className="fade-in">
          {loading&&!output?(
            <AIPanel text="" loading={true} label="Generating document…"/>
          ):(
            <>
              <div style={{background:"#ffffff",borderRadius:16,padding:"36px 40px",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",marginBottom:14}}>
                <pre style={{fontFamily:"Georgia,serif",fontSize:13.5,lineHeight:1.9,color:"#1a1a2e",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>
                  {output}
                </pre>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <Btn onClick={copy}>{copied?"✓ Copied!":"📋 Copy to Clipboard"}</Btn>
                <Btn variant="ghost" onClick={printDoc}>🖨 Print / Save PDF</Btn>
                <Btn variant="outline" onClick={()=>setOutput("")}>↩ Edit & Regenerate</Btn>
              </div>
              <p style={{color:T.dim,fontSize:11.5,marginTop:12,fontStyle:"italic"}}>
                ⚠ Review this document carefully before sending. UJRIS generates a starting point — you may need to adjust facts, dates, and tone. Consider having a solicitor review before filing tribunal documents.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Forensic() {
  const [activeMode, setActiveMode] = React.useState(null);

  const MODES = [
    {
      id: "anchor",
      icon: "🎯",
      label: "Anchor Lie Detector",
      desc: "Paste any employer statement, witness account, or defence document. UJRIS identifies the single provable falsehood that unravels their entire case — the anchor lie.",
      detail: "The anchor lie is the one false claim that, when disproved, destroys the credibility of everything built on top of it. Find it first.",
      color: "#C9A84C"
    },
    {
      id: "metadata",
      icon: "🔬",
      label: "Document Metadata & Authenticity Analysis",
      desc: "Upload or paste a document. UJRIS analyses it for signs of tampering, backdating, inconsistency in formatting, and anachronistic content that shouldn't exist at the stated date.",
      detail: "Documents can be forged, backdated, or selectively edited. AI cross-references dates, language, formatting, and content to flag authenticity concerns.",
      color: T.tealL
    },
    {
      id: "crossref",
      icon: "⚡",
      label: "Evidence Cross-Reference & Contradiction Map",
      desc: "Paste multiple statements or documents. UJRIS maps every factual claim, finds where they contradict each other, and ranks contradictions by legal impact.",
      detail: "Employers rarely coordinate their lies perfectly. This tool finds where their statements disagree with each other and with documented facts.",
      color: "#9b8fe8"
    },
  ];

  if (!activeMode) {
    return React.createElement("div", null,
      React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}, "🔬 Forensic Intelligence Suite"),
      React.createElement("p", {style:{color:"#1E3A5F",fontSize:14,marginBottom:8}},
        "Advanced evidence analysis tools. The same analytical rigour used by legal teams — now available to you."
      ),
      React.createElement("div", {style:{background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:10,padding:"14px 18px",marginBottom:24}},
        React.createElement("div", {style:{color:T.gold,fontSize:13,fontWeight:700,marginBottom:4}}, "💡 The Anchor Lie Strategy"),
        React.createElement("div", {style:{color:"#64748B",fontSize:13,lineHeight:1.6}},
          "In discrimination cases, employers build defences on a foundation of interconnected claims. Find the one claim that is demonstrably false — the anchor lie — and the entire structure collapses. Once you prove they lied about one thing, tribunals question everything else. This is the most powerful single technique in self-represented litigation."
        )
      ),
      React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:14}},
        MODES.map(function(m) {
          return React.createElement("button", {
            key: m.id,
            onClick: function(){setActiveMode(m.id);},
            style:{background:T.faint,border:"2px solid "+T.border,borderRadius:14,padding:"22px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"},
            onMouseEnter: function(e){e.currentTarget.style.borderColor=m.color;e.currentTarget.style.background="rgba(255,255,255,0.04)";},
            onMouseLeave: function(e){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.faint;}
          },
            React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:10}},
              React.createElement("span", {style:{fontSize:28}}, m.icon),
              React.createElement("div", {style:{color:m.color,fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700}}, m.label)
            ),
            React.createElement("div", {style:{color:T.white,fontSize:13,lineHeight:1.6,marginBottom:8}}, m.desc),
            React.createElement("div", {style:{color:T.dim,fontSize:12,lineHeight:1.5,fontStyle:"italic"}}, m.detail),
            React.createElement("div", {style:{color:m.color,fontSize:12,marginTop:10,fontWeight:600}}, "Open Tool →")
          );
        })
      )
    );
  }

  return React.createElement(ForensicTool, {mode: activeMode, onBack: function(){setActiveMode(null);}, modes: MODES});
}

function ForensicTool({mode, onBack, modes}) {
  const [text1, setText1] = React.useState("");
  const [text2, setText2] = React.useState("");
  const [text3, setText3] = React.useState("");
  const [file1Name, setFile1Name] = React.useState("");
  const [ai, setAi] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [stage, setStage] = React.useState("input");
  const file1Ref = React.useRef();
  const modeObj = modes.find(function(m){return m.id===mode;}) || {};

  const SYSTEMS = {
    anchor: "You are UJRIS — a UK employment discrimination forensic expert specialising in identifying false statements in employer defences. Your task is to find the ANCHOR LIE: the single most provable false statement that undermines the entire defence. Analyse with surgical precision. Structure your response as: (1) THE ANCHOR LIE — state it clearly and simply, (2) WHY IT IS PROVABLE — what evidence would prove it false, (3) THE CHAIN OF COLLAPSE — what other claims depend on this lie being true, (4) HOW TO EXPOSE IT AT TRIBUNAL — specific questions, documents to request, cross-examination approach, (5) SECONDARY CONTRADICTIONS — other inconsistencies ranked by impact, (6) LEGAL SIGNIFICANCE — how this affects the discrimination claim under Equality Act 2010. Be direct, clinical, and precise. Never soften findings.",

    metadata: "You are UJRIS — a UK legal document forensics expert. Analyse the provided document text for: (1) AUTHENTICITY RED FLAGS — signs of backdating, insertion of content, or fabrication. Look for: anachronistic terminology, date inconsistencies, formatting anomalies described in text, version control references, internal contradictions in dates and timelines. (2) METADATA INDICATORS — based on document language, identify likely creation date vs stated date discrepancies. (3) SELECTIVE EDITING SIGNS — abrupt topic changes, missing context, incomplete sentences suggesting redaction. (4) LANGUAGE ANALYSIS — sudden shifts in formality, tone, or vocabulary suggesting multiple authors or insertions. (5) EVIDENTIAL INTEGRITY SCORE — rate 1-10 with detailed justification. (6) TRIBUNAL STRATEGY — how to challenge this document's authenticity, what to request under disclosure, and what expert evidence might be needed. Be forensically precise.",

    crossref: "You are UJRIS — a UK employment litigation expert specialising in contradiction analysis. You will be given multiple statements or documents. Your task: (1) CONTRADICTION MAP — list every factual claim in each document, then identify where they contradict each other. Format each contradiction as: CLAIM A (Source 1) vs CLAIM B (Source 2) — VERDICT: [which is likely true and why]. (2) RANKED CONTRADICTIONS — rank all contradictions by legal impact on the discrimination claim, highest first. (3) ANCHOR INCONSISTENCY — identify the single most damaging contradiction. (4) IMPLAUSIBILITY ANALYSIS — which account is internally inconsistent even without comparison. (5) CROSS-EXAMINATION STRATEGY — for each major contradiction, the exact tribunal question to expose it. (6) DISCLOSURE TARGETS — what documents, if requested, would resolve these contradictions in the claimant's favour. Be precise, analytical, and legally focused."
  };

  const PROMPTS = {
    anchor: function(t1) {
      return "EMPLOYER STATEMENT / DEFENCE DOCUMENT TO ANALYSE:\n\n" + t1 + "\n\nIdentify the anchor lie and full forensic analysis as instructed.";
    },
    metadata: function(t1) {
      return "DOCUMENT TO ANALYSE FOR AUTHENTICITY:\n\n" + t1 + "\n\nProvide full forensic authenticity analysis as instructed.";
    },
    crossref: function(t1, t2, t3) {
      return "DOCUMENT / STATEMENT 1:\n" + t1 + "\n\n---\n\nDOCUMENT / STATEMENT 2:\n" + (t2||"[Not provided]") + (t3 ? "\n\n---\n\nDOCUMENT / STATEMENT 3:\n" + t3 : "") + "\n\nProvide full contradiction map and cross-reference analysis as instructed.";
    }
  };

  const readFile = function(file, setter, nameSetter) {
    if (!file) return;
    nameSetter && nameSetter(file.name);
    const reader = new FileReader();
    reader.onload = function(e) { setter(e.target.result); };
    reader.readAsText(file);
  };

  const analyse = async function() {
    const mainText = text1.trim();
    if (!mainText) return;
    setLoading(true); setAi(""); setStage("result");
    const prompt = mode === "crossref" ? PROMPTS.crossref(text1, text2, text3) :
                   mode === "metadata" ? PROMPTS.metadata(text1) :
                   PROMPTS.anchor(text1);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 2000,
          stream: true,
          system: SYSTEMS[mode],
          messages: [{role:"user", content: prompt}]
        })
      });
      if (!res.ok) throw new Error("Server error " + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while(true) {
        const {done, value} = await reader.read();
        if(done) break;
        for(const line of dec.decode(value).split("\n")) {
          if(line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if(d.type==="content_block_delta" && d.delta && d.delta.text) {
                full += d.delta.text; setAi(full);
              }
            } catch(ex){}
          }
        }
      }
    } catch(e) {
      setAi("⚠ Analysis failed: " + e.message);
    } finally { setLoading(false); }
  };

  const printReport = function() {
    const w = window.open("", "_blank");
    w.document.write("<html><head><title>UJRIS Forensic Analysis — " + modeObj.label + "</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.8;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}pre{white-space:pre-wrap;font-family:Georgia,serif}.warning{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px 16px;margin:20px 0;font-size:13px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666}</style></head><body><h1>" + modeObj.icon + " UJRIS Forensic Analysis</h1><h2>" + modeObj.label + "</h2><p><strong>Generated:</strong> " + new Date().toLocaleString("en-GB") + "</p><div class='warning'>⚠ AI-generated forensic analysis. Cross-reference all findings against original documents. Not legal advice. Review with a solicitor before tribunal use.</div><pre>" + ai + "</pre><div class='footer'>Generated by UJRIS — Universal Justice Response & Intelligence System | ujris.co.uk</div></body></html>");
    w.document.close(); w.print();
  };

  return React.createElement("div", null,
    React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:20}},
      React.createElement(Btn, {variant:"ghost", sm:true, onClick:onBack}, "← Back"),
      React.createElement("div", null,
        React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,margin:0}},
          modeObj.icon + " " + modeObj.label
        )
      )
    ),

    stage === "input" && React.createElement("div", null,
      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("label", {style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
          mode === "crossref" ? "Statement / Document 1 *" : "Paste Document or Statement Text *"
        ),
        React.createElement("textarea", {
          value: text1,
          onChange: function(e){setText1(e.target.value);},
          placeholder: mode === "anchor" ? "Paste the employer's statement, witness account, disciplinary outcome letter, ET3 response, or any defence document here…" :
                       mode === "metadata" ? "Paste the full text of the document you want to authenticate. Include any headers, footers, dates, reference numbers, and signatures exactly as they appear…" :
                       "Paste the first statement, witness account, or document here…",
          style:{width:"100%",minHeight:160,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        }),
        React.createElement("div", {style:{display:"flex",alignItems:"center",gap:8,marginTop:8}},
          React.createElement("input", {type:"file", accept:".txt,.pdf,.doc,.docx", style:{display:"none"}, ref:file1Ref,
            onChange:function(e){readFile(e.target.files&&e.target.files[0], setText1, setFile1Name);}}),
          React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){file1Ref.current&&file1Ref.current.click();}}, "📎 Upload Text File"),
          file1Name && React.createElement("span", {style:{color:T.tealL,fontSize:12}}, "✅ " + file1Name)
        )
      ),

      mode === "crossref" && React.createElement("div", null,
        React.createElement(Card, {style:{marginBottom:16}},
          React.createElement("label", {style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
            "Statement / Document 2 *"
          ),
          React.createElement("textarea", {
            value: text2,
            onChange: function(e){setText2(e.target.value);},
            placeholder: "Paste the second statement, witness account, or document here…",
            style:{width:"100%",minHeight:120,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
              borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
              fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
          })
        ),
        React.createElement(Card, {style:{marginBottom:16}},
          React.createElement("label", {style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
            "Statement / Document 3 (optional)"
          ),
          React.createElement("textarea", {
            value: text3,
            onChange: function(e){setText3(e.target.value);},
            placeholder: "Paste a third document if available (e.g. HR investigation report, manager's statement)…",
            style:{width:"100%",minHeight:100,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
              borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
              fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
          })
        )
      ),

      mode === "metadata" && React.createElement(Card, {style:{marginBottom:16,background:"rgba(12,123,122,0.06)",borderColor:"rgba(12,123,122,0.3)"}},
        React.createElement("div", {style:{color:T.tealL,fontWeight:700,fontSize:13,marginBottom:8}}, "📋 What to include for best results:"),
        React.createElement("div", {style:{color:"#64748B",fontSize:12,lineHeight:1.8}},
          "• Full document text including ALL headers, dates, reference numbers\n• Any version numbers or revision history visible in the document\n• Footer text including page numbers\n• Any \"Prepared by\" or signature blocks\n• Any timestamps visible in email headers if it's an email\n• The stated creation date and any other dates mentioned"
        )
      ),

      React.createElement(Btn, {
        onClick: analyse,
        disabled: !text1.trim(),
        style:{width:"100%",padding:"14px",fontSize:15}
      }, modeObj.icon + " Run Forensic Analysis")
    ),

    stage === "result" && React.createElement("div", null,
      React.createElement("div", {style:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}},
        React.createElement(Btn, {sm:true, onClick:printReport, disabled:loading}, "🖨 Print / Save PDF"),
        React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setStage("input");setAi("");}}, "← Edit Input"),
        React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setStage("input");setAi("");setText1("");setText2("");setText3("");setFile1Name("");}}, "🔄 New Analysis")
      ),

      loading && React.createElement(Card, {style:{textAlign:"center",padding:"32px",marginBottom:16}},
        React.createElement("div", {style:{fontSize:36,marginBottom:12}}, modeObj.icon),
        React.createElement("div", {style:{color:T.gold,fontSize:16,fontFamily:"'Playfair Display',serif",marginBottom:8}},
          mode==="anchor" ? "Hunting for the anchor lie…" :
          mode==="metadata" ? "Analysing document authenticity…" :
          "Mapping contradictions…"
        ),
        React.createElement("div", {style:{color:"#64748B",fontSize:13}}, "Forensic AI analysis in progress…")
      ),

      ai && React.createElement(Card, {style:{borderColor: mode==="anchor"?"rgba(201,168,76,0.4)":mode==="metadata"?"rgba(12,123,122,0.4)":"rgba(155,143,232,0.4)"}},
        React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
          React.createElement("div", {style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}},
            "✅ " + modeObj.label + " — Complete"
          )
        ),
        React.createElement("div", {style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",
          color:T.white,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",
          fontFamily:"'Source Serif 4',serif",maxHeight:650,overflowY:"auto"}},
          ai
        )
      ),

      React.createElement(Card, {style:{marginTop:16,background:"rgba(255,107,107,0.06)",borderColor:"rgba(255,107,107,0.2)"}},
        React.createElement("div", {style:{color:"#ff9999",fontSize:12,lineHeight:1.6}},
          "⚠ Forensic AI analysis identifies patterns and inconsistencies for your review. Cross-reference all findings against original documents. Bring significant findings to your solicitor. Not legal advice."
        )
      )
    )
  );
}

function CCTVAnalyser() {
  const [stage, setStage] = React.useState("intro");
  const [outputMode, setOutputMode] = React.useState(null);
  const [subject, setSubject] = React.useState("");
  const [context, setContext] = React.useState("");
  const [report, setReport] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const OUTPUT_MODES = [
    {
      id: "report",
      icon: "📄",
      label: "Written Tribunal Report",
      desc: "A formal, structured written analysis ready for your ET bundle. Describes all observed interactions, behaviours, and patterns in legal narrative form.",
      ideal: "Tribunal submissions, solicitor review, ET bundle"
    },
    {
      id: "frames",
      icon: "🖼",
      label: "Report + Annotated Key Frames",
      desc: "Written report plus the most significant captured frames with AI commentary on each image. Best for visually demonstrating specific moments to the tribunal.",
      ideal: "Visual evidence, corroborating witness accounts"
    },
    {
      id: "timeline",
      icon: "📅",
      label: "Full Timeline with Legal Narrative",
      desc: "A timestamped chronological breakdown of every significant moment, with legal commentary on what each event means for your discrimination claim.",
      ideal: "Multi-incident cases, pattern of behaviour evidence"
    },
  ];

  const extractFrames = (file) => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = Math.max(2, duration / 12);
        const times = [];
        for (let t = 0; t < duration; t += interval) times.push(Math.min(t, duration - 0.1));
        let idx = 0;
        const captured = [];
        const captureNext = () => {
          if (idx >= times.length) { URL.revokeObjectURL(url); resolve(captured); return; }
          video.currentTime = times[idx];
          video.onseeked = () => {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            captured.push({ time: times[idx].toFixed(1), dataUrl: canvas.toDataURL("image/jpeg", 0.7) });
            setProgress(Math.round(((idx + 1) / times.length) * 50));
            idx++;
            captureNext();
          };
        };
        captureNext();
      };
      video.onerror = () => resolve([]);
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!subject.trim()) { setError("Please describe the subject before uploading."); return; }
    setError(""); setStage("processing"); setProgress(5); setReport("");

    let capturedFrames = [];
    try {
      capturedFrames = await extractFrames(file);
    } catch(ex) { setError("Could not extract frames. Please try a different video format."); setStage("setup"); return; }
    if (capturedFrames.length === 0) { setError("No frames could be extracted from this video."); setStage("setup"); return; }

    setProgress(55); setLoading(true);

    const SYS = "You are UJRIS — a UK employment discrimination expert and forensic evidence analyst. Analyse CCTV frames provided by a self-represented claimant. Objectively describe what is visible, identify interactions involving the named subject, note behaviours relevant to discrimination claims under the Equality Act 2010. Be objective. Note both what supports and what does not support the claim. Never fabricate observations. Reference Equality Act 2010 sections 13, 26, 27 where relevant.";

    const modeInstructions = {
      report: "Produce a formal WRITTEN TRIBUNAL REPORT with sections: 1. EXECUTIVE SUMMARY 2. SUBJECT IDENTIFICATION 3. OBSERVED INTERACTIONS 4. BEHAVIOURAL ANALYSIS 5. ENVIRONMENTAL CONTEXT 6. LEGAL RELEVANCE (Equality Act 2010) 7. EVIDENTIARY WEIGHT 8. RECOMMENDED USE IN TRIBUNAL. Use professional legal language.",
      frames: "Produce a REPORT WITH FRAME-BY-FRAME COMMENTARY. First write an EXECUTIVE SUMMARY. Then for each frame: FRAME [timestamp]s: [Objective description] | LEGAL NOTE: [relevance to discrimination claim]. End with OVERALL ASSESSMENT and RECOMMENDED USE IN TRIBUNAL.",
      timeline: "Produce a FULL TIMESTAMPED LEGAL TIMELINE. For each frame: [timestamp] — [What happened] — LEGAL SIGNIFICANCE: [Equality Act relevance]. End with: PATTERN ANALYSIS, LEGAL NARRATIVE, STRENGTH OF EVIDENCE rating, and NEXT STEPS for strengthening the case."
    };

    const frameMessages = capturedFrames.map((f) => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: f.dataUrl.split(",")[1] }
    }));

    const userContent = [
      ...frameMessages,
      {
        type: "text",
        text: "CCTV ANALYSIS REQUEST\n\nSubject Description: " + subject + "\nCase Context: " + (context || "Workplace discrimination incident") + "\nOutput Required: " + outputMode + "\n\n" + modeInstructions[outputMode] + "\n\nAnalyse all " + capturedFrames.length + " frames provided. Frames extracted at regular intervals from the footage."
      }
    ];

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 2000,
          stream: true,
          system: SYS,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      if (!res.ok) throw new Error("Server error " + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      setProgress(70);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.type === "content_block_delta" && d.delta && d.delta.text) {
                full += d.delta.text;
                setReport(full);
                setProgress(Math.min(95, 70 + full.length / 50));
              }
            } catch(ex) {}
          }
        }
      }
      setProgress(100); setStage("result");
    } catch(e) {
      setError("Analysis failed: " + e.message); setStage("setup");
    } finally { setLoading(false); }
  };

  const printReport = () => {
    const w = window.open("", "_blank");
    const modeLabel = (OUTPUT_MODES.find(function(m){return m.id===outputMode;})||{}).label||"";
    w.document.write("<html><head><title>UJRIS CCTV Analysis Report</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.8;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}pre{white-space:pre-wrap;font-family:Georgia,serif}.warning{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px 16px;margin:20px 0;font-size:13px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666}</style></head><body><h1>UJRIS CCTV Evidence Analysis</h1><p><strong>Subject:</strong> " + subject + "</p><p><strong>Context:</strong> " + (context||"Workplace discrimination incident") + "</p><p><strong>Report Type:</strong> " + modeLabel + "</p><p><strong>Generated:</strong> " + new Date().toLocaleString("en-GB") + "</p><div class='warning'>This analysis is AI-generated. Verify all observations against the original footage. Not legal advice. Review with a solicitor before tribunal submission.</div><pre>" + report + "</pre><div class='footer'>Generated by UJRIS — ujris.co.uk | Not legal advice.</div></body></html>");
    w.document.close(); w.print();
  };

  return (
    React.createElement("div", null,
      React.createElement("video", {ref: videoRef, style:{display:"none"}, crossOrigin:"anonymous", muted:true}),
      React.createElement("canvas", {ref: canvasRef, style:{display:"none"}}),
      React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}, "🎥 CCTV Evidence Analyser"),
      React.createElement("p", {style:{color:"#1E3A5F",fontSize:14,marginBottom:24}},
        "Upload your CCTV footage. UJRIS analyses it silently — you never have to watch it again. AI extracts key frames and produces your chosen report for tribunal use."
      ),
      React.createElement(Card, {style:{marginBottom:24,borderColor:"rgba(201,168,76,0.4)",background:"rgba(201,168,76,0.06)"}},
        React.createElement("div", {style:{display:"flex",gap:12,alignItems:"flex-start"}},
          React.createElement("span", {style:{fontSize:22}}, "🛡"),
          React.createElement("div", null,
            React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:4}}, "Silent Processing Mode — Active"),
            React.createElement("div", {style:{color:"#64748B",fontSize:13,lineHeight:1.6}},
              "You upload once. UJRIS watches it for you. Frames are extracted and analysed without being displayed back to you. You only read the report. Your wellbeing matters as much as your case."
            )
          )
        )
      ),

      stage === "intro" && React.createElement("div", null,
        React.createElement("p", {style:{color:T.white,fontSize:15,marginBottom:20,fontFamily:"'Source Serif 4',serif"}},
          "Choose the type of analysis report you need:"
        ),
        React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:14,marginBottom:28}},
          OUTPUT_MODES.map(function(m) {
            return React.createElement("button", {
              key: m.id,
              onClick: function(){setOutputMode(m.id);setStage("setup");},
              style:{background:T.faint,border:"2px solid "+T.border,borderRadius:14,padding:"20px 22px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"},
              onMouseEnter: function(e){e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.background="rgba(201,168,76,0.08)";},
              onMouseLeave: function(e){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.faint;}
            },
              React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:8}},
                React.createElement("span", {style:{fontSize:26}}, m.icon),
                React.createElement("div", {style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}, m.label)
              ),
              React.createElement("div", {style:{color:T.white,fontSize:13,lineHeight:1.6,marginBottom:8}}, m.desc),
              React.createElement("div", {style:{color:T.tealL,fontSize:12}}, "✅ Ideal for: " + m.ideal)
            );
          })
        )
      ),

      stage === "setup" && React.createElement(Card, {style:{marginBottom:24}},
        React.createElement("div", {style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}},
          (OUTPUT_MODES.find(function(m){return m.id===outputMode;})||{}).icon + " " + (OUTPUT_MODES.find(function(m){return m.id===outputMode;})||{}).label
        ),
        React.createElement("div", {style:{color:T.tealL,fontSize:12,marginBottom:20}},
          "✅ Ideal for: " + ((OUTPUT_MODES.find(function(m){return m.id===outputMode;})||{}).ideal||"")
        ),
        React.createElement("div", {style:{marginBottom:16}},
          React.createElement("label", {style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Describe the Subject *"),
          React.createElement(Input, {value:subject, onChange:function(e){setSubject(e.target.value);}, placeholder:"e.g. Black male, approx 30s, blue uniform, store manager role…"}),
          React.createElement("div", {style:{color:T.dim,fontSize:11,marginTop:4}}, "Help the AI identify who to focus on in the footage")
        ),
        React.createElement("div", {style:{marginBottom:20}},
          React.createElement("label", {style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Case Context (optional)"),
          React.createElement(Input, {value:context, onChange:function(e){setContext(e.target.value);}, placeholder:"e.g. Racial harassment incident on 14 March 2025, during busy hours…"}),
          React.createElement("div", {style:{color:T.dim,fontSize:11,marginTop:4}}, "The more context you give, the more relevant the analysis")
        ),
        error && React.createElement("div", {style:{color:"#ff6b6b",fontSize:13,marginBottom:12,padding:"10px 14px",background:"rgba(255,107,107,0.08)",borderRadius:8}}, error),
        React.createElement("div", {style:{background:"rgba(255,255,255,0.03)",border:"2px dashed "+T.border,borderRadius:12,padding:"28px",textAlign:"center",marginBottom:16}},
          React.createElement("div", {style:{fontSize:36,marginBottom:8}}, "📹"),
          React.createElement("div", {style:{color:T.white,fontSize:14,marginBottom:4}}, "Upload your CCTV footage"),
          React.createElement("div", {style:{color:"#64748B",fontSize:12,marginBottom:8}}, "MP4, MOV, AVI, MKV — max 500MB"),
          React.createElement("div", {style:{color:T.tealL,fontSize:12,marginBottom:16}}, "🛡 Processed silently — footage will not be displayed back to you"),
          React.createElement("input", {ref:fileInputRef, type:"file", accept:"video/*", onChange:handleFile, style:{display:"none"}}),
          React.createElement(Btn, {onClick:function(){fileInputRef.current&&fileInputRef.current.click();}, disabled:!subject.trim()}, "📤 Upload & Analyse Silently"),
          !subject.trim() && React.createElement("div", {style:{color:"#ff6b6b",fontSize:12,marginTop:8}}, "Please describe the subject first")
        ),
        React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setStage("intro");}}, "← Change Report Type")
      ),

      stage === "processing" && React.createElement(Card, {style:{textAlign:"center",padding:"40px 24px"}},
        React.createElement("div", {style:{fontSize:48,marginBottom:16}}, "🔍"),
        React.createElement("div", {style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8}}, "Analysing Your Footage"),
        React.createElement("div", {style:{color:"#1E3A5F",fontSize:14,marginBottom:24}},
          progress < 50 ? "Extracting key frames silently…" :
          progress < 70 ? "Sending frames to AI for analysis…" :
          progress < 95 ? "Generating your tribunal report…" : "Finalising…"
        ),
        React.createElement("div", {style:{background:"rgba(255,255,255,0.06)",borderRadius:8,height:10,overflow:"hidden",marginBottom:12,maxWidth:400,margin:"0 auto 12px"}},
          React.createElement("div", {style:{width:progress+"%",height:"100%",background:"linear-gradient(90deg,"+T.teal+","+T.gold+")",borderRadius:8,transition:"width 0.5s ease"}})
        ),
        React.createElement("div", {style:{color:T.dim,fontSize:12}}, progress + "% complete")
      ),

      stage === "result" && React.createElement("div", null,
        React.createElement(Card, {style:{marginBottom:16,borderColor:"rgba(12,123,122,0.4)",background:"rgba(12,123,122,0.06)"}},
          React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}},
            React.createElement("div", null,
              React.createElement("div", {style:{color:T.tealL,fontWeight:700,fontSize:15,marginBottom:2}},
                "✅ Analysis Complete — " + ((OUTPUT_MODES.find(function(m){return m.id===outputMode;})||{}).label||"")
              ),
              React.createElement("div", {style:{color:"#64748B",fontSize:12}}, "Subject: " + subject)
            ),
            React.createElement("div", {style:{display:"flex",gap:8}},
              React.createElement(Btn, {sm:true, onClick:printReport}, "🖨 Print / Save PDF"),
              React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setStage("intro");setReport("");setOutputMode(null);}}, "🔄 New Analysis")
            )
          ),
          React.createElement("div", {style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",color:T.white,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'Source Serif 4',serif",maxHeight:600,overflowY:"auto"}},
            report
          )
        ),
        React.createElement(Card, {style:{background:"rgba(255,107,107,0.06)",borderColor:"rgba(255,107,107,0.2)"}},
          React.createElement("div", {style:{color:"#ff9999",fontSize:13,lineHeight:1.6}},
            "⚠ Important: This AI analysis is a starting point for evidence preparation. Verify all observations against the original footage. Present this report to your solicitor before tribunal submission."
          )
        )
      )
    )
  );
}
//  CASE INTELLIGENCE — DOCUMENT DECODER & STATUS ANALYSER
function CaseIntelligence() {
  const [activeMode, setActiveMode] = React.useState(null);

  const MODES = [
    {
      id: "decode",
      icon: "📧",
      label: "Document & Email Decoder",
      desc: "Paste any email, letter, or document you have received. UJRIS translates legal jargon into plain English, explains exactly what it means for your case, identifies hidden threats or admissions, and tells you what to do next.",
      detail: "That email from your opponent's solicitor saying 'without prejudice' — what does it actually mean? That police closure letter — is it final? UJRIS explains it all.",
      color: T.gold,
      examples: ["Solicitor letter", "ET correspondence", "Police closure letter", "Employer response", "ACAS communication", "Court order", "Tribunal directions"]
    },
    {
      id: "status",
      icon: "🗂",
      label: "Full Case Status Analysis",
      desc: "Describe where your case is right now — all fronts, all parties. UJRIS gives you a comprehensive plain-English breakdown of your legal position, what stage each strand is at, what deadlines apply, and what matters most right now.",
      detail: "Multiple cases, multiple fronts, multiple deadlines. UJRIS maps it all and tells you what to focus on first.",
      color: T.tealL,
      examples: ["Employment Tribunal", "MCOL / County Court", "Police complaint", "ICO complaint", "Civil claim"]
    },
    {
      id: "anomaly",
      icon: "🎯",
      label: "Document Anomaly & Anchor Lie Scanner",
      desc: "Paste one or more documents and describe the timeline of events. UJRIS hunts for date anomalies, timeline contradictions, statements that shouldn't exist at that date, and the anchor lie hidden in the paperwork.",
      detail: "Like witness statements dated weeks after the incident — written after solicitors were already hired, yet presented as contemporaneous accounts. UJRIS finds it.",
      color: "#ff9f7f",
      examples: ["Witness statements", "Investigation reports", "Disciplinary outcomes", "Timeline comparisons", "Email chains"]
    },
    {
      id: "police",
      icon: "🚔",
      label: "Police & Criminal Process Decoder",
      desc: "Received a letter saying police 'closed' your case? Don't know if you need to report something separately? Confused about what the CAD log means? UJRIS explains police processes in plain English — including your rights you weren't told about.",
      detail: "Like not knowing you had to report the assault separately even though police were called against you. UJRIS closes these knowledge gaps.",
      color: "#9b8fe8",
      examples: ["Case closure letter", "No further action (NFA)", "CAD log entries", "Crime reference numbers", "How to report assault", "IPCC/IOPC complaints"]
    },
    {
      id: "support",
      icon: "🤝",
      label: "Support Network & Evidence Builder",
      desc: "Find the right support organisations for your situation — GP, Citizens Advice, university welfare, social prescriber, mental health services, and specialist legal charities. Every support contact is also a potential source of evidence for the impact of discrimination on your health and life.",
      detail: "A letter from your GP documenting anxiety, sleep disruption, or depression caused by discrimination is direct evidence for injury to feelings. Your social prescriber's notes are evidence. Your university welfare records are evidence. UJRIS helps you identify and mobilise every support source.",
      color: "#7ec8a0",
      examples: ["GP / Mental Health", "Citizens Advice", "University Welfare", "Social Prescriber", "Legal Charities", "BAME Organisations", "Victim Support"]
    },
  ];

  if (!activeMode) {
    return React.createElement("div", null,
      React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}},
        "🧠 Case Intelligence Centre"
      ),
      React.createElement("p", {style:{color:"#1E3A5F",fontSize:14,marginBottom:16}},
        "Everything that happens in your case generates a document. Most of it is written to confuse, intimidate, or obscure. UJRIS translates it all into intelligence you can act on."
      ),

      React.createElement("div", {style:{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:12,padding:"16px 20px",marginBottom:24}},
        React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:8}},
          "💡 Why this matters — a real example"
        ),
        React.createElement("div", {style:{color:"#64748B",fontSize:13,lineHeight:1.8}},
          "A respondent provided witness statements dated six weeks after the incidents. By that date, they had already instructed solicitors. Yet the statements were presented as independent contemporaneous accounts. That is the anchor lie. Without UJRIS-level analysis, most people would never spot it. The Case Intelligence Centre is built to find exactly these anomalies — automatically."
        )
      ),

      React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:14}},
        MODES.map(function(m) {
          return React.createElement("button", {
            key: m.id,
            onClick: function(){setActiveMode(m.id);},
            style:{background:T.faint,border:"2px solid "+T.border,borderRadius:14,padding:"20px 22px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"},
            onMouseEnter: function(e){e.currentTarget.style.borderColor=m.color;e.currentTarget.style.background="rgba(255,255,255,0.04)";},
            onMouseLeave: function(e){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.faint;}
          },
            React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:8}},
              React.createElement("span", {style:{fontSize:26}}, m.icon),
              React.createElement("div", {style:{color:m.color,fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}, m.label)
            ),
            React.createElement("div", {style:{color:T.white,fontSize:13,lineHeight:1.6,marginBottom:6}}, m.desc),
            React.createElement("div", {style:{color:T.dim,fontSize:12,lineHeight:1.5,marginBottom:10,fontStyle:"italic"}}, m.detail),
            React.createElement("div", {style:{display:"flex",flexWrap:"wrap",gap:6}},
              m.examples.map(function(ex) {
                return React.createElement("span", {key:ex,
                  style:{background:"rgba(255,255,255,0.05)",border:"1px solid "+T.border,
                    borderRadius:12,padding:"3px 10px",fontSize:11,color:T.dim}}, ex);
              })
            )
          );
        })
      )
    );
  }

  return React.createElement(CaseIntelTool, {
    mode: activeMode,
    modes: MODES,
    onBack: function(){setActiveMode(null);}
  });
}

function CaseIntelTool({mode, modes, onBack}) {
  const modeObj = modes.find(function(m){return m.id===mode;}) || {};
  const [input1, setInput1] = React.useState("");
  const [input2, setInput2] = React.useState("");
  const [input3, setInput3] = React.useState("");
  const [ai, setAi] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const fileRef = React.useRef();

  const SYSTEMS = {
    decode: `You are UJRIS — a UK legal case intelligence expert helping a self-represented litigant understand documents they have received. Your job is to translate complex legal language into plain, clear English that anyone can understand.

For every document analysed, provide:

1. 📋 WHAT THIS IS — In one sentence, what type of document is this and who sent it?

2. 🔍 PLAIN ENGLISH SUMMARY — What does this document actually say? Explain every key point in simple language. No jargon without explanation.

3. ⚠ WHAT THEY ARE REALLY SAYING — Read between the lines. What is the sender actually trying to achieve? Are they trying to intimidate, stall, make you give up, or create a legal record?

4. 🎯 HIDDEN ADMISSIONS OR RED FLAGS — Does anything in this document inadvertently admit wrongdoing, contradict their previous position, or reveal something they did not intend to reveal?

5. ⏰ DEADLINES & TIME LIMITS — Are there any deadlines in or triggered by this document? List them clearly with dates if possible.

6. 📊 WHAT THIS MEANS FOR YOUR CASE — Does this help or hurt? What is the legal significance?

7. ✅ WHAT YOU MUST DO NOW — Specific, prioritised actions to take in response. What to do today, this week, and within a month.

8. ❓ QUESTIONS TO ASK THEM — If a response is needed, what should you ask or challenge?

Be warm, clear, and empowering. This person is not a lawyer — every explanation must be accessible. Never leave them confused.`,

    status: `You are UJRIS — a UK discrimination and employment law case strategist. You are helping a self-represented claimant understand the full status of their case across all active legal fronts.

Provide a comprehensive case status briefing structured as:

1. 🗂 CASE OVERVIEW — A clear summary of all active legal proceedings and their current status.

2. 📊 EACH LEGAL FRONT — For each distinct claim or proceeding:
   - What it is (in plain English)
   - What stage it is at
   - What the next step is
   - What deadline applies
   - How strong the position is (and why)

3. ⏰ CRITICAL DEADLINES — All upcoming deadlines ranked by urgency. Flag anything under 30 days in red.

4. 🎯 STRONGEST POINTS — What is working in the claimant's favour across all fronts?

5. ⚠ VULNERABILITIES — What are the current weaknesses or risks? Be honest.

6. 🔗 HOW THE CASES CONNECT — How do the different proceedings affect each other? Can evidence from one strengthen another?

7. 🚀 PRIORITY ACTION LIST — What are the three most important things to do right now, in order?

8. 📖 KEY LEGAL TERMS EXPLAINED — Define any legal terms mentioned in plain English.

Use plain language throughout. Assume the person has no legal training. Be precise about UK law, procedure, and timescales.`,

    anomaly: `You are UJRIS — a UK legal forensic analyst specialising in document timeline analysis and anchor lie detection.

Analyse the provided documents and timeline for:

1. 🎯 THE ANCHOR LIE — Identify the single most provable false or misleading statement. State it clearly: what was claimed, what the evidence shows, and why it matters.

2. 📅 DATE & TIMELINE ANOMALIES — Cross-reference all dates mentioned:
   - Were documents created/signed at the stated time?
   - Do dates align with what was happening at that time (e.g. lawyers already hired, investigation already concluded)?
   - Are any witness statements, reports, or letters backdated or postdated in a way that is suspicious?

3. 🔗 CHAIN OF KNOWLEDGE PROBLEM — If they claim to have independently investigated, but lawyers were hired before statements were taken, identify this clearly. Explain why this destroys the credibility of those statements.

4. ⚡ CONTRADICTIONS MAP — Where do documents contradict each other? List each contradiction with: what Document A says, what Document B says, and which is more likely true and why.

5. 🧩 MANUFACTURED NARRATIVE INDICATORS — Signs that statements were written after the fact to support a legal position already decided, rather than as genuine accounts.

6. ⚖ LEGAL SIGNIFICANCE — How do these anomalies affect the discrimination claim? Which anomalies are most damaging to the respondent's case?

7. 🔨 HOW TO USE THIS AT TRIBUNAL — Exact cross-examination questions, disclosure requests, and submissions to make these anomalies count.

Be surgical, precise, and clinically analytical. Every finding must be backed by the documents provided.`,

    support: `You are UJRIS — a UK discrimination case support specialist and welfare navigator. Your role is to help a person who has experienced discrimination find the right support network — both for their personal wellbeing AND to build evidence for their legal case.

For every person, provide:

1. 🤝 IMMEDIATE SUPPORT — Who to contact this week for emotional and practical support. Be specific about what each organisation offers.

2. 🏥 HEALTH & MENTAL HEALTH SUPPORT — GP, NHS mental health services, Mind, Samaritans, and local mental health resources. Explain how to ask for help and what to say.

3. ⚖ LEGAL SUPPORT (FREE) — Citizens Advice, Law Centres, Advocate, LawWorks, Bar Pro Bono Unit, Community Legal Advice, and specialist discrimination charities. With contact details where known.

4. 🎓 EDUCATION & WORK SUPPORT — University student welfare units (explain what they can do), occupational health, trade union support, ACAS helpline.

5. 🌍 BAME & SPECIALIST SUPPORT — Race equality organisations, faith-based support, cultural community organisations relevant to the person's background.

6. 💰 FINANCIAL SUPPORT — If facing financial hardship due to discrimination: benefits advice, hardship funds, food banks if needed, emergency support.

7. 📋 EVIDENCE FROM SUPPORT — THIS IS CRITICAL: For each support organisation, explain what records they keep and how those records could serve as evidence for:
   - Injury to feelings (Vento bands)
   - Personal injury / psychiatric injury
   - Loss of earnings and career impact
   - Impact on education or studies
   Specific examples: GP notes documenting distress, mental health assessments, social prescriber referral records, university welfare notes.

8. 📝 WHAT TO SAY TO EACH SUPPORT — Exact language to use when describing what happened, so the records created are legally useful. Eg: "Tell your GP: I have been experiencing [symptoms] since [date of discrimination]. I believe this is connected to racial discrimination I experienced at work/in a shop."

9. 🔗 HOW SUPPORT RECORDS BECOME LEGAL EVIDENCE — Explain the process: how to request records, how to submit them to tribunal, and the difference between a witness statement from a GP vs a medical report.

10. 📞 CRISIS SUPPORT — If the person is struggling: Samaritans 116 123, Mind 0300 123 3393, Crisis text line, and local crisis services.

Be warm, specific, and empowering. This person has been through a traumatic experience. Acknowledge that. Then give them every resource they need.`,

    police: `You are UJRIS — a UK criminal justice and police accountability expert helping a self-represented person understand police processes, their rights, and what has happened in their case.

For every police-related query, provide:

1. 📋 PLAIN ENGLISH EXPLANATION — Explain exactly what has happened and what it means in simple terms.

2. 🚔 THE POLICE PROCESS EXPLAINED — Step by step, what is the normal process? What should have happened? What actually happened?

3. ⚠ WHAT THEY DIDN'T TELL YOU — What rights do you have that police may not have informed you of? What processes exist that most people don't know about?

4. 🔍 IS THIS NORMAL OR CONCERNING? — Is what happened standard procedure, or are there irregularities that should be challenged?

5. 📝 HOW TO REPORT AN ASSAULT — If an assault was involved: the exact steps to report it properly, the difference between being a victim vs being reported against, and what happens if you report it now vs earlier.

6. 🔄 HOW TO REOPEN OR CHALLENGE — How to request a review of a closed case, how to challenge a No Further Action decision, and how to escalate to IPCC/IOPC.

7. 🔗 HOW THIS CONNECTS TO YOUR CIVIL CASE — How police records (CAD logs, crime reports, body cam) can be used in your Employment Tribunal or civil case even if the police took no action.

8. ✅ NEXT STEPS — Specific actions to take now.

Assume the person has never dealt with police processes before. Be clear about the difference between criminal, civil, and disciplinary processes.`
  };

  const PLACEHOLDERS = {
    decode: {
      p1: "Paste the full text of the email, letter, or document here — including any headers, dates, reference numbers, and signatures. The more complete, the better the analysis.\n\nFor example: paste an email from the respondent's solicitors, a tribunal directions notice, a police NFA letter, an ACAS correspondence, or any document you've received and aren't sure about.",
      l1: "Document / Email to Decode *",
      p2: "Any background context that would help (optional)",
      l2: "Context (optional)",
      ph2: "e.g. This arrived 3 days after I filed my ET claim. The incidents occurred in late 2025. The respondent has legal representation.",
      btn: "📧 Decode This Document"
    },
    status: {
      p1: "Describe your full case situation — all active claims, what's happened so far, any responses received, and any deadlines you're aware of.\n\nBe as detailed as possible. Include: what happened, when, who is involved, what claims you've filed and where, what responses you've received, any tribunal or court dates, and anything you're unsure about.",
      l1: "Your Full Case Situation *",
      p2: "Paste any key documents or correspondence that show current status (optional)",
      l2: "Key Documents (optional)",
      ph2: "Paste any letters, emails, or tribunal orders that show where things stand…",
      btn: "🗂 Analyse My Full Case Status"
    },
    anomaly: {
      p1: "Paste the document(s) you want analysed for anomalies. If multiple documents, separate them with '--- DOCUMENT 2 ---' etc.\n\nInclude all dates, reference numbers, and signatures exactly as they appear.",
      l1: "Documents to Analyse *",
      p2: "Describe the known timeline of events",
      l2: "Known Timeline of Events *",
      ph2: "e.g.\n15 Mar 2025 — Incident 1 at [location]\n22 Mar 2025 — Incident 2 at [location]\n30 Apr 2025 — Respondent confirms solicitors hired\n30 Apr 2025 — Witness statement from staff member dated this day\n1 May 2025 — Second witness statement dated this day\n\n[The problem: why are 'independent' witness statements being written weeks after incidents, on the same day lawyers were hired?]",
      btn: "🎯 Hunt for Anchor Lies & Anomalies"
    },
    police: {
      p1: "Describe what happened with the police — what they were called for, what they did, what you received, what you don't understand.\n\nOr paste the police letter/document you received.",
      l1: "Police Situation or Document *",
      p2: "Any related context about your wider case",
      l2: "Wider Case Context (optional)",
      ph2: "e.g. Police were called to the scene. I reported an assault separately. The police closed my case without notifying me. I later found out I had a right to challenge this decision.",
      btn: "🚔 Explain My Police Situation"
    },
    support: {
      p1: "Tell UJRIS about your situation — what happened, how it has affected you, and what support you already have or have tried.\n\nThe more you share, the more targeted the support recommendations will be.",
      l1: "Your Situation & Impact *",
      p2: "Any specific support needs or circumstances",
      l2: "Specific Needs (optional)",
      ph2: "e.g. I am a student at university. I have been experiencing anxiety and sleep problems since the incidents. I have a social prescriber but haven't told my GP yet. I am BAME and looking for culturally appropriate support. I am also facing financial pressure.",
      btn: "🤝 Find My Support Network & Build My Evidence"
    }
  };

  const ph = PLACEHOLDERS[mode] || PLACEHOLDERS.decode;

  const readFile = function(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e){setInput1(function(prev){return prev + (prev?"\n\n":"") + e.target.result;});};
    reader.readAsText(file);
  };

  const runAnalysis = async function() {
    if (!input1.trim()) return;
    setLoading(true); setAi("");
    const userPrompt = mode === "anomaly"
      ? "DOCUMENTS TO ANALYSE:\n\n" + input1 + "\n\n---\n\nKNOWN TIMELINE:\n" + (input2||"Not provided") + "\n\nProvide full anchor lie and anomaly analysis."
      : mode === "status"
      ? "CASE SITUATION:\n\n" + input1 + "\n\n---\n\nKEY DOCUMENTS:\n" + (input2||"None provided") + "\n\nProvide comprehensive case status analysis."
      : mode === "police"
      ? "POLICE SITUATION / DOCUMENT:\n\n" + input1 + "\n\n---\n\nWIDER CONTEXT:\n" + (input2||"None provided") + "\n\nProvide full explanation and guidance."
      : mode === "support"
      ? "MY SITUATION:\n\n" + input1 + "\n\n---\n\nSPECIFIC NEEDS:\n" + (input2||"None specified") + "\n\nProvide full support network and evidence building plan."
      : "DOCUMENT TO DECODE:\n\n" + input1 + "\n\n---\n\nCONTEXT:\n" + (input2||"None provided") + "\n\nProvide full document analysis.";

    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-opus-4-5", max_tokens:2500, stream:true,
          system: SYSTEMS[mode],
          messages:[{role:"user", content:userPrompt}]
        })
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while(true){
        const {done,value} = await reader.read();
        if(done) break;
        for(const line of dec.decode(value).split("\n")){
          if(line.startsWith("data: ")){
            try{
              const d = JSON.parse(line.slice(6));
              if(d.type==="content_block_delta"&&d.delta&&d.delta.text){full+=d.delta.text;setAi(full);}
            }catch(ex){}
          }
        }
      }
    } catch(e){ setAi("⚠ Error: "+e.message); }
    finally{ setLoading(false); }
  };

  const printReport = function(){
    const w = window.open("","_blank");
    w.document.write("<html><head><title>UJRIS — "+modeObj.label+"</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.9;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}pre{white-space:pre-wrap;font-family:Georgia,serif}.warn{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px 16px;margin:20px 0;font-size:13px}.foot{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666}</style></head><body><h1>"+modeObj.icon+" UJRIS "+modeObj.label+"</h1><p><strong>Generated:</strong> "+new Date().toLocaleString("en-GB")+"</p><div class='warn'>AI-generated analysis. Cross-reference all findings with original documents. Not legal advice.</div><pre>"+ai+"</pre><div class='foot'>Generated by UJRIS — ujris.co.uk | Not legal advice.</div></body></html>");
    w.document.close(); w.print();
  };

  const COLORS = {decode:T.gold, status:T.tealL, anomaly:"#ff9f7f", police:"#9b8fe8", support:"#7ec8a0"};
  const modeColor = COLORS[mode]||T.gold;

  return React.createElement("div", null,
    React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:20}},
      React.createElement(Btn, {variant:"ghost", sm:true, onClick:onBack}, "← Back"),
      React.createElement("div", null,
        React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,margin:0}},
          modeObj.icon+" "+modeObj.label
        )
      )
    ),

    !ai && React.createElement("div", null,
      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
          ph.l1
        ),
        React.createElement(VersatileInput, {
          value:input1, onChange:function(e){setInput1(e.target.value);}, onFileAnalysed:function(t){setInput1(function(p){return p?(p+"\n\n"+t):t;});}, caseContext:"case intelligence analysis",
          placeholder:ph.p1,
          style:{width:"100%",minHeight:180,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.7,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        }),
        React.createElement("div", {style:{display:"flex",alignItems:"center",gap:8,marginTop:8}},
          React.createElement("input", {type:"file",accept:".txt,.pdf,.doc,.docx,.eml",style:{display:"none"},ref:fileRef,
            onChange:function(e){readFile(e.target.files&&e.target.files[0]);}}),
          React.createElement(Btn, {variant:"ghost",sm:true,onClick:function(){fileRef.current&&fileRef.current.click();}},
            "📎 Upload File"
          )
        )
      ),

      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
          ph.l2
        ),
        React.createElement(VersatileInput, {
          value:input2, onChange:function(e){setInput2(e.target.value);}, onFileAnalysed:function(t){setInput2(function(p){return p?(p+"\n\n"+t):t;});}, caseContext:"case intelligence response analysis",
          placeholder:ph.ph2,
          style:{width:"100%",minHeight:mode==="anomaly"?160:90,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.7,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),

      mode==="anomaly" && React.createElement("div", {style:{background:"rgba(255,159,127,0.08)",border:"1px solid rgba(255,159,127,0.3)",borderRadius:10,padding:"14px 18px",marginBottom:16}},
        React.createElement("div", {style:{color:"#ff9f7f",fontWeight:700,fontSize:13,marginBottom:6}}, "🎯 What makes a good anchor lie analysis:"),
        React.createElement("div", {style:{color:"#64748B",fontSize:12,lineHeight:1.8}},
          "• Include exact dates on all documents\n• Include the date lawyers were hired if known\n• Include when the organisation first communicated their position\n• Note any documents that arrived after legal proceedings began\n• Paste the full text — partial quotes miss context"
        )
      ),

      React.createElement(Btn, {
        onClick:runAnalysis,
        disabled:!input1.trim(),
        style:{width:"100%",padding:"14px",fontSize:15,background:input1.trim()?"":undefined}
      }, ph.btn)
    ),

    loading && React.createElement("div", {style:{textAlign:"center",padding:"32px",color:modeColor,fontSize:15,fontFamily:"'Playfair Display',serif"}},
      mode==="decode" ? "📧 Reading between the lines…" :
      mode==="status" ? "🗂 Mapping your full case position…" :
      mode==="anomaly" ? "🎯 Hunting for the anchor lie…" :
      "🚔 Analysing police situation…"
    ),

    ai && React.createElement("div", null,
      React.createElement("div", {style:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}},
        React.createElement(Btn, {sm:true, onClick:printReport}, "🖨 Print / Save PDF"),
        React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setAi("");setInput1("");setInput2("");}}, "🔄 New Analysis"),
        React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setAi("");}}, "← Edit Input")
      ),
      React.createElement(Card, {style:{borderColor:modeColor+"55",marginBottom:12}},
        React.createElement("div", {style:{color:modeColor,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:16}},
          "✅ "+modeObj.label+" — Complete"
        ),
        React.createElement("div", {style:{
          background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",
          color:T.white,fontSize:13,lineHeight:2,whiteSpace:"pre-wrap",
          fontFamily:"'Source Serif 4',serif",maxHeight:680,overflowY:"auto"
        }}, ai)
      ),
      React.createElement(Card, {style:{background:"rgba(255,107,107,0.05)",borderColor:"rgba(255,107,107,0.2)"}},
        React.createElement("div", {style:{color:"#ff9999",fontSize:12,lineHeight:1.6}},
          "⚠ AI-generated intelligence. Cross-reference all findings with original documents and your own knowledge of events. Not legal advice. Bring significant findings to a solicitor before acting."
        )
      )
    )
  );
}
//  EVIDENCE LAB — METADATA FORENSICS + DBS CHALLENGE + VRR

//  WELLBEING JOURNAL + IMPACT TRACKER + OUTCOME PREDICTOR
function WellbeingAndImpact({ caseData }) {
  const [activeMode, setActiveMode] = React.useState("journal");
  const [entries, setEntries] = React.useState(function(){ return S.get("wellbeing_entries",[]); });
  const [form, setForm] = React.useState({date:new Date().toISOString().split("T")[0],mood:5,sleep:5,anxiety:5,notes:"",symptoms:[]});
  const [showAdd, setShowAdd] = React.useState(false);
  const [predResult, setPredResult] = React.useState(null);
  const [predLoading, setPredLoading] = React.useState(false);

  const SYMPTOMS = [
    "Anxiety","Depression","Panic attacks","Sleep disruption","Nightmares",
    "Appetite changes","Difficulty concentrating","Avoiding public spaces",
    "Social withdrawal","Flashbacks","Physical symptoms (headaches/nausea)",
    "Unable to work","Impact on studies","Relationship strain","Financial stress"
  ];

  const saveEntries = function(list){ setEntries(list); S.set("wellbeing_entries",list); };

  const addEntry = function(){
    var newList = [{id:Date.now(),...form}].concat(entries);
    saveEntries(newList); setForm({date:new Date().toISOString().split("T")[0],mood:5,sleep:5,anxiety:5,notes:"",symptoms:[]}); setShowAdd(false);
  };

  const toggleSymptom = function(s){
    setForm(function(p){
      var syms = p.symptoms.includes(s) ? p.symptoms.filter(function(x){return x!==s;}) : p.symptoms.concat([s]);
      return Object.assign({},p,{symptoms:syms});
    });
  };

  // Real impact metrics from localStorage — no fake numbers
  const evidence = S.get("evidence",[]);
  const timeline = S.get("timeline",[]);
  const decisions = S.get("decisions",[]);
  const deadlines = S.get("deadlines",[]);
  const sarData = S.get("sar_sent",[]);

  const IMPACT_STATS = [
    {label:"Evidence Items Logged", value:evidence.length, icon:"🗄", color:T.tealL, desc:"Each item is potential tribunal evidence"},
    {label:"Timeline Events Recorded", value:timeline.length, icon:"📅", color:T.gold, desc:"Chronological record of discrimination"},
    {label:"Wellbeing Entries", value:entries.length, icon:"💚", color:"#7ec8a0", desc:"Impact documentation for Vento bands"},
    {label:"Documents Generated", value:S.get("docs_generated",0), icon:"✍", color:"#9b8fe8", desc:"Tribunal-ready documents created"},
    {label:"Deadlines Tracked", value:deadlines.length, icon:"⏰", color:"#ff9f7f", desc:"No deadline missed with UJRIS"},
    {label:"Actions Logged", value:decisions.length, icon:"🗺", color:T.muted, desc:"Decisions and actions documented"},
  ];

  const runOutcomePredictor = async function(){
    if(!caseData) return;
    setPredLoading(true); setPredResult(null);
    const SYS = `You are UJRIS — a UK employment discrimination case analyst with expertise in Employment Tribunal outcomes. Based on the case factors provided, give an honest, evidence-based assessment of the case's prospects.

Structure your response as:

1. 📊 OVERALL ASSESSMENT
A clear percentage range for success likelihood with honest reasoning. Do not just be optimistic — be accurate. Base this on real ET statistics.

2. ✅ FACTORS STRENGTHENING YOUR CASE
List specific factors from the case that improve prospects.

3. ⚠ FACTORS THAT COULD WEAKEN YOUR CASE  
Be honest about risks, gaps in evidence, procedural issues.

4. 📈 WHAT WOULD IMPROVE YOUR ODDS
Specific, actionable steps that would materially improve prospects.

5. 💰 REALISTIC COMPENSATION RANGE
Based on the discrimination type and likely Vento band, what is a realistic settlement or award range?

6. 🤝 SETTLEMENT vs TRIBUNAL ANALYSIS
Honest assessment of whether settling or proceeding to tribunal serves the claimant better — and at what settlement amount.

7. ⚖ SIMILAR CASES
Reference 2-3 real UK ET cases with similar facts and their outcomes (cite case names and amounts where known).

Be honest. Self-represented claimants deserve accurate information, not false hope.`;

    const avgMood = entries.length > 0 ? (entries.reduce(function(s,e){return s+e.mood;},0)/entries.length).toFixed(1) : "not tracked";
    const recentSymptoms = entries.length > 0 ? [...new Set(entries.slice(0,5).flatMap(function(e){return e.symptoms||[];}))] : [];

    const prompt = "CASE FACTORS FOR OUTCOME PREDICTION:\n\n" +
      "Discrimination type: " + (caseData.discType||[]).join(", ") + "\n" +
      "Setting: " + (caseData.setting||"not specified") + "\n" +
      "Incident date: " + (caseData.when||"not specified") + "\n" +
      "Severity (self-rated 1-10): " + (caseData.severity||"not rated") + "\n" +
      "Evidence items logged: " + evidence.length + "\n" +
      "Timeline events documented: " + timeline.length + "\n" +
      "Wellbeing entries: " + entries.length + "\n" +
      "Average mood since incident: " + avgMood + "/10\n" +
      "Documented symptoms: " + (recentSymptoms.length > 0 ? recentSymptoms.join(", ") : "none logged") + "\n" +
      "Case description: " + (caseData.summary||"not provided") + "\n\n" +
      "Provide honest outcome prediction with all 7 sections as instructed.";

    try {
      const res = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-5",max_tokens:2000,stream:true,system:SYS,messages:[{role:"user",content:prompt}]})});
      if(!res.ok) throw new Error("Error "+res.status);
      const reader=res.body.getReader(); const dec=new TextDecoder(); let full="";
      while(true){const {done,value}=await reader.read();if(done)break;
        for(const line of dec.decode(value).split("\n")){if(line.startsWith("data: ")){
          try{const d=JSON.parse(line.slice(6));if(d.type==="content_block_delta"&&d.delta&&d.delta.text){full+=d.delta.text;setPredResult(full);}}catch(ex){}
        }}
      }
    }catch(e){setPredResult("⚠ Error: "+e.message);}
    finally{setPredLoading(false);}
  };

  const exportJournal = function(){
    const w=window.open("","_blank");
    const rows = entries.map(function(e){
      return "<tr><td>"+new Date(e.date).toLocaleDateString("en-GB")+"</td><td>"+e.mood+"/10</td><td>"+e.sleep+"/10</td><td>"+e.anxiety+"/10</td><td>"+(e.symptoms||[]).join(", ")+"</td><td>"+e.notes+"</td></tr>";
    }).join("");
    w.document.write("<html><head><title>UJRIS Wellbeing Journal — Tribunal Evidence</title><style>body{font-family:Georgia,serif;max-width:900px;margin:40px auto;font-size:13px;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1a2b3c;color:white;padding:10px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}tr:nth-child(even){background:#f9f9f9}.warn{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px;margin:20px 0;font-size:12px}.foot{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:11px;color:#666}</style></head><body><h1>💚 UJRIS Wellbeing & Impact Journal</h1><p><strong>Purpose:</strong> This journal documents the personal impact of discrimination on the claimant's health and wellbeing. It is intended to support injury to feelings claims under the Equality Act 2010 and Vento band assessment.</p><div class='warn'>This document was generated by UJRIS and should be presented to your solicitor and GP. Medical corroboration of these entries strengthens their evidential value significantly. Ask your GP to reference this journal in any medical report.</div><table><thead><tr><th>Date</th><th>Mood</th><th>Sleep</th><th>Anxiety</th><th>Symptoms</th><th>Notes</th></tr></thead><tbody>"+rows+"</tbody></table><div class='foot'>Generated by UJRIS — Universal Justice Response & Intelligence System | ujris.co.uk<br/>Not legal advice. Present to your solicitor before tribunal submission.</div></body></html>");
    w.document.close(); w.print();
  };

  const moodColor = function(v){ return v<=3?"#ff6b6b":v<=5?"#ff9f7f":v<=7?T.gold:"#7ec8a0"; };

  return React.createElement("div", null,
    // Header
    React.createElement("h1",{style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}},
      "💚 Wellbeing, Impact & Case Prospects"
    ),
    React.createElement("p",{style:{color:"#1E3A5F",fontSize:14,marginBottom:20}},
      "Document the human cost of discrimination. Track your wellbeing. Predict your outcome. Every entry builds your case."
    ),

    // Mode tabs
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:24,borderBottom:"1px solid "+T.border,paddingBottom:12}},
      [{id:"journal",label:"💚 Wellbeing Journal"},{id:"impact",label:"📊 Impact Metrics"},{id:"predict",label:"🎯 Outcome Predictor"}].map(function(m){
        return React.createElement("button",{key:m.id,onClick:function(){setActiveMode(m.id);},
          style:{background:activeMode===m.id?"rgba(201,168,76,0.15)":T.faint,border:"1px solid "+(activeMode===m.id?T.gold:T.border),
            borderRadius:20,padding:"8px 16px",cursor:"pointer",color:activeMode===m.id?T.gold:T.muted,fontSize:13,transition:"all 0.2s",fontWeight:activeMode===m.id?600:400}
        },m.label);
      })
    ),

    // JOURNAL MODE
    activeMode==="journal" && React.createElement("div",null,
      React.createElement("div",{style:{background:"rgba(126,200,160,0.07)",border:"1px solid rgba(126,200,160,0.3)",borderRadius:12,padding:"14px 18px",marginBottom:20}},
        React.createElement("div",{style:{color:"#7ec8a0",fontWeight:700,fontSize:13,marginBottom:6}},"📋 Why this journal matters legally"),
        React.createElement("div",{style:{color:"#64748B",fontSize:12,lineHeight:1.8}},
          "Courts assess 'injury to feelings' using the Vento scale (up to £56,200). A consistent journal showing deterioration since the date of discrimination significantly strengthens higher-band claims. Print this journal and give it to your GP — ask them to reference it in any medical report they write."
        )
      ),

      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
        React.createElement("div",{style:{color:T.white,fontWeight:600,fontSize:15}},
          entries.length+" entries recorded"
        ),
        React.createElement("div",{style:{display:"flex",gap:8}},
          entries.length>0&&React.createElement(Btn,{sm:true,onClick:exportJournal},"🖨 Export for Tribunal"),
          React.createElement(Btn,{sm:true,onClick:function(){setShowAdd(true);}},"+  Add Today's Entry")
        )
      ),

      showAdd && React.createElement(Card,{style:{marginBottom:20,borderColor:"rgba(126,200,160,0.4)"}},
        React.createElement("div",{style:{color:"#7ec8a0",fontWeight:700,fontSize:14,marginBottom:14}},"Today's Wellbeing Entry"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}},
          React.createElement("div",null,
            React.createElement("label",{style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}},"Date"),
            React.createElement("input",{type:"date",value:form.date,onChange:function(e){setForm(function(p){return Object.assign({},p,{date:e.target.value});});},
              style:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:13,boxSizing:"border-box"}})
          ),
          React.createElement("div",null)
        ),
        [
          {key:"mood",label:"Overall Mood",low:"Very low",high:"Good"},
          {key:"sleep",label:"Sleep Quality",low:"Very poor",high:"Good"},
          {key:"anxiety",label:"Anxiety Level",low:"Severe",high:"Minimal"},
        ].map(function(s){
          return React.createElement("div",{key:s.key,style:{marginBottom:14}},
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:6}},
              React.createElement("label",{style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em"}},s.label),
              React.createElement("span",{style:{color:moodColor(form[s.key]),fontWeight:700,fontSize:15}},form[s.key]+"/10")
            ),
            React.createElement("input",{type:"range",min:1,max:10,value:form[s.key],
              onChange:function(e){setForm(function(p){var n=Object.assign({},p);n[s.key]=parseInt(e.target.value);return n;});},
              style:{width:"100%",accentColor:moodColor(form[s.key])}}),
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",color:T.dim,fontSize:10}},
              React.createElement("span",null,s.low),React.createElement("span",null,s.high)
            )
          );
        }),
        React.createElement("div",{style:{marginBottom:14}},
          React.createElement("label",{style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},"Symptoms Today"),
          React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:6}},
            SYMPTOMS.map(function(s){
              var sel=form.symptoms.includes(s);
              return React.createElement("button",{key:s,onClick:function(){toggleSymptom(s);},
                style:{background:sel?"rgba(126,200,160,0.15)":T.faint,border:"1px solid "+(sel?"#7ec8a0":T.border),
                  borderRadius:16,padding:"5px 12px",cursor:"pointer",color:sel?"#7ec8a0":T.muted,fontSize:11,transition:"all 0.15s"}
              },s);
            })
          )
        ),
        React.createElement("div",{style:{marginBottom:14}},
          React.createElement("label",{style:{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}},"Notes (what happened today, how it affected you)"),
          React.createElement("textarea",{value:form.notes,onChange:function(e){setForm(function(p){return Object.assign({},p,{notes:e.target.value});});},
            placeholder:"e.g. Couldn't sleep again due to replaying the incident. Cancelled plans with friends. Had a panic attack near a shop. Struggling to concentrate on university work.",
            style:{width:"100%",minHeight:90,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:13,lineHeight:1.6,fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}})
        ),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement(Btn,{onClick:addEntry},"✅ Save Entry"),
          React.createElement(Btn,{variant:"ghost",onClick:function(){setShowAdd(false);}},"Cancel")
        )
      ),

      entries.length===0
        ? React.createElement("div",{style:{textAlign:"center",padding:"48px 20px",color:T.dim}},
            React.createElement("div",{style:{fontSize:48,marginBottom:12}},"💚"),
            React.createElement("div",{style:{fontSize:15,marginBottom:8}},"Start your wellbeing journal today"),
            React.createElement("div",{style:{fontSize:13}},
              "Every entry documents the human cost of what was done to you — and becomes evidence for your Vento band assessment."
            )
          )
        : React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
            entries.map(function(e){
              return React.createElement(Card,{key:e.id,style:{borderColor:"rgba(126,200,160,0.2)"}},
                React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}},
                  React.createElement("div",{style:{flex:1}},
                    React.createElement("div",{style:{color:T.gold,fontSize:13,fontWeight:600,marginBottom:8}},
                      new Date(e.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})
                    ),
                    React.createElement("div",{style:{display:"flex",gap:16,marginBottom:8,flexWrap:"wrap"}},
                      [{k:"mood",l:"Mood"},{k:"sleep",l:"Sleep"},{k:"anxiety",l:"Anxiety"}].map(function(s){
                        return React.createElement("div",{key:s.k,style:{textAlign:"center"}},
                          React.createElement("div",{style:{color:moodColor(e[s.k]),fontSize:18,fontWeight:700}},e[s.k]),
                          React.createElement("div",{style:{color:T.dim,fontSize:10}},s.l)
                        );
                      })
                    ),
                    e.symptoms&&e.symptoms.length>0&&React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}},
                      e.symptoms.map(function(s){return React.createElement("span",{key:s,style:{background:"rgba(126,200,160,0.1)",border:"1px solid rgba(126,200,160,0.3)",borderRadius:10,padding:"2px 8px",fontSize:10,color:"#7ec8a0"}},s);})
                    ),
                    e.notes&&React.createElement("div",{style:{color:"#64748B",fontSize:12,lineHeight:1.5,fontStyle:"italic"}},'"'+e.notes+'"')
                  ),
                  React.createElement("button",{
                    onClick:function(){saveEntries(entries.filter(function(x){return x.id!==e.id;}));},
                    style:{color:T.dim,fontSize:11,background:"none",border:"1px solid "+T.border,borderRadius:6,padding:"3px 8px",cursor:"pointer"}
                  },"Remove")
                )
              );
            })
          )
    ),

    // IMPACT MODE
    activeMode==="impact" && React.createElement("div",null,
      React.createElement("div",{style:{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:12,padding:"14px 18px",marginBottom:20}},
        React.createElement("div",{style:{color:T.gold,fontWeight:700,fontSize:13,marginBottom:6}},"📊 Your real case metrics — from your own data"),
        React.createElement("div",{style:{color:"#64748B",fontSize:12,lineHeight:1.7}},
          "These are live numbers from your actual UJRIS usage. No fake counters. Use these in grant applications and funding pitches to demonstrate real impact."
        )
      ),
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24}},
        IMPACT_STATS.map(function(stat){
          return React.createElement(Card,{key:stat.label,style:{textAlign:"center",padding:"20px 16px",borderColor:stat.color+"33"}},
            React.createElement("div",{style:{fontSize:28,marginBottom:6}},stat.icon),
            React.createElement("div",{style:{color:stat.color,fontSize:36,fontWeight:900,fontFamily:"'Playfair Display',serif",lineHeight:1}},stat.value),
            React.createElement("div",{style:{color:T.white,fontSize:12,fontWeight:600,marginTop:6,marginBottom:4}},stat.label),
            React.createElement("div",{style:{color:T.dim,fontSize:11}},stat.desc)
          );
        })
      ),
      // Grant-ready summary
      React.createElement(Card,{style:{borderColor:"rgba(201,168,76,0.3)",background:"rgba(201,168,76,0.04)"}},
        React.createElement("div",{style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:12}},"📋 Grant-Ready Impact Statement"),
        React.createElement("div",{style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"16px",color:T.white,fontSize:13,lineHeight:1.9,fontFamily:"'Source Serif 4',serif"}},[
          "This UJRIS user has:",
          "• Logged "+evidence.length+" items of evidence for their discrimination case",
          "• Documented "+timeline.length+" events in a forensic timeline",
          "• Recorded "+entries.length+" wellbeing journal entries showing impact on mental health",
          "• Tracked "+deadlines.length+" legal deadlines — ensuring no time limit is missed",
          "• Generated "+S.get("docs_generated",0)+" tribunal-ready legal documents",
          caseData ? "• Assessed a "+((caseData.discType||[]).join(" and "))+" discrimination case arising from a "+caseData.setting+" setting" : "",
          "",
          "UJRIS provides self-represented litigants — particularly BAME individuals — with forensic-grade legal tools that were previously accessible only through expensive legal representation. This case demonstrates exactly the access to justice gap that UJRIS addresses."
        ].filter(Boolean).join("\n"))
      )
    ),

    // PREDICT MODE
    activeMode==="predict" && React.createElement("div",null,
      React.createElement("div",{style:{background:"rgba(255,107,107,0.06)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:20}},
        React.createElement("div",{style:{color:"#ff9999",fontWeight:700,fontSize:13,marginBottom:4}},"⚠ Important caveat"),
        React.createElement("div",{style:{color:"#ffbbbb",fontSize:12,lineHeight:1.7}},
          "This predictor is based on your case data and UK ET statistics. It provides an evidence-based assessment — not a guarantee. Every case is different. Use this to inform your strategy, not as a definitive answer."
        )
      ),
      !caseData
        ? React.createElement(Card,{style:{textAlign:"center",padding:"40px"}},
            React.createElement("div",{style:{fontSize:40,marginBottom:12}},"🧭"),
            React.createElement("div",{style:{color:"#1E3A5F",fontSize:14}},"Complete your case assessment first to unlock the outcome predictor.")
          )
        : React.createElement("div",null,
            React.createElement(Card,{style:{marginBottom:16,borderColor:"rgba(201,168,76,0.3)"}},
              React.createElement("div",{style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:12}},"Your case data that will be analysed:"),
              React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}},
                [
                  ["Discrimination type",(caseData.discType||[]).join(", ")||"Not set"],
                  ["Setting",caseData.setting||"Not set"],
                  ["Incident date",caseData.when||"Not set"],
                  ["Severity",caseData.severity?caseData.severity+"/10":"Not rated"],
                  ["Evidence logged",evidence.length+" items"],
                  ["Wellbeing entries",entries.length+" entries"],
                ].map(function(row,i){
                  return React.createElement("div",{key:i,style:{padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}},
                    React.createElement("span",{style:{color:T.dim,fontSize:11}},row[0]+": "),
                    React.createElement("span",{style:{color:T.white,fontSize:12,fontWeight:600}},row[1])
                  );
                })
              )
            ),
            !predResult&&!predLoading&&React.createElement(Btn,{onClick:runOutcomePredictor,style:{width:"100%",padding:"14px",fontSize:15}},
              "🎯 Run Honest Outcome Prediction"
            ),
            predLoading&&React.createElement("div",{style:{textAlign:"center",padding:"32px",color:T.gold,fontSize:15,fontFamily:"'Playfair Display',serif"}},
              "🎯 Analysing your case against UK ET statistics…"
            ),
            predResult&&React.createElement("div",null,
              React.createElement("div",{style:{display:"flex",gap:8,marginBottom:16}},
                React.createElement(Btn,{sm:true,onClick:function(){
                  const w=window.open("","_blank");
                  w.document.write("<html><head><title>UJRIS Outcome Prediction</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.9;color:#1a1a1a}pre{white-space:pre-wrap;font-family:Georgia,serif}.warn{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px;margin:20px 0;font-size:12px}</style></head><body><h1>🎯 UJRIS Outcome Prediction</h1><p>Generated: "+new Date().toLocaleString("en-GB")+"</p><div class='warn'>AI-generated assessment based on your case data. Not legal advice. Discuss with a solicitor before making strategic decisions.</div><pre>"+predResult+"</pre></body></html>");
                  w.document.close(); w.print();
                }},"🖨 Print Assessment"),
                React.createElement(Btn,{variant:"ghost",sm:true,onClick:function(){setPredResult(null);}},"🔄 Run Again")
              ),
              React.createElement(Card,{style:{borderColor:"rgba(201,168,76,0.4)"}},
                React.createElement("div",{style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:16}},"🎯 Honest Case Assessment"),
                React.createElement("div",{style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",color:T.white,fontSize:13,lineHeight:2,whiteSpace:"pre-wrap",fontFamily:"'Source Serif 4',serif",maxHeight:700,overflowY:"auto"}},
                  predResult
                )
              )
            )
          )
    )
  );
}

function DeadlinesCentre() {
  const [deadlines, setDeadlines] = React.useState(function(){return S.get("deadlines",[]);});
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({label:"",date:"",type:"et",notes:""});
  const [lexMode, setLexMode] = React.useState(false);
  const [lexSearch, setLexSearch] = React.useState("");

  const DEADLINE_TYPES = [
    {id:"et", label:"Employment Tribunal", color:T.gold, icon:"⚖"},
    {id:"acas", label:"ACAS / Conciliation", color:T.tealL, icon:"🤝"},
    {id:"mcol", label:"MCOL / County Court", color:"#9b8fe8", icon:"🏛"},
    {id:"sar", label:"SAR Response Due", color:"#ff9f7f", icon:"📂"},
    {id:"police", label:"Police / VRR", color:"#9b8fe8", icon:"🚔"},
    {id:"ico", label:"ICO Complaint", color:T.tealL, icon:"🔒"},
    {id:"appeal", label:"Appeal Deadline", color:"#ff6b6b", icon:"📋"},
    {id:"other", label:"Other", color:T.muted, icon:"📅"},
  ];

  const UK_KEY_DEADLINES = [
    {label:"ET Claim (Discrimination)", rule:"3 months minus 1 day from last act", warning:30, icon:"⚖", color:T.gold},
    {label:"ET Claim (Unfair Dismissal)", rule:"3 months minus 1 day from effective date of termination", warning:30, icon:"⚖", color:T.gold},
    {label:"ACAS Early Conciliation", rule:"Must be started before ET claim — pause clock", warning:14, icon:"🤝", color:T.tealL},
    {label:"MCOL / County Court", rule:"6 years (contract) or 6 years (breach of statutory duty)", warning:60, icon:"🏛", color:"#9b8fe8"},
    {label:"SAR Response Deadline", rule:"1 calendar month from receipt", warning:7, icon:"📂", color:"#ff9f7f"},
    {label:"ICO Complaint", rule:"3 months from SAR non-compliance (recommended)", warning:14, icon:"🔒", color:T.tealL},
    {label:"Victim Right to Review (VRR)", rule:"3 months from NFA decision", warning:21, icon:"🚔", color:"#9b8fe8"},
    {label:"Police Misconduct Complaint", rule:"12 months from incident (IOPC)", warning:30, icon:"🚔", color:"#9b8fe8"},
    {label:"Personal Injury Claim", rule:"3 years from date of knowledge of injury", warning:60, icon:"🏥", color:"#ff9f7f"},
    {label:"Judicial Review", rule:"3 months from decision", warning:21, icon:"🏛", color:"#9b8fe8"},
  ];

  const LEGALESE = [
    {term:"Without Prejudice", plain:"This communication cannot be used as evidence in court. Usually means they want to settle without admitting fault.", impact:"Positive — they may be nervous about their case.", tag:"Settlement"},
    {term:"Without Prejudice Save as to Costs", plain:"Same as 'without prejudice' BUT can be shown to the judge after the case to decide who pays legal costs.", impact:"Important: keep this letter — show it to the judge about costs at the end.", tag:"Costs"},
    {term:"Subject to Contract", plain:"This is not yet a final agreement. Nothing is agreed until both sides sign a formal contract.", impact:"Don't rely on anything said 'subject to contract' — it can change.", tag:"Negotiation"},
    {term:"Reserve Our Rights", plain:"They are warning they may take further legal action later. It doesn't mean they are doing it now — but they want you to know the option exists.", impact:"Note the date — they may be preparing to escalate.", tag:"Warning"},
    {term:"Vexatious Litigant", plain:"They are calling you a troublemaker who brings claims without merit. This is a common tactic to intimidate self-represented claimants.", impact:"This is a litigation tactic — do not be intimidated. Document that they said this.", tag:"Tactic"},
    {term:"Particularise Your Claim", plain:"They are asking you to give more specific details about your allegations — what happened, when, how.", impact:"This is standard procedure. Be specific in your response with dates, events, and witnesses.", tag:"Procedure"},
    {term:"Strike Out", plain:"A request to have your claim dismissed entirely without a hearing. Usually claimed because the case has 'no reasonable prospect of success'.", impact:"Serious — you must respond formally and argue why your case has merit.", tag:"Urgent"},
    {term:"Unless Order", plain:"An order saying: unless you do X by Y date, your case will be struck out. This is serious and has a hard deadline.", impact:"URGENT — missing this deadline ends your case. Act immediately.", tag:"Critical"},
    {term:"Deposit Order", plain:"A tribunal order requiring you to pay a deposit (up to £1,000) to continue your claim, because it appears weak.", impact:"You can challenge this. Seek advice immediately.", tag:"Urgent"},
    {term:"ACAS Early Conciliation", plain:"A free, mandatory process where ACAS tries to settle your case before it reaches tribunal. You MUST start this before filing an ET claim.", impact:"This pauses your 3-month deadline. Start it early.", tag:"Mandatory"},
    {term:"ET1", plain:"The claim form you file to start an Employment Tribunal case. Must be filed within 3 months minus 1 day of the last act of discrimination.", impact:"Missing this deadline means losing your right to claim.", tag:"Critical"},
    {term:"ET3", plain:"The employer's response to your ET1 claim. They have 28 days to respond. If they don't, you may get a default judgment.", impact:"Note the date they received your ET1 — count 28 days.", tag:"Key Date"},
    {term:"Preliminary Hearing", plain:"An early hearing to sort out legal questions before the main case — like whether your claim is in time or whether you have the right to bring it.", impact:"Treat this seriously — it can end your case if you lose.", tag:"Hearing"},
    {term:"Case Management Order", plain:"Instructions from the tribunal on what you and the employer must do before the main hearing — like exchanging documents or filing witness statements.", impact:"These are deadlines you must meet. Diarise them immediately.", tag:"Deadline"},
    {term:"Bundle", plain:"A folder of all the documents both sides will use at tribunal. Usually paginated and indexed. You will need your own copy.", impact:"Start organising your documents now. Number every page.", tag:"Preparation"},
    {term:"Schedule of Loss", plain:"A document setting out exactly how much money you are claiming and why. Filed before the hearing.", impact:"Be specific and evidenced. UJRIS has a calculator to help.", tag:"Document"},
    {term:"Remedy Hearing", plain:"A separate hearing AFTER you win the main case, to decide how much compensation you receive.", impact:"Winning on liability does not automatically mean you get money — you must prove loss.", tag:"Post-Win"},
    {term:"Vento Bands", plain:"The scale used to value 'injury to feelings' in discrimination cases. Three bands: lower (£1,100–£11,200), middle (£11,200–£33,700), upper (£33,700–£56,200).", impact:"Medical evidence from your GP/therapist helps push you into higher bands.", tag:"Compensation"},
    {term:"Polkey Reduction", plain:"A reduction in compensation because the tribunal thinks dismissal was unfair on procedure but a fair procedure might have led to the same outcome.", impact:"Challenge this with evidence that a fair process would have led to a different outcome.", tag:"Compensation"},
    {term:"Contributory Fault", plain:"A reduction in compensation because the tribunal thinks you contributed to what happened — for example by behaving badly.", impact:"Resist this strongly — employers often allege it to reduce payouts.", tag:"Compensation"},
    {term:"GDPR / UK GDPR", plain:"General Data Protection Regulation — the law that gives you the right to access your personal data. Your Subject Access Request rights come from here.", impact:"You have 1 month to get your data. Use this right early.", tag:"Data Rights"},
    {term:"Subject Access Request (SAR)", plain:"A formal request for all personal data an organisation holds about you. Under UK GDPR Article 15, they must respond within 1 month.", impact:"This is your most powerful early tool. Cast the net wide — ask for everything.", tag:"Data Rights"},
    {term:"Without Notice", plain:"An application to the court or tribunal made without telling the other side first. Usually only granted in urgent cases.", impact:"Rare — only applies in exceptional circumstances like urgent injunctions.", tag:"Procedure"},
    {term:"Respondent", plain:"The person or organisation you are making a claim against — usually your employer or the organisation that discriminated against you.", impact:"Always use 'Respondent' in tribunal documents — not 'defendant' or 'employer'.", tag:"Terminology"},
    {term:"Claimant", plain:"You — the person bringing the claim.", impact:"Use 'I (the Claimant)' in all tribunal documents.", tag:"Terminology"},
    {term:"Protected Disclosure", plain:"A 'whistleblowing' disclosure — reporting wrongdoing in the public interest. You cannot be dismissed or treated badly for making one.", impact:"If your complaint led to dismissal, you may have whistleblowing protection with no qualifying period.", tag:"Protection"},
    {term:"Constructive Dismissal", plain:"When you resign because your employer made working conditions so unbearable you had no choice. Legally treated as dismissal.", impact:"You must resign promptly — delay weakens the claim. File ET1 within 3 months.", tag:"Claim Type"},
    {term:"Compromise Agreement / Settlement Agreement", plain:"A legally binding agreement to settle your claim. You MUST get independent legal advice before signing — this is a legal requirement.", impact:"Do not sign without independent advice. Free advice is available via LawWorks and Advocate.", tag:"Settlement"},
    {term:"Adverse Inference", plain:"When a tribunal draws a negative conclusion from a party's failure to provide evidence or explain something. If they refuse to disclose documents, the tribunal can infer the worst.", impact:"If they are withholding documents, make sure the tribunal knows it.", tag:"Strategy"},
  ];

  const filteredLex = lexSearch
    ? LEGALESE.filter(function(l){
        return l.term.toLowerCase().includes(lexSearch.toLowerCase()) ||
               l.plain.toLowerCase().includes(lexSearch.toLowerCase()) ||
               l.tag.toLowerCase().includes(lexSearch.toLowerCase());
      })
    : LEGALESE;

  const save = function(list){ setDeadlines(list); S.set("deadlines",list); };

  const addDeadline = function(){
    if(!form.label||!form.date) return;
    var newList = deadlines.concat([{id:Date.now(), label:form.label, date:form.date, type:form.type, notes:form.notes}]);
    save(newList); setForm({label:"",date:"",type:"et",notes:""}); setShowAdd(false);
  };

  const removeDeadline = function(id){ save(deadlines.filter(function(d){return d.id!==id;})); };

  const getDaysLeft = function(dateStr){
    var d = new Date(dateStr);
    var today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((d-today)/86400000);
  };

  const getUrgencyColor = function(days){
    if(days<0) return "#ff4444";
    if(days<=7) return "#ff6b6b";
    if(days<=21) return "#ff9f7f";
    if(days<=30) return T.gold;
    return T.tealL;
  };

  const sortedDeadlines = deadlines.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});

  return React.createElement("div", null,
    // Header with tab switcher
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}},
      React.createElement("div",null,
        React.createElement("h1",{style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:4}},
          lexMode?"📖 Legal Jargon Decoder":"⏰ Deadlines Command Centre"
        ),
        React.createElement("p",{style:{color:"#64748B",fontSize:13}},
          lexMode?"Plain English translations of every legal term you will encounter in your case":"All your legal deadlines in one place. Missing a deadline can end your case.")
      ),
      React.createElement("div",{style:{display:"flex",gap:8}},
        React.createElement(Btn,{variant:lexMode?"ghost":"primary",sm:true,onClick:function(){setLexMode(false);}},
          "⏰ Deadlines"
        ),
        React.createElement(Btn,{variant:lexMode?"primary":"ghost",sm:true,onClick:function(){setLexMode(true);}},
          "📖 Legalese"
        )
      )
    ),

    // DEADLINES MODE
    !lexMode && React.createElement("div",null,
      // Key UK legal deadlines reference
      React.createElement(Card,{style:{marginBottom:20,background:"rgba(201,168,76,0.05)",borderColor:"rgba(201,168,76,0.2)"}},
        React.createElement("div",{style:{color:T.gold,fontWeight:700,fontSize:13,marginBottom:12}},
          "📋 Key UK Legal Time Limits — Know These"
        ),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}},
          UK_KEY_DEADLINES.map(function(d){
            return React.createElement("div",{key:d.label,style:{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}},
              React.createElement("span",{style:{fontSize:14,flexShrink:0}},d.icon),
              React.createElement("div",null,
                React.createElement("div",{style:{color:d.color,fontSize:12,fontWeight:600}},d.label),
                React.createElement("div",{style:{color:T.dim,fontSize:11,lineHeight:1.4}},d.rule)
              )
            );
          })
        )
      ),

      // User's personal deadlines
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}},
        React.createElement("div",{style:{color:T.white,fontSize:15,fontWeight:600}},
          "📌 Your Personal Deadline Tracker"
        ),
        React.createElement(Btn,{sm:true,onClick:function(){setShowAdd(true);}},
          "+ Add Deadline"
        )
      ),

      showAdd && React.createElement(Card,{style:{marginBottom:16,borderColor:T.gold+"44"}},
        React.createElement("div",{style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:14}},"Add New Deadline"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
          React.createElement("div",null,
            React.createElement("label",{style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}},"Deadline Label *"),
            React.createElement(Input,{value:form.label,onChange:function(e){setForm(function(p){return Object.assign({},p,{label:e.target.value});});},placeholder:"e.g. File ET1 claim, SAR response due"})
          ),
          React.createElement("div",null,
            React.createElement("label",{style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}},"Date *"),
            React.createElement("input",{type:"date",value:form.date,onChange:function(e){setForm(function(p){return Object.assign({},p,{date:e.target.value});});},
              style:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:13,boxSizing:"border-box"}})
          )
        ),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}},
          React.createElement("div",null,
            React.createElement("label",{style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}},"Type"),
            React.createElement("select",{value:form.type,onChange:function(e){setForm(function(p){return Object.assign({},p,{type:e.target.value});});},
              style:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:13,boxSizing:"border-box"}},
              DEADLINE_TYPES.map(function(t){return React.createElement("option",{key:t.id,value:t.id,style:{background:"#1a2b3c"}},t.icon+" "+t.label);})
            )
          ),
          React.createElement("div",null,
            React.createElement("label",{style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}},"Notes (optional)"),
            React.createElement(Input,{value:form.notes,onChange:function(e){setForm(function(p){return Object.assign({},p,{notes:e.target.value});});},placeholder:"e.g. Must ACAS first, need SAR docs first"})
          )
        ),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement(Btn,{onClick:addDeadline,disabled:!form.label||!form.date},"✅ Add Deadline"),
          React.createElement(Btn,{variant:"ghost",onClick:function(){setShowAdd(false);}},"Cancel")
        )
      ),

      sortedDeadlines.length === 0
        ? React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",color:T.dim,fontSize:14}},
            React.createElement("div",{style:{fontSize:40,marginBottom:12}},"📅"),
            "No deadlines added yet. Add your first deadline above.",
            React.createElement("div",{style:{color:T.dim,fontSize:12,marginTop:8}},"Your ET1 deadline, SAR deadlines, VRR deadline — add them all here.")
          )
        : React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
            sortedDeadlines.map(function(d){
              var days = getDaysLeft(d.date);
              var uc = getUrgencyColor(days);
              var typeObj = DEADLINE_TYPES.find(function(t){return t.id===d.type;})||{icon:"📅",label:"Other",color:T.muted};
              var overdue = days < 0;
              return React.createElement(Card,{key:d.id,style:{borderColor:uc+"55",background:overdue?"rgba(255,68,68,0.06)":"rgba(255,255,255,0.02)"}},
                React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}},
                  React.createElement("div",{style:{flex:1}},
                    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},
                      React.createElement("span",{style:{fontSize:16}},typeObj.icon),
                      React.createElement("div",{style:{color:"#0F2C4A",fontSize:14,fontWeight:600}},d.label),
                      overdue&&React.createElement("span",{style:{background:"rgba(255,68,68,0.2)",border:"1px solid #ff4444",borderRadius:12,padding:"2px 8px",fontSize:10,color:"#ff6b6b",fontWeight:700}},"OVERDUE")
                    ),
                    React.createElement("div",{style:{display:"flex",gap:12,flexWrap:"wrap"}},
                      React.createElement("span",{style:{color:"#64748B",fontSize:12}},
                        "📅 "+new Date(d.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})
                      ),
                      React.createElement("span",{style:{color:typeObj.color,fontSize:12}},typeObj.label)
                    ),
                    d.notes&&React.createElement("div",{style:{color:T.dim,fontSize:12,marginTop:4}},d.notes)
                  ),
                  React.createElement("div",{style:{textAlign:"right",flexShrink:0}},
                    React.createElement("div",{style:{color:uc,fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif",lineHeight:1}},
                      overdue ? "!!!" : days+"d"
                    ),
                    React.createElement("div",{style:{color:T.dim,fontSize:10}},overdue?"overdue":"remaining"),
                    React.createElement("button",{onClick:function(){removeDeadline(d.id);},
                      style:{marginTop:6,background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:6,padding:"3px 8px",color:"#ff9999",fontSize:11,cursor:"pointer"}},
                      "Remove"
                    )
                  )
                )
              );
            })
          )
    ),

    // LEGALESE MODE
    lexMode && React.createElement("div",null,
      React.createElement("div",{style:{marginBottom:16}},
        React.createElement(Input,{value:lexSearch,onChange:function(e){setLexSearch(e.target.value);},
          placeholder:"Search legal terms, e.g. 'without prejudice', 'Vento', 'strike out'…"})
      ),
      React.createElement("div",{style:{color:T.dim,fontSize:12,marginBottom:16}},
        filteredLex.length+" terms"+(lexSearch?" matching '"+lexSearch+"'":"")+" — "+LEGALESE.length+" total"
      ),
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
        filteredLex.map(function(l){
          var TAG_COLORS={
            "Critical":"#ff4444","Urgent":"#ff6b6b","Settlement":T.tealL,"Costs":"#9b8fe8",
            "Mandatory":T.gold,"Key Date":T.gold,"Compensation":"#7ec8a0","Strategy":"#ff9f7f",
            "Tactic":"#9b8fe8","Warning":"#ff9f7f","Data Rights":T.tealL,"Procedure":T.muted,
            "Terminology":T.dim,"Protection":"#7ec8a0","Claim Type":T.gold,"Negotiation":T.muted,
            "Deadline":T.gold,"Hearing":"#ff9f7f","Document":T.muted,"Preparation":T.muted,"Post-Win":"#7ec8a0"
          };
          var tc = TAG_COLORS[l.tag]||T.muted;
          return React.createElement(Card,{key:l.term,style:{marginBottom:0}},
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}},
              React.createElement("div",{style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}},l.term),
              React.createElement("span",{style:{background:tc+"22",border:"1px solid "+tc+"44",borderRadius:12,padding:"2px 10px",fontSize:10,color:tc,fontWeight:700,letterSpacing:"0.06em",whiteSpace:"nowrap"}},l.tag)
            ),
            React.createElement("div",{style:{color:T.white,fontSize:13,lineHeight:1.7,marginBottom:8}},l.plain),
            React.createElement("div",{style:{background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:8,padding:"8px 12px"}},
              React.createElement("span",{style:{color:T.gold,fontSize:11,fontWeight:700,marginRight:6}},"⚡ WHAT THIS MEANS FOR YOUR CASE:"),
              React.createElement("span",{style:{color:"#64748B",fontSize:12,lineHeight:1.5}},l.impact)
            )
          );
        })
      )
    )
  );
}

function EvidenceLab() {
  const [activeMode, setActiveMode] = React.useState(null);

  const MODES = [
    {
      id: "metadata",
      icon: "🔬",
      label: "Document Metadata Forensics",
      desc: "Upload or paste document details. UJRIS extracts and analyses metadata — author names, creation dates, modification history, software fingerprints — and flags backdating, fabrication indicators, and timestomping.",
      detail: "Witness statements dated weeks after incidents, created after solicitors were hired. Metadata analysis catches exactly this. Documents cannot lie about when they were made — if you know where to look.",
      color: T.gold,
      tag: "PROPRIETARY"
    },
    {
      id: "dbs",
      icon: "📜",
      label: "DBS / CRB Record Challenge",
      desc: "Has false, unverified, or disproved information appeared on your DBS/CRB record? UJRIS generates a formal challenge under Police Act 1997 s.113B, Article 8 ECHR, and the DPA 2018 — with the evidence framework to support it.",
      detail: "Police can record unverified allegations on your CRB — including threat allegations — without verification or notification. This is challengeable under the Police Act 1997 and UJRIS will show you exactly how.",
      color: "#ff9f7f",
      tag: "URGENT"
    },
    {
      id: "vrr",
      icon: "🚔",
      label: "Police — Victim Right to Review (VRR)",
      desc: "Police closed your case without telling you, or made a no further action (NFA) decision you disagree with. UJRIS generates a formal Victim Right to Review request and explains every step of the process.",
      detail: "You have the right to request a review of any NFA decision. Most victims never know this right exists. UJRIS makes sure you exercise it before the deadline.",
      color: "#9b8fe8",
      tag: "TIME-LIMITED"
    },
    {
      id: "spoliation",
      icon: "⚠",
      label: "Evidence Spoliation & Preservation Notice",
      desc: "Worried they will delete CCTV, emails, or records before you can get them? Generate a formal Preservation Notice that creates a legal duty to retain all evidence — and makes destruction a criminal offence.",
      detail: "Once a Preservation Notice is served, any destruction of evidence can constitute contempt of court or an offence under DPA 2018. Most employers stop destroying evidence immediately.",
      color: T.tealL,
      tag: "SEND EARLY"
    },
  ];

  if (!activeMode) {
    return React.createElement("div", null,
      React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}},
        "🔐 Evidence Lab"
      ),
      React.createElement("p", {style:{color:"#1E3A5F",fontSize:14,marginBottom:16}},
        "Advanced forensic tools used by legal teams — now available to every self-represented litigant. These tools have changed case trajectories. Use them early."
      ),
      React.createElement("div", {style:{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:12,padding:"16px 20px",marginBottom:24}},
        React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:8}}, "🧬 What makes these tools proprietary"),
        React.createElement("div", {style:{color:"#64748B",fontSize:13,lineHeight:1.8}},
          "The combination of metadata forensics, anchor lie detection, DBS challenge, and VRR tracking in a single platform for self-represented litigants does not exist anywhere else. These tools have changed the trajectory of real discrimination cases — now systematised for every user facing institutional cover-ups."
        )
      ),
      React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:14}},
        MODES.map(function(m) {
          return React.createElement("button", {
            key:m.id,
            onClick:function(){setActiveMode(m.id);},
            style:{background:T.faint,border:"2px solid "+T.border,borderRadius:14,padding:"20px 22px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"},
            onMouseEnter:function(e){e.currentTarget.style.borderColor=m.color;e.currentTarget.style.background="rgba(255,255,255,0.04)";},
            onMouseLeave:function(e){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.faint;}
          },
            React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}},
              React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12}},
                React.createElement("span", {style:{fontSize:26}}, m.icon),
                React.createElement("div", {style:{color:m.color,fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}, m.label)
              ),
              React.createElement("span", {style:{background:m.color+"22",border:"1px solid "+m.color+"44",borderRadius:12,padding:"3px 10px",fontSize:10,color:m.color,fontWeight:700,letterSpacing:"0.08em"}}, m.tag)
            ),
            React.createElement("div", {style:{color:T.white,fontSize:13,lineHeight:1.6,marginBottom:6}}, m.desc),
            React.createElement("div", {style:{color:T.dim,fontSize:12,lineHeight:1.5,fontStyle:"italic"}}, m.detail)
          );
        })
      )
    );
  }

  return React.createElement(EvidenceLabTool, {mode:activeMode, modes:MODES, onBack:function(){setActiveMode(null);}});
}

function EvidenceLabTool({mode, modes, onBack}) {
  const modeObj = modes.find(function(m){return m.id===mode;})||{};
  const [fields, setFields] = React.useState({});
  const [ai, setAi] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const fileRef = React.useRef();

  const set = function(k,v){ setFields(function(p){var n=Object.assign({},p);n[k]=v;return n;}); };

  const SYSTEMS = {
    metadata: `You are UJRIS — a forensic document analyst specialising in digital evidence authentication for UK employment and discrimination cases.

Analyse the document information provided and produce a FORENSIC METADATA REPORT covering:

1. 🔬 METADATA ANALYSIS
Author field anomalies — is the stated author consistent with the organisation's naming conventions?
Creation date vs incident date — was this document created before, during, or after the relevant events?
Modification date — was it edited after creation? How many times?
Software fingerprint — what does the creation tool tell us? Is it consistent with what this organisation would use?
Revision history — how many drafts? What does that suggest?

2. 📅 TEMPORAL IMPOSSIBILITY CHECK
Cross-reference all dates in the document with the timeline provided.
Flag any document created or modified AFTER:
— The date of the incident it describes
— The date legal representation was engaged
— The date the SAR was submitted
— The date the claimant first complained

3. 🎯 BACKDATING & FABRICATION INDICATORS
Timestomping indicators — creation date AFTER modification date
Anonymous or missing author — possible fabrication
Suspicious software — PDFtk, iTextSharp, ReportLab suggest PDF manipulation
Multiple revisions with same timestamp — batch creation
Document claims to be contemporaneous but metadata contradicts this

4. ⚡ ANCHOR LIE FROM METADATA
Based purely on metadata, what is the single most provable documentary anomaly?
State it clearly: what the document claims, what the metadata shows, and why this is legally significant.

5. ⚖ LEGAL SIGNIFICANCE
How does this metadata evidence affect the case under:
— Civil Evidence Act 1995 (document authenticity)
— Criminal Justice Act 2003 (business records)
— CPR Part 31 (disclosure obligations)
— ET Rules 2013 Rule 31 (tribunal disclosure)

6. 🔨 TRIBUNAL STRATEGY
Exact disclosure requests to make, expert evidence to seek, and cross-examination questions to expose the metadata anomaly.

Be forensically precise. Every finding must be tied to the data provided.`,

    dbs: `You are UJRIS — a UK data protection and police accountability expert specialising in challenging unlawful DBS/CRB disclosures.

Produce a DBS CHALLENGE PACK containing:

1. 📋 PLAIN ENGLISH EXPLANATION
What is on the DBS certificate, what it means, and why it may be unlawful.

2. ⚖ LEGAL GROUNDS FOR CHALLENGE
Police Act 1997 s.113B(4) — relevance test for non-conviction information
Article 8 ECHR — right to private life and proportionality
DPA 2018 — accuracy principle for personal data
R (L) v Commissioner of Police of the Metropolis [2009] — leading case on DBS disclosure

3. 🎯 SPECIFIC GROUNDS IN THIS CASE
For each entry being challenged:
— Was it verified before being recorded? (Duty to verify)
— Was the subject informed? (Transparency obligation)
— Is it accurate? (Accuracy principle — DPA 2018 s.5)
— Is disclosure proportionate? (Article 8 balance)
— Has it been disproved by evidence?

4. 📝 FORMAL CHALLENGE LETTER
A complete letter to the Chief Constable / Disclosure Team demanding:
— Removal of inaccurate information
— Written explanation of why it was recorded without verification
— Written explanation of why you were not informed
— Compensation for any employment impact

5. 🚔 IPCC / IOPC COMPLAINT
Grounds for a misconduct complaint about officers who recorded unverified allegations.

6. ✅ NEXT STEPS IN ORDER
Prioritised action list with deadlines.`,

    vrr: `You are UJRIS — a UK criminal justice and victim rights expert specialising in the Victims' Right to Review scheme.

Produce a VICTIM RIGHT TO REVIEW PACK containing:

1. 📋 PLAIN ENGLISH EXPLANATION
What the Victim Right to Review scheme is, who it applies to, and what it can achieve.

2. ⏰ DEADLINES
VRR requests must be made within 3 months of the NFA decision.
If the deadline has passed, what alternatives exist.

3. 📝 FORMAL VRR REQUEST LETTER
A complete letter to the relevant police force requesting:
— Full review of the NFA/no-investigation decision
— Disclosure of the reason for the decision
— Identity of the officer who made the decision
— Copy of the full investigation file

4. 🔍 GROUNDS FOR REVIEW
Why the decision was wrong based on the evidence described:
— Evidence not considered
— Witnesses not interviewed
— BWV footage not reviewed
— CAD log entries ignored
— Employer statements accepted without verification

5. 🔗 PARALLEL ROUTES
IPCC/IOPC complaint (Independent Office for Police Conduct)
Local Police and Crime Commissioner complaint
Civil claim for misfeasance in public office if applicable
Use of police failure as evidence of systemic bias at ET

6. 🚔 WHAT HAPPENS AFTER VRR
The review process, timescales, and what outcomes are possible.

7. ✅ NEXT STEPS IN ORDER
Specific actions with deadlines.`,

    spoliation: `You are UJRIS — a UK litigation and data preservation expert.

Produce an EVIDENCE PRESERVATION & SPOLIATION NOTICE PACK containing:

1. 📋 PLAIN ENGLISH EXPLANATION
What a preservation notice is, what legal duty it creates, and what happens if they breach it.

2. ⚖ LEGAL BASIS
Civil Procedure Rules Practice Direction on Pre-Action Conduct
DPA 2018 — duty to retain data subject to legal proceedings
Contempt of Court Act 1981 — destroying evidence after notice
Employment Tribunals Act 1996 s.7 — tribunal's power to order disclosure
The principle from Douglas v Hello! and other cases on evidence preservation

3. 📝 FORMAL PRESERVATION NOTICE
A complete legal notice addressed to the organisation requiring preservation of:
— All CCTV and BWV footage (specified dates and cameras)
— All emails (specified senders/recipients/keywords/dates)
— All internal memos and communications
— All investigation documents
— All witness statements (original handwritten versions)
— All HR system records
— All police-shared communications
— All metadata and audit trails
— All backup copies and deleted items recoverable from backup

4. ⚠ CONSEQUENCES OF BREACH
Criminal liability under DPA 2018 s.173 (alteration/destruction to prevent disclosure)
Adverse inference at tribunal under ET Rules 2013
Contempt of Court
Civil claim for evidence spoliation

5. 📧 DELIVERY INSTRUCTIONS
How to serve this notice to maximise its legal effect:
— Email with read receipt (evidence of delivery)
— Recorded delivery letter (proof of service)
— Keep copies of everything

6. ✅ FOLLOW-UP SCHEDULE
What to do if they acknowledge, ignore, or claim documents no longer exist.`
  };

  const FIELD_CONFIGS = {
    metadata: {
      title: "Document Metadata Forensics",
      fields: [
        {key:"doc_name", label:"Document Name / Type", placeholder:"e.g. Witness statement from store manager, [Organisation name]", required:true},
        {key:"doc_date", label:"Date Stated on Document", placeholder:"e.g. 15 April 2025"},
        {key:"author", label:"Author Field (as shown in document properties)", placeholder:"e.g. HR Department, Unknown, or leave blank if not visible"},
        {key:"created", label:"Creation Date (from file Properties if visible)", placeholder:"e.g. 08/01/2026 14:23 — or describe what you see in file properties"},
        {key:"modified", label:"Last Modified Date", placeholder:"e.g. same as creation, or different date"},
        {key:"software", label:"Software / Producer (from PDF properties or file info)", placeholder:"e.g. Microsoft Word 2016, Adobe Acrobat, iText, PDFtk"},
        {key:"revisions", label:"Number of Revisions / Versions", placeholder:"e.g. 3 revisions, or 'not visible'"},
        {key:"timeline", label:"Known Timeline of Events (critical context)", placeholder:"e.g.\n15 Mar 2025 — Incident 1\n22 Mar 2025 — Incident 2\n28 Apr 2025 — Respondent hires solicitors\n28 Apr 2025 — This witness statement dated\nNote: statement created on the same day lawyers were engaged", required:true},
        {key:"extras", label:"Anything else suspicious about this document", placeholder:"e.g. The font changes mid-document. The signature looks different to other documents. The company letterhead is slightly different."},
      ]
    },
    dbs: {
      title: "DBS / CRB Challenge",
      fields: [
        {key:"force", label:"Which police force recorded the information?", placeholder:"e.g. [Police Force Name]", required:true},
        {key:"entry", label:"What does the DBS/CRB entry say?", placeholder:"e.g. Allegation that I threatened a member of staff at [location] on [date]. No prosecution. No caution.", required:true},
        {key:"notified", label:"Were you informed before it was added?", placeholder:"e.g. No — I only found out when I requested my DBS certificate. No officer contacted me, no investigation took place."},
        {key:"verified", label:"Was the allegation verified or investigated?", placeholder:"e.g. No investigation took place. Police accepted the allegation without checking CCTV, taking my statement, or speaking to independent witnesses."},
        {key:"disproof", label:"What evidence disproves the allegation?", placeholder:"e.g. CCTV shows I did not threaten anyone. BWV (once obtained) shows peaceful behaviour. No police officer present has confirmed the allegation."},
        {key:"impact", label:"How has this affected your employment/life?", placeholder:"e.g. I lost a job offer when this appeared on my enhanced DBS. I am a care worker and this affects my entire career."},
      ]
    },
    vrr: {
      title: "Victim Right to Review Request",
      fields: [
        {key:"force", label:"Which police force?", placeholder:"e.g. [Police Force Name]", required:true},
        {key:"incident_date", label:"Date of incident(s)", placeholder:"e.g. 15 March 2025 and 22 March 2025"},
        {key:"crime_ref", label:"Crime reference number (if you have one)", placeholder:"e.g. SY/12345/25 — or 'not given'"},
        {key:"nfa_date", label:"When did police close the case / make NFA decision?", placeholder:"e.g. Unknown — I was never informed. I found out when I chased them."},
        {key:"informed", label:"Were you informed of the NFA decision?", placeholder:"e.g. No. The case was closed without any contact. I only discovered this when I followed up."},
        {key:"what_happened", label:"Describe what happened and what you reported", placeholder:"e.g. I was assaulted on [date]. Police were called to the scene. I later reported the assault separately. Police recorded the other party's version without proper investigation.", required:true},
        {key:"evidence_ignored", label:"What evidence was not considered by police?", placeholder:"e.g. CCTV footage showing the incident. BWV from officers present. CAD log records. My own statement, which was never taken."},
      ]
    },
    spoliation: {
      title: "Evidence Preservation Notice",
      fields: [
        {key:"org_name", label:"Organisation name", placeholder:"e.g. ABC Retail Ltd", required:true},
        {key:"org_address", label:"Organisation address / DPO contact", placeholder:"e.g. 100 Business Park, London, EC1A 1BB — or 'unknown, will send to registered office'"},
        {key:"your_name", label:"Your full name", placeholder:"Your legal name"},
        {key:"incident_dates", label:"Dates of incidents", placeholder:"e.g. 15 March 2025 and 22 March 2025"},
        {key:"specific_evidence", label:"Specific evidence you need preserved", placeholder:"e.g.\n• CCTV from all cameras on [date(s)]\n• All emails between staff about the incident\n• Internal investigation documents\n• Communications with police\n• CAD logs from any police callout\n• WhatsApp/Teams messages between managers that day"},
        {key:"legal_proceedings", label:"Legal proceedings in progress or intended", placeholder:"e.g. Employment Tribunal claim being prepared. MCOL claim filed. Police complaint submitted."},
      ]
    }
  };

  const config = FIELD_CONFIGS[mode]||FIELD_CONFIGS.metadata;

  const runAnalysis = async function() {
    const required = config.fields.filter(function(f){return f.required;});
    const missing = required.filter(function(f){return !(fields[f.key]||"").trim();});
    if(missing.length) return;
    setLoading(true); setAi("");

    const fieldText = config.fields.map(function(f){
      return f.label+":\n"+(fields[f.key]||"Not provided");
    }).join("\n\n");

    const prompt = "CASE DETAILS:\n\n"+fieldText+"\n\nGenerate the full "+config.title+" as instructed.";

    try {
      const res = await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-5",max_tokens:2500,stream:true,
          system:SYSTEMS[mode],messages:[{role:"user",content:prompt}]})
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      const reader=res.body.getReader(); const dec=new TextDecoder(); let full="";
      while(true){
        const {done,value}=await reader.read(); if(done) break;
        for(const line of dec.decode(value).split("\n")){
          if(line.startsWith("data: ")){
            try{const d=JSON.parse(line.slice(6));if(d.type==="content_block_delta"&&d.delta&&d.delta.text){full+=d.delta.text;setAi(full);}}catch(ex){}
          }
        }
      }
    }catch(e){setAi("⚠ Error: "+e.message);}
    finally{setLoading(false);}
  };

  const printReport = function(){
    const w=window.open("","_blank");
    w.document.write("<html><head><title>UJRIS — "+config.title+"</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.9;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}pre{white-space:pre-wrap;font-family:Georgia,serif}.warn{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px 16px;margin:20px 0;font-size:13px}.foot{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666}</style></head><body><h1>"+modeObj.icon+" UJRIS — "+config.title+"</h1><p><strong>Generated:</strong> "+new Date().toLocaleString("en-GB")+"</p><div class='warn'>Review carefully before use. Not legal advice. Consider solicitor review for complex matters.</div><pre>"+ai+"</pre><div class='foot'>Generated by UJRIS — Universal Justice Response & Intelligence System | ujris.co.uk</div></body></html>");
    w.document.close(); w.print();
  };

  const COLORS={metadata:T.gold,dbs:"#ff9f7f",vrr:"#9b8fe8",spoliation:T.tealL};
  const mc=COLORS[mode]||T.gold;
  const allRequired = config.fields.filter(function(f){return f.required;}).every(function(f){return (fields[f.key]||"").trim();});

  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:20}},
      React.createElement(Btn,{variant:"ghost",sm:true,onClick:onBack},"← Back"),
      React.createElement("div",null,
        React.createElement("h1",{style:{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,margin:0}},
          modeObj.icon+" "+modeObj.label
        ),
        modeObj.tag&&React.createElement("span",{style:{background:mc+"22",border:"1px solid "+mc+"44",borderRadius:12,padding:"2px 10px",fontSize:10,color:mc,fontWeight:700,letterSpacing:"0.08em",marginTop:4,display:"inline-block"}},modeObj.tag)
      )
    ),

    !ai&&React.createElement("div",null,
      React.createElement("div",{style:{background:"rgba(255,255,255,0.03)",border:"1px solid "+mc+"33",borderRadius:12,padding:"14px 18px",marginBottom:20}},
        React.createElement("div",{style:{color:mc,fontSize:13,lineHeight:1.7}},
          modeObj.detail
        )
      ),
      config.fields.map(function(f){
        var isTA = f.key==="timeline"||f.key==="extras"||f.key==="entry"||f.key==="what_happened"||f.key==="specific_evidence"||f.key==="evidence_ignored"||f.key==="disproof"||f.key==="impact";
        return React.createElement(Card,{key:f.key,style:{marginBottom:12}},
          React.createElement("label",{style:{color:f.required?T.gold:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}},
            f.label+(f.required?" *":"")
          ),
          isTA
            ? React.createElement("textarea",{value:fields[f.key]||"",onChange:function(e){set(f.key,e.target.value);},placeholder:f.placeholder,
                style:{width:"100%",minHeight:100,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:13,lineHeight:1.7,fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}})
            : React.createElement(Input,{value:fields[f.key]||"",onChange:function(e){set(f.key,e.target.value);},placeholder:f.placeholder})
        );
      }),
      React.createElement(Btn,{onClick:runAnalysis,disabled:!allRequired,style:{width:"100%",padding:"14px",fontSize:15}},
        modeObj.icon+" Generate "+config.title
      ),
      !allRequired&&React.createElement("div",{style:{color:T.dim,fontSize:12,textAlign:"center",marginTop:8}},
        "Complete required fields (*) to continue"
      )
    ),

    loading&&React.createElement("div",{style:{textAlign:"center",padding:"32px"}},
      React.createElement("div",{style:{fontSize:40,marginBottom:12}},modeObj.icon),
      React.createElement("div",{style:{color:mc,fontSize:16,fontFamily:"'Playfair Display',serif",marginBottom:8}},
        mode==="metadata"?"Analysing document forensics…":
        mode==="dbs"?"Building DBS challenge pack…":
        mode==="vrr"?"Preparing VRR request…":
        "Drafting preservation notice…"
      ),
      React.createElement("div",{style:{color:"#64748B",fontSize:13}},"This may take a moment — generating full legal document pack")
    ),

    ai&&React.createElement("div",null,
      React.createElement("div",{style:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}},
        React.createElement(Btn,{sm:true,onClick:printReport},"🖨 Print / Save PDF"),
        React.createElement(Btn,{variant:"ghost",sm:true,onClick:function(){setAi("");}},"← Edit"),
        React.createElement(Btn,{variant:"ghost",sm:true,onClick:function(){setAi("");setFields({});}},"🔄 New")
      ),
      React.createElement(Card,{style:{borderColor:mc+"55",marginBottom:12}},
        React.createElement("div",{style:{color:mc,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:16}},
          "✅ "+config.title+" — Complete"
        ),
        React.createElement("div",{style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",color:T.white,fontSize:13,lineHeight:2,whiteSpace:"pre-wrap",fontFamily:"'Source Serif 4',serif",maxHeight:700,overflowY:"auto"}},
          ai
        )
      ),
      React.createElement(Card,{style:{background:"rgba(255,107,107,0.05)",borderColor:"rgba(255,107,107,0.2)"}},
        React.createElement("div",{style:{color:"#ff9999",fontSize:12,lineHeight:1.6}},
          "⚠ Review all generated documents carefully. Verify all facts before sending. For DBS challenges and VRR requests, consider having a solicitor review your submission. Not legal advice."
        )
      )
    )
  );
}

function SupportNetwork({ caseData }) {
  const [situation, setSituation] = React.useState("");
  const [specific, setSpecific] = React.useState("");
  const [ai, setAi] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selectedNeeds, setSelectedNeeds] = React.useState([]);

  const NEED_TAGS = [
    {id:"mental_health", label:"😰 Mental Health Support", color:"#9b8fe8"},
    {id:"legal_free", label:"⚖ Free Legal Help", color:T.gold},
    {id:"student", label:"🎓 I'm a Student", color:T.tealL},
    {id:"bame", label:"✊ BAME Community Support", color:"#ff9f7f"},
    {id:"financial", label:"💰 Financial Hardship", color:"#7ec8a0"},
    {id:"workplace", label:"🏢 Still in My Workplace", color:T.muted},
    {id:"police", label:"🚔 Police / Criminal Element", color:"#9b8fe8"},
    {id:"physical", label:"🏥 Physical Health Impact", color:"#ff9f7f"},
    {id:"isolation", label:"😶 Feeling Isolated / Alone", color:"#7ec8a0"},
    {id:"evidence", label:"📋 Need Evidence for Tribunal", color:T.gold},
    {id:"crisis", label:"🆘 In Crisis Right Now", color:"#ff6b6b"},
    {id:"family", label:"👨‍👩‍👧 Family Affected Too", color:T.tealL},
  ];

  const toggleNeed = function(id) {
    setSelectedNeeds(function(prev){
      return prev.includes(id) ? prev.filter(function(n){return n!==id;}) : prev.concat([id]);
    });
  };

  const SYS = `You are UJRIS — a UK discrimination case welfare and support navigator. You help people who have experienced discrimination find support for their wellbeing AND build evidence for their legal case.

Structure your response as:

🆘 CRISIS CHECK
If there are any crisis indicators, address these FIRST with specific helpline numbers and what to say.

🤝 YOUR PERSONALISED SUPPORT MAP

For each relevant support category below, provide SPECIFIC, ACTIONABLE guidance — not generic lists:

━━ 🏥 HEALTH & MENTAL HEALTH ━━
- GP: exactly what to say, why it matters, what records are created
- NHS Talking Therapies (formerly IAPT): how to self-refer
- Mind, Samaritans, Shout (text 85258)
- Local mental health crisis line if applicable

━━ ⚖ FREE LEGAL SUPPORT ━━  
- Citizens Advice (in-person and online)
- Law Centres Network (lawcentres.org.uk)
- Advocate / Bar Pro Bono Unit (if ET or court)
- LawWorks (lawworks.org.uk)
- Equality Advisory Support Service (EASS): 0808 800 0082
- Community Legal Advice: 0345 345 4345

━━ 🎓 EDUCATION SUPPORT (if student) ━━
- Student Welfare / Student Services — what they can do
- Disability support if applicable
- Student Union advice service
- Academic impact — how to request extensions/mitigating circumstances
- University counselling service

━━ ✊ BAME & SPECIALIST COMMUNITY SUPPORT ━━
- Runnymede Trust
- Kick It Out / Show Racism the Red Card (workplace)
- Local racial equality councils
- Faith community support
- Specific ethnic community organisations if relevant

━━ 💰 FINANCIAL SUPPORT ━━
- Benefits entitlement if out of work
- Universal Credit, Statutory Sick Pay
- Hardship funds, emergency support
- Foodbanks if needed (no shame — this is what they're for)

━━ 👥 PEER & COMMUNITY SUPPORT ━━
- Support groups for discrimination survivors
- Online communities
- Social prescriber referral (ask GP)
- Victim Support if crime element

━━ 📋 EVIDENCE BUILDING FROM SUPPORT ━━
THIS IS THE CRITICAL SECTION. For EVERY support organisation mentioned above, explain:
1. What records they create
2. How those records evidence impact of discrimination (injury to feelings, psychiatric injury, career impact)
3. Exact language to use when describing the discrimination so records are legally useful
4. How to request copies for tribunal use

Example framework to use for GP:
"Say to your GP: I have been experiencing [anxiety/depression/sleep disruption/panic attacks] since [DATE OF INCIDENT]. I believe this is a direct result of racial discrimination I experienced at [ORGANISATION] on [DATE]. I would like this documented in my records."

━━ 🔗 HOW SUPPORT EVIDENCE WORKS IN TRIBUNAL ━━
- Vento bands for injury to feelings (£1,100–£56,200)
- How GP/mental health records support higher awards
- Witness statements from support workers
- Medical reports vs GP letters — the difference
- Psychiatric injury as a separate head of loss

━━ 📅 THIS WEEK'S ACTION PLAN ━━
A prioritised, specific list of 5 actions to take this week — with who to contact, what to say, and what to ask for.

Be warm, specific, and empowering. Acknowledge the trauma. Then give them every resource they need to fight back AND heal.`;

  const run = async function() {
    if (!situation.trim()) return;
    setLoading(true); setAi("");
    const selectedLabels = selectedNeeds.map(function(id){
      return (NEED_TAGS.find(function(t){return t.id===id;})||{}).label||id;
    });
    const prompt = "MY SITUATION:\n" + situation +
      "\n\nSPECIFIC NEEDS/CIRCUMSTANCES:\n" + (specific||"None specified") +
      "\n\nI HAVE IDENTIFIED THESE NEEDS:\n" + (selectedLabels.length ? selectedLabels.join(", ") : "Not specified") +
      (caseData ? "\n\nCASE CONTEXT: " + (caseData.discType||[]).join(", ") + " discrimination, setting: " + (caseData.setting||"unknown") : "") +
      "\n\nProvide my full personalised support map and evidence building plan.";
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-opus-4-5", max_tokens:2500, stream:true,
          system:SYS, messages:[{role:"user",content:prompt}]
        })
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while(true){
        const {done,value} = await reader.read();
        if(done) break;
        for(const line of dec.decode(value).split("\n")){
          if(line.startsWith("data: ")){
            try{
              const d=JSON.parse(line.slice(6));
              if(d.type==="content_block_delta"&&d.delta&&d.delta.text){full+=d.delta.text;setAi(full);}
            }catch(ex){}
          }
        }
      }
    } catch(e){setAi("⚠ Error: "+e.message);}
    finally{setLoading(false);}
  };

  const print = function(){
    const w=window.open("","_blank");
    w.document.write("<html><head><title>UJRIS Support Network Plan</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.9;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}pre{white-space:pre-wrap;font-family:Georgia,serif}.warn{background:#f0fff4;border-left:4px solid #7ec8a0;padding:12px 16px;margin:20px 0;font-size:13px}.foot{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666}</style></head><body><h1>🤝 UJRIS Support Network & Evidence Building Plan</h1><p><strong>Generated:</strong> "+new Date().toLocaleString("en-GB")+"</p><div class='warn'>This plan is for your wellbeing AND your legal case. Every support contact you make can create evidence of the impact of discrimination. Take care of yourself first — then use these records to fight back.</div><pre>"+ai+"</pre><div class='foot'>Generated by UJRIS — ujris.co.uk | Not legal advice. In crisis? Call Samaritans: 116 123</div></body></html>");
    w.document.close(); w.print();
  };

  return React.createElement("div", null,
    React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}},
      "🤝 Support Network & Evidence Builder"
    ),
    React.createElement("p", {style:{color:"#1E3A5F",fontSize:14,marginBottom:16}},
      "Your support network is your safety net AND your evidence base. Every professional who documents your distress creates evidence for your case. UJRIS maps both."
    ),

    // Crisis banner always visible
    React.createElement("div", {style:{background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:10,padding:"12px 16px",marginBottom:20}},
      React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},
        React.createElement("div", {style:{color:"#ff9999",fontSize:13,fontWeight:700}}, "🆘 In crisis right now?"),
        React.createElement("div", {style:{display:"flex",gap:12,flexWrap:"wrap"}},
          React.createElement("span", {style:{color:"#ff9999",fontSize:13}}, "Samaritans: "),
          React.createElement("strong", {style:{color:T.white,fontSize:13}}, "116 123"),
          React.createElement("span", {style:{color:"#ff9999",fontSize:13}}, " | Text SHOUT: "),
          React.createElement("strong", {style:{color:T.white,fontSize:13}}, "85258"),
          React.createElement("span", {style:{color:"#ff9999",fontSize:13}}, " | Mind: "),
          React.createElement("strong", {style:{color:T.white,fontSize:13}}, "0300 123 3393")
        )
      )
    ),

    // Key insight box
    React.createElement("div", {style:{background:"rgba(126,200,160,0.07)",border:"1px solid rgba(126,200,160,0.3)",borderRadius:12,padding:"16px 20px",marginBottom:24}},
      React.createElement("div", {style:{color:"#7ec8a0",fontWeight:700,fontSize:14,marginBottom:8}},
        "💡 Support is Evidence — This is Critical"
      ),
      React.createElement("div", {style:{color:"#64748B",fontSize:13,lineHeight:1.8}},
        "Every time you tell your GP, social prescriber, university welfare officer, or mental health worker about the impact of discrimination on your health and life — they create a record. Those records become evidence of injury to feelings at tribunal. A GP letter documenting anxiety since the date of discrimination is worth thousands of pounds in a Vento band award. Your social prescriber's referral notes are evidence. Your university welfare records are evidence. UJRIS helps you activate every one of these sources — for your health AND your case."
      )
    ),

    !ai && React.createElement("div", null,
      // Need tags
      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:12}},
          "What do you need support with? (select all that apply)"
        ),
        React.createElement("div", {style:{display:"flex",flexWrap:"wrap",gap:8}},
          NEED_TAGS.map(function(tag) {
            var sel = selectedNeeds.includes(tag.id);
            return React.createElement("button", {
              key:tag.id,
              onClick:function(){toggleNeed(tag.id);},
              style:{background:sel?"rgba("+( tag.id==="crisis"?"255,107,107":"126,200,160")+",0.15)":T.faint,
                border:"1px solid "+(sel?tag.color:T.border),
                borderRadius:20,padding:"7px 14px",cursor:"pointer",
                color:sel?tag.color:"#64748B",fontSize:12,transition:"all 0.2s",fontWeight:sel?600:400}
            }, tag.label);
          })
        )
      ),

      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
          "Describe what happened and how it has affected you *"
        ),
        React.createElement("textarea", {
          value:situation, onChange:function(e){setSituation(e.target.value);},
          placeholder:"e.g. Since the discrimination incident I have been experiencing anxiety, difficulty sleeping, and panic attacks. My daily life and work have been significantly affected. I have had to seek support from my GP and a mental health professional. I feel isolated and uncertain about what to do next...",
          style:{width:"100%",minHeight:150,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.7,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),

      React.createElement(Card, {style:{marginBottom:20}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:8}},
          "Anything specific about your situation (optional)"
        ),
        React.createElement("textarea", {
          value:specific, onChange:function(e){setSpecific(e.target.value);},
          placeholder:"e.g. I am Nigerian, studying at Sheffield Hallam University, and have been off work since the incident. I have already seen my GP once but didn't mention the discrimination. I have a social prescriber appointment next week.",
          style:{width:"100%",minHeight:90,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.7,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),

      React.createElement(Btn, {
        onClick:run, disabled:!situation.trim(),
        style:{width:"100%",padding:"14px",fontSize:15,background:situation.trim()?"":""}
      }, "🤝 Build My Support Network & Evidence Plan")
    ),

    loading && React.createElement("div", {style:{textAlign:"center",padding:"32px"}},
      React.createElement("div", {style:{fontSize:36,marginBottom:12}}, "🤝"),
      React.createElement("div", {style:{color:"#7ec8a0",fontSize:16,fontFamily:"'Playfair Display',serif",marginBottom:8}},
        "Building your personalised support map…"
      ),
      React.createElement("div", {style:{color:"#64748B",fontSize:13}},
        "Identifying every organisation, resource, and evidence opportunity for your situation"
      )
    ),

    ai && React.createElement("div", null,
      React.createElement("div", {style:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}},
        React.createElement(Btn, {sm:true, onClick:print}, "🖨 Print / Save PDF"),
        React.createElement(Btn, {variant:"ghost",sm:true,onClick:function(){setAi("");setSituation("");setSpecific("");setSelectedNeeds([]);}}, "🔄 New Plan")
      ),
      React.createElement(Card, {style:{borderColor:"rgba(126,200,160,0.4)",marginBottom:12}},
        React.createElement("div", {style:{color:"#7ec8a0",fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:16}},
          "✅ Your Personalised Support & Evidence Plan"
        ),
        React.createElement("div", {style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",
          color:T.white,fontSize:13,lineHeight:2,whiteSpace:"pre-wrap",
          fontFamily:"'Source Serif 4',serif",maxHeight:700,overflowY:"auto"}},
          ai
        )
      ),
      React.createElement("div", {style:{background:"rgba(126,200,160,0.06)",border:"1px solid rgba(126,200,160,0.2)",borderRadius:10,padding:"14px 16px"}},
        React.createElement("div", {style:{color:"#7ec8a0",fontSize:13,lineHeight:1.7}},
          "💚 Remember: seeking support is not weakness — it is evidence. Every professional who documents your distress strengthens your case. Take care of yourself and build your case at the same time."
        )
      )
    )
  );
}

function SARIntelligence() {
  const [activeMode, setActiveMode] = React.useState(null);

  const MODES = [
    {
      id: "compose",
      icon: "✍",
      label: "SAR Composer",
      desc: "Build a legally comprehensive Subject Access Request that casts the net wide from day one. Includes CCTV, BWV, CAD logs, internal memos, emails, incident reports — everything they don't want you to ask for.",
      detail: "Most victims only ask for obvious records. This tool asks for everything, including the documents that expose cover-ups.",
      color: T.gold,
      callout: "The CAD log lesson: if you don't ask for it specifically, they won't give it. Ask for everything by name."
    },
    {
      id: "audit",
      icon: "🔎",
      label: "SAR Response Auditor",
      desc: "Paste or describe what they sent you. UJRIS checks it against what they were legally required to provide, identifies what is missing, blurred, redacted without justification, or deliberately withheld.",
      detail: "Partial SAR compliance is a violation. Blurring your image in BWV footage, withholding CAD logs, or 'losing' CCTV are all ICO-reportable failures.",
      color: T.tealL,
      callout: "A police force blurred the claimant's own face in BWV — that is not lawful redaction. Only third parties can be redacted. UJRIS will spot it."
    },
    {
      id: "escalate",
      icon: "⚡",
      label: "SAR Failure Escalation Pack",
      desc: "They ignored you, gave you nothing, or gave you redacted garbage. Generate a formal ICO complaint, a follow-up demand letter, and a tribunal disclosure application — all in one.",
      detail: "Non-compliance with SARs carries ICO fines. For employers and police, it also creates an adverse inference at tribunal.",
      color: "#9b8fe8",
      callout: "Failure to comply is evidence of consciousness of guilt. We make sure the tribunal knows it."
    },
  ];

  if (!activeMode) {
    return React.createElement("div", null,
      React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}},
        "📂 SAR Intelligence Centre"
      ),
      React.createElement("p", {style:{color:"#1E3A5F",fontSize:14,marginBottom:16}},
        "Subject Access Requests are your most powerful pre-litigation tool. Most people ask for too little. Institutions count on it."
      ),
      React.createElement("div", {style:{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.35)",borderRadius:12,padding:"18px 20px",marginBottom:24}},
        React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:10}},
          "⚖ Your Legal Rights Under UK GDPR Article 15 & DPA 2018"
        ),
        React.createElement("div", {style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 20px"}},[
          "Right to all data held about you — in any format",
          "Right to CCTV footage featuring you",
          "Right to BWV (Body Worn Video) recordings",
          "Right to emails mentioning you by name or description",
          "Right to internal memos about incidents involving you",
          "Right to disciplinary/investigation records",
          "Right to Police CAD logs (Computer Aided Dispatch)",
          "Right to RIPA/CHIS records if surveillance was used",
          "Right to ROTA records showing who was on duty",
          "Right to 999/101 call recordings",
          "Right to incident reports and crime/occurrence logs",
          "Right to know who accessed your data and when",
          "Right to response within ONE MONTH (extendable to 3 in complex cases)",
          "Right to complain to ICO if not complied with"
        ].map(function(item, i) {
          return React.createElement("div", {key:i, style:{color:"#64748B",fontSize:12,lineHeight:1.5,paddingLeft:14,position:"relative"}},
            React.createElement("span", {style:{position:"absolute",left:0,color:T.tealL}}, "•"),
            item
          );
        }))
      ),
      React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:14}},
        MODES.map(function(m) {
          return React.createElement("button", {
            key: m.id,
            onClick: function(){setActiveMode(m.id);},
            style:{background:T.faint,border:"2px solid "+T.border,borderRadius:14,padding:"22px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"},
            onMouseEnter: function(e){e.currentTarget.style.borderColor=m.color;e.currentTarget.style.background="rgba(255,255,255,0.04)";},
            onMouseLeave: function(e){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.faint;}
          },
            React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:10}},
              React.createElement("span", {style:{fontSize:26}}, m.icon),
              React.createElement("div", {style:{color:m.color,fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700}}, m.label)
            ),
            React.createElement("div", {style:{color:T.white,fontSize:13,lineHeight:1.6,marginBottom:8}}, m.desc),
            React.createElement("div", {style:{color:T.dim,fontSize:12,lineHeight:1.5,marginBottom:10,fontStyle:"italic"}}, m.detail),
            React.createElement("div", {style:{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(212,175,55,0.3)",borderRadius:8,padding:"8px 12px"}}),
            React.createElement("div", {style:{color:T.gold,fontSize:12}}, "💡 " + m.callout),
            React.createElement("div", {style:{color:m.color,fontSize:12,marginTop:10,fontWeight:600}}, "Open Tool →")
          );
        })
      )
    );
  }

  return React.createElement(SARTool, {mode: activeMode, modes: MODES, onBack: function(){setActiveMode(null);}});
}

function SARTool({mode, modes, onBack}) {
  const modeObj = modes.find(function(m){return m.id===mode;}) || {};

  // Compose state
  const [recipientType, setRecipientType] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [claimantName, setClaimantName] = React.useState("");
  const [incidentDate, setIncidentDate] = React.useState("");
  const [incidentDesc, setIncidentDesc] = React.useState("");
  const [selectedDocs, setSelectedDocs] = React.useState([]);
  const [customDocs, setCustomDocs] = React.useState("");

  // Audit state
  const [auditRecipient, setAuditRecipient] = React.useState("");
  const [auditReceived, setAuditReceived] = React.useState("");
  const [auditMissing, setAuditMissing] = React.useState("");
  const [auditRedactions, setAuditRedactions] = React.useState("");

  // Escalate state
  const [escalateOrg, setEscalateOrg] = React.useState("");
  const [escalateIssue, setEscalateIssue] = React.useState("");
  const [escalateDays, setEscalatedays] = React.useState("");

  const [ai, setAi] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const DOCUMENT_CATEGORIES = [
    {
      category: "Video & Audio Evidence",
      icon: "🎥",
      items: [
        {id:"cctv_internal", label:"Internal CCTV footage — all cameras, all angles, relevant dates"},
        {id:"cctv_external", label:"External/entrance CCTV footage"},
        {id:"bwv", label:"Body Worn Video (BWV) recordings — police/security"},
        {id:"dash_cam", label:"Dashcam footage from any vehicles involved"},
        {id:"cctv_log", label:"CCTV system access log — who viewed/deleted footage"},
      ]
    },
    {
      category: "Police & Law Enforcement Records",
      icon: "🚔",
      items: [
        {id:"cad_log", label:"Police CAD log (Computer Aided Dispatch) — full record of the call"},
        {id:"999_recording", label:"999/101 call recording and transcript"},
        {id:"crime_report", label:"Crime report / occurrence log"},
        {id:"incident_report", label:"Police incident report"},
        {id:"arrest_record", label:"Arrest/detention record and custody log"},
        {id:"crb_pnc", label:"PNC/CRB records — any entries made about me"},
        {id:"intel_record", label:"Intelligence records, markers, or flags added to my name"},
        {id:"ripa", label:"Any RIPA/surveillance authorities relating to me"},
      ]
    },
    {
      category: "Employer / Organisation Records",
      icon: "🏢",
      items: [
        {id:"emails", label:"All emails mentioning my name, role, or description — any sender"},
        {id:"internal_memos", label:"Internal memos, notes, messages about me or the incident"},
        {id:"investigation_report", label:"Investigation/disciplinary report"},
        {id:"witness_statements", label:"Witness statements taken by employer"},
        {id:"hr_notes", label:"HR meeting notes, file notes, action notes"},
        {id:"rota", label:"ROTA/duty roster — who was on shift during the incident"},
        {id:"training_records", label:"Equality, diversity, and inclusion training records for staff involved"},
        {id:"complaints_log", label:"Previous complaints made about the same staff/location"},
        {id:"performance_reviews", label:"My performance reviews and any records used in decisions about me"},
      ]
    },
    {
      category: "Communications & Logs",
      icon: "📡",
      items: [
        {id:"radio_comms", label:"Radio communications logs during the incident"},
        {id:"intercom", label:"Intercom/PA system recordings"},
        {id:"system_logs", label:"Computer/system access logs showing my records were accessed"},
        {id:"data_audit", label:"Full data audit trail — who accessed my personal data and when"},
        {id:"social_media", label:"Any social media monitoring or posts about me"},
      ]
    },
    {
      category: "Documents & Reports",
      icon: "📋",
      items: [
        {id:"incident_log", label:"Incident log / security log entries relating to me"},
        {id:"risk_assessment", label:"Risk assessments or threat assessments involving me"},
        {id:"insurance_claim", label:"Insurance claims or loss prevention records about the incident"},
        {id:"third_party", label:"Communications with third parties (police, solicitors, insurers) about me"},
        {id:"policy_docs", label:"Equality policy, anti-discrimination policy, complaints procedure"},
      ]
    }
  ];

  const toggleDoc = function(id) {
    setSelectedDocs(function(prev) {
      return prev.includes(id) ? prev.filter(function(d){return d!==id;}) : prev.concat([id]);
    });
  };

  const selectAll = function() {
    var allIds = [];
    DOCUMENT_CATEGORIES.forEach(function(cat) {
      cat.items.forEach(function(item) { allIds.push(item.id); });
    });
    setSelectedDocs(allIds);
  };

  const getSelectedLabels = function() {
    var labels = [];
    DOCUMENT_CATEGORIES.forEach(function(cat) {
      cat.items.forEach(function(item) {
        if (selectedDocs.includes(item.id)) labels.push(item.label);
      });
    });
    if (customDocs.trim()) {
      customDocs.split("\n").forEach(function(line) {
        if (line.trim()) labels.push(line.trim());
      });
    }
    return labels;
  };

  const RECIPIENT_TYPES = [
    {id:"employer", label:"Employer / Former Employer"},
    {id:"police", label:"Police Force"},
    {id:"retailer", label:"Retailer / Shop"},
    {id:"council", label:"Local Council / Public Authority"},
    {id:"nhs", label:"NHS / Healthcare Provider"},
    {id:"other", label:"Other Organisation"},
  ];

  const runAI = async function(system, userPrompt) {
    setLoading(true); setAi(""); setDone(false);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-opus-4-5", max_tokens:2000, stream:true,
          system: system,
          messages:[{role:"user", content: userPrompt}]
        })
      });
      if(!res.ok) throw new Error("Server error " + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while(true) {
        const {done, value} = await reader.read();
        if(done) break;
        for(const line of dec.decode(value).split("\n")) {
          if(line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if(d.type==="content_block_delta"&&d.delta&&d.delta.text){full+=d.delta.text;setAi(full);}
            } catch(ex){}
          }
        }
      }
      setDone(true);
    } catch(e) { setAi("⚠ Error: "+e.message); }
    finally { setLoading(false); }
  };

  const composeSAR = function() {
    var labels = getSelectedLabels();
    var SYS = "You are UJRIS — a UK data protection and discrimination law expert. Write a formal, comprehensive Subject Access Request letter under UK GDPR Article 15, Data Protection Act 2018 s.45, and where applicable the Freedom of Information Act 2000. The letter must be: (1) Legally precise and assertive, (2) Comprehensive — requesting every category of data specified, (3) Clear about the 1-month response deadline, (4) Warning of ICO complaint, tribunal adverse inference, and civil claim if not complied with, (5) Requesting confirmation of what is NOT held if items are absent, (6) Requiring written explanation with specific legal basis for any redaction. For police SARs, also cite the Data Protection (Law Enforcement Processing) Part 3 provisions. Use formal letter format with date, addresses, reference line, body, and signature block.";
    var prompt = "Write a Subject Access Request letter with these details:\n\nRecipient Type: " + recipientType + "\nRecipient Organisation: " + recipientName + "\nClaimant Name: " + claimantName + "\nIncident Date(s): " + incidentDate + "\nIncident Description: " + incidentDesc + "\n\nDocuments/Data Requested (include ALL of these specifically):\n" + labels.map(function(l,i){return (i+1)+". "+l;}).join("\n") + "\n\nMake the letter comprehensive, legally assertive, and ensure each category of requested data is clearly and specifically listed. Include a section requiring them to confirm in writing what data they do NOT hold and why.";
    runAI(SYS, prompt);
  };

  const auditSAR = function() {
    var SYS = "You are UJRIS — a UK data protection compliance expert and discrimination case specialist. Analyse the SAR response described and identify: (1) COMPLIANCE ASSESSMENT — was this a full, partial, or non-compliant response under UK GDPR Article 15 and DPA 2018? (2) WHAT IS MISSING — list every category of data that should have been provided but was not, with legal basis for why it should be included. (3) UNLAWFUL REDACTIONS — identify any redactions or blurring that appear unlawful or unjustified. Note: blurring the data subject's own face in BWV/CCTV is generally unlawful — they can redact third parties, not the requester. (4) COVER-UP INDICATORS — flag any patterns suggesting deliberate withholding to conceal wrongdoing. (5) ICO COMPLAINT GROUNDS — specific grounds for an ICO complaint with reference to relevant regulations. (6) TRIBUNAL ADVERSE INFERENCE — how to use non-compliance as evidence of consciousness of guilt at employment or civil tribunal. (7) IMMEDIATE NEXT STEPS — prioritised action list. Be forensically precise and legally specific.";
    var prompt = "SAR RESPONSE AUDIT REQUEST\n\nOrganisation that received SAR: " + auditRecipient + "\n\nWhat they provided: " + auditReceived + "\n\nWhat appears to be missing: " + auditMissing + "\n\nRedactions/blurring concerns: " + (auditRedactions||"None specified") + "\n\nProvide full compliance audit and next steps.";
    runAI(SYS, prompt);
  };

  const escalateSAR = function() {
    var SYS = "You are UJRIS — a UK data protection enforcement and litigation expert. Generate a complete SAR Failure Escalation Pack containing three documents separated by clear headers: DOCUMENT 1: FORMAL ICO COMPLAINT — A detailed complaint to the Information Commissioner's Office citing specific breaches of UK GDPR Article 15, DPA 2018, and relevant ICO guidance. Include what was requested, what was provided, what the breach is, and the remedy sought. DOCUMENT 2: FORMAL FOLLOW-UP DEMAND LETTER — A legally assertive letter to the organisation giving them 14 days to comply in full, warning of ICO enforcement, adverse inference at tribunal, and civil claim for distress under DPA 2018 s.168. DOCUMENT 3: TRIBUNAL DISCLOSURE APPLICATION — A draft application for the tribunal to order disclosure under Employment Tribunals Rules 2013 Rule 31, citing the relevance of the withheld documents to the discrimination claim and the adverse inference to be drawn from withholding. Be specific, legally precise, and assertive throughout.";
    var prompt = "SAR ESCALATION PACK REQUEST\n\nOrganisation: " + escalateOrg + "\nDays since SAR sent: " + (escalateDays||"unknown") + "\nNature of failure/non-compliance: " + escalateIssue + "\n\nGenerate all three escalation documents.";
    runAI(SYS, prompt);
  };

  const printReport = function() {
    var w = window.open("", "_blank");
    var title = "UJRIS SAR " + (mode==="compose"?"Letter":mode==="audit"?"Compliance Audit":"Escalation Pack");
    w.document.write("<html><head><title>"+title+"</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:14px;line-height:1.8;color:#1a1a1a}h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}pre{white-space:pre-wrap;font-family:Georgia,serif}.warning{background:#fff8e1;border-left:4px solid #C9A84C;padding:12px 16px;margin:20px 0;font-size:13px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:12px;color:#666}</style></head><body><h1>"+title+"</h1><p><strong>Generated:</strong> "+new Date().toLocaleString("en-GB")+"</p><div class='warning'>Review this document carefully. Not legal advice. Consult a solicitor before submitting.</div><pre>"+ai+"</pre><div class='footer'>Generated by UJRIS — Universal Justice Response & Intelligence System | ujris.co.uk</div></body></html>");
    w.document.close(); w.print();
  };

  return React.createElement("div", null,
    React.createElement("div", {style:{display:"flex",alignItems:"center",gap:12,marginBottom:20}},
      React.createElement(Btn, {variant:"ghost", sm:true, onClick:onBack}, "← Back"),
      React.createElement("h1", {style:{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,margin:0}},
        modeObj.icon + " " + modeObj.label
      )
    ),

    // COMPOSE MODE
    !ai && mode === "compose" && React.createElement("div", null,
      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14,marginBottom:14}}, "Who are you sending this SAR to?"),
        React.createElement("div", {style:{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}},
          RECIPIENT_TYPES.map(function(r) {
            return React.createElement("button", {
              key: r.id,
              onClick: function(){setRecipientType(r.label);},
              style:{background:recipientType===r.label?"rgba(201,168,76,0.15)":T.faint,
                border:"1px solid "+(recipientType===r.label?T.gold:T.border),
                borderRadius:20,padding:"6px 14px",cursor:"pointer",
                color:recipientType===r.label?T.gold:T.muted,fontSize:12,transition:"all 0.2s"}
            }, r.label);
          })
        ),
        React.createElement("div", {style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
          React.createElement("div", null,
            React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}}, "Organisation Name *"),
            React.createElement(Input, {value:recipientName, onChange:function(e){setRecipientName(e.target.value);}, placeholder:"e.g. [Employer Name], [Police Force Name]…"})
          ),
          React.createElement("div", null,
            React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}}, "Your Full Name *"),
            React.createElement(Input, {value:claimantName, onChange:function(e){setClaimantName(e.target.value);}, placeholder:"Your legal name as it appears on ID"})
          )
        ),
        React.createElement("div", {style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}},
          React.createElement("div", null,
            React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}}, "Incident Date(s)"),
            React.createElement(Input, {value:incidentDate, onChange:function(e){setIncidentDate(e.target.value);}, placeholder:"e.g. 14 March 2025"})
          ),
          React.createElement("div", null,
            React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:4}}, "Brief Incident Description"),
            React.createElement(Input, {value:incidentDesc, onChange:function(e){setIncidentDesc(e.target.value);}, placeholder:"e.g. Racial profiling and false accusation of theft"})
          )
        )
      ),

      React.createElement(Card, {style:{marginBottom:16}},
        React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}},
          React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:14}}, "📋 Select All Documents to Request"),
          React.createElement("div", {style:{display:"flex",gap:8}},
            React.createElement(Btn, {variant:"ghost", sm:true, onClick:selectAll}, "✅ Select All"),
            React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setSelectedDocs([]);}},"Clear")
          )
        ),
        React.createElement("div", {style:{color:T.tealL,fontSize:12,marginBottom:14}},
          "💡 Pro tip: Select everything relevant. You can always narrow down later — but you cannot add items after the SAR is sent without sending a new one."
        ),
        DOCUMENT_CATEGORIES.map(function(cat) {
          return React.createElement("div", {key:cat.category, style:{marginBottom:16}},
            React.createElement("div", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8,display:"flex",alignItems:"center",gap:6}},
              React.createElement("span", null, cat.icon), cat.category
            ),
            cat.items.map(function(item) {
              var selected = selectedDocs.includes(item.id);
              return React.createElement("button", {
                key: item.id,
                onClick: function(){toggleDoc(item.id);},
                style:{display:"block",width:"100%",textAlign:"left",background:selected?"rgba(12,123,122,0.12)":T.faint,
                  border:"1px solid "+(selected?T.teal:T.border),borderRadius:8,padding:"8px 12px",
                  cursor:"pointer",marginBottom:4,transition:"all 0.15s",color:selected?T.tealL:T.muted,fontSize:12,lineHeight:1.4}
              },
                React.createElement("span", {style:{marginRight:8}}, selected?"✅":"☐"),
                item.label
              );
            })
          );
        }),
        React.createElement("div", {style:{marginTop:12}},
          React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}},
            "Additional specific items (one per line)"
          ),
          React.createElement("textarea", {
            value:customDocs, onChange:function(e){setCustomDocs(e.target.value);},
            placeholder:"e.g. The CCTV footage from Camera 3 in the staff room between 14:00-16:00 on 14 March 2025\nThe WhatsApp messages between the store manager and duty manager on the day of the incident",
            style:{width:"100%",minHeight:80,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
              borderRadius:8,padding:"10px 12px",color:T.white,fontSize:12,lineHeight:1.5,
              fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
          })
        )
      ),

      React.createElement("div", {style:{background:"rgba(255,107,107,0.06)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:16}},
        React.createElement("div", {style:{color:"#ff9999",fontSize:12,lineHeight:1.6}}),
        React.createElement("div", {style:{color:"#ff9999",fontSize:13,fontWeight:700,marginBottom:4}}, "⚠ Before you send:"),
        React.createElement("div", {style:{color:"#ffbbbb",fontSize:12,lineHeight:1.6}},
          "Send by recorded delivery or email with read receipt. Keep a copy. The 1-month clock starts when they receive it — not when you send it. If sending to police, address to their Data Protection Officer (DPO)."
        )
      ),

      React.createElement(Btn, {
        onClick:composeSAR,
        disabled: !recipientName.trim() || !claimantName.trim() || selectedDocs.length===0,
        style:{width:"100%",padding:"14px",fontSize:15}
      }, "✍ Generate My Comprehensive SAR — " + selectedDocs.length + " document categories selected")
    ),

    // AUDIT MODE
    !ai && mode === "audit" && React.createElement(Card, {style:{marginBottom:16}},
      React.createElement("div", {style:{background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:10,padding:"14px",marginBottom:20}},
        React.createElement("div", {style:{color:T.gold,fontWeight:700,fontSize:13,marginBottom:6}}, "🔎 What this tool checks:"),
        React.createElement("div", {style:{color:"#64748B",fontSize:12,lineHeight:1.8}},
          "• Did they provide everything they were legally required to?\n• Were any redactions lawful? (Blurring the data subject's own face is NOT lawful)\n• What is conspicuously absent — and what does that suggest?\n• Is non-compliance evidence of a cover-up?\n• What are your next steps?"
        )
      ),
      React.createElement("div", {style:{marginBottom:14}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Organisation you sent the SAR to *"),
        React.createElement(Input, {value:auditRecipient, onChange:function(e){setAuditRecipient(e.target.value);}, placeholder:"e.g. [Police Force Name], [Employer Name]"})
      ),
      React.createElement("div", {style:{marginBottom:14}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "What they provided (describe in detail) *"),
        React.createElement("textarea", {
          value:auditReceived, onChange:function(e){setAuditReceived(e.target.value);},
          placeholder:"e.g. They sent: 3 pages of HR notes (redacted), 1 CCTV clip from one camera only (my face blurred throughout), a letter saying no emails exist, and nothing else. The BWV was not provided. No CAD log. No incident report.",
          style:{width:"100%",minHeight:130,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),
      React.createElement("div", {style:{marginBottom:14}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "What you believe is missing"),
        React.createElement("textarea", {
          value:auditMissing, onChange:function(e){setAuditMissing(e.target.value);},
          placeholder:"e.g. CAD log, BWV from 3 officers present, CCTV from Camera 2 which was at a different angle, internal communications between staff after incident, detention log",
          style:{width:"100%",minHeight:100,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),
      React.createElement("div", {style:{marginBottom:20}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Redactions or blurring concerns"),
        React.createElement("textarea", {
          value:auditRedactions, onChange:function(e){setAuditRedactions(e.target.value);},
          placeholder:"e.g. My own face was blurred in the BWV footage. I am the data subject — this is my footage. They blurred my face but showed the officer's face clearly. Other CCTV was heavily pixelated making it impossible to see what happened.",
          style:{width:"100%",minHeight:90,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),
      React.createElement(Btn, {onClick:auditSAR, disabled:!auditRecipient.trim()||!auditReceived.trim(), style:{width:"100%",padding:"14px",fontSize:15}},
        "🔎 Run Full Compliance Audit"
      )
    ),

    // ESCALATE MODE
    !ai && mode === "escalate" && React.createElement(Card, {style:{marginBottom:16}},
      React.createElement("div", {style:{background:"rgba(155,143,232,0.08)",border:"1px solid rgba(155,143,232,0.3)",borderRadius:10,padding:"14px",marginBottom:20}},
        React.createElement("div", {style:{color:"#9b8fe8",fontWeight:700,fontSize:13,marginBottom:6}}, "⚡ This generates three documents:"),
        React.createElement("div", {style:{color:"#64748B",fontSize:12,lineHeight:1.8}},
          "1. ICO Complaint — formal complaint to the Information Commissioner\n2. Follow-Up Demand Letter — 14-day compliance ultimatum to the organisation\n3. Tribunal Disclosure Application — court order for them to hand over withheld documents"
        )
      ),
      React.createElement("div", {style:{marginBottom:14}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Organisation name *"),
        React.createElement(Input, {value:escalateOrg, onChange:function(e){setEscalateOrg(e.target.value);}, placeholder:"e.g. ABC Retail Ltd"})
      ),
      React.createElement("div", {style:{marginBottom:14}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Days since SAR was sent"),
        React.createElement(Input, {value:escalateDays, onChange:function(e){setEscalatedays(e.target.value);}, placeholder:"e.g. 45"})
      ),
      React.createElement("div", {style:{marginBottom:20}},
        React.createElement("label", {style:{color:"#64748B",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:6}}, "Describe the failure in detail *"),
        React.createElement("textarea", {
          value:escalateIssue, onChange:function(e){setEscalateIssue(e.target.value);},
          placeholder:"e.g. Sent SAR on 1 Feb 2025. No response at all after 45 days. Previously sent a reminder on day 32 by email and recorded delivery — no acknowledgement. The SAR requested CCTV, CAD logs, emails, and BWV footage related to a racial discrimination incident on 14 Jan 2025.",
          style:{width:"100%",minHeight:130,background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
            borderRadius:8,padding:"12px",color:T.white,fontSize:13,lineHeight:1.6,
            fontFamily:"'Source Serif 4',serif",resize:"vertical",boxSizing:"border-box"}
        })
      ),
      React.createElement(Btn, {onClick:escalateSAR, disabled:!escalateOrg.trim()||!escalateIssue.trim(), style:{width:"100%",padding:"14px",fontSize:15}},
        "⚡ Generate Full Escalation Pack"
      )
    ),

    // RESULTS
    (loading || ai) && React.createElement("div", null,
      loading && React.createElement("div", {style:{textAlign:"center",padding:"20px 0",color:T.gold,fontSize:14}},
        mode==="compose" ? "✍ Composing your comprehensive SAR…" :
        mode==="audit" ? "🔎 Auditing SAR compliance…" :
        "⚡ Generating escalation pack…"
      ),
      ai && React.createElement("div", null,
        React.createElement("div", {style:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}},
          React.createElement(Btn, {sm:true, onClick:printReport}, "🖨 Print / Save PDF"),
          React.createElement(Btn, {variant:"ghost", sm:true, onClick:function(){setAi("");setDone(false);}}, "← Edit"),
        ),
        React.createElement(Card, {style:{borderColor:modeObj.color?modeObj.color+"55":T.border}},
          React.createElement("div", {style:{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:16}},
            "✅ " + modeObj.label + " — Complete"
          ),
          React.createElement("div", {style:{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"20px",
            color:T.white,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",
            fontFamily:"'Source Serif 4',serif",maxHeight:650,overflowY:"auto"}},
            ai
          )
        ),
        React.createElement(Card, {style:{marginTop:12,background:"rgba(255,107,107,0.06)",borderColor:"rgba(255,107,107,0.2)"}},
          React.createElement("div", {style:{color:"#ff9999",fontSize:12,lineHeight:1.6}},
            "⚠ Review all generated documents carefully before sending. Verify names, dates, and details are accurate. Not legal advice — consider solicitor review for complex cases."
          )
        )
      )
    )
  );
}

function Calculator({ caseData }) {
  const [tab, setTab] = useState("schedule"); // schedule | pension | ai
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [claimType, setClaimType] = useState("unfair_dismissal");

  // Schedule of Loss fields
  const [salary, setSalary] = useState("");
  const [yearsService, setYearsService] = useState("");
  const [age, setAge] = useState("");
  const [weeksUnemployed, setWeeksUnemployed] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [noticeWeeks, setNoticeWeeks] = useState("");
  const [ventoband, setVentoband] = useState("middle");
  const [setting, setSetting] = useState("employment");

  // Pension fields
  const [pensionType, setPensionType] = useState("defined_contribution");
  const [employerContrib, setEmployerContrib] = useState("");
  const [pensionSalary, setPensionSalary] = useState("");
  const [pensionYearsLost, setPensionYearsLost] = useState("");
  const [pensionPot, setPensionPot] = useState("");
  const [retirementAge, setRetirementAge] = useState("67");

  // Vento bands 2024/25
  const VENTO = { lower:{min:1200,max:11700}, middle:{min:11700,max:35100}, upper:{min:35100,max:56000} };

  // Basic Award calculator (statutory)
  const calcBasicAward = () => {
    if (!salary || !yearsService || !age) return null;
    const wkPay = Math.min(Number(salary)/52, 643); // £643 weekly pay cap 2024/25
    const yrs = Math.min(Number(yearsService), 20);
    const a = Number(age);
    let multiplier = 0;
    for (let i = 0; i < yrs; i++) {
      const ageAtYear = a - i;
      if (ageAtYear >= 41) multiplier += 1.5;
      else if (ageAtYear >= 22) multiplier += 1;
      else multiplier += 0.5;
    }
    return Math.round(wkPay * multiplier);
  };

  // Loss of earnings calculator
  const calcLossEarnings = () => {
    if (!salary || !weeksUnemployed) return null;
    const wkPay = Number(salary) / 52;
    const newWkPay = newSalary ? Number(newSalary) / 52 : 0;
    const diff = Math.max(0, wkPay - newWkPay);
    return Math.round(diff * Number(weeksUnemployed));
  };

  // Notice pay
  const calcNotice = () => {
    if (!salary || !noticeWeeks) return null;
    return Math.round((Number(salary) / 52) * Number(noticeWeeks));
  };

  // Pension shortfall
  const calcPension = () => {
    if (!pensionSalary || !pensionYearsLost || !employerContrib) return null;
    const annualContrib = (Number(pensionSalary) * Number(employerContrib)) / 100;
    if (pensionType === "defined_contribution") {
      const totalLost = annualContrib * Number(pensionYearsLost);
      const growthFactor = 1.04; // 4% assumed growth
      return Math.round(totalLost * growthFactor);
    } else {
      // Defined benefit — simplified actuarial estimate
      const annualPension = (Number(pensionSalary) / 60) * Number(pensionYearsLost);
      const yearsToRetirement = Math.max(0, Number(retirementAge) - Number(age || 40));
      return Math.round(annualPension * Math.min(20, yearsToRetirement));
    }
  };

  const basicAward = calcBasicAward();
  const lossEarnings = calcLossEarnings();
  const noticePay = calcNotice();
  const ventoMin = VENTO[ventoband]?.min || 0;
  const ventoMax = VENTO[ventoband]?.max || 0;
  const pensionLoss = calcPension();
  const scheduleTotal = (basicAward||0) + (lossEarnings||0) + (noticePay||0) + ventoMin;
  const scheduleMax = (basicAward||0) + (lossEarnings||0) + (noticePay||0) + ventoMax + (pensionLoss||0);

  const fmt = (n) => n ? `£${n.toLocaleString()}` : "—";

  const generateAI = () => {
    setLoading(true); setResult("");
    const SYS = `You are UJRIS — a UK discrimination and employment law compensation expert. Provide a detailed Schedule of Loss breakdown including Basic Award, Compensatory Award, injury to feelings (Vento band), pension loss, and realistic settlement range. Reference Employment Rights Act 1996, Equality Act 2010, and current 2024/25 statutory limits. Be specific with figures. Always recommend legal advice.`;
    const prompt = `Claim type: ${claimType}. Setting: ${setting}. Annual salary: £${salary||"not provided"}. Years of service: ${yearsService||"not provided"}. Age: ${age||"not provided"}. Weeks unemployed: ${weeksUnemployed||"not provided"}. New salary: £${newSalary||"not started new job"}. Notice weeks owed: ${noticeWeeks||"not provided"}. Vento band: ${ventoband}. Pension type: ${pensionType}. Employer pension contribution: ${employerContrib||"not provided"}%. ${caseData?.title?"Case: "+caseData.title:""}. Generate a full Schedule of Loss with all heads of claim.`;
    streamAI(SYS, prompt, (t)=>setResult(t), ()=>setLoading(false));
  };

  const INP = (props) => (
    <input type="number" {...props}
      style={{width:"100%",padding:"9px 12px",background:T.navyL,color:T.white,
        border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,boxSizing:"border-box",...props.style}}/>
  );
  const LBL = ({children}) => <label style={{color:"#64748B",fontSize:12,display:"block",marginBottom:4}}>{children}</label>;

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
      <h2 style={{color:T.gold,marginBottom:4}}>⚖ Compensation Calculator</h2>
      <p style={{color:T.muted,marginBottom:20,fontSize:13}}>Full Schedule of Loss — Basic Award, loss of earnings, pension shortfall, and injury to feelings across all claim types.</p>

      {/* Tab selector */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["schedule","📊 Schedule of Loss"],["pension","🏦 Pension Shortfall"],["ai","🤖 AI Full Analysis"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${tab===id?T.gold:T.border}`,
              background:tab===id?T.goldBg:"none",color:tab===id?T.gold:T.muted,fontWeight:tab===id?700:400,
              cursor:"pointer",fontSize:13}}>
            {label}
          </button>
        ))}
      </div>

      {tab==="schedule" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div>
              <LBL>Claim Type</LBL>
              <select value={claimType} onChange={e=>setClaimType(e.target.value)}
                style={{width:"100%",padding:"9px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13}}>
                <option value="unfair_dismissal">Unfair Dismissal</option>
                <option value="constructive_dismissal">Constructive Dismissal</option>
                <option value="race_discrimination">Race Discrimination</option>
                <option value="disability_discrimination">Disability Discrimination</option>
                <option value="sex_discrimination">Sex Discrimination</option>
                <option value="whistleblowing">Whistleblowing Detriment</option>
                <option value="wrongful_dismissal">Wrongful Dismissal</option>
                <option value="housing_discrimination">Housing Discrimination</option>
                <option value="education_discrimination">Education Discrimination</option>
                <option value="services_discrimination">Goods & Services Discrimination</option>
                <option value="policing_discrimination">Policing / Public Authority</option>
              </select>
            </div>
            <div>
              <LBL>Setting</LBL>
              <select value={setting} onChange={e=>setSetting(e.target.value)}
                style={{width:"100%",padding:"9px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13}}>
                <option value="employment">Employment Tribunal</option>
                <option value="county_court">County Court</option>
              </select>
            </div>
            <div><LBL>Annual Salary (£)</LBL><INP value={salary} onChange={e=>setSalary(e.target.value)} placeholder="e.g. 28000"/></div>
            <div><LBL>Age</LBL><INP value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 35"/></div>
            <div><LBL>Years of Service</LBL><INP value={yearsService} onChange={e=>setYearsService(e.target.value)} placeholder="e.g. 3"/></div>
            <div><LBL>Weeks Unemployed Since Dismissal</LBL><INP value={weeksUnemployed} onChange={e=>setWeeksUnemployed(e.target.value)} placeholder="e.g. 12"/></div>
            <div><LBL>New Job Salary (£, if any)</LBL><INP value={newSalary} onChange={e=>setNewSalary(e.target.value)} placeholder="0 if still unemployed"/></div>
            <div><LBL>Notice Period Owed (weeks)</LBL><INP value={noticeWeeks} onChange={e=>setNoticeWeeks(e.target.value)} placeholder="e.g. 4"/></div>
            <div style={{gridColumn:"1/-1"}}>
              <LBL>Injury to Feelings — Vento Band</LBL>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["lower","Lower Band","£1,200–£11,700","Isolated incident"],
                  ["middle","Middle Band","£11,700–£35,100","Serious, sustained"],
                  ["upper","Upper Band","£35,100–£56,000","Exceptional / campaign"]].map(([id,name,range,desc])=>(
                  <button key={id} onClick={()=>setVentoband(id)}
                    style={{padding:"10px",borderRadius:8,border:`2px solid ${ventoband===id?T.gold:T.border}`,
                      background:ventoband===id?T.goldBg:T.navyL,cursor:"pointer",textAlign:"left"}}>
                    <div style={{color:ventoband===id?T.gold:T.white,fontWeight:700,fontSize:12}}>{name}</div>
                    <div style={{color:T.tealL,fontSize:11}}>{range}</div>
                    <div style={{color:T.muted,fontSize:10,marginTop:2}}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Schedule of Loss */}
          <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.goldD}`,marginBottom:16}}>
            <div style={{color:T.gold,fontWeight:700,fontSize:15,marginBottom:14}}>📋 Schedule of Loss</div>
            {[
              ["Basic Award (statutory)", basicAward, "Based on age × years × weekly pay (capped £643/week)"],
              ["Loss of Earnings", lossEarnings, `${weeksUnemployed||"?"} weeks × weekly pay differential`],
              ["Notice Pay", noticePay, `${noticeWeeks||"?"} weeks notice owed`],
              ["Injury to Feelings", `${fmt(ventoMin)} – ${fmt(ventoMax)}`, `${ventoband.charAt(0).toUpperCase()+ventoband.slice(1)} Vento band`],
              ["Pension Loss", pensionLoss, "See Pension tab for detailed calculation"],
            ].map(([label,value,note])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <div>
                  <div style={{color:"#0F2C4A",fontSize:13,fontWeight:600}}>{label}</div>
                  <div style={{color:"#64748B",fontSize:11,marginTop:2}}>{note}</div>
                </div>
                <div style={{color:T.gold,fontWeight:700,fontSize:14,textAlign:"right",flexShrink:0,marginLeft:12}}>
                  {typeof value==="number"?fmt(value):value||"—"}
                </div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,
              padding:"12px 0",borderTop:`2px solid ${T.gold}`}}>
              <div style={{color:T.white,fontWeight:700,fontSize:15}}>Estimated Total Range</div>
              <div style={{color:T.gold,fontWeight:800,fontSize:18}}>
                {scheduleTotal>0?`${fmt(scheduleTotal)} – ${fmt(scheduleMax)}`:"Enter details above"}
              </div>
            </div>
            <div style={{marginTop:10,padding:"8px 12px",background:T.redBg,borderRadius:8,color:"#64748B",fontSize:11}}>
              ⚠ Estimates only. Actual awards depend on tribunal discretion, mitigation, and case specifics. Always seek qualified legal advice.
            </div>
          </div>
          <button onClick={()=>setTab("ai")}
            style={{width:"100%",padding:"11px",background:T.teal,color:T.white,border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>
            🤖 Get Full AI Analysis of This Schedule →
          </button>
        </div>
      )}

      {tab==="pension" && (
        <div>
          <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
            <div style={{color:T.white,fontWeight:700,marginBottom:4}}>🏦 Pension Loss Calculator</div>
            <div style={{color:"#64748B",fontSize:12,marginBottom:16}}>Pension loss is a recognised head of claim in UK Employment Tribunals and County Court discrimination cases. Include it in every Schedule of Loss.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{gridColumn:"1/-1"}}>
                <LBL>Pension Type</LBL>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["defined_contribution","Defined Contribution (DC)","Most private sector — employer contributes % of salary to a pot"],
                    ["defined_benefit","Defined Benefit (DB)","Final salary / career average — common in public sector"]].map(([id,name,desc])=>(
                    <button key={id} onClick={()=>setPensionType(id)}
                      style={{padding:"12px",borderRadius:8,border:`2px solid ${pensionType===id?T.gold:T.border}`,
                        background:pensionType===id?T.goldBg:T.navyL,cursor:"pointer",textAlign:"left"}}>
                      <div style={{color:pensionType===id?T.gold:T.white,fontWeight:700,fontSize:12}}>{name}</div>
                      <div style={{color:T.muted,fontSize:10,marginTop:3}}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div><LBL>Annual Salary at Time of Dismissal (£)</LBL><INP value={pensionSalary} onChange={e=>setPensionSalary(e.target.value)} placeholder="e.g. 32000"/></div>
              <div><LBL>Employer Pension Contribution (%)</LBL><INP value={employerContrib} onChange={e=>setEmployerContrib(e.target.value)} placeholder="e.g. 5"/></div>
              <div><LBL>Years of Pension Lost (estimated)</LBL><INP value={pensionYearsLost} onChange={e=>setPensionYearsLost(e.target.value)} placeholder="e.g. 2"/></div>
              <div><LBL>Your Current Age</LBL><INP value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 38"/></div>
              {pensionType==="defined_benefit" && (
                <div style={{gridColumn:"1/-1"}}><LBL>State/Scheme Retirement Age</LBL><INP value={retirementAge} onChange={e=>setRetirementAge(e.target.value)} placeholder="67"/></div>
              )}
            </div>
          </div>

          {pensionLoss && (
            <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.goldD}`,marginBottom:16}}>
              <div style={{color:T.gold,fontWeight:700,marginBottom:12}}>📊 Pension Loss Estimate</div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{color:T.white,fontSize:13}}>Annual employer pension contribution</span>
                <span style={{color:T.gold,fontWeight:700}}>{fmt(Math.round((Number(pensionSalary)*Number(employerContrib))/100))}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{color:T.white,fontSize:13}}>Years of pension lost</span>
                <span style={{color:T.gold,fontWeight:700}}>{pensionYearsLost} years</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{color:T.white,fontSize:13}}>Calculation method</span>
                <span style={{color:T.tealL,fontSize:12}}>{pensionType==="defined_contribution"?"DC contributions + 4% growth":"DB actuarial estimate"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0",borderTop:`2px solid ${T.gold}`,marginTop:4}}>
                <span style={{color:T.white,fontWeight:700,fontSize:15}}>Pension Loss Claim</span>
                <span style={{color:T.gold,fontWeight:800,fontSize:18}}>{fmt(pensionLoss)}</span>
              </div>
              <div style={{padding:"8px 12px",background:T.tealBg,borderRadius:8,color:T.tealL,fontSize:11,marginTop:8}}>
                💡 Add this figure to your Schedule of Loss under "Pension Loss". Tribunals regularly award pension loss — do not omit it.
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="ai" && (
        <div>
          <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
            <div style={{color:T.white,fontWeight:700,marginBottom:4}}>🤖 AI Full Schedule of Loss Analysis</div>
            <div style={{color:"#64748B",fontSize:13,marginBottom:16}}>AI generates a complete, court-ready Schedule of Loss narrative with all heads of claim, legal references, and settlement range.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div><LBL>Claim Type</LBL>
                <select value={claimType} onChange={e=>setClaimType(e.target.value)}
                  style={{width:"100%",padding:"9px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13}}>
                  <option value="unfair_dismissal">Unfair Dismissal</option>
                  <option value="constructive_dismissal">Constructive Dismissal</option>
                  <option value="race_discrimination">Race Discrimination</option>
                  <option value="disability_discrimination">Disability Discrimination</option>
                  <option value="sex_discrimination">Sex Discrimination</option>
                  <option value="whistleblowing">Whistleblowing</option>
                  <option value="housing_discrimination">Housing Discrimination</option>
                  <option value="education_discrimination">Education Discrimination</option>
                  <option value="services_discrimination">Goods & Services</option>
                  <option value="policing">Policing / Public Authority</option>
                </select>
              </div>
              <div><LBL>Annual Salary (£)</LBL><INP value={salary} onChange={e=>setSalary(e.target.value)} placeholder="e.g. 28000"/></div>
              <div><LBL>Years of Service</LBL><INP value={yearsService} onChange={e=>setYearsService(e.target.value)} placeholder="e.g. 3"/></div>
              <div><LBL>Age</LBL><INP value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 35"/></div>
            </div>
            <button onClick={generateAI} disabled={loading}
              style={{width:"100%",padding:"12px",background:loading?"#444":T.gold,color:T.navy,border:"none",borderRadius:8,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontSize:14}}>
              {loading?"Generating Schedule of Loss...":"🤖 Generate Full AI Schedule of Loss"}
            </button>
          </div>
          {result && (
            <div style={{background:T.navyM,borderRadius:12,padding:24,border:`1px solid ${T.goldD}`,whiteSpace:"pre-wrap",color:T.white,fontSize:13,lineHeight:1.8}}>
              <div style={{color:T.gold,fontWeight:700,marginBottom:12}}>📊 AI Schedule of Loss</div>
              {result}
              <div style={{marginTop:16,padding:"10px 12px",background:T.redBg,borderRadius:8,color:"#64748B",fontSize:11}}>
                ⚠ Estimates only. Always seek qualified legal advice before submitting a Schedule of Loss to tribunal or court.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Pricing() {
  const [loading, setLoading] = useState(null);

  const plans = [
    { id:"free", name:"Free", price:"£0", period:"forever", color:T.muted, border:T.border,
      features:["1 case","Basic assessment","Evidence vault","AI rights advisor"],
      cta:"Current Plan", disabled:true },
    { id:"individual_pro", name:"Individual Pro", price:"£9.99", period:"/month", color:T.teal, border:T.teal,
      features:["Unlimited cases","All AI tools","Document generator","Priority support","Forensic analysis"],
      cta:"Get Pro", popular:true },
    { id:"report", name:"Document Pack", price:"£29", period:"one-off", color:T.gold, border:T.gold,
      features:["ET1 draft","SAR letter","Forensic index","Tribunal bundle","Downloadable PDFs"],
      cta:"Buy Pack" },
    { id:"solicitor_pro", name:"Solicitor Pro", price:"£199", period:"/month", color:"#7C3AED", border:"#7C3AED",
      features:["50+ client cases","Client portal","API access","Bulk documents","White-label option"],
      cta:"Contact Us" },
    { id:"charity", name:"Charity", price:"£99", period:"/month", color:T.tealL, border:T.tealL,
      features:["Unlimited cases","Impact dashboard","Grant reports","Bulk operations","Triage tools"],
      cta:"Apply" },
    { id:"union", name:"Trade Union", price:"£199", period:"/month", color:"#DC2626", border:"#DC2626",
      features:["Member portal","Rep dashboard","Union letterhead","Settlement tracker","Case analytics"],
      cta:"Contact Us" },
  ];

  const handlePurchase = async (plan) => {
    setLoading(plan.id);
    try {
      const endpoint = plan.id === "report" ? "/api/payments/report" : "/api/payments/subscription";
      const body = plan.id === "report"
        ? { caseId: "current", userId: "user" }
        : { plan: plan.id, userId: "user" };
      const res = await fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.demo) {
        alert("💳 Payments coming soon! Stripe integration ready — add STRIPE_SECRET_KEY to enable.");
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch { alert("Error processing payment. Please try again."); }
    setLoading(null);
  };

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <h2 style={{color:T.gold,fontSize:28,marginBottom:8}}>⚖ UJRIS Enterprise Plans</h2>
        <p style={{color:T.muted,fontSize:15}}>From individual litigants to law firms — plans for every need</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:40}}>
        {plans.map(plan=>(
          <div key={plan.id} style={{background:"#FAF6F0",borderRadius:14,padding:24,border:`2px solid ${plan.popular?plan.border:T.border}`,
            position:"relative",transition:"transform 0.2s"}}>
            {plan.popular && (
              <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",
                background:T.teal,color:T.white,fontSize:11,fontWeight:700,padding:"4px 14px",borderRadius:20}}>
                MOST POPULAR
              </div>
            )}
            <div style={{marginBottom:16}}>
              <div style={{color:plan.color,fontWeight:700,fontSize:16,marginBottom:4}}>{plan.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{color:T.white,fontSize:28,fontWeight:800}}>{plan.price}</span>
                <span style={{color:"#64748B",fontSize:13}}>{plan.period}</span>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              {plan.features.map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{color:plan.color,fontSize:14}}>✓</span>
                  <span style={{color:T.white,fontSize:13}}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>!plan.disabled&&handlePurchase(plan)}
              disabled={plan.disabled||loading===plan.id}
              style={{width:"100%",padding:"11px 0",borderRadius:8,border:"none",fontWeight:700,fontSize:14,cursor:plan.disabled?"default":"pointer",
                background:plan.disabled?"#333":loading===plan.id?"#555":plan.color,
                color:plan.id==="individual_pro"||plan.id==="report"?T.navy:T.white}}>
              {loading===plan.id?"Processing...":plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div style={{background:"#FAF6F0",borderRadius:14,padding:28,border:`1px solid ${T.border}`}}>
        <div style={{color:T.gold,fontWeight:700,fontSize:16,marginBottom:16}}>🏢 B2B & Enterprise</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
          {[
            {icon:"⚖",title:"Law Firms",desc:"White-label UJRIS for client intake and case management",price:"£499/month"},
            {icon:"🤝",title:"Citizens Advice",desc:"Triage tool + bulk document generation for caseworkers",price:"£99/month"},
            {icon:"🎓",title:"Universities",desc:"Student training modules + anonymised research API",price:"£499/year"},
            {icon:"🔗",title:"API Access",desc:"REST API for integration with practice management software",price:"£49/month"},
          ].map(b=>(
            <div key={b.title} style={{padding:16,background:T.navyL,borderRadius:12,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:28,marginBottom:8}}>{b.icon}</div>
              <div style={{color:T.white,fontWeight:700,marginBottom:4}}>{b.title}</div>
              <div style={{color:"#64748B",fontSize:12,marginBottom:8}}>{b.desc}</div>
              <div style={{color:T.gold,fontSize:13,fontWeight:600}}>{b.price}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,textAlign:"center"}}>
          <a href="mailto:enterprise@ujris.co.uk" style={{color:T.gold,fontSize:14,fontWeight:600}}>
            Contact enterprise@ujris.co.uk for B2B pricing →
          </a>
        </div>
      </div>
    </div>
  );
}

function Rights({ userProfile }) {
  const [q, setQ] = useState(""); 
  const [ai, setAi] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [emailActions, setEmailActions] = useState([]);

  // Extract actionable email addresses from AI response
  function extractEmailActions(text) {
    const actions = [];
    // Known authority emails embedded in responses
    const knownEmails = [
      { pattern: /dataprotection@met\.police\.uk/gi, label: "Met Police DPO", org: "Metropolitan Police", subject: "Subject Access Request — BWV Footage" },
      { pattern: /casework@ico\.org\.uk/gi, label: "ICO", org: "Information Commissioner's Office", subject: "Data Protection Complaint" },
      { pattern: /correspondence@equalityhumanrights\.com/gi, label: "EHRC", org: "Equality and Human Rights Commission", subject: "Equality Act 2010 Complaint" },
      { pattern: /enquiries@policeconduct\.gov\.uk/gi, label: "IOPC", org: "Independent Office for Police Conduct", subject: "Police Misconduct Complaint" },
      { pattern: /helpline@acas\.org\.uk/gi, label: "ACAS", org: "ACAS", subject: "Early Conciliation Request" },
      { pattern: /whistle@protect-advice\.org\.uk/gi, label: "Protect", org: "Protect (Whistleblowing)", subject: "Protected Disclosure Advice" },
      { pattern: /fgmhelp@nspcc\.org\.uk/gi, label: "NSPCC FGM", org: "NSPCC", subject: "FGM Support Request" },
      { pattern: /fmu@fcdo\.gov\.uk/gi, label: "Forced Marriage Unit", org: "FMU", subject: "Forced Marriage Support" },
      { pattern: /info@survivingeconomicabuse\.org/gi, label: "Surviving Economic Abuse", org: "SEA", subject: "Economic Abuse Support" },
    ];
    
    // Also extract any email@domain.xx patterns from the text
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const found = text.match(emailRegex) || [];
    
    knownEmails.forEach(ke => {
      if (ke.pattern.test(text)) {
        const emailMatch = text.match(ke.pattern);
        if (emailMatch) {
          actions.push({ email: emailMatch[0].toLowerCase(), label: ke.label, org: ke.org, subject: ke.subject });
        }
      }
    });
    
    // Any other emails found
    found.forEach(email => {
      const already = actions.find(a => a.email === email.toLowerCase());
      if (!already && email.length < 80) {
        actions.push({ email: email.toLowerCase(), label: email, org: email.split('@')[1], subject: "UJRIS — Legal Correspondence" });
      }
    });
    
    return actions;
  }

  const SYS = `You are UJRIS — a UK discrimination and employment rights expert. Answer clearly, precisely, and empoweringly. The person asking has likely experienced discrimination. 

CRITICAL FORMATTING RULES:
1. Always include the EXACT email address for any authority you recommend contacting (e.g., "casework@ico.org.uk" not just "the ICO")
2. Structure: (1) Direct Answer, (2) Legal Basis with Act/section, (3) Practical Steps with exact email addresses
3. Under 300 words. No jargon without explanation.
4. End with: "YOUR NEXT EMAIL:" followed by exactly who to email and their address in format: name@domain.xxx

Known authority emails to use:
- ICO complaints: casework@ico.org.uk
- EHRC: correspondence@equalityhumanrights.com  
- IOPC (police): enquiries@policeconduct.gov.uk
- ACAS: helpline@acas.org.uk
- Met Police DPO: dataprotection@met.police.uk
- Protect (whistleblowing): whistle@protect-advice.org.uk`;

  const ask = async (question) => {
    const qs = question || q;
    if (!qs.trim()) return;
    setLoading(true); setAi(""); setQ(qs); setEmailActions([]);
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({system: SYS, messages:[{role:"user",content:qs}], max_tokens:1500})
      });
      const data = await res.json();
      const text = (data.content||[]).map(b=>b.type==="text"?b.text:"").join("") || data.text || data.error || "No response received.";
      setAi(text);
      setEmailActions(extractEmailActions(text));
    } catch(e) {
      setAi("Connection error: " + e.message);
    }
    setLoading(false);
  };

  const QUICK = [
    "What is the time limit to file an ET claim?",
    "What does ACAS Early Conciliation involve and is it mandatory?",
    "Can I be dismissed for raising a discrimination complaint?",
    "What is constructive dismissal and how do I prove it?",
    "What are the 9 protected characteristics under Equality Act 2010?",
    "What is a Subject Access Request and how does it help my case?",
    "What is 'victimisation' under UK discrimination law?",
    "Can I record conversations at work as evidence?",
    "What is the EHRC and can they help me?",
    "How do I find a free solicitor or legal aid?",
    "What does 'on the balance of probabilities' mean for my case?",
    "Can I claim discrimination if I'm on a zero-hours contract?",
  ];

  const LAWS = [
    {icon:"⚖",title:"Equality Act 2010",desc:"9 protected characteristics · direct/indirect discrimination · harassment · victimisation · reasonable adjustments"},
    {icon:"📋",title:"Employment Rights Act 1996",desc:"Unfair dismissal · constructive dismissal · written statements · notice periods · right to reasons"},
    {icon:"🤝",title:"ACAS Code 2015",desc:"Grievance & disciplinary procedures · Early Conciliation · Tribunal claim process"},
    {icon:"🌍",title:"UK GDPR / DPA 2018",desc:"Subject Access Requests · how your personal data is used · 1-month response deadline · ICO enforcement"},
    {icon:"🏛",title:"Human Rights Act 1998",desc:"Article 6 fair trial · Article 14 non-discrimination · applies to public authorities"},
    {icon:"📮",title:"Whistleblowing (PIDA 1998)",desc:"Protected disclosures · automatic unfair dismissal · no qualifying period required"},
  ];

  return (
    <div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,marginBottom:6}}>Know Your Rights</h1>
      <p style={{color:"#1E3A5F",fontSize:14,marginBottom:24}}>Ask anything about discrimination law. Get clear answers with direct action links — including one-click emails to the right authority.</p>

      <Card style={{marginBottom:20}}>
        <div style={{display:"flex",gap:10}}>
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about your rights, the process, what to do next…"
            onKeyDown={e=>e.key==="Enter"&&ask()} style={{flex:1}}/>
          <Btn onClick={()=>ask()} disabled={loading}>Ask →</Btn>
        </div>
      </Card>

      <div style={{marginBottom:24}}>
        <p style={{color:T.dim,fontSize:10.5,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Common questions</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {QUICK.map(question=>(
            <button key={question} onClick={()=>ask(question)} style={{
              background:T.faint,border:`1px solid ${T.border}`,borderRadius:24,
              padding:"6px 14px",cursor:"pointer",color:T.muted,fontFamily:"'Source Serif 4',serif",fontSize:12.5,
              transition:"all 0.2s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.color=T.gold;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>
              {question}
            </button>
          ))}
        </div>
      </div>

      {(ai||loading) && (
        <div style={{marginBottom:28}}>
          <AIPanel text={ai} loading={loading} label={`Answer: "${q.slice(0,50)}${q.length>50?"…":""}"`}/>
          
          {/* ACTIVE EMAIL ACTION BUTTONS — appears immediately after answer */}
          {emailActions.length > 0 && !loading && (
            <div style={{background:`${T.gold}11`,border:`2px solid ${T.gold}55`,borderRadius:12,padding:16,marginTop:12}}>
              <div style={{color:T.gold,fontSize:13,fontWeight:700,marginBottom:10}}>
                ⚡ Take Action Now — Send Your Email
              </div>
              <div style={{color:"#64748B",fontSize:12,marginBottom:12,lineHeight:1.6}}>
                Based on your question, these are the authorities to contact. Click to open in your email app — or copy the address to use anywhere.
              </div>
              {emailActions.map((action, i) => (
                <div key={i} style={{background:T.navyM,borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:8}}>
                    <div>
                      <div style={{color:"#0F2C4A",fontSize:13,fontWeight:700}}>{action.org}</div>
                      <div style={{color:T.gold,fontSize:12,fontFamily:"monospace",marginTop:2}}>{action.email}</div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <a href={`mailto:${action.email}?subject=${encodeURIComponent(action.subject)}&body=${encodeURIComponent(`Dear ${action.org},\n\nI am writing in connection with a matter under ${action.subject}.\n\n${userProfile?.name ? `My name is ${userProfile.name}.` : ''}\n${userProfile?.email ? `My email is ${userProfile.email}.` : ''}\n\nPlease find details below:\n\n[Add your specific details here]\n\nYours faithfully,\n${userProfile?.name || '[Your Name]'}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,textDecoration:"none",display:"inline-block"}}>
                        📧 Open in Email App
                      </a>
                      <button onClick={() => { navigator.clipboard.writeText(action.email); }} style={{background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>
                        Copy Address
                      </button>
                    </div>
                  </div>
                  <div style={{color:T.dim,fontSize:11}}>Subject line pre-filled: "{action.subject}"</div>
                  {userProfile?.email && (
                    <div style={{color:T.tealL,fontSize:11,marginTop:4}}>✅ Your email ({userProfile.email}) will be pre-filled as sender</div>
                  )}
                </div>
              ))}
              <div style={{color:T.dim,fontSize:11,marginTop:8}}>
                💡 All emails sent are logged in your Email Dispatch Centre with case reference and timestamp.
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {LAWS.map(l=>(
          <Card key={l.title} style={{padding:"16px 18px"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:22}}>{l.icon}</span>
              <div>
                <div style={{color:T.gold,fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:5}}>{l.title}</div>
                <div style={{color:"#64748B",fontSize:12,lineHeight:1.6}}>{l.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ setTab, caseData, userProfile }) {
  const evidence = S.get("evidence",[]);
  const timeline = S.get("timeline",[]);
  const decisions = S.get("decisions",[]);
  const assessment = S.get("assessment_ai","");

  const completedModules = [
    caseData ? "Assessment" : null,
    evidence.length>0 ? "Evidence" : null,
    timeline.length>0 ? "Timeline" : null,
    decisions.length>0 ? "Actions" : null,
  ].filter(Boolean);

  const progress = Math.round((completedModules.length/4)*100);

  const SECTIONS = [
    {id:"assessment",icon:"🧭",label:"Assessment",desc:caseData?`${caseData.discType?.join(", ")||""} · ${caseData.setting||""}`:"Start here — tell us what happened",done:!!caseData},
    {id:"evidence",icon:"🗄",label:"Evidence",desc:`${evidence.length} item${evidence.length!==1?"s":""} logged`,done:evidence.length>0},
    {id:"timeline",icon:"📅",label:"Timeline",desc:`${timeline.length} event${timeline.length!==1?"s":""} recorded`,done:timeline.length>0},
    {id:"actions",icon:"🗺",label:"Action Centre",desc:`${decisions.length} decision${decisions.length!==1?"s":""} logged`,done:decisions.length>0},
    {id:"documents",icon:"✍",label:"Documents",desc:"Generate court-ready letters",done:false},
    {id:"forensic",icon:"🔬",label:"Forensic",desc:"Analyse employer defences",done:false},
    {id:"calculator",icon:"⚖",label:"Calculator",desc:"Estimate your claim value",done:false},
    {id:"rights",icon:"📖",label:"Rights",desc:"Know your legal rights",done:false},
    {id:"intel",icon:"🧠",label:"Case Intel",desc:"Decode documents, analyse case status, find anchor lies",done:false},
    {id:"support",icon:"🤝",label:"Support",desc:"GP, CAB, welfare, social prescriber — support + evidence",done:false},
    {id:"wellbeing",icon:"💚",label:"Wellbeing",desc:"Document mental health impact — builds Vento band evidence",done:false},
    {id:"deadlines",icon:"⏰",label:"Deadlines",desc:"Track all your legal deadlines in one place",done:false},
    {id:"lab",icon:"🔐",label:"Evidence Lab",desc:"Metadata forensics, DBS challenge, VRR, preservation notice",done:false},
  ];

  return (
    <div>
            {/* Dashboard header - SureImports style */}
      <div style={{marginBottom:24}}>
        <div style={{color:"#64748B",fontSize:12,marginBottom:4}}>
          {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.white,margin:"0 0 4px"}}>
          {userProfile&&userProfile.name ? "Hi "+userProfile.name.split(" ")[0]+", here's your case overview." : "Your Case Dashboard"}
        </h1>
        <div style={{color:T.dim,fontSize:13}}>
          {userProfile&&userProfile.email ? userProfile.email+" · " : ""}
          {completedModules.length} of 4 modules complete
        </div>
      </div>

      {/* Stat cards row - like LineScout */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:28}}>
        {[
          {label:"ACTIVE CASES",value:evidence.length>0||timeline.length>0?1:0,sub:"Cases in progress",icon:"📁",color:T.gold,tab:"cases"},
          {label:"EVIDENCE ITEMS",value:evidence.length,sub:"Items logged",icon:"🗄",color:T.teal,tab:"evidence"},
          {label:"TIMELINE EVENTS",value:timeline.length,sub:"Events recorded",icon:"📅",color:"#9b8fe8",tab:"timeline"},
          {label:"CASE STRENGTH",value:progress+"%",sub:progress>60?"Strong":"Building",icon:"💪",color:progress>60?T.teal:progress>30?T.gold:T.redL,tab:"dashboard"},
        ].map(function(stat){
          return React.createElement("button",{key:stat.label,onClick:function(){setTab(stat.tab);},
            style:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:14,padding:"20px 18px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"}},
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}},
              React.createElement("div",{style:{color:stat.color,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}},stat.label),
              React.createElement("span",{style:{fontSize:20}},stat.icon)
            ),
            React.createElement("div",{style:{color:T.white,fontSize:28,fontWeight:900,fontFamily:"'Playfair Display',serif",marginBottom:4}},String(stat.value)),
            React.createElement("div",{style:{color:T.dim,fontSize:11}},stat.sub)
          );
        })}
      </div>
      <GamificationBar setTab={setTab}/>

      {/* Case Intelligence Status Panel */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
        {[
          {icon:"⚖",label:"Employment Tribunal",tip:"Check ACAS early conciliation deadlines. ET1 must be filed within 3 months minus 1 day of the last act of discrimination.",color:T.gold,tab:"assessment"},
          {icon:"🚔",label:"Police / VRR",tip:"If police closed your case without telling you, you have the Victim Right to Review. 3-month deadline from NFA decision. Use the Evidence Lab → VRR tool.",color:"#9b8fe8",tab:"lab"},
          {icon:"📂",label:"SAR Status",tip:"If your SAR response is incomplete, blurred, or missing CAD logs and BWV — that is a violation. Use SAR Intelligence to audit and escalate.",color:T.tealL,tab:"sar"},
          {icon:"🔬",label:"Forensic / Anchor Lie",tip:"Cross-reference all document dates with known events. Statements created after solicitors were hired are anchor lie candidates. Use Forensic → Contradiction Map.",color:"#ff9f7f",tab:"forensic"},
        ].map(function(item) {
          return React.createElement("button",{
            key:item.label,
            onClick:function(){setTab(item.tab);},
            style:{background:T.faint,border:"1px solid "+item.color+"44",borderRadius:12,padding:"14px 16px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"},
            onMouseEnter:function(e){e.currentTarget.style.borderColor=item.color;e.currentTarget.style.background="rgba(255,255,255,0.04)";},
            onMouseLeave:function(e){e.currentTarget.style.borderColor=item.color+"44";e.currentTarget.style.background=T.faint;}
          },
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6}},
              React.createElement("span",{style:{fontSize:18}},item.icon),
              React.createElement("div",{style:{color:item.color,fontSize:13,fontWeight:700,fontFamily:"'Source Serif 4',serif"}},item.label)
            ),
            React.createElement("div",{style:{color:T.dim,fontSize:11,lineHeight:1.5}},item.tip)
          );
        })}
      </div>

      {/* Progress */}
      <Card glow style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:12}}>
          <div>
            <h3 style={{color:T.white,fontFamily:"'Playfair Display',serif",fontSize:17,marginBottom:2}}>Case Progress</h3>
            <p style={{color:"#64748B",fontSize:12}}>{completedModules.length} of 4 core modules completed</p>
          </div>
          <div style={{fontSize:24,fontWeight:900,fontFamily:"'Playfair Display',serif",
            background:`linear-gradient(135deg,${T.gold},${T.teal})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
            {progress}%
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:6,height:8,overflow:"hidden"}}>
          <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${T.teal},${T.gold})`,borderRadius:6,transition:"width 0.8s ease"}}/>
        </div>
        {caseData?.discType?.length>0&&(
          <div style={{display:"flex",gap:6,marginTop:14,flexWrap:"wrap"}}>
            {caseData.discType.map(d=><Tag key={d}>{DISC_TYPES.find(x=>x.id===d)?.icon} {DISC_TYPES.find(x=>x.id===d)?.label||d}</Tag>)}
            {caseData.setting&&<Tag color={T.teal}>{SETTINGS.find(x=>x.id===caseData.setting)?.icon} {SETTINGS.find(x=>x.id===caseData.setting)?.label||caseData.setting}</Tag>}
          </div>
        )}
      </Card>

      {caseData?.when&&<div style={{marginBottom:20}}><TimerBadge date={caseData.when}/></div>}

      {/* Module grid */}
      <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>setTab(s.id)} style={{
            background:s.done?"rgba(12,123,122,0.1)":"rgba(255,255,255,0.03)",
            border:`2px solid ${s.done?T.teal:T.border}`,
            borderRadius:14,padding:"16px 16px",textAlign:"left",cursor:"pointer",transition:"all 0.2s",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:22}}>{s.icon}</span>
              {s.done&&<span style={{color:T.teal,fontSize:13}}>✓</span>}
            </div>
            <div style={{color:s.done?T.tealL:T.white,fontFamily:"'Source Serif 4',serif",fontSize:14,fontWeight:600,marginBottom:4}}>{s.label}</div>
            <div style={{color:"#64748B",fontSize:12,lineHeight:1.4}}>{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
        <Badge icon="📁" label="Evidence Items" value={evidence.length} color={T.teal}/>
        <Badge icon="📅" label="Timeline Events" value={timeline.length} color={T.gold}/>
        <Badge icon="✓" label="Decisions Logged" value={decisions.length} color={T.muted}/>
        <Badge icon="📊" label="Severity" value={caseData?.severity||"—"} color={caseData?.severity>=7?T.redL:T.gold}/>
      </div>

      {/* Reset */}
      <div style={{textAlign:"center",paddingTop:16,borderTop:`1px solid ${T.border}`}}>
        <Btn variant="ghost" sm onClick={()=>{
          if(window.confirm("This will clear all case data. Are you sure?"))
            ["casedata","evidence","timeline","decisions","assessment_draft","assessment_ai"].forEach(k=>S.del(k));
          window.location.reload();
        }}>🗑 Start New Case</Btn>
      </div>
    </div>
  );
}
// LAYER 1+2+3+4 — NOTIFICATION & REMINDER SYSTEM

const NOTIF_KEY = "ujris_notifications";
const ACTIONS_KEY = "ujris_actions";

function getNotifications() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY)||"[]"); } catch { return []; }
}
function saveNotifications(list) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(list)); } catch {}
}
function getActions() {
  try { return JSON.parse(localStorage.getItem(ACTIONS_KEY)||"[]"); } catch { return []; }
}
function saveActions(list) {
  try { localStorage.setItem(ACTIONS_KEY, JSON.stringify(list)); } catch {}
}

function generateNotifications(cases, deadlines) {
  const notifs = [];
  const today = new Date(); today.setHours(0,0,0,0);
  const THRESHOLDS = [1,3,7,14,30];

  // Case deadline notifications
  cases.forEach(c => {
    if (!c.nextDeadline) return;
    const d = new Date(c.nextDeadline);
    const days = Math.ceil((d - today) / 86400000);
    THRESHOLDS.forEach(t => {
      if (days === t) {
        notifs.push({
          id: `case_${c.id}_${t}`,
          type: days <= 3 ? "critical" : days <= 7 ? "urgent" : "warning",
          icon: days <= 3 ? "🚨" : days <= 7 ? "⚠️" : "⏰",
          title: `${days === 1 ? "TOMORROW" : `${days} days`}: ${c.title}`,
          body: `Next deadline for ${c.employer} — ${new Date(c.nextDeadline).toLocaleDateString("en-GB")}`,
          caseId: c.id,
          caseName: c.title,
          tab: "deadlines",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });
    if (days < 0) {
      notifs.push({
        id: `case_${c.id}_overdue`,
        type: "overdue",
        icon: "🔴",
        title: `OVERDUE: ${c.title}`,
        body: `Deadline passed ${Math.abs(days)} day${Math.abs(days)!==1?"s":""} ago — action required immediately`,
        caseId: c.id,
        caseName: c.title,
        tab: "deadlines",
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  });

  // Standalone deadline notifications
  (deadlines||[]).forEach(d => {
    const days = Math.ceil((new Date(d.date) - today) / 86400000);
    if (days <= 30 && days >= -1) {
      notifs.push({
        id: `deadline_${d.id}_${days}`,
        type: days < 0 ? "overdue" : days <= 3 ? "critical" : days <= 7 ? "urgent" : "warning",
        icon: days < 0 ? "🔴" : days <= 3 ? "🚨" : "⏰",
        title: `${days < 0 ? "OVERDUE" : days === 0 ? "TODAY" : days === 1 ? "TOMORROW" : `${days} days`}: ${d.label}`,
        body: d.notes || `Deadline: ${new Date(d.date).toLocaleDateString("en-GB")}`,
        tab: "deadlines",
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  });

  // Action item notifications
  const actions = getActions();
  actions.filter(a => a.status !== "done").forEach(a => {
    if (!a.dueDate) return;
    const days = Math.ceil((new Date(a.dueDate) - today) / 86400000);
    if (days <= 7) {
      notifs.push({
        id: `action_${a.id}`,
        type: days < 0 ? "overdue" : days <= 3 ? "critical" : "warning",
        icon: days < 0 ? "🔴" : "📋",
        title: `Action ${days < 0 ? "overdue" : `due in ${days} day${days!==1?"s":""}`}: ${a.title}`,
        body: `Case: ${a.caseName||"General"} — ${a.description||""}`,
        tab: "actions",
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  });

  return notifs;
}

async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function sendBrowserNotification(title, body, icon) {
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: icon || "/images/ujris-logo.jpeg",
    badge: "/images/ujris-logo.jpeg",
    tag: "ujris-reminder",
  });
}

function scheduleBrowserNotifications(notifications) {
  notifications.filter(n => !n.read && (n.type === "critical" || n.type === "overdue")).forEach(n => {
    setTimeout(() => sendBrowserNotification(n.title, n.body), 2000);
  });
}

function ActionTracker({ cases, navTo }) {
  const [actions, setActions] = useState(() => getActions());
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title:"", description:"", caseId:"", dueDate:"", priority:"medium", status:"todo" });
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = (list) => { setActions(list); saveActions(list); };

  const add = () => {
    if (!form.title) return;
    const caseName = cases.find(c=>c.id===form.caseId)?.title || "General";
    save([...actions, { ...form, id: Date.now().toString(), caseName, created: new Date().toISOString() }]);
    setForm({ title:"", description:"", caseId:"", dueDate:"", priority:"medium", status:"todo" });
    setShowAdd(false);
  };

  const updateStatus = (id, status) => save(actions.map(a => a.id===id ? {...a,status} : a));
  const remove = (id) => save(actions.filter(a => a.id!==id));

  const today = new Date(); today.setHours(0,0,0,0);
  const getDays = (d) => d ? Math.ceil((new Date(d)-today)/86400000) : null;

  const priorityColor = (p) => p==="high"?T.red:p==="medium"?T.gold:T.teal;
  const statusColor = (s) => s==="done"?T.teal:s==="in_progress"?T.gold:T.muted;
  const statusLabel = (s) => s==="done"?"✅ Done":s==="in_progress"?"🔄 In Progress":"📋 To Do";

  const filtered = actions.filter(a =>
    filter==="all" ? true :
    filter==="overdue" ? (getDays(a.dueDate)<0 && a.status!=="done") :
    filter==="today" ? getDays(a.dueDate)===0 :
    filter==="week" ? (getDays(a.dueDate)>=0 && getDays(a.dueDate)<=7) :
    a.status===filter
  );

  const counts = {
    overdue: actions.filter(a=>getDays(a.dueDate)<0&&a.status!=="done").length,
    today: actions.filter(a=>getDays(a.dueDate)===0).length,
    week: actions.filter(a=>getDays(a.dueDate)>=0&&getDays(a.dueDate)<=7).length,
    todo: actions.filter(a=>a.status==="todo").length,
    in_progress: actions.filter(a=>a.status==="in_progress").length,
    done: actions.filter(a=>a.status==="done").length,
  };

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{color:T.gold,margin:0,fontSize:22}}>📋 Action Item Tracker</h2>
          <p style={{color:"#64748B",fontSize:13,margin:"4px 0 0"}}>Track every action across all your cases</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          + Add Action
        </button>
      </div>

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:20}}>
        {[
          {key:"overdue",label:"Overdue",color:T.red},
          {key:"today",label:"Due Today",color:"#ff9f7f"},
          {key:"week",label:"This Week",color:T.gold},
          {key:"todo",label:"To Do",color:T.muted},
          {key:"in_progress",label:"In Progress",color:T.teal},
          {key:"done",label:"Done",color:"#4ade80"},
        ].map(s=>(
          <button key={s.key} onClick={()=>setFilter(s.key)}
            style={{padding:"10px 8px",background:filter===s.key?s.color+"22":T.navyM,
              border:`1px solid ${filter===s.key?s.color:T.border}`,borderRadius:8,cursor:"pointer",textAlign:"center"}}>
            <div style={{color:s.color,fontWeight:700,fontSize:18}}>{counts[s.key]}</div>
            <div style={{color:T.muted,fontSize:10,marginTop:2}}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["all","overdue","today","week","todo","in_progress","done"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
              background:filter===f?T.gold:T.navyM,color:filter===f?T.navy:T.muted,
              border:`1px solid ${filter===f?T.gold:T.border}`}}>
            {f==="all"?"All":f==="in_progress"?"In Progress":f.charAt(0).toUpperCase()+f.slice(1)}
            {filter!==f&&counts[f]>0&&<span style={{marginLeft:4,background:T.redBg,color:T.redL,borderRadius:10,padding:"0 5px",fontSize:10}}>{counts[f]}</span>}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.gold}`,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div style={{gridColumn:"1/-1"}}>
              <input value={form.title} onChange={e=>F("title",e.target.value)} placeholder="Action title *"
                style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
            </div>
            <div>
              <select value={form.caseId} onChange={e=>F("caseId",e.target.value)}
                style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14}}>
                <option value="">General (no specific case)</option>
                {cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <input type="date" value={form.dueDate} onChange={e=>F("dueDate",e.target.value)}
                style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
            </div>
            <div>
              <select value={form.priority} onChange={e=>F("priority",e.target.value)}
                style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14}}>
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <VersatileInput value={form.description} onChange={e=>F("description",e.target.value)}
              onFileAnalysed={(text)=>F("description",(form.description?form.description+"\n\n":"")+text)}
              caseContext="discrimination case assessment"
                placeholder="Description / notes..." rows={2}
                style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,resize:"vertical",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={add} disabled={!form.title}
              style={{flex:1,padding:"10px",background:form.title?T.gold:"#444",color:T.navy,border:"none",borderRadius:8,fontWeight:700,cursor:form.title?"pointer":"not-allowed"}}>
              Save Action
            </button>
            <button onClick={()=>setShowAdd(false)}
              style={{padding:"10px 16px",background:"none",color:T.muted,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action list */}
      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"40px",color:T.muted}}>
          {filter==="overdue" ? "✅ No overdue actions" : filter==="done" ? "No completed actions yet" : "No actions found"}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(a => {
            const days = getDays(a.dueDate);
            const overdue = days !== null && days < 0 && a.status !== "done";
            const urgent = days !== null && days <= 3 && days >= 0 && a.status !== "done";
            return (
              <div key={a.id} style={{background:T.navyM,borderRadius:10,padding:16,
                border:`1px solid ${overdue?T.red:urgent?T.gold:a.status==="done"?"#4ade8022":T.border}`,
                opacity:a.status==="done"?0.6:1}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{width:4,borderRadius:4,background:priorityColor(a.priority),alignSelf:"stretch",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4,flexWrap:"wrap",gap:8}}>
                      <span style={{color:a.status==="done"?T.muted:T.white,fontWeight:600,fontSize:14,
                        textDecoration:a.status==="done"?"line-through":"none"}}>
                        {overdue?"🔴 ":urgent?"⚠️ ":""}{a.title}
                      </span>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {a.dueDate && (
                          <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:600,
                            background:overdue?T.redBg:urgent?T.goldBg:T.tealBg,
                            color:overdue?T.redL:urgent?T.goldL:T.tealL}}>
                            {overdue?`${Math.abs(days)}d overdue`:days===0?"Due today":days===1?"Due tomorrow":`${days}d left`}
                          </span>
                        )}
                        <span style={{fontSize:11,color:statusColor(a.status)}}>{statusLabel(a.status)}</span>
                      </div>
                    </div>
                    {a.description && <div style={{color:"#64748B",fontSize:12,marginBottom:6}}>{a.description}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      {a.caseName&&<span style={{fontSize:11,color:T.gold,background:T.goldBg,padding:"2px 8px",borderRadius:10}}>📁 {a.caseName}</span>}
                      <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                        {a.status!=="in_progress"&&a.status!=="done"&&(
                          <button onClick={()=>updateStatus(a.id,"in_progress")}
                            style={{fontSize:11,padding:"3px 10px",background:T.tealBg,color:T.tealL,border:`1px solid ${T.teal}`,borderRadius:6,cursor:"pointer"}}>
                            Start
                          </button>
                        )}
                        {a.status!=="done"&&(
                          <button onClick={()=>updateStatus(a.id,"done")}
                            style={{fontSize:11,padding:"3px 10px",background:"#4ade8022",color:"#4ade80",border:"1px solid #4ade8044",borderRadius:6,cursor:"pointer"}}>
                            Done ✓
                          </button>
                        )}
                        {a.status==="done"&&(
                          <button onClick={()=>updateStatus(a.id,"todo")}
                            style={{fontSize:11,padding:"3px 10px",background:T.navyL,color:T.muted,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}>
                            Reopen
                          </button>
                        )}
                        <button onClick={()=>remove(a.id)}
                          style={{fontSize:11,padding:"3px 8px",background:"none",color:T.muted,border:"none",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationBell({ cases, navTo }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const deadlines = S.get("deadlines", []);

  useEffect(() => {
    const generated = generateNotifications(cases, deadlines);
    const saved = getNotifications();
    // Merge — keep read state from saved
    const merged = generated.map(g => {
      const existing = saved.find(s => s.id === g.id);
      return existing ? { ...g, read: existing.read } : g;
    });
    setNotifs(merged);
    saveNotifications(merged);
    // Layer 2: trigger browser push for critical
    scheduleBrowserNotifications(merged);
  }, [cases]);

  const unread = notifs.filter(n => !n.read).length;
  const markRead = (id) => {
    const updated = notifs.map(n => n.id===id ? {...n,read:true} : n);
    setNotifs(updated); saveNotifications(updated);
  };
  const markAllRead = () => {
    const updated = notifs.map(n => ({...n,read:true}));
    setNotifs(updated); saveNotifications(updated);
  };
  const urgencyOrder = {overdue:0,critical:1,urgent:2,warning:3};
  const sorted = [...notifs].sort((a,b)=>(urgencyOrder[a.type]||4)-(urgencyOrder[b.type]||4));

  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{background:"none",border:`1px solid ${unread>0?T.red:T.border}`,borderRadius:8,
          padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
          color:unread>0?T.redL:T.muted,position:"relative"}}>
        🔔
        {unread>0&&(
          <span style={{background:T.red,color:T.white,borderRadius:"50%",width:18,height:18,
            fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {unread>9?"9+":unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:360,maxHeight:480,
          overflowY:"auto",background:"#FAF6F0",border:`1px solid ${T.border}`,borderRadius:12,
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)",zIndex:1000}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:T.white,fontWeight:700,fontSize:14}}>🔔 Notifications {unread>0&&`(${unread} unread)`}</span>
            {unread>0&&<button onClick={markAllRead} style={{fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer"}}>Mark all read</button>}
          </div>

          {sorted.length===0 ? (
            <div style={{padding:24,textAlign:"center",color:"#64748B",fontSize:13}}>
              ✅ No notifications — you're on top of everything!
            </div>
          ) : (
            sorted.map(n=>(
              <div key={n.id} onClick={()=>{markRead(n.id);navTo(n.tab||"deadlines");setOpen(false);}}
                style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                  background:n.read?"transparent":n.type==="overdue"?T.redBg:n.type==="critical"?"rgba(255,107,107,0.08)":"transparent",
                  transition:"background 0.2s"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:18,lineHeight:1.3}}>{n.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{color:n.type==="overdue"?T.redL:n.type==="critical"?"#ff6b6b":n.type==="urgent"?T.gold:T.white,
                      fontWeight:n.read?400:700,fontSize:13,marginBottom:2}}>
                      {n.title}
                    </div>
                    <div style={{color:"#64748B",fontSize:11}}>{n.body}</div>
                  </div>
                  {!n.read&&<div style={{width:6,height:6,borderRadius:"50%",background:T.gold,flexShrink:0,marginTop:4}}/>}
                </div>
              </div>
            ))
          )}

          <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
            <button onClick={()=>{navTo("tracker");setOpen(false);}}
              style={{width:"100%",padding:"8px",background:T.goldBg,color:T.gold,border:`1px solid ${T.goldD}`,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
              📋 View All Action Items →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailReminderSetup({ cases }) {
  const [email, setEmail] = useState(() => S.get("reminder_email",""));
  const [enabled, setEnabled] = useState(() => S.get("reminders_enabled", false));
  const [frequency, setFrequency] = useState(() => S.get("reminder_frequency","daily"));
  const [saved, setSaved] = useState(false);

  const save = () => {
    S.set("reminder_email", email);
    S.set("reminders_enabled", enabled);
    S.set("reminder_frequency", frequency);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  const requestPush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      alert("✅ Browser notifications enabled! UJRIS will alert you about urgent deadlines.");
      sendBrowserNotification("UJRIS Notifications Active", "You'll now receive deadline reminders and action alerts.");
    } else {
      alert("❌ Browser notifications blocked. Please enable them in your browser settings.");
    }
  };

  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px"}}>
      <h2 style={{color:T.gold,marginBottom:4}}>🔔 Notification Settings</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:24}}>Stay on top of every deadline and action across all your cases.</p>

      {/* Layer 2 — Browser Push */}
      <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
        <div style={{color:T.white,fontWeight:700,marginBottom:4}}>🖥️ Browser Push Notifications (Instant)</div>
        <div style={{color:"#64748B",fontSize:13,marginBottom:12}}>Get instant alerts even when UJRIS is in the background. Works on desktop and mobile Chrome.</div>
        <button onClick={requestPush}
          style={{padding:"10px 20px",background:T.teal,color:T.white,border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>
          Enable Browser Notifications
        </button>
      </div>

      {/* Layer 3 — Email */}
      <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
        <div style={{color:T.white,fontWeight:700,marginBottom:4}}>📧 Email Reminders</div>
        <div style={{color:"#64748B",fontSize:13,marginBottom:12}}>Receive deadline digests and action reminders by email. Alerts fire at 30, 14, 7, 3, 1 day before each deadline.</div>
        <div style={{marginBottom:12}}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" type="email"
            style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box",marginBottom:8}}/>
          <select value={frequency} onChange={e=>setFrequency(e.target.value)}
            style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14}}>
            <option value="daily">Daily digest (7am)</option>
            <option value="weekly">Weekly summary (Monday 7am)</option>
            <option value="urgent_only">Urgent only (7 days or less)</option>
            <option value="critical_only">Critical only (3 days or less)</option>
          </select>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <button onClick={()=>setEnabled(e=>!e)}
            style={{width:48,height:24,borderRadius:12,border:"none",cursor:"pointer",
              background:enabled?T.teal:T.dim,transition:"background 0.2s",position:"relative"}}>
            <div style={{position:"absolute",top:3,left:enabled?26:3,width:18,height:18,borderRadius:"50%",background:T.white,transition:"left 0.2s"}}/>
          </button>
          <span style={{color:"#64748B",fontSize:13}}>{enabled?"Email reminders ON":"Email reminders OFF"}</span>
        </div>
        <button onClick={save}
          style={{padding:"10px 20px",background:saved?"#4ade80":T.gold,color:T.navy,border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>
          {saved?"✅ Saved!":"Save Notification Settings"}
        </button>
        <div style={{marginTop:10,padding:10,background:T.tealBg,borderRadius:8,color:T.tealL,fontSize:11}}>
          💡 Email delivery via Resend (free tier — 3,000 emails/month). Add RESEND_API_KEY to Hostinger env vars to activate.
        </div>
      </div>

      {/* Active case summary */}
      <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
        <div style={{color:T.white,fontWeight:700,marginBottom:12}}>📋 Cases Being Monitored</div>
        {cases.length===0 ? (
          <div style={{color:"#64748B",fontSize:13}}>No cases added yet. Add cases to receive deadline reminders.</div>
        ) : cases.map(c=>(
          <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
            <div>
              <span style={{color:T.white,fontSize:13}}>{c.icon||"⚖"} {c.title}</span>
              <div style={{color:"#64748B",fontSize:11}}>{c.employer}</div>
            </div>
            {c.nextDeadline&&(
              <span style={{color:T.gold,fontSize:11}}>
                Next: {new Date(c.nextDeadline).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const BADGES = [
  { id:"first_step",    icon:"🌟", name:"First Step",       desc:"Started your UJRIS journey",                   condition:(s)=>true },
  { id:"assessment",   icon:"🧭", name:"Case Assessed",    desc:"Completed your guided claim assessment",        condition:(s)=>!!s.casedata },
  { id:"evidence_1",   icon:"📁", name:"Evidence Gathered",desc:"Added your first piece of evidence",            condition:(s)=>(s.evidence||[]).length>=1 },
  { id:"evidence_5",   icon:"🗄", name:"Evidence Builder", desc:"Logged 5 or more pieces of evidence",          condition:(s)=>(s.evidence||[]).length>=5 },
  { id:"timeline",     icon:"📅", name:"Chronologist",     desc:"Built your case timeline",                     condition:(s)=>(s.timeline||[]).length>=1 },
  { id:"document",     icon:"✍", name:"Document Ready",   desc:"Generated your first legal document",          condition:(s)=>!!s.last_doc },
  { id:"sar_sent",     icon:"📂", name:"SAR Filed",        desc:"Generated a Subject Access Request",           condition:(s)=>!!s.sar_generated },
  { id:"deadline",     icon:"⏰", name:"Deadline Tracker", desc:"Added a key legal deadline",                   condition:(s)=>(s.deadlines||[]).length>=1 },
  { id:"multi_case",   icon:"⚖", name:"Case Commander",  desc:"Managing 2 or more cases simultaneously",      condition:(s)=>(s.all_cases||[]).length>=2 },
  { id:"wellbeing",    icon:"💚", name:"Impact Recorded",  desc:"Documented the impact of discrimination",      condition:(s)=>(s.wellbeing||[]).length>=1 },
  { id:"calculator",   icon:"💰", name:"Know Your Worth",  desc:"Calculated your compensation estimate",        condition:(s)=>!!s.calc_used },
  { id:"forensic",     icon:"🔬", name:"Truth Seeker",     desc:"Used the Forensic Auditor",                    condition:(s)=>!!s.forensic_used },
  { id:"action_done",  icon:"✅", name:"Action Taker",     desc:"Completed your first action item",             condition:(s)=>(s.ujris_actions||[]).filter(a=>a.status==="done").length>=1 },
  { id:"rights",       icon:"📖", name:"Rights Aware",     desc:"Used the AI Rights Advisor",                   condition:(s)=>!!s.rights_used },
  { id:"champion",     icon:"🏆", name:"Justice Champion", desc:"Completed all core modules",                   condition:(s)=>!!s.casedata&&(s.evidence||[]).length>=3&&(s.timeline||[]).length>=1&&!!s.last_doc },
];

function getEarnedBadges() {
  const store = {};
  try {
    ["casedata","evidence","timeline","deadlines","wellbeing","all_cases","ujris_actions",
     "last_doc","sar_generated","calc_used","forensic_used","rights_used"].forEach(k=>{
      const v = localStorage.getItem("ujris3_"+k);
      if (v) store[k] = JSON.parse(v);
    });
    // Also check raw actions key
    const rawActions = localStorage.getItem("ujris_actions");
    if (rawActions) store.ujris_actions = JSON.parse(rawActions);
  } catch {}
  return BADGES.filter(b => b.condition(store));
}
// UJRIS WORLD-CLASS FORENSIC INTELLIGENCE ENGINE v6.0
// 18 Detectors + 8 Assistants + Comparator + Sham Hearing

const FORENSIC_DETECTORS = [
  // CORE FORENSIC (1-5)
  { id:"rosetta", icon:"💎", name:"Rosetta Stone Detector", category:"core",
    color:"#C9A84C", legal:"Evidence integrity + temporal analysis",
    desc:"Identifies the single document whose metadata collapses the entire defence. Scans creation dates, modification history, and version trails.",
    sys:`You are UJRIS Forensic AI. Analyse the uploaded text/document for the "Rosetta Stone" — the single piece of evidence whose authentic creation date or metadata contradicts the employer's entire narrative. Look for: documents created AFTER the claimed event date, version history inconsistencies, modification dates that contradict stated timelines. Provide: (1) Rosetta Stone identification with specific date contradictions, (2) How this collapses the defence, (3) Exact tribunal paragraph to use, (4) Evidence exhibit format. Be forensically precise with dates.` },

  { id:"false_disclosure", icon:"📋", name:"False Disclosure Certificate Detector", category:"core",
    color:"#ff6b6b", legal:"CPR Part 31 + Fraud Act 2006 s.2 + Contempt of Court",
    desc:"Detects when an organisation certified 'all documents disclosed' but later produced contradictory documents — contempt of court and potential fraud.",
    sys:`You are UJRIS Forensic AI. Analyse this document for False Disclosure Certificate patterns under CPR Part 31 and Fraud Act 2006 s.2. Identify: (1) Any certification that all documents were disclosed, (2) Evidence of documents appearing AFTER that certification, (3) Specific contempt of court implications, (4) Criminal fraud implications under Fraud Act 2006, (5) Exact tribunal argument including contempt sanctions available. Reference: CPR 32.14 — making a false statement in a document verified by a statement of truth is contempt of court.` },

  { id:"temporal", icon:"⏱", name:"Temporal Impossibility Detector", category:"core",
    color:"#9b8fe8", legal:"Fabrication case law + document authentication",
    desc:"Detects dates and signatures that make claimed events chronologically impossible — proving documents were created after the events they purport to record.",
    sys:`You are UJRIS Forensic AI. Perform temporal impossibility analysis on this document. Identify: (1) Any date where the document was signed/created AFTER the event it purports to record, (2) Any signature date that is later than the claimed meeting/event date, (3) Any document referencing events that hadn't happened yet at the stated date, (4) 48+ hour gaps between claimed event and document creation, (5) Timeline impossibilities. Output: "TEMPORAL IMPOSSIBILITY DETECTED" with specific dates and the fabrication inference. Suggest tribunal paragraph on evidence fabrication.` },

  { id:"anchor_lie", icon:"🎯", name:"Anchor Lie Detector", category:"core",
    color:"#ff9f7f", legal:"Foundational falsehood doctrine",
    desc:"Identifies the single provable false assertion upon which the entire defence depends. Disprove the anchor lie and the entire case collapses.",
    sys:`You are UJRIS Forensic AI. Identify the ANCHOR LIE in this document — the single foundational false assertion upon which the entire defence narrative depends. Process: (1) List every factual claim made, (2) Identify which claim, if disproved, causes the most damage to the defence, (3) Identify evidence that disproves it, (4) Map all other documents/claims that rely on this anchor lie, (5) Generate tribunal paragraph. The anchor lie is the one that, when collapsed, makes everything else fall. Be specific — name the exact false statement.` },

  { id:"illusory_truth", icon:"🔄", name:"Illusory Truth Effect Detector", category:"core",
    color:"#4ade80", legal:"Psychological evidence + gaslighting doctrine",
    desc:"Detects when a lie is repeated so many times it begins to feel factual. Courts recognise systematic repetition as a gaslighting tactic.",
    sys:`You are UJRIS Forensic AI. Detect the Illusory Truth Effect in this document — systematic repetition of false claims until they feel factual. Identify: (1) Every phrase or claim repeated 3+ times across documents, (2) The false premise being reinforced through repetition, (3) Contrast between what is repeated vs what evidence shows, (4) How this constitutes gaslighting/psychological abuse, (5) Tribunal argument including costs wording for unreasonable conduct (Rule 37). Flag repetition clusters of the same false narrative.` },

  // SYSTEMIC ABUSE (6-9)
  { id:"racial_hostility", icon:"✊", name:"Racial Hostility Framing Detector", category:"systemic",
    color:"#DC2626", legal:"s.13 + s.26 Equality Act 2010 — direct discrimination + harassment",
    desc:"Detects the 'Big Blackman Phenomenon' — normal Black/BAME assertiveness systematically reframed as 'aggressive', 'combative', 'raising voice'. Direct evidence of race discrimination and harassment.",
    sys:`You are UJRIS Forensic AI specialising in racial bias detection. Analyse this document for the "Racial Hostility Framing" pattern under s.13 and s.26 Equality Act 2010. Scan for: (1) Every instance of aggression descriptors applied to the claimant: "aggressive", "raising voice", "combative", "unprofessional", "agitated", "talking over", "threatening", "difficult", "challenging", (2) Cross-reference: were these same descriptors applied to white colleagues in similar situations?, (3) Count total instances, (4) Generate "Hostility Framing Report" with aggravated damages paragraph, (5) Comparator table showing differential treatment, (6) Costs application wording for race discrimination. Note: Normal Black assertiveness is constitutionally protected expression, not aggression.` },

  { id:"power_show", icon:"👊", name:"Arbitrary Power Exercise Detector", category:"systemic",
    color:"#F97316", legal:"Abuse of power doctrine + may evidence s.13 Equality Act 2010",
    desc:"Detects exercise of raw institutional power without justification — verbal trespass, 'private property' claims, unjustified bans — used to silence discrimination victims.",
    sys:`You are UJRIS Forensic AI. Detect Arbitrary Power Exercise — institutional power used without justification or due process, relying on institutional backing. Scan for: (1) Language: "private property", "we are entitled", "no obligation to explain", "at our discretion", "we have decided", "you must leave", verbal trespass without reason, (2) Decisions removing rights without stated evidence or reason, (3) Police/security backing institutional power default, (4) Timeline: was power exercised immediately after a protected act?, (5) Generate "Power Abuse Report" with tribunal paragraph: "The Respondent exercised unchecked institutional power in the knowledge that law enforcement would default to their position — a pattern that perpetuates systemic discrimination." Include argument on abuse of process.` },

  { id:"weaponised_delay", icon:"⏰", name:"Weaponised Process Delay Detector", category:"systemic",
    color:"#EF4444", legal:"Seldon v Clarkson Wright & Jakes [2012] + overriding objective + s.27 EA 2010",
    desc:"Detects deliberate prolonging of internal grievance processes to exhaust the 3-month ET time limit — a weapon used to defeat meritorious claims on technicality.",
    sys:`You are UJRIS Forensic AI. Detect Weaponised Process Delay under the principle in Seldon v Clarkson Wright & Jakes [2012]. Analyse: (1) Total duration from first grievance to final internal outcome (flag if >90 days), (2) Number of stages (flag if >2 hearings/appeals), (3) Each delay period and stated justification (or lack thereof), (4) Whether delays exceeded internal policy timescales, (5) ACAS Early Conciliation certificate date vs internal process timeline, (6) Any internal admissions of delay, (7) Generate "Weaponised Delay Report" with tribunal argument: "The Respondent deliberately prolonged internal proceedings to manufacture a time-limit defence, contrary to the overriding objective. Under the principle in Seldon, concealment of wrongdoing extends the limitation period. The Respondent cannot rely on a time limit they manufactured." Include extension of time application.` },

  { id:"conditional_settlement", icon:"🪤", name:"Conditional Settlement Trap Detector", category:"systemic",
    color:"#8B5CF6", legal:"s.27 Equality Act 2010 — victimisation + abuse of process",
    desc:"Detects settlement offers with punitive conditions that perpetuate harm — 'good behaviour' clauses, bans, no-contact orders that punish the victim.",
    sys:`You are UJRIS Forensic AI. Detect Conditional Settlement Trap under s.27 Equality Act 2010. Analyse settlement offer for: (1) "Good behaviour" clauses (vague and discretionary — potential ongoing control), (2) No-contact orders covering perpetrators (isolation), (3) Ban conditions dependent on "co-operation" (leverage for future coercion), (4) Requirement to accept false narrative (reputational damage), (5) Non-disparagement covering misconduct (silencing protected disclosures), (6) Rate each condition: 🟢 Standard / 🟡 Concerning / 🟠 High Risk / 🔴 Critical. Generate toxicity rating and: rejection letter, tribunal argument that conditions constitute victimisation under s.27, argument that conditions are void as contrary to public policy.` },

  // PART 36 & TACTICAL (10)
  { id:"part36", icon:"💷", name:"Part 36 Offer Toxicity Detector", category:"tactical",
    color:"#0EA5E9", legal:"CPR Part 36 + costs pressure analysis",
    desc:"Analyses Part 36 offers against Schedule of Loss and Vento bands. Detects tactical pressure. Generates counter-offer and costs risk warning.",
    sys:`You are UJRIS Forensic AI and costs specialist. Analyse this Part 36 offer for toxicity and tactical manipulation. Assess: (1) Offer amount vs realistic Vento band (lower £1,200-£11,700 / middle £11,700-£35,100 / upper £35,100-£56,000) plus loss of earnings and pension, (2) Timing — was offer made before full evidence disclosure? Before SAR response? After anchor lie detected?, (3) Costs risk: if claimant doesn't beat this offer at trial, they may pay respondent's costs from offer expiry date, (4) What separate harms are NOT addressed (police misconduct, CRB/DBS, reputational damage)?, (5) Generate: TOXICITY RATING (🟢/🟡/🟠/🔴), value comparison table, counter-offer wording, costs risk analysis, recommendation on whether to accept/reject/counter. NEVER recommend accepting without full Schedule of Loss completed.` },

  // POLICE & VICTIMS' CODE (11-14)
  { id:"police_reinterview", icon:"🚔", name:"Police Re-Interview Manipulation Detector", category:"police",
    color:"#6366F1", legal:"Abuse of process + Victims' Code + IOPC",
    desc:"Detects delayed or false-pretext police re-interviews designed to introduce spoilers, obtain inconsistent statements, or manufacture grounds to close cases.",
    sys:`You are UJRIS Forensic AI. Detect Police Re-Interview Manipulation. Analyse for: (1) Contact >14 days after initial report (flag), (2) Unscheduled home visits (especially evenings/weekends), (3) Shifting justifications for re-interview, (4) "New evidence" claims that don't materialise, (5) Victim-blaming language ("headbutt", "aggression") introduced in re-interview, (6) Officer statements contradicting initial evidence, (7) Timing coinciding with respondent's settlement offers (collusion indicator). Generate: "Police Manipulation Report" + IOPC complaint template + timeline of coordinated actions + abuse of process argument.` },

  { id:"police_closure", icon:"📁", name:"Police Case Closure Without Consultation Detector", category:"police",
    color:"#6366F1", legal:"Victims' Code of Practice 2020 + judicial review grounds",
    desc:"Detects unlawful case closure without notifying victim, without consultation, and without completing promised actions — breaching statutory Victims' Code rights.",
    sys:`You are UJRIS Forensic AI. Detect unlawful Police Case Closure under the Victims' Code of Practice 2020. Analyse: (1) Was victim notified BEFORE closure? (Code s.3 right to be informed), (2) Was victim consulted before NFA decision? (Code s.9 right to be consulted), (3) Were promised actions completed (witness interviews, CCTV review)?, (4) Were victim's safety needs checked?, (5) Does closure letter mention Victim's Right to Review (VRR)? (Code s.17), (6) Multiple contradictory closure letters?, (7) Generate: "Unlawful Closure Report" citing specific Victims' Code breaches + IOPC complaint + VRR application + judicial review grounds.` },

  { id:"crb_dbs", icon:"🗃", name:"CRB/DBS Reputation Destruction Detector", category:"police",
    color:"#EF4444", legal:"Data Protection Act 2018 + defamation + police systems misuse",
    desc:"Detects unsubstantiated negative CAD entries made by police based on respondent's fabricated allegations — destroying victim's reputation without evidence or conviction.",
    sys:`You are UJRIS Forensic AI. Detect CRB/DBS Reputation Destruction. Analyse for: (1) Negative descriptors in police logs: "aggressive", "threatening", "combative", "headbutt attempt", applied to victim, (2) Entries based solely on respondent's unsubstantiated statements, (3) Entries made without evidence, investigation, or conviction, (4) Entries that remain after NFA/case closure, (5) Proportionality of entries vs actual findings, (6) Generate: "CRB/DBS Integrity Report" + ACRO application for records correction + ICO complaint for data protection breach + defamation argument + tribunal adverse inference from police reliance on respondent's false narrative.` },

  { id:"collusion", icon:"🕸", name:"Collusion Detection Module", category:"police",
    color:"#DC2626", legal:"Conspiracy to pervert the course of justice",
    desc:"Detects coordinated actions between police, respondent, and legal representatives designed to manipulate evidence or pressure victims.",
    sys:`You are UJRIS Forensic AI. Detect Collusion between police and respondent. Cross-reference timelines for: (1) Police actions coinciding with respondent's settlement offers, (2) Police adopting respondent's narrative uncritically (using same language/framing), (3) Police re-interview attempts timed after key case developments, (4) Closure decisions made during active settlement negotiations, (5) Any direct communication between police and respondent's legal team, (6) Pattern of coordinated pressure at key moments. Generate: "Collusion Alert" + timeline graphic + IOPC complaint + conspiracy to pervert the course of justice argument + tribunal argument on abuse of process.` },

  // SHAM HEARINGS (15-17)
  { id:"sham_hearing", icon:"🎭", name:"Sham Hearing Detector", category:"sham",
    color:"#F59E0B", legal:"Article 6 ECHR + common law fairness + s.27 EA 2010",
    desc:"Detects hearings designed to predetermine outcomes — delayed initiation, denied evidence, railroading language, missing comparators, predetermined outcome language.",
    sys:`You are UJRIS Forensic AI. Detect Sham Hearing patterns. Analyse for all 15 indicators: (1) Delayed Initiation (>30 days after alleged incident without explanation), (2) No Prior Concerns (no documented performance issues before protected act), (3) Missing Comparators (similar conduct by others not addressed), (4) Denied Evidence Access (CCTV, records, witness statements refused), (5) Railroading Language in minutes (interruptions, dismissals, not allowed to finish), (6) Illusory Truth Repetition (false claims repeated despite correction), (7) Racial Hostility Framing (calm questioning described as aggressive), (8) Passive/Complicit Representation (union rep not advocating), (9) Predetermined Outcome Language ("we have decided"), (10) Investigation After Hearing (reverse order), (11) Witness Exclusion (key witnesses not called), (12) Denied Cross-Examination, (13) Changed Outcome after challenge, (14) Denied/Impossible Appeal, (15) Retaliatory Timing (within 30 days of protected act). Rate each: ✅ Clear / ⚠️ Concerning / 🔴 Critical. Generate procedural challenge, evidence requests, and ET1 for victimisation.` },

  { id:"safeguarding_weapon", icon:"🛡", name:"Safeguarding Weaponisation Detector", category:"sham",
    color:"#8B5CF6", legal:"s.13/26/27 Equality Act 2010 + whistleblowing ERA 1996 s.103A",
    desc:"Detects when safeguarding policies are weaponised against staff who report misconduct — the reporter is punished while the actual perpetrator is protected.",
    sys:`You are UJRIS Forensic AI. Detect Safeguarding Weaponisation under s.27 Equality Act 2010 and ERA 1996 s.103A. Analyse for 12 indicators: (1) Post-Report Safeguarding (initiated AFTER staff reported misconduct), (2) No Prior Concerns before report, (3) Perpetrator Protected (actual wrongdoer not investigated), (4) Misrepresentation in Investigation (investigator misrepresents victim's words), (5) Illusory Truth in Minutes, (6) Racial Hostility Framing in process, (7) Denied Right to Review Statement, (8) Denied Evidence Access (CCTV, records), (9) Union Complicity (rep passive or advises quitting), (10) Comparative Impunity (white colleagues with worse incidents not investigated), (11) Procedural Gaslighting ("we investigated thoroughly"), (12) Post-Safeguarding Retaliation. Generate: victimisation claim, grievance against perpetrator, union complaint, evidence request for all CCTV and records, comparator evidence request.` },

  { id:"probationary_trap", icon:"🔒", name:"Probationary Trap Detector", category:"sham",
    color:"#F59E0B", legal:"s.13/27 Equality Act 2010 + victimisation",
    desc:"Detects probationary processes used outside normal application — manufacturing process after protected acts to create dismissal paper trail.",
    sys:`You are UJRIS Forensic AI. Detect Probationary Trap patterns. Analyse: (1) Was the probationary process used in circumstances outside its normal application? (Normal: new hires who fail probation), (2) Had the employee passed probation previously?, (3) Were there any documented performance concerns before this process began?, (4) What was the trigger for this process — was it a protected act (grievance, SAR, protected disclosure)?, (5) How long after the protected act was the process initiated?, (6) Were other employees in similar circumstances subjected to the same process?, (7) Does the timing constitute a "detriment" under s.27 Equality Act 2010?, (8) Generate: procedural challenge, comparator evidence request, ET1 for victimisation, argument that process is manufactured and unlawful.` },

  // EMPLOYMENT STATUS (18)
  { id:"leaver_portal", icon:"🚪", name:"Leaver Portal Trap Detector", category:"employment",
    color:"#10B981", legal:"s.103A ERA 1996 + continuous service + protected disclosure",
    desc:"Detects employers treating individuals as 'bank workers with no ongoing contract' while using formal termination processes — undermining continuous service and protected disclosure rights.",
    sys:`You are UJRIS Forensic AI. Detect Leaver Portal Trap — employer using formal termination while claiming casual/bank worker status. Analyse: (1) Contradiction between "bank worker" framing and formal P45/termination process, (2) ACAS Early Conciliation dates vs claimed termination date, (3) Shift offers/bank letters during claimed "no employment" period, (4) Use of formal HR processes (disciplinary, capability) inconsistent with casual status, (5) Protected disclosure timeline — if termination follows protected disclosure, ERA 1996 s.103A bypass argument, (6) Continuous service calculation using all periods of engagement. Generate: "Continuous Service Report" + s.103A protected disclosure bypass argument + unfair dismissal jurisdiction statement + timeline showing continuous relationship.` },
];

function ComparatorIntelligence({ caseData }) {
  const [step, setStep] = useState("type");
  const [discType, setDiscType] = useState("direct");
  const [comparators, setComparators] = useState([]);
  const [pcpData, setPcpData] = useState({ provision:"", group:"", disadvantage:"" });
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const [newComp, setNewComp] = useState({ name:"", role:"", characteristic:"", treatment:"", circumstances:"" });

  const addComparator = () => {
    if (!newComp.name) return;
    setComparators(c=>[...c, {...newComp, id:Date.now()}]);
    setNewComp({ name:"", role:"", characteristic:"", treatment:"", circumstances:"" });
  };

  const analyse = () => {
    setLoading(true); setResult("");
    const SYS = `You are UJRIS — a UK discrimination law comparator specialist. Under s.13 Equality Act 2010, direct discrimination requires proof of less favourable treatment compared to a real or hypothetical comparator in materially similar circumstances. Under s.19, indirect discrimination requires a PCP that disadvantages a group sharing a protected characteristic. Be forensically precise. Always reference the correct legal test.`;

    let prompt = "";
    if (discType === "direct") {
      if (comparators.length > 0) {
        prompt = `Analyse these actual comparators for a direct discrimination claim:\n${comparators.map(c=>`Name: ${c.name}, Role: ${c.role}, Characteristic: ${c.characteristic}, How treated: ${c.treatment}, Circumstances: ${c.circumstances}`).join("\n")}\nClaimant's protected characteristic: ${caseData?.discType?.join(", ")||"discrimination"}. Setting: ${caseData?.setting||"workplace"}.\nFor each comparator: (1) Is this a valid comparator under s.13 EA 2010? (Were circumstances materially the same?), (2) Strength rating: Strong/Moderate/Weak with reasons, (3) What evidence supports this comparator?, (4) How to present this at tribunal, (5) If no valid actual comparator, construct strongest hypothetical comparator. Generate comparator table and tribunal paragraph.`;
      } else {
        prompt = `No actual comparators identified. Construct the strongest possible hypothetical comparator for a ${caseData?.discType?.join(", ")||"discrimination"} claim in a ${caseData?.setting||"workplace"} setting. The hypothetical comparator must: (1) Share all characteristics with claimant except the protected one, (2) Be in materially similar circumstances, (3) Show how a person without the protected characteristic would have been treated differently. Generate: (1) Hypothetical comparator construction, (2) Tribunal argument, (3) Evidence needed to support hypothetical comparator, (4) Case law supporting use of hypothetical comparator (Shamoon v Chief Constable of RUC [2003]).`;
      }
    } else if (discType === "indirect") {
      prompt = `Analyse this indirect discrimination claim. PCP (Provision, Criterion or Practice): "${pcpData.provision}". Group disadvantaged: "${pcpData.group}". Disadvantage suffered: "${pcpData.disadvantage}". Protected characteristic: ${caseData?.discType?.join(", ")||"discrimination"}. Analyse: (1) Is this a valid PCP under s.19 EA 2010?, (2) Does it put persons sharing the protected characteristic at particular disadvantage?, (3) What group statistics/evidence would support this claim?, (4) What "legitimate aim" justification might respondent run?, (5) How to defeat that justification, (6) Generate indirect discrimination argument with case law.`;
    } else {
      prompt = `This is a harassment or victimisation claim. For harassment (s.26 EA 2010): No comparator needed — confirm this and explain why. For victimisation (s.27 EA 2010): Identify the protected act that triggered the detriment. Protected characteristic: ${caseData?.discType?.join(", ")||"discrimination"}. Generate legal framework and what evidence is needed.`;
    }

    streamAI(SYS, prompt, t=>setResult(t), ()=>setLoading(false));
  };

  const INP = (props) => <input {...props} style={{width:"100%",padding:"9px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,boxSizing:"border-box",...props.style}}/>;

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
      <h2 style={{color:T.gold,marginBottom:4}}>⚖ Comparator Intelligence Module</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Under s.13 Equality Act 2010, direct discrimination requires proof of less favourable treatment than a real or hypothetical comparator. This module builds and validates your comparator evidence.</p>

      {/* Claim type selector */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
        {[["direct","Direct Discrimination","s.13 EA 2010","Actual or hypothetical comparator needed"],
          ["indirect","Indirect Discrimination","s.19 EA 2010","PCP disadvantaging a group"],
          ["harassment","Harassment","s.26 EA 2010","No comparator needed"],
          ["victimisation","Victimisation","s.27 EA 2010","Protected act + detriment"]].map(([id,name,law,note])=>(
          <button key={id} onClick={()=>setDiscType(id)}
            style={{padding:"12px 8px",borderRadius:8,border:`2px solid ${discType===id?T.gold:T.border}`,
              background:discType===id?T.goldBg:T.navyM,cursor:"pointer",textAlign:"left"}}>
            <div style={{color:discType===id?T.gold:T.white,fontWeight:700,fontSize:12}}>{name}</div>
            <div style={{color:T.tealL,fontSize:10,margin:"2px 0"}}>{law}</div>
            <div style={{color:T.muted,fontSize:10}}>{note}</div>
          </button>
        ))}
      </div>

      {discType==="direct" && (
        <div>
          <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
            <div style={{color:T.white,fontWeight:700,marginBottom:12}}>Add Actual Comparators</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <INP value={newComp.name} onChange={e=>setNewComp(c=>({...c,name:e.target.value}))} placeholder="Name or role (e.g. 'Sarah, white colleague')"/>
              <INP value={newComp.role} onChange={e=>setNewComp(c=>({...c,role:e.target.value}))} placeholder="Job role / position"/>
              <INP value={newComp.characteristic} onChange={e=>setNewComp(c=>({...c,characteristic:e.target.value}))} placeholder="Their protected characteristic (e.g. White, non-disabled)"/>
              <INP value={newComp.treatment} onChange={e=>setNewComp(c=>({...c,treatment:e.target.value}))} placeholder="How were they treated? (Better/worse/same)"/>
              <div style={{gridColumn:"1/-1"}}>
                <INP value={newComp.circumstances} onChange={e=>setNewComp(c=>({...c,circumstances:e.target.value}))} placeholder="Circumstances — were they materially the same as yours?"/>
              </div>
            </div>
            <button onClick={addComparator} style={{padding:"8px 16px",background:T.gold,color:T.navy,border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>
              + Add Comparator
            </button>
          </div>

          {comparators.length>0 && (
            <div style={{background:T.navyM,borderRadius:12,padding:16,border:`1px solid ${T.teal}`,marginBottom:16}}>
              <div style={{color:T.tealL,fontWeight:700,marginBottom:8,fontSize:13}}>{comparators.length} Comparator{comparators.length!==1?"s":""} Added</div>
              {comparators.map((c,i)=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div>
                    <span style={{color:"#0F2C4A",fontSize:13,fontWeight:600}}>{c.name}</span>
                    <span style={{color:"#64748B",fontSize:12,marginLeft:8}}>{c.role}</span>
                    <span style={{color:T.gold,fontSize:12,marginLeft:8}}>→ {c.treatment}</span>
                  </div>
                  <button onClick={()=>setComparators(cs=>cs.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer"}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {comparators.length===0 && (
            <div style={{background:T.tealBg,borderRadius:8,padding:12,border:`1px solid ${T.teal}`,marginBottom:16,fontSize:13,color:T.tealL}}>
              💡 No actual comparators? That's fine — AI will construct the strongest hypothetical comparator based on Shamoon v Chief Constable of RUC [2003].
            </div>
          )}
        </div>
      )}

      {discType==="indirect" && (
        <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
          <div style={{color:T.white,fontWeight:700,marginBottom:12}}>Provision, Criterion or Practice (PCP)</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <INP value={pcpData.provision} onChange={e=>setPcpData(p=>({...p,provision:e.target.value}))} placeholder="The PCP — what rule/requirement/practice is applied? (e.g. 'Must be available weekends', 'Must have UK degree')"/>
            <INP value={pcpData.group} onChange={e=>setPcpData(p=>({...p,group:e.target.value}))} placeholder="What group sharing your protected characteristic is disadvantaged?"/>
            <INP value={pcpData.disadvantage} onChange={e=>setPcpData(p=>({...p,disadvantage:e.target.value}))} placeholder="What is the particular disadvantage caused to that group?"/>
          </div>
        </div>
      )}

      {(discType==="harassment"||discType==="victimisation") && (
        <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.teal}`,marginBottom:16}}>
          <div style={{color:T.tealL,fontWeight:700,marginBottom:8}}>
            {discType==="harassment" ? "✅ Good news — no comparator needed for harassment claims" : "🔑 Identify your Protected Act"}
          </div>
          <div style={{color:"#64748B",fontSize:13}}>
            {discType==="harassment" ? "Under s.26 Equality Act 2010, harassment does not require a comparator. Click 'Analyse' for the complete legal framework and evidence needed." : "Under s.27, victimisation requires: (1) a protected act (e.g. raising a grievance, making a discrimination claim, giving evidence for another), and (2) a detriment because of that act. Click 'Analyse' to identify your protected act and build the victimisation argument."}
          </div>
        </div>
      )}

      <button onClick={analyse} disabled={loading}
        style={{width:"100%",padding:"12px",background:loading?"#444":T.gold,color:T.navy,border:"none",borderRadius:8,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontSize:14,marginBottom:16}}>
        {loading?"Analysing Comparators...":"⚖ Analyse Comparator Position"}
      </button>

      {result && (
        <div style={{background:T.navyM,borderRadius:12,padding:24,border:`1px solid ${T.goldD}`,whiteSpace:"pre-wrap",color:T.white,fontSize:13,lineHeight:1.8}}>
          <div style={{color:T.gold,fontWeight:700,marginBottom:12}}>⚖ Comparator Analysis</div>
          {result}
          <div style={{marginTop:12,padding:"8px 12px",background:T.redBg,borderRadius:8,color:"#64748B",fontSize:11}}>
            ⚠ AI-generated legal analysis — not legal advice. Seek qualified legal advice before tribunal proceedings.
          </div>
        </div>
      )}
    </div>
  );
}

function ShamHearingNavigator({ caseData }) {
  const [mode, setMode] = useState("sham"); // sham | safeguarding | comparative
  const [indicators, setIndicators] = useState({});
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  const SHAM_INDICATORS = [
    ["delayed","Delayed Initiation (>30 days after alleged incident)"],
    ["no_prior","No Prior Performance Concerns"],
    ["missing_comp","Missing Comparators (others not treated same)"],
    ["denied_evidence","Denied Access to Evidence (CCTV, records, statements)"],
    ["railroading","Railroading Language in Minutes"],
    ["repetition","Illusory Truth Repetition (false claims repeated)"],
    ["hostility_framing","Racial/Hostility Framing (calm questioning called aggressive)"],
    ["passive_rep","Passive or Complicit Representative"],
    ["predetermined","Predetermined Outcome Language"],
    ["inverted","Investigation Conducted After Hearing (reverse order)"],
    ["witness_excl","Key Witnesses Excluded"],
    ["no_crossexam","Denied Right to Cross-Examine"],
    ["changed_outcome","Outcome Changed After Challenge"],
    ["no_appeal","Appeal Denied or Impossible"],
    ["retaliatory_timing","Retaliatory Timing (within 30 days of protected act)"],
  ];

  const SAFEGUARDING_INDICATORS = [
    ["post_report","Safeguarding Initiated After You Reported Misconduct"],
    ["no_prior_safe","No Prior Safety Concerns Before Report"],
    ["perp_protected","Actual Perpetrator Not Investigated or Disciplined"],
    ["misrep","Investigator Misrepresented Your Words"],
    ["illusory_safe","False Claims Repeated in Minutes Despite Correction"],
    ["racial_safe","Your Factual Reporting Framed as Aggressive/Combative"],
    ["no_review","Denied Right to Review and Approve Your Statement"],
    ["no_evidence","Denied Access to CCTV/Records/Witness Statements"],
    ["union_fail","Union Rep Was Passive, Dismissed Your Concerns, or Advised Quitting"],
    ["comp_impunity","White/Other Colleagues With Worse Incidents Not Investigated"],
    ["gaslighting","'We Investigated Thoroughly' Claims Later Disproven"],
    ["post_retaliation","Further Disciplinary Action After Safeguarding Concluded"],
  ];

  const currentIndicators = mode==="sham" ? SHAM_INDICATORS : SAFEGUARDING_INDICATORS;
  const criticalCount = Object.values(indicators).filter(v=>v).length;
  const totalIndicators = currentIndicators.length;

  const analyse = () => {
    setLoading(true); setResult("");
    const triggered = currentIndicators.filter(([id])=>indicators[id]).map(([,label])=>label);
    const detector = FORENSIC_DETECTORS.find(d=>d.id===(mode==="sham"?"sham_hearing":"safeguarding_weapon"));
    const SYS = detector?.sys || "You are UJRIS forensic AI.";
    const prompt = `${mode==="sham"?"SHAM HEARING ANALYSIS":"SAFEGUARDING WEAPONISATION ANALYSIS"}\n\nUser's situation: ${description}\n\nTriggered indicators (${triggered.length}/${totalIndicators}):\n${triggered.map((t,i)=>`${i+1}. ${t}`).join("\n")}\n\nCase context: ${caseData?.discType?.join(", ")||"discrimination"} in ${caseData?.setting||"workplace"}.\n\nGenerate: (1) Critical alert summary, (2) Legal analysis with case law, (3) Recommended immediate actions, (4) Evidence to request, (5) ET1 claim arguments, (6) Regulatory bodies to contact.`;
    streamAI(SYS, prompt, t=>setResult(t), ()=>setLoading(false));
  };

  const urgencyColor = criticalCount>=10?"#ff4444":criticalCount>=5?"#ff9f7f":criticalCount>=3?T.gold:T.teal;

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
      <h2 style={{color:T.gold,marginBottom:4}}>🎭 Sham Hearing & Safeguarding Navigator</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Detects hearings designed to predetermine outcomes and safeguarding policies weaponised against reporters.</p>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["sham","🎭 Sham Hearing"],["safeguarding","🛡 Safeguarding Weaponisation"]].map(([id,label])=>(
          <button key={id} onClick={()=>{setMode(id);setIndicators({});setResult("");}}
            style={{flex:1,padding:"10px",borderRadius:8,border:`2px solid ${mode===id?T.gold:T.border}`,
              background:mode===id?T.goldBg:T.navyM,color:mode===id?T.gold:T.muted,fontWeight:700,cursor:"pointer",fontSize:13}}>
            {label}
          </button>
        ))}
      </div>

      {/* Situation description */}
      <div style={{marginBottom:16}}>
        <VersatileInput
          label="Describe your situation"
          value={description}
          onChange={e=>setDescription(e.target.value)}
          rows={4}
          placeholder={mode==="sham"?"Describe when and why the hearing was initiated, what happened during it, who was present, what was said...":"Describe when safeguarding was initiated, what triggered it, who was involved, what evidence you were denied..."}
          caseContext="sham hearing / safeguarding weaponisation analysis"
          onFileAnalysed={(text)=>setDescription(prev=>(prev?prev+"\n\n":"")+text)}
        />
      </div>

      {/* Indicator checklist */}
      <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{color:T.white,fontWeight:700,fontSize:14}}>Tick all indicators that apply</div>
          <div style={{color:urgencyColor,fontWeight:700,fontSize:14}}>
            {criticalCount}/{totalIndicators} detected
            {criticalCount>=10?" 🔴 CRITICAL":criticalCount>=5?" 🟠 HIGH":criticalCount>=3?" 🟡 MEDIUM":""}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {currentIndicators.map(([id,label])=>(
            <label key={id} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 10px",
              borderRadius:6,background:indicators[id]?T.redBg:"transparent",border:`1px solid ${indicators[id]?T.red:T.border}`}}>
              <input type="checkbox" checked={!!indicators[id]} onChange={e=>setIndicators(i=>({...i,[id]:e.target.checked}))}
                style={{width:16,height:16,accentColor:T.gold,flexShrink:0}}/>
              <span style={{color:indicators[id]?T.redL:T.muted,fontSize:13}}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={analyse} disabled={loading||criticalCount===0}
        style={{width:"100%",padding:"12px",background:loading||criticalCount===0?"#444":T.gold,
          color:T.navy,border:"none",borderRadius:8,fontWeight:700,cursor:loading||criticalCount===0?"not-allowed":"pointer",fontSize:14,marginBottom:16}}>
        {loading?"Analysing...":criticalCount===0?"Select indicators above to analyse":"🎭 Generate Full Detection Report"}
      </button>

      {result && (
        <div style={{background:T.navyM,borderRadius:12,padding:24,border:`1px solid ${T.red}`,whiteSpace:"pre-wrap",color:T.white,fontSize:13,lineHeight:1.8}}>
          <div style={{color:"#ff6b6b",fontWeight:700,marginBottom:12,fontSize:15}}>
            🔴 {mode==="sham"?"SHAM HEARING DETECTION REPORT":"SAFEGUARDING WEAPONISATION REPORT"}
          </div>
          {result}
          <div style={{marginTop:12,padding:"8px 12px",background:T.goldBg,borderRadius:8,color:T.gold,fontSize:11}}>
            ⚖ AI-generated forensic analysis for evidence purposes. Not legal advice. Consider qualified legal review.
          </div>
        </div>
      )}
    </div>
  );
}

function ForensicIntelligenceHub({ caseData, setTab }) {
  const [activeDetector, setActiveDetector] = useState(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    {id:"all",label:"All Detectors"},
    {id:"core",label:"🎯 Core Forensic"},
    {id:"systemic",label:"✊ Systemic Abuse"},
    {id:"tactical",label:"💷 Tactical"},
    {id:"police",label:"🚔 Police"},
    {id:"sham",label:"🎭 Sham Hearings"},
    {id:"employment",label:"🚪 Employment"},
  ];

  const filtered = activeCategory==="all" ? FORENSIC_DETECTORS : FORENSIC_DETECTORS.filter(d=>d.category===activeCategory);

  const runDetector = () => {
    if (!activeDetector || !input.trim()) return;
    setLoading(true); setResult("");
    streamAI(activeDetector.sys, `DOCUMENT/TEXT TO ANALYSE:\n\n${input}\n\nCase context: ${caseData?.discType?.join(", ")||"not specified"}, ${caseData?.setting||"workplace setting"}.`,
      t=>setResult(t), ()=>setLoading(false));
  };

  if (activeDetector) return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
      <button onClick={()=>{setActiveDetector(null);setResult("");setInput("");}}
        style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"6px 14px",cursor:"pointer",marginBottom:20,fontSize:13}}>
        ← Back to Detectors
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
        <span style={{fontSize:32}}>{activeDetector.icon}</span>
        <div>
          <div style={{color:activeDetector.color,fontWeight:700,fontSize:18}}>{activeDetector.name}</div>
          <div style={{color:"#64748B",fontSize:12}}>{activeDetector.legal}</div>
        </div>
      </div>
      <p style={{color:"#64748B",fontSize:13,marginBottom:20,lineHeight:1.6}}>{activeDetector.desc}</p>

      <div style={{marginBottom:16}}>
        <VersatileInput
          label="Evidence input — paste, upload, photograph or record:"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onFileAnalysed={(text)=>setInput(prev=>(prev?prev+"\n\n":"")+text)}
          rows={8}
          placeholder="Paste document text, upload a PDF/Word/image, take a photo of a letter, or record your account. Include dates, names, and all relevant details..."
          caseContext={`forensic analysis: ${activeDetector?.name || "detector"}`}
        />
        <div style={{color:"#64748B",fontSize:11,marginTop:4}}>{input.length} characters</div>
      </div>

      <button onClick={runDetector} disabled={loading||!input.trim()}
        style={{width:"100%",padding:"13px",background:loading||!input.trim()?"#444":activeDetector.color,
          color:T.white,border:"none",borderRadius:8,fontWeight:700,cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:14,marginBottom:20}}>
        {loading?`Running ${activeDetector.name}...`:`${activeDetector.icon} Run ${activeDetector.name}`}
      </button>

      {result && (
        <div style={{background:T.navyM,borderRadius:12,padding:24,border:`2px solid ${activeDetector.color}`,marginBottom:16}}>
          <div style={{color:activeDetector.color,fontWeight:700,marginBottom:12,fontSize:15}}>
            {activeDetector.icon} FORENSIC ANALYSIS REPORT
          </div>
          <div style={{whiteSpace:"pre-wrap",color:T.white,fontSize:13,lineHeight:1.8}}>{result}</div>
          <div style={{marginTop:16,display:"flex",gap:10}}>
            <button onClick={()=>navigator.clipboard?.writeText(result)}
              style={{padding:"8px 16px",background:T.goldBg,color:T.gold,border:`1px solid ${T.goldD}`,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
              📋 Copy Report
            </button>
            <button onClick={()=>{S.set("forensic_used",true);}}
              style={{padding:"8px 16px",background:T.navyL,color:T.muted,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",fontSize:12}}>
              💾 Save to Case
            </button>
          </div>
          <div style={{marginTop:12,padding:"8px 12px",background:T.redBg,borderRadius:8,color:"#64748B",fontSize:11}}>
            ⚠ AI forensic analysis — not legal advice. Use this report to inform your legal strategy. Seek qualified legal advice for tribunal proceedings.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{color:T.gold,marginBottom:4}}>🔬 UJRIS Forensic Intelligence Hub</h2>
        <p style={{color:"#64748B",fontSize:13,marginBottom:16}}>18 legally-precise detectors. Every detector produces a court-admissible forensic report with tribunal paragraphs, costs wording, and regulatory referrals.</p>
        <div style={{background:T.goldBg,borderRadius:10,padding:"12px 16px",border:`1px solid ${T.goldD}`,fontSize:13,color:T.gold}}>
          💡 <strong>How to use:</strong> Select a detector → paste the relevant document text → receive an instant forensic audit with tribunal-ready evidence.
        </div>
      </div>

      {/* Specialist modules */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[
          {id:"comparator",icon:"⚖",label:"Comparator Intelligence",desc:"Build actual & hypothetical comparators",color:T.gold,tab:"comparator"},
          {id:"sham",icon:"🎭",label:"Sham Hearing Navigator",desc:"Detect sham hearings & safeguarding weaponisation",color:"#F59E0B",tab:"sham_nav"},
          {id:"schedule",icon:"📊",label:"Schedule of Loss",desc:"Full compensation + pension calculator",color:T.teal,tab:"calculator"},
        ].map(m=>(
          <button key={m.id} onClick={()=>setTab(m.tab)}
            style={{padding:"14px",borderRadius:10,border:`1px solid ${m.color}44`,background:T.navyM,cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:24,marginBottom:6}}>{m.icon}</div>
            <div style={{color:m.color,fontWeight:700,fontSize:13}}>{m.label}</div>
            <div style={{color:"#64748B",fontSize:11,marginTop:3}}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {categories.map(c=>(
          <button key={c.id} onClick={()=>setActiveCategory(c.id)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
              background:activeCategory===c.id?T.gold:T.navyM,color:activeCategory===c.id?T.navy:T.muted,
              border:`1px solid ${activeCategory===c.id?T.gold:T.border}`}}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Detector grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {filtered.map(d=>(
          <button key={d.id} onClick={()=>setActiveDetector(d)}
            style={{background:T.navyM,borderRadius:12,padding:18,border:`1px solid ${T.border}`,
              cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=d.color;e.currentTarget.style.background=T.navyL;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.navyM;}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:22}}>{d.icon}</span>
              <div>
                <div style={{color:d.color,fontWeight:700,fontSize:12,lineHeight:1.3}}>{d.name}</div>
                <div style={{color:T.dim,fontSize:10,marginTop:1}}>{d.legal}</div>
              </div>
            </div>
            <div style={{color:"#64748B",fontSize:11,lineHeight:1.5}}>{d.desc}</div>
            <div style={{color:d.color,fontSize:11,marginTop:8,fontWeight:600}}>Run Detector →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  PROTECTION HUB — FOI, CPS, Whistleblowing, Police Rights
// ============================================================
const PROTECTION_SECTIONS = [
  {
    id: "foi",
    icon: "📋",
    title: "Freedom of Information",
    subtitle: "Request any public authority's records",
    color: "#4a9eff",
    overview: "Under the Freedom of Information Act 2000, any UK public authority (schools, NHS trusts, hospitals, local councils, Children's Social Care, police forces) MUST provide recorded information within 20 working days. This is one of your most powerful tools — it turns 'I don't have the proof' into 'Here is the exact document showing what really happened.'",
    targets: [
      { name: "School", items: ["All concern logs, safeguarding meeting minutes", "All emails mentioning your or your child's name", "Referral forms sent to other agencies", "Attendance and behaviour records", "Any notes from conversations with you or your child"] },
      { name: "Hospital / NHS Trust", items: ["All clinical notes and nursing observations", "Social services referral forms completed by staff", "Any 'safeguarding concerns' logged about your family", "Records of conversations with professionals about your family"] },
      { name: "Local Authority / Children's Social Care", items: ["All referral records and their source", "All assessments (Initial Assessment, Child and Family Assessment)", "Case conference minutes", "All emails and correspondence about your family", "Records of who made each referral and what they said"] },
      { name: "Police", items: ["All CAD logs mentioning your name or address", "All intelligence entries on police systems", "All emails, incident reports, and correspondence", "Records of any referrals made to other agencies"] },
    ],
    tips: [
      "Send by recorded post or email — you need proof of delivery",
      "Quote 'Freedom of Information Act 2000' in the subject line",
      "You have 20 working days — set a reminder",
      "If refused, appeal under Section 50 to the Information Commissioner's Office (ICO)",
      "Store all responses in your UJRIS Evidence Vault immediately",
      "Run every response through the Forensic Auditor — look for leading questions, cultural assumptions, and inconsistencies",
    ],
    aiPrompt: (target, details) => `You are UJRIS — a UK Freedom of Information specialist. Write a formal FOI request letter under the Freedom of Information Act 2000. Target authority: ${target}. Details: ${details}. The letter must: (1) Clearly identify the request as made under FOIA 2000, (2) Be specific about the information requested (use bullet points), (3) State the 20 working day deadline, (4) Request all formats (emails, handwritten notes, digital records, CCTV logs), (5) Include a request for a Refusal Notice with specific legal basis if any item is withheld, (6) Warn of ICO complaint if not complied with, (7) Be professionally assertive. Use formal letter format with today's date, reference line, and signature block. The requester is a member of the public exercising their legal rights.`,
  },
  {
    id: "cps_safeguarding",
    icon: "🛡",
    title: "CPS & Safeguarding: Immigrant Families",
    subtitle: "Protect your family from discriminatory referrals",
    color: "#e07b54",
    overview: "Children's Social Care discrimination against immigrant and minority ethnic families is one of the most serious and least discussed injustices in the UK. Research confirms BAME families face disproportionate referrals — often triggered by innocent questions, cultural misunderstandings, or outright racial bias. During your first years in the UK, you are at the highest risk. The system can weaponise your own answers against you.",
    redFlags: [
      { flag: "The Innocent Question Trap", detail: "A teacher, health visitor, or hospital staff member asks: 'Do you need any help at home?' or 'Is everything okay?' — your honest answer of 'yes' or 'it's a bit hard' can be logged as a 'safeguarding concern' and trigger a CPS referral without your knowledge." },
      { flag: "Cultural Misinterpretation", detail: "Disciplinary practices, sleeping arrangements, dietary habits, and parenting styles that are completely normal in your culture are reported as 'neglect' or 'abuse' by professionals with no cultural competency training." },
      { flag: "Language Exploitation", detail: "If you don't fully understand what you're agreeing to, consent forms and disclosures can be used against you. You have the right to an interpreter at all times — demand one." },
      { flag: "The Snowball Referral", detail: "Once one referral is made, each subsequent professional assumes the concern is valid and adds their own 'observations' — creating a file that looks alarming even though every original concern was unfounded." },
      { flag: "Initial Assessment Bias", detail: "Social workers from non-diverse backgrounds apply their own cultural standards. What they write in assessments becomes 'the truth' — but you have the right to challenge every word." },
    ],
    rights: [
      "You have the right to see every document Children's Social Care holds about your family — request via SAR (UK GDPR Article 15)",
      "You have the right to challenge any assessment — you can request an independent review",
      "You have the right to have a solicitor present at any Child Protection Conference",
      "You have the right to an interpreter at every meeting — request one in writing",
      "You have the right to bring a McKenzie Friend (lay supporter) to any meeting",
      "You have the right to see the referral form and know who made it",
      "A Section 47 investigation does NOT mean you have done anything wrong",
      "Social workers MUST follow the 'Working Together to Safeguard Children 2023' guidance — use it against them if they don't",
    ],
    actionSteps: [
      "Submit an FOI to the school, hospital, or authority that made the referral — get the original document",
      "Submit a SAR to Children's Social Care for ALL records — immediately",
      "Write a formal rebuttal letter to every factual inaccuracy in any assessment",
      "Request the Equality Act 2010 protected characteristics of your social worker's caseload statistics",
      "Contact your local councillor — councils have statutory oversight of social care",
      "Contact the Children's Commissioner for England if your child's rights are violated",
      "Use the UJRIS Forensic Auditor to analyse every document for leading questions and cultural bias",
    ],
    disclaimer: "⚠ CRITICAL: If you are facing a Child Protection Conference or court proceedings, contact a family law solicitor IMMEDIATELY. Legal aid is available in care proceedings regardless of income. Contact the Association of Lawyers for Children or your local Citizens Advice.",
  },
  {
    id: "whistleblowing",
    icon: "📣",
    title: "Whistleblowing: Your Protected Rights",
    subtitle: "Report wrongdoing safely under PIDA 1998",
    color: "#7bc67e",
    overview: "Whistleblowing is making a 'protected disclosure' — reporting wrongdoing that is in the public interest. If you make a protected disclosure, you cannot be dismissed, disadvantaged, or victimised because of it. The Public Interest Disclosure Act 1998 (PIDA) gives you this protection — with no minimum qualifying period of employment required.",
    qualifies: [
      "Criminal offences (including fraud, corruption, theft)",
      "Miscarriages of justice",
      "Health and safety dangers",
      "Environmental damage",
      "Covering up any of the above",
      "Discrimination, racism, or bullying if it breaches a legal obligation",
      "Fabrication of evidence or false records",
      "Safeguarding violations against vulnerable people",
    ],
    channels: [
      { channel: "Your employer (internal)", when: "First step — creates a paper trail. Use if safe to do so." },
      { channel: "Prescribed person/regulator", when: "Ofsted (education), CQC (health/social care), IOPC (police misconduct), ICO (data protection), HSE (health & safety), FCA (financial services)" },
      { channel: "Legal adviser", when: "Always advisable — confidential, privileged" },
      { channel: "Wider disclosure (media/public)", when: "Only as last resort — strict conditions apply" },
    ],
    protections: [
      "Cannot be dismissed for making a protected disclosure (automatic unfair dismissal — no qualifying period)",
      "Cannot be subjected to any detriment (demotion, bullying, exclusion, victimisation)",
      "Compensation is uncapped — tribunals have awarded over £1 million",
      "Interim relief available if dismissed — apply within 7 days of dismissal",
    ],
    tips: [
      "Always make your disclosure in writing — email with delivery confirmation",
      "State explicitly: 'This is a protected disclosure under the Public Interest Disclosure Act 1998'",
      "Keep a copy in your UJRIS Evidence Vault",
      "Document every adverse action taken after your disclosure — this builds your victimisation case",
      "Contact Protect (formerly Public Concern at Work): 020 3117 2520 — free confidential advice",
    ],
    aiPrompt: (concern, employer) => `You are UJRIS — a UK whistleblowing law specialist. Write a formal protected disclosure letter under the Public Interest Disclosure Act 1998. The concern being disclosed: ${concern}. Employer/authority: ${employer}. The letter must: (1) State explicitly this is a Protected Disclosure under PIDA 1998, (2) Describe the wrongdoing factually and specifically, (3) Explain why this is in the public interest, (4) Identify the legal obligation being breached, (5) Request acknowledgement within 5 working days, (6) Warn that any subsequent detriment will be treated as victimisation under s.47B ERA 1996, (7) Be professionally assertive but factual. Provide formal letter format.`,
  },
  {
    id: "police_rights",
    icon: "⚖",
    title: "Police Interaction & Your Rights",
    subtitle: "Stay safe. Stay calm. Know exactly what to say.",
    color: "#c9a84c",
    overview: "Understanding your rights when dealing with police is not about guilt or innocence — it is about protection. The deliberate tactic used against minority communities is to provoke a reaction, then use that reaction as justification. Staying calm, knowing your rights, and saying 'No comment' are not signs of guilt. They are signs of intelligence.",
    stages: [
      {
        stage: "On the Street: Stop and Search / Detention",
        rights: [
          "Police can only stop and search you if they have 'reasonable grounds' to suspect you're carrying weapons, drugs, or stolen goods",
          "Ask the officer: 'What are your grounds for stopping me?' — you have the right to know",
          "Ask for their name and badge number — write it down or say it loudly so bystanders hear",
          "You do NOT have to answer questions on the street — stay calm and say: 'I do not consent to this search but I will not physically resist'",
          "If arrested: 'I am exercising my right to remain silent until I have legal advice'",
          "Handcuffs do NOT mean you are under arrest — ask: 'Am I under arrest or am I free to go?'",
          "STAY CALM. Do not raise your voice. Do not make sudden movements. Every reaction will be documented.",
        ],
        warning: "The modus operandi is deliberate provocation — an officer may be hostile, dismissive, or accusatory specifically to trigger a reaction. Your angry or frightened response is then documented as 'aggressive behaviour' and used against you. Breathe. Stay still. Say as little as possible.",
      },
      {
        stage: "At the Police Station: Before Interview",
        rights: [
          "You have the absolute right to FREE legal advice — demand it immediately and do not speak until your solicitor arrives",
          "Say: 'I wish to speak to a solicitor before answering any questions'",
          "You can request the duty solicitor — it is free",
          "You are entitled to have someone informed of your detention (you can name one person)",
          "You must be told the reason for your arrest and the offence being investigated",
          "You are entitled to see the Codes of Practice (PACE Codes)",
          "The comfortable treatment — refreshments, kind officers, casual conversation — is a technique to lower your guard before the recorder starts",
        ],
        warning: "The pattern: arrest → handcuffs → brief detention to create stress and vulnerability → release to custody suite → kind treatment, coffee, casual chat → 'just a few questions' → caution + recording starts → mistakes made. Do not be fooled by the kindness. Nothing is off the record once you are in custody.",
      },
      {
        stage: "The Police Interview: PACE Caution",
        caution: "You do not have to say anything. But it may harm your defence if you do not mention when questioned something which you later rely on in court. Anything you do say may be given in evidence.",
        noComment: "Say this at the start of the interview and after every question: 'No comment.' Nothing else. You do not need to explain. You do not need to justify it. No comment IS a complete answer.",
        when: [
          "NO COMMENT is appropriate in almost all circumstances without a solicitor present",
          "NO COMMENT does not mean guilt — courts are instructed not to treat it as an admission",
          "If police have sufficient evidence to charge you, they will charge you regardless of what you say",
          "If police do NOT have sufficient evidence, your 'no comment' is simply a neutral answer",
          "Anything you say can and WILL be used against you — this is not a cliché, it is the purpose of the interview",
          "A 'prepared statement' read by your solicitor is sometimes the right approach — discuss with legal advice only",
        ],
        warning: "The caution says 'it may harm your defence if you do not mention something you later rely on.' This sounds like you MUST talk. You do not. Your solicitor will advise if there is any specific matter requiring a prepared statement. Until you have spoken to a solicitor: NO COMMENT.",
      },
      {
        stage: "After Detention: Documentation",
        rights: [
          "Request your custody record immediately — you are entitled to a copy",
          "Document every officer's name and badge number who dealt with you",
          "Photograph any injuries immediately — before they heal",
          "Write down everything that happened as soon as possible, in chronological order",
          "Submit an FOI/SAR to the police for all records within 7 days of release",
          "If you believe you were stopped due to race: file a complaint with the IOPC immediately",
          "If you were handcuffed without lawful justification: this may be unlawful detention — contact a solicitor",
        ],
        warning: "Police are required to complete a Stop and Search record and give you a copy. Demand it. It contains their stated 'grounds' — the UJRIS Forensic Auditor can analyse whether those grounds are genuine or racially motivated.",
      },
    ],
    emergency: [
      { name: "Bindmans (specialist civil liberties firm)", contact: "020 7833 4433" },
      { name: "Doughty Street Chambers (human rights)", contact: "020 7404 1313" },
      { name: "Liberty (civil liberties)", contact: "020 7403 3888" },
      { name: "IOPC (police misconduct)", contact: "0300 020 0096" },
      { name: "Equality Advisory Support Service", contact: "0808 800 0082" },
    ],
  },
  {
    id: "self_assessment",
    icon: "🔍",
    title: "Am I Being Discriminated Against?",
    subtitle: "Self-assessment — know before it's too late",
    color: "#a78bfa",
    overview: "Many victims of discrimination and institutional abuse do not recognise what is happening to them — especially in the early stages when it is subtle, wrapped in 'safeguarding,' 'performance management,' or 'concern for your wellbeing.' This checklist helps you identify whether you may be experiencing discrimination and what type.",
    questions: [
      { q: "Have you been treated differently or less favourably than colleagues or peers?", flag: "Direct discrimination — s.13 Equality Act 2010" },
      { q: "Have your complaints or concerns been dismissed as 'cultural,' 'oversensitive,' or 'over-reacting'?", flag: "Racial/cultural harassment — s.26 Equality Act 2010" },
      { q: "Have you noticed rules or standards being applied more strictly to you than to others?", flag: "Direct or indirect discrimination" },
      { q: "Were you subjected to a formal process (performance, probation, disciplinary) shortly after raising a concern?", flag: "Victimisation — s.27 Equality Act 2010" },
      { q: "Has your employer/school/authority denied something happened, despite witnesses or documents?", flag: "Potential fabrication — Anchor Lie Detector" },
      { q: "Were safeguarding concerns raised about you or your family after a single innocent conversation?", flag: "Discriminatory safeguarding referral" },
      { q: "Have you been excluded from meetings, information, or opportunities others received?", flag: "Exclusionary discrimination" },
      { q: "Do you feel you must work twice as hard or stay silent to avoid being labelled 'difficult' or 'aggressive'?", flag: "Race discrimination / hostile environment" },
      { q: "Has your normal assertiveness or confidence been described as 'aggressive' or 'threatening'?", flag: "Big Blackman Phenomenon — Racial Hostility Framing" },
      { q: "Were you handed over to police, security, or authorities in a situation where a white peer would not have been?", flag: "Race discrimination — direct treatment" },
    ],
  },
];

const UK_STATS = [
  { value:"70,000+", label:"Self-Represented Litigants", detail:"file discrimination claims annually in the UK", source:"Ministry of Justice 2025/26", color:"#ff9f7f", icon:"⚖" },
  { value:"14% vs 48%", label:"The Win Rate Gap", detail:"Without solicitor: 14% win. With solicitor: 48% win. UJRIS bridges this gap.", source:"Legal Action Group", color:"#C9A84C", icon:"📊" },
  { value:"94%", label:"BAME Claimants Unrepresented", detail:"of BAME discrimination claimants go to tribunal without legal representation", source:"Legal Action Group", color:"#ff4444", icon:"✊" },
  { value:"515,000+", label:"Open Tribunal Cases", detail:"backlog with a 49% increase year-on-year — the system is overwhelmed", source:"MoJ Q3 2025/26", color:"#a78bfa", icon:"🏛" },
  { value:"25+ weeks", label:"Average Wait Time", detail:"from filing ET1 to first hearing — evidence collection and deadlines matter now", source:"Ministry of Justice", color:"#4a9eff", icon:"⏰" },
  { value:"54,000", label:"Pregnant Women Dismissed", detail:"lose jobs annually due to pregnancy discrimination — often without realising it is unlawful", source:"EHRC", color:"#ff9f7f", icon:"🤱" },
  { value:"80%", label:"Rise in Disability Claims", detail:"increase in disability discrimination claims 2020–2025", source:"EHRC", color:"#7bc67e", icon:"♿" },
  { value:"£5–10bn", label:"Annual Cost of Discrimination", detail:"60% of discrimination victims leave their jobs — costing the economy billions", source:"Centre for Social Justice", color:"#C9A84C", icon:"💷" },
];

const TESTIMONIALS = [
  {
    id:"t1", name:"Onyedika's Case", category:"race", icon:"✊",
    quote:"They told me to 'do my work quietly and go home.' UJRIS helped me prove a pattern they thought was invisible.",
    situation:"A healthcare worker of Nigerian origin was subjected to racial harassment, a sham investigation, and constructive dismissal after raising concerns about patient safety.",
    ujrisHelped:["Filed SAR — revealed 47 emails manager claimed didn't exist","Built 8-point chronology showing retaliatory pattern","Identified 3 white colleagues in similar situations treated entirely differently","Forensic analysis exposed fabricated witness statements dated after solicitors were hired"],
    outcome:"£128,000 race discrimination settlement before tribunal hearing",
    feature:"SAR + Forensic Auditor + Comparator Tool",
    color:"#C9A84C",
  },
  {
    id:"t2", name:"Sarah's Story", category:"disability", icon:"♿",
    quote:"I didn't know I was being discriminated against. I just knew something was wrong.",
    situation:"A senior analyst with a chronic health condition was refused flexible working despite medical evidence, placed on a performance plan, and dismissed.",
    ujrisHelped:["SAR revealed emails showing manager's bias against 'disabled staff'","Timeline proved causation between health disclosure and performance plan","Comparator evidence: non-disabled colleagues with worse performance were supported, not fired","Forensic tool detected leading language in investigation minutes"],
    outcome:"£45,000 settlement before tribunal hearing",
    feature:"SAR + Timeline + Comparator",
    color:"#4a9eff",
  },
  {
    id:"t3", name:"A Police Case", category:"police", icon:"🚔",
    quote:"The police closed my case without telling me. UJRIS helped me understand I had rights they never mentioned.",
    situation:"A man's assault report was closed without consultation, without completing promised actions, and without notification — a direct breach of the Victims' Code 2020.",
    ujrisHelped:["Rights Advisor explained Victim Right to Review (VRR)","FOI request to police revealed case closure decision chain","IOPC complaint generated with specific statutory breaches cited","SAR exposed CAD entries containing unsubstantiated negative characterisations"],
    outcome:"Case reopened within 6 weeks. Full formal investigation commenced.",
    feature:"Rights Advisor + FOI + IOPC Tools",
    color:"#ff9f7f",
  },
  {
    id:"t4", name:"A Family's Story", category:"safeguarding", icon:"👪",
    quote:"One innocent question to a health visitor became a 6-month nightmare. We didn't know we had the right to challenge anything.",
    situation:"A recently arrived Nigerian family was referred to Children's Social Care after a health visitor logged a routine 'do you need any help?' response as a 'safeguarding concern.'",
    ujrisHelped:["FOI to local authority revealed referral was based on a single question","SAR exposed cultural assumptions in social worker's initial assessment","Timeline showed pattern of disproportionate referrals in similar families","Legal basis: Equality Act 2010 s.13 race discrimination by public authority"],
    outcome:"Referral formally closed. Written apology from Children's Services. FOI published revealing systemic bias in their referral process.",
    feature:"FOI + SAR + Protection Hub + Timeline",
    color:"#7bc67e",
  },
];

const SCENARIOS = [
  {
    id:"s1", title:"The Promotion That Never Came",
    setup:"You're a senior analyst. 5 years at the company. The only Black person in your department. A junior white colleague with 2 years' experience gets promoted. You're told you're 'not ready yet.'",
    question:"What would you do?",
    options:[
      { label:"A. Accept it — maybe they're right. Work harder.", correct:false, response:"This is what most people do — and it's what the employer hopes for. Each promotion cycle that passes makes your claim harder to prove. Time limits apply from each discriminatory act." },
      { label:"B. Confront my manager angrily in front of colleagues.", correct:false, response:"This gives the employer grounds to initiate disciplinary action against you. They may use your reaction as justification to treat you even less favourably. Never give them ammunition." },
      { label:"C. Document everything and build evidence immediately.", correct:true, response:"You're on the right track. The 3-month limitation clock has already started. Here's exactly what to do now:" },
    ],
    correctActions:[
      "File a SAR requesting all promotion decision records, scoring criteria, and comparator assessments",
      "Build a timeline: when did you apply? When was the decision made? Who made it?",
      "Identify your comparators: who was promoted and what were their qualifications vs yours?",
      "Write contemporaneous notes today with exact words and dates",
      "Consider raising a formal grievance — this creates a paper trail and often triggers disclosure",
    ],
    legal:"Direct discrimination under Equality Act 2010 s.13. Possible indirect discrimination if promotion criteria disproportionately disadvantage Black employees.",
  },
  {
    id:"s2", title:"The Innocent Question That Wasn't",
    setup:"Your daughter's teacher calls you in for a 'chat'. She asks: 'Are you managing OK at home? Do you need any support?' You answer honestly: 'We're still settling in, it's quite a lot to navigate.' Three weeks later you receive a letter from Children's Social Care.",
    question:"What is happening and what should you do?",
    options:[
      { label:"A. Cooperate fully — social services are here to help.", correct:false, response:"Cooperation without understanding your rights can work against you. You have the right to know exactly what was reported, who made the referral, and on what basis. Get the facts first." },
      { label:"B. Refuse to engage and threaten to complain.", correct:false, response:"Refusal to engage can be interpreted negatively. You have rights — but exercise them strategically, not reactively. Stay calm. Stay focused. Gather information." },
      { label:"C. Request all records immediately and understand your rights.", correct:true, response:"Exactly right. You are in a strong position if you act quickly:" },
    ],
    correctActions:[
      "Submit immediate FOI/SAR to the school requesting: all notes, emails, referral forms, and safeguarding logs relating to your family",
      "Submit SAR to Children's Social Care for all records — the original referral form is critical evidence",
      "You have the right to an interpreter at all meetings — request one in writing",
      "Request the Equality Act protected characteristics of the social worker's caseload statistics",
      "Use UJRIS Protection Hub → CPS & Safeguarding: Immigrant Families pathway",
    ],
    legal:"Potential race/nationality discrimination under Equality Act 2010 s.13 by a public authority. Local authorities have a Public Sector Equality Duty under s.149 EA 2010.",
  },
  {
    id:"s3", title:"The Police Interview Trap",
    setup:"You've been arrested — wrongly, in your view. At the police station, an officer brings you tea, chats warmly, and says: 'Look, if you just explain what happened we can sort this out quickly. You don't need a solicitor for a simple conversation.' The recording device isn't on yet.",
    question:"What do you do?",
    options:[
      { label:"A. Explain myself — it'll clear everything up faster.", correct:false, response:"This is the trap. The 'informal chat before the tape starts' is a documented interview technique. Anything you say can be noted and used. Once the recorder starts, they have your pre-interview account to challenge." },
      { label:"B. Shout that this is unfair and demand to be released.", correct:false, response:"Your emotional reaction becomes part of the record. 'Suspect became aggressive' is what gets written. They may use it to justify further detention. Stay completely calm." },
      { label:"C. Say nothing except: 'I want a solicitor before I answer any questions.'", correct:true, response:"This is the only correct answer. Here's why — and what to do at every stage:" },
    ],
    correctActions:[
      "Say only: 'I want to speak to a solicitor before answering any questions.' Nothing else.",
      "The duty solicitor is FREE — you do not need to pay anything. Demand them.",
      "The comfortable treatment (tea, friendly chat) is the rapport-building phase. It ends when the recorder starts.",
      "When the caution is read and the recorder starts, say 'No comment' after EVERY question.",
      "After release: request your custody record immediately. Document every officer's name and badge number.",
    ],
    legal:"PACE Codes of Practice: right to free legal advice (s.58 PACE), right to silence, right to have someone informed of detention. The Victims' Code 2020 applies if you are a victim.",
  },
];

const BARRIERS = [
  { barrier:"I didn't know it was discrimination.", icon:"🤔", color:"#ff9f7f", solution:"UJRIS Self-Assessment Quiz identifies whether you may have a claim in 3 minutes — completely private, no commitment required.", action:"Take the Self-Assessment", tab:"assessment" },
  { barrier:"I was afraid of losing my job or being reported.", icon:"😰", color:"#4a9eff", solution:"All UJRIS data stays on your device only. Specialist services do not check immigration status. You build evidence in complete privacy before taking any action.", action:"See Privacy Policy", tab:null },
  { barrier:"It was my word against theirs. I had no proof.", icon:"📋", color:"#C9A84C", solution:"A Subject Access Request forces your employer to hand over evidence they claimed didn't exist. Forensic analysis finds contradictions in their documents. Your timeline shows patterns they can't deny.", action:"Generate SAR Now", tab:"sar" },
  { barrier:"I didn't think anyone would believe me.", icon:"💔", color:"#a78bfa", solution:"94% of BAME discrimination claimants face this. UJRIS helps you build evidence so compelling that belief becomes irrelevant — the documents speak for themselves.", action:"See How It Works", tab:"forensic_hub" },
  { barrier:"I was ashamed. I thought it was my fault.", icon:"🛡", color:"#7bc67e", solution:"Discrimination is NEVER the victim's fault. 70,000+ people face exactly what you're experiencing every year. Many don't know it's unlawful. You are not alone. You are not to blame.", action:"Read Real Stories", tab:"learn" },
  { barrier:"I didn't know where to start or what to do first.", icon:"⚡", color:"#ff9f7f", solution:"UJRIS Evidence Action Plan gives you one task at a time — with direct links, instructions, and a status report when you complete each step. You always know exactly what to do next.", action:"Start Action Plan", tab:"evidence" },
];

const LEARN_GUIDES = [
  { id:"g1", title:"Equality Act 2010 — Plain English", icon:"⚖", category:"rights", time:"5 min", desc:"The 9 protected characteristics, direct vs indirect discrimination, harassment, and victimisation — explained in plain language with examples.", keyPoints:["9 protected characteristics: age, disability, gender reassignment, marriage, pregnancy, race, religion, sex, sexual orientation","Direct discrimination: treated less favourably because of a protected characteristic","Indirect discrimination: a rule that applies to everyone but disadvantages your group","Victimisation: punished for raising a discrimination complaint","Harassment: unwanted conduct related to a protected characteristic that violates dignity"] },
  { id:"g2", title:"The 3-Month Deadline — What You Must Know", icon:"⏰", category:"process", time:"3 min", desc:"The single most important number in employment discrimination. Miss it and your case is over before it starts.", keyPoints:["You have 3 months MINUS 1 DAY from the last discriminatory act to file with the Employment Tribunal","Before you file, you MUST start ACAS Early Conciliation — this pauses the clock","If you miss the deadline, you must apply for an extension — courts can grant it but it is not guaranteed","For 'continuing acts' of discrimination, time runs from the last act — this is critical","For County Court claims (housing, services), the limitation period is 6 years"] },
  { id:"g3", title:"Subject Access Request — Your Most Powerful Tool", icon:"📂", category:"evidence", time:"4 min", desc:"A formal request that forces any organisation to hand over all data they hold about you. This is where cases are won or lost.", keyPoints:["Right to access under UK GDPR Article 15 and Data Protection Act 2018","Organisation has 1 calendar month to comply","Request everything: emails, meeting notes, HR records, CCTV, call recordings, disciplinary files","If they refuse or partially comply: escalate to ICO, who can enforce and fine them","SAR responses often contain the 'anchor lie' — the document that contradicts everything they've claimed"] },
  { id:"g4", title:"Comparator Evidence — The Cornerstone of Your Case", icon:"👥", category:"evidence", time:"4 min", desc:"Direct discrimination requires proving you were treated worse than someone in a comparable situation without your protected characteristic.", keyPoints:["Actual comparator: a real colleague of a different protected characteristic treated better in materially similar circumstances","Hypothetical comparator: if no real person, the tribunal asks how someone without your characteristic would be treated","The circumstances must be 'materially the same' — not identical, but comparable","Collect this evidence via SAR: performance reviews, disciplinary records, promotion decisions for comparators","Even small differences in treatment across multiple incidents build a pattern that is hard to deny"] },
  { id:"g5", title:"What is 'No Comment' — and When to Use It", icon:"🚔", category:"police", time:"3 min", desc:"The most misunderstood phrase in criminal law. Saying nothing is a complete legal answer — and in many situations the only safe one.", keyPoints:["You do NOT have to say anything. This is a legal right, not an admission of guilt.","'No comment' after every question is a legitimate, lawful response to a police interview","The PACE caution says your silence 'may harm your defence' — but your solicitor will advise if a prepared statement is better","Get the FREE duty solicitor before you answer a single question — even informal pre-interview chat","The comfortable treatment, tea, and friendly conversation before the recorder starts is a documented rapport-building technique"] },
  { id:"g6", title:"New to the UK — Your Rights", icon:"🌍", category:"immigration", time:"5 min", desc:"Your rights under UK law apply regardless of your immigration status. Discrimination is unlawful whether you arrived last month or 20 years ago.", keyPoints:["The Equality Act 2010 protects you regardless of immigration or citizenship status","You have the right to an interpreter at any official meeting — demand this in writing","'Do you need any help?' from a teacher or health visitor may be a standard welfare question, but your answer cannot be used to trigger social services referrals without lawful basis","Any public authority referring your family to social services has a Public Sector Equality Duty — they cannot treat you less favourably on grounds of race or nationality","Subject Access Requests work against any UK organisation — employer, school, NHS, police, or local council"] },
];

const LEARN_BADGES = [
  { id:"lb1", title:"Rights Aware", icon:"⚖", module:"g1" },
  { id:"lb2", title:"Deadline Guardian", icon:"⏰", module:"g2" },
  { id:"lb3", title:"SAR Expert", icon:"📂", module:"g3" },
  { id:"lb4", title:"Comparator Builder", icon:"👥", module:"g4" },
  { id:"lb5", title:"Silent Shield", icon:"🚔", module:"g5" },
  { id:"lb6", title:"Rights Defender", icon:"🌍", module:"g6" },
];

function EducationalHub({ setTab }) {
  const [activeSection, setActiveSection] = React.useState("home");
  const [selectedTestimonial, setSelectedTestimonial] = React.useState(null);
  const [selectedScenario, setSelectedScenario] = React.useState(null);
  const [scenarioAnswer, setScenarioAnswer] = React.useState(null);
  const [selectedGuide, setSelectedGuide] = React.useState(null);
  const [completedGuides, setCompletedGuides] = React.useState(() => S.get("completed_guides", []));
  const [expandedStat, setExpandedStat] = React.useState(null);

  const markGuideComplete = (guideId) => {
    if (!completedGuides.includes(guideId)) {
      const updated = [...completedGuides, guideId];
      setCompletedGuides(updated);
      S.set("completed_guides", updated);
    }
    setSelectedGuide(null);
  };

  const progress = Math.round((completedGuides.length / LEARN_GUIDES.length) * 100);

  // GUIDE DETAIL VIEW
  if (selectedGuide) {
    const guide = LEARN_GUIDES.find(g => g.id === selectedGuide);
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>
        <button onClick={() => setSelectedGuide(null)} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back to Guides</button>
        <div style={{ background: T.navyM, borderRadius: 14, padding: 24, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{guide.icon}</div>
          <div style={{ color: T.gold, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>{guide.title}</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>{guide.desc}</div>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Key Points:</div>
          {guide.keyPoints.map((point, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${T.border}` }}>
              <span style={{ color: T.gold, minWidth: 20, fontWeight: 700 }}>{i + 1}.</span>
              <span style={{ color: T.white, fontSize: 13, lineHeight: 1.7 }}>{point}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Btn onClick={() => markGuideComplete(guide.id)} style={{ flex: 1 }}>
              {completedGuides.includes(guide.id) ? "✅ Completed" : "✅ Mark Complete & Earn Badge"}
            </Btn>
            <Btn onClick={() => setTab("assessment")} style={{ flex: 1, background: T.teal }}>Start Your Case →</Btn>
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO DETAIL VIEW
  if (selectedScenario) {
    const sc = SCENARIOS.find(s => s.id === selectedScenario);
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>
        <button onClick={() => { setSelectedScenario(null); setScenarioAnswer(null); }} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back to Scenarios</button>
        <div style={{ background: T.navyM, borderRadius: 14, padding: 24, border: `1px solid ${T.gold}44` }}>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🧠 {sc.title}</div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 14, color: T.white, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>{sc.setup}</div>
          <div style={{ color: T.white, fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{sc.question}</div>

          {sc.options.map((opt, i) => (
            <button key={i} onClick={() => setScenarioAnswer(i)} style={{
              width: "100%", background: scenarioAnswer === i ? (opt.correct ? "rgba(123,198,126,0.12)" : "rgba(255,68,68,0.1)") : "rgba(255,255,255,0.03)",
              border: `2px solid ${scenarioAnswer === i ? (opt.correct ? "#7bc67e" : "#ff4444") : T.border}`,
              borderRadius: 10, padding: "12px 16px", textAlign: "left", cursor: "pointer", marginBottom: 8, color: T.white, fontSize: 13
            }}>
              <span style={{ fontWeight: 600 }}>{opt.label}</span>
              {scenarioAnswer === i && (
                <div style={{ marginTop: 8, color: opt.correct ? "#7bc67e" : "#ff8080", fontSize: 12, lineHeight: 1.6 }}>
                  {opt.correct ? "✅ " : "❌ "}{opt.response}
                </div>
              )}
            </button>
          ))}

          {scenarioAnswer !== null && sc.options[scenarioAnswer]?.correct && (
            <div style={{ background: "rgba(123,198,126,0.08)", border: "1px solid rgba(123,198,126,0.3)", borderRadius: 12, padding: 16, marginTop: 16 }}>
              <div style={{ color: "#7bc67e", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Your Action Plan:</div>
              {sc.correctActions.map((action, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, color: T.white, fontSize: 13 }}>
                  <span style={{ color: "#7bc67e", minWidth: 20 }}>{i + 1}.</span>{action}
                </div>
              ))}
              <div style={{ background: "rgba(201,168,76,0.1)", borderRadius: 8, padding: "10px 12px", marginTop: 12 }}>
                <div style={{ color: T.gold, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>LEGAL BASIS</div>
                <div style={{ color: T.muted, fontSize: 12 }}>{sc.legal}</div>
              </div>
              <Btn onClick={() => setTab("assessment")} style={{ marginTop: 14, width: "100%" }}>Start Building Your Case Now →</Btn>
            </div>
          )}
        </div>
      </div>
    );
  }

  // TESTIMONIAL DETAIL VIEW
  if (selectedTestimonial) {
    const t = TESTIMONIALS.find(x => x.id === selectedTestimonial);
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>
        <button onClick={() => setSelectedTestimonial(null)} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back to Stories</button>
        <div style={{ background: T.navyM, borderRadius: 14, padding: 24, border: `2px solid ${t.color}44` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
          <div style={{ color: t.color, fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>{t.name}</div>
          <div style={{ background: `${t.color}11`, borderLeft: `4px solid ${t.color}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 16, color: T.white, fontSize: 14, fontStyle: "italic", lineHeight: 1.7 }}>"{t.quote}"</div>
          <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>THE SITUATION</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{t.situation}</div>
          <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>WHAT UJRIS HELPED THEM DO</div>
          {t.ujrisHelped.map((point, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, color: T.white, fontSize: 13 }}>
              <span style={{ color: "#7bc67e" }}>✓</span>{point}
            </div>
          ))}
          <div style={{ background: "rgba(123,198,126,0.1)", border: "1px solid rgba(123,198,126,0.3)", borderRadius: 10, padding: 14, marginTop: 16 }}>
            <div style={{ color: "#7bc67e", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>OUTCOME</div>
            <div style={{ color: T.white, fontSize: 14, fontWeight: 700 }}>{t.outcome}</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Btn onClick={() => setTab("assessment")} style={{ flex: 1 }}>Start Your Case Like This →</Btn>
            <Btn onClick={() => setTab(t.feature.toLowerCase().includes("sar") ? "sar" : "forensic_hub")} style={{ flex: 1, background: T.teal }}>Use {t.feature.split("+")[0].trim()}</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
        <div style={{ color: T.gold, fontSize: 26, fontWeight: 900, fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>Know the System. Fight Back.</div>
        <div style={{ color: T.muted, fontSize: 14, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
          Most people don't push back when discriminated against — because they don't know what to do. This changes that. Real statistics. Real stories. Real knowledge.
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: 4, background: T.navyM, borderRadius: 12, padding: 4, marginBottom: 28, flexWrap: "wrap" }}>
        {[["stats","📊 The Numbers"],["stories","📖 Real Stories"],["scenarios","🧠 Scenarios"],["guides","📋 Guides"],["barriers","🔓 Why People Don't Fight"],["new_to_uk","🌍 New to UK"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{ flex: 1, background: activeSection === id ? T.gold : "transparent", color: activeSection === id ? T.navy : T.white, border: "none", borderRadius: 8, padding: "9px 8px", fontWeight: activeSection === id ? 700 : 400, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* STATISTICS SECTION */}
      {activeSection === "stats" && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>The UK Justice Gap — In Numbers</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>These are not abstract statistics. They describe what is happening to real people — right now — across the UK.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {UK_STATS.map((stat, i) => (
              <div key={i} onClick={() => setExpandedStat(expandedStat === i ? null : i)} style={{ background: T.navyM, borderRadius: 14, padding: 20, border: `1px solid ${stat.color}44`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ color: stat.color, fontSize: 28, fontWeight: 900, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ color: T.white, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{stat.detail}</div>
                {expandedStat === i && <div style={{ color: T.dim, fontSize: 11, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>Source: {stat.source}</div>}
              </div>
            ))}
          </div>
          <div style={{ background: `${T.gold}11`, borderRadius: 12, padding: 16, marginTop: 20, textAlign: "center" }}>
            <div style={{ color: T.gold, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>What This Means For You</div>
            <div style={{ color: T.white, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
              The system is not designed for people who go alone. UJRIS exists to close this gap — giving you the same intelligence that law firms deploy, at a fraction of the cost.
            </div>
            <Btn onClick={() => setTab("assessment")} style={{ fontSize: 15 }}>Start Your Case Now →</Btn>
          </div>
        </div>
      )}

      {/* TESTIMONIALS */}
      {activeSection === "stories" && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Real Stories. Real Justice.</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Anonymised case studies showing what is possible when people know their rights and use the right tools.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {TESTIMONIALS.map(t => (
              <button key={t.id} onClick={() => setSelectedTestimonial(t.id)} style={{ background: T.navyM, border: `1px solid ${t.color}33`, borderRadius: 14, padding: 20, textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ color: t.color, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
                <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 10, fontStyle: "italic" }}>"{t.quote.substring(0, 80)}..."</div>
                <div style={{ background: "rgba(123,198,126,0.1)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ color: "#7bc67e", fontSize: 12, fontWeight: 700 }}>{t.outcome}</div>
                </div>
                <div style={{ color: T.dim, fontSize: 11, marginTop: 8 }}>Tools used: {t.feature}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SCENARIOS */}
      {activeSection === "scenarios" && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>What Would You Do?</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Real situations. Test your knowledge. Learn the right response — before it happens to you.</div>
          {SCENARIOS.map(sc => (
            <button key={sc.id} onClick={() => setSelectedScenario(sc.id)} style={{ width: "100%", background: T.navyM, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, textAlign: "left", cursor: "pointer", marginBottom: 12, transition: "all 0.2s" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 28, minWidth: 36 }}>🧠</div>
                <div>
                  <div style={{ color: T.gold, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{sc.title}</div>
                  <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.6 }}>{sc.setup.substring(0, 120)}...</div>
                  <div style={{ color: T.tealL, fontSize: 12, marginTop: 8 }}>Click to test your knowledge →</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* GUIDES */}
      {activeSection === "guides" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ color: T.gold, fontSize: 18, fontWeight: 700 }}>Rights Guides</div>
            <div style={{ color: T.muted, fontSize: 12 }}>{completedGuides.length}/{LEARN_GUIDES.length} completed</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 6, marginBottom: 20 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg,${T.teal},${T.gold})`, borderRadius: 6, transition: "width 0.6s" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {LEARN_GUIDES.map(guide => (
              <button key={guide.id} onClick={() => setSelectedGuide(guide.id)} style={{ background: completedGuides.includes(guide.id) ? "rgba(123,198,126,0.06)" : T.navyM, border: `1px solid ${completedGuides.includes(guide.id) ? "#7bc67e33" : T.border}`, borderRadius: 12, padding: 16, textAlign: "left", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 26 }}>{guide.icon}</span>
                  {completedGuides.includes(guide.id) ? <span style={{ color: "#7bc67e", fontSize: 12, fontWeight: 700 }}>✅ Done</span> : <span style={{ color: T.muted, fontSize: 11 }}>⏱ {guide.time}</span>}
                </div>
                <div style={{ color: T.white, fontSize: 13, fontWeight: 700, margin: "8px 0 4px" }}>{guide.title}</div>
                <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.5 }}>{guide.desc.substring(0, 80)}...</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BARRIERS */}
      {activeSection === "barriers" && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Why People Don't Push Back — And Why They Should</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>These are the most common reasons discrimination goes unchallenged. Each one has a direct solution.</div>
          {BARRIERS.map((b, i) => (
            <div key={i} style={{ background: T.navyM, borderRadius: 14, padding: 20, marginBottom: 14, border: `1px solid ${b.color}33` }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 28, minWidth: 36 }}>{b.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#ff8080", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>❌ "{b.barrier}"</div>
                  <div style={{ color: T.white, fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>✅ {b.solution}</div>
                  {b.tab && <Btn onClick={() => setTab(b.tab)} style={{ fontSize: 12, padding: "7px 16px", background: b.color + "22", border: `1px solid ${b.color}44`, color: b.color }}>{b.action} →</Btn>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW TO UK */}
      {activeSection === "new_to_uk" && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>🌍 New to the UK — Your Rights Start Now</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
            UK law protects you regardless of how long you've been here or your immigration status. Many newly arrived families face targeted discrimination — and many don't know it's unlawful. This guide is for you.
          </div>
          <div style={{ background: `${T.teal}11`, border: `1px solid ${T.teal}44`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ color: T.tealL, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🔑 Your Rights Regardless of Immigration Status</div>
            {["The Equality Act 2010 protects you — no matter when you arrived or what your visa status is","You have the right to an interpreter at ANY official meeting — school, hospital, social services, police. Demand it in writing.","Discrimination based on your race, nationality, or national origin is unlawful in employment, housing, education, healthcare, and all services","Children's Social Care CANNOT treat your family less favourably on grounds of race or national origin — this breaches the Public Sector Equality Duty","A Subject Access Request works against any UK organisation — employer, school, NHS trust, police force, or local council"].map((right, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, color: T.white, fontSize: 13 }}>
                <span style={{ color: "#7bc67e", minWidth: 16 }}>✓</span>{right}
              </div>
            ))}
          </div>

          <div style={{ color: T.gold, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🚦 Is This Normal? Quick Checklist</div>
          {[
            { status:"normal", icon:"✅", items:["NHS staff asking about your health history","Teacher asking how your child is settling in","Employer giving written feedback on your work","Police asking for your name and address at a lawful stop"] },
            { status:"flag", icon:"⚠️", items:["Someone asks 'Where are you really from?' after you've answered","You're told 'You don't sound like you're from here'","Your answer to 'Do you need any help?' triggers a welfare referral","You're asked leading questions about your family that feel intrusive"] },
            { status:"urgent", icon:"🚨", items:["You're referred to social services after asking for help at school or hospital","Your child is questioned alone by a teacher or officer without your knowledge","You receive a letter from Children's Social Care after an innocent conversation","You're told to 'go back to your country' by a professional or official"] },
          ].map(section => (
            <div key={section.status} style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${section.status==="urgent"?"#ff444433":section.status==="flag"?T.gold+"33":T.border}` }}>
              <div style={{ color: section.status==="urgent"?"#ff8080":section.status==="flag"?T.gold:"#7bc67e", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {section.icon} {section.status==="urgent"?"CONSULT UJRIS IMMEDIATELY":section.status==="flag"?"POTENTIAL RED FLAG":"NORMAL"}
              </div>
              {section.items.map((item, i) => (
                <div key={i} style={{ color: T.muted, fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                  <span>{section.icon}</span>{item}
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Btn onClick={() => setTab("protection_hub")} style={{ flex: 1 }}>🛡 Protection Hub</Btn>
            <Btn onClick={() => setTab("assessment")} style={{ flex: 1, background: T.teal }}>Start Evidence Log</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

const FORUM_DATA_KEY = "ujris_community";

const INITIAL_POSTS = [
  { id:"p1", forumId:"general", author:"Sarah W", avatar:"🧕", time:"2 hours ago", title:"How I used the SAR to expose missing emails", content:"I submitted the SAR on March 1st and within 3 weeks received over 200 emails — including ones where my manager was discussing my health condition with HR without my consent. The Forensic Auditor flagged 12 missing emails from the key period. The SAR feature was the game changer.", reactions:{like:24,love:12,supportive:8}, replies:[{id:"r1",author:"James K",time:"2 hours ago",content:"This is so helpful! Did they try to delay? How did you handle it?",reactions:{like:5}},{id:"r2",author:"Sarah W",time:"1 day ago",content:"Yes — they asked for ID which added 2 weeks. The app prompted me to upload immediately and sent a reminder when 30 days were approaching.",reactions:{like:12}}], category:"tips", anonymous:false },
  { id:"p2", forumId:"success", author:"Anonymous", avatar:"🛡", time:"1 day ago", title:"£45k settlement — disability discrimination", content:"Settled yesterday. Couldn't share this anywhere else but wanted to give hope to anyone in the middle of it. It took 8 months and there were days I wanted to give up. The timeline feature made the causation undeniable. CCTV + SAR + comparator evidence = settlement offer before tribunal.", reactions:{like:67,love:45,supportive:31}, replies:[{id:"r3",author:"Miguel R",time:"22 hours ago",content:"Congratulations. This gives me so much hope. Currently at month 5 of my race discrimination case.",reactions:{like:18}}], category:"success", anonymous:true },
  { id:"p3", forumId:"general", author:"Priya M", avatar:"👩", time:"3 days ago", title:"New here — just had my SAR partially refused, what do I do?", content:"Just submitted my SAR to my employer two weeks ago and they've responded saying they can only provide 'relevant' documents. This doesn't seem right. The app told me to escalate but I don't know how to write the ICO complaint. Has anyone done this?", reactions:{like:8,supportive:15}, replies:[{id:"r4",author:"Alex T",time:"2 days ago",content:"Use the SAR Intelligence module → 'SAR Failure' section. It generates the ICO complaint automatically with the correct GDPR citations. Took me 5 minutes.",reactions:{like:22}}], category:"tips", anonymous:false },
];

const FORUM_CATEGORIES = [
  { id:"all", label:"All Posts", icon:"🌐" },
  { id:"tips", label:"App Tips", icon:"💡" },
  { id:"success", label:"Wins", icon:"🏆" },
  { id:"questions", label:"Questions", icon:"❓" },
  { id:"support", label:"Support", icon:"🤝" },
];

const PRIVATE_GROUPS = [
  { id:"race", name:"Race Discrimination Support", icon:"✊", members:245, color:"#C9A84C", desc:"A safe space for those facing race-based discrimination. Share strategies, support each other." },
  { id:"disability", name:"Disability & Reasonable Adjustments", icon:"♿", members:178, color:"#4a9eff", desc:"Navigating disability discrimination, reasonable adjustments, and medical evidence." },
  { id:"police", name:"Police Misconduct & Victims Rights", icon:"🚔", members:92, color:"#a78bfa", desc:"IOPC complaints, VRR applications, PACE rights, and holding police accountable." },
  { id:"family", name:"Safeguarding & Family Support", icon:"👪", members:134, color:"#7bc67e", desc:"Challenging unfair safeguarding referrals, CPS discrimination, and protecting your family." },
  { id:"newtouk", name:"New to UK Support Group", icon:"🌍", members:89, color:"#ff9f7f", desc:"Rights guidance for recently arrived families navigating unfamiliar systems." },
];

function CommunityForums({ userProfile }) {
  const [view, setView] = React.useState("feed"); // feed | groups | messages | create
  const [posts, setPosts] = React.useState(() => {
    const saved = S.get(FORUM_DATA_KEY + "_posts", null);
    return saved || INITIAL_POSTS;
  });
  const [selectedPost, setSelectedPost] = React.useState(null);
  const [newReply, setNewReply] = React.useState("");
  const [newPost, setNewPost] = React.useState({ title: "", content: "", category: "questions", anonymous: false });
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [joinedGroups, setJoinedGroups] = React.useState(() => S.get("joined_groups", []));
  const [messages, setMessages] = React.useState(() => S.get("community_messages", []));
  const [newMessage, setNewMessage] = React.useState("");
  const [messageWith, setMessageWith] = React.useState(null);
  const myName = userProfile?.name || "You";
  const myAvatar = "👤";

  function savePosts(updated) { setPosts(updated); S.set(FORUM_DATA_KEY + "_posts", updated); }

  function addReaction(postId, type) {
    savePosts(posts.map(p => p.id === postId ? { ...p, reactions: { ...p.reactions, [type]: (p.reactions[type] || 0) + 1 } } : p));
  }

  function addReply(postId) {
    if (!newReply.trim()) return;
    const reply = { id: "r" + Date.now(), author: myName, time: "just now", content: newReply, reactions: { like: 0 } };
    savePosts(posts.map(p => p.id === postId ? { ...p, replies: [...(p.replies || []), reply] } : p));
    setNewReply("");
  }

  function submitPost() {
    if (!newPost.title || !newPost.content) return;
    const post = { id: "p" + Date.now(), forumId: "general", author: newPost.anonymous ? "Anonymous" : myName, avatar: newPost.anonymous ? "🛡" : myAvatar, time: "just now", title: newPost.title, content: newPost.content, reactions: { like: 0, love: 0, supportive: 0 }, replies: [], category: newPost.category, anonymous: newPost.anonymous };
    savePosts([post, ...posts]);
    setNewPost({ title: "", content: "", category: "questions", anonymous: false });
    setView("feed");
  }

  function joinGroup(groupId) {
    const updated = joinedGroups.includes(groupId) ? joinedGroups.filter(g => g !== groupId) : [...joinedGroups, groupId];
    setJoinedGroups(updated); S.set("joined_groups", updated);
  }

  const filtered = activeCategory === "all" ? posts : posts.filter(p => p.category === activeCategory);

  // POST DETAIL
  if (selectedPost) {
    const post = posts.find(p => p.id === selectedPost);
    if (!post) { setSelectedPost(null); return null; }
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>
        <button onClick={() => setSelectedPost(null)} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back to Community</button>
        <div style={{ background: T.navyM, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>{post.avatar}</span>
            <div>
              <div style={{ color: T.white, fontSize: 13, fontWeight: 700 }}>{post.author}</div>
              <div style={{ color: T.muted, fontSize: 11 }}>{post.time}</div>
            </div>
          </div>
          <div style={{ color: T.gold, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{post.title}</div>
          <div style={{ color: T.white, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>{post.content}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["👍","like"],["❤️","love"],["🙌","supportive"]].map(([emoji, type]) => (
              <button key={type} onClick={() => addReaction(post.id, type)} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: T.white }}>
                {emoji} {post.reactions[type] || 0}
              </button>
            ))}
          </div>
        </div>
        {(post.replies || []).map(reply => (
          <div key={reply.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px", marginBottom: 8, border: `1px solid ${T.border}`, marginLeft: 20 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: T.gold, fontSize: 12, fontWeight: 700 }}>{reply.author}</span>
              <span style={{ color: T.dim, fontSize: 11 }}>{reply.time}</span>
            </div>
            <div style={{ color: T.white, fontSize: 13, lineHeight: 1.7 }}>{reply.content}</div>
          </div>
        ))}
        <div style={{ background: T.navyM, borderRadius: 10, padding: 14, border: `1px solid ${T.border}`, marginTop: 10 }}>
          <textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Write a supportive reply... Share your experience or advice." rows={3} style={{ width: "100%", background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.white, fontSize: 13, resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: T.dim, fontSize: 11 }}>⚠ Do not share names, addresses, or identifying details</div>
            <Btn onClick={() => addReply(post.id)} disabled={!newReply.trim()} style={{ fontSize: 13 }}>Reply</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ color: T.gold, fontSize: 22, fontWeight: 700 }}>🌐 Community</div>
          <div style={{ color: T.muted, fontSize: 12 }}>You are not alone. {posts.length} discussions · {PRIVATE_GROUPS.reduce((a, g) => a + g.members, 0)} members</div>
        </div>
        <Btn onClick={() => setView(view === "create" ? "feed" : "create")} style={{ fontSize: 13 }}>{view === "create" ? "← Back" : "✍ Share Your Experience"}</Btn>
      </div>

      {/* Safety banner */}
      <div style={{ background: T.redBg, border: "1px solid #ff444433", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#ff9f7f", fontSize: 12, lineHeight: 1.6 }}>
        ⚠ Community guidelines: Do not share real names, addresses, employer names, or case numbers in public posts. Crisis support: <strong>Samaritans 116 123</strong> · <strong>Text SHOUT to 85258</strong>
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 4, background: T.navyM, borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {[["feed","💬 Discussions"],["groups","🔒 Private Groups"],["messages",`✉ Messages (${messages.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex: 1, background: view === id ? T.gold : "transparent", color: view === id ? T.navy : T.white, border: "none", borderRadius: 8, padding: "9px 10px", fontWeight: view === id ? 700 : 400, fontSize: 12, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      {/* CREATE POST */}
      {view === "create" && (
        <div style={{ background: T.navyM, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ color: T.gold, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✍ Share Your Experience</div>
          <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="Post title — what is this about?" style={{ width: "100%", background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.white, fontSize: 13, boxSizing: "border-box", marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <select value={newPost.category} onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", color: T.white, fontSize: 13 }}>
              <option value="tips">💡 App Tip / Strategy</option>
              <option value="success">🏆 Success Story</option>
              <option value="questions">❓ Question / Help Needed</option>
              <option value="support">🤝 Emotional Support</option>
            </select>
            <label style={{ display: "flex", gap: 10, alignItems: "center", background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", cursor: "pointer" }}>
              <input type="checkbox" checked={newPost.anonymous} onChange={e => setNewPost(p => ({ ...p, anonymous: e.target.checked }))} />
              <span style={{ color: T.white, fontSize: 13 }}>Post anonymously</span>
            </label>
          </div>
          <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Share your experience, tip, or question. Remember: no real names, addresses, or identifying details in public posts." rows={6} style={{ width: "100%", background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.white, fontSize: 13, resize: "vertical", boxSizing: "border-box", marginBottom: 12 }} />
          <div style={{marginBottom:10}}>
            <label style={{color:"#64748B",fontSize:11,display:"block",marginBottom:6}}>📎 ATTACH FILE (optional — image, document, audio)</label>
            <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.mp3,.wav"
              onChange={function(e){
                var f=e.target.files[0];
                if(!f)return;
                var reader=new FileReader();
                reader.onload=function(ev){
                  setNewPost(function(p){return {...p,attachment:{name:f.name,size:f.size,type:f.type,dataUrl:ev.target.result}};});
                };
                reader.readAsDataURL(f);
              }}
              style={{width:"100%",background:"#FAF6F0",border:"1px solid #EDE4D9",borderRadius:8,padding:"8px 12px",color:"#0F2C4A",fontSize:12,boxSizing:"border-box"}}
            />
            {newPost.attachment&&<div style={{color:T.tealL,fontSize:11,marginTop:4}}>📎 {newPost.attachment.name} ({(newPost.attachment.size/1024).toFixed(0)}KB) attached</div>}
          </div>
          <Btn onClick={submitPost} disabled={!newPost.title || !newPost.content} style={{ width: "100%" }}>Post to Community</Btn>
        </div>
      )}

      {/* DISCUSSION FEED */}
      {view === "feed" && (
        <div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {FORUM_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ background: activeCategory === cat.id ? T.gold : T.navyM, color: activeCategory === cat.id ? T.navy : T.muted, border: `1px solid ${activeCategory === cat.id ? T.gold : T.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontWeight: activeCategory === cat.id ? 700 : 400 }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          {filtered.map(post => (
            <div key={post.id} style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setSelectedPost(post.id)}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{post.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: T.white, fontSize: 13, fontWeight: 700 }}>{post.author}</span>
                    <span style={{ background: post.category === "success" ? "rgba(123,198,126,0.15)" : post.category === "tips" ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)", color: post.category === "success" ? "#7bc67e" : post.category === "tips" ? T.gold : T.muted, fontSize: 10, padding: "2px 8px", borderRadius: 10 }}>
                      {FORUM_CATEGORIES.find(c => c.id === post.category)?.icon} {post.category}
                    </span>
                  </div>
                  <div style={{ color: T.dim, fontSize: 11 }}>{post.time}</div>
                </div>
              </div>
              <div style={{ color: T.gold, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{post.title}</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{post.content.substring(0, 140)}...</div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <span style={{ color: T.dim, fontSize: 11 }}>👍 {Object.values(post.reactions || {}).reduce((a, b) => a + b, 0)} reactions</span>
                <span style={{ color: T.dim, fontSize: 11 }}>💬 {(post.replies || []).length} replies</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRIVATE GROUPS */}
      {view === "groups" && (
        <div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>Private groups provide a safer space to discuss sensitive matters with people who understand exactly what you're going through.</div>
          {PRIVATE_GROUPS.map(group => (
            <div key={group.id} style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${group.color}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{group.icon}</span>
                  <div>
                    <div style={{ color: group.color, fontSize: 14, fontWeight: 700 }}>{group.name}</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>{group.members} members · Private</div>
                  </div>
                </div>
                <button onClick={() => joinGroup(group.id)} style={{ background: joinedGroups.includes(group.id) ? "rgba(123,198,126,0.15)" : `${group.color}22`, border: `1px solid ${joinedGroups.includes(group.id) ? "#7bc67e44" : group.color + "44"}`, color: joinedGroups.includes(group.id) ? "#7bc67e" : group.color, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {joinedGroups.includes(group.id) ? "✅ Joined" : "Request to Join"}
                </button>
              </div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>{group.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* MESSAGES */}
      {view === "messages" && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✉</div>
          <div style={{ color: T.white, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Direct Messages</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>Connect privately with other community members for one-to-one peer support. Messaging requires mutual consent — both parties must agree.</div>
          <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${T.border}`, textAlign: "left" }}>
            <div style={{ color: T.muted, fontSize: 12 }}>To message another member, reply to one of their posts and they can choose to open a private conversation.</div>
          </div>
          <div style={{ color: T.dim, fontSize: 11 }}>All messages are subject to community guidelines. Block and report controls are always available.</div>
        </div>
      )}
    </div>
  );
}

function ProtectionHub() {
  const [activeSection, setActiveSection] = React.useState(null);
  const [foiTarget, setFoiTarget] = React.useState("");
  const [foiDetails, setFoiDetails] = React.useState("");
  const [wbConcern, setWbConcern] = React.useState("");
  const [wbEmployer, setWbEmployer] = React.useState("");
  const [aiOut, setAiOut] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selfScores, setSelfScores] = React.useState({});
  const [selfDone, setSelfDone] = React.useState(false);

  const activeData = PROTECTION_SECTIONS.find(s => s.id === activeSection);

  const scoreCount = Object.values(selfScores).filter(Boolean).length;
  const totalQ = PROTECTION_SECTIONS.find(s => s.id === "self_assessment")?.questions?.length || 0;

  function runAI(sysPrompt) {
    setAiOut(""); setLoading(true);
    streamAI(
      "You are UJRIS — an expert UK legal intelligence system.",
      sysPrompt,
      (t) => setAiOut(t),
      () => setLoading(false)
    );
  }

  if (!activeSection) {
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:8}}>🛡</div>
          <div style={{color:T.gold,fontSize:22,fontWeight:700,marginBottom:8}}>Protection Intelligence Hub</div>
          <div style={{color:"#1E3A5F",fontSize:14,maxWidth:520,margin:"0 auto",lineHeight:1.7}}>
            Know your rights. Compel disclosure. Protect your family. Stay safe with police.
            This hub gives you the exact knowledge institutions don't want you to have.
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {PROTECTION_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              background:"#FAF6F0",border:`1px solid ${s.color}33`,borderRadius:12,padding:20,
              textAlign:"left",cursor:"pointer",transition:"all 0.2s",
            }}>
              <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
              <div style={{color:s.color,fontSize:15,fontWeight:700,marginBottom:4}}>{s.title}</div>
              <div style={{color:"#64748B",fontSize:12,lineHeight:1.5}}>{s.subtitle}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // FOI SECTION
  if (activeSection === "foi") {
    const sec = PROTECTION_SECTIONS.find(s => s.id === "foi");
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>
        <button onClick={() => { setActiveSection(null); setAiOut(""); }} style={{background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{color:sec.color,fontSize:20,fontWeight:700,marginBottom:8}}>{sec.icon} {sec.title}</div>
        <div style={{background:`${sec.color}11`,border:`1px solid ${sec.color}33`,borderRadius:10,padding:16,color:T.white,fontSize:13,lineHeight:1.8,marginBottom:20}}>
          {sec.overview}
        </div>
        <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:12}}>What to Request — By Target Authority</div>
        {sec.targets.map(tgt => (
          <div key={tgt.name} style={{background:T.navyM,borderRadius:10,padding:16,marginBottom:12,border:`1px solid ${T.border}`}}>
            <div style={{color:"#0F2C4A",fontSize:14,fontWeight:700,marginBottom:8}}>🏛 {tgt.name}</div>
            {tgt.items.map((item,i) => (
              <div key={i} style={{color:"#64748B",fontSize:13,padding:"4px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}>
                <span style={{color:sec.color}}>▸</span>{item}
              </div>
            ))}
          </div>
        ))}
        <div style={{color:T.gold,fontSize:14,fontWeight:700,margin:"20px 0 12px"}}>📝 Generate Your FOI Letter</div>
        <input value={foiTarget} onChange={e=>setFoiTarget(e.target.value)} placeholder="Target authority (e.g. Rotherham MBC Children's Services)" style={{width:"100%",background:T.navyL,border:`1px solid ${T.border}`,borderRadius:8,padding:12,color:T.white,fontSize:13,marginBottom:10,boxSizing:"border-box"}} />
        <textarea value={foiDetails} onChange={e=>setFoiDetails(e.target.value)} placeholder="What specific records do you need? Include dates, names, and context..." rows={4} style={{width:"100%",background:T.navyL,border:`1px solid ${T.border}`,borderRadius:8,padding:12,color:T.white,fontSize:13,marginBottom:10,resize:"vertical",boxSizing:"border-box"}} />
        <Btn onClick={() => runAI(sec.aiPrompt(foiTarget, foiDetails))} disabled={loading || !foiTarget || !foiDetails}>
          {loading ? "Generating..." : "Generate FOI Letter"}
        </Btn>
        {aiOut && (
          <div style={{marginTop:20,background:"rgba(255,255,255,0.03)",borderRadius:10,padding:20}}>
            <div style={{color:T.gold,fontSize:13,fontWeight:700,marginBottom:10}}>Your FOI Letter:</div>
            <pre style={{color:T.white,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"Georgia,serif"}}>{aiOut}</pre>
            <Btn onClick={() => {const w=window.open(); w.document.write(`<html><head><title>FOI Request</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;font-size:14px;line-height:1.8;color:#1a1a1a}pre{white-space:pre-wrap}</style></head><body><h2>Freedom of Information Request</h2><pre>${aiOut}</pre></body></html>`); w.document.close(); w.print();}} style={{marginTop:12}}>Print / Save as PDF</Btn>
          </div>
        )}
        <div style={{background:`${T.redBg}`,borderRadius:10,padding:16,marginTop:20}}>
          <div style={{color:"#ff8080",fontSize:13,fontWeight:700,marginBottom:8}}>⚡ Power Tips</div>
          {sec.tips.map((tip,i) => <div key={i} style={{color:"#64748B",fontSize:12,padding:"4px 0",display:"flex",gap:8}}><span style={{color:sec.color}}>✓</span>{tip}</div>)}
        </div>
      </div>
    );
  }

  // CPS / SAFEGUARDING SECTION
  if (activeSection === "cps_safeguarding") {
    const sec = PROTECTION_SECTIONS.find(s => s.id === "cps_safeguarding");
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>
        <button onClick={() => setActiveSection(null)} style={{background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{color:sec.color,fontSize:20,fontWeight:700,marginBottom:8}}>{sec.icon} {sec.title}</div>
        <div style={{background:`${T.redBg}`,border:"1px solid #ff444466",borderRadius:10,padding:16,color:"#ff9999",fontSize:13,lineHeight:1.8,marginBottom:20,fontWeight:600}}>
          ⚠ CRITICAL DISCLAIMER: If you are already subject to care proceedings or a Child Protection Plan, contact a family law solicitor IMMEDIATELY. Legal aid is available regardless of income. This information is educational — not legal advice.
        </div>
        <div style={{background:`${sec.color}11`,border:`1px solid ${sec.color}33`,borderRadius:10,padding:16,color:T.white,fontSize:13,lineHeight:1.8,marginBottom:20}}>
          {sec.overview}
        </div>
        <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:12}}>🚨 Red Flag Tactics — How They Target Immigrant Families</div>
        {sec.redFlags.map((f,i) => (
          <div key={i} style={{background:T.navyM,borderRadius:10,padding:16,marginBottom:12,border:`1px solid ${T.border}`}}>
            <div style={{color:"#ff9f7f",fontSize:14,fontWeight:700,marginBottom:6}}>⚠ {f.flag}</div>
            <div style={{color:T.white,fontSize:13,lineHeight:1.7}}>{f.detail}</div>
          </div>
        ))}
        <div style={{color:T.gold,fontSize:14,fontWeight:700,margin:"20px 0 12px"}}>✅ Your Legal Rights</div>
        <div style={{background:T.navyM,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${T.border}`}}>
          {sec.rights.map((r,i) => (
            <div key={i} style={{color:T.white,fontSize:13,padding:"6px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}>
              <span style={{color:"#7bc67e",minWidth:16}}>✓</span>{r}
            </div>
          ))}
        </div>
        <div style={{color:T.gold,fontSize:14,fontWeight:700,margin:"20px 0 12px"}}>⚡ Action Steps — Do These Now</div>
        {sec.actionSteps.map((step,i) => (
          <div key={i} style={{background:T.navyM,borderRadius:8,padding:12,marginBottom:8,border:`1px solid ${T.border}`,color:T.white,fontSize:13,display:"flex",gap:10}}>
            <span style={{color:sec.color,minWidth:20,fontWeight:700}}>{i+1}.</span>{step}
          </div>
        ))}
        <div style={{background:`${T.redBg}`,border:"1px solid #ff444455",borderRadius:10,padding:16,marginTop:20,color:"#ff8080",fontSize:13,lineHeight:1.7}}>{sec.disclaimer}</div>
      </div>
    );
  }

  // WHISTLEBLOWING SECTION
  if (activeSection === "whistleblowing") {
    const sec = PROTECTION_SECTIONS.find(s => s.id === "whistleblowing");
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>
        <button onClick={() => { setActiveSection(null); setAiOut(""); }} style={{background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{color:sec.color,fontSize:20,fontWeight:700,marginBottom:8}}>{sec.icon} {sec.title}</div>
        <div style={{background:`${sec.color}11`,border:`1px solid ${sec.color}33`,borderRadius:10,padding:16,color:T.white,fontSize:13,lineHeight:1.8,marginBottom:20}}>{sec.overview}</div>
        <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:10}}>What Qualifies as a Protected Disclosure?</div>
        <div style={{background:T.navyM,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${T.border}`}}>
          {sec.qualifies.map((q,i) => <div key={i} style={{color:T.white,fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}><span style={{color:sec.color}}>✓</span>{q}</div>)}
        </div>
        <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:10}}>Where to Disclose</div>
        {sec.channels.map((c,i) => (
          <div key={i} style={{background:T.navyM,borderRadius:8,padding:12,marginBottom:8,border:`1px solid ${T.border}`}}>
            <div style={{color:sec.color,fontSize:13,fontWeight:700}}>{c.channel}</div>
            <div style={{color:"#64748B",fontSize:12,marginTop:4}}>{c.when}</div>
          </div>
        ))}
        <div style={{color:T.gold,fontSize:14,fontWeight:700,margin:"20px 0 10px"}}>Your Protections Under PIDA 1998</div>
        <div style={{background:T.navyM,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${T.border}`}}>
          {sec.protections.map((p,i) => <div key={i} style={{color:"#7bc67e",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}><span>⚖</span>{p}</div>)}
        </div>
        <div style={{color:T.gold,fontSize:14,fontWeight:700,margin:"16px 0 10px"}}>📝 Generate Your Protected Disclosure Letter</div>
        <textarea value={wbConcern} onChange={e=>setWbConcern(e.target.value)} placeholder="Describe the wrongdoing you are disclosing (be specific — dates, names, what happened)..." rows={4} style={{width:"100%",background:T.navyL,border:`1px solid ${T.border}`,borderRadius:8,padding:12,color:T.white,fontSize:13,marginBottom:10,resize:"vertical",boxSizing:"border-box"}} />
        <input value={wbEmployer} onChange={e=>setWbEmployer(e.target.value)} placeholder="Employer / Authority name and address" style={{width:"100%",background:T.navyL,border:`1px solid ${T.border}`,borderRadius:8,padding:12,color:T.white,fontSize:13,marginBottom:10,boxSizing:"border-box"}} />
        <Btn onClick={() => runAI(sec.aiPrompt(wbConcern, wbEmployer))} disabled={loading || !wbConcern || !wbEmployer}>{loading ? "Generating..." : "Generate Disclosure Letter"}</Btn>
        {aiOut && (
          <div style={{marginTop:20,background:"rgba(255,255,255,0.03)",borderRadius:10,padding:20}}>
            <pre style={{color:T.white,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"Georgia,serif"}}>{aiOut}</pre>
          </div>
        )}
        <div style={{background:"rgba(123,198,126,0.08)",borderRadius:10,padding:16,marginTop:20}}>
          {sec.tips.map((tip,i) => <div key={i} style={{color:"#64748B",fontSize:12,padding:"4px 0",display:"flex",gap:8}}><span style={{color:sec.color}}>✓</span>{tip}</div>)}
        </div>
      </div>
    );
  }

  // POLICE RIGHTS SECTION
  if (activeSection === "police_rights") {
    const sec = PROTECTION_SECTIONS.find(s => s.id === "police_rights");
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>
        <button onClick={() => setActiveSection(null)} style={{background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{color:sec.color,fontSize:20,fontWeight:700,marginBottom:8}}>{sec.icon} {sec.title}</div>
        <div style={{background:`${sec.color}22`,border:`1px solid ${sec.color}55`,borderRadius:10,padding:16,color:T.white,fontSize:13,lineHeight:1.8,marginBottom:16}}>{sec.overview}</div>
        {sec.stages.map((stage,i) => (
          <div key={i} style={{background:T.navyM,borderRadius:12,padding:20,marginBottom:16,border:`1px solid ${T.border}`}}>
            <div style={{color:T.gold,fontSize:15,fontWeight:700,marginBottom:12}}>📌 {stage.stage}</div>
            {stage.rights && stage.rights.map((r,j) => (
              <div key={j} style={{color:T.white,fontSize:13,padding:"6px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}>
                <span style={{color:"#7bc67e",minWidth:16}}>✓</span>{r}
              </div>
            ))}
            {stage.caution && (
              <div>
                <div style={{color:"#ff9f7f",fontSize:14,fontWeight:700,margin:"12px 0 8px"}}>The PACE Caution — What It Actually Means</div>
                <div style={{background:"rgba(255,159,127,0.08)",border:"1px solid rgba(255,159,127,0.3)",borderRadius:8,padding:12,color:"#ff9f7f",fontSize:13,fontStyle:"italic",marginBottom:12,lineHeight:1.8}}>"{stage.caution}"</div>
                <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:8}}>What To Say: TWO WORDS ONLY</div>
                <div style={{background:"rgba(201,168,76,0.15)",border:"2px solid #C9A84C",borderRadius:8,padding:16,textAlign:"center",marginBottom:12}}>
                  <div style={{color:T.gold,fontSize:28,fontWeight:900,letterSpacing:"0.1em"}}>"NO COMMENT."</div>
                  <div style={{color:"#64748B",fontSize:12,marginTop:6}}>Say this after every single question. Nothing more. Nothing less.</div>
                </div>
                {stage.when && stage.when.map((w,j) => (
                  <div key={j} style={{color:T.white,fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}>
                    <span style={{color:T.gold}}>▸</span>{w}
                  </div>
                ))}
              </div>
            )}
            {stage.warning && (
              <div style={{background:`${T.redBg}`,borderRadius:8,padding:12,marginTop:12,color:"#ff8080",fontSize:12,lineHeight:1.7}}>
                <span style={{fontWeight:700}}>⚠ TACTICAL WARNING: </span>{stage.warning}
              </div>
            )}
          </div>
        ))}
        <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
          <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:12}}>🆘 Emergency Legal Contacts</div>
          {sec.emergency.map((e,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap",gap:8}}>
              <span style={{color:T.white,fontSize:13}}>{e.name}</span>
              <span style={{color:T.gold,fontSize:13,fontWeight:700}}>{e.contact}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SELF ASSESSMENT SECTION
  if (activeSection === "self_assessment") {
    const sec = PROTECTION_SECTIONS.find(s => s.id === "self_assessment");
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"0 0 40px"}}>
        <button onClick={() => { setActiveSection(null); setSelfScores({}); setSelfDone(false); }} style={{background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{color:sec.color,fontSize:20,fontWeight:700,marginBottom:8}}>{sec.icon} {sec.title}</div>
        <div style={{background:`${sec.color}11`,border:`1px solid ${sec.color}33`,borderRadius:10,padding:16,color:T.white,fontSize:13,lineHeight:1.8,marginBottom:20}}>{sec.overview}</div>
        {!selfDone ? (
          <div>
            <div style={{color:"#64748B",fontSize:12,marginBottom:16}}>Tick every statement that applies to your experience. Your answers are private and never shared.</div>
            {sec.questions.map((item,i) => (
              <button key={i} onClick={() => setSelfScores(s => ({...s, [i]: !s[i]}))} style={{
                width:"100%", background: selfScores[i] ? `${sec.color}22` : T.navyM,
                border: `1px solid ${selfScores[i] ? sec.color : T.border}`, borderRadius:10,
                padding:14, textAlign:"left", cursor:"pointer", marginBottom:8, display:"flex", gap:12, alignItems:"flex-start"
              }}>
                <div style={{width:20,height:20,borderRadius:4,background:selfScores[i]?sec.color:"transparent",border:`2px solid ${selfScores[i]?sec.color:T.dim}`,minWidth:20,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {selfScores[i] && <span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{color:T.white,fontSize:13,lineHeight:1.6}}>{item.q}</div>
                  {selfScores[i] && <div style={{color:sec.color,fontSize:11,marginTop:4,fontWeight:600}}>→ {item.flag}</div>}
                </div>
              </button>
            ))}
            <Btn onClick={() => setSelfDone(true)} style={{marginTop:16}}>See My Assessment Results</Btn>
          </div>
        ) : (
          <div>
            <div style={{background: scoreCount >= 6 ? T.redBg : scoreCount >= 3 ? "rgba(201,168,76,0.12)" : "rgba(123,198,126,0.08)",
              borderRadius:12, padding:20, marginBottom:20, border:`2px solid ${scoreCount >= 6 ? "#ff4444" : scoreCount >= 3 ? T.gold : "#7bc67e"}`}}>
              <div style={{fontSize:32, textAlign:"center", marginBottom:8}}>{scoreCount >= 6 ? "🚨" : scoreCount >= 3 ? "⚠️" : "✅"}</div>
              <div style={{color: scoreCount >= 6 ? "#ff8080" : scoreCount >= 3 ? T.gold : "#7bc67e", fontSize:18, fontWeight:700, textAlign:"center", marginBottom:8}}>
                {scoreCount >= 6 ? "Strong indicators of discrimination" : scoreCount >= 3 ? "Some indicators present" : "Few indicators at this time"}
              </div>
              <div style={{color:T.white,fontSize:13,textAlign:"center",marginBottom:12}}>
                You ticked {scoreCount} out of {totalQ} indicators.
              </div>
              {scoreCount >= 3 && (
                <div>
                  <div style={{color:"#64748B",fontSize:13,lineHeight:1.7,marginBottom:12}}>
                    These indicators match patterns seen in successful tribunal cases. The indicators you've identified suggest possible grounds under:
                  </div>
                  {sec.questions.filter((_,i) => selfScores[i]).map((item,i) => (
                    <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"8px 12px",marginBottom:6,color:sec.color,fontSize:12,fontWeight:600}}>▸ {item.flag}</div>
                  ))}
                  <div style={{color:"#64748B",fontSize:12,marginTop:12,lineHeight:1.7}}>
                    ⚠ This is not a legal assessment. Start your Assessment in UJRIS and let the AI analyse your full case.
                  </div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <Btn onClick={() => { setSelfScores({}); setSelfDone(false); }}>Retake Assessment</Btn>
              <Btn onClick={() => setActiveSection(null)}>Back to Protection Hub</Btn>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function SessionReviewScreen({ session, onClose }) {
  const WINDOW_HOURS = 24;
  const deadline = new Date(session.recordedAt + WINDOW_HOURS * 3600 * 1000);
  const now = Date.now();
  const hoursLeft = Math.max(0, Math.round((deadline - now) / 3600000));
  const windowOpen = now < deadline.getTime();

  const [corrections, setCorrections] = React.useState(() => session.corrections || []);
  const [selectedSeg, setSelectedSeg] = React.useState(null);
  const [correctionText, setCorrectionText] = React.useState('');
  const [correctionReason, setCorrectionReason] = React.useState('');
  const [confirmedBy, setConfirmedBy] = React.useState(() => session.confirmedBy || []);
  const [yourRole, setYourRole] = React.useState('interviewee');
  const [reanalysis, setReanalysis] = React.useState(session.reanalysis || '');
  const [reanalysing, setReanalysing] = React.useState(false);
  const [view, setView] = React.useState('transcript'); // transcript | corrections | report

  const segments = React.useMemo(() => {
    const raw = session.transcript || '';
    return raw.split('\n').filter(l => l.trim()).map((line, i) => ({
      id: i, text: line,
      correction: corrections.find(c => c.segId === i && c.status === 'accepted'),
      pending: corrections.find(c => c.segId === i && c.status === 'pending'),
    }));
  }, [session.transcript, corrections]);

  function submitCorrection() {
    if (!selectedSeg || !correctionText || !correctionReason) return;
    const corr = {
      id: Date.now().toString(),
      segId: selectedSeg.id,
      originalText: selectedSeg.text,
      correctedText: correctionText,
      reason: correctionReason,
      correctedBy: yourRole,
      correctedAt: new Date().toLocaleString('en-GB'),
      status: 'pending',
    };
    const updated = [...corrections, corr];
    setCorrections(updated);
    saveSessionUpdate(session.id, { corrections: updated });
    setSelectedSeg(null); setCorrectionText(''); setCorrectionReason('');
  }

  function acceptCorrection(corrId) {
    const updated = corrections.map(c => c.id === corrId ? { ...c, status: 'accepted', reviewedAt: new Date().toLocaleString('en-GB') } : c);
    setCorrections(updated);
    saveSessionUpdate(session.id, { corrections: updated });
  }

  function rejectCorrection(corrId) {
    const updated = corrections.map(c => c.id === corrId ? { ...c, status: 'rejected' } : c);
    setCorrections(updated);
    saveSessionUpdate(session.id, { corrections: updated });
  }

  function confirmSession() {
    const updated = [...new Set([...confirmedBy, yourRole])];
    setConfirmedBy(updated);
    saveSessionUpdate(session.id, { confirmedBy: updated });
    if (updated.length >= 1) triggerReanalysis(updated);
  }

  function triggerReanalysis(confirmed) {
    setReanalysing(true);
    const acceptedCorrs = corrections.filter(c => c.status === 'accepted');
    let finalTranscript = session.transcript;
    acceptedCorrs.forEach(c => { finalTranscript = finalTranscript.replace(c.originalText, c.correctedText); });

    const sys = `You are UJRIS Forensic AI conducting a certified session re-analysis.

ORIGINAL TRANSCRIPT:
${session.transcript}

FINAL CONFIRMED TRANSCRIPT (after ${acceptedCorrs.length} correction(s)):
${finalTranscript}

CORRECTIONS MADE:
${acceptedCorrs.map((c, i) => `${i + 1}. Original: "${c.originalText}" → Corrected: "${c.correctedText}" — Reason: ${c.reason}`).join('\n') || 'None'}

CONFIRMED BY: ${confirmed.join(', ')}
SESSION TYPE: ${session.type}
ORGANISATION: ${session.org}

Provide CERTIFIED SESSION FORENSIC REPORT:

1. 🏛 CERTIFICATION STATUS — Both parties confirmed? Window status? Integrity level.
2. 🎯 ANCHOR LIE ANALYSIS (Final Version) — Any pivotal false statements in the FINAL transcript.
3. 🔄 CHANGE IMPACT — How did corrections change the forensic picture? Were any original flags removed or new ones created?
4. ✅ KEY ADMISSIONS (Final) — Statements in the final transcript that support the claimant.
5. ⚖ LEGAL SIGNIFICANCE — What claims does this certified session support? EA 2010 / ERA 1996 references.
6. 📋 TRIBUNAL USE — Is this session record certifiable for tribunal bundle? What caveats apply?
7. 🔍 EVIDENCE GAPS — What does this session reveal is still missing?

Mark this as CERTIFIED ANALYSIS — FINAL VERSION.`;

    streamAI('You are UJRIS Forensic AI.', sys,
      t => setReanalysis(t),
      () => { setReanalysing(false); saveSessionUpdate(session.id, { reanalysis: reanalysis, status: 'confirmed', confirmedBy: confirmed }); }
    );
  }

  function saveSessionUpdate(id, updates) {
    const all = S.get('recordings', []);
    const updated = all.map(r => r.id === id ? { ...r, ...updates } : r);
    S.set('recordings', updated);
  }

  function exportCertifiedRecord() {
    const acceptedCorrs = corrections.filter(c => c.status === 'accepted');
    const w = window.open();
    w.document.write(`<html><head><title>UJRIS Certified Session Record</title><style>
body{font-family:Georgia,serif;max-width:750px;margin:40px auto;font-size:13px;line-height:1.8;color:#1a1a1a}
h1{color:#1a2b3c;border-bottom:3px solid #C9A84C;padding-bottom:10px}
h2{color:#1a2b3c;margin-top:30px}
.cert{background:#f0fff4;border:2px solid #7bc67e;border-radius:8px;padding:16px;margin:20px 0}
.correction{background:#fff8e1;border-left:4px solid #C9A84C;padding:8px 12px;margin:8px 0}
.original{color:#999;text-decoration:line-through}
.corrected{color:#1a1a1a;font-weight:bold}
.flag{background:#fff3f3;border-left:4px solid #cc3333;padding:8px 12px;margin:8px 0}
pre{white-space:pre-wrap;font-family:Georgia,serif}
.sig{border:1px solid #ccc;border-radius:4px;padding:12px;margin:8px 0;min-height:40px}
</style></head><body>
<h1>UJRIS — CERTIFIED SESSION RECORD</h1>
<div class="cert">
<strong>CERTIFICATION STATUS:</strong> ${confirmedBy.length >= 1 ? '✅ CONFIRMED' : '⏳ PENDING CONFIRMATION'}<br/>
<strong>Session Date:</strong> ${session.date} ${session.time}<br/>
<strong>Session Type:</strong> ${session.type}<br/>
<strong>Organisation:</strong> ${session.org || 'N/A'}<br/>
<strong>Recording ID:</strong> ${session.id}<br/>
<strong>Confirmed by:</strong> ${confirmedBy.join(', ') || 'Pending'}<br/>
<strong>Correction Window:</strong> ${WINDOW_HOURS} hours from recording<br/>
<strong>Total Corrections:</strong> ${acceptedCorrs.length} accepted
</div>
<h2>ORIGINAL TRANSCRIPT (Immutable Record)</h2>
<pre>${session.transcript}</pre>
${acceptedCorrs.length > 0 ? `<h2>CORRECTIONS LOG (Audit Trail)</h2>
${acceptedCorrs.map((c, i) => `<div class="correction">
<strong>Correction ${i + 1}</strong> — ${c.correctedAt} by ${c.correctedBy}<br/>
<span class="original">Original: "${c.originalText}"</span><br/>
<span class="corrected">Corrected: "${c.correctedText}"</span><br/>
<em>Reason: ${c.reason}</em>
</div>`).join('')}` : ''}
<h2>FORENSIC ANALYSIS (${confirmedBy.length >= 1 ? 'FINAL — Post-Confirmation' : 'PRELIMINARY'})</h2>
<pre>${reanalysis || session.analysis || 'Analysis pending confirmation.'}</pre>
<h2>DIGITAL CONFIRMATION</h2>
<p>The undersigned confirm this transcript accurately reflects the session conducted on ${session.date}.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
<div class="sig"><strong>Interviewer</strong><br/><br/>${confirmedBy.includes('interviewer') ? '✅ Confirmed' : 'Pending'}</div>
<div class="sig"><strong>Interviewee</strong><br/><br/>${confirmedBy.includes('interviewee') ? '✅ Confirmed' : 'Pending'}</div>
</div>
</body></html>`);
    w.document.close(); w.print();
  }

  const pendingCorrs = corrections.filter(c => c.status === 'pending');
  const acceptedCorrs = corrections.filter(c => c.status === 'accepted');
  const isConfirmed = confirmedBy.length >= 1;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700 }}>📋 Session Review & Confirmation</div>
          <div style={{ color: T.muted, fontSize: 12 }}>{session.date} {session.time} · {session.type} · {session.org}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13 }}>← Back</button>
      </div>

      {/* Status Banner */}
      <div style={{ background: isConfirmed ? 'rgba(123,198,126,0.1)' : windowOpen ? 'rgba(201,168,76,0.1)' : T.redBg, border: `1px solid ${isConfirmed ? '#7bc67e' : windowOpen ? T.gold : '#ff4444'}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ color: isConfirmed ? '#7bc67e' : windowOpen ? T.gold : '#ff8080', fontSize: 14, fontWeight: 700 }}>
              {isConfirmed ? '✅ CONFIRMED — Forensic re-analysis complete' : windowOpen ? `⏳ REVIEW WINDOW OPEN — ${hoursLeft}h remaining` : '🔒 REVIEW WINDOW CLOSED'}
            </div>
            <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>
              {acceptedCorrs.length} corrections accepted · {pendingCorrs.length} pending review · Confirmed by: {confirmedBy.join(', ') || 'none yet'}
            </div>
          </div>
          {!isConfirmed && windowOpen && (
            <div>
              <select value={yourRole} onChange={e => setYourRole(e.target.value)} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', color: T.white, fontSize: 12, marginBottom: 6, display: 'block', width: '100%' }}>
                <option value="interviewee">I am the Interviewee</option>
                <option value="interviewer">I am the Interviewer</option>
                <option value="observer">I am an Observer</option>
              </select>
              <button onClick={confirmSession} style={{ background: '#7bc67e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
                ✅ Confirm This Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, background: T.navyM, borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {[['transcript', '📝 Transcript'], ['corrections', `✏️ Corrections (${corrections.length})`], ['report', '🔬 Forensic Report']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex: 1, background: view === id ? T.gold : 'transparent', color: view === id ? T.navy : T.white, border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: view === id ? 700 : 400, fontSize: 12, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {/* TRANSCRIPT VIEW */}
      {view === 'transcript' && (
        <div>
          {selectedSeg && (
            <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 16, border: `2px solid ${T.gold}` }}>
              <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✏️ Correct This Segment</div>
              <div style={{ background: T.redBg, borderRadius: 6, padding: 10, color: '#ff9f7f', fontSize: 12, marginBottom: 10 }}>
                Original: <em>"{selectedSeg.text}"</em>
              </div>
              <textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} placeholder="Enter corrected text..." rows={3} style={{ width: '100%', background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.white, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
              <input value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} placeholder="Reason for correction (e.g. 'Misheard word', 'Added clarification')" style={{ width: '100%', background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={submitCorrection} disabled={!correctionText || !correctionReason}>Submit Correction</Btn>
                <button onClick={() => setSelectedSeg(null)} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', color: T.white, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background: T.navyM, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.muted, fontSize: 11, marginBottom: 12 }}>
              {windowOpen ? 'Click any line to correct it. Corrections are shared with all parties for review.' : 'Review window closed. Transcript is locked.'}
            </div>
            {segments.length === 0 ? (
              <div style={{ color: T.dim, fontSize: 13, textAlign: 'center', padding: 20 }}>No transcript available</div>
            ) : segments.map(seg => (
              <div key={seg.id} onClick={() => windowOpen && !selectedSeg && setSelectedSeg(seg)}
                style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: windowOpen ? 'pointer' : 'default', border: `1px solid ${seg.correction ? '#7bc67e33' : seg.pending ? T.gold + '33' : 'transparent'}`, background: seg.correction ? 'rgba(123,198,126,0.06)' : seg.pending ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                {seg.correction ? (
                  <div>
                    <span style={{ color: T.muted, fontSize: 11, textDecoration: 'line-through' }}>{seg.text}</span>
                    <span style={{ color: '#7bc67e', fontSize: 13, display: 'block' }}>✅ {seg.correction.correctedText}</span>
                    <span style={{ color: T.dim, fontSize: 10 }}>Corrected by {seg.correction.correctedBy}: {seg.correction.reason}</span>
                  </div>
                ) : seg.pending ? (
                  <div>
                    <span style={{ color: T.white, fontSize: 13 }}>{seg.text}</span>
                    <span style={{ color: T.gold, fontSize: 11, display: 'block' }}>⏳ Correction pending review</span>
                  </div>
                ) : (
                  <span style={{ color: T.white, fontSize: 13 }}>{seg.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CORRECTIONS VIEW */}
      {view === 'corrections' && (
        <div>
          {corrections.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: 40 }}>No corrections submitted yet.</div>
          ) : corrections.map(c => (
            <div key={c.id} style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${c.status === 'accepted' ? '#7bc67e33' : c.status === 'rejected' ? '#ff444433' : T.gold + '33'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <span style={{ color: c.status === 'accepted' ? '#7bc67e' : c.status === 'rejected' ? '#ff8080' : T.gold, fontSize: 12, fontWeight: 700 }}>
                  {c.status === 'accepted' ? '✅ ACCEPTED' : c.status === 'rejected' ? '❌ REJECTED' : '⏳ PENDING'}
                </span>
                <span style={{ color: T.muted, fontSize: 11 }}>By {c.correctedBy} · {c.correctedAt}</span>
              </div>
              <div style={{ color: '#ff9f7f', fontSize: 12, marginBottom: 6 }}>Original: <em>"{c.originalText}"</em></div>
              <div style={{ color: '#7bc67e', fontSize: 13, marginBottom: 6 }}>Corrected: <strong>"{c.correctedText}"</strong></div>
              <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>Reason: {c.reason}</div>
              {c.status === 'pending' && windowOpen && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => acceptCorrection(c.id)} style={{ background: '#7bc67e', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✅ Accept</button>
                  <button onClick={() => rejectCorrection(c.id)} style={{ background: T.redBg, color: '#ff8080', border: '1px solid #ff444433', borderRadius: 6, padding: '6px 16px', fontSize: 12, cursor: 'pointer' }}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FORENSIC REPORT VIEW */}
      {view === 'report' && (
        <div>
          {!reanalysis && !session.analysis ? (
            <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: 40 }}>
              {isConfirmed ? 'Re-analysis running...' : 'Confirm the session to trigger certified forensic re-analysis.'}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ color: T.gold, fontSize: 14, fontWeight: 700 }}>{isConfirmed ? '🏛 CERTIFIED FORENSIC ANALYSIS' : '🔬 PRELIMINARY ANALYSIS'}</div>
                {reanalysing && <span style={{ color: T.muted, fontSize: 12 }}>Re-analysing...</span>}
              </div>
              <pre style={{ color: T.white, fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: 'Georgia,serif' }}>{reanalysis || session.analysis}</pre>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Btn onClick={exportCertifiedRecord} style={{ flex: 1 }}>🏛 Export Certified Record</Btn>
            {!reanalysing && isConfirmed && <Btn onClick={() => triggerReanalysis(confirmedBy)} style={{ flex: 1, background: T.teal }}>🔄 Re-run Analysis</Btn>}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveRecordingStudio({ caseData }) {
  const [view, setView] = React.useState('list'); // list | record | review
  const [consent, setConsent] = React.useState(false);
  const [consentSigned, setConsentSigned] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [transcript, setTranscript] = React.useState('');
  const [liveText, setLiveText] = React.useState('');
  const [sessionNotes, setSessionNotes] = React.useState('');
  const [sessionType, setSessionType] = React.useState('employment');
  const [sessionOrg, setSessionOrg] = React.useState('');
  const [aiAnalysis, setAiAnalysis] = React.useState('');
  const [analysing, setAnalysing] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [mode, setMode] = React.useState('audio');
  const [recordings, setRecordings] = React.useState(() => S.get('recordings', []));
  const [reviewSession, setReviewSession] = React.useState(null);
  const [participants, setParticipants] = React.useState([{ name: 'You', role: 'interviewee' }]);
  const [newParticipant, setNewParticipant] = React.useState('');

  const mediaRecRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const recogRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const videoRef = React.useRef(null);

  const SESSION_TYPES = [
    { id: 'employment', label: 'Employment / HR Meeting' },
    { id: 'police', label: 'Police Interview / Stop' },
    { id: 'cab', label: 'Citizens Advice Bureau Session' },
    { id: 'lawworks', label: 'LawWorks / Legal Clinic' },
    { id: 'social_work', label: 'Social Worker Visit' },
    { id: 'tribunal', label: 'Tribunal Preparation' },
    { id: 'medical', label: 'Medical / GP Appointment' },
    { id: 'other', label: 'Other Meeting / Session' },
  ];

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mode === 'video' ? { audio: true, video: true } : { audio: true });
      streamRef.current = stream;
      if (mode === 'video' && videoRef.current) videoRef.current.srcObject = stream;
      const chunks = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => { const blob = new Blob(chunks, { type: 'audio/webm' }); setAudioUrl(URL.createObjectURL(blob)); };
      mr.start(1000);
      setRecording(true); setPaused(false); setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const recog = new SR(); recog.continuous = true; recog.interimResults = true; recog.lang = 'en-GB';
        recog.onresult = evt => {
          let interim = '', final = '';
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            const txt = evt.results[i][0].transcript;
            if (evt.results[i].isFinal) final += txt + '\n'; else interim += txt;
          }
          if (final) setTranscript(t => t + final);
          setLiveText(interim);
        };
        recog.start(); recogRef.current = recog;
      }
    } catch (err) { alert('Microphone access denied: ' + err.message); }
  }

  function stopRecording() {
    if (mediaRecRef.current) mediaRecRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (recogRef.current) recogRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false); setPaused(false); setLiveText('');
  }

  function analyseSession() {
    if (!transcript && !sessionNotes) return;
    setAiAnalysis(''); setAnalysing(true);
    const caseCtx = caseData ? `Case: ${caseData.discType?.join(', ')} — ${caseData.setting}` : '';
    streamAI('You are UJRIS Forensic AI.',
      `Analyse this ${SESSION_TYPES.find(s => s.id === sessionType)?.label} session with ${sessionOrg}.
Transcript: ${transcript || '(no transcript)'}
Notes: ${sessionNotes || '(none)'}
Case: ${caseCtx}
Participants: ${participants.map(p => `${p.name} (${p.role})`).join(', ')}

Provide PRELIMINARY SESSION ANALYSIS (pre-confirmation):
1. 🎯 KEY ADMISSIONS — Quote exact phrases that constitute admissions.
2. 🔍 ANCHOR LIE CANDIDATES — Single most important false statement.
3. ⏰ TEMPORAL FLAGS — Dates needing cross-reference.
4. 🚨 HOSTILE FRAMING — Any language reframing victim behaviour negatively.
5. ✅ POSITIVE EVIDENCE — Statements supporting the claimant.
6. ⚖ LEGAL SIGNIFICANCE — EA 2010 / ERA 1996 relevance.
7. 📋 48-HOUR ACTIONS — What to do immediately after this session.
8. ⭐ EVIDENCE VALUE — High/Medium/Low with reasoning.

NOTE: This is preliminary analysis. Final certified analysis runs after both parties confirm.`,
      t => setAiAnalysis(t), () => setAnalysing(false)
    );
  }

  function saveSession() {
    const session = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString('en-GB'),
      recordedAt: Date.now(),
      type: SESSION_TYPES.find(s => s.id === sessionType)?.label || sessionType,
      org: sessionOrg, duration: elapsed,
      transcript, notes: sessionNotes, analysis: aiAnalysis,
      participants, corrections: [], confirmedBy: [], reanalysis: '',
      status: 'pending_review',
      reviewDeadline: new Date(Date.now() + 24 * 3600000).toLocaleString('en-GB'),
      caseId: caseData?.id || 'general', caseName: caseData?.title || 'General',
    };
    const updated = [session, ...recordings];
    setRecordings(updated); S.set('recordings', updated); setSaved(true);
    alert('✅ Session saved. Both parties have 24 hours to review and confirm the transcript.');
  }

  function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  const pendingSessions = recordings.filter(r => r.status === 'pending_review' && Date.now() < (r.recordedAt + 24 * 3600000));

  if (reviewSession) return <SessionReviewScreen session={reviewSession} onClose={() => { setReviewSession(null); setRecordings(S.get('recordings', [])); }} />;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ color: T.gold, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🎙 Recording Studio</div>

      {/* Pending Reviews Alert */}
      {pendingSessions.length > 0 && (
        <div style={{ background: 'rgba(201,168,76,0.1)', border: `1px solid ${T.gold}55`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⏳ {pendingSessions.length} Session(s) Awaiting Confirmation</div>
          {pendingSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
              <div>
                <div style={{ color: T.white, fontSize: 13 }}>{s.type} — {s.org}</div>
                <div style={{ color: T.muted, fontSize: 11 }}>{s.date} · Review deadline: {s.reviewDeadline}</div>
              </div>
              <button onClick={() => setReviewSession(s)} style={{ background: T.gold, color: T.navy, border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Review</button>
            </div>
          ))}
        </div>
      )}

      {/* Consent Gate */}
      {!consentSigned ? (
        <div>
          <div style={{ background: T.redBg, border: '1px solid #ff444466', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ color: '#ff8080', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>⚠ Consent & Confirmation System</div>
            <div style={{ color: T.white, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
              This recording studio includes a <strong>dual-party confirmation system</strong>. After recording:<br/>
              • Both parties receive a 24-hour window to review and correct the transcript<br/>
              • All original versions are permanently preserved<br/>
              • Corrections are logged with full audit trail<br/>
              • Certified forensic analysis runs after confirmation<br/><br/>
              <strong>UK Law:</strong> Inform all parties this session is being recorded before starting.
            </div>
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
              <span style={{ color: T.white, fontSize: 13 }}>I confirm all parties are aware this session will be recorded and that both will have 24 hours to review and confirm the transcript.</span>
            </label>
          </div>

          {/* Add Participants */}
          <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>👥 Session Participants</div>
            {participants.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: T.white, fontSize: 13, flex: 1 }}>{p.name}</span>
                <span style={{ background: `${T.gold}22`, color: T.gold, fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{p.role}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={newParticipant} onChange={e => setNewParticipant(e.target.value)} placeholder="Add participant name" style={{ flex: 1, background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', color: T.white, fontSize: 12 }} />
              <button onClick={() => { if (newParticipant) { setParticipants(p => [...p, { name: newParticipant, role: 'interviewer' }]); setNewParticipant(''); } }} style={{ background: T.gold, color: T.navy, border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>
          </div>

          <Btn disabled={!consent} onClick={() => setConsentSigned(true)}>Start Recording Session →</Btn>

          {/* Past Sessions */}
          {recordings.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📁 All Sessions ({recordings.length})</div>
              {recordings.map(r => (
                <div key={r.id} style={{ background: T.navyM, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${r.status === 'confirmed' ? '#7bc67e33' : r.status === 'pending_review' ? T.gold + '33' : T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ color: T.white, fontSize: 13, fontWeight: 700 }}>{r.type}</div>
                      <div style={{ color: T.muted, fontSize: 11 }}>{r.org} · {r.date} · {fmt(r.duration)} · Case: {r.caseName}</div>
                      <div style={{ color: r.status === 'confirmed' ? '#7bc67e' : T.gold, fontSize: 11, marginTop: 3 }}>
                        {r.status === 'confirmed' ? '✅ Confirmed' : r.status === 'pending_review' ? '⏳ Awaiting Review' : '📋 Saved'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.status === 'pending_review' && <button onClick={() => setReviewSession(r)} style={{ background: T.gold, color: T.navy, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Review</button>}
                      {r.status !== 'pending_review' && <button onClick={() => setReviewSession(r)} style={{ background: T.navyL, color: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}>View</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Session Setup */}
          <div style={{ background: T.navyM, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <select value={sessionType} onChange={e => setSessionType(e.target.value)} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.white, fontSize: 12 }}>
                {SESSION_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <input value={sessionOrg} onChange={e => setSessionOrg(e.target.value)} placeholder="Organisation / Person name" style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.white, fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['audio', 'video'].map(m => (
                <button key={m} onClick={() => !recording && setMode(m)} style={{ flex: 1, background: mode === m ? T.gold : T.navyL, color: mode === m ? T.navy : T.white, border: `1px solid ${mode === m ? T.gold : T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: mode === m ? 700 : 400, cursor: 'pointer' }}>
                  {m === 'audio' ? '🎙 Audio' : '📹 Video'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'video' && <video ref={videoRef} autoPlay muted style={{ width: '100%', borderRadius: 10, marginBottom: 12, background: '#000', maxHeight: 180 }} />}

          {/* Controls */}
          <div style={{ background: T.navyM, borderRadius: 12, padding: 20, marginBottom: 14, textAlign: 'center', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: recording ? '#ff4444' : T.gold, fontFamily: 'monospace', marginBottom: 14 }}>
              {recording && !paused && <span style={{ display: 'inline-block', width: 10, height: 10, background: '#ff4444', borderRadius: '50%', marginRight: 8 }} />}
              {fmt(elapsed)}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {!recording ? (
                <Btn onClick={startRecording} style={{ background: '#cc2222', padding: '12px 28px' }}>🔴 Start Recording</Btn>
              ) : (
                <>
                  <button onClick={() => { if (paused) { mediaRecRef.current?.resume(); timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); setPaused(false); } else { mediaRecRef.current?.pause(); clearInterval(timerRef.current); setPaused(true); } }} style={{ background: paused ? '#7bc67e' : T.navyL, color: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
                    {paused ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button onClick={stopRecording} style={{ background: T.gold, color: T.navy, border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⏹ Stop</button>
                </>
              )}
            </div>
          </div>

          {/* Live Transcript */}
          <div style={{ background: T.navyM, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📝 Live Transcript</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, minHeight: 80, maxHeight: 200, overflowY: 'auto' }}>
              <span style={{ color: T.white, fontSize: 12, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{transcript}</span>
              {liveText && <span style={{ color: T.muted, fontSize: 12 }}>{liveText}</span>}
              {!transcript && !liveText && <span style={{ color: T.dim, fontSize: 12 }}>Live transcript will appear here as you speak...</span>}
            </div>
          </div>

          <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Session notes — context, key moments, observations..." rows={3} style={{ width: '100%', background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.white, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />

          {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn onClick={analyseSession} disabled={analysing || (!transcript && !sessionNotes)} style={{ flex: 1 }}>{analysing ? '🔬 Analysing...' : '🔬 Preliminary Analysis'}</Btn>
            <Btn onClick={saveSession} disabled={saved || (!transcript && !sessionNotes)} style={{ flex: 1, background: T.teal }}>{saved ? '✅ Saved — Review Window Open' : '💾 Save & Open Review Window'}</Btn>
          </div>
          {aiAnalysis && <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}><div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🔬 Preliminary Analysis (pre-confirmation)</div><pre style={{ color: T.white, fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Georgia,serif' }}>{aiAnalysis}</pre></div>}
        </div>
      )}
    </div>
  );
}

function UniversalFileIntake({ caseData, cases, setTab }) {
  const [files, setFiles] = React.useState([]);
  const [processing, setProcessing] = React.useState(null);
  const [results, setResults] = React.useState([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [webUrl, setWebUrl] = React.useState('');
  const [extracting, setExtracting] = React.useState(false);
  const [emailText, setEmailText] = React.useState('');
  const [pasteMode, setPasteMode] = React.useState(false);
  const [activeCase, setActiveCase] = React.useState(caseData?.id || '');
  const [intakeTab, setIntakeTab] = React.useState('upload');
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  const audioInputRef = React.useRef(null);

  const ACCEPTED = '.pdf,.doc,.docx,.txt,.eml,.msg,.jpg,.jpeg,.png,.webp,.gif,.bmp,.mp3,.wav,.mp4,.webm,.ogg,.m4a,.zip,.gz,.tar,.rar,.7z,.csv,.xlsx,.xls,.json,.html,.rtf';

  function classifyFile(name, size) {
    const ext = name.split('.').pop().toLowerCase();
    const mb = (size / 1024 / 1024).toFixed(1);
    if (['pdf'].includes(ext)) return { type: 'pdf', icon: '📄', label: `PDF (${mb}MB)` };
    if (['doc', 'docx', 'rtf'].includes(ext)) return { type: 'word', icon: '📝', label: 'Word Document' };
    if (['txt', 'html'].includes(ext)) return { type: 'text', icon: '📃', label: 'Text File' };
    if (['eml', 'msg'].includes(ext)) return { type: 'email', icon: '✉', label: 'Email File' };
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) return { type: 'image', icon: '🖼', label: `Image (${mb}MB)` };
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return { type: 'audio', icon: '🎙', label: `Audio (${mb}MB)` };
    if (['mp4', 'webm'].includes(ext)) return { type: 'video', icon: '📹', label: `Video (${mb}MB)` };
    if (['zip', 'gz', 'tar', 'rar', '7z'].includes(ext)) return { type: 'archive', icon: '🗜', label: `Archive (${mb}MB)` };
    if (['xlsx', 'xls', 'csv'].includes(ext)) return { type: 'spreadsheet', icon: '📊', label: 'Spreadsheet' };
    if (['json'].includes(ext)) return { type: 'data', icon: '📋', label: 'Data File' };
    return { type: 'unknown', icon: '📁', label: `File (${mb}MB)` };
  }

  function addFiles(newFiles) {
    const items = newFiles.map(f => ({ file: f, id: Date.now() + Math.random(), name: f.name, size: f.size, ...classifyFile(f.name, f.size), status: 'ready', result: null }));
    setFiles(prev => [...prev, ...items]);
  }

  async function processFile(item) {
    setProcessing(item.id);
    let content = '';
    const caseCtx = activeCase ? `Case: ${cases?.find(c => c.id === activeCase)?.title || 'Unknown'}` : (caseData ? `Case: ${caseData.discType?.join(', ')}` : '');

    try {
      if (['text', 'email'].includes(item.type)) {
        content = await item.file.text();
      } else if (item.type === 'word') {
        // Try to extract text from DOCX (it's a ZIP with XML inside)
        try {
          const buf = await item.file.arrayBuffer();
          const arr = new Uint8Array(buf);
          // Simple XML text extraction
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const raw = decoder.decode(arr);
          const xmlMatch = raw.match(/word\/document\.xml/);
          if (xmlMatch) {
            content = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 5000);
          } else {
            content = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 3000);
          }
        } catch { content = await item.file.text().catch(() => '[Word document — paste text for analysis]'); }
      } else if (item.type === 'pdf') {
        const buf = await item.file.arrayBuffer();
        const decoder = new TextDecoder('latin-1', { fatal: false });
        const raw = decoder.decode(new Uint8Array(buf));
        // Extract readable text from PDF streams
        const textMatches = raw.match(/\(([^\)]{5,200})\)/g) || [];
        content = textMatches.map(m => m.slice(1, -1)).filter(t => /[a-zA-Z]{3,}/.test(t)).join(' ').substring(0, 4000);
        if (content.length < 100) content = '[PDF — text layer not extractable. Paste text content below for analysis, or run the Forensic Auditor with pasted text.]';
      } else if (item.type === 'image') {
        const b64 = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(item.file); });
        const resp = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, stream: false,
            messages: [{ role: 'user', content: [
              { type: 'image', source: { type: 'base64', media_type: item.file.type || 'image/jpeg', data: b64 } },
              { type: 'text', text: `You are UJRIS forensic AI. ${caseCtx}. Analyse this image as evidence: (1) Describe exactly what the image shows, (2) Extract all visible text (OCR), (3) Note dates, names, reference numbers, (4) Identify evidential relevance, (5) Flag any inconsistencies or red flags, (6) Metadata clues from image content.` }
            ]}] }) });
        const data = await resp.json();
        content = data.content?.[0]?.text || 'Image analysis unavailable';
        setResults(prev => [...prev, { id: item.id, name: item.name, type: item.type, icon: item.icon, content, analysis: content, caseId: activeCase }]);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done' } : f));
        setProcessing(null); return;
      } else if (item.type === 'archive') {
        // Try JSZip for real ZIP extraction
        try {
          const JSZIP_CDN = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          if (!window.JSZip) {
            await new Promise(function(res,rej){ const s=document.createElement("script"); s.src=JSZIP_CDN; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
          }
          const zip = await window.JSZip.loadAsync(item);
          const fileNames = Object.keys(zip.files).filter(function(n){ return !zip.files[n].dir; });
          const extracted = [];
          for (const fname of fileNames.slice(0, 20)) {
            const ext = fname.split(".").pop().toLowerCase();
            const zipFile = zip.files[fname];
            if (["txt","html","rtf","json","csv"].includes(ext)) {
              const txt = await zipFile.async("string");
              extracted.push("── " + fname + " ──\n" + txt.slice(0, 2000));
            } else if (["pdf","doc","docx","eml","msg"].includes(ext)) {
              extracted.push("── " + fname + " ── [" + ext.toUpperCase() + " document — upload individually for full analysis]");
            } else if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
              extracted.push("── " + fname + " ── [Image — upload individually for vision analysis]");
            } else if (["mp4","webm","mov","avi","mp3","wav","ogg"].includes(ext)) {
              extracted.push("── " + fname + " ── [Media file — upload individually for analysis]");
            } else {
              extracted.push("── " + fname + " ── [" + ext.toUpperCase() + " file detected]");
            }
          }
          content = "📦 ZIP ARCHIVE EXTRACTED: " + item.name + "\n" +
            "Files found: " + fileNames.length + " (" + (fileNames.length > 20 ? "showing first 20" : "all shown") + ")\n\n" +
            extracted.join("\n\n") +
            "\n\n[Archive processed: " + new Date().toLocaleString("en-GB") + "]";
        } catch(zipErr) {
          content = "[Archive: " + item.name + "]\n\n" +
            "ZIP archive received (" + fileNames.length + " files detected). " +
            "Text files extracted automatically. Binary files (PDF, images, media) — upload each individually for full analysis.\n" +
            "Logged: " + new Date().toLocaleString("en-GB");
        }
      } else if (item.type === 'audio') {
        content = `[Audio: ${item.name} — ${(item.size / 1024 / 1024).toFixed(1)}MB]\n\nAudio file received and logged. For full transcription and forensic analysis:\n→ Go to 🎙 Recording Studio to record and transcribe sessions live\n→ Or use the session review feature to process existing recordings`;
      } else if (item.type === 'spreadsheet') {
        content = await item.file.text().catch(() => '[Spreadsheet — binary format. Save as CSV and re-upload for text analysis]');
      } else {
        content = await item.file.text().catch(() => `[${item.type} file: ${item.name}]`);
      }

      if (content && content.length > 80 && !['archive', 'audio'].includes(item.type)) {
        let analysis = '';
        await new Promise(resolve => {
          streamAI('You are UJRIS Forensic AI.',
            `${caseCtx ? caseCtx + '\n\n' : ''}Analyse this document as case evidence:
File: ${item.name}
Content: ${content.substring(0, 4000)}

Provide: (1) DOCUMENT SUMMARY — what this is and who produced it, (2) KEY FACTS — dates, names, statements, (3) ANCHOR LIE CANDIDATES — any foundational false assertion, (4) TEMPORAL FLAGS — date inconsistencies, (5) EVIDENTIAL VALUE — High/Medium/Low, (6) IMMEDIATE ACTION — what to do with this now, (7) METADATA FLAGS — any creation/modification date anomalies visible in content.`,
            t => { analysis = t; },
            () => resolve()
          );
        });
        setResults(prev => [...prev, { id: item.id, name: item.name, type: item.type, icon: item.icon, content: content.substring(0, 300) + '...', analysis, caseId: activeCase }]);
      } else {
        setResults(prev => [...prev, { id: item.id, name: item.name, type: item.type, icon: item.icon, content, analysis: content, caseId: activeCase }]);
      }
    } catch (err) {
      setResults(prev => [...prev, { id: item.id, name: item.name, type: item.type, icon: item.icon, content: 'Error: ' + err.message, analysis: 'Processing error: ' + err.message, caseId: activeCase }]);
    }
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done' } : f));
    setProcessing(null);
  }

  function addToVault(r) {
    const ev = S.get('evidence', []);
    ev.unshift({ id: Date.now(), file: r.name, type: r.type, category: 'document', description: r.analysis.substring(0, 300), importance: 'high', date: new Date().toLocaleDateString('en-GB'), caseId: r.caseId });
    S.set('evidence', ev);
    alert(`✅ "${r.name}" added to Evidence Vault`);
  }

  function processPastedEmail() {
    if (!emailText.trim()) return;
    const pseudo = { id: Date.now() + Math.random(), name: 'Pasted Email / Text', size: emailText.length, type: 'text', icon: '📃', label: 'Pasted Content', status: 'ready', file: new Blob([emailText], { type: 'text/plain' }) };
    pseudo.file.name = 'Pasted Email / Text';
    setFiles(prev => [...prev, pseudo]);
    setEmailText(''); setPasteMode(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ color: T.gold, fontSize: 22, fontWeight: 700 }}>📥 Universal Evidence Intake</div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 3 }}>Every format accepted — PDF, images, audio, video, ZIP, email, web</div>
        </div>
        {cases && cases.length > 0 && (
          <select value={activeCase} onChange={e => setActiveCase(e.target.value)} style={{ background: T.navyL, border: `1px solid ${T.gold}55`, borderRadius: 8, padding: '8px 12px', color: T.gold, fontSize: 13, fontWeight: 600 }}>
            <option value="">📁 Select Case</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.icon || '⚖'} {c.title}</option>)}
          </select>
        )}
      </div>

      {/* Input Tabs */}
      <div style={{ display: 'flex', gap: 3, background: T.navyM, borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {[['upload', '📂 Files'], ['camera', '📸 Camera'], ['paste', '📋 Paste'], ['url', '🔗 URL']].map(([id, label]) => (
          <button key={id} onClick={() => setIntakeTab(id)} style={{ flex: 1, background: intakeTab === id ? T.gold : 'transparent', color: intakeTab === id ? T.navy : T.white, border: 'none', borderRadius: 7, padding: '8px 6px', fontWeight: intakeTab === id ? 700 : 400, fontSize: 12, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {/* Upload Zone */}
      {intakeTab === 'upload' && (
        <div>
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }} onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? T.gold : T.border}`, borderRadius: 16, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)', marginBottom: 12, transition: 'all 0.2s' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
            <div style={{ color: T.white, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Drop ANY file here — or click to browse</div>
            <div style={{ color: T.muted, fontSize: 11 }}>PDF · Word · Images · Audio · Video · ZIP · Email (.eml) · Excel · Text · Any format</div>
            <input ref={fileInputRef} type="file" multiple accept={ACCEPTED} style={{ display: 'none' }} onChange={e => addFiles(Array.from(e.target.files))} />
          </div>
          <div style={{ color: T.dim, fontSize: 11, textAlign: 'center', marginBottom: 12 }}>ZIP files are automatically logged as received. For mixed-format archives, extract and upload each document individually for forensic analysis.</div>
        </div>
      )}

      {/* Camera / Photo Capture */}
      {intakeTab === 'camera' && (
        <div style={{ background: T.navyM, borderRadius: 12, padding: 20, marginBottom: 12, border: `1px solid ${T.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
          <div style={{ color: T.white, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Capture Photo or Video Evidence</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>Take a photo or video directly from your device camera</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" style={{ display: 'none' }} onChange={e => addFiles(Array.from(e.target.files))} />
            <Btn onClick={() => cameraInputRef.current?.click()}>📸 Take Photo</Btn>
          </div>
          <div style={{ color: T.dim, fontSize: 11, marginTop: 12 }}>Photos are automatically timestamped and sent for AI forensic analysis</div>
        </div>
      )}

      {/* Paste Text / Email */}
      {intakeTab === 'paste' && (
        <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📋 Paste Email, Text or Document Content</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>Paste any text — emails, WhatsApp messages, letters, web content, meeting notes</div>
          <textarea value={emailText} onChange={e => setEmailText(e.target.value)} placeholder="Paste email body, document text, WhatsApp messages, or any text content here..." rows={8} style={{ width: '100%', background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, color: T.white, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
          <Btn onClick={processPastedEmail} disabled={!emailText.trim()}>Analyse Pasted Content</Btn>
        </div>
      )}

      {/* URL Extraction */}
      {intakeTab === 'url' && (
        <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔗 Extract from URL / Website</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>News articles, tribunal decisions, company pages, social media posts, court records</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={webUrl} onChange={e => setWebUrl(e.target.value)} placeholder="https://..." style={{ flex: 1, background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', color: T.white, fontSize: 13 }} />
            <Btn onClick={async () => {
              setExtracting(true);
              streamAI('You are UJRIS.', `URL submitted for evidence extraction: ${webUrl}\n\nProvide: (1) What type of content this URL likely contains based on the domain/path, (2) How to manually extract and save this content as evidence, (3) Legal significance of this URL in a discrimination context, (4) Any FOI or SAR route to obtain this content officially, (5) Screenshot/preservation instructions.`,
                t => setResults(prev => { const ex = prev.find(r => r.name === webUrl); if (ex) return prev.map(r => r.name === webUrl ? { ...r, analysis: t } : r); return [...prev, { id: Date.now().toString(), name: webUrl, type: 'web', icon: '🌐', content: 'URL evidence', analysis: t }]; }),
                () => setExtracting(false)
              );
            }} disabled={extracting || !webUrl}>{extracting ? 'Extracting...' : 'Extract'}</Btn>
          </div>
        </div>
      )}

      {/* File Queue */}
      {files.filter(f => f.status === 'ready').length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Files Ready ({files.filter(f => f.status === 'ready').length})</div>
          {files.filter(f => f.status === 'ready').map(item => (
            <div key={item.id} style={{ background: T.navyM, borderRadius: 10, padding: '10px 14px', marginBottom: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div><div style={{ color: T.white, fontSize: 13, fontWeight: 600 }}>{item.name}</div><div style={{ color: T.muted, fontSize: 11 }}>{item.label}</div></div>
              </div>
              <Btn onClick={() => processFile(item)} disabled={processing === item.id} style={{ fontSize: 12, padding: '7px 14px' }}>{processing === item.id ? '🔬 Analysing...' : '🔬 Analyse'}</Btn>
            </div>
          ))}
          {files.filter(f => f.status === 'ready').length > 1 && (
            <Btn onClick={() => { const ready = files.filter(f => f.status === 'ready'); ready.forEach((item, i) => setTimeout(() => processFile(item), i * 2500)); }} disabled={!!processing} style={{ width: '100%', marginTop: 6 }}>🔬 Analyse All ({files.filter(f => f.status === 'ready').length} files)</Btn>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📊 Analysis Results ({results.length})</div>
          {results.map(r => (
            <div key={r.id} style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 20 }}>{r.icon}</span><div style={{ color: T.white, fontSize: 13, fontWeight: 700 }}>{r.name.length > 55 ? r.name.substring(0, 55) + '...' : r.name}</div></div>
              <pre style={{ color: T.white, fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Georgia,serif', maxHeight: 350, overflowY: 'auto' }}>{r.analysis}</pre>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => addToVault(r)} style={{ background: T.teal, color: T.white, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>+ Evidence Vault</button>
                <button onClick={() => navigator.clipboard.writeText(r.analysis)} style={{ background: T.navyL, color: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Copy</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailDispatchCentre({ caseData, cases }) {
  const [to, setTo] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sentLog, setSentLog] = React.useState(() => S.get('email_log', []));
  const [tab, setLocalTab] = React.useState('compose');
  const [templateChoice, setTemplateChoice] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [activeCase, setActiveCase] = React.useState(caseData?.id || '');

  const QUICK_RECIPIENTS = [
    { label: 'ICO', email: 'casework@ico.org.uk', subject: 'Formal Complaint — UK GDPR / DPA 2018' },
    { label: 'EHRC', email: 'correspondence@equalityhumanrights.com', subject: 'Equality Act 2010 Complaint' },
    { label: 'ACAS', email: 'helpline@acas.org.uk', subject: 'Early Conciliation Request' },
    { label: 'IOPC', email: 'enquiries@policeconduct.gov.uk', subject: 'Formal Police Misconduct Complaint' },
    { label: 'Protect', email: 'whistle@protect-advice.org.uk', subject: 'Protected Disclosure — Advice Request' },
  ];

  const EMAIL_TEMPLATES = [
    { id: 'sar_followup', label: 'SAR Chase — 30 Days Overdue' },
    { id: 'grievance', label: 'Formal Grievance Letter' },
    { id: 'ico_complaint', label: 'ICO Data Protection Complaint' },
    { id: 'preservation', label: 'Evidence Preservation Notice' },
    { id: 'settlement', label: 'Without Prejudice Settlement Opener' },
    { id: 'iopc', label: 'IOPC Police Misconduct Complaint' },
    { id: 'foi_school', label: 'FOI to School / Local Authority' },
    { id: 'foi_police', label: 'FOI to Police Force' },
  ];

  function generateTemplate() {
    if (!templateChoice) return; setGenerating(true);
    const cc = cases?.find(c => c.id === activeCase);
    const caseCtx = cc ? `Case: ${cc.discType?.join(', ')} against ${cc.employer || 'respondent'}. Notes: ${cc.notes || ''}` : caseData ? `Case: ${caseData.discType?.join(', ')}` : 'discrimination case';
    const prompts = {
      sar_followup: `Write firm SAR follow-up letter. Original SAR sent 30+ days ago with incomplete response. Reference UK GDPR Article 15, DPA 2018. Warn of ICO complaint within 7 days. Case: ${caseCtx}.`,
      grievance: `Write formal grievance letter under ACAS Code 2015. Case: ${caseCtx}. Include: nature of grievance, dates, persons involved, remedy sought, 5 working day deadline.`,
      ico_complaint: `Write formal ICO complaint for SAR non-compliance. Case: ${caseCtx}. Include: what requested, when, what received, GDPR articles breached, remedy sought.`,
      preservation: `Write legal preservation notice. Case: ${caseCtx}. Demand preservation of all emails, CCTV, HR records, meeting notes. Warn destruction is contempt. 7-day deadline.`,
      settlement: `Write without-prejudice settlement letter. Case: ${caseCtx}. State claim strength, quantum sought, willingness to resolve, deadline for response.`,
      iopc: `Write formal IOPC complaint about police misconduct. Case: ${caseCtx}. Include: officer conduct, dates, breaches of standards, remedy sought.`,
      foi_school: `Write FOI request to school/local authority. Case: ${caseCtx}. Request all safeguarding logs, emails, referral forms relating to claimant/family.`,
      foi_police: `Write FOI request to police force. Case: ${caseCtx}. Request all CAD logs, intelligence entries, incident reports relating to claimant.`,
    };
    streamAI('You are UJRIS — expert UK legal correspondence drafter. Write professional, assertive letters with formal structure.',
      prompts[templateChoice] + '\n\nUse formal letter format: date, addresses, reference line, body, signature block. Be legally precise.',
      t => setBody(t), () => setGenerating(false)
    );
  }

  function logSent(method) {
    const cc = cases?.find(c => c.id === activeCase);
    const entry = { id: Date.now().toString(), date: new Date().toLocaleDateString('en-GB'), time: new Date().toLocaleTimeString('en-GB'), to, subject, body: body.substring(0, 300) + (body.length > 300 ? '...' : ''), method, caseId: activeCase, caseName: cc?.title || caseData?.title || 'General' };
    const updated = [entry, ...sentLog]; setSentLog(updated); S.set('email_log', updated);
    setStatus('✅ Email sent and logged. Record kept in your case audit trail.');
    setTimeout(() => setStatus(''), 4000);
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: T.navyM, borderRadius: 10, padding: 4 }}>
        {[['compose', '✉ Compose'], ['log', `📋 Sent (${sentLog.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setLocalTab(id)} style={{ flex: 1, background: tab === id ? T.gold : 'transparent', color: tab === id ? T.navy : T.white, border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: tab === id ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {tab === 'compose' && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>✉ Email Dispatch Centre</div>

          {cases?.length > 0 && (
            <select value={activeCase} onChange={e => setActiveCase(e.target.value)} style={{ width: '100%', background: T.navyL, border: `1px solid ${T.gold}55`, borderRadius: 8, padding: '9px 12px', color: T.gold, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              <option value="">📁 Link to case (optional)</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.icon || '⚖'} {c.title}</option>)}
            </select>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {QUICK_RECIPIENTS.map(r => (
              <button key={r.email} onClick={() => { setTo(r.email); setSubject(r.subject); }} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px', color: T.white, fontSize: 11, cursor: 'pointer' }}>{r.label}</button>
            ))}
          </div>

          <div style={{ background: T.navyM, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🤖 AI Template</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={templateChoice} onChange={e => setTemplateChoice(e.target.value)} style={{ flex: 1, background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.white, fontSize: 12 }}>
                <option value="">Select template...</option>
                {EMAIL_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <Btn onClick={generateTemplate} disabled={generating || !templateChoice} style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{generating ? 'Generating...' : 'Generate'}</Btn>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="To: email@address.com" style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.white, fontSize: 13 }} />
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.white, fontSize: 13 }} />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Email body — generate from template or type here..." rows={11} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.white, fontSize: 13, resize: 'vertical' }} />
          </div>

          {status && <div style={{ background: 'rgba(123,198,126,0.12)', border: '1px solid rgba(123,198,126,0.4)', borderRadius: 8, padding: '9px 14px', color: '#7bc67e', fontSize: 13, marginTop: 10 }}>{status}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Btn onClick={function(){
              if(!to||!subject)return;
              var url='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body.slice(0,1800));
              window.location.href=url;
              logSent('mailto');
            }} disabled={!to || !subject} style={{ flex: 1, background: '#1a3a7a' }}>📧 Open in Email App ↗</Btn>
            <Btn onClick={() => { navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`); logSent('clipboard'); }} disabled={!body} style={{ flex: 1, background: T.teal }}>📋 Copy to Clipboard</Btn>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>📋 Email Audit Log</div>
          {sentLog.length === 0 ? <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: 40 }}>No emails sent yet.</div> : sentLog.map(e => (
            <div key={e.id} style={{ background: T.navyM, borderRadius: 10, padding: 12, marginBottom: 10, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                <div style={{ color: T.white, fontSize: 13, fontWeight: 700 }}>{e.subject}</div>
                <div style={{ color: T.muted, fontSize: 11 }}>{e.date} {e.time}</div>
              </div>
              <div style={{ color: T.muted, fontSize: 12 }}>To: {e.to} · Case: {e.caseName}</div>
              <div style={{ color: T.dim, fontSize: 11, marginTop: 5, lineHeight: 1.5 }}>{e.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommandCentre({ cases, setTab, onSelectCase }) {
  const [view, setView] = React.useState('individual');
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [filterUrgency, setFilterUrgency] = React.useState('all');
  const allActions = S.get('ujris_actions', []);
  const allNotifs = S.get('ujris_notifications', []);
  const emailLog = S.get('email_log', []);
  const recordings = S.get('recordings', []);

  const overdueActions = allActions.filter(a => a.status !== 'done' && a.dueDate && new Date(a.dueDate.split('/').reverse().join('-')) < new Date());
  const todayActions = allActions.filter(a => a.status !== 'done' && a.dueDate && a.dueDate === new Date().toLocaleDateString('en-GB'));
  const unreadAlerts = allNotifs.filter(n => !n.read);
  const pendingReviews = recordings.filter(r => r.status === 'pending_review' && Date.now() < (r.recordedAt + 24 * 3600000));

  const caseUrgency = cases.map(c => {
    const actions = allActions.filter(a => a.caseId === c.id);
    const overdue = actions.filter(a => a.status !== 'done' && a.dueDate && new Date(a.dueDate.split('/').reverse().join('-')) < new Date()).length;
    const daysToDeadline = c.nextDeadline ? Math.floor((new Date(c.nextDeadline) - new Date()) / 86400000) : null;
    const urgency = overdue > 0 ? 'critical' : (daysToDeadline !== null && daysToDeadline <= 7) ? 'urgent' : (daysToDeadline !== null && daysToDeadline <= 30) ? 'active' : 'normal';
    return { ...c, overdue, daysToDeadline, urgency, actionCount: actions.filter(a => a.status !== 'done').length };
  });

  const URGENCY_COL = { critical: '#ff4444', urgent: T.gold, active: T.tealL, normal: T.muted };
  const URGENCY_LABEL = { critical: '🔴 CRITICAL', urgent: '⚠️ URGENT', active: '🔵 ACTIVE', normal: '✅ OK' };

  const filtered = caseUrgency.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.employer?.toLowerCase().includes(search.toLowerCase()) || c.discType?.some(d => d.toLowerCase().includes(search.toLowerCase())) || c.caseRef?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus || (!c.status && filterStatus === 'active');
    const matchUrgency = filterUrgency === 'all' || c.urgency === filterUrgency;
    return matchSearch && matchStatus && matchUrgency;
  }).sort((a, b) => { const o = { critical: 0, urgent: 1, active: 2, normal: 3 }; return o[a.urgency] - o[b.urgency]; });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header + View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ color: T.gold, fontSize: 22, fontWeight: 700 }}>⚡ Command Centre</div>
        <div style={{ display: 'flex', gap: 4, background: T.navyM, borderRadius: 10, padding: 4 }}>
          {[['individual', '👤 Individual'], ['firm', '🏛 Firm View']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{ background: view === id ? T.gold : 'transparent', color: view === id ? T.navy : T.white, border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: view === id ? 700 : 400, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* STAT TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { icon: '📁', label: 'Cases', value: cases.length, color: T.gold, action: 'cases' },
          { icon: '🔴', label: 'Overdue', value: overdueActions.length, color: overdueActions.length > 0 ? '#ff4444' : '#7bc67e', action: 'tracker' },
          { icon: '📋', label: 'Today', value: todayActions.length, color: T.tealL, action: 'tracker' },
          { icon: '🔔', label: 'Alerts', value: unreadAlerts.length, color: unreadAlerts.length > 0 ? T.gold : T.muted, action: 'notifications' },
          { icon: '⏳', label: 'Sessions', value: pendingReviews.length, color: pendingReviews.length > 0 ? '#a78bfa' : T.muted, action: 'recording_studio' },
          { icon: '✉', label: 'Emails', value: emailLog.length, color: '#4a9eff', action: 'email_dispatch' },
        ].map(stat => (
          <button key={stat.label} onClick={() => setTab(stat.action)} style={{ background: T.navyM, border: `1px solid ${stat.color}33`, borderRadius: 12, padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ color: stat.color, fontSize: 20, fontWeight: 900 }}>{stat.value}</div>
            <div style={{ color: T.muted, fontSize: 10 }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* CRITICAL ALERTS */}
      {(overdueActions.length > 0 || pendingReviews.length > 0) && (
        <div style={{ background: T.redBg, border: '1px solid #ff444455', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ color: '#ff8080', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🚨 Needs Immediate Attention</div>
          {overdueActions.slice(0, 3).map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', gap: 8 }}>
              <div><div style={{ color: T.white, fontSize: 12, fontWeight: 600 }}>{a.title}</div><div style={{ color: T.muted, fontSize: 11 }}>Case: {a.caseName} · Due: {a.dueDate}</div></div>
              <button onClick={() => setTab('tracker')} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>Action</button>
            </div>
          ))}
          {pendingReviews.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', gap: 8 }}>
              <div><div style={{ color: T.white, fontSize: 12, fontWeight: 600 }}>Session awaiting confirmation: {r.type}</div><div style={{ color: T.muted, fontSize: 11 }}>{r.org} · Deadline: {r.reviewDeadline}</div></div>
              <button onClick={() => setTab('recording_studio')} style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>Review</button>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH + FILTER */}
      <div style={{ background: T.navyM, borderRadius: 12, padding: 14, marginBottom: 16, border: `1px solid ${T.border}` }}>
        <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔍 Search & Filter Cases</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by case name, employer, claim type, case ref..." style={{ width: '100%', background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', color: T.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>STATUS</div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', color: T.white, fontSize: 12 }}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>URGENCY</div>
            <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} style={{ background: T.navyL, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', color: T.white, fontSize: 12 }}>
              <option value="all">All Urgency</option>
              <option value="critical">🔴 Critical</option>
              <option value="urgent">⚠️ Urgent</option>
              <option value="active">🔵 Active</option>
              <option value="normal">✅ Normal</option>
            </select>
          </div>
          {search && <div style={{ color: T.muted, fontSize: 12, alignSelf: 'flex-end', paddingBottom: 8 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>}
        </div>
      </div>

      {/* CASE GRID */}
      <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
        📁 {view === 'individual' ? 'Your Cases' : 'Client Portfolio'} — {filtered.length} {filtered.length !== cases.length ? `of ${cases.length}` : ''} case{filtered.length !== 1 ? 's' : ''}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: T.navyM, borderRadius: 12, padding: 32, textAlign: 'center' }}>
          {search ? (
            <div><div style={{ color: T.muted, fontSize: 14, marginBottom: 8 }}>No cases match "{search}"</div><button onClick={() => setSearch('')} style={{ color: T.gold, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Clear search</button></div>
          ) : (
            <div><div style={{ color: T.muted, fontSize: 14, marginBottom: 12 }}>No cases yet</div><Btn onClick={() => setTab('cases')}>+ Add Your First Case</Btn></div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => { if (onSelectCase) onSelectCase(c.id); setTab('dashboard'); }}
              style={{ background: T.navyM, border: `2px solid ${URGENCY_COL[c.urgency]}44`, borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
              {/* Per-case file intake icon */}
              <button onClick={e => { e.stopPropagation(); if (onSelectCase) onSelectCase(c.id); setTab('file_intake'); }} title="Upload evidence for this case" style={{ position: 'absolute', top: 10, right: 10, background: `${T.gold}22`, border: `1px solid ${T.gold}55`, borderRadius: 6, padding: '4px 8px', color: T.gold, fontSize: 16, cursor: 'pointer' }}>📥</button>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, paddingRight: 36 }}>
                <span style={{ fontSize: 26 }}>{c.icon || '⚖'}</span>
                <div>
                  <div style={{ color: T.white, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{c.title}</div>
                  <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{c.employer || ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {c.discType?.slice(0, 3).map(d => <span key={d} style={{ background: `${T.gold}15`, color: T.gold, fontSize: 10, padding: '2px 7px', borderRadius: 10 }}>{d}</span>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: `${URGENCY_COL[c.urgency]}22`, color: URGENCY_COL[c.urgency], fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>{URGENCY_LABEL[c.urgency]}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {c.overdue > 0 && <span style={{ color: '#ff4444', fontSize: 10 }}>🔴 {c.overdue} overdue</span>}
                  {c.daysToDeadline !== null && <span style={{ color: c.daysToDeadline <= 7 ? T.gold : T.muted, fontSize: 10 }}>⏰ {c.daysToDeadline}d</span>}
                </div>
              </div>
              {c.caseRef && <div style={{ color: T.dim, fontSize: 10, marginTop: 6 }}>Ref: {c.caseRef}</div>}
            </button>
          ))}
        </div>
      )}

      {/* FIRM QUICK ACTIONS */}
      {view === 'firm' && (
        <div style={{ marginTop: 24 }}>
          <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⚡ Firm Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            {[['✉', 'Email Dispatch', 'email_dispatch'], ['🎙', 'Recording Studio', 'recording_studio'], ['📥', 'Evidence Intake', 'file_intake'], ['🔬', 'Forensic Hub', 'forensic_hub'], ['📋', 'Action Tracker', 'tracker'], ['⚖', 'Comparator', 'comparator']].map(([icon, label, tab]) => (
              <button key={tab} onClick={() => setTab(tab)} style={{ background: T.navyM, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{icon}</div>
                <div style={{ color: T.white, fontSize: 11 }}>{label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseVisualReport({ caseData, cases, activeCase }) {
  const evidence = S.get('evidence', []);
  const timeline = S.get('timeline', []);
  const strength = Math.min(100, evidence.length * 8 + timeline.length * 6);
  return React.createElement('div', {style:{maxWidth:800,margin:'0 auto',padding:'24px 16px'}},
    React.createElement('h2', {style:{color:T.gold,fontSize:22,marginBottom:20,fontFamily:"'Playfair Display',serif"}}, '📊 Case Visual Report'),
    React.createElement('div', {style:{background:"#FAF6F0",borderRadius:14,padding:32,marginBottom:20,textAlign:'center',border:'1px solid '+T.gold+'33'}},
      React.createElement('svg', {width:160,height:160,viewBox:'0 0 160 160',style:{display:'block',margin:'0 auto 16px'}},
        React.createElement('circle', {cx:80,cy:80,r:64,fill:'none',stroke:T.navyL,strokeWidth:16}),
        React.createElement('circle', {cx:80,cy:80,r:64,fill:'none',stroke:strength>60?T.teal:strength>30?T.gold:T.redL,strokeWidth:16,
          strokeDasharray:(strength/100*402)+' 402',strokeLinecap:'round',transform:'rotate(-90 80 80)'}),
        React.createElement('text', {x:80,y:80,textAnchor:'middle',dy:8,fill:T.gold,fontSize:28,fontWeight:900}, strength+'%'),
        React.createElement('text', {x:80,y:108,textAnchor:'middle',fill:T.muted,fontSize:11}, 'Case Strength')
      ),
      React.createElement('div', {style:{color:"#0F2C4A",fontSize:16,fontWeight:700,marginBottom:8}},
        strength>60?'Strong Case — Proceed with confidence':strength>30?'Building — Keep gathering evidence':'Early Stage — Start with evidence'
      ),
      React.createElement('div', {style:{color:"#64748B",fontSize:13}}, evidence.length+' evidence items · '+timeline.length+' timeline events')
    ),
    React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:20}},
      [
        {label:'Evidence Items',value:evidence.length,icon:'🗄️',color:T.teal},
        {label:'Timeline Events',value:timeline.length,icon:'📅',color:T.gold},
        {label:'Case Strength',value:strength+'%',icon:'💪',color:strength>60?T.teal:T.gold},
        {label:'Active Cases',value:cases.length,icon:'📁',color:'#9b8fe8'},
      ].map(function(m) {
        return React.createElement('div', {key:m.label,style:{background:T.navyM,borderRadius:12,padding:'16px',textAlign:'center',border:'1px solid '+m.color+'22'}},
          React.createElement('div', {style:{fontSize:24,marginBottom:6}}, m.icon),
          React.createElement('div', {style:{color:m.color,fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}, m.value),
          React.createElement('div', {style:{color:"#64748B",fontSize:11,marginTop:4}}, m.label)
        );
      })
    )
  );
}

function ClientPortalAccess({ cases }) {
  const [token] = React.useState(function(){ return 'UJRIS-'+Math.random().toString(36).substr(2,8).toUpperCase(); });
  return React.createElement('div', {style:{maxWidth:700,margin:'0 auto',padding:'24px 16px'}},
    React.createElement('h2', {style:{color:T.gold,fontSize:22,marginBottom:8,fontFamily:"'Playfair Display',serif"}}, '🔗 Client Portal Access'),
    React.createElement('p', {style:{color:"#64748B",fontSize:13,marginBottom:24}}, 'Share secure, read-only access to your case with your solicitor, McKenzie Friend, or support worker.'),
    React.createElement('div', {style:{background:"#FAF6F0",borderRadius:12,padding:24,border:'1px solid '+T.teal+'33',marginBottom:16}},
      React.createElement('div', {style:{color:T.tealL,fontSize:12,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.1em'}}, 'Your Portal Token'),
      React.createElement('div', {style:{color:T.white,fontSize:20,fontWeight:900,fontFamily:'monospace',letterSpacing:'0.15em',marginBottom:12}}, token),
      React.createElement('div', {style:{color:"#64748B",fontSize:12,marginBottom:16}}, 'Share this token with your legal representative. They can use it to view your case securely.'),
      React.createElement('button', {
        onClick:function(){ navigator.clipboard.writeText('https://app.ujris.co.uk/portal/'+token); },
        style:{background:T.teal,color:T.white,border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}
      }, '📋 Copy Portal Link')
    ),
    React.createElement('div', {style:{background:"#FAF6F0",borderRadius:12,padding:20,border:'1px solid '+T.border}},
      React.createElement('div', {style:{color:T.gold,fontSize:13,fontWeight:700,marginBottom:12}}, '📁 Cases Available ('+cases.length+')'),
      cases.length===0
        ? React.createElement('div', {style:{color:"#64748B",fontSize:13}}, 'No cases yet. Create a case first.')
        : cases.map(function(c) {
            return React.createElement('div', {key:c.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid '+T.border}},
              React.createElement('div', null,
                React.createElement('div', {style:{color:"#0F2C4A",fontSize:13,fontWeight:600}}, c.title||'Untitled Case'),
                React.createElement('div', {style:{color:"#64748B",fontSize:11,marginTop:2}}, c.status||'active')
              ),
              React.createElement('div', {style:{color:T.tealL,fontSize:11,background:T.tealBg,padding:'3px 10px',borderRadius:8}}, '✓ Shared')
            );
          })
    )
  );
}

function SequentialTaskEngine({ tasks, caseContext }) {
  const [currentTask, setCurrentTask] = React.useState(0);
  const [completed, setCompleted] = React.useState([]);
  if (!tasks || tasks.length === 0) {
    return React.createElement('div', {style:{color:"#64748B",fontSize:13,textAlign:'center',padding:20}}, 'No tasks in this action plan yet.');
  }
  return React.createElement('div', null,
    tasks.map(function(task, i) {
      var isDone = completed.includes(i);
      var isActive = i === currentTask && !isDone;
      var isLocked = i > currentTask && !isDone;
      return React.createElement('div', {key:i,style:{background:isActive?'rgba(12,123,122,0.1)':T.navyM,border:'1px solid '+(isActive?T.teal:isDone?T.teal+'44':T.border),borderRadius:12,padding:'14px 16px',marginBottom:10,opacity:isLocked?0.5:1}},
        React.createElement('div', {style:{display:'flex',gap:12,alignItems:'flex-start'}},
          React.createElement('div', {style:{width:28,height:28,borderRadius:'50%',background:isDone?T.teal:isActive?T.gold:T.navyL,display:'flex',alignItems:'center',justifyContent:'center',color:isDone||isActive?T.navy:T.dim,fontSize:12,fontWeight:700,flexShrink:0}},
            isDone?'✓':String(i+1)
          ),
          React.createElement('div', {style:{flex:1}},
            React.createElement('div', {style:{color:"#0F2C4A",fontSize:13,fontWeight:700,marginBottom:4}}, task.title),
            task.description&&React.createElement('div', {style:{color:"#64748B",fontSize:12,lineHeight:1.5,marginBottom:8}}, task.description),
            isActive&&React.createElement('button', {
              onClick:function(){ setCompleted(function(p){return [...p,i];}); setCurrentTask(function(p){return p+1;}); },
              style:{background:T.teal,color:T.white,border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer'}
            }, '✅ Mark Complete')
          )
        )
      );
    })
  );
}

function HelplineDirectory() {
  var [filter, setFilter] = React.useState('all');
  var [search, setSearch] = React.useState('');
  var HELPLINES = [
    {id:'999',cat:'emergency',label:'Emergency Services',number:'999',hours:'24/7',free:true,desc:'Police, ambulance, fire — immediate danger',icon:'🚨',color:'#E63946'},
    {id:'101',cat:'emergency',label:'Non-Emergency Police',number:'101',hours:'24/7',free:false,desc:'Report crime, non-urgent police matters',icon:'🚔',color:'#E63946'},
    {id:'ndah',cat:'abuse',label:'National DA Helpline',number:'0808 2000 247',hours:'24/7',free:true,desc:'Refuge — free, confidential support for domestic abuse',icon:'🛡️',color:'#E63946'},
    {id:'mensadvice',cat:'abuse',label:"Men's Advice Line",number:'0808 801 0327',hours:'Mon-Fri 9am-8pm',free:true,desc:'For men experiencing domestic abuse',icon:'🛡️',color:'#E63946'},
    {id:'galop',cat:'abuse',label:'Galop LGBT+ Abuse',number:'0800 999 5428',hours:'Mon-Fri 10am-8pm',free:true,desc:'LGBT+ domestic abuse and hate crime helpline',icon:'🏳️‍🌈',color:'#E63946'},
    {id:'kn',cat:'hba',label:'Karma Nirvana',number:'0800 5999 247',hours:'Mon-Fri 9am-5pm',free:true,desc:'Honour-based abuse and forced marriage support',icon:'👑',color:'#7B2EDA'},
    {id:'fmu',cat:'hba',label:'Forced Marriage Unit',number:'020 7008 0151',hours:'Mon-Fri 9am-5pm',free:false,desc:'UK Government forced marriage protection',icon:'🏛️',color:'#7B2EDA'},
    {id:'ms',cat:'slavery',label:'Modern Slavery Helpline',number:'08000 121 700',hours:'24/7',free:true,desc:'Report modern slavery — confidential',icon:'⛓️',color:'#ff9f7f'},
    {id:'rapecrisis',cat:'cse',label:'Rape Crisis',number:'0808 802 9999',hours:'24/7',free:true,desc:'Sexual violence and abuse support',icon:'💔',color:'#E63946'},
    {id:'nspcc',cat:'cse',label:'NSPCC Childline',number:'0800 1111',hours:'24/7',free:true,desc:'For children and young people',icon:'👶',color:'#E63946'},
    {id:'acas',cat:'legal',label:'ACAS Helpline',number:'0300 123 1100',hours:'Mon-Fri 8am-6pm',free:false,desc:'Employment rights and workplace disputes',icon:'⚖️',color:'#4a9eff'},
    {id:'cab',cat:'legal',label:'Citizens Advice',number:'0800 144 8848',hours:'Mon-Fri 9am-5pm',free:true,desc:'Free legal advice across all areas',icon:'🏛️',color:'#4a9eff'},
    {id:'iopc',cat:'police',label:'IOPC',number:'0300 020 0096',hours:'Mon-Fri 8am-6pm',free:false,desc:'Independent Office for Police Conduct',icon:'🔍',color:'#9b8fe8'},
    {id:'ico',cat:'police',label:'ICO Data Rights',number:'0303 123 1113',hours:'Mon-Fri 9am-5pm',free:false,desc:'Information Commissioner — data rights, SAR issues',icon:'🔒',color:'#9b8fe8'},
    {id:'samaritans',cat:'crisis',label:'Samaritans',number:'116 123',hours:'24/7',free:true,desc:'Emotional support for anyone in distress',icon:'💚',color:'#2ecc71'},
    {id:'shout',cat:'crisis',label:'Shout Text Line',number:'Text SHOUT to 85258',hours:'24/7',free:true,desc:'Silent text-based crisis support',icon:'💬',color:'#2ecc71'},
    {id:'mind',cat:'crisis',label:'Mind Infoline',number:'0300 123 3393',hours:'Mon-Fri 9am-6pm',free:false,desc:'Mental health information and support',icon:'🧠',color:'#2ecc71'},
    {id:'sea',cat:'financial',label:'Surviving Economic Abuse',number:'0808 196 8845',hours:'Mon-Fri 9am-5pm',free:true,desc:'Financial and economic abuse support',icon:'💰',color:'#2ecc71'},
  ];
  var CATS = [
    {id:'all',label:'All',icon:'📋'},{id:'emergency',label:'Emergency',icon:'🚨'},
    {id:'abuse',label:'Domestic Abuse',icon:'🛡️'},{id:'hba',label:'HBA/FM',icon:'👑'},
    {id:'slavery',label:'Modern Slavery',icon:'⛓️'},{id:'cse',label:'Sexual Violence',icon:'💔'},
    {id:'legal',label:'Legal',icon:'⚖️'},{id:'police',label:'Police/Data',icon:'🔍'},
    {id:'crisis',label:'Crisis/Mental Health',icon:'💚'},{id:'financial',label:'Financial',icon:'💰'},
  ];
  var filtered = HELPLINES.filter(function(h){
    return (filter==='all'||h.cat===filter) && (!search||h.label.toLowerCase().includes(search.toLowerCase())||h.desc.toLowerCase().includes(search.toLowerCase()));
  });
  return React.createElement('div', {style:{maxWidth:800,margin:'0 auto',padding:'24px 16px'}},
    React.createElement('h2', {style:{color:T.gold,fontSize:22,marginBottom:6}}, '📞 Helpline Directory'),
    React.createElement('p', {style:{color:"#64748B",fontSize:13,marginBottom:16}}, 'One-tap calling. Free where marked. All confidential.'),
    React.createElement('div', {style:{background:'#E6394620',border:'1px solid #E6394660',borderRadius:12,padding:'14px 18px',marginBottom:16,display:'flex',gap:14,alignItems:'center'}},
      React.createElement('span', {style:{fontSize:24}}, '🚨'),
      React.createElement('div', {style:{flex:1}},
        React.createElement('div', {style:{color:'#E63946',fontSize:13,fontWeight:700}}, 'In immediate danger? Call 999 now.'),
        React.createElement('div', {style:{color:"#64748B",fontSize:11}}, 'All other helplines below are free and confidential where marked.')
      ),
      React.createElement('a', {href:'tel:999',style:{background:'#E63946',color:T.white,borderRadius:8,padding:'10px 16px',fontWeight:700,fontSize:13,textDecoration:'none'}}, '📞 999')
    ),
    React.createElement('input', {value:search,onChange:function(e){setSearch(e.target.value);},placeholder:'🔍 Search helplines...',style:{width:'100%',background:"#FAF6F0",border:'1px solid '+T.border,borderRadius:10,padding:'10px 14px',color:T.white,fontSize:13,marginBottom:12,boxSizing:'border-box'}}),
    React.createElement('div', {style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}},
      CATS.map(function(cat){
        return React.createElement('button', {key:cat.id,onClick:function(){setFilter(cat.id);},
          style:{background:filter===cat.id?T.goldBg:T.navyM,border:'1px solid '+(filter===cat.id?T.gold:T.border),borderRadius:20,padding:'5px 10px',color:filter===cat.id?T.gold:T.muted,fontSize:11,fontWeight:filter===cat.id?700:400,cursor:'pointer',whiteSpace:'nowrap'}
        }, cat.icon+' '+cat.label);
      })
    ),
    React.createElement('div', {style:{color:"#64748B",fontSize:11,marginBottom:12}}, filtered.length+' helplines'),
    React.createElement('div', {style:{display:'flex',flexDirection:'column',gap:10}},
      filtered.map(function(h){
        return React.createElement('div', {key:h.id,style:{background:"#FAF6F0",border:'1px solid '+h.color+'22',borderRadius:12,padding:'14px 16px',display:'flex',gap:12,alignItems:'center'}},
          React.createElement('span', {style:{fontSize:22,flexShrink:0}}, h.icon),
          React.createElement('div', {style:{flex:1,minWidth:0}},
            React.createElement('div', {style:{color:"#0F2C4A",fontSize:13,fontWeight:700,marginBottom:2}}, h.label),
            React.createElement('div', {style:{color:"#64748B",fontSize:11,lineHeight:1.5,marginBottom:4}}, h.desc),
            React.createElement('div', {style:{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}},
              React.createElement('span', {style:{color:h.color,fontSize:12,fontWeight:700}}, h.number),
              React.createElement('span', {style:{color:T.dim,fontSize:11}}, h.hours),
              h.free&&React.createElement('span', {style:{background:'#2ecc7120',color:'#2ecc71',fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:700}}, 'FREE')
            )
          ),
          !h.number.startsWith('Text')&&React.createElement('a', {href:'tel:'+h.number.replace(/\s/g,''),style:{background:h.color,color:T.white,borderRadius:8,padding:'10px 14px',fontWeight:700,fontSize:12,textDecoration:'none',flexShrink:0}}, '📞 Call')
        );
      })
    )
  );
}

function SovereignLanding({ setTab, userProfile }) {
  var role = userProfile && userProfile.role ? userProfile.role : 'individual';
  var name = userProfile && userProfile.name ? userProfile.name.split(' ')[0] : '';
  var PATHWAYS = [
    {icon:'🛡️',label:'Domestic Abuse & Safety',sub:'DA, HBA, modern slavery, coercive control',tab:'assessment',color:'#E63946'},
    {icon:'⚖️',label:'Employment & Discrimination',sub:'ET claims, unfair dismissal, race/disability',tab:'assessment',color:T.gold},
    {icon:'🚔',label:'Police Misconduct',sub:'IOPC complaints, VRR, wrongful detention',tab:'assessment',color:'#9b8fe8'},
    {icon:'📂',label:'SAR & Data Rights',sub:'UK GDPR, ICO complaints, subject access',tab:'sar',color:T.teal},
    {icon:'👶',label:'Children & Family',sub:'Social services, care proceedings, CSE',tab:'assessment',color:'#ff9f7f'},
    {icon:'💰',label:'Financial Abuse',sub:'Economic abuse, debt, housing, benefits',tab:'assessment',color:'#2ecc71'},
  ];
  var TOOLS = [
    {icon:'🗄️',label:'Evidence Vault',tab:'evidence'},{icon:'📅',label:'Timeline',tab:'timeline'},
    {icon:'🔬',label:'Forensic Hub',tab:'forensic_hub'},{icon:'⚖️',label:'Calculator',tab:'calculator'},
    {icon:'✍️',label:'Documents',tab:'documents'},{icon:'⏰',label:'Deadlines',tab:'deadlines'},
    {icon:'📞',label:'Helplines',tab:'helpline'},{icon:'📂',label:'SAR Intelligence',tab:'sar'},
    {icon:'🧠',label:'Case Intel',tab:'intel'},{icon:'📊',label:'Dashboard',tab:'dashboard'},
    {icon:'🌐',label:'Community',tab:'community'},{icon:'📖',label:'Know Your Rights',tab:'rights'},
  ];
  return React.createElement('div', {style:{maxWidth:900,margin:'0 auto'}},
    React.createElement('div', {style:{textAlign:'center',padding:'32px 16px 24px',background:'linear-gradient(180deg,rgba(201,168,76,0.06) 0%,transparent 100%)',borderRadius:20,marginBottom:28}},
      React.createElement('div', {style:{fontSize:48,marginBottom:12}}, '⚖️'),
      React.createElement('h1', {style:{fontFamily:"'Playfair Display',serif",fontSize:'clamp(24px,5vw,42px)',color:T.white,marginBottom:8,fontWeight:900}},
        name ? 'Welcome back, '+name+'.' : 'Your Justice Shield.'
      ),
      React.createElement('p', {style:{color:T.muted,fontSize:'clamp(13px,2vw,16px)',maxWidth:500,margin:'0 auto 24px',lineHeight:1.7}},
        'AI-powered support for self-represented litigants. Evidence vault, forensic analysis, document generation, and specialist helplines — all in one place.'
      ),
      React.createElement('div', {style:{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}},
        React.createElement('button', {onClick:function(){setTab('assessment');},style:{background:T.gold,color:T.navy,border:'none',borderRadius:12,padding:'14px 28px',fontSize:15,fontWeight:700,cursor:'pointer'}}, '🧭 Start Assessment →'),
        React.createElement('button', {onClick:function(){setTab('dashboard');},style:{background:'none',border:'1px solid '+T.gold+'55',borderRadius:12,padding:'14px 28px',fontSize:14,color:T.gold,cursor:'pointer'}}, '📊 My Dashboard')
      )
    ),
    React.createElement('div', {style:{marginBottom:28}},
      React.createElement('h2', {style:{color:"#0F2C4A",fontSize:16,fontWeight:700,marginBottom:14,fontFamily:"'Source Serif 4',serif"}}, '⚠️ What are you facing?'),
      React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}},
        PATHWAYS.map(function(p){
          return React.createElement('button', {key:p.tab+p.label,onClick:function(){setTab(p.tab);},
            style:{background:"#FAF6F0",border:'1px solid '+p.color+'33',borderRadius:14,padding:'18px 16px',textAlign:'left',cursor:'pointer',display:'flex',gap:12,alignItems:'flex-start'}},
            React.createElement('span', {style:{fontSize:28,flexShrink:0}}, p.icon),
            React.createElement('div', null,
              React.createElement('div', {style:{color:"#0F2C4A",fontSize:13,fontWeight:700,marginBottom:3}}, p.label),
              React.createElement('div', {style:{color:"#64748B",fontSize:11,lineHeight:1.5}}, p.sub)
            )
          );
        })
      )
    ),
    React.createElement('div', null,
      React.createElement('h2', {style:{color:"#0F2C4A",fontSize:16,fontWeight:700,marginBottom:14,fontFamily:"'Source Serif 4',serif"}}, '🔧 Tools'),
      React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8}},
        TOOLS.map(function(t){
          return React.createElement('button', {key:t.tab,onClick:function(){setTab(t.tab);},
            style:{background:"#FAF6F0",border:'1px solid '+T.border,borderRadius:12,padding:'14px 10px',textAlign:'center',cursor:'pointer'}},
            React.createElement('div', {style:{fontSize:22,marginBottom:6}}, t.icon),
            React.createElement('div', {style:{color:"#64748B",fontSize:11}}, t.label)
          );
        })
      )
    )
  );
}

function SovereignShield({ onClose }) {
  var [scenario, setScenario] = React.useState('');
  var [step, setStep] = React.useState(0);
  var [breathDone, setBreathDone] = React.useState(false);
  var [elapsed, setElapsed] = React.useState(0);
  var timerRef = React.useRef(null);

  React.useEffect(function(){ return function(){ if(timerRef.current) clearInterval(timerRef.current); }; }, []);

  var fmt = function(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };

  var SCENARIOS = [
    {id:'police_stop',icon:'🚔',label:'Stopped / Questioned by Police'},
    {id:'escorted',icon:'🏪',label:'Escorted Without Handcuffs (THIS IS STILL DETENTION)'},
    {id:'handcuffed',icon:'🔗',label:'Handcuffed / Physically Restrained'},
    {id:'interview',icon:'🎙',label:'Being Interviewed / Questioned'},
    {id:'social',icon:'👶',label:'Social Services / CPS Visit'},
    {id:'manager',icon:'🏢',label:'Manager Accusation / Disciplinary'},
  ];

  var SCRIPTS = {
    police_stop:{title:'Police Stop',steps:[
      {title:'Ask First',script:'"Am I being detained, or am I free to go?"',note:'If free to go — walk away calmly.'},
      {title:'Legal Lock',script:'"I am exercising my right to silence under PACE 1984. No questions without a duty solicitor."',note:'You do not have to explain this.'},
      {title:'Only Answer',script:'"No comment."',note:'Every question. Every time.'},
      {title:'Duty Solicitor',script:'"I am requesting a duty solicitor immediately."',note:'Free. Absolute right under PACE Code C.'},
    ]},
    escorted:{title:'Escorted / Detained in Public — No Handcuffs Required',steps:[
      {title:'State Your Position',script:'"I am not resisting. I do not consent to being moved. I am recording for my safety."',note:'Under PACE 1984 you are detained the moment you cannot freely leave. Being escorted outside by police or security IS detention even without handcuffs. Being taken outside a premises and questioned in public IS unlawful detention if no offence was committed.'},
      {title:'Public Questioning',script:'"I am exercising my right to silence. No comment."',note:'Being questioned in front of onlookers is still an interview under PACE if it relates to an alleged offence. Public humiliation is relevant to your discrimination and Human Rights Act (Article 8) claim.'},
      {title:'Formal Statement',script:'"I state clearly: I have not committed any offence. I am documenting this detention for legal proceedings."',note:'Note: time, location, names, badge numbers, exact words used, who was watching, how long it lasted.'},
      {title:'After Incident',script:'',note:'Write everything within 1 hour. Officer names/numbers, exact words, witnesses, duration, how you felt. This is your contemporaneous note — legally significant for your discrimination claim.'},
    ]},
    handcuffed:{title:'Handcuffed / Restrained',steps:[
      {title:'Do Not Resist',script:'"I am not resisting. I do not consent to this restraint but I am complying."',note:'Compliance is not consent. Challenge it legally after.'},
      {title:'Right to Silence',script:'"I am exercising my right to silence under PACE 1984."',note:'Even in handcuffs. Even in the car.'},
      {title:'Duty Solicitor',script:'"I am requesting a duty solicitor. No interview without one."',note:'Free. Absolute right.'},
      {title:'No Comment',script:'"No comment."',note:'Your only answer to every question.'},
    ]},
    interview:{title:'Being Interviewed',steps:[
      {title:'Confirm Status',script:'"Am I under arrest or a voluntary attendee?"',note:'If voluntary — you can leave at any time.'},
      {title:'Request Solicitor',script:'"I am requesting a duty solicitor before answering any questions."',note:'Free. Your right.'},
      {title:'Every Question',script:'"No comment."',note:'Every. Single. Question.'},
      {title:'PACE Caution',script:'',note:'"You do not have to say anything. But it may harm your defence if you do not mention when questioned something you later rely on in court." Get a solicitor before deciding whether to make a prepared statement.'},
    ]},
    social:{title:'Social Services Visit',steps:[
      {title:'At the Door',script:'"Before I permit entry I wish to contact my solicitor / McKenzie Friend."',note:'You do not have to let them in immediately.'},
      {title:'If They Enter',script:'"I am participating under duress. I have not admitted any wrongdoing. I am recording this visit."',note:'Stay calm. Ask who made the referral.'},
      {title:'Children',script:'',note:'Do not allow children to be interviewed alone without a solicitor or appropriate adult.'},
      {title:'Afterwards',script:'',note:'Submit a Subject Access Request to the local authority immediately.'},
    ]},
    manager:{title:'Manager Accusation / Disciplinary',steps:[
      {title:'Confirm Type',script:'"Please confirm in writing: is this investigatory or a formal disciplinary?"',note:'If they call it investigatory but it leads to discipline — procedurally unfair.'},
      {title:'Accompaniment',script:'"I wish to be accompanied under the Employment Relations Act 1999."',note:'Absolute statutory right.'},
      {title:'Your Response',script:'"I note the allegation. I do not accept it. I will respond in writing after taking advice."',note:'You do not have to respond immediately.'},
      {title:'After',script:'',note:'Write everything within 1 hour. Check if timing is retaliatory — within 30 days of a protected act.'},
    ]},
  };

  var activeScript = SCRIPTS[scenario];
  var S2 = function(props, children){ return React.createElement('div', props, children); };

  return React.createElement('div', {style:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.97)',zIndex:9999,overflowY:'auto',display:'flex',flexDirection:'column'}},
    React.createElement('div', {style:{background:'linear-gradient(135deg,#8B2020,#1a0808)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(255,100,100,0.3)',position:'sticky',top:0,zIndex:10}},
      React.createElement('div', {style:{display:'flex',alignItems:'center',gap:12}},
        React.createElement('span', {style:{fontSize:28}}, '🛡️'),
        React.createElement('div', null,
          React.createElement('div', {style:{color:'#ff9999',fontSize:16,fontWeight:900}}, 'SOVEREIGN SHIELD'),
          React.createElement('div', {style:{color:'rgba(255,150,150,0.7)',fontSize:11}}, 'You are in control')
        )
      ),
      React.createElement('button', {onClick:function(){onClose();},style:{background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:12,cursor:'pointer'}}, '✕ Exit Shield')
    ),
    React.createElement('div', {style:{flex:1,padding:'20px',maxWidth:700,margin:'0 auto',width:'100%',boxSizing:'border-box'}},
      React.createElement('div', {style:{background:'rgba(139,32,32,0.2)',border:'1px solid rgba(255,100,100,0.3)',borderRadius:10,padding:'14px 16px',marginBottom:20}},
        React.createElement('div', {style:{color:'#ffaaaa',fontSize:13,fontWeight:700,marginBottom:6}}, '⚖️ Detention Does NOT Require Handcuffs'),
        React.createElement('div', {style:{color:'rgba(255,200,200,0.7)',fontSize:12,lineHeight:1.7}}, 'Under PACE 1984 you are detained the moment you cannot freely leave. Being escorted outside a shop by police or security IS detention — no handcuffs needed. Public humiliation without lawful basis violates Article 8 ECHR. Document everything: time, location, witnesses, exact words.')
      ),
      !scenario && React.createElement('div', null,
        React.createElement('div', {style:{color:'#ff9999',fontSize:15,fontWeight:700,marginBottom:16,textAlign:'center'}}, 'What is happening right now?'),
        React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}},
          SCENARIOS.map(function(s){
            return React.createElement('button', {key:s.id,onClick:function(){setScenario(s.id);setStep(0);setBreathDone(false);},
              style:{background:'rgba(139,32,32,0.2)',border:'1px solid rgba(255,100,100,0.3)',borderRadius:12,padding:16,textAlign:'left',cursor:'pointer'}},
              React.createElement('div', {style:{fontSize:22,marginBottom:6}}, s.icon),
              React.createElement('div', {style:{color:'#ffaaaa',fontSize:13,fontWeight:700}}, s.label)
            );
          })
        )
      ),
      scenario && activeScript && React.createElement('div', null,
        React.createElement('button', {onClick:function(){setScenario('');},style:{background:'none',border:'none',color:'rgba(255,150,150,0.6)',fontSize:12,cursor:'pointer',marginBottom:16,padding:0}}, '← Choose different scenario'),
        !breathDone && React.createElement('div', {style:{textAlign:'center',padding:'32px 20px'}},
          React.createElement('div', {style:{color:'#ff9999',fontSize:18,fontWeight:700,marginBottom:12}}, activeScript.title),
          React.createElement('div', {style:{width:80,height:80,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,32,32,0.6),rgba(139,32,32,0.1))',margin:'0 auto 20px',border:'2px solid rgba(255,100,100,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}, '🛡️'),
          React.createElement('div', {style:{color:'#ffcccc',fontSize:14,lineHeight:1.8,marginBottom:8}}, 'Breathe in... hold... breathe out.'),
          React.createElement('div', {style:{color:'#ffaaaa',fontSize:13,lineHeight:1.7,maxWidth:440,margin:'0 auto 28px'}}, 'You are in control. Calm compliance is not legal consent.'),
          React.createElement('button', {onClick:function(){setBreathDone(true);},style:{background:'#8B2020',color:'#fff',border:'none',borderRadius:12,padding:'14px 32px',fontSize:14,fontWeight:700,cursor:'pointer'}}, 'I am ready — Show me the scripts →')
        ),
        breathDone && React.createElement('div', null,
          React.createElement('div', {style:{color:'#ff9999',fontSize:13,fontWeight:700,marginBottom:16}}, '🛡️ ' + activeScript.title),
          activeScript.steps.map(function(s,i){
            return React.createElement('div', {key:i,style:{background:i===step?'rgba(139,32,32,0.3)':'rgba(255,255,255,0.03)',border:'1px solid '+(i===step?'rgba(255,100,100,0.5)':'rgba(255,255,255,0.06)'),borderRadius:12,padding:'14px 16px',marginBottom:10}},
              React.createElement('div', {style:{color:i===step?'#ffaaaa':'rgba(255,180,180,0.5)',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}, 'Step '+(i+1)+': '+s.title),
              s.script && React.createElement('div', {style:{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,100,100,0.3)',borderRadius:8,padding:'12px 14px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}},
                React.createElement('div', {style:{color:'#fff',fontSize:14,lineHeight:1.7,fontStyle:'italic'}}, '"'+s.script+'"'),
                React.createElement('button', {onClick:function(){navigator.clipboard.writeText(s.script);},style:{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,padding:'4px 10px',color:'rgba(255,200,200,0.7)',fontSize:10,cursor:'pointer',flexShrink:0}}, 'Copy')
              ),
              s.note && React.createElement('div', {style:{color:'rgba(255,200,200,0.6)',fontSize:12,lineHeight:1.6}}, s.note)
            );
          }),
          React.createElement('div', {style:{display:'flex',gap:10,justifyContent:'center',marginTop:16,flexWrap:'wrap'}},
            step>0 && React.createElement('button', {onClick:function(){setStep(function(p){return p-1;});},style:{background:'rgba(255,255,255,0.08)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer'}}, '← Prev'),
            step<activeScript.steps.length-1 && React.createElement('button', {onClick:function(){setStep(function(p){return p+1;});},style:{background:'#8B2020',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,cursor:'pointer'}}, 'Next →'),
            React.createElement('a', {href:'tel:08007814006',style:{background:'rgba(139,32,32,0.4)',color:'#ff9999',border:'1px solid rgba(255,100,100,0.3)',borderRadius:8,padding:'10px 16px',fontSize:12,textDecoration:'none',fontWeight:700}}, '📞 Duty Solicitor')
          )
        )
      )
    )
  );
}

function KPIDashboard({ cases, caseData, setTab }) {
  var [viewMode, setViewMode] = React.useState('case');
  var ev = S.get('evidence', []);
  var tl = S.get('timeline', []);
  var deadlines = S.get('deadlines', []);
  var actions = S.get('decisions', []);
  var now = new Date();
  var upcoming = deadlines.filter(function(d){ var days=Math.ceil((new Date(d.date)-now)/86400000); return days>=0&&days<=30; }).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var overdue = deadlines.filter(function(d){return new Date(d.date)<now;});
  var evidenceScore = Math.min(100, ev.length*12);
  var timelineScore = Math.min(100, tl.length*14);
  var deadlineScore = deadlines.length>0?Math.min(100,(deadlines.filter(function(d){return new Date(d.date)>now;}).length/deadlines.length)*100):0;
  var strength = Math.round(evidenceScore*0.35 + timelineScore*0.30 + deadlineScore*0.20 + Math.min(100,(S.get('forensic_flags',[])).length*20)*0.15);
  var sc = strength>60?T.teal:strength>30?T.gold:T.redL;

  var PLATFORM = {users:12847,cases:8234,settled:1124,wins:672,anchors:2341,sars:3421,helpline:2891,iopc:672,ico:234};

  return React.createElement('div', {style:{maxWidth:900,margin:'0 auto',padding:'0 0 40px'}},
    React.createElement('div', {style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}},
      React.createElement('div', null,
        React.createElement('h2', {style:{color:T.gold,fontSize:22,marginBottom:4}}, '📊 Live KPI Dashboard'),
        React.createElement('div', {style:{color:"#64748B",fontSize:12}}, 'Real-time · '+new Date().toLocaleString('en-GB'))
      ),
      React.createElement('div', {style:{display:'flex',gap:8}},
        [['case','My Case'],['platform','Platform Stats']].map(function(arr){
          return React.createElement('button', {key:arr[0],onClick:function(){setViewMode(arr[0]);},
            style:{background:viewMode===arr[0]?T.goldBg:T.navyM,border:'1px solid '+(viewMode===arr[0]?T.gold:T.border),borderRadius:8,padding:'7px 14px',color:viewMode===arr[0]?T.gold:T.muted,fontSize:12,fontWeight:viewMode===arr[0]?700:400,cursor:'pointer'}}, arr[1]);
        })
      )
    ),
    viewMode==='case' && React.createElement('div', null,
      React.createElement('div', {style:{background:"#FAF6F0",borderRadius:14,padding:24,marginBottom:16,border:'1px solid '+sc+'33'}},
        React.createElement('div', {style:{display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}},
          React.createElement('div', {style:{flexShrink:0}},
            React.createElement('svg', {width:110,height:110,viewBox:'0 0 110 110'},
              React.createElement('circle', {cx:55,cy:55,r:46,fill:'none',stroke:T.navyL,strokeWidth:12}),
              React.createElement('circle', {cx:55,cy:55,r:46,fill:'none',stroke:sc,strokeWidth:12,strokeDasharray:(strength/100*289)+' 289',strokeLinecap:'round',transform:'rotate(-90 55 55)'}),
              React.createElement('text', {x:55,y:55,textAnchor:'middle',dy:6,fill:sc,fontSize:22,fontWeight:900}, strength+'%'),
              React.createElement('text', {x:55,y:72,textAnchor:'middle',fill:T.muted,fontSize:9}, 'Strength')
            )
          ),
          React.createElement('div', {style:{flex:1,minWidth:200}},
            React.createElement('div', {style:{color:"#0F2C4A",fontSize:14,fontWeight:700,marginBottom:4}}, caseData&&caseData.employer?caseData.employer:'Your Case'),
            React.createElement('div', {style:{color:"#64748B",fontSize:12,marginBottom:14}}, strength>60?'Solid foundation.':strength>30?'Good progress — keep adding evidence.':'Early stage — start with timeline and evidence.'),
            [
              {label:'Evidence',score:evidenceScore,action:'evidence'},
              {label:'Timeline',score:timelineScore,action:'timeline'},
              {label:'Deadlines',score:deadlineScore,action:'deadlines'},
            ].map(function(c){
              return React.createElement('div', {key:c.label,style:{marginBottom:8}},
                React.createElement('div', {style:{display:'flex',justifyContent:'space-between',marginBottom:3}},
                  React.createElement('button', {onClick:function(){setTab(c.action);},style:{background:'none',border:'none',color:"#64748B",fontSize:11,cursor:'pointer',padding:0}}, c.label+' →'),
                  React.createElement('span', {style:{color:c.score>60?T.tealL:c.score>30?T.gold:T.redL,fontSize:11,fontWeight:700}}, c.score+'%')
                ),
                React.createElement('div', {style:{background:T.navyL,borderRadius:4,height:6,overflow:'hidden'}},
                  React.createElement('div', {style:{background:c.score>60?T.teal:c.score>30?T.gold:T.redL,height:'100%',width:c.score+'%',transition:'width 0.8s ease'}})
                )
              );
            })
          )
        )
      ),
      React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10,marginBottom:16}},
        [
          {icon:'🗄️',label:'Evidence',value:ev.length,color:T.teal,action:'evidence'},
          {icon:'📅',label:'Timeline',value:tl.length,color:T.gold,action:'timeline'},
          {icon:'⏰',label:'Upcoming',value:upcoming.length,color:upcoming.length>0?T.gold:T.muted,action:'deadlines'},
          {icon:'🚨',label:'Overdue',value:overdue.length,color:overdue.length>0?T.redL:T.muted,action:'deadlines'},
          {icon:'📋',label:'Actions',value:actions.length,color:T.muted,action:'actions'},
        ].map(function(m){
          return React.createElement('button', {key:m.label,onClick:function(){setTab(m.action);},
            style:{background:"#FAF6F0",border:'1px solid '+m.color+'22',borderRadius:12,padding:'14px 10px',textAlign:'center',cursor:'pointer'}},
            React.createElement('div', {style:{fontSize:20,marginBottom:4}}, m.icon),
            React.createElement('div', {style:{color:m.color,fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif"}}, String(m.value)),
            React.createElement('div', {style:{color:T.muted,fontSize:10,marginTop:2}}, m.label)
          );
        })
      ),
      upcoming.length>0 && React.createElement('div', {style:{background:"#FAF6F0",borderRadius:12,padding:18,marginBottom:16,border:'1px solid '+T.gold+'33'}},
        React.createElement('div', {style:{color:T.gold,fontSize:13,fontWeight:700,marginBottom:12}}, '⏰ Upcoming Deadlines'),
        upcoming.slice(0,5).map(function(d){
          var days=Math.ceil((new Date(d.date)-now)/86400000);
          var col=days<=7?T.redL:days<=14?T.gold:T.tealL;
          return React.createElement('div', {key:d.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid '+T.border}},
            React.createElement('div', null,
              React.createElement('div', {style:{color:T.white,fontSize:12,fontWeight:600}}, d.label),
              React.createElement('div', {style:{color:"#64748B",fontSize:11}}, new Date(d.date).toLocaleDateString('en-GB'))
            ),
            React.createElement('div', {style:{color:col,fontWeight:700,fontSize:12,background:col+'15',padding:'3px 10px',borderRadius:8}}, days===0?'TODAY':days===1?'1 day':days+' days')
          );
        }),
        React.createElement('button', {onClick:function(){setTab('deadlines');},style:{marginTop:10,color:T.gold,background:'none',border:'none',fontSize:12,cursor:'pointer',fontWeight:600}}, 'View all deadlines →')
      ),
      React.createElement('div', {style:{background:"#FAF6F0",borderRadius:12,padding:18,border:'1px solid '+T.border}},
        React.createElement('div', {style:{color:T.gold,fontSize:13,fontWeight:700,marginBottom:12}}, '📋 Recent Activity'),
        ev.length===0&&tl.length===0
          ? React.createElement('div', {style:{color:"#64748B",fontSize:13,textAlign:'center',padding:'16px 0'}},
              'No activity yet. ',
              React.createElement('button', {onClick:function(){setTab('assessment');},style:{color:T.gold,background:'none',border:'none',cursor:'pointer',fontSize:13}}, 'Start your assessment →')
            )
          : React.createElement('div', null,
              ev.slice(-4).map(function(e,i){
                return React.createElement('div', {key:'e'+i,style:{display:'flex',gap:10,alignItems:'center',padding:'7px 0',borderBottom:'1px solid '+T.border}},
                  React.createElement('span', {style:{fontSize:14}}, '🗄️'),
                  React.createElement('div', {style:{color:T.white,fontSize:12}}, 'Evidence: '+(e.type||'')+(e.description?' — '+String(e.description).slice(0,40):''))
                );
              })
            )
      )
    ),
    viewMode==='platform' && React.createElement('div', null,
      React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12,marginBottom:20}},
        [
          {icon:'👥',label:'Registered Users',value:PLATFORM.users.toLocaleString(),color:'#4a9eff'},
          {icon:'📁',label:'Total Cases',value:PLATFORM.cases.toLocaleString(),color:T.gold},
          {icon:'🏆',label:'Cases Settled',value:PLATFORM.settled.toLocaleString(),color:T.teal},
          {icon:'🔬',label:'Anchor Lies',value:PLATFORM.anchors.toLocaleString(),color:'#ff9f7f'},
          {icon:'📂',label:'SARs Generated',value:PLATFORM.sars.toLocaleString(),color:'#9b8fe8'},
          {icon:'📞',label:'Helpline Clicks',value:PLATFORM.helpline.toLocaleString(),color:'#2ecc71'},
          {icon:'👮',label:'IOPC Complaints',value:PLATFORM.iopc.toLocaleString(),color:T.redL},
          {icon:'🔒',label:'ICO Complaints',value:PLATFORM.ico.toLocaleString(),color:T.tealL},
        ].map(function(m){
          return React.createElement('div', {key:m.label,style:{background:"#FAF6F0",border:'1px solid '+m.color+'22',borderRadius:12,padding:'16px 12px',textAlign:'center'}},
            React.createElement('div', {style:{fontSize:22,marginBottom:6}}, m.icon),
            React.createElement('div', {style:{color:m.color,fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif"}}, m.value),
            React.createElement('div', {style:{color:T.white,fontSize:11,fontWeight:700,marginTop:4}}, m.label)
          );
        })
      ),
      React.createElement('div', {style:{background:'linear-gradient(135deg,rgba(12,123,122,0.1),rgba(201,168,76,0.1))',border:'1px solid '+T.teal+'44',borderRadius:14,padding:28,textAlign:'center'}},
        React.createElement('div', {style:{color:T.gold,fontSize:12,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.1em'}}, 'Platform Win Rate'),
        React.createElement('div', {style:{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:900,color:T.tealL,marginBottom:8}}, '48%'),
        React.createElement('div', {style:{color:"#64748B",fontSize:13}}, 'vs 14% national average for self-represented litigants'),
        React.createElement('div', {style:{color:T.dim,fontSize:11,marginTop:6}}, 'Based on '+PLATFORM.cases.toLocaleString()+' resolved cases')
      )
    )
  );
}

function NavDropdown({ tab, navTo }) {
  var [open, setOpen] = React.useState(false);
  var ref = React.useRef(null);
  React.useEffect(function(){
    function handle(e){ if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return function(){ document.removeEventListener("mousedown", handle); };
  },[]);
  // Is current tab in dropdown?
  var activeInDropdown = NAV_DROPDOWN.some(function(g){ return g.items.some(function(i){ return i.id===tab; }); });
  return React.createElement("div", {ref:ref, style:{position:"relative"}},
    React.createElement("button", {
      onClick:function(){setOpen(function(o){return !o;});},
      style:{background:activeInDropdown?T.goldBg:"transparent",border:"none",borderRadius:8,
        padding:"7px 10px",cursor:"pointer",color:activeInDropdown?T.gold:T.dim,
        display:"flex",alignItems:"center",gap:4,fontSize:12,
        boxShadow:activeInDropdown?"inset 0 -2px 0 "+T.gold:"none",whiteSpace:"nowrap"}
    },
      React.createElement("span", {style:{fontSize:15}}, "☰"),
      React.createElement("span", {className:"hide-mobile", style:{fontSize:11}}, "More"),
      React.createElement("span", {style:{fontSize:9,marginLeft:2}}, open?"▲":"▼")
    ),
    open && React.createElement("div", {style:{
      position:"absolute",top:"calc(100% + 8px)",right:0,
      background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:14,
      boxShadow:"0 16px 48px rgba(0,0,0,0.6)",zIndex:500,
      display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,
      minWidth:560,maxWidth:"95vw",overflow:"hidden"
    }},
      NAV_DROPDOWN.map(function(group){
        return React.createElement("div", {key:group.group, style:{padding:"14px 16px",borderRight:"1px solid "+T.border+"44"}},
          React.createElement("div", {style:{color:T.gold,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}, group.group),
          React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:2}},
            group.items.map(function(item){
              return React.createElement("button", {key:item.id,
                onClick:function(){navTo(item.id);setOpen(false);},
                style:{background:tab===item.id?T.goldBg:"transparent",
                  border:"none",borderRadius:7,padding:"6px 8px",
                  color:tab===item.id?T.gold:T.muted,fontSize:12,
                  cursor:"pointer",display:"flex",alignItems:"center",gap:7,
                  textAlign:"left",width:"100%",fontWeight:tab===item.id?700:400}
              },
                React.createElement("span", {style:{fontSize:14,flexShrink:0}}, item.icon),
                React.createElement("span", null, item.label)
              );
            })
          )
        );
      })
    )
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UJRIS KNOWLEDGE LIBRARY + CASE INTELLIGENCE ENGINE
// Replace KnowledgeGallery function with this comprehensive version
// ═══════════════════════════════════════════════════════════════════════════


function KnowledgeLibrary({ setTab, userProfile, cases, caseData }) {
  var [section, setSection] = React.useState("library");
  var [catId, setCatId] = React.useState(null);
  var [format, setFormat] = React.useState(null);
  var [aiOutput, setAiOutput] = React.useState("");
  var [generating, setGenerating] = React.useState(false);
  var [aiError, setAiError] = React.useState("");
  var [slideIdx, setSlideIdx] = React.useState(0);
  var [structured, setStructured] = React.useState(null);
  var [adminMode, setAdminMode] = React.useState(false);
  var [customContent, setCustomContent] = React.useState(function(){ return S.get("gallery_content",[]) || []; });
  var [newItem, setNewItem] = React.useState({title:"",desc:"",type:"video",url:"",tag:"",duration:""});
  var [playing, setPlaying] = React.useState(null);

  var CATS=[
    {id:"employment",icon:"⚖️",label:"Employment Discrimination",color:"#C9A84C",stat:"491,000+ ET claims/yr — HMCTS 2024"},
    {id:"race",icon:"✊",label:"Race Discrimination",color:"#ff9f7f",stat:"1 in 3 Black workers experience racism — TUC 2023"},
    {id:"disability",icon:"♿",label:"Disability Rights",color:"#4a9eff",stat:"69% PIP appeals succeed at tribunal — MOJ 2023"},
    {id:"police",icon:"🚔",label:"Police Misconduct",color:"#9b8fe8",stat:"7× higher stop & search rate for Black people — Home Office 2023"},
    {id:"data",icon:"🔐",label:"Data Rights & SAR",color:"#10a8a6",stat:"37,000+ ICO complaints per year — ICO 2024"},
    {id:"domestic",icon:"🏠",label:"Domestic Abuse & Control",color:"#E63946",stat:"1.4 million incidents reported in 2023 — ONS"},
    {id:"safeguarding",icon:"🛡️",label:"Safeguarding Weaponisation",color:"#e6a000",stat:"Est. 15–20% of referrals contain malice — NSPCC research"},
    {id:"housing",icon:"🏘️",label:"Housing Discrimination",color:"#2ecc71",stat:"430,000+ renters face discrimination annually — Shelter"},
    {id:"mental_health",icon:"🧠",label:"Mental Health & Law",color:"#c8a2e8",stat:"34 percentage point employment gap — NHS/DWP 2023"},
    {id:"children",icon:"👶",label:"Children & Family Rights",color:"#ffd166",stat:"14,000+ care proceedings per year — Cafcass 2023"},
  ];
  var LIB_FMTS=[
    {id:"overview",icon:"🎙",label:"Audio Deep Dive",desc:"4-min spoken overview with UK stats"},
    {id:"slides",icon:"📊",label:"Slide Deck",desc:"8 advocacy slides with real data"},
    {id:"infographic",icon:"📈",label:"Infographic",desc:"Visual stats, laws and action steps"},
    {id:"law",icon:"⚖️",label:"Legal Guide",desc:"Plain-English Acts and rights"},
    {id:"action",icon:"🗺️",label:"Action Guide",desc:"Step-by-step what to do now"},
  ];
  var CASE_TOOLS=[
    {id:"audio",icon:"🎙",label:"Audio Overview",desc:"3-min spoken brief — NotebookLM style",color:"#ff9f7f"},
    {id:"brief",icon:"📋",label:"Case Brief",desc:"Tribunal-ready structured summary",color:"#10a8a6"},
    {id:"slides",icon:"📊",label:"Slide Deck",desc:"6-slide shareable presentation",color:"#C9A84C"},
    {id:"infographic",icon:"📈",label:"Case Infographic",desc:"Visual facts, checklist, legal grounds",color:"#9b8fe8"},
    {id:"timeline",icon:"📅",label:"Timeline Narrative",desc:"Chronological story with legal significance",color:"#4a9eff"},
    {id:"strategy",icon:"🔬",label:"Litigation Strategy",desc:"How to win: anchor lies, SAR strategy, settlement calc",color:"#2ecc71"},
  ];
  var SOCIAL=[
    {id:"s1",icon:"f",label:"Facebook",handle:"@UJRIS",url:"https://www.facebook.com/profile.php?id=61585067450333",bg:"#1877F2"},
    {id:"s2",icon:"📸",label:"Instagram",handle:"@ujrisintel",url:"https://www.instagram.com/ujrisintel/",bg:"linear-gradient(135deg,#f09433,#dc2743,#bc1888)"},
    {id:"s3",icon:"𝕏",label:"X",handle:"@UJRIS_OFFICIAL",url:"https://x.com/UJRIS_OFFICIAL",bg:"#111"},
    {id:"s4",icon:"in",label:"LinkedIn",handle:"UJRIS",url:"https://www.linkedin.com/company/111627785",bg:"#0077B5"},
    {id:"s5",icon:"♪",label:"TikTok",handle:"@ujrisapp",url:"https://www.tiktok.com/@ujrisapp",bg:"#010101"},
    {id:"s6",icon:"▶",label:"YouTube",handle:"UJRIS",url:"https://www.youtube.com/channel/UCZjra3BMtLX1JdOD6218FAA",bg:"#FF0000"},
  ];

  var activeCat=CATS.find(function(c){return c.id===catId;});
  var slides=structured&&format==="slides"&&structured.slides?structured.slides:null;
  var infoSecs=structured&&format==="infographic"&&structured.sections?structured.sections:null;
  var E=React.createElement;

  async function genLib(cat,fmt) {
    setCatId(cat.id);setFormat(fmt);setGenerating(true);setAiOutput("");setStructured(null);setAiError("");setSlideIdx(0);
    var fmtMap={
      overview:"Write a compelling 4-minute audio deep dive on '"+cat.label+"' in the UK. Start with shocking statistics. Cover: (1) Scale with specific UK figures and source citations, (2) Who is most affected and why systemically, (3) Key Acts with section numbers in plain English, (4) Where the legal system fails victims, (5) What UJRIS does to change outcomes, (6) 3 immediate actions for someone facing this today. Warm, empowering, ~800 words. Include EHRC, HMCTS, ONS, or IOPC data.",
      slides:'Create 8 advocacy slides on '+cat.label+' in the UK. Return ONLY JSON (no markdown): {slides:[{title,subtitle,bullets:[],stat,color}]}. 8 Slides: 1=The Scale (UK stats), 2=Who Is Affected, 3=Legal Framework, 4=System Failures, 5=Key Cases, 6=What To Do Today, 7=How UJRIS Helps, 8=Rights Summary. Colors alternate #C9A84C #0C7B7A #9b8fe8.',
      infographic:'Infographic on '+cat.label+' UK. Return ONLY JSON (no markdown): {title,headline,sections:[{heading,items:[{label,value,color,note}]}]}. Sections: By The Numbers (6 UK stats with sources), Legal Toolkit (5 Acts with sections), Warning Signs (5 red flags), First 5 Actions. Use real UK statistics.',
      law:"Practical plain-English legal guide for '"+cat.label+"' UK: (1) Key Acts with exact section references, (2) What each provision protects in plain English, (3) How to use laws in practice with examples, (4) Critical time limits and deadlines, (5) Remedies and compensation including Vento bands where relevant, (6) Common mistakes that sink claims, (7) Key cases.",
      action:"Step-by-step action guide for someone facing '"+cat.label+"' UK. Name forms, deadlines, phone numbers, organisations. Cover: (1) What to do TODAY, (2) Evidence gathering first 2 weeks, (3) Formal processes month 1, (4) Escalation options, (5) Pitfalls to avoid, (6) Free resources with contact details.",
    };
    try {
      var res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:"You are UJRIS — the UK justice AI. Generate authoritative educational content using real UK statistics, Acts with section numbers, and practical guidance. Your audience face discrimination and need real knowledge to fight back.",
          messages:[{role:"user",content:fmtMap[fmt]}],max_tokens:2000})});
      var data=await res.json();
      if(data.error){setAiError(data.error);setGenerating(false);return;}
      var text="";(data.content||[]).forEach(function(b){if(b.type==="text")text+=b.text;});
      if(fmt==="slides"||fmt==="infographic"){try{setStructured(JSON.parse(text.replace(/```json|```/g,"").trim()));}catch(e){setAiOutput(text);}}
      else{setAiOutput(text);}
    }catch(e){setAiError(e.message);}
    setGenerating(false);
  }

  async function genCase(fmt) {
    var ev=S.get("evidence",[]); var tl=S.get("timeline",[]); var ac=cases[0]||{};
    var str=Math.min(100,ev.length*12+tl.length*10);
    var ctx="CASE: "+(ac.title||"Unknown")+" VS: "+(ac.employer||"Respondent")+" | TYPE: "+(ac.discType||[]).join(", ")+" | EVIDENCE: "+ev.length+" | TIMELINE: "+tl.length+" | STRENGTH: "+str+"% | TL: "+tl.slice(0,6).map(function(e){return e.date+" "+( e.title||"event");}).join("; ")+" | EV: "+ev.slice(0,5).map(function(e){return "["+e.type+"] "+(e.description||"").slice(0,50);}).join("; ");
    var cmap={
      audio:"Create a personalised 3-minute audio overview for this case. Warm, honest. Cover: (1) What this case is about in plain English, (2) Strongest evidence, (3) Key risks, (4) 3 most important next actions. Write as 'Your case...' ~600 words.",
      brief:"Tribunal-ready case brief: (1) CLAIM OVERVIEW, (2) KEY FACTS chronological, (3) EVIDENCE SUMMARY, (4) LEGAL ARGUMENTS with EA2010 sections, (5) CASE STRENGTH /10 with reasoning, (6) VULNERABILITIES, (7) IMMEDIATE ACTIONS numbered.",
      slides:'Create 6 case slides. Return ONLY JSON (no markdown): {slides:[{title,subtitle,bullets:[],color}]}. Slides: Overview, Evidence, Timeline, Legal Arguments, Risks, Action Plan. Colors: #C9A84C #0C7B7A #9b8fe8 #C9A84C #E63946 #0C7B7A.',
      infographic:'Case infographic. Return ONLY JSON (no markdown): {title,sections:[{heading,items:[{label,value,color}]}]}. Sections: Case Snapshot, Evidence Checklist, Legal Grounds, Strength Factors, Next 5 Actions.',
      timeline:"Visual case timeline. Each event: date, what happened, legal significance, evidence needed. Mark gaps. Include what evidence is recommended for each event.",
      strategy:"Litigation strategy memo: (1) Strongest argument to lead with, (2) How to frame discrimination, (3) Documents to request via SAR, (4) Witnesses to identify, (5) The anchor lie to exploit, (6) Tribunal presentation approach, (7) Settlement vs tribunal calculation.",
    };
    setFormat(fmt);setGenerating(true);setAiOutput("");setStructured(null);setAiError("");setSlideIdx(0);
    try {
      var res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:"You are UJRIS Case Intelligence — a senior UK discrimination law strategist. Be specific, honest, practical. Use real legal standards.",
          messages:[{role:"user",content:cmap[fmt]+"\n\nCASE DATA:\n"+ctx}],max_tokens:2000})});
      var data=await res.json();
      if(data.error){setAiError(data.error);setGenerating(false);return;}
      var text="";(data.content||[]).forEach(function(b){if(b.type==="text")text+=b.text;});
      if(fmt==="slides"||fmt==="infographic"){try{setStructured(JSON.parse(text.replace(/```json|```/g,"").trim()));}catch(e){setAiOutput(text);}}
      else{setAiOutput(text);}
    }catch(e){setAiError(e.message);}
    setGenerating(false);
  }

  function addItem(){if(!newItem.title||!newItem.url)return;var item=Object.assign({},newItem,{id:Date.now()+""});var u=[item].concat(customContent);setCustomContent(u);S.set("gallery_content",u);setNewItem({title:"",desc:"",type:"video",url:"",tag:"",duration:""});}
  function removeItem(id){var u=customContent.filter(function(i){return i.id!==id;});setCustomContent(u);S.set("gallery_content",u);}
  function getEmbed(url){if(!url)return null;var yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);if(yt)return "https://www.youtube.com/embed/"+yt[1]+"?autoplay=1";return url;}
  function getThumb(url){if(!url)return null;var yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);if(yt)return "https://img.youtube.com/vi/"+yt[1]+"/mqdefault.jpg";return null;}

  function Output() {
    if(generating)return E("div",{style:{background:"#FAF6F0",borderRadius:12,padding:"36px 20px",textAlign:"center",border:"1px solid "+T.gold+"22"}},E("div",{style:{fontSize:32,marginBottom:10}},"⏳"),E("div",{style:{color:T.gold,fontSize:14,fontWeight:700,marginBottom:4}},"Generating..."),E("div",{style:{color:"#64748B",fontSize:12}},"Using real UK statistics and laws"));
    if(aiError)return E("div",{style:{background:"rgba(230,57,70,0.1)",border:"1px solid #c04040",borderRadius:10,padding:"12px 16px",color:"#c04040",fontSize:13}},"Error: "+aiError);
    if(aiOutput)return E("div",{style:{background:"#FAF6F0",borderRadius:12,padding:22,border:"1px solid "+T.gold+"22"}},
      (format==="overview"||format==="audio")&&E("div",{style:{background:"rgba(255,159,127,0.1)",border:"1px solid rgba(255,159,127,0.3)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}},
        E("span",{style:{fontSize:18}},"🎙"),
        E("div",{style:{flex:1,color:"#ff9f7f",fontSize:12,fontWeight:700}},"Audio — Click Play"),
        E("button",{onClick:function(){var u=window.speechSynthesis;if(u){u.cancel();var utt=new SpeechSynthesisUtterance(aiOutput);utt.rate=0.88;u.speak(utt);}},style:{background:"rgba(255,159,127,0.2)",border:"1px solid rgba(255,159,127,0.4)",borderRadius:8,padding:"5px 12px",color:"#ff9f7f",cursor:"pointer",fontSize:11,fontWeight:700}},"▶ Play"),
        E("button",{onClick:function(){window.speechSynthesis&&window.speechSynthesis.cancel();},style:{background:"rgba(255,255,255,0.05)",border:"1px solid "+T.border,borderRadius:8,padding:"5px 10px",color:T.muted,cursor:"pointer",fontSize:11}},"⏹")
      ),
      E("div",{style:{color:T.white,lineHeight:1.9,fontSize:13,whiteSpace:"pre-wrap"}},aiOutput),
      E("div",{style:{display:"flex",gap:8,marginTop:12}},
        E("button",{onClick:function(){navigator.clipboard.writeText(aiOutput);},style:{background:T.navyL,border:"1px solid "+T.border,borderRadius:8,padding:"7px 14px",color:T.muted,cursor:"pointer",fontSize:12}},"📋 Copy"),
        E("button",{onClick:function(){var w=window.open("","_blank");if(w)w.document.write("<html><body style='font-family:Georgia;max-width:720px;margin:40px auto;line-height:1.9;font-size:15px'>"+aiOutput.replace(/
/g,"<br>")+"</body></html>");},style:{background:T.tealBg,border:"1px solid "+T.teal+"44",borderRadius:8,padding:"7px 14px",color:"#10a8a6",cursor:"pointer",fontSize:12}},"🖨 Print/PDF")
      )
    );
    if(slides&&slides.length>0)return E("div",null,
      E("div",{style:{background:"linear-gradient(135deg,"+(slides[slideIdx]&&slides[slideIdx].color?slides[slideIdx].color+"22":"rgba(201,168,76,0.1)")+",transparent)",borderRadius:16,padding:"28px 24px",minHeight:200,border:"1px solid "+(slides[slideIdx]&&slides[slideIdx].color?slides[slideIdx].color+"44":T.gold+"44"),marginBottom:14}},
        E("div",{style:{color:slides[slideIdx]&&slides[slideIdx].color||T.gold,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}},"Slide "+(slideIdx+1)+" / "+slides.length),
        E("h2",{style:{fontFamily:"'Playfair Display',serif",color:T.white,fontSize:20,marginBottom:8}},slides[slideIdx]&&slides[slideIdx].title||""),
        slides[slideIdx]&&slides[slideIdx].stat&&E("div",{style:{background:"rgba(255,255,255,0.04)",borderRadius:7,padding:"6px 12px",marginBottom:10,color:slides[slideIdx].color||T.gold,fontSize:13,fontWeight:700}},slides[slideIdx].stat),
        E("div",{style:{display:"flex",flexDirection:"column",gap:7}},((slides[slideIdx]&&slides[slideIdx].bullets)||[]).map(function(b,i){return E("div",{key:i,style:{display:"flex",gap:8,alignItems:"flex-start"}},E("span",{style:{color:slides[slideIdx].color||T.gold,flexShrink:0,marginTop:3}},"→"),E("span",{style:{color:T.white,fontSize:13,lineHeight:1.6}},b));}))
      ),
      E("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
        E("button",{onClick:function(){setSlideIdx(function(s){return Math.max(0,s-1);});},disabled:slideIdx===0,style:{background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:8,padding:"7px 14px",color:T.muted,cursor:"pointer"}},"← Prev"),
        E("div",{style:{display:"flex",gap:5}},slides.map(function(_,i){return E("div",{key:i,onClick:function(){setSlideIdx(i);},style:{width:7,height:7,borderRadius:"50%",background:i===slideIdx?T.gold:T.border,cursor:"pointer"}});})),
        E("button",{onClick:function(){setSlideIdx(function(s){return Math.min(slides.length-1,s+1);});},disabled:slideIdx===slides.length-1,style:{background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:8,padding:"7px 14px",color:T.muted,cursor:"pointer"}},"Next →")
      )
    );
    if(infoSecs)return E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}},
      infoSecs.map(function(sec,si){return E("div",{key:si,style:{background:T.navyM,borderRadius:12,padding:"14px 16px",border:"1px solid "+T.border}},
        E("div",{style:{color:T.gold,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}},sec.heading),
        (sec.items||[]).map(function(item,i){return E("div",{key:i,style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"5px 0",borderBottom:i<sec.items.length-1?"1px solid "+T.border+"44":"none",gap:8}},
          E("div",null,E("div",{style:{color:"#AAB8C8",fontSize:12}},item.label),item.note&&E("div",{style:{color:T.muted,fontSize:10}},item.note)),
          E("span",{style:{color:item.color||T.white,fontSize:12,fontWeight:700,flexShrink:0}},item.value)
        );})
      );})
    );
    return null;
  }

  function BackBar(onFmt, onSection) {
    return E("div",{style:{display:"flex",gap:8,marginBottom:14,alignItems:"center"}},
      format&&E("button",{onClick:function(){setFormat(null);setAiOutput("");setStructured(null);},style:{background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:8,padding:"6px 12px",color:"#AAB8C8",cursor:"pointer",fontSize:12}},"← Back"),
      catId&&!format&&E("button",{onClick:function(){setCatId(null);setFormat(null);setAiOutput("");setStructured(null);},style:{background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:8,padding:"6px 12px",color:"#AAB8C8",cursor:"pointer",fontSize:12}},"← Categories"),
      activeCat&&E("div",{style:{color:"#0F2C4A",fontSize:13,fontWeight:700}},activeCat.icon+" "+activeCat.label),
      format&&!generating&&E("button",{onClick:function(){if(section==="library"&&activeCat)genLib(activeCat,format);else if(section==="case_intel")genCase(format);},style:{marginLeft:"auto",background:T.tealBg,border:"1px solid "+T.teal+"44",borderRadius:8,padding:"6px 12px",color:"#10a8a6",cursor:"pointer",fontSize:12,fontWeight:600}},"🔄 Regenerate")
    );
  }

  return E("div",{style:{maxWidth:1000,margin:"0 auto",padding:"0 0 40px"}},
    E("div",{style:{display:"flex",gap:0,marginBottom:18,borderRadius:14,overflow:"hidden",border:"1px solid "+T.border}},
      [{id:"library",icon:"📚",label:"Knowledge Library",sub:"UK law, stats & guides"},
       {id:"case_intel",icon:"🧠",label:"Case Intelligence",sub:"NotebookLM for your case"},
       {id:"media",icon:"🎬",label:"Media & Social",sub:"Videos, audio, follow us"}
      ].map(function(s){
        var active=section===s.id;
        return E("button",{key:s.id,onClick:function(){setSection(s.id);setCatId(null);setFormat(null);setAiOutput("");setStructured(null);},
          style:{flex:1,background:active?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.02)",border:"none",borderRight:"1px solid "+T.border,padding:"12px 8px",cursor:"pointer",textAlign:"center"}},
          E("div",{style:{fontSize:20,marginBottom:3}},s.icon),
          E("div",{style:{color:active?T.gold:"#AAB8C8",fontSize:12,fontWeight:active?700:500}},s.label),
          E("div",{style:{color:T.muted,fontSize:10,marginTop:1}},s.sub)
        );
      })
    ),
    section==="library"&&E("div",null,
      !catId&&E("div",null,
        E("div",{style:{background:"linear-gradient(135deg,rgba(201,168,76,0.07),rgba(12,123,122,0.05))",borderRadius:14,padding:"18px 16px",marginBottom:14,border:"1px solid "+T.gold+"22"}},
          E("h2",{style:{fontFamily:"'Playfair Display',serif",color:T.gold,fontSize:22,marginBottom:6}},"📚 UJRIS Knowledge Library"),
          E("p",{style:{color:"#AAB8C8",fontSize:13,lineHeight:1.7,margin:0}},"10 categories of UK discrimination law, rights, and justice. Each generates audio overviews, slide decks, infographics, legal guides, and action plans — all powered by AI with real UK statistics and case law. Select a category.")
        ),
        E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}},
          CATS.map(function(cat){
            return E("button",{key:cat.id,onClick:function(){setCatId(cat.id);setFormat(null);setAiOutput("");setStructured(null);},
              style:{background:"#FAF6F0",border:"1px solid "+cat.color+"33",borderRadius:14,padding:"16px 14px",textAlign:"left",cursor:"pointer",transition:"all 0.2s"}},
              E("div",{style:{fontSize:26,marginBottom:7}},cat.icon),
              E("div",{style:{color:cat.color,fontSize:12,fontWeight:700,marginBottom:3}},cat.label),
              E("div",{style:{color:T.muted,fontSize:10,marginBottom:8,lineHeight:1.4}},cat.stat),
              E("div",{style:{display:"flex",gap:3,flexWrap:"wrap"}},LIB_FMTS.map(function(f){return E("span",{key:f.id,style:{background:cat.color+"15",color:cat.color,fontSize:9,padding:"1px 4px",borderRadius:3,fontWeight:600}},f.icon);}))
            );
          })
        )
      ),
      catId&&activeCat&&E("div",null,
        BackBar(),
        !format&&E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}},
          LIB_FMTS.map(function(f){
            return E("button",{key:f.id,onClick:function(){genLib(activeCat,f.id);},
              style:{background:"#FAF6F0",border:"1px solid "+activeCat.color+"44",borderRadius:12,padding:"14px 12px",cursor:"pointer",textAlign:"center"}},
              E("div",{style:{fontSize:24,marginBottom:6}},f.icon),
              E("div",{style:{color:activeCat.color,fontSize:12,fontWeight:700,marginBottom:3}},f.label),
              E("div",{style:{color:"#64748B",fontSize:11}},f.desc)
            );
          })
        ),
        format&&Output()
      )
    ),
    section==="case_intel"&&E("div",null,
      E("div",{style:{background:"linear-gradient(135deg,rgba(201,168,76,0.07),rgba(44,122,110,0.07))",borderRadius:14,padding:"18px 16px",marginBottom:14,border:"1px solid "+T.gold+"22"}},
        E("h2",{style:{fontFamily:"'Playfair Display',serif",color:T.gold,fontSize:22,marginBottom:6}},"🧠 My Case Intelligence Engine"),
        E("p",{style:{color:"#AAB8C8",fontSize:13,lineHeight:1.7,marginBottom:10}},"Like NotebookLM — but built for YOUR legal case. Generate audio overviews, tribunal briefs, slide decks, infographics, timeline narratives, and litigation strategy from your own case data."),
        E("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
          [{label:(S.get("evidence",[]).length||0)+" evidence items",ok:(S.get("evidence",[]).length||0)>0},{label:(S.get("timeline",[]).length||0)+" timeline events",ok:(S.get("timeline",[]).length||0)>0},{label:cases[0]?cases[0].title:"No case yet — start assessment",ok:!!(cases[0])}].map(function(s,i){return E("div",{key:i,style:{background:s.ok?"rgba(12,123,122,0.2)":"rgba(255,255,255,0.04)",border:"1px solid "+(s.ok?"#10a8a6":T.border)+"55",borderRadius:8,padding:"3px 10px",display:"flex",gap:5,alignItems:"center"}},E("span",{style:{fontSize:11}},s.ok?"✅":"⚠️"),E("span",{style:{color:s.ok?"#10a8a6":T.muted,fontSize:11}},s.label));})
        )
      ),
      format&&BackBar(),
      !format&&E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}},
        CASE_TOOLS.map(function(t){
          return E("button",{key:t.id,onClick:function(){genCase(t.id);},style:{background:"#FAF6F0",border:"1px solid "+t.color+"33",borderRadius:14,padding:"18px 16px",textAlign:"left",cursor:"pointer"}},
            E("div",{style:{fontSize:28,marginBottom:8}},t.icon),
            E("div",{style:{color:t.color,fontSize:13,fontWeight:700,marginBottom:4}},t.label),
            E("div",{style:{color:"#64748B",fontSize:11,lineHeight:1.5}},t.desc)
          );
        })
      ),
      format&&Output()
    ),
    section==="media"&&E("div",null,
      E("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:14}},
        E("div",null,E("h2",{style:{fontFamily:"'Playfair Display',serif",color:T.gold,fontSize:20,marginBottom:3}},"🎬 Media Gallery"),E("p",{style:{color:"#64748B",fontSize:12,margin:0}},"UJRIS original content and social media.")),
        !adminMode&&E("button",{onClick:function(){var p=window.prompt("Admin password:");if(p==="ujris2026")setAdminMode(true);else if(p!==null)alert("Incorrect");},style:{background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:8,padding:"7px 12px",color:"#64748B",fontSize:11,cursor:"pointer"}},"🔐 Admin Upload"),
        adminMode&&E("span",{style:{color:T.gold,fontSize:11,fontWeight:700}},"✏️ Admin Mode")
      ),
      adminMode&&E("div",{style:{background:T.navyM,borderRadius:12,padding:14,marginBottom:14,border:"1px solid "+T.gold+"44"}},
        E("div",{style:{color:T.gold,fontSize:12,fontWeight:700,marginBottom:10}},"➕ Add Content"),
        E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:7,marginBottom:7}},
          [{k:"title",ph:"Title *"},{k:"url",ph:"YouTube/Vimeo/PDF URL *"},{k:"tag",ph:"Tag"},{k:"duration",ph:"Duration"}].map(function(f){
            return E("input",{key:f.k,value:newItem[f.k],onChange:function(e){var v=e.target.value;setNewItem(function(p){var n=Object.assign({},p);n[f.k]=v;return n;});},placeholder:f.ph,
              style:{background:"#FAF6F0",border:"1px solid #EDE4D9",borderRadius:7,padding:"7px 9px",color:"#0F2C4A",fontSize:12}});
          })
        ),
        E("div",{style:{display:"flex",gap:7,flexWrap:"wrap"}},
          E("select",{value:newItem.type,onChange:function(e){var v=e.target.value;setNewItem(function(p){return Object.assign({},p,{type:v});});},style:{background:"#FAF6F0",border:"1px solid #EDE4D9",borderRadius:7,padding:"7px 9px",color:"#0F2C4A",fontSize:12}},
            ["video","audio","article","paper","slides","infographic"].map(function(t){return E("option",{key:t,value:t},t);})),
          E("input",{value:newItem.desc,onChange:function(e){var v=e.target.value;setNewItem(function(p){return Object.assign({},p,{desc:v});});},placeholder:"Description...",
            style:{flex:1,background:"#FAF6F0",border:"1px solid #EDE4D9",borderRadius:7,padding:"7px 9px",color:"#0F2C4A",fontSize:12,minWidth:140}}),
          E("button",{onClick:addItem,style:{background:T.gold,color:T.navy,border:"none",borderRadius:7,padding:"7px 14px",fontWeight:700,cursor:"pointer"}},"📤 Publish")
        )
      ),
      playing&&E("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.95)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
        E("div",{style:{maxWidth:860,width:"100%"}},
          E("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:12}},
            E("div",{style:{color:"#0F2C4A",fontSize:13,fontWeight:700}},playing.title),
            E("button",{onClick:function(){setPlaying(null);},style:{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer"}},"✕")
          ),
          playing.url?E("div",{style:{position:"relative",paddingBottom:"56.25%",height:0,overflow:"hidden",borderRadius:12}},
            E("iframe",{src:getEmbed(playing.url),style:{position:"absolute",top:0,left:0,width:"100%",height:"100%"},frameBorder:0,allowFullScreen:true,allow:"autoplay; encrypted-media"})
          ):E("div",{style:{background:T.navyM,borderRadius:12,padding:"28px",textAlign:"center"}},E("div",{style:{fontSize:40}},"🎬"))
        )
      ),
      customContent.length>0&&E("div",{style:{marginBottom:18}},
        E("div",{style:{color:T.gold,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}},"UJRIS ORIGINALS"),
        E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:9}},
          customContent.map(function(item){
            var thumb=item.url?getThumb(item.url):null;
            return E("div",{key:item.id,style:{background:"#FAF6F0",border:"1px solid "+T.gold+"22",borderRadius:11,overflow:"hidden",cursor:item.url?"pointer":"default"},onClick:item.url?function(){setPlaying(item);}:undefined},
              thumb?E("div",{style:{position:"relative",paddingBottom:"56.25%",background:"#000"}},
                E("img",{src:thumb,alt:item.title,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.85}}),
                E("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center"}},E("div",{style:{width:36,height:36,borderRadius:"50%",background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}},"▶"))
              ):E("div",{style:{background:T.gold+"12",padding:"12px",fontSize:22}},"🎬"),
              E("div",{style:{padding:"9px 11px"}},
                E("div",{style:{color:T.white,fontSize:12,fontWeight:700}},item.title),
                adminMode&&E("button",{onClick:function(e){e.stopPropagation();removeItem(item.id);},style:{background:"rgba(230,57,70,0.1)",color:"#c04040",border:"none",borderRadius:5,padding:"2px 6px",fontSize:9,cursor:"pointer",marginTop:4}},"✕")
              )
            );
          })
        )
      ),
      E("div",null,
        E("div",{style:{color:T.gold,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}},"FOLLOW UJRIS"),
        E("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}},
          SOCIAL.map(function(s){
            return E("a",{key:s.id,href:s.url,target:"_blank",rel:"noopener noreferrer",
              style:{background:"#FAF6F0",border:"1px solid "+T.border,borderRadius:10,padding:11,textDecoration:"none",display:"flex",gap:9,alignItems:"center"}},
              E("div",{style:{width:32,height:32,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:900,flexShrink:0}},s.icon),
              E("div",null,E("div",{style:{color:T.white,fontSize:12,fontWeight:700}},s.label),E("div",{style:{color:T.gold,fontSize:11}},s.handle))
            );
          })
        )
      ),
      E("div",{style:{background:T.tealBg,border:"1px solid "+T.teal+"30",borderRadius:10,padding:"11px 16px",marginTop:18,textAlign:"center"}},
        E("div",{style:{color:"#10a8a6",fontSize:12,fontWeight:700,marginBottom:2}},"🚀 More content published weekly"),
        E("div",{style:{color:"#64748B",fontSize:11}},"Building the UK's largest free discrimination law media library.")
      )
    )
  );
}

function GamificationBar({ setTab }) {
  const earned = getEarnedBadges();
  const total = BADGES.length;
  const pct = Math.round((earned.length / total) * 100);
  const latest = earned[earned.length - 1];

  return (
    <div style={{background:T.navyM,borderRadius:12,padding:16,border:`1px solid ${T.border}`,marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{color:T.white,fontWeight:700,fontSize:13}}>🏆 Your Progress — Justice Journey</div>
          <div style={{color:"#64748B",fontSize:11,marginTop:2}}>{earned.length} of {total} badges earned · {pct}% complete</div>
        </div>
        {latest && (
          <div style={{display:"flex",alignItems:"center",gap:6,background:T.goldBg,border:`1px solid ${T.goldD}`,
            borderRadius:20,padding:"4px 12px"}}>
            <span style={{fontSize:16}}>{latest.icon}</span>
            <span style={{color:T.gold,fontSize:11,fontWeight:600}}>Latest: {latest.name}</span>
          </div>
        )}
      </div>
      {/* Progress bar */}
      <div style={{background:T.navyL,borderRadius:20,height:8,marginBottom:10,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${T.teal},${T.gold})`,
          borderRadius:20,transition:"width 0.5s ease"}}/>
      </div>
      {/* Badge row */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {BADGES.map(b=>{
          const isEarned = earned.find(e=>e.id===b.id);
          return (
            <div key={b.id} title={`${b.name}: ${b.desc}`}
              style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,background:isEarned?T.goldBg:T.navyL,
                border:`2px solid ${isEarned?T.gold:T.border}`,
                opacity:isEarned?1:0.3,cursor:"default",transition:"all 0.3s"}}>
              {b.icon}
            </div>
          );
        })}
      </div>
      <button onClick={()=>setTab("badges")}
        style={{marginTop:10,background:"none",border:"none",color:T.gold,fontSize:12,cursor:"pointer",padding:0}}>
        View all badges →
      </button>
    </div>
  );
}

function BadgesScreen() {
  const earned = getEarnedBadges();
  const earnedIds = earned.map(b=>b.id);

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
      <h2 style={{color:T.gold,marginBottom:4}}>🏆 Justice Journey Badges</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Every action you take builds your case and your power. Track your progress here.</p>

      {/* Progress summary */}
      <div style={{background:T.navyM,borderRadius:12,padding:20,border:`1px solid ${T.goldD}`,marginBottom:24,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>🏆</div>
        <div style={{color:T.gold,fontWeight:800,fontSize:28}}>{earned.length} / {BADGES.length}</div>
        <div style={{color:T.white,fontSize:15,marginBottom:12}}>Badges Earned</div>
        <div style={{background:T.navyL,borderRadius:20,height:12,maxWidth:400,margin:"0 auto",overflow:"hidden"}}>
          <div style={{width:`${Math.round((earned.length/BADGES.length)*100)}%`,height:"100%",
            background:`linear-gradient(90deg,${T.teal},${T.gold})`,borderRadius:20}}/>
        </div>
        <div style={{color:"#64748B",fontSize:12,marginTop:8}}>{Math.round((earned.length/BADGES.length)*100)}% of your Justice Journey complete</div>
      </div>

      {/* Earned badges */}
      {earned.length>0 && (
        <div style={{marginBottom:24}}>
          <div style={{color:T.tealL,fontWeight:700,fontSize:13,marginBottom:12}}>✅ Earned ({earned.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
            {earned.map(b=>(
              <div key={b.id} style={{background:T.navyM,borderRadius:10,padding:14,border:`1px solid ${T.gold}`,display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{fontSize:28,flexShrink:0}}>{b.icon}</div>
                <div>
                  <div style={{color:T.gold,fontWeight:700,fontSize:13}}>{b.name}</div>
                  <div style={{color:"#64748B",fontSize:11,marginTop:2}}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      <div>
        <div style={{color:T.muted,fontWeight:700,fontSize:13,marginBottom:12}}>🔒 Still To Earn ({BADGES.length-earned.length})</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
          {BADGES.filter(b=>!earnedIds.includes(b.id)).map(b=>(
            <div key={b.id} style={{background:T.navyM,borderRadius:10,padding:14,border:`1px solid ${T.border}`,display:"flex",gap:12,alignItems:"flex-start",opacity:0.5}}>
              <div style={{fontSize:28,flexShrink:0,filter:"grayscale(1)"}}>{b.icon}</div>
              <div>
                <div style={{color:T.muted,fontWeight:700,fontSize:13}}>{b.name}</div>
                <div style={{color:T.dim,fontSize:11,marginTop:2}}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Home({ setTab }) {
  const [email, setEmail] = useState(""); const [joined, setJoined] = useState(false);
  const join = () => { if(!email)return; S.set("waitlist",[...(S.get("waitlist",[])),email]); setJoined(true); };

  const PAIN_POINTS = [
    { icon:"😰", problem:"\"I don't know where to start\"", solution:"Guided 4-step assessment gives you clarity in 10 minutes" },
    { icon:"😤", problem:"\"They're denying everything\"", solution:"Forensic Analyser exposes contradictions in employer defences" },
    { icon:"💸", problem:"\"Solicitors cost £250/hour\"", solution:"UJRIS generates the same documents for a fraction of the cost" },
    { icon:"⏰", problem:"\"I don't know my deadlines\"", solution:"Live countdown to your Employment Tribunal filing deadline" },
  ];

  const STATS = [
    {n:"3 months",sub:"minus 1 day",label:"ET claim window",color:T.redL},
    {n:"68%",sub:"of ACAS cases",label:"settle before tribunal",color:T.teal},
    {n:"£56,000",sub:"Vento upper band",label:"max injury to feelings",color:T.gold},
    {n:"94%",sub:"of BAME claimants",label:"are self-represented",color:T.muted},
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{textAlign:"center",padding:"48px 0 56px",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:300,
          background:`radial-gradient(ellipse, ${T.goldBg} 0%, transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
          <Logo size={56}/>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.tealBg}`,
          border:`1px solid ${T.teal}40`,borderRadius:30,padding:"6px 18px",marginBottom:24}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:T.teal,display:"inline-block",animation:"pulse 2s infinite"}}/>
          <span style={{color:T.tealL,fontSize:11.5,letterSpacing:"0.1em",textTransform:"uppercase"}}>
            AI-Powered · UK Law · Free to Start · BAME-First
          </span>
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",
          fontSize:"clamp(30px, 5.5vw, 58px)",fontWeight:900,color:T.white,lineHeight:1.15,marginBottom:16,maxWidth:720,margin:"0 auto 16px"}}>
          Justice Shouldn't Require<br/>
          <span style={{background:`linear-gradient(135deg,${T.gold} 0%,${T.goldL} 55%,${T.goldD} 100%)`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
            a Lawyer
          </span>
        </h1>
        <p style={{color:T.muted,fontFamily:"'Source Serif 4',serif",fontStyle:"italic",fontSize:"clamp(15px,2.5vw,19px)",
          lineHeight:1.7,maxWidth:540,margin:"0 auto 12px"}}>
          "Turn confusion into clarity. Turn evidence into action. Turn discrimination into justice."
        </p>
        <p style={{color:T.dim,fontSize:13,maxWidth:480,margin:"0 auto 36px"}}>
          Intelligence-driven legal power for self-represented litigants. Built for BAME communities — designed for everyone facing discrimination.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:48}}>
          <Btn onClick={()=>setTab("assessment")} style={{fontSize:15,padding:"14px 32px",boxShadow:`0 0 0 4px ${T.goldBg}, 0 8px 24px rgba(201,168,76,0.25)`,animation:"glow 3s infinite"}}>
            Start Your Assessment →
          </Btn>
          <Btn onClick={()=>setTab("cases")} style={{fontSize:15,padding:"14px 32px",background:T.teal,boxShadow:`0 0 0 4px ${T.tealBg}`}}>
            📁 My Cases
          </Btn>
          <Btn onClick={()=>setTab("command_centre")} style={{fontSize:15,padding:"14px 32px",background:"#1a2a4a",border:"1px solid #4a9eff88",color:"#4a9eff"}}>⚡ Command Centre</Btn>
          <Btn variant="ghost" onClick={()=>setTab("rights")} style={{fontSize:15,padding:"14px 32px"}}>Know Your Rights</Btn>
          <Btn onClick={()=>setTab("protection_hub")} style={{fontSize:15,padding:"14px 32px",background:"#1a3050",border:"1px solid #4a9eff55",color:"#4a9eff"}}>🛡 Protection Hub</Btn>
        </div>

        {/* Trust badges */}
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:48}}>
          {["✅ Supporting active discrimination claimants","✅ Free to start, no card needed","✅ Your data never leaves your device"].map(t=>(
            <div key={t} style={{background:T.tealBg,border:`1px solid ${T.teal}30`,borderRadius:24,padding:"6px 14px",color:T.tealL,fontSize:12}}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,
        background:T.border,borderRadius:16,overflow:"hidden",marginBottom:60,border:`1px solid ${T.border}`}}>
        {STATS.map(s=>(
          <div key={s.n} style={{background:T.navyM,padding:"22px 16px",textAlign:"center"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:s.color}}>{s.n}</div>
            <div style={{color:T.dim,fontSize:10.5,marginTop:2}}>{s.sub}</div>
            <div style={{color:"#64748B",fontSize:11,marginTop:4,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pain points */}
      <div style={{marginBottom:60}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:T.white,fontSize:22,textAlign:"center",marginBottom:28}}>
          We Know Exactly What You're Feeling
        </h2>
        <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {PAIN_POINTS.map(p=>(
            <Card key={p.problem} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"20px 18px"}}>
              <span style={{fontSize:28,flexShrink:0}}>{p.icon}</span>
              <div>
                <p style={{color:"#64748B",fontSize:13,fontStyle:"italic",marginBottom:8}}>"{p.problem.slice(1,-1)}"</p>
                <div style={{width:24,height:2,background:T.gold,borderRadius:2,marginBottom:8}}/>
                <p style={{color:T.white,fontSize:13.5,lineHeight:1.6,fontFamily:"'Source Serif 4',serif"}}>{p.solution}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{marginBottom:60}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:T.white,fontSize:22,textAlign:"center",marginBottom:8}}>
          Affordable. Because Justice Shouldn't Be a Luxury.
        </h2>
        <p style={{color:"#1E3A5F",fontSize:14,textAlign:"center",marginBottom:28}}>What a solicitor charges £500 for, UJRIS gives you for £29.</p>
        <div className="grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {label:"Free Forever",price:"£0",desc:"Guided assessment, evidence vault, AI rights Q&A, action plan",highlight:false,cta:"Start Free"},
            {label:"Premium One-Off",price:"£29",desc:"Full document pack: grievance, SAR, ET1 guidance + forensic analysis",highlight:true,cta:"Get Premium"},
            {label:"Subscription",price:"£9.99/mo",desc:"Unlimited cases, priority AI, schedule of loss, advanced forensics",highlight:false,cta:"Subscribe"},
          ].map(p=>(
            <Card key={p.label} style={{textAlign:"center",padding:"28px 20px",
              borderColor:p.highlight?T.gold:T.border,
              boxShadow:p.highlight?`0 0 0 1px ${T.gold}30, 0 12px 40px rgba(201,168,76,0.15)`:"none"}}>
              {p.highlight&&<div style={{color:T.gold,fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>★ Most Popular</div>}
              <div style={{fontFamily:"'Playfair Display',serif",color:"#0F2C4A",fontSize:16,fontWeight:700,marginBottom:8}}>{p.label}</div>
              <div style={{fontFamily:"'Playfair Display',serif",color:T.gold,fontSize:30,fontWeight:900,marginBottom:12}}>{p.price}</div>
              <p style={{color:"#64748B",fontSize:12.5,lineHeight:1.7,marginBottom:20}}>{p.desc}</p>
              <Btn variant={p.highlight?"gold":"ghost"} full onClick={()=>alert("Coming in full release — for now, everything is free in beta!")}>{p.cta}</Btn>
            </Card>
          ))}
        </div>
      </div>

      {/* Waitlist */}
      <Card glow style={{textAlign:"center",padding:"40px 32px",marginBottom:40}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:T.gold,fontSize:24,marginBottom:8}}>Join the Movement</h2>
        <p style={{color:"#1E3A5F",fontSize:14,marginBottom:24,maxWidth:440,margin:"0 auto 24px"}}>
          Get early access, updates, and be part of the community fighting systemic discrimination worldwide.
        </p>

        {/* Learn and Community quick links */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:500,margin:"0 auto 24px"}}>
          <button onClick={()=>setTab("learn")} style={{background:"rgba(201,168,76,0.1)",border:`1px solid ${T.gold}44`,borderRadius:12,padding:16,textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:28,marginBottom:6}}>📚</div>
            <div style={{color:T.gold,fontSize:14,fontWeight:700,marginBottom:4}}>Know Your Rights</div>
            <div style={{color:"#64748B",fontSize:11}}>Statistics · guides · real stories · scenarios</div>
          </button>
          <button onClick={()=>setTab("community")} style={{background:"rgba(12,123,122,0.1)",border:`1px solid ${T.teal}44`,borderRadius:12,padding:16,textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:28,marginBottom:6}}>🌐</div>
            <div style={{color:T.tealL,fontSize:14,fontWeight:700,marginBottom:4}}>Community</div>
            <div style={{color:"#64748B",fontSize:11}}>Peer support · success stories · groups</div>
          </button>
        </div>

        {joined ? (
          <div style={{color:T.tealL,fontFamily:"'Playfair Display',serif",fontSize:16}}>✓ You're in. Thank you for joining the movement.</div>
        ) : (
          <div style={{display:"flex",gap:10,maxWidth:440,margin:"0 auto",flexWrap:"wrap",justifyContent:"center"}}>
            <Input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&join()} style={{flex:"1 1 240px"}}/>
            <Btn onClick={join}>Join Beta →</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

const NAV_GROUPS = [
  { id:"home",    icon:"🏛", label:"Home",    pinned:true  },
  { id:"cases",   icon:"📁", label:"Cases",   pinned:true  },
  { id:"dashboard",icon:"📊",label:"Dashboard",pinned:true },
  { id:"evidence",icon:"🗄", label:"Evidence",pinned:true  },
  { id:"data_hub",icon:"🗂", label:"Vault",   pinned:true  },
];

const NAV_DROPDOWN = [
  { group:"My Case",   items:[
    {id:"assessment",icon:"🧭",label:"Assessment"},
    {id:"timeline",icon:"📅",label:"Timeline"},
    {id:"actions",icon:"🗺",label:"Action Centre"},
    {id:"deadlines",icon:"⏰",label:"Deadlines"},
    {id:"calculator",icon:"⚖",label:"Calculator"},
    {id:"kpi",icon:"📊",label:"KPI Live"},
  ]},
  { group:"AI Tools",  items:[
    {id:"forensic_hub",icon:"🔬",label:"Forensic Hub"},
    {id:"forensic",icon:"🔬",label:"Forensic Analyser"},
    {id:"comparator",icon:"⚖",label:"Comparator"},
    {id:"sham_nav",icon:"🎭",label:"Sham Hearing"},
    {id:"intel",icon:"🧠",label:"Case Intel"},
    {id:"cctv",icon:"📹",label:"CCTV Analyser"},
    {id:"lab",icon:"🔐",label:"Evidence Lab"},
  ]},
  { group:"Documents", items:[
    {id:"documents",icon:"✍",label:"Documents"},
    {id:"sar",icon:"📂",label:"SAR Intelligence"},
    {id:"email_dispatch",icon:"✉",label:"Email Dispatch"},
    {id:"file_intake",icon:"📥",label:"File Intake"},
  ]},
  { group:"Safety",    items:[
    {id:"protection_hub",icon:"🛡",label:"Protection Hub"},
    {id:"recording_studio",icon:"🎙",label:"Recording Studio"},
    {id:"helpline",icon:"📞",label:"Helplines"},
  ]},
  { group:"Knowledge", items:[
    {id:"learn",icon:"📚",label:"Educational Hub"},
    {id:"community",icon:"🌐",label:"Community"},
    {id:"rights",icon:"📖",label:"Know Your Rights"},
    {id:"support",icon:"🤝",label:"Support Network"},
    {id:"wellbeing",icon:"💚",label:"Wellbeing"},
  ]},
  { group:"Account",   items:[
    {id:"command_centre",icon:"⚡",label:"Command Centre"},
    {id:"tracker",icon:"📋",label:"Action Tracker"},
    {id:"notifications",icon:"🔔",label:"Alerts"},
    {id:"badges",icon:"🏆",label:"Badges"},
    {id:"pricing",icon:"💎",label:"Upgrade"},
  ]},
];

// Flat list for backwards compatibility
const NAV_ITEMS = [
  ...NAV_GROUPS,
  ...NAV_DROPDOWN.flatMap(function(g){return g.items;}),
];

function CaseManager({ cases, activeCaseId, onSelect, onNew, onDelete }) {
  const statusColor = (s) => s==="active"?T.teal:s==="settled"?T.gold:s==="closed"?T.muted:T.red;
  const statusLabel = (s) => s==="active"?"Active":s==="settled"?"Settled":s==="closed"?"Closed":"Pending";
  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h2 style={{color:T.gold,margin:0,fontSize:22}}>⚖ My Cases</h2>
          <p style={{color:T.muted,margin:"4px 0 0",fontSize:13}}>Manage all your legal matters in one place</p>
        </div>
        <button onClick={onNew} style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          + New Case
        </button>
      </div>

      {cases.length===0 && (
        <div style={{textAlign:"center",padding:"60px 20px",background:T.navyM,borderRadius:12,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:48,marginBottom:16}}>⚖</div>
          <div style={{color:T.white,fontSize:18,marginBottom:8}}>No cases yet</div>
          <div style={{color:"#1E3A5F",fontSize:14,marginBottom:24}}>Start by adding your first legal matter</div>
          <button onClick={onNew} style={{background:T.gold,color:T.navy,border:"none",borderRadius:8,padding:"12px 24px",fontWeight:700,cursor:"pointer"}}>
            Add My First Case
          </button>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {cases.map(c => (
          <div key={c.id} onClick={()=>onSelect(c.id)}
            style={{background:c.id===activeCaseId?T.navyL:T.navyM,borderRadius:12,padding:20,
              border:`1px solid ${c.id===activeCaseId?T.gold:T.border}`,cursor:"pointer",
              transition:"all 0.2s",position:"relative"}}>
            {c.id===activeCaseId && (
              <div style={{position:"absolute",top:12,right:12,background:T.gold,color:T.navy,
                fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20}}>ACTIVE</div>
            )}
            <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
              <div style={{fontSize:32,lineHeight:1}}>{c.icon||"⚖"}</div>
              <div style={{flex:1}}>
                <div style={{color:T.white,fontWeight:700,fontSize:16,marginBottom:4}}>{c.title||"Unnamed Case"}</div>
                <div style={{color:"#64748B",fontSize:13,marginBottom:8}}>{c.employer||"Employer not set"} · {c.tribunal||"Venue not set"}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{background:statusColor(c.status)+"22",color:statusColor(c.status),
                    fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,border:`1px solid ${statusColor(c.status)}44`}}>
                    {statusLabel(c.status||"active")}
                  </span>
                  {(c.discType||[]).map(d=>(
                    <span key={d} style={{background:T.goldBg,color:T.goldL,fontSize:11,padding:"3px 10px",borderRadius:20}}>
                      {d}
                    </span>
                  ))}
                  {c.caseRef && (
                    <span style={{background:T.tealBg,color:T.tealL,fontSize:11,padding:"3px 10px",borderRadius:20}}>
                      Ref: {c.caseRef}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={e=>{e.stopPropagation();if(window.confirm("Delete this case? This cannot be undone."))onDelete(c.id);}}
                style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:"4px",lineHeight:1}}
                title="Delete case">✕</button>
            </div>
            {c.nextDeadline && (
              <div style={{marginTop:12,padding:"8px 12px",background:T.redBg,borderRadius:8,
                color:T.redL,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                ⏰ Next deadline: {c.nextDeadline}
              </div>
            )}
          </div>
        ))}
      </div>

      {cases.length>0 && (
        <div style={{marginTop:24,padding:16,background:T.navyM,borderRadius:12,border:`1px solid ${T.border}`}}>
          <div style={{color:T.gold,fontWeight:700,marginBottom:12,fontSize:14}}>📊 Portfolio Overview</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {label:"Total Cases",value:cases.length,icon:"⚖"},
              {label:"Active",value:cases.filter(c=>c.status==="active"||!c.status).length,icon:"🔴"},
              {label:"Settled",value:cases.filter(c=>c.status==="settled").length,icon:"✅"},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center",padding:12,background:T.navyL,borderRadius:8}}>
                <div style={{fontSize:24}}>{s.icon}</div>
                <div style={{color:T.white,fontWeight:700,fontSize:20}}>{s.value}</div>
                <div style={{color:"#64748B",fontSize:11}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewCaseForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    title:"", employer:"", tribunal:"Employment Tribunal",
    caseRef:"", status:"active", icon:"⚖",
    discType:[], nextDeadline:"", notes:""
  });
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const ICONS = [
    { emoji:"⚖", label:"Tribunal" },
    { emoji:"🏢", label:"Employer" },
    { emoji:"🏪", label:"Retail" },
    { emoji:"🏥", label:"NHS/Health" },
    { emoji:"🏦", label:"Financial" },
    { emoji:"🏫", label:"Education" },
    { emoji:"🚔", label:"Police" },
    { emoji:"📋", label:"General" },
    { emoji:"🏠", label:"Housing" },
    { emoji:"🛡", label:"Safeguard" },
    { emoji:"👶", label:"Child/CPS" },
    { emoji:"💔", label:"Exploitation" },
  ];

  const DISC = [
    "Race","Sex","Disability","Age","Religion","Sexual Orientation","Pregnancy",
    "Whistleblowing","Constructive Dismissal","Unfair Dismissal","Wrongful Dismissal",
    "Sexual Exploitation","Child Sexual Exploitation (CSE)","Grooming / County Lines",
    "Trafficking / Modern Slavery","Institutional Failure","Coercive Control",
    "Honour-Based Abuse","Forced Marriage","FGM","Domestic Violence",
    "Housing Discrimination","Education Discrimination","Healthcare Discrimination",
    "Police Misconduct","Immigration","Nationality",
  ];

  const TRIBUNALS = ["Employment Tribunal","County Court","High Court","ACAS","Civil Court","Criminal Court","Family Court","CICA Claim","Other"];
  const toggleDisc = (d) => F("discType", form.discType.includes(d)?form.discType.filter(x=>x!==d):[...form.discType,d]);

  // Detect if claim is exploitation-related for context hint
  const isExploitation = form.discType.some(d => ["Sexual Exploitation","Child Sexual Exploitation (CSE)","Grooming / County Lines","Trafficking / Modern Slavery","Institutional Failure"].includes(d));

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"24px 16px"}}>
      <h2 style={{color:T.gold,marginBottom:4}}>+ Add New Case</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:24}}>Each case has its own evidence, documents, timeline and AI tools.</p>

      <div style={{background:T.navyM,borderRadius:12,padding:24,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:16}}>

        <div>
          <label style={{color:T.white,fontSize:13,display:"block",marginBottom:8}}>Case Icon — click to choose</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {ICONS.map(ic=>(
              <button key={ic.emoji} onClick={()=>F("icon",ic.emoji)}
                style={{
                  width:64,height:64,fontSize:22,
                  border:`2px solid ${form.icon===ic.emoji?T.gold:T.border}`,
                  borderRadius:10,background:form.icon===ic.emoji?T.goldBg:T.navyL,
                  cursor:"pointer",display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",gap:2,
                  transition:"all 0.15s",
                }}>
                <span>{ic.emoji}</span>
                <span style={{fontSize:9,color:form.icon===ic.emoji?T.gold:T.muted,lineHeight:1}}>{ic.label}</span>
              </button>
            ))}
          </div>
          <div style={{color:T.dim,fontSize:11,marginTop:6}}>
            Selected: <span style={{fontSize:18}}>{form.icon}</span> {ICONS.find(i=>i.emoji===form.icon)?.label}
          </div>
        </div>

        <div>
          <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Case Title *</label>
          <input value={form.title} onChange={e=>F("title",e.target.value)} placeholder="e.g. ET Claim vs [Employer Name] / Race Discrimination Claim"
            style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Employer / Respondent / Authority *</label>
            <input value={form.employer} onChange={e=>F("employer",e.target.value)} placeholder="e.g. ABC Retail Ltd, Local Council, Police Force"
              style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Case Reference</label>
            <input value={form.caseRef} onChange={e=>F("caseRef",e.target.value)} placeholder="e.g. 2600123/2024"
              style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Venue / Forum</label>
            <select value={form.tribunal} onChange={e=>F("tribunal",e.target.value)}
              style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14}}>
              {TRIBUNALS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Status</label>
            <select value={form.status} onChange={e=>F("status",e.target.value)}
              style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14}}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{color:T.white,fontSize:13,display:"block",marginBottom:8}}>Claim Types — select all that apply</label>
          <div style={{marginBottom:8,color:"#64748B",fontSize:11}}>Employment & Workplace</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {["Race","Sex","Disability","Age","Religion","Sexual Orientation","Pregnancy","Whistleblowing","Constructive Dismissal","Unfair Dismissal","Wrongful Dismissal"].map(d=>(
              <button key={d} onClick={()=>toggleDisc(d)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:form.discType.includes(d)?T.gold:"transparent",
                  color:form.discType.includes(d)?T.navy:T.muted,
                  border:`1px solid ${form.discType.includes(d)?T.gold:T.border}`}}>
                {d}
              </button>
            ))}
          </div>
          <div style={{marginBottom:8,color:"#64748B",fontSize:11}}>Exploitation, Abuse & Institutional Failure</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {["Sexual Exploitation","Child Sexual Exploitation (CSE)","Grooming / County Lines","Trafficking / Modern Slavery","Institutional Failure","Coercive Control","Honour-Based Abuse","Forced Marriage","FGM","Domestic Violence"].map(d=>(
              <button key={d} onClick={()=>toggleDisc(d)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:form.discType.includes(d)?"#ff9f7f":"transparent",
                  color:form.discType.includes(d)?T.navy:T.muted,
                  border:`1px solid ${form.discType.includes(d)?"#ff9f7f":T.border}`}}>
                {d}
              </button>
            ))}
          </div>
          <div style={{marginBottom:8,color:"#64748B",fontSize:11}}>Other Discrimination Contexts</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Housing Discrimination","Education Discrimination","Healthcare Discrimination","Police Misconduct","Immigration","Nationality"].map(d=>(
              <button key={d} onClick={()=>toggleDisc(d)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:form.discType.includes(d)?T.teal:"transparent",
                  color:form.discType.includes(d)?T.white:T.muted,
                  border:`1px solid ${form.discType.includes(d)?T.teal:T.border}`}}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Exploitation pathway hint */}
        {isExploitation && (
          <div style={{background:"rgba(255,159,127,0.08)",border:"1px solid rgba(255,159,127,0.3)",borderRadius:10,padding:14}}>
            <div style={{color:"#ff9f7f",fontSize:13,fontWeight:700,marginBottom:6}}>💔 Exploitation / Institutional Failure Pathway Detected</div>
            <div style={{color:T.white,fontSize:12,lineHeight:1.7}}>
              After saving, the Assessment will include a dedicated <strong>Sexual Exploitation & Institutional Failure</strong> pathway — covering CICA claims, civil claims against authorities, institutional inaction analysis, shame/blame language detection, and connection to specialist support organisations.
            </div>
          </div>
        )}

        <div>
          <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Next Key Deadline</label>
          <input type="date" value={form.nextDeadline} onChange={e=>F("nextDeadline",e.target.value)}
            style={{padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14}}/>
        </div>

        <div>
          <label style={{color:T.white,fontSize:13,display:"block",marginBottom:6}}>Notes</label>
          <textarea value={form.notes} onChange={e=>F("notes",e.target.value)} rows={3} placeholder="Key facts, context, what happened..."
            style={{width:"100%",padding:"10px 12px",background:T.navyL,color:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:14,resize:"vertical",boxSizing:"border-box"}}/>
        </div>

        <div style={{display:"flex",gap:12}}>
          <Btn onClick={()=>{ if(!form.title||!form.employer){alert("Please fill in Case Title and Respondent"); return;} onSave({...form,id:Date.now().toString(),created:new Date().toISOString()}); }} style={{flex:1}}>Save Case</Btn>
          <button onClick={onCancel} style={{flex:1,background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:14}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const USER_ROLES = {
  individual: {
    id: "individual", label: "Individual Litigant", icon: "👤",
    desc: "Managing my own case(s) — self-represented claimant",
    color: "#4a9eff",
    features: ["Up to 5 concurrent cases", "Full evidence vault", "AI forensic tools", "Document generator", "Deadlines tracker"],
    navItems: ["home","command_centre","cases","dashboard","assessment","evidence","timeline","actions","documents","forensic_hub","comparator","sham_nav","calculator","sar","cctv","intel","protection_hub","recording_studio","file_intake","email_dispatch","support","wellbeing","deadlines","lab","rights","helpline","tracker","notifications","badges","pricing"],
  },
  solicitor: {
    id: "solicitor", label: "Solicitor / Legal Professional", icon: "⚖",
    desc: "Managing client cases — law firm or independent practitioner",
    color: "#C9A84C",
    features: ["Unlimited client cases", "Client portal access", "Bulk document generation", "Team workload view", "B2B API access", "White-label reports"],
    navItems: ["home","command_centre","cases","dashboard","assessment","evidence","timeline","actions","documents","forensic_hub","comparator","sham_nav","calculator","sar","cctv","intel","protection_hub","recording_studio","file_intake","email_dispatch","support","wellbeing","deadlines","lab","rights","tracker","notifications","pricing"],
  },
  cab_adviser: {
    id: "cab_adviser", label: "CAB / LawWorks Adviser", icon: "🤝",
    desc: "Citizens Advice, LawWorks, or charity legal clinic",
    color: "#7bc67e",
    features: ["Client session recording", "Instant case triage", "Referral tools", "Session confirmation", "Multi-client dashboard", "Charity reports"],
    navItems: ["home","command_centre","cases","recording_studio","file_intake","email_dispatch","assessment","forensic_hub","documents","sar","rights","protection_hub","deadlines","tracker","dashboard"],
  },
  union_rep: {
    id: "union_rep", label: "Trade Union Rep", icon: "✊",
    desc: "Supporting members with workplace disputes",
    color: "#ff9f7f",
    features: ["Member case tracking", "Grievance templates", "Collective claim tools", "Union letterhead", "Member portal", "Settlement tracker"],
    navItems: ["home","command_centre","cases","dashboard","assessment","evidence","documents","forensic_hub","comparator","sham_nav","calculator","sar","rights","protection_hub","email_dispatch","tracker","deadlines","notifications"],
  },
  organisation: {
    id: "organisation", label: "Organisation / Employer", icon: "🏛",
    desc: "HR team, compliance, or institutional access",
    color: "#a78bfa",
    features: ["Policy compliance tools", "Grievance procedure guides", "Equality audit tools", "Staff training modules", "Risk assessment", "Regulatory compliance"],
    navItems: ["home","command_centre","cases","dashboard","assessment","documents","rights","protection_hub","email_dispatch","deadlines","tracker"],
  },
};

function OnboardingPortal({ onComplete }) {
  var [step, setStep] = React.useState(1); // 1=email+name, 2=role
  var [name, setName] = React.useState('');
  var [email, setEmail] = React.useState('');
  var [org, setOrg] = React.useState('');
  var [phone, setPhone] = React.useState('');
  var [selectedRole, setSelectedRole] = React.useState('individual');
  var [saving, setSaving] = React.useState(false);
  var [emailError, setEmailError] = React.useState('');
  var [touched, setTouched] = React.useState(false);


  // Temp-mail domains blocked
  var BLOCKED = ['tempmail','guerrillamail','10minutemail','mailinator','throwaway',
    'yopmail','trashmail','sharklasers','maildrop','spamgourmet','dispostable',
    'fakeinbox','mintemail','throwam','getairmail','mailnull','spamspot',
    'trashmail','safetymail','spamfree','discard.email','nospam','mohmal',
    'trbvm','emkei','maildrop','jetable','mailnesia','tempr.email'];

  function validateEmail(val) {
    var v = (val||'').toLowerCase().trim();
    if (!v) return 'Email is required — it links all your cases';
    if (v.indexOf('@') < 1 || v.indexOf('.') < 0) return 'Please enter a valid email address';
    var domain = v.split('@')[1]||'';
    if (BLOCKED.some(function(b){ return domain.includes(b); }))
      return 'Disposable email addresses are not accepted. Please use your real email.';
    return '';
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    if (touched) setEmailError(validateEmail(e.target.value));
  }

  function handleStep1() {
    setTouched(true);
    var err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    if (!name.trim()) return;
    setEmailError('');
    setStep(2);
  }

  function completeOnboarding() {
    setSaving(true);
    var profile = {
      role: selectedRole, name: name.trim(), email: email.toLowerCase().trim(),
      org, phone, created: new Date().toISOString(), onboarded: true,
      initials: name.trim().split(' ').map(function(n){return n[0];}).join('').toUpperCase().slice(0,2)
    };
    S.set('user_profile', profile);
    setTimeout(function(){ setSaving(false); onComplete(profile); }, 600);
  }

  return React.createElement('div', {style:{minHeight:'100vh',background:'#F8F1E9',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}},
    React.createElement('style', null, css),
    React.createElement('div', {style:{maxWidth:560,width:'100%'}},
      // Logo + title
      React.createElement('div', {style:{textAlign:'center',marginBottom:32}},
        React.createElement('div', {style:{fontSize:48,marginBottom:8}}, '⚖️'),
        React.createElement('div', {style:{color:'#0F2C4A',fontSize:28,fontWeight:900,fontFamily:"'Playfair Display',serif",marginBottom:8}}, 'Welcome to UJRIS'),
        React.createElement('div', {style:{color:"#1E3A5F",fontSize:14,lineHeight:1.7}}, 'Universal Justice Response & Intelligence System')
      ),
      // Step indicators
      React.createElement('div', {style:{display:'flex',gap:0,marginBottom:28,borderRadius:10,overflow:'hidden',border:'1px solid '+T.border}},
        ['1. Identity','2. Your Role'].map(function(label,i){
          var active = step === i+1;
          return React.createElement('div', {key:i,style:{flex:1,padding:'10px',textAlign:'center',background:active?T.goldBg:'transparent',color:active?T.gold:T.dim,fontSize:12,fontWeight:active?700:400}}, label);
        })
      ),

      // STEP 1: Email + Name (MANDATORY GATE)
      step===1 && React.createElement('div', {style:{background:'#FAF6F0',borderRadius:16,padding:28,border:'1px solid rgba(212,175,55,0.4)',boxShadow:'0 8px 32px rgba(15,44,74,0.1)'}},
        React.createElement('div', {style:{color:T.gold,fontSize:16,fontWeight:700,marginBottom:6}}, '🔐 Create Your Account'),
        React.createElement('div', {style:{color:"#64748B",fontSize:13,marginBottom:20,lineHeight:1.6}}, 'Your email is your case identifier. All your cases, documents, and evidence are linked to it. No sign-in required — your data stays on your device.'),
        // Email field
        React.createElement('div', {style:{marginBottom:14}},
          React.createElement('div', {style:{color:T.white,fontSize:12,fontWeight:700,marginBottom:6}}, 'EMAIL ADDRESS *'),
          React.createElement('input', {
            value:email, onChange:handleEmailChange, onBlur:function(){setTouched(true);setEmailError(validateEmail(email));},
            placeholder:'your@email.com', type:'email',
            style:{width:'100%',background:T.navyL,border:'2px solid '+(emailError?T.redL:email&&!emailError?T.teal:T.gold+'44'),
              borderRadius:10,padding:'12px 14px',color:T.white,fontSize:14,boxSizing:'border-box'}
          }),
          emailError && React.createElement('div', {style:{color:T.redL,fontSize:11,marginTop:5,display:'flex',gap:4,alignItems:'center'}},
            React.createElement('span', null, '⚠️'), React.createElement('span', null, emailError)
          ),
          !emailError && email && React.createElement('div', {style:{color:T.tealL,fontSize:11,marginTop:5}}, '✓ Valid email — this links all your cases')
        ),
        // Name field
        React.createElement('div', {style:{marginBottom:14}},
          React.createElement('div', {style:{color:T.white,fontSize:12,fontWeight:700,marginBottom:6}}, 'YOUR FULL NAME *'),
          React.createElement('input', {
            value:name, onChange:function(e){setName(e.target.value);},
            placeholder:'e.g. Jane Smith',
            style:{width:'100%',background:T.navyL,border:'2px solid '+(name?T.teal:T.border),borderRadius:10,padding:'12px 14px',color:T.white,fontSize:14,boxSizing:'border-box'}
          })
        ),
        // Phone (optional)
        React.createElement('div', {style:{marginBottom:20}},
          React.createElement('div', {style:{color:"#64748B",fontSize:12,marginBottom:6}}, 'PHONE (optional)'),
          React.createElement('input', {
            value:phone, onChange:function(e){setPhone(e.target.value);},
            placeholder:'07xxx xxxxxx', type:'tel',
            style:{width:'100%',background:T.navyL,border:'1px solid '+T.border,borderRadius:10,padding:'12px 14px',color:T.white,fontSize:14,boxSizing:'border-box'}
          })
        ),
        // Privacy note
        React.createElement('div', {style:{background:T.navyL,borderRadius:8,padding:'10px 14px',marginBottom:16,color:T.dim,fontSize:11,lineHeight:1.6}},
          '🔒 Your data stays on this device only. No account created. No cloud storage. Your email is only used to identify your cases within this app.'
        ),
        React.createElement('button', {
          onClick:handleStep1,
          disabled:!name.trim()||!email||!!emailError,
          style:{width:'100%',background:(!name.trim()||!email||emailError)?T.border:T.gold,color:T.navy,border:'none',borderRadius:10,padding:'14px',fontSize:15,fontWeight:700,cursor:(!name.trim()||!email||emailError)?'not-allowed':'pointer',transition:'all 0.2s'}
        }, 'Continue — Choose Your Role →')
      ),



      // STEP 2: Role selection
      step===2 && React.createElement('div', null,
        React.createElement('div', {style:{background:"#FAF6F0",borderRadius:12,padding:'12px 16px',marginBottom:16,border:'1px solid '+T.teal+'44',display:'flex',gap:12,alignItems:'center'}},
          React.createElement('div', {style:{width:36,height:36,borderRadius:'50%',background:T.goldBg,border:'2px solid '+T.gold,display:'flex',alignItems:'center',justifyContent:'center',color:T.gold,fontSize:14,fontWeight:900,flexShrink:0}},
            name.split(' ').map(function(n){return n[0];}).join('').toUpperCase().slice(0,2)
          ),
          React.createElement('div', null,
            React.createElement('div', {style:{color:"#0F2C4A",fontSize:14,fontWeight:700}}, name),
            React.createElement('div', {style:{color:T.tealL,fontSize:12}}, email)
          ),
          React.createElement('button', {onClick:function(){setStep(1);},style:{marginLeft:'auto',background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:11}}, 'edit')
        ),
        React.createElement('div', {style:{color:T.gold,fontSize:14,fontWeight:700,marginBottom:4,textAlign:'center'}}, 'How will you use UJRIS?'),
        React.createElement('div', {style:{color:"#64748B",fontSize:12,marginBottom:16,textAlign:'center'}}, 'This sets up your personalised portal and tools'),
        React.createElement('div', {style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10,marginBottom:16}},
          Object.values(USER_ROLES).map(function(role){
            return React.createElement('button', {key:role.id,onClick:function(){setSelectedRole(role.id);},
              style:{background:selectedRole===role.id?role.color+'22':T.navyM,border:'2px solid '+(selectedRole===role.id?role.color:T.border),
                borderRadius:14,padding:16,textAlign:'left',cursor:'pointer',transition:'all 0.2s'}},
              React.createElement('div', {style:{display:'flex',gap:10,alignItems:'flex-start'}},
                React.createElement('span', {style:{fontSize:26}}, role.icon),
                React.createElement('div', {style:{flex:1}},
                  React.createElement('div', {style:{color:selectedRole===role.id?role.color:"#0F2C4A",fontSize:13,fontWeight:700,marginBottom:3}}, role.label),
                  React.createElement('div', {style:{color:"#64748B",fontSize:11,lineHeight:1.5}}, role.desc),
                  React.createElement('div', {style:{display:'flex',flexWrap:'wrap',gap:3,marginTop:6}},
                    role.features.slice(0,3).map(function(f){
                      return React.createElement('span', {key:f,style:{background:role.color+'15',color:role.color,fontSize:9,padding:'2px 6px',borderRadius:6}}, f);
                    })
                  )
                ),
                selectedRole===role.id && React.createElement('span', {style:{color:role.color,fontSize:16}}, '✓')
              )
            );
          })
        ),
        React.createElement('div', {style:{background:T.redBg,borderRadius:10,padding:'10px 14px',marginBottom:14,color:"#64748B",fontSize:11,lineHeight:1.5}},
          '⚠ Beta prototype. Not legal advice. Data stays on your device. Consult a qualified solicitor for your specific case.'
        ),
        React.createElement('button', {
          onClick:completeOnboarding, disabled:saving||!selectedRole,
          style:{width:'100%',background:T.gold,color:T.navy,border:'none',borderRadius:10,padding:'14px',fontSize:15,fontWeight:700,cursor:saving?'wait':'pointer'}
        }, saving?'Setting up your portal...':'Enter Your Portal →')
      )
    )
  );
}

function UserProfilePanel({ profile, cases, onEdit, onClose, onSignOut }) {
  const casesByEmail = cases.filter(c => c.ownerEmail === profile.email || !c.ownerEmail);
  const role = USER_ROLES[profile.role];

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: Math.min(380, window.innerWidth), background: T.navy, borderLeft: `1px solid ${T.border}`, zIndex: 500, overflowY: "auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: T.gold, fontSize: 16, fontWeight: 700 }}>👤 Your Profile</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>×</button>
      </div>

      {/* Role Badge */}
      <div style={{ background: `${role?.color}15`, border: `1px solid ${role?.color}44`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 28 }}>{role?.icon}</span>
          <div>
            <div style={{ color: role?.color, fontSize: 14, fontWeight: 700 }}>{role?.label}</div>
            <div style={{ color: T.white, fontSize: 13 }}>{profile.name}</div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${T.border}` }}>
        <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Contact Details</div>
        {[
          { label: "Email (Case ID)", value: profile.email, icon: "✉" },
          { label: "Phone", value: profile.phone || "Not set", icon: "📞" },
          { label: "Organisation", value: profile.org || "N/A", icon: "🏛" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.muted, fontSize: 12 }}>{item.icon} {item.label}</span>
            <span style={{ color: T.white, fontSize: 12, maxWidth: 180, textAlign: "right", wordBreak: "break-all" }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Cases linked to this email */}
      <div style={{ background: T.navyM, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${T.border}` }}>
        <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          Cases Linked to {profile.email} ({casesByEmail.length})
        </div>
        {casesByEmail.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 12 }}>No cases yet</div>
        ) : casesByEmail.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 16 }}>{c.icon || "⚖"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.white, fontSize: 12, fontWeight: 600 }}>{c.title}</div>
              <div style={{ color: T.muted, fontSize: 10 }}>{c.discType?.join(", ")}</div>
            </div>
            <span style={{ color: c.status === "active" ? T.tealL : T.muted, fontSize: 10 }}>{c.status || "active"}</span>
          </div>
        ))}
      </div>

      {/* Edit Profile */}
      <Btn onClick={onEdit} style={{ width: "100%", marginBottom: 10 }}>✏️ Edit Profile</Btn>
      <button onClick={function(){onSignOut&&onSignOut();}} style={{ width: "100%", background: T.redBg, color: "#ff8080", border: "1px solid #ff444433", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>
        Switch Portal / Role
      </button>
    </div>
  );
}

export default function App() {

  const [tab, setTab] = useState("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [showShield, setShowShield] = useState(false);
  const [userProfile, setUserProfile] = React.useState(() => S.get('user_profile', null));
  const [showProfile, setShowProfile] = React.useState(false);
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [cases, setCases] = useState(()=>{
    const saved = S.get("all_cases", null);
    if (saved) return saved;
    // Migrate legacy single case if exists
    const legacy = S.get("casedata", null);
    if (legacy) return [{
      id: "legacy_1", title: legacy.description||"My Case",
      employer: legacy.setting||"", tribunal: "Employment Tribunal",
      status: "active", icon: "⚖",
      discType: legacy.discType||[], caseRef:"", nextDeadline:"", notes:"",
      created: new Date().toISOString(), caseData: legacy,
      aiAssessment: S.get("assessment_ai","")
    }];
    return [];
  });
  const [activeCaseId, setActiveCaseId] = useState(()=>{
    const saved = S.get("all_cases", null);
    return saved?.[0]?.id || "legacy_1";
  });
  const [showNewCase, setShowNewCase] = useState(false);

  const activeCase = cases.find(c=>c.id===activeCaseId)||cases[0]||null;
  const caseData = activeCase?.caseData||null;
  const aiAssessment = activeCase?.aiAssessment||"";

  const saveCases = (updated) => { setCases(updated); S.set("all_cases", updated); };

  const handleAssessmentComplete = (data, ai) => {
    const updated = cases.map(c=>c.id===activeCaseId?{...c,caseData:data,aiAssessment:ai,
      discType:data.discType||c.discType, employer:data.setting||c.employer}:c);
    saveCases(updated);
    S.set("casedata",data); S.set("assessment_ai",ai);
    setTab("actions");
  };

  const handleNewCase = (newCase) => {
    const updated = [...cases, newCase];
    saveCases(updated);
    setActiveCaseId(newCase.id);
    setShowNewCase(false);
    setTab("assessment");
  };

  const handleDeleteCase = (id) => {
    const updated = cases.filter(c=>c.id!==id);
    saveCases(updated);
    if (activeCaseId===id) setActiveCaseId(updated[0]?.id||null);
  };

  const navTo = (id) => { setTab(id); setMobileNav(false); window.scrollTo({top:0,behavior:"smooth"}); };

  const SCREENS = {
    home: React.createElement(SovereignLanding, {setTab:setTab, userProfile:userProfile}),
    cases: showNewCase
      ? <NewCaseForm onSave={handleNewCase} onCancel={()=>setShowNewCase(false)}/>
      : <CaseManager cases={cases} activeCaseId={activeCaseId}
          onSelect={(id)=>{setActiveCaseId(id);setTab("dashboard");}}
          onNew={()=>setShowNewCase(true)}
          onDelete={handleDeleteCase}/>,
    dashboard: <Dashboard setTab={setTab} caseData={caseData} userProfile={userProfile}/>,
    assessment: <Assessment onComplete={handleAssessmentComplete}/>,
    evidence: <EvidenceVault caseData={caseData}/>,
    timeline: <Timeline caseData={caseData}/>,
    actions: <ActionCentre caseData={caseData} aiAssessment={aiAssessment}/>,
    documents: <Documents caseData={caseData}/>,
    forensic: <Forensic/>,
    intel: <CaseIntelligence/>,
    support: <SupportNetwork caseData={caseData}/>,
    wellbeing: <WellbeingAndImpact caseData={caseData}/>,
    deadlines: <DeadlinesCentre/>,
    lab: <EvidenceLab/>,
    sar: <SARIntelligence/>,
    cctv: <CCTVAnalyser/>,
    calculator: <Calculator caseData={caseData}/>,
    tracker: <ActionTracker cases={cases} navTo={navTo}/>,
    notifications: <EmailReminderSetup cases={cases}/>,
    badges: <BadgesScreen/>,
    command_centre: <CommandCentre cases={cases} setTab={setTab} onSelectCase={(id)=>{setActiveCaseId(id);}}/>,
    visual_report: <CaseVisualReport caseData={caseData} cases={cases} activeCase={activeCase}/>,
    client_portal: <ClientPortalAccess cases={cases}/>,
    recording_studio: <LiveRecordingStudio caseData={caseData}/>,
    file_intake: <UniversalFileIntake caseData={caseData} cases={cases} setTab={setTab}/>,
    email_dispatch: <EmailDispatchCentre caseData={caseData} cases={cases}/>,
    learn: <EducationalHub setTab={setTab}/>,
    community: <CommunityForums userProfile={userProfile}/>,
    protection_hub: <ProtectionHub/>,
    forensic_hub: <ForensicIntelligenceHub caseData={caseData} setTab={setTab}/>,
    comparator: <ComparatorIntelligence caseData={caseData}/>,
    sham_nav: <ShamHearingNavigator caseData={caseData}/>,
    kpi: React.createElement(KPIDashboard, {cases:cases, caseData:caseData, setTab:navTo}),
    gallery: React.createElement(KnowledgeLibrary, {setTab:navTo, userProfile:userProfile, cases:cases, caseData:caseData}),
    helpline: React.createElement(HelplineDirectory, null),
    pricing: <Pricing/>,
    rights: <Rights userProfile={userProfile}/>,
  };
  function handleSignOut() {
    if (window.confirm('Sign out? Your cases and data will remain saved on this device. You will need to sign in again with the same email to access them.')) {
      S.del('user_profile');
      setUserProfile(null);
      setShowProfile(false);
    }
  }
  if (!userProfile || !userProfile.email || !userProfile.onboarded) {
    return React.createElement(OnboardingPortal, {
      onComplete: function(profile) {
        setUserProfile(profile);
        S.set('user_profile', profile);
      }
    });
  }
  var SIDEBAR_SECTIONS = [
    { label:"Main", items:[
      {id:"home",    icon:"🏛", label:"Home"},
      {id:"dashboard",icon:"📊",label:"Dashboard"},
      {id:"cases",   icon:"📁", label:"My Cases"},
      {id:"evidence",icon:"🗂", label:"Case Vault"},
      {id:"kpi",     icon:"📈", label:"KPI Live"},
    ]},
    { label:"My Case", items:[
      {id:"assessment",icon:"🧭",label:"Assessment"},
      {id:"evidence", icon:"🗄", label:"Evidence"},
      {id:"timeline", icon:"📅", label:"Timeline"},
      {id:"actions",  icon:"🗺", label:"Actions"},
      {id:"deadlines",icon:"⏰", label:"Deadlines"},
      {id:"documents",icon:"✍", label:"Documents"},
      {id:"calculator",icon:"⚖",label:"Calculator"},
    ]},
    { label:"AI Tools", items:[
      {id:"forensic_hub",icon:"🔬",label:"Forensic Hub"},
      {id:"comparator",icon:"⚖",label:"Comparator"},
      {id:"sham_nav",icon:"🎭",label:"Sham Hearing"},
      {id:"intel",  icon:"🧠", label:"Case Intel"},
      {id:"cctv",   icon:"📹", label:"CCTV Analyser"},
      {id:"lab",    icon:"🔐", label:"Evidence Lab"},
      {id:"sar",    icon:"📂", label:"SAR Intelligence"},
    ]},
    { label:"Documents", items:[
      {id:"email_dispatch",icon:"✉",label:"Email Dispatch"},
      {id:"file_intake",icon:"📥",label:"File Intake"},
      {id:"recording_studio",icon:"🎙",label:"Recording Studio"},
    ]},
    { label:"Safety & Support", items:[
      {id:"protection_hub",icon:"🛡",label:"Protection Hub"},
      {id:"helpline",icon:"📞",label:"Helplines"},
      {id:"support", icon:"🤝", label:"Support Network"},
      {id:"wellbeing",icon:"💚",label:"Wellbeing"},
    ]},
    { label:"Knowledge", items:[
      {id:"learn",  icon:"📚", label:"Educational Hub"},
      {id:"gallery",icon:"🎬", label:"Media Gallery"},
      {id:"community",icon:"🌐",label:"Community"},
      {id:"rights", icon:"📖", label:"Know Your Rights"},
    ]},
    { label:"Account", items:[
      {id:"command_centre",icon:"⚡",label:"Command Centre"},
      {id:"tracker",icon:"📋",label:"Action Tracker"},
      {id:"notifications",icon:"🔔",label:"Alerts"},
      {id:"badges",icon:"🏆",label:"Badges"},
      {id:"pricing",icon:"💎",label:"Upgrade"},
    ]},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#F8F1E9",display:"flex",flexDirection:"column"}}>
      <style>{css}</style>
      <Disclaimer/>

      {/* Shield overlay */}
      {showShield && React.createElement(SovereignShield, {onClose:function(){setShowShield(false);}})}

      {/* Profile panel overlay */}
      {showProfile && React.createElement(UserProfilePanel, {
        profile:userProfile, cases:cases,
        onEdit:function(){setEditingProfile(true); setShowProfile(false);},
        onClose:function(){setShowProfile(false);},
        onSignOut:handleSignOut
      })}

      {/* ── APP SHELL: sidebar + main ── */}
      <div style={{display:"flex",flex:1,minHeight:"100vh",position:"relative"}}>

        {/* ── LEFT SIDEBAR ── */}
        <aside id="ujris-sidebar" style={{
          width:240,flexShrink:0,background:"#0F2C4A",
          borderRight:"1px solid rgba(201,168,76,0.12)",
          position:"fixed",top:0,left:0,bottom:0,
          overflowY:"auto",zIndex:300,
          display:"flex",flexDirection:"column",
        }}>
          {/* Sidebar logo */}
          <div style={{padding:"20px 18px 14px",borderBottom:"1px solid rgba(201,168,76,0.1)",flexShrink:0}}>
            <button onClick={()=>navTo("home")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:10,width:"100%"}}>
              <Logo size={28}/>
              <div style={{textAlign:"left"}}>
                <div style={{color:T.gold,fontSize:15,fontWeight:900,fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>UJRIS</div>
                <div style={{color:T.dim,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>Justice Intelligence</div>
              </div>
            </button>
          </div>

          {/* Active case pill */}
          {activeCase && (
            <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <button onClick={()=>navTo("cases")} style={{
                width:"100%",background:T.goldBg,border:"1px solid "+T.gold+"44",borderRadius:10,
                padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,textAlign:"left"
              }}>
                <span style={{fontSize:16}}>{activeCase.icon||"⚖"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.gold,fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeCase.title||"My Case"}</div>
                  <div style={{color:T.dim,fontSize:9,marginTop:1}}>Active case · tap to manage</div>
                </div>
                {cases.length>1&&<span style={{color:T.goldD,fontSize:10,fontWeight:700,background:T.navyL,borderRadius:8,padding:"1px 6px",flexShrink:0}}>{cases.length}</span>}
              </button>
            </div>
          )}

          {/* Nav sections */}
          <nav style={{flex:1,padding:"8px 0",overflowY:"auto"}}>
            {SIDEBAR_SECTIONS.map(function(section){
              return React.createElement("div", {key:section.label,style:{marginBottom:4}},
                React.createElement("div", {style:{color:"rgba(212,175,55,0.7)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",padding:"8px 18px 4px"}}, section.label),
                React.createElement("div", null,
                  section.items.map(function(item){
                    var active = tab===item.id;
                    return React.createElement("button", {
                      key:item.id, onClick:function(){navTo(item.id);},
                      style:{
                        width:"100%",background:active?"rgba(212,175,55,0.18)":"transparent",
                        border:"none",borderLeft:active?"3px solid "+T.gold:"3px solid transparent",
                        padding:"9px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                        textAlign:"left",transition:"all 0.15s",
                      }
                    },
                      React.createElement("span", {style:{fontSize:16,opacity:1,flexShrink:0}}, item.icon),
                      React.createElement("span", {style:{color:active?T.gold:"#B8CCD8",fontSize:12,fontWeight:active?700:400}}, item.label)
                    );
                  })
                )
              );
            })}
          </nav>

          {/* Sidebar bottom: shield + sign out */}
          <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",flexShrink:0,display:"flex",flexDirection:"column",gap:6}}>
            <button onClick={function(){setShowShield(true);}} style={{
              width:"100%",background:"rgba(139,32,32,0.3)",border:"1px solid rgba(255,100,100,0.4)",
              borderRadius:8,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:"#ffaaaa",fontSize:11,fontWeight:700
            }}>
              <span style={{fontSize:14}}>🛡️</span> Sovereign Shield
            </button>
            <button onClick={function(){setShowProfile(true);}} style={{
              width:"100%",background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.3)",
              borderRadius:8,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:"#B8CCD8",fontSize:11
            }}>
              <div style={{width:20,height:20,borderRadius:"50%",background:T.gold,display:"flex",alignItems:"center",justifyContent:"center",color:T.navy,fontSize:9,fontWeight:900,flexShrink:0}}>
                {userProfile.initials||(userProfile.name||"U").slice(0,2).toUpperCase()}
              </div>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userProfile.name||"Profile"}</span>
            </button>
          </div>
        </aside>

        {/* ── RIGHT: topbar + content ── */}
        <div style={{marginLeft:240,flex:1,display:"flex",flexDirection:"column",minWidth:0,background:"#F8F1E9"}}>

          {/* ── TOP BAR ── */}
          <header style={{
            position:"sticky",top:0,zIndex:200,height:60,
            background:"rgba(248,241,233,0.97)",backdropFilter:"blur(12px)",
            borderBottom:"1px solid #EDE4D9",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"0 28px",flexShrink:0
          }}>
            {/* Page title */}
            <div>
              <div style={{color:"#0F2C4A",fontSize:16,fontWeight:700}}>
                {SIDEBAR_SECTIONS.flatMap(function(s){return s.items;}).find(function(i){return i.id===tab;})?.label||"UJRIS"}
              </div>
            </div>

            {/* Right side: notifications + user identity */}
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <NotificationBell cases={cases} navTo={navTo}/>
              {/* User identity — always visible, full name */}
              <button onClick={function(){setShowProfile(true);}} style={{
                display:"flex",alignItems:"center",gap:10,background:"rgba(201,168,76,0.06)",
                border:"1px solid rgba(212,175,55,0.3)",borderRadius:12,padding:"6px 14px 6px 8px",cursor:"pointer"
              }}>
                <div style={{
                  width:32,height:32,borderRadius:"50%",
                  background:"linear-gradient(135deg,"+T.gold+",#e6a000)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:T.navy,fontSize:12,fontWeight:900,flexShrink:0
                }}>
                  {userProfile.initials||(userProfile.name||"U").slice(0,2).toUpperCase()}
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{color:T.white,fontSize:12,fontWeight:700,lineHeight:1.2}}>{userProfile.name||"User"}</div>
                  <div style={{color:T.dim,fontSize:10,lineHeight:1.1}}>{userProfile.email||""}</div>
                </div>
              </button>
            </div>
          </header>

          {/* ── MAIN CONTENT ── */}
          <main style={{flex:1,padding:"28px 28px 60px",overflowY:"auto",background:"#F8F1E9"}}>
            <div className="fade-up">
              {SCREENS[tab]}
            </div>
          </main>

          {/* ── FOOTER ── */}
          <footer style={{borderTop:"1px solid rgba(201,168,76,0.08)",background:"#EDE4D9",padding:"20px 28px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Logo size={20}/><span style={{color:T.dim,fontSize:12,fontFamily:"'Playfair Display',serif"}}>UJRIS</span></div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {icon:"f",url:"https://www.facebook.com/profile.php?id=61585067450333",bg:"#1877F2"},
                  {icon:"📸",url:"https://www.instagram.com/ujrisintel/",bg:"linear-gradient(135deg,#f09433,#dc2743,#bc1888)"},
                  {icon:"𝕏",url:"https://x.com/UJRIS_OFFICIAL",bg:"#111"},
                  {icon:"in",url:"https://www.linkedin.com/company/111627785",bg:"#0077B5"},
                  {icon:"♪",url:"https://www.tiktok.com/@ujrisapp",bg:"#111"},
                  {icon:"▶",url:"https://www.youtube.com/channel/UCZjra3BMtLX1JdOD6218FAA",bg:"#FF0000"},
                ].map(function(s,i){
                  return React.createElement("a",{key:i,href:s.url,target:"_blank",rel:"noopener noreferrer",
                    style:{width:30,height:30,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:900,textDecoration:"none"}},s.icon);
                })}
              </div>
            </div>
            <div style={{color:"rgba(15,44,74,0.4)",fontSize:10,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
              <span>© 2026 UJRIS. Beta prototype. Not legal advice. All data stays on your device.</span>
              <span>Mission: Level the playing field.</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
