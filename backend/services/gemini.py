"""
Gemini service — all AI calls go through here.
Gemini only explains findings from the analysis engine; it never invents causes.
"""
import os
import json
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_CONTEXT = """
You are RevyAI, an executive intelligence layer built for diagnostic healthcare networks.
Your role is to explain data findings clearly and concisely for C-level executives.

CRITICAL RULES:
- You ONLY explain findings provided to you in the context data.
- You NEVER invent root causes, metrics, or recommendations not supported by the data.
- You speak in confident, executive-level language — no hedging, no jargon.
- Keep responses focused and actionable.
- Always reference specific branch names, percentages, and dates from the data.
"""


def generate_executive_summary(context: dict) -> dict:
    kpis      = context["kpis"]
    branches  = context["branches"]
    anomalies = context["anomalies"]
    worst     = context["worst_branch"]
    best      = context["best_branch"]
    high_anom = context["high_anomalies"]

    prompt = f"""
{SYSTEM_CONTEXT}

Based on the following VERIFIED data findings, generate an executive intelligence report.

=== KPI SNAPSHOT (last 30 days) ===
- Total Revenue:        EGP {kpis['total_revenue']:,.0f}
- Revenue Change:       {kpis['revenue_change_pct']:+.1f}% vs prior period
- Claim Rejection Rate: {kpis['claim_rejection_rate']}%
- Avg Daily Bookings:   {kpis['avg_daily_bookings']}
- Lead Conversion Rate: {kpis['lead_conversion_rate']}%

=== BRANCH PERFORMANCE ===
{json.dumps(branches, indent=2)}

=== DETECTED ANOMALIES ===
{json.dumps(anomalies, indent=2)}

=== ANALYSIS ENGINE FINDINGS ===
- Best performing branch:  {best['branch_name']} (EGP {best['revenue']:,.0f})
- Worst performing branch: {worst['branch_name']} (EGP {worst['revenue']:,.0f})
- High-severity anomalies: {len(high_anom)} detected

Generate a JSON response with EXACTLY this structure:
{{
  "root_cause": "2-3 sentence explanation of the primary detected issue with specific data points",
  "executive_summary": "3-4 sentence executive narrative: what happened, which branch, why, immediate impact",
  "recommendations": [
    "Specific action 1 with branch name and metric",
    "Specific action 2",
    "Specific action 3"
  ],
  "priority_branch": "name of branch needing most immediate attention",
  "confidence_score": 92
}}

Return ONLY valid JSON. No markdown, no extra text.
"""

    response = model.generate_content(prompt)
    raw      = response.text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


def answer_ceo_question(question: str, context: dict) -> str:
    kpis     = context["kpis"]
    branches = context["branches"]
    anomalies = context["anomalies"]
    trend    = context.get("revenue_trend", [])

    # Summarize trend for prompt (last 10 data points)
    trend_summary = trend[-10:] if trend else []

    prompt = f"""
{SYSTEM_CONTEXT}

A C-level executive is asking you a question. Answer ONLY using the verified data below.
If the answer cannot be derived from this data, say: "That data is not currently available in the system."

=== VERIFIED DATA ===

KPIs (last 30 days):
- Total Revenue: EGP {kpis['total_revenue']:,.0f} ({kpis['revenue_change_pct']:+.1f}% change)
- Claim Rejection Rate: {kpis['claim_rejection_rate']}%
- Avg Daily Bookings: {kpis['avg_daily_bookings']}
- Lead Conversion Rate: {kpis['lead_conversion_rate']}%

Branch Performance:
{json.dumps(branches, indent=2)}

Active Anomalies:
{json.dumps(anomalies, indent=2)}

Recent Revenue Trend (last 10 days):
{json.dumps(trend_summary, indent=2)}

=== EXECUTIVE'S QUESTION ===
{question}

Answer in 3-5 sentences. Be specific. Reference actual numbers and branch names from the data above.
"""

    response = model.generate_content(prompt)
    return response.text.strip()
