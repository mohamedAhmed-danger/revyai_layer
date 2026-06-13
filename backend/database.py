from flask_sqlalchemy import SQLAlchemy
from datetime import date, timedelta
import random

db = SQLAlchemy()

# ─── Models ───────────────────────────────────────────────────────────────────

class Branch(db.Model):
    __tablename__ = "branches"
    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)

class Revenue(db.Model):
    __tablename__ = "revenue"
    id        = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey("branches.id"), nullable=False)
    date      = db.Column(db.Date, nullable=False)
    amount    = db.Column(db.Float, nullable=False)

class Claim(db.Model):
    __tablename__ = "claims"
    id        = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey("branches.id"), nullable=False)
    date      = db.Column(db.Date, nullable=False)
    status    = db.Column(db.String(20), nullable=False)   # approved / rejected
    amount    = db.Column(db.Float, nullable=False)

class Booking(db.Model):
    __tablename__ = "bookings"
    id        = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey("branches.id"), nullable=False)
    date      = db.Column(db.Date, nullable=False)
    count     = db.Column(db.Integer, nullable=False)

class Lead(db.Model):
    __tablename__ = "leads"
    id           = db.Column(db.Integer, primary_key=True)
    date         = db.Column(db.Date, nullable=False)
    source       = db.Column(db.String(50), nullable=False)   # whatsapp / web / social
    converted    = db.Column(db.Boolean, nullable=False)

class Anomaly(db.Model):
    __tablename__ = "anomalies"
    id          = db.Column(db.Integer, primary_key=True)
    branch_id   = db.Column(db.Integer, db.ForeignKey("branches.id"), nullable=False)
    date        = db.Column(db.Date, nullable=False)
    type        = db.Column(db.String(50), nullable=False)   # revenue_drop / claim_spike / booking_drop
    description = db.Column(db.String(255), nullable=False)
    severity    = db.Column(db.String(10), nullable=False)   # high / medium / low

# ─── Seed ─────────────────────────────────────────────────────────────────────

def seed_data():
    if Branch.query.count() > 0:
        return  # already seeded

    random.seed(42)

    # Branches
    branches_data = [
        ("Branch A – Cairo",       "Cairo"),
        ("Branch B – Giza",        "Giza"),
        ("Branch C – Alexandria",  "Alexandria"),
        ("Branch D – Mansoura",    "Mansoura"),
    ]
    branches = []
    for name, city in branches_data:
        b = Branch(name=name, city=city)
        db.session.add(b)
        branches.append(b)
    db.session.flush()

    start = date(2024, 1, 1)
    sources = ["whatsapp", "web", "social"]

    # Base daily revenue per branch (normal range)
    base_revenue = {1: 28000, 2: 22000, 3: 25000, 4: 18000}

    for day_offset in range(365):
        current_date = start + timedelta(days=day_offset)
        month = current_date.month
        dow   = current_date.weekday()  # 0=Mon … 6=Sun

        for branch in branches:
            bid = branch.id

            # ── Revenue ──
            base   = base_revenue[bid]
            factor = 1.0

            # Seasonal: Ramadan dip (Mar–Apr 2024), summer boost (Jun–Aug)
            if month in (3, 4):
                factor *= 0.88
            elif month in (6, 7, 8):
                factor *= 1.12

            # Weekend dip
            if dow in (4, 5):  # Fri-Sat
                factor *= 0.75

            # INJECTED ANOMALY 1 – Branch C revenue drop (weeks 32-34 ≈ Aug)
            if bid == 3 and 217 <= day_offset <= 238:
                factor *= 0.52   # ~48% drop → TPA rejection spike scenario

            # INJECTED ANOMALY 2 – Branch D underperformance (Oct-Nov)
            if bid == 4 and 273 <= day_offset <= 334:
                factor *= 0.70

            noise  = random.uniform(0.93, 1.07)
            amount = round(base * factor * noise, 2)
            db.session.add(Revenue(branch_id=bid, date=current_date, amount=amount))

            # ── Claims ──
            num_claims = random.randint(8, 20)
            for _ in range(num_claims):
                # Branch C anomaly period → high rejection rate
                if bid == 3 and 217 <= day_offset <= 238:
                    status = "rejected" if random.random() < 0.62 else "approved"
                else:
                    status = "rejected" if random.random() < 0.12 else "approved"
                db.session.add(Claim(
                    branch_id=bid,
                    date=current_date,
                    status=status,
                    amount=round(random.uniform(300, 2500), 2),
                ))

            # ── Bookings ──
            count = random.randint(15, 60)
            if dow in (4, 5):
                count = int(count * 0.6)
            if bid == 4 and 273 <= day_offset <= 334:
                count = int(count * 0.72)
            db.session.add(Booking(branch_id=bid, date=current_date, count=count))

        # ── Leads (network-wide per day) ──
        for _ in range(random.randint(12, 35)):
            converted = random.random() < 0.38
            db.session.add(Lead(
                date=current_date,
                source=random.choice(sources),
                converted=converted,
            ))

    # ── Anomalies table (pre-computed for fast lookup) ──
    anomalies = [
        Anomaly(branch_id=3, date=date(2024, 8, 5),
                type="revenue_drop",
                description="Revenue fell 48% over 3 weeks. Root cause: 62% TPA claim rejection rate on blood panels due to new insurer rule changes.",
                severity="high"),
        Anomaly(branch_id=3, date=date(2024, 8, 5),
                type="claim_spike",
                description="Claim rejection rate spiked to 62% at Branch C (Alexandria). Specialized blood panel tests affected most.",
                severity="high"),
        Anomaly(branch_id=4, date=date(2024, 10, 1),
                type="booking_drop",
                description="Branch D bookings dropped 28% from October. Technician shortage and equipment downtime identified as primary causes.",
                severity="medium"),
        Anomaly(branch_id=4, date=date(2024, 10, 1),
                type="revenue_drop",
                description="Branch D revenue underperformed by 30% for 2 months. Correlated with reduced booking capacity.",
                severity="medium"),
    ]
    for a in anomalies:
        db.session.add(a)

    db.session.commit()
    print("✅ Database seeded successfully.")
