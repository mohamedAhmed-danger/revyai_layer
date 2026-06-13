from flask import Flask
from flask_cors import CORS
from database import db, seed_data
from routes.dashboard import dashboard_bp
from routes.insights import insights_bp
from routes.chat import chat_bp

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///revyai.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
db.init_app(app)

app.register_blueprint(dashboard_bp)
app.register_blueprint(insights_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_data()
    app.run(debug=True, port=5000)
