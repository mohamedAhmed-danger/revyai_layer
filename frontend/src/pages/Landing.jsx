import { useNavigate } from "react-router-dom";

const COMPARISON = [
  { bi: "Revenue dashboards",         revy: "Why revenue dropped — automatically" },
  { bi: "Branch reports",             revy: "Which branch to fix first and how" },
  { bi: "Historical trends",          revy: "What will happen next month" },
  { bi: "KPI tracking",               revy: "What action to take right now" },
  { bi: "Anomaly reports (manual)",   revy: "Anomaly + root cause + recommendation in one shot" },
  { bi: "Data for analysts",          revy: "Answers for executives — in 30 seconds" },
];

const PILLARS = [
  {
    number: "01",
    title: "Root Cause Intelligence",
    desc: "BI shows you the number dropped. RevyAI decomposes why — volume, price, downtime, or efficiency — ranked by contribution. No analyst needed.",
  },
  {
    number: "02",
    title: "Prescriptive Actions",
desc: 'BI stops at reporting utilization. RevyAI decides: "Move 15 appointments to Branch B, extend hours Wednesday." The decision is already made.',  },
  {
    number: "03",
    title: "Revenue Leakage Detection",
    desc: "RevyAI catches unbilled tests, duplicate discounts, and insurance mismatches — invisible in standard BI.",
  },
  {
    number: "04",
    title: "Executive Narrative",
    desc: "RevyAI auto-generates the executive brief: what changed, why, who's responsible, and what's recommended — ready before the morning meeting.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mint">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-forest/10">
        <span className="font-display text-xl font-bold text-forest">RevyAI</span>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-forest text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-forest/80 transition-colors">
          View Live Demo →
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-4">
          Presented by RevyAI
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-forest leading-tight mb-6">
          Beyond Dashboards:<br />
          Activating Data into<br />
          Autonomous Action
        </h1>
        <p className="text-forest/60 text-lg max-w-2xl mx-auto mb-10">
          Why traditional BI is no longer enough to protect revenue and optimize
          patient acquisition in a multi-branch diagnostic network.
        </p>
        <div className="inline-block bg-forest/5 border border-forest/15 rounded-2xl px-6 py-4 text-forest/70 italic text-sm max-w-xl">
          "You have the data. You have the dashboards. We provide the execution layer
          that turns that data into instant decisions and automated operational revenue."
        </div>
      </section>

      {/* The Gap */}
      <section className="max-w-5xl mx-auto px-8 pb-16">
        <h2 className="font-display text-3xl font-bold text-forest mb-2">The Gap No BI Tool Can Fill</h2>
        <p className="text-forest/60 mb-8 max-w-xl">
          Your BI teams tell you exactly what happened. But when a metric drops,
          there is a costly time lag between seeing the problem and executing the fix.
        </p>

        <div className="rounded-2xl overflow-hidden border border-forest/10 shadow-sm">
          <div className="grid grid-cols-2 bg-forest text-white text-sm font-semibold">
            <div className="px-6 py-3">What You Have (Traditional BI)</div>
            <div className="px-6 py-3 text-gold">What You Don't Have (RevyAI Layer)</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-2 text-sm border-t border-forest/8 ${i % 2 === 0 ? "bg-white" : "bg-mint/50"}`}>
              <div className="px-6 py-3 text-forest/70">{row.bi}</div>
              <div className="px-6 py-3 text-gold font-medium">{row.revy}</div>
            </div>
          ))}
        </div>

        <p className="text-center mt-6 font-semibold text-forest text-sm">
          The Core Shift: BI tells you <em>what happened</em>. RevyAI tells you <em>why</em>, <em>what's next</em>, and <em>what to do</em>.
        </p>
      </section>

      {/* 4 Pillars */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <h2 className="font-display text-3xl font-bold text-forest mb-8">What RevyAI Adds That BI Cannot</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {PILLARS.map((p) => (
            <div key={p.number} className="bg-white rounded-2xl p-6 border border-forest/10 shadow-sm">
              <span className="text-gold font-bold text-3xl font-display">{p.number}</span>
              <h3 className="font-semibold text-forest mt-2 mb-2">{p.title}</h3>
              <p className="text-forest/60 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest text-white py-16 px-8 text-center">
        <h2 className="font-display text-3xl font-bold mb-4">
          "When your CEO asks why revenue dropped in Alexandria last Tuesday —<br />
          how long does it take your team to give a real answer?"
        </h2>
        <p className="text-white/60 mb-8 max-w-lg mx-auto">
          RevyAI makes that answer instant, automatic, and available to every executive —
          without touching an analyst.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gold text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-gold/80 transition-colors">
          See the Live Demo →
        </button>
      </section>

    </div>
  );
}
