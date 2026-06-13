import { useState, useEffect, useRef } from "react";
import { fetchDashboard, fetchInsights } from "../api";
import RevenueChart from "../components/RevenueChart";
import BranchChart  from "../components/BranchChart";
import ChatPopup    from "../components/ChatPopup";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString(); }
function pct(n)  { return `${Number(n).toFixed(1)}%`; }

// ─── BI "dead-end" investigation tabs ─────────────────────────────────────────

const BI_TABS = [
  {
    label: "Revenue Table",
    content: (d) => (
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-500 uppercase text-[10px]">
            <th className="px-3 py-2">Branch</th>
            <th className="px-3 py-2">Revenue (EGP)</th>
            <th className="px-3 py-2">vs Avg</th>
          </tr>
        </thead>
        <tbody>
          {(d?.branch_comparison || []).map((b) => (
            <tr key={b.branch_id} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-700">{b.branch_name}</td>
              <td className="px-3 py-2 font-mono">{fmt(b.revenue)}</td>
              <td className={`px-3 py-2 font-mono ${b.revenue < 400000 ? "text-red-500" : "text-gray-400"}`}>
                {b.revenue < 400000 ? "↓ below avg" : "✓"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    deadEnd: "Branch C revenue is low — but why? This table doesn't tell you.",
  },
  {
    label: "Claims Report",
    content: (d) => (
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-500 uppercase text-[10px]">
            <th className="px-3 py-2">Branch</th>
            <th className="px-3 py-2">Rejection Rate</th>
            <th className="px-3 py-2">Bookings</th>
          </tr>
        </thead>
        <tbody>
          {(d?.branch_comparison || []).map((b) => (
            <tr key={b.branch_id} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-700">{b.branch_name}</td>
              <td className={`px-3 py-2 font-mono ${b.claim_rejection_rate > 20 ? "text-red-500 font-bold" : "text-gray-500"}`}>
                {pct(b.claim_rejection_rate)}
              </td>
              <td className="px-3 py-2 font-mono text-gray-500">{fmt(b.total_bookings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    deadEnd: "Branch C has high rejection rate — but is that causing the revenue drop? By how much? Which claim type? No answer here.",
  },
  {
    label: "Bookings Log",
    content: (d) => (
      <div className="space-y-2 text-xs text-gray-600">
        {(d?.branch_comparison || []).map((b) => (
          <div key={b.branch_id} className="flex justify-between border-b border-gray-100 pb-1">
            <span>{b.branch_name}</span>
            <span className="font-mono">{fmt(b.total_bookings)} bookings</span>
          </div>
        ))}
        <p className="text-gray-400 italic pt-2">
          Bookings look normal for some branches. But does low booking = low revenue or is it the claims? Cross-referencing needed…
        </p>
      </div>
    ),
    deadEnd: "Bookings don't explain the revenue gap alone. You'd need to join this with claims data manually.",
  },
  {
    label: "Anomaly Log",
    content: (d) => (
      <div className="space-y-2 text-xs">
        {(d?.anomalies || []).map((a) => (
          <div key={a.id} className="border border-red-100 bg-red-50 rounded px-3 py-2 text-red-700">
            <strong>{a.branch_name}</strong> — {a.type.replace("_", " ")} on {a.date}
          </div>
        ))}
        <p className="text-gray-400 italic pt-1">
          Anomalies flagged — but root cause, % impact, and which action to take? Not here.
        </p>
      </div>
    ),
    deadEnd: "You can see something is wrong. But what exactly caused it and what do you do next?",
  },
];

// ─── scan steps for RevyAI ────────────────────────────────────────────────────

const SCAN_STEPS = [
  { label: "Scanning anomalies across all branches…",   ms: 1000 },
  { label: "Correlating revenue drop with claim data…", ms: 1100 },
  { label: "Ranking root causes by contribution %…",    ms: 1000 },
  { label: "Generating executive insight…",             ms: 900  },
];

// ─── component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [insights,  setInsights]  = useState(null);
  const [biTab,     setBiTab]     = useState(0);
  const [showDeadEnd, setShowDeadEnd] = useState(false);

  const [scanStep,        setScanStep]        = useState(-1);
  const [scanning,        setScanning]        = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showChat,        setShowChat]        = useState(false);
  const [error,           setError]           = useState(null);
  const revyRef = useRef(null);

  useEffect(() => {
    fetchDashboard()
      .then(setDashboard)
      .catch(() => setError("Cannot connect to backend. Make sure Flask is running on port 5000."));
  }, []);

  // when user clicks a BI tab → show dead-end message after 1s
  function handleBiTab(i) {
    setBiTab(i);
    setShowDeadEnd(false);
    setTimeout(() => setShowDeadEnd(true), 900);
  }

  async function runRevyAI() {
    setInsights(null);
    setScanning(true);
    setLoadingInsights(true);
    setScanStep(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStep(i);
      await new Promise((r) => setTimeout(r, SCAN_STEPS[i].ms));
    }

    try {
      const data = await fetchInsights();
      setInsights(data);
    } catch {
      setError("Gemini call failed. Check your GEMINI_API_KEY environment variable.");
    } finally {
      setScanning(false);
      setLoadingInsights(false);
      setScanStep(-1);
      setTimeout(() => revyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }

  const kpis     = dashboard?.kpis;
  const trend    = dashboard?.revenue_trend;
  const branches = dashboard?.branch_comparison || [];
  const anomalies = dashboard?.anomalies || [];

  // pick worst branch for the "alert"
  const worstBranch = branches.length
    ? branches.reduce((a, b) => (a.revenue < b.revenue ? a : b))
    : null;

  const biCurrentTab = BI_TABS[biTab];

  return (
    <div className="min-h-screen bg-[#eef3f0] flex flex-col">

      {/* ── NAV ── */}
      <nav className="bg-[#1a3a2a] text-white px-8 py-4 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold">RevyAI</span>
          <span className="text-white/30 text-sm">|</span>
          <span className="text-white/50 text-sm">Executive Intelligence Demo</span>
        </div>
        <button
          onClick={() => setShowChat(true)}
          className="bg-[#c9922a] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#b07d20] transition-colors">
          💬 Ask RevyAI
        </button>
      </nav>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm flex-shrink-0">
          ⚠️ {error}
        </div>
      )}

      {/* ── HEADER ALERT ── */}
      {worstBranch && (
        <div className="mx-6 mt-5 bg-red-600 text-white rounded-2xl px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-base">Revenue Alert — {worstBranch.branch_name}</p>
              <p className="text-white/70 text-sm">
                Revenue is significantly below network average · {anomalies.length} anomaly signals detected
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-white/60">30-day revenue</p>
            <p className="font-bold text-lg">EGP {fmt(worstBranch.revenue)}</p>
          </div>
        </div>
      )}

      {/* ── TWO PANELS ── */}
      <div className="flex-1 grid lg:grid-cols-2 gap-0 overflow-hidden">

        {/* ══════════════════════════════════════════
            LEFT — Traditional BI
        ══════════════════════════════════════════ */}
        <div className="border-r border-[#1a3a2a]/10 bg-white/60 flex flex-col overflow-y-auto">

          {/* Panel header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Traditional BI Dashboard</p>
            </div>
            <h2 className="text-xl font-bold text-gray-700 font-display">What Happened?</h2>
            <p className="text-gray-400 text-xs mt-0.5">Your current reporting layer — charts, tables, numbers</p>
          </div>

          <div className="p-6 space-y-5 flex-1">

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Revenue",    val: kpis ? `EGP ${fmt(kpis.total_revenue)}` : "—",                icon: "💰" },
                { label: "Claim Rejection",  val: kpis ? pct(kpis.claim_rejection_rate)  : "—",                icon: "📋" },
                { label: "Daily Bookings",   val: kpis ? kpis.avg_daily_bookings           : "—",              icon: "📅" },
                { label: "Lead Conversion",  val: kpis ? pct(kpis.lead_conversion_rate)  : "—",                icon: "🎯" },
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{k.label}</span>
                    <span className="text-base">{k.icon}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-700 font-mono">{k.val}</p>
                </div>
              ))}
            </div>

            {/* Revenue trend */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Revenue Trend — 90 Days</p>
              {trend
                ? <RevenueChart trend={trend} />
                : <div className="h-44 flex items-center justify-center text-gray-300 text-sm">Loading…</div>}
            </div>

            {/* Branch chart */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Branch Revenue Comparison</p>
              {branches.length
                ? <BranchChart branches={branches} />
                : <div className="h-36 flex items-center justify-center text-gray-300 text-sm">Loading…</div>}
            </div>

            {/* ── INVESTIGATE SECTION ── */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  🔍 Investigate — Try to find out why revenue dropped
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {BI_TABS.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => handleBiTab(i)}
                    className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                      ${biTab === i
                        ? "border-gray-700 text-gray-700 bg-white"
                        : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4">
                {biCurrentTab.content(dashboard)}
              </div>

              {/* Dead-end message */}
              {showDeadEnd && (
                <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-amber-700 font-medium">🚧 Dead End</p>
                  <p className="text-xs text-amber-600 mt-0.5">{biCurrentTab.deadEnd}</p>
                  <p className="text-[10px] text-amber-500 mt-2 italic">
                    To answer this properly: export data → open Excel → manually join 3 tables → calculate correlations → write a report. Takes hours.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — RevyAI
        ══════════════════════════════════════════ */}
        <div className="bg-[#f5faf7] flex flex-col overflow-y-auto" ref={revyRef}>

          {/* Panel header */}
          <div className="px-6 pt-6 pb-4 border-b border-[#1a3a2a]/10 flex-shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-3 h-3 rounded-full bg-[#c9922a] animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c9922a]">RevyAI Intelligence Layer</p>
            </div>
            <h2 className="text-xl font-bold text-[#1a3a2a] font-display">Why Did It Happen? What Do We Do?</h2>
            <p className="text-[#1a3a2a]/50 text-xs mt-0.5">Root cause · Contribution % · Recommended action — in seconds</p>
          </div>

          <div className="p-6 space-y-5 flex-1">

            {/* CTA button */}
            {!scanning && !insights && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#1a3a2a]/20 p-8 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-[#1a3a2a] font-semibold mb-1">Revenue dropped — RevyAI knows exactly why</p>
                <p className="text-[#1a3a2a]/50 text-sm mb-6">
                  One click runs a full cross-analysis across revenue, claims, bookings, and branch data.
                  No analyst needed.
                </p>
                <button
                  onClick={runRevyAI}
                  disabled={!dashboard}
                  className="bg-[#c9922a] text-white px-8 py-3 rounded-full font-bold text-sm
                             hover:bg-[#b07d20] transition-all hover:scale-105 shadow-md disabled:opacity-40">
                  ▶ Click to See Why
                </button>
                <p className="text-[#1a3a2a]/30 text-xs mt-3">Powered by Gemini · Grounded in real data</p>
              </div>
            )}

            {/* ── Scan animation ── */}
            {scanning && (
              <div className="bg-white rounded-2xl border border-[#1a3a2a]/10 p-6 shadow-sm space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#1a3a2a]/50 mb-2">
                  RevyAI Analysis Engine Running…
                </p>
                {SCAN_STEPS.map((step, i) => {
                  const done    = i < scanStep;
                  const active  = i === scanStep;
                  const pending = i > scanStep;
                  return (
                    <div key={step.label} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        {done    && <span className="text-emerald-500 text-sm flex-shrink-0">✓</span>}
                        {active  && <span className="w-3 h-3 rounded-full bg-[#c9922a] animate-pulse flex-shrink-0 inline-block" />}
                        {pending && <span className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0 inline-block" />}
                        <span className={`text-sm ${done ? "text-emerald-600 line-through opacity-60" : active ? "text-[#1a3a2a] font-medium" : "text-gray-300"}`}>
                          {step.label}
                        </span>
                      </div>
                      {active && (
                        <div className="ml-6 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c9922a] rounded-full animate-scan" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Results ── */}
            {insights && !scanning && (
              <div className="space-y-4 animate-fade-up">

                {/* Root cause — the key card */}
                <div className="bg-[#1a3a2a] text-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Root Cause Identified
                    </span>
                    <span className="text-white/40 text-xs ml-auto">
                      Confidence: {insights.ai_analysis?.confidence_score}%
                    </span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {insights.ai_analysis?.root_cause}
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                      This finding required cross-referencing:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Revenue table", "Claims by type", "Branch timeline", "TPA rejection patterns", "Contribution % ranking"].map((tag) => (
                        <span key={tag} className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Executive summary */}
                <div className="bg-white rounded-2xl p-5 border border-[#1a3a2a]/10 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-[#1a3a2a]/40 font-semibold mb-2">
                    Executive Summary
                  </p>
                  <p className="text-[#1a3a2a] text-sm leading-relaxed">
                    {insights.ai_analysis?.executive_summary}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-2xl p-5 border border-[#1a3a2a]/10 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-[#1a3a2a]/40 font-semibold mb-3">
                    Recommended Actions
                  </p>
                  <div className="space-y-3">
                    {(insights.ai_analysis?.recommendations || []).map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="w-6 h-6 bg-[#c9922a]/15 text-[#c9922a] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-[#1a3a2a] leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority branch pill */}
                {insights.ai_analysis?.priority_branch && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 text-sm">
                      🎯 <strong>Priority Branch:</strong> {insights.ai_analysis.priority_branch}
                    </div>
                    <button
                      onClick={() => setShowChat(true)}
                      className="text-xs bg-[#1a3a2a] text-white px-3 py-1.5 rounded-full hover:bg-[#1a3a2a]/80 transition-colors">
                      Ask follow-up →
                    </button>
                  </div>
                )}

                {/* Re-run button */}
                <button
                  onClick={runRevyAI}
                  className="w-full text-center text-xs text-[#1a3a2a]/40 hover:text-[#1a3a2a]/70 py-2 transition-colors">
                  ↺ Re-run analysis
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Floating chat ── */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-[#1a3a2a] text-white rounded-full w-14 h-14 text-2xl shadow-xl hover:scale-105 transition-all z-40">
          💬
        </button>
      )}

      {showChat && <ChatPopup onClose={() => setShowChat(false)} />}
    </div>
  );
}
