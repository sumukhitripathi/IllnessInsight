#!/usr/bin/env python3
"""Script to add sample medical facility data to the IntelliMed database"""
from app import app
from extensions import db
from models import MedicalFacility
import json

def add_sample_facilities():
    """Add sample medical facilities to the database"""
    
    sample_facilities = [
        {
            'name': 'NewYork-Presbyterian Hospital',
            'facility_type': 'hospital',
            'address': '525 E 68th St, New York, NY 10065',
            'latitude': 40.7614,
            'longitude': -73.9540,
            'phone': '(212) 746-5454',
            'website': 'https://www.nyp.org',
            'services': json.dumps(['Emergency Care', 'Surgery', 'Cardiology', 'Oncology']),
            'emergency_services': True,
            'accepts_insurance': True
        },
        {
            'name': 'Mount Sinai Hospital',
            'facility_type': 'hospital',
            'address': '1 Gustave L. Levy Pl, New York, NY 10029',
            'latitude': 40.7903,
            'longitude': -73.9529,
            'phone': '(212) 241-6500',
            'website': 'https://www.mountsinai.org',
            'services': json.dumps(['Emergency Care', 'Neurology', 'Cardiology', 'Surgery']),
            'emergency_services': True,
            'accepts_insurance': True
        },
        {
            'name': 'NYU Langone Health',
            'facility_type': 'hospital',
            'address': '550 1st Ave, New York, NY 10016',
            'latitude': 40.7424,
            'longitude': -73.9732,
            'phone': '(212) 263-7300',
            'website': 'https://nyulangone.org',
            'services': json.dumps(['Emergency Care', 'Surgery', 'Orthopedics', 'Cardiology']),
            'emergency_services': True,
            'accepts_insurance': True
        },
        {
            'name': 'CityMD Urgent Care - Midtown',
            'facility_type': 'urgent_care',
            'address': '160 E 32nd St, New York, NY 10016',
            'latitude': 40.7459,
            'longitude': -73.9819,
            'phone': '(347) 850-3090',
            'website': 'https://www.citymd.com',
            'services': json.dumps(['Urgent Care', 'X-rays', 'Lab Tests']),
            'emergency_services': False,
            'accepts_insurance': True
        },
        {
            'name': 'CVS Pharmacy - Grand Central',
            'facility_type': 'pharmacy',
            'address': '150 E 42nd St, New York, NY 10017',
            'latitude': 40.7527,
            'longitude': -73.9772,
            'phone': '(212) 818-9650',
            'website': 'https://www.cvs.com',
            'services': json.dumps(['Pharmacy', 'Vaccinations', 'Health Screening']),
            'emergency_services': False,
            'accepts_insurance': True
        },
        {
            'name': 'Walgreens Pharmacy - Times Square',
            'facility_type': 'pharmacy',
            'address': '1411 Broadway, New York, NY 10018',
            'latitude': 40.7546,
            'longitude': -73.9869,
            'phone': '(212) 921-1589',
            'website': 'https://www.walgreens.com',
            'services': json.dumps(['Pharmacy', 'Vaccinations', 'Photo Services']),
            'emergency_services': False,
            'accepts_insurance': True
        },
        {
            'name': 'Manhattan Primary Care',
            'facility_type': 'clinic',
            'address': '51 E 25th St, New York, NY 10010',
            'latitude': 40.7420,
            'longitude': -73.9881,
            'phone': '(212) 685-3800',
            'website': 'https://manhattanprimarycare.com',
            'services': json.dumps(['Primary Care', 'Preventive Care', 'Chronic Disease Management']),
            'emergency_services': False,
            'accepts_insurance': True
        },
        {
            'name': 'Duane Reade Pharmacy - Village',
            'facility_type': 'pharmacy',
            'address': '378 6th Ave, New York, NY 10014',
            'latitude': 40.7357,
            'longitude': -74.0023,
            'phone': '(212) 674-5357',
            'website': 'https://www.duanereade.com',
            'services': json.dumps(['Pharmacy', 'Health Products', 'Beauty']),
            'emergency_services': False,
            'accepts_insurance': True
        },
        {
            'name': 'Brooklyn Methodist Hospital',
            'facility_type': 'hospital',
            'address': '506 6th St, Brooklyn, NY 11215',
            'latitude': 40.6736,
            'longitude': -73.9857,
            'phone': '(718) 780-3000',
            'website': 'https://www.nyphospitals.org',
            'services': json.dumps(['Emergency Care', 'Surgery', 'Maternity', 'Cardiology']),
            'emergency_services': True,
            'accepts_insurance': True
        },
        {
            'name': 'CityMD Urgent Care - Lower East Side',
            'facility_type': 'urgent_care',
            'address': '225 E Houston St, New York, NY 10002',
            'latitude': 40.7216,
            'longitude': -73.9878,
            'phone': '(347) 850-3010',
            'website': 'https://www.citymd.com',
            'services': json.dumps(['Urgent Care', 'COVID Testing', 'Minor Injuries']),
            'emergency_services': False,
            'accepts_insurance': True
        }
    ]
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if facilities already exist
        existing_count = MedicalFacility.query.count()
        if existing_count > 0:
            print(f"Database already has {existing_count} facilities. Skipping initialization.")
            return
        
        # Add sample facilities
        for facility_data in sample_facilities:
            facility = MedicalFacility()
            for key, value in facility_data.items():
                setattr(facility, key, value)
            db.session.add(facility)
        
        # Commit changes
        try:
            db.session.commit()
            print(f"Successfully added {len(sample_facilities)} medical facilities to the database.")
        except Exception as e:
            db.session.rollback()
            print(f"Error adding facilities: {e}")

if __name__ == "__main__":
    add_sample_facilities()