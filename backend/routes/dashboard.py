from flask import Blueprint, jsonify, request
from services.analysis import (
    compute_kpis,
    compute_revenue_trend,
    compute_branch_comparison,
    get_active_anomalies,
)

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    period = request.args.get("period", "last_30")
    return jsonify({
        "kpis":             compute_kpis(period),
        "revenue_trend":    compute_revenue_trend("last_90"),
        "branch_comparison": compute_branch_comparison(period),
        "anomalies":        get_active_anomalies(),
    })
