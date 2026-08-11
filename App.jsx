import { useState } from "react";

// ══════════════════════════════════════════════════════════════════
// GOOGLE SHEET CONNECTION
// Paste your deployed Apps Script Web App URL here (see setup guide).
// ══════════════════════════════════════════════════════════════════
const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

async function submitToGoogleSheet(payload) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.startsWith("PASTE_")) {
    console.warn("Google Sheet URL not configured — response was not saved.");
    return { ok: false, reason: "not_configured" };
  }
  try {
    // Apps Script webhooks don't return readable CORS responses from the
    // browser, so we fire with no-cors and treat the request as sent.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (err) {
    console.error("Failed to submit to Google Sheet:", err);
    return { ok: false, reason: "network_error" };
  }
}

// ══════════════════════════════════════════════════════════════════
// FAMILY & ROLE STRUCTURE (from Four Role Families doc)
// ══════════════════════════════════════════════════════════════════
const FAMILIES = [
  {
    id: "support_ops",
    name: "Support & Ops",
    icon: "🗂️",
    tagline: "Keeping a business's day-to-day running smoothly",
    color: "#2E4057",
    roles: ["Executive Assistant", "Administrative Assistant", "Customer Support Rep"],
  },
  {
    id: "revenue",
    name: "Revenue",
    icon: "📈",
    tagline: "Work directly tied to money coming in",
    color: "#166534",
    roles: ["SDR (Sales Development Rep)", "Customer Success Manager", "Ads Buyer / Media Buyer"],
  },
  {
    id: "creative",
    name: "Creative",
    icon: "🎨",
    tagline: "Content and design work brands always need",
    color: "#7C2D12",
    roles: ["Video Editor", "Graphic Designer", "Social Media Manager", "Ghostwriter"],
  },
  {
    id: "build",
    name: "Build",
    icon: "🛠️",
    tagline: "Technical work — sites, stores, software, automation",
    color: "#1D4ED8",
    roles: ["Web Developer", "Ecommerce Site Designer", "Automation Specialist", "Software Developer"],
  },
];

// ══════════════════════════════════════════════════════════════════
// SHARED SECTIONS — every candidate answers these
// (Deduplicated against the Screening Questionnaire — goes DEEPER,
//  not wider, on AI / CRM / portfolio / testimonials)
// ══════════════════════════════════════════════════════════════════
const SHARED_SECTIONS = [
  {
    id: "background",
    title: "Professional Background",
    subtitle: "Help us understand where you're coming from.",
    icon: "👤",
    questions: [
      {
        id: "q1",
        text: "How long have you been working professionally in remote client work?",
        type: "single",
        options: [
          { label: "I haven't started yet — I'm just getting into remote work", score: 0 },
          { label: "Less than 6 months", score: 0 },
          { label: "6 months to 1 year", score: 1 },
          { label: "1 to 2 years", score: 2 },
          { label: "2 to 4 years", score: 3 },
          { label: "4+ years with multiple long-term clients", score: 4 },
        ],
      },
      {
        id: "q2",
        text: "How would you describe your current client experience overall?",
        type: "single",
        options: [
          { label: "No real client experience yet — mostly self-study or courses", score: 0 },
          { label: "I've done a few small tasks or volunteer projects", score: 1 },
          { label: "I've completed projects for 2–5 paying clients", score: 2 },
          { label: "I manage ongoing work for multiple clients independently", score: 3 },
          { label: "I have long-term client relationships and a documented track record of results", score: 4 },
        ],
      },
      {
        id: "q3",
        text: "What is the highest value project or retainer you have handled?",
        type: "single",
        options: [
          { label: "No paid projects yet", score: 0 },
          { label: "Under $100", score: 0 },
          { label: "$100 – $499", score: 1 },
          { label: "$500 – $999", score: 2 },
          { label: "$1,000 – $4,999", score: 3 },
          { label: "$5,000 or above", score: 4 },
        ],
      },
    ],
  },
  {
    id: "ai_depth",
    title: "How You Actually Use AI",
    subtitle: "You already told us on the screening form whether you use AI. Now tell us how — with real depth.",
    icon: "🤖",
    questions: [
      {
        id: "q4",
        text: "Beyond basic drafting, how do you use AI tools inside your actual workflow?",
        type: "single",
        options: [
          { label: "I mostly use AI for one-off things like writing an email or answering a question", score: 0 },
          { label: "I use AI regularly for research, drafting, and summarizing as part of daily tasks", score: 1 },
          { label: "I use AI to triage backlogs, personalize outreach at scale, or speed up creative drafts — then apply my own judgment before it goes to a client", score: 2 },
          { label: "I build repeatable AI-assisted processes (prompt templates, workflows) that I reuse across clients", score: 3 },
          { label: "I design AI-powered systems or automations for clients as part of the actual service I deliver", score: 4 },
        ],
      },
      {
        id: "q5",
        text: "Describe, in your own words, the most advanced way you've used AI in real client or project work.",
        type: "text",
        placeholder: "Be specific: what was the task, which tool did you use, and what changed as a result?",
      },
    ],
  },
  {
    id: "professionalism",
    title: "Communication & Reliability",
    subtitle: "Client trust is built here.",
    icon: "💬",
    questions: [
      {
        id: "q6",
        text: "How do you typically communicate with clients?",
        type: "single",
        options: [
          { label: "I respond when I can — communication is something I'm working on", score: 0 },
          { label: "I respond within a day or two and update clients when asked", score: 1 },
          { label: "I respond promptly and update clients proactively on project status", score: 2 },
          { label: "I maintain clear communication SLAs and clients rarely have to ask for updates", score: 3 },
          { label: "I set communication expectations upfront, run structured check-ins, and my clients consistently praise my responsiveness", score: 4 },
        ],
      },
      {
        id: "q7",
        text: "How comfortable are you communicating on video calls with clients?",
        type: "single",
        options: [
          { label: "Not comfortable yet — I prefer text or email", score: 0 },
          { label: "I can do it but I find it uncomfortable", score: 1 },
          { label: "I'm comfortable on video calls and can present my work clearly", score: 2 },
          { label: "I run video check-ins confidently and can facilitate meetings with multiple stakeholders", score: 3 },
          { label: "I use video to lead strategy sessions, train teams, and represent clients professionally", score: 4 },
        ],
      },
    ],
  },
  {
    id: "results_depth",
    title: "Proof of Work — Going Deeper",
    subtitle: "You already told us on the screening form if you have a portfolio or testimonials. Now show us the substance behind it.",
    icon: "📊",
    questions: [
      {
        id: "q8",
        text: "Pick the option that best matches the quality of proof you can currently show us.",
        type: "single",
        options: [
          { label: "I don't have documented proof of work yet", score: 0 },
          { label: "I have samples but no measurable outcomes attached to them", score: 1 },
          { label: "I have samples with some numbers attached (e.g. 'grew followers,' 'replied faster')", score: 2 },
          { label: "I have a portfolio with clear before/after results and at least one strong testimonial", score: 3 },
          { label: "I have documented case studies with quantified business results (%, $, time saved, growth) and multiple references", score: 4 },
        ],
      },
      {
        id: "q9",
        text: "In one or two sentences, what is the single strongest result you can point to from your work so far?",
        type: "text",
        placeholder: "e.g. 'Cut average response time from 12 hours to 2 hours across 200+ tickets/month.'",
      },
    ],
  },
  {
    id: "growth",
    title: "Growth Mindset & Agency Fit",
    subtitle: "We grow together. Tell us how you approach your own development.",
    icon: "🚀",
    questions: [
      {
        id: "q10",
        text: "How do you respond when a client gives you critical feedback on your work?",
        type: "single",
        options: [
          { label: "It's something I find difficult and am working through", score: 0 },
          { label: "I accept it but it takes time to process and respond well", score: 1 },
          { label: "I take it professionally, correct the issue, and move on", score: 2 },
          { label: "I welcome feedback, implement it quickly, and follow up to confirm the client is satisfied", score: 3 },
          { label: "I actively seek feedback after every project and use it as a structured tool for improvement", score: 4 },
        ],
      },
      {
        id: "q11",
        text: "Are you open to mentorship — either receiving it or eventually providing it to newer team members?",
        type: "single",
        options: [
          { label: "I need significant guidance and mentorship right now", score: 0 },
          { label: "I'd benefit from mentorship and am open to it", score: 1 },
          { label: "I can work mostly independently but value occasional guidance", score: 2 },
          { label: "I'm largely self-directed and could informally support newer colleagues", score: 3 },
          { label: "I actively mentor others and see it as part of my professional responsibility", score: 4 },
        ],
      },
    ],
  },
  {
    id: "readiness",
    title: "Pitch-Readiness",
    subtitle: "This tells us whether we can put you in front of a client right now, or whether you need a short runway first.",
    icon: "🎯",
    questions: [
      {
        id: "q12",
        text: "If we had a client ready today in your strongest family, how soon could you realistically start?",
        type: "single",
        options: [
          { label: "I would need more training or preparation before I'm ready", score: 0 },
          { label: "Within 2–3 weeks", score: 1 },
          { label: "Within 1–2 weeks", score: 2 },
          { label: "Within 5 working days", score: 4 },
          { label: "Immediately — I'm available now", score: 4 },
        ],
      },
      {
        id: "q13",
        text: "How many hours per week can you realistically commit to client work?",
        type: "single",
        options: [
          { label: "Under 10 hours/week", score: 0 },
          { label: "10–19 hours/week", score: 1 },
          { label: "20–29 hours/week", score: 2 },
          { label: "30–39 hours/week", score: 3 },
          { label: "40 hours/week or more", score: 4 },
        ],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════
// FAMILY-SPECIFIC SECTIONS — only the chosen family's section shows
// ══════════════════════════════════════════════════════════════════
const FAMILY_SECTIONS = {
  support_ops: {
    id: "family_support_ops",
    title: "Support & Ops — Deep Dive",
    subtitle: "What good looks like in this family: fast, clean communication and discretion with sensitive information.",
    icon: "🗂️",
    questions: [
      {
        id: "fq1",
        text: "Which tools have you used professionally? (Select the option that best matches your depth)",
        type: "single",
        options: [
          { label: "Basic tools only — email, Google Docs", score: 0 },
          { label: "2–3 tools like Slack, Google Workspace, or Trello", score: 1 },
          { label: "4–5 tools including Notion, Asana, ClickUp, or a CRM", score: 2 },
          { label: "6+ tools, and I can learn a new one quickly without formal training", score: 3 },
          { label: "8+ tools at an advanced level — I've created SOPs or trained others on them", score: 4 },
        ],
      },
      {
        id: "fq2",
        text: "Describe a time you managed a calendar, inbox, or support queue under real pressure (high volume, tight deadlines, or conflicting priorities). What did you do?",
        type: "text",
        placeholder: "Tell us the specific situation and how you handled it.",
      },
      {
        id: "fq3",
        text: "What proof of work can you offer for this family?",
        type: "single",
        options: [
          { label: "None yet", score: 0 },
          { label: "A description of systems I've managed, but no direct reference", score: 1 },
          { label: "A reference who can confirm my day-to-day admin/support work", score: 2 },
          { label: "A documented sample — SOP, inbox workflow, or ticket resolution stats", score: 3 },
          { label: "Multiple references plus measurable stats (response time, ticket volume, accuracy rate)", score: 4 },
        ],
      },
    ],
  },
  revenue: {
    id: "family_revenue",
    title: "Revenue — Deep Dive",
    subtitle: "This family is measured in hard numbers. Speak in numbers wherever you can.",
    icon: "📈",
    questions: [
      {
        id: "fq1",
        text: "Which best describes your comfort level with reading and reporting on numbers (pipeline, reply rate, ROAS, churn, etc.)?",
        type: "single",
        options: [
          { label: "I'm not familiar with these metrics yet", score: 0 },
          { label: "I understand the basic concepts but haven't reported on them myself", score: 1 },
          { label: "I've tracked and reported basic numbers for a team or client", score: 2 },
          { label: "I regularly report on these numbers and adjust my approach based on them", score: 3 },
          { label: "I set targets, track performance against them, and independently course-correct campaigns or outreach", score: 4 },
        ],
      },
      {
        id: "fq4",
        text: "What is your strongest measurable result in this family? Give real numbers if you can.",
        type: "text",
        placeholder: "e.g. 'Booked 40 qualified calls/month via cold outreach at a 12% reply rate' or 'Reduced churn by 15% over 2 quarters.'",
      },
      {
        id: "fq3",
        text: "What proof of work can you offer for this family?",
        type: "single",
        options: [
          { label: "None yet", score: 0 },
          { label: "A description of my process, but no verified numbers", score: 1 },
          { label: "A reference who can confirm results I drove", score: 2 },
          { label: "A documented report or dashboard showing real numbers I generated", score: 3 },
          { label: "Multiple references plus a documented track record of numbers over time", score: 4 },
        ],
      },
    ],
  },
  creative: {
    id: "family_creative",
    title: "Creative — Deep Dive",
    subtitle: "A real portfolio matters more here than anywhere else. Actual samples beat a list of skills.",
    icon: "🎨",
    questions: [
      {
        id: "fq1",
        text: "Which tools do you use professionally in your craft?",
        type: "single",
        options: [
          { label: "I'm still learning the core tools of my craft", score: 0 },
          { label: "I'm comfortable with the basics (e.g. Canva, CapCut) for simple work", score: 1 },
          { label: "I use professional tools (Premiere, Figma, etc.) confidently for client-ready work", score: 2 },
          { label: "I'm advanced in my primary tools and can also use AI tools to speed up drafts while keeping a human eye on the final result", score: 3 },
          { label: "I'm advanced across multiple tools and platforms, and clients specifically seek out my style", score: 4 },
        ],
      },
      {
        id: "fq5",
        text: "Please share a link to your strongest portfolio piece (video, design, content calendar, or writing sample).",
        type: "text",
        placeholder: "Paste a link here (Google Drive, Behance, YouTube, personal site, etc.)",
      },
      {
        id: "fq3",
        text: "What proof of work can you offer for this family?",
        type: "single",
        options: [
          { label: "None yet — I don't have a portfolio", score: 0 },
          { label: "A few personal or practice pieces, not client work", score: 1 },
          { label: "A small portfolio of real client work, but no performance data", score: 2 },
          { label: "A strong portfolio with before/after examples and at least one testimonial", score: 3 },
          { label: "A strong portfolio with quantified results (views, engagement, conversions) and multiple testimonials", score: 4 },
        ],
      },
    ],
  },
  build: {
    id: "family_build",
    title: "Build — Deep Dive",
    subtitle: "This family pays the most and has the least room for 'trust me, it works.' Live links and repos matter here.",
    icon: "🛠️",
    questions: [
      {
        id: "fq1",
        text: "How would you describe your technical skill level for the type of build work you do?",
        type: "single",
        options: [
          { label: "I'm still learning the fundamentals", score: 0 },
          { label: "I can build simple projects (a landing page, a basic automation) with guidance", score: 1 },
          { label: "I can independently build and ship small-to-medium projects", score: 2 },
          { label: "I handle complex builds independently and test my own work thoroughly before calling it done", score: 3 },
          { label: "I handle high-complexity builds, use AI coding tools to move faster without shipping code I don't understand, and can speak clearly to non-technical clients about timelines", score: 4 },
        ],
      },
      {
        id: "fq6",
        text: "Please share a live link, GitHub repo, or documented build a client could actually check.",
        type: "text",
        placeholder: "Paste a link here",
      },
      {
        id: "fq3",
        text: "What proof of work can you offer for this family?",
        type: "single",
        options: [
          { label: "None yet", score: 0 },
          { label: "Personal or practice projects only, not client work", score: 1 },
          { label: "One or two real client builds, but no live links or repos to show", score: 2 },
          { label: "Live links or repos for real client builds, plus a reference", score: 3 },
          { label: "Multiple live links/repos, documented testing process, and strong client references", score: 4 },
        ],
      },
    ],
  },
};

const TIER_THRESHOLDS = [
  { tier: "U", label: "Outstanding", stars: "⭐⭐⭐⭐⭐", min: 78, color: "#7C2D12", bg: "#FFF3E0", accent: "#C9973A", desc: "You bring elite-level experience, measurable results, and leadership qualities. We will evaluate you for our highest-value client accounts." },
  { tier: "A", label: "Excellent",   stars: "⭐⭐⭐⭐",   min: 60, color: "#1D4ED8", bg: "#EFF6FF", accent: "#60A5FA", desc: "You have strong professional experience, clear client results, and advanced AI skills. You are suited for high-value independent work." },
  { tier: "B", label: "Good",        stars: "⭐⭐⭐",     min: 42, color: "#166534", bg: "#F0FDF4", accent: "#22C55E", desc: "You have solid foundations and real client experience. You work independently and are ready for consistent client delivery." },
  { tier: "C", label: "Developing",  stars: "⭐⭐",       min: 22, color: "#92400E", bg: "#FFFBEB", accent: "#D97706", desc: "You have foundational knowledge and some practical experience. With structured support and mentorship, you will grow quickly." },
  { tier: "E", label: "Entry Level", stars: "⭐",         min: 0,  color: "#2E4057", bg: "#F0F4F8", accent: "#8A9BB0", desc: "You are at the start of your professional journey. We will support your growth through training, mentorship, and internal projects." },
];

function getTier(score, maxScore) {
  const pct = (score / maxScore) * 100;
  const scaledThresholds = TIER_THRESHOLDS.map(t => ({ ...t, minPct: (t.min / 78) * 100 }));
  for (const t of scaledThresholds) {
    if (pct >= t.minPct) return t;
  }
  return scaledThresholds[scaledThresholds.length - 1];
}

// Readiness signal (from q12) — surfaced separately from tier
function getReadinessLabel(answers) {
  const val = answers["q12"];
  if (val === undefined) return null;
  const labels = [
    { text: "Needs preparation before pitching", color: "#991B1B", bg: "#FEF2F2" },
    { text: "Ready in 2–3 weeks", color: "#92400E", bg: "#FFFBEB" },
    { text: "Ready in 1–2 weeks", color: "#92400E", bg: "#FFFBEB" },
    { text: "Ready within 5 working days", color: "#166534", bg: "#F0FDF4" },
    { text: "Ready within 5 working days", color: "#166534", bg: "#F0FDF4" },
  ];
  return labels[val];
}

// ══════════════════════════════════════════════════════════════════
// "OTHER" — reusable helper component
// ══════════════════════════════════════════════════════════════════
function OtherCapableSelect({ options, value, otherValue, onSelect, onOtherChange, colorAccent = "#C9973A" }) {
  const isOtherSelected = value === "__other__";
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt, i) => {
          const selected = value === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              style={{
                textAlign: "left", padding: "12px 16px", borderRadius: 10,
                border: selected ? `2px solid ${colorAccent}` : "1.5px solid #E5E7EB",
                background: selected ? "#FFF8ED" : "#FAFAFA",
                cursor: "pointer", fontSize: 13.5,
                color: selected ? "#0D1B2A" : "#374151", fontFamily: "Arial",
                lineHeight: 1.5, fontWeight: selected ? 600 : 400,
                transition: "all 0.18s ease",
                boxShadow: selected ? `0 0 0 3px ${colorAccent}26` : "none",
              }}
            >
              <span style={{ marginRight: 10, opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>
              {opt.label}
            </button>
          );
        })}
        {/* Other option */}
        <button
          onClick={() => onSelect("__other__")}
          style={{
            textAlign: "left", padding: "12px 16px", borderRadius: 10,
            border: isOtherSelected ? `2px solid ${colorAccent}` : "1.5px dashed #D1D5DB",
            background: isOtherSelected ? "#FFF8ED" : "#FFFFFF",
            cursor: "pointer", fontSize: 13.5,
            color: isOtherSelected ? "#0D1B2A" : "#6B7280", fontFamily: "Arial",
            lineHeight: 1.5, fontWeight: isOtherSelected ? 600 : 400,
            transition: "all 0.18s ease",
            boxShadow: isOtherSelected ? `0 0 0 3px ${colorAccent}26` : "none",
          }}
        >
          <span style={{ marginRight: 10, opacity: 0.5 }}>✎</span>
          Other — none of these quite fit
        </button>
      </div>
      {isOtherSelected && (
        <input
          value={otherValue || ""}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="Please specify..."
          autoFocus
          style={{
            width: "100%", marginTop: 10, padding: "11px 14px", borderRadius: 10,
            border: `1.5px solid ${colorAccent}`, fontSize: 13.5, fontFamily: "Arial",
            color: "#0D1B2A", outline: "none", boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════════
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontFamily: "Arial" }}>Step {current} of {total}</span>
        <span style={{ fontSize: 13, color: "#6B7280", fontFamily: "Arial" }}>{pct}% complete</span>
      </div>
      <div style={{ background: "#E5E7EB", borderRadius: 99, height: 6 }}>
        <div style={{ background: "linear-gradient(90deg,#0D1B2A,#C9973A)", width: `${pct}%`, height: 6, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function TextQuestion({ question, value, onChange, qIndex }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#0D1B2A", fontFamily: "Arial", marginBottom: 14, lineHeight: 1.5 }}>
        <span style={{ color: "#C9973A", marginRight: 8 }}>Q{qIndex}.</span>{question.text}
      </p>
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={question.placeholder || "Type your answer..."}
        rows={3}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB",
          fontSize: 13.5, fontFamily: "Arial", color: "#0D1B2A", outline: "none",
          boxSizing: "border-box", resize: "vertical", lineHeight: 1.5,
        }}
      />
    </div>
  );
}

function SingleChoiceQuestion({ question, value, otherValue, onChange, onOtherChange, qIndex }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#0D1B2A", fontFamily: "Arial", marginBottom: 14, lineHeight: 1.5 }}>
        <span style={{ color: "#C9973A", marginRight: 8 }}>Q{qIndex}.</span>{question.text}
      </p>
      <OtherCapableSelect
        options={question.options}
        value={value}
        otherValue={otherValue}
        onSelect={onChange}
        onOtherChange={onOtherChange}
      />
    </div>
  );
}

function SectionBlock({ section, answers, otherAnswers, onAnswer, onOtherAnswer, startIndex }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 28 }}>{section.icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial", margin: 0 }}>
          {section.title}
        </h2>
      </div>
      <p style={{ fontSize: 13.5, color: "#6B7280", fontFamily: "Arial", marginBottom: 24, lineHeight: 1.5 }}>
        {section.subtitle}
      </p>
      {section.questions.map((q, qi) =>
        q.type === "text" ? (
          <TextQuestion
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={val => onAnswer(q.id, val)}
            qIndex={startIndex + qi + 1}
          />
        ) : (
          <SingleChoiceQuestion
            key={q.id}
            question={q}
            value={answers[q.id]}
            otherValue={otherAnswers[q.id]}
            onChange={val => onAnswer(q.id, val)}
            onOtherChange={val => onOtherAnswer(q.id, val)}
            qIndex={startIndex + qi + 1}
          />
        )
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STEP: FAMILY & ROLE SELECTION (with Other provision)
// ══════════════════════════════════════════════════════════════════
function FamilySelectStep({ familyId, setFamilyId, roleId, setRoleId, otherRole, setOtherRole, otherFamily, setOtherFamily, onNext }) {
  const family = FAMILIES.find(f => f.id === familyId);
  const isOtherFamily = familyId === "__other__";
  const isOtherRole = roleId === "__other__";

  const canProceed =
    (familyId && !isOtherFamily && roleId && (!isOtherRole || otherRole.trim())) ||
    (isOtherFamily && otherFamily.trim());

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial", marginBottom: 6 }}>
        Which family best fits your strongest work?
      </h2>
      <p style={{ fontSize: 13.5, color: "#6B7280", fontFamily: "Arial", lineHeight: 1.6, marginBottom: 20 }}>
        Choose the one you'd want us to pitch you for first. You can grow into others later — but be excellent in one first.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {FAMILIES.map(f => {
          const selected = familyId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => { setFamilyId(f.id); setRoleId(""); }}
              style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 12,
                border: selected ? `2px solid ${f.color}` : "1.5px solid #E5E7EB",
                background: selected ? `${f.color}10` : "#FAFAFA",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.18s ease",
              }}
            >
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: selected ? f.color : "#0D1B2A", fontFamily: "Arial" }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "Arial", marginTop: 2 }}>
                  {f.tagline}
                </div>
              </div>
            </button>
          );
        })}
        {/* Other family */}
        <button
          onClick={() => { setFamilyId("__other__"); setRoleId(""); }}
          style={{
            textAlign: "left", padding: "14px 16px", borderRadius: 12,
            border: isOtherFamily ? "2px solid #C9973A" : "1.5px dashed #D1D5DB",
            background: isOtherFamily ? "#FFF8ED" : "#FFFFFF",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
            transition: "all 0.18s ease",
          }}
        >
          <span style={{ fontSize: 24 }}>✎</span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: isOtherFamily ? "#C9973A" : "#0D1B2A", fontFamily: "Arial" }}>
              None of these fit
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "Arial", marginTop: 2 }}>
              Tell us what you do in your own words
            </div>
          </div>
        </button>
      </div>

      {isOtherFamily && (
        <div style={{ marginBottom: 20 }}>
          <input
            value={otherFamily}
            onChange={e => setOtherFamily(e.target.value)}
            placeholder="Describe the kind of work you do..."
            autoFocus
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #C9973A", fontSize: 13.5, fontFamily: "Arial", color: "#0D1B2A", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}

      {family && !isOtherFamily && (
        <div style={{ background: "white", borderRadius: 14, padding: "18px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial", marginBottom: 12 }}>
            Which specific role fits you best in {family.name}?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {family.roles.map(r => {
              const selected = roleId === r;
              return (
                <button
                  key={r}
                  onClick={() => setRoleId(r)}
                  style={{
                    textAlign: "left", padding: "10px 14px", borderRadius: 9,
                    border: selected ? `2px solid ${family.color}` : "1.5px solid #E5E7EB",
                    background: selected ? `${family.color}10` : "#FAFAFA",
                    cursor: "pointer", fontSize: 13, fontFamily: "Arial",
                    color: selected ? family.color : "#374151", fontWeight: selected ? 600 : 400,
                    transition: "all 0.15s ease",
                  }}
                >
                  {r}
                </button>
              );
            })}
            <button
              onClick={() => setRoleId("__other__")}
              style={{
                textAlign: "left", padding: "10px 14px", borderRadius: 9,
                border: isOtherRole ? `2px solid ${family.color}` : "1.5px dashed #D1D5DB",
                background: isOtherRole ? `${family.color}10` : "#FFFFFF",
                cursor: "pointer", fontSize: 13, fontFamily: "Arial",
                color: isOtherRole ? family.color : "#6B7280", fontWeight: isOtherRole ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              ✎ Other role within {family.name}
            </button>
          </div>
          {isOtherRole && (
            <input
              value={otherRole}
              onChange={e => setOtherRole(e.target.value)}
              placeholder="Specify your role..."
              autoFocus
              style={{ width: "100%", marginTop: 10, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${family.color}`, fontSize: 13.5, fontFamily: "Arial", color: "#0D1B2A", outline: "none", boxSizing: "border-box" }}
            />
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
          background: canProceed ? "linear-gradient(135deg,#0D1B2A,#2E4057)" : "#E5E7EB",
          color: canProceed ? "#FFFFFF" : "#9CA3AF",
          fontSize: 15, fontFamily: "Arial", cursor: canProceed ? "pointer" : "not-allowed",
          fontWeight: 700,
        }}
      >
        Continue →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// INTRO STEP
// ══════════════════════════════════════════════════════════════════
function IntroView({ onStart, name, setName }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial", marginBottom: 6 }}>
        Before we begin
      </h2>
      <p style={{ fontSize: 13.5, color: "#6B7280", fontFamily: "Arial", lineHeight: 1.6, marginBottom: 24 }}>
        Please confirm your name so we can attach this assessment to your interview record. This form goes deeper than the screening questionnaire you already completed — we won't repeat what you told us there.
      </p>
      <div style={{ background: "white", borderRadius: 14, padding: "22px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "Arial", display: "block", marginBottom: 8 }}>
          Your Full Name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your full name"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "Arial", color: "#0D1B2A", outline: "none", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ background: "#F0F4F8", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
        <p style={{ fontSize: 12.5, color: "#4A5568", fontFamily: "Arial", lineHeight: 1.6, margin: 0 }}>
          💡 <strong>Tip:</strong> If a listed option doesn't quite describe you, choose "Other" — every question gives you room to explain in your own words.
        </p>
      </div>
      <button
        onClick={onStart}
        disabled={!name.trim()}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
          background: name.trim() ? "linear-gradient(135deg,#0D1B2A,#2E4057)" : "#E5E7EB",
          color: name.trim() ? "#FFFFFF" : "#9CA3AF",
          fontSize: 15, fontFamily: "Arial", cursor: name.trim() ? "pointer" : "not-allowed",
          fontWeight: 700, letterSpacing: 0.3,
        }}
      >
        Start Assessment →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RESULT VIEW
// ══════════════════════════════════════════════════════════════════
function ResultView({ score, maxScore, answers, familyId, roleId, otherFamily, otherRole, name }) {
  const tier = getTier(score, maxScore);
  const pct = Math.round((score / maxScore) * 100);
  const readiness = getReadinessLabel(answers);
  const family = FAMILIES.find(f => f.id === familyId);
  const displayFamily = familyId === "__other__" ? otherFamily : family?.name;
  const displayRole = roleId === "__other__" ? otherRole : roleId;

  const allSections = familyId && familyId !== "__other__"
    ? [...SHARED_SECTIONS, FAMILY_SECTIONS[familyId]]
    : SHARED_SECTIONS;

  const breakdown = allSections.map(s => {
    let earned = 0, max = 0;
    s.questions.forEach(q => {
      if (q.type === "text") return;
      max += 4;
      const ai = answers[q.id];
      if (ai !== undefined && ai !== "__other__") earned += q.options[ai].score;
      else if (ai === "__other__") earned += 2; // neutral credit for "other" — needs human review
    });
    return { title: s.title, icon: s.icon, earned, max, pct: max > 0 ? Math.round((earned / max) * 100) : 0 };
  }).filter(b => b.max > 0);

  const sorted = [...breakdown].sort((a, b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <div>
      <div style={{ background: tier.bg, border: `2px solid ${tier.accent}`, borderRadius: 16, padding: "28px 24px", marginBottom: 20, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: tier.accent, letterSpacing: 2, fontFamily: "Arial", marginBottom: 8 }}>
          YOUR TIER PLACEMENT
        </p>
        <div style={{ fontSize: 34, fontWeight: 900, color: tier.color, fontFamily: "Arial", marginBottom: 4 }}>
          Tier {tier.tier} — {tier.label}
        </div>
        <div style={{ fontSize: 22, marginBottom: 12 }}>{tier.stars}</div>
        <p style={{ fontSize: 14, color: "#374151", fontFamily: "Arial", lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
          {tier.desc}
        </p>
      </div>

      {/* Family + Role + Readiness */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 45%", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: "#6B7280", letterSpacing: 1, fontFamily: "Arial", marginBottom: 4 }}>FAMILY</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial" }}>{family?.icon || "✎"} {displayFamily}</p>
        </div>
        <div style={{ flex: "1 1 45%", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: "#6B7280", letterSpacing: 1, fontFamily: "Arial", marginBottom: 4 }}>ROLE</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial" }}>{displayRole}</p>
        </div>
        {readiness && (
          <div style={{ flex: "1 1 100%", background: readiness.bg, border: `1.5px solid ${readiness.color}`, borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: readiness.color, letterSpacing: 1, fontFamily: "Arial", marginBottom: 4 }}>PITCH-READINESS</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: readiness.color, fontFamily: "Arial" }}>{readiness.text}</p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 12, padding: "16px", textAlign: "center", border: "1.5px solid #E5E7EB" }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#0D1B2A", fontFamily: "Arial" }}>{score}</div>
          <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "Arial" }}>Score out of {maxScore}</div>
        </div>
        <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 12, padding: "16px", textAlign: "center", border: "1.5px solid #E5E7EB" }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#C9973A", fontFamily: "Arial" }}>{pct}%</div>
          <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "Arial" }}>Overall percentile</div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial", marginBottom: 16, letterSpacing: 0.5 }}>
          SECTION BREAKDOWN
        </p>
        {breakdown.map(b => (
          <div key={b.title} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: "#374151", fontFamily: "Arial" }}>{b.icon} {b.title}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A", fontFamily: "Arial" }}>{b.earned}/{b.max}</span>
            </div>
            <div style={{ background: "#F3F4F6", borderRadius: 99, height: 8 }}>
              <div style={{ background: b.pct >= 75 ? "#22C55E" : b.pct >= 50 ? "#C9973A" : "#EF4444", width: `${b.pct}%`, height: 8, borderRadius: 99, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "#F0FDF4", border: "1.5px solid #22C55E", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#166534", fontFamily: "Arial", marginBottom: 6, letterSpacing: 1 }}>STRONGEST AREA</p>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0D1B2A", fontFamily: "Arial" }}>{strongest.icon} {strongest.title}</p>
        </div>
        <div style={{ flex: 1, background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", fontFamily: "Arial", marginBottom: 6, letterSpacing: 1 }}>GROWTH AREA</p>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0D1B2A", fontFamily: "Arial" }}>{weakest.icon} {weakest.title}</p>
        </div>
      </div>

      <div style={{ background: "#FFF8ED", border: "1.5px solid #C9973A", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#0D1B2A", fontFamily: "Arial", lineHeight: 1.6 }}>
          <strong>Note for the reviewer:</strong> Any question answered "Other" received neutral scoring credit and needs manual review before final placement is confirmed.
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Arial", textAlign: "center" }}>
        VA+AI Agency · Career Tier Placement Form · Confidential
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════════
function Header() {
  return (
    <div style={{ background: "#0D1B2A", borderRadius: "16px 16px 0 0", padding: "28px 24px 24px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#C9973A", letterSpacing: 3, fontFamily: "Arial", marginBottom: 8 }}>
        VA+AI AGENCY
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", fontFamily: "Arial", margin: "0 0 8px" }}>
        Career Tier Placement Assessment
      </h1>
      <p style={{ fontSize: 13, color: "#8A9BB0", fontFamily: "Arial", lineHeight: 1.6, margin: 0 }}>
        This form goes deeper than your screening questionnaire — it places you in the right family, role, and career tier based on real depth, not just yes/no answers.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [step, setStep] = useState("intro"); // intro | family | section-N | submitting | result
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [otherAnswers, setOtherAnswers] = useState({});
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState(false);

  const [familyId, setFamilyId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [otherFamily, setOtherFamily] = useState("");
  const [otherRole, setOtherRole] = useState("");

  const allSections = familyId && familyId !== "__other__"
    ? [...SHARED_SECTIONS, FAMILY_SECTIONS[familyId]]
    : SHARED_SECTIONS;

  const totalSteps = 2 + allSections.length; // intro + family + sections (result not counted)

  const handleAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));
  const handleOtherAnswer = (qId, val) => setOtherAnswers(prev => ({ ...prev, [qId]: val }));

  const currentSection = allSections[sectionIndex];
  const sectionAnswered = currentSection?.questions.every(q => {
    if (q.type === "text") return true; // text optional-ish, don't block
    const v = answers[q.id];
    if (v === undefined) return false;
    if (v === "__other__") return !!(otherAnswers[q.id] && otherAnswers[q.id].trim());
    return true;
  });

  let qCounter = 0;
  for (let i = 0; i < sectionIndex; i++) qCounter += allSections[i].questions.length;

  const handleNext = async () => {
    if (sectionIndex < allSections.length - 1) {
      setSectionIndex(i => i + 1);
      window.scrollTo(0, 0);
      return;
    }

    // Final section — submit to Google Sheet, then show results
    setStep("submitting");
    window.scrollTo(0, 0);

    const displayFamily = familyId === "__other__" ? otherFamily : FAMILIES.find(f => f.id === familyId)?.name;
    const displayRole = roleId === "__other__" ? otherRole : roleId;
    const tier = getTier(totalScore, maxScore);
    const readiness = getReadinessLabel(answers);

    // Flatten answers into readable label pairs for the sheet
    const flatAnswers = {};
    allSections.forEach(s => {
      s.questions.forEach(q => {
        const v = answers[q.id];
        if (q.type === "text") {
          flatAnswers[q.text] = v || "";
        } else if (v === "__other__") {
          flatAnswers[q.text] = `Other: ${otherAnswers[q.id] || ""}`;
        } else if (v !== undefined) {
          flatAnswers[q.text] = q.options[v].label;
        } else {
          flatAnswers[q.text] = "";
        }
      });
    });

    const payload = {
      timestamp: new Date().toISOString(),
      name,
      family: displayFamily,
      role: displayRole,
      tier: `${tier.tier} — ${tier.label}`,
      score: totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      readiness: readiness ? readiness.text : "",
      answers: flatAnswers,
    };

    const result = await submitToGoogleSheet(payload);
    setSubmitError(!result.ok);
    setStep("result");
  };
  const handleBack = () => {
    if (sectionIndex > 0) setSectionIndex(i => i - 1);
    window.scrollTo(0, 0);
  };

  const maxScore = allSections.reduce((acc, s) =>
    acc + s.questions.filter(q => q.type !== "text").length * 4, 0
  );
  const totalScore = allSections.reduce((acc, s) =>
    acc + s.questions.reduce((a, q) => {
      if (q.type === "text") return a;
      const v = answers[q.id];
      if (v === undefined) return a;
      if (v === "__other__") return a + 2; // neutral credit
      return a + q.options[v].score;
    }, 0), 0
  );

  const stepNum = step === "intro" ? 1 : step === "family" ? 2 : step === "result" ? totalSteps : 2 + sectionIndex + 1;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 16px 48px" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <Header />
        <div style={{ background: "#F9FAFB", borderRadius: "0 0 16px 16px", padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>
          {step !== "result" && step !== "submitting" && <ProgressBar current={stepNum} total={totalSteps} />}

          {step === "intro" && (
            <IntroView onStart={() => setStep("family")} name={name} setName={setName} />
          )}

          {step === "family" && (
            <FamilySelectStep
              familyId={familyId} setFamilyId={setFamilyId}
              roleId={roleId} setRoleId={setRoleId}
              otherRole={otherRole} setOtherRole={setOtherRole}
              otherFamily={otherFamily} setOtherFamily={setOtherFamily}
              onNext={() => setStep("sections")}
            />
          )}

          {step === "sections" && currentSection && (
            <div>
              <SectionBlock
                section={currentSection}
                answers={answers}
                otherAnswers={otherAnswers}
                onAnswer={handleAnswer}
                onOtherAnswer={handleOtherAnswer}
                startIndex={qCounter}
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={sectionIndex === 0 ? () => setStep("family") : handleBack}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "white", fontSize: 14, color: "#374151", fontFamily: "Arial", cursor: "pointer", fontWeight: 600 }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!sectionAnswered}
                  style={{
                    flex: 2, padding: "13px 0", borderRadius: 10, border: "none",
                    background: sectionAnswered ? "linear-gradient(135deg,#0D1B2A,#2E4057)" : "#E5E7EB",
                    color: sectionAnswered ? "#FFFFFF" : "#9CA3AF",
                    fontSize: 14, fontFamily: "Arial", cursor: sectionAnswered ? "pointer" : "not-allowed",
                    fontWeight: 700,
                  }}
                >
                  {sectionIndex === allSections.length - 1 ? "Submit & See My Placement →" : "Continue →"}
                </button>
              </div>
              {!sectionAnswered && (
                <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Arial", textAlign: "center", marginTop: 10 }}>
                  Please answer all questions (and specify "Other" if selected) to continue.
                </p>
              )}
            </div>
          )}

          {step === "submitting" && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{
                width: 40, height: 40, margin: "0 auto 20px",
                border: "3px solid #E5E7EB", borderTopColor: "#C9973A",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 14, color: "#374151", fontFamily: "Arial", fontWeight: 600 }}>
                Saving your responses...
              </p>
              <p style={{ fontSize: 12.5, color: "#9CA3AF", fontFamily: "Arial", marginTop: 6 }}>
                Calculating your placement now.
              </p>
            </div>
          )}

          {step === "result" && (
            <>
              {submitError && (
                <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <p style={{ fontSize: 12.5, color: "#991B1B", fontFamily: "Arial", lineHeight: 1.5, margin: 0 }}>
                    ⚠️ We couldn't confirm your response was saved. Please take a screenshot of your results and share it with your interviewer just in case.
                  </p>
                </div>
              )}
              <ResultView
                score={totalScore}
                maxScore={maxScore}
                answers={answers}
                familyId={familyId}
                roleId={roleId}
                otherFamily={otherFamily}
                otherRole={otherRole}
                name={name}
              />
            </>
          )}
        </div>
        {step !== "result" && (
          <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", fontFamily: "Arial", marginTop: 16 }}>
            VA+AI Agency · Career Tier Placement Form · Confidential Internal Use
          </p>
        )}
      </div>
    </div>
  );
}
