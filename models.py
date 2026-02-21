from datetime import datetime
from flask_login import UserMixin
from extensions import db   # ✅ change here

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    age = db.Column(db.Integer)
    user_type = db.Column(db.String(20), default='adult')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    health_goals = db.relationship('HealthGoal', backref='user', lazy=True)
    chat_sessions = db.relationship('ChatSession', backref='user', lazy=True)
    appointments = db.relationship('Appointment', backref='user', lazy=True)

class HealthGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    goal_type = db.Column(db.String(50), nullable=False)  # fitness, nutrition, weight, wellness
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_value = db.Column(db.Float)
    current_value = db.Column(db.Float, default=0)
    unit = db.Column(db.String(20))
    target_date = db.Column(db.Date)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=False)
    persona_type = db.Column(db.String(50), nullable=False)  # senior, pediatric, empathetic, general
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    messages = db.relationship('ChatMessage', backref='session', lazy=True)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_user = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class MedicalFacility(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    facility_type = db.Column(db.String(50), nullable=False)  # hospital, clinic, pharmacy, urgent_care
    address = db.Column(db.String(300), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    services = db.Column(db.Text)  # JSON string of services offered
    emergency_services = db.Column(db.Boolean, default=False)
    accepts_insurance = db.Column(db.Boolean, default=True)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    facility_id = db.Column(db.Integer, db.ForeignKey('medical_facility.id'), nullable=True)
    appointment_type = db.Column(db.String(50), nullable=False)  # telemedicine, in_person
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DiseasePrediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    symptoms = db.Column(db.Text, nullable=False)  # JSON string of symptoms
    prediction_result = db.Column(db.Text)  # AI-generated prediction
    confidence_score = db.Column(db.Float)
    recommendations = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
