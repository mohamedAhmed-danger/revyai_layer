"""
Analysis Engine — computes all findings from the database.
GPT/Gemini only explains findings generated here; it never invents causes.
"""
from sqlalchemy import func
from database import db, Branch, Revenue, Claim, Booking, Lead, Anomaly
from datetime import date, timedelta


def get_date_range(period: str):
    today = date(2024, 12, 31)  # demo reference date
    if period == "last_30":
        return today - timedelta(days=30), today
    elif period == "last_90":
        return today - timedelta(days=90), today
    else:  # full year
        return date(2024, 1, 1), today


def compute_kpis(period="last_30"):
    start, end = get_date_range(period)
    prev_start = start - (end - start)

    def revenue_sum(s, e):
        return db.session.query(func.sum(Revenue.amount)).filter(
            Revenue.date.between(s, e)
        ).scalar() or 0

    def claim_rejection_rate(s, e):
        total = db.session.query(func.count(Claim.id)).filter(
            Claim.date.between(s, e)
        ).scalar() or 1
        rejected = db.session.query(func.count(Claim.id)).filter(
            Claim.date.between(s, e), Claim.status == "rejected"
        ).scalar() or 0
        return round((rejected / total) * 100, 1)

    def avg_bookings(s, e):
        total = db.session.query(func.sum(Booking.count)).filter(
            Booking.date.between(s, e)
        ).scalar() or 0
        days = (e - s).days or 1
        return round(total / days, 1)

    def lead_conversion(s, e):
        total = db.session.query(func.count(Lead.id)).filter(
            Lead.date.between(s, e)
        ).scalar() or 1
        converted = db.session.query(func.count(Lead.id)).filter(
            Lead.date.between(s, e), Lead.converted == True
        ).scalar() or 0
        return round((converted / total) * 100, 1)

    current_rev  = revenue_sum(start, end)
    previous_rev = revenue_sum(prev_start, start)
    rev_change   = round(((current_rev - previous_rev) / max(previous_rev, 1)) * 100, 1)

    return {
        "total_revenue":        round(current_rev, 2),
        "revenue_change_pct":   rev_change,
        "claim_rejection_rate": claim_rejection_rate(start, end),
        "avg_daily_bookings":   avg_bookings(start, end),
        "lead_conversion_rate": lead_conversion(start, end),
        "period":               period,
        "start":                str(start),
        "end":                  str(end),
    }


def compute_revenue_trend(period="last_90"):
    start, end = get_date_range(period)
    rows = (
        db.session.query(Revenue.date, func.sum(Revenue.amount).label("total"))
        .filter(Revenue.date.between(start, end))
        .group_by(Revenue.date)
        .order_by(Revenue.date)
        .all()
    )
    return [{"date": str(r.date), "revenue": round(r.total, 2)} for r in rows]


def compute_branch_comparison(period="last_30"):
    start, end = get_date_range(period)
    results = []
    branches = Branch.query.all()
    for b in branches:
        rev = db.session.query(func.sum(Revenue.amount)).filter(
            Revenue.branch_id == b.id, Revenue.date.between(start, end)
        ).scalar() or 0

        total_claims = db.session.query(func.count(Claim.id)).filter(
            Claim.branch_id == b.id, Claim.date.between(start, end)
        ).scalar() or 1

        rejected = db.session.query(func.count(Claim.id)).filter(
            Claim.branch_id == b.id, Claim.date.between(start, end),
            Claim.status == "rejected"
        ).scalar() or 0

        bookings = db.session.query(func.sum(Booking.count)).filter(
            Booking.branch_id == b.id, Booking.date.between(start, end)
        ).scalar() or 0

        results.append({
            "branch_id":            b.id,
            "branch_name":          b.name,
            "city":                 b.city,
            "revenue":              round(rev, 2),
            "claim_rejection_rate": round((rejected / total_claims) * 100, 1),
            "total_bookings":       int(bookings),
        })
    return sorted(results, key=lambda x: x["revenue"], reverse=True)


def get_active_anomalies():
    anomalies = Anomaly.query.order_by(Anomaly.date.desc()).all()
    branches  = {b.id: b.name for b in Branch.query.all()}
    return [
        {
            "id":          a.id,
            "branch_id":   a.branch_id,
            "branch_name": branches.get(a.branch_id, "Unknown"),
            "date":        str(a.date),
            "type":        a.type,
            "description": a.description,
            "severity":    a.severity,
        }
        for a in anomalies
    ]


def build_insight_context():
    """
    Builds a structured context dict that gets passed to Gemini.
    Gemini explains these findings — it never invents new ones.
    """
    kpis       = compute_kpis("last_30")
    branches   = compute_branch_comparison("last_30")
    anomalies  = get_active_anomalies()

    worst = min(branches, key=lambda x: x["revenue"])
    best  = max(branches, key=lambda x: x["revenue"])

    high_anomalies = [a for a in anomalies if a["severity"] == "high"]

    return {
        "kpis":            kpis,
        "branches":        branches,
        "anomalies":       anomalies,
        "worst_branch":    worst,
        "best_branch":     best,
        "high_anomalies":  high_anomalies,
    }


def build_chat_context():
    """Full context for CEO chat queries."""
    ctx = build_insight_context()
    ctx["revenue_trend"] = compute_revenue_trend("last_90")
    return ctx
