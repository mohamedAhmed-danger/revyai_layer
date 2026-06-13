from flask import Blueprint, jsonify
from services.analysis import build_insight_context
from services.gemini import generate_executive_summary

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/insights", methods=["POST"])
def get_insights():
    context = build_insight_context()
    summary = generate_executive_summary(context)
    return jsonify({
        "context": context,
        "ai_analysis": summary,
    })
