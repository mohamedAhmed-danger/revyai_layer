from flask import Blueprint, jsonify, request
from services.analysis import build_chat_context
from services.gemini import answer_ceo_question

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["POST"])
def chat():
    data     = request.get_json()
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Question is required."}), 400

    context = build_chat_context()
    answer  = answer_ceo_question(question, context)

    return jsonify({
        "question": question,
        "answer":   answer,
    })
