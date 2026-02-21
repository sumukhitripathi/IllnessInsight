from flask import render_template, request, jsonify, session
from app import app
from extensions import db
from models import User, HealthGoal, ChatSession, ChatMessage, MedicalFacility, Appointment, DiseasePrediction
from gemini import generate_chat_response, analyze_symptoms, generate_health_goals, generate_health_advice
import json
import logging
import uuid
from datetime import datetime, timedelta
import math

@app.route('/')
def index():
    """Homepage with futuristic design and animations"""
    return render_template('index.html')

@app.route('/main')
def main_app():
    """Main application dashboard"""
    return render_template('main_app.html')

@app.route('/chat')
def chat():
    """AI Chat interface with persona selection"""
    persona = request.args.get('persona', 'general')
    return render_template('chat.html', persona=persona)

@app.route('/facility-finder')
def facility_finder():
    """Medical facility finder with interactive map"""
    return render_template('facility_finder.html')

@app.route('/health-coach')
def health_coach():
    """Personalized health coaching dashboard"""
    return render_template('health_coach.html')

@app.route('/disease-prediction')
def disease_prediction():
    """Disease prediction questionnaire"""
    return render_template('disease_prediction.html')

@app.route('/appointments')
def appointments():
    """Telemedicine appointment booking"""
    return render_template('appointments.html')

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Handle AI chat requests"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        persona_type = data.get('persona', 'general')
        
        # Get or create session
        session_id = session.get('chat_session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            session['chat_session_id'] = session_id
            
            # Create new chat session in database
            chat_session = ChatSession()
            chat_session.session_id = session_id
            chat_session.persona_type = persona_type
            db.session.add(chat_session)
            db.session.commit()
        else:
            # Get existing session
            chat_session = ChatSession.query.filter_by(session_id=session_id).first()
            if not chat_session:
                # Create new session if not found
                chat_session = ChatSession()
                chat_session.session_id = session_id
                chat_session.persona_type = persona_type
                db.session.add(chat_session)
                db.session.commit()
        
        # Save user message
        user_msg = ChatMessage()
        user_msg.session_id = chat_session.id
        user_msg.message = message
        user_msg.is_user = True
        db.session.add(user_msg)
        
        # Generate AI response
        user_context = {
            'age': session.get('user_age'),
            'user_type': session.get('user_type', 'adult')
        }
        
        ai_response = generate_chat_response(message, persona_type, user_context)
        
        # Save AI response
        ai_msg = ChatMessage()
        ai_msg.session_id = chat_session.id
        ai_msg.message = ai_response
        ai_msg.is_user = False
        db.session.add(ai_msg)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'response': ai_response,
            'persona': persona_type
        })
        
    except Exception as e:
        logging.error(f"Chat API error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to process chat message'
        }), 500

@app.route('/api/nearby-facilities')
def api_nearby_facilities():
    """Get nearby medical facilities based on location and filters"""
    try:
        lat_str = request.args.get('lat')
        lng_str = request.args.get('lng')
        radius_str = request.args.get('radius', '10')
        
        if not lat_str or not lng_str:
            return jsonify({'success': False, 'error': 'Missing latitude or longitude'}), 400
        
        lat = float(lat_str)
        lng = float(lng_str)
        radius = float(radius_str)  # km
        facility_type = request.args.get('type', 'all')
        
        # Calculate bounding box for database query optimization
        lat_range = radius / 111.0  # Approximate km per degree latitude
        lng_range = radius / (111.0 * math.cos(math.radians(lat)))
        
        # Query facilities within bounding box
        query = MedicalFacility.query.filter(
            MedicalFacility.latitude.between(lat - lat_range, lat + lat_range),
            MedicalFacility.longitude.between(lng - lng_range, lng + lng_range)
        )
        
        if facility_type != 'all':
            query = query.filter(MedicalFacility.facility_type == facility_type)
        
        facilities = query.all()
        
        # Calculate actual distances and filter by radius
        results = []
        for facility in facilities:
            distance = calculate_distance(lat, lng, facility.latitude, facility.longitude)
            if distance <= radius:
                results.append({
                    'id': facility.id,
                    'name': facility.name,
                    'type': facility.facility_type,
                    'address': facility.address,
                    'lat': facility.latitude,
                    'lng': facility.longitude,
                    'phone': facility.phone,
                    'website': facility.website,
                    'services': json.loads(facility.services) if facility.services else [],
                    'emergency_services': facility.emergency_services,
                    'accepts_insurance': facility.accepts_insurance,
                    'distance': round(distance, 2)
                })
        
        # Sort by distance
        results.sort(key=lambda x: x['distance'])
        
        return jsonify({
            'success': True,
            'facilities': results,
            'count': len(results)
        })
        
    except Exception as e:
        logging.error(f"Facility search error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to search facilities'
        }), 500

@app.route('/api/health-goals', methods=['GET', 'POST'])
def api_health_goals():
    """Handle health goals CRUD operations"""
    if request.method == 'GET':
        # Get user's health goals
        goals = HealthGoal.query.filter_by(user_id=session.get('user_id')).all()
        return jsonify({
            'success': True,
            'goals': [{
                'id': goal.id,
                'goal_type': goal.goal_type,
                'title': goal.title,
                'description': goal.description,
                'target_value': goal.target_value,
                'current_value': goal.current_value,
                'unit': goal.unit,
                'target_date': goal.target_date.isoformat() if goal.target_date else None,
                'is_completed': goal.is_completed,
                'progress_percentage': (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
            } for goal in goals]
        })
    
    elif request.method == 'POST':
        # Create new health goal
        try:
            data = request.get_json()
            goal = HealthGoal()
            goal.user_id = session.get('user_id', 1)  # Default to user 1 for demo
            goal.goal_type = data['goal_type']
            goal.title = data['title']
            goal.description = data.get('description', '')
            goal.target_value = data['target_value']
            goal.unit = data.get('unit', '')
            goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None
            db.session.add(goal)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'goal_id': goal.id
            })
            
        except Exception as e:
            logging.error(f"Goal creation error: {e}")
            return jsonify({
                'success': False,
                'error': 'Failed to create goal'
            }), 500

@app.route('/api/health-goals/<int:goal_id>/progress', methods=['POST'])
def api_update_goal_progress(goal_id):
    """Update progress for a health goal"""
    try:
        data = request.get_json()
        goal = HealthGoal.query.get_or_404(goal_id)
        
        goal.current_value = data['current_value']
        if goal.current_value >= goal.target_value:
            goal.is_completed = True
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'progress_percentage': (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
        })
        
    except Exception as e:
        logging.error(f"Progress update error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to update progress'
        }), 500

@app.route('/api/generate-health-goals', methods=['POST'])
def api_generate_health_goals():
    """Generate AI-powered health goal suggestions"""
    try:
        data = request.get_json()
        user_profile = {
            'age': data.get('age', 30),
            'health_status': data.get('health_status', 'good'),
            'fitness_level': data.get('fitness_level', 'moderate'),
            'health_concerns': data.get('health_concerns', []),
            'preferences': data.get('preferences', [])
        }
        
        suggestions = generate_health_goals(user_profile)
        
        return jsonify({
            'success': True,
            'suggestions': [suggestion.dict() for suggestion in suggestions]
        })
        
    except Exception as e:
        logging.error(f"Goal generation error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate goal suggestions'
        }), 500

@app.route('/api/predict-disease', methods=['POST'])
def api_predict_disease():
    """Analyze symptoms and predict potential conditions"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        user_age = data.get('age')
        
        # Analyze symptoms using AI
        analysis = analyze_symptoms(symptoms, user_age)
        
        # Save prediction to database
        prediction = DiseasePrediction()
        prediction.user_id = session.get('user_id')
        prediction.symptoms = json.dumps(symptoms)
        prediction.prediction_result = analysis.prediction
        prediction.confidence_score = analysis.confidence
        prediction.recommendations = json.dumps(analysis.recommendations)
        db.session.add(prediction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'prediction': analysis.prediction,
            'confidence': analysis.confidence,
            'recommendations': analysis.recommendations,
            'urgency_level': analysis.urgency_level
        })
        
    except Exception as e:
        logging.error(f"Disease prediction error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze symptoms'
        }), 500

@app.route('/api/book-appointment', methods=['POST'])
def api_book_appointment():
    """Book a telemedicine appointment"""
    try:
        data = request.get_json()
        
        appointment = Appointment()
        appointment.user_id = session.get('user_id', 1)
        appointment.facility_id = data.get('facility_id')
        appointment.appointment_type = data.get('appointment_type', 'telemedicine')
        appointment.appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d %H:%M')
        appointment.notes = data.get('notes', '')
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'appointment_id': appointment.id
        })
        
    except Exception as e:
        logging.error(f"Appointment booking error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to book appointment'
        }), 500

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# Initialize sample data
@app.route('/api/init-sample-data', methods=['POST'])
def init_sample_data():
    """Initialize sample medical facilities data"""
    try:
        # Check if data already exists
        if MedicalFacility.query.first():
            return jsonify({'success': True, 'message': 'Data already exists'})
        
        # Sample medical facilities data
        facilities = [
            {
                'name': 'City General Hospital',
                'facility_type': 'hospital',
                'address': '123 Medical Center Dr, New York, NY 10001',
                'latitude': 40.7589,
                'longitude': -73.9851,
                'phone': '(212) 555-0100',
                'website': 'https://citygeneralny.com',
                'services': json.dumps(['Emergency Care', 'Surgery', 'Cardiology', 'Oncology', 'Pediatrics']),
                'emergency_services': True
            },
            {
                'name': 'Downtown Medical Clinic',
                'facility_type': 'clinic',
                'address': '456 Health St, New York, NY 10002',
                'latitude': 40.7505,
                'longitude': -73.9934,
                'phone': '(212) 555-0200',
                'website': 'https://downtownmedical.com',
                'services': json.dumps(['Primary Care', 'Preventive Medicine', 'Vaccinations']),
                'emergency_services': False
            },
            {
                'name': 'Central Pharmacy',
                'facility_type': 'pharmacy',
                'address': '789 Pharmacy Ave, New York, NY 10003',
                'latitude': 40.7410,
                'longitude': -74.0040,
                'phone': '(212) 555-0300',
                'website': 'https://centralpharmacy.com',
                'services': json.dumps(['Prescription Filling', 'Consultations', 'Health Screenings']),
                'emergency_services': False
            },
            {
                'name': 'Quick Care Urgent Center',
                'facility_type': 'urgent_care',
                'address': '321 Urgent Way, New York, NY 10004',
                'latitude': 40.7282,
                'longitude': -74.0776,
                'phone': '(212) 555-0400',
                'website': 'https://quickcareurgent.com',
                'services': json.dumps(['Urgent Care', 'Minor Injuries', 'X-rays', 'Lab Tests']),
                'emergency_services': True
            }
        ]
        
        for facility_data in facilities:
            facility = MedicalFacility(**facility_data)
            db.session.add(facility)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Added {len(facilities)} sample facilities'
        })
        
    except Exception as e:
        logging.error(f"Sample data initialization error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to initialize sample data'
        }), 500