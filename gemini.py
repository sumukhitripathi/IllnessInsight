import json
import logging
import os
from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

# IMPORTANT: KEEP THIS COMMENT
# Follow these instructions when using this blueprint:
# - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
#   - do not change this unless explicitly requested by the user
# - Sometimes the google genai SDK has occasional type errors. You might need to run to validate, at time.  
# The SDK was recently renamed from google-generativeai to google-genai. This file reflects the new name and the new APIs.

# This API key is from Gemini Developer API Key, not vertex AI API Key
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

class ChatResponse(BaseModel):
    message: str
    tone: str
    confidence: float

class SymptomAnalysis(BaseModel):
    prediction: str
    confidence: float
    recommendations: list
    urgency_level: str

class HealthGoalSuggestion(BaseModel):
    goal_type: str
    title: str
    description: str
    target_value: float
    unit: str
    timeline_days: int

def generate_chat_response(message: str, persona_type: str, user_context: dict = None) -> str:
    """Generate AI chat response based on persona type and user context"""
    try:
        # Define system prompts for different personas
        system_prompts = {
            "senior": (
                "You are a helpful, patient healthcare assistant designed for senior patients. "
                "Use simple, clear language. Speak slowly and reassuringly. "
                "Always ask if they need clarification. Be respectful and understanding. "
                "Focus on easy-to-understand health information and gentle guidance."
            ),
            "pediatric": (
                "You are a friendly, cheerful healthcare assistant for children. "
                "Use age-appropriate language, be encouraging and positive. "
                "Make health topics fun and easy to understand. "
                "Use friendly analogies and be patient with questions. "
                "Always maintain a caring, nurturing tone."
            ),
            "empathetic": (
                "You are an empathetic healthcare assistant for anxious or vulnerable patients. "
                "Be understanding, compassionate, and supportive. "
                "Listen carefully to concerns and provide reassuring guidance. "
                "Acknowledge emotions and provide comfort while giving helpful health information. "
                "Be gentle and non-judgmental."
            ),
            "caregiver": (
                "You are a healthcare assistant designed to support caregivers. "
                "Understand the stress and challenges of caring for others. "
                "Provide practical advice, emotional support, and resources. "
                "Be efficient but compassionate, acknowledging their important role."
            ),
            "general": (
                "You are a professional healthcare assistant. "
                "Provide accurate, helpful health information and guidance. "
                "Be clear, informative, and supportive while maintaining medical accuracy."
            )
        }

        system_prompt = system_prompts.get(persona_type, system_prompts["general"])
        
        # Add user context if available
        context_info = ""
        if user_context:
            age = user_context.get('age', '')
            user_type = user_context.get('user_type', '')
            if age:
                context_info += f" The user is {age} years old."
            if user_type:
                context_info += f" User type: {user_type}."

        full_prompt = f"{system_prompt}{context_info}\n\nUser message: {message}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )

        return response.text or "I'm sorry, I couldn't process your message. Please try again."

    except Exception as e:
        logging.error(f"Error generating chat response: {e}")
        return "I'm experiencing technical difficulties. Please try again later."

def analyze_symptoms(symptoms: list, user_age: str = None) -> SymptomAnalysis:
    """Analyze symptoms and provide health predictions"""
    try:
        symptoms_text = ", ".join(symptoms)
        age_context = f" for a {user_age}-year-old patient" if user_age else ""
        
        system_prompt = (
            "You are a medical AI assistant. Analyze the provided symptoms and provide "
            "a preliminary assessment. IMPORTANT: Always remind users to consult healthcare "
            "professionals for proper diagnosis. Provide general guidance only. "
            "Rate urgency as: low, medium, high, or emergency. "
            "Respond with JSON in this format: "
            "{'prediction': 'description', 'confidence': number, 'recommendations': ['rec1', 'rec2'], 'urgency_level': 'level'}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(role="user", parts=[types.Part(text=f"Symptoms: {symptoms_text}{age_context}")])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=SymptomAnalysis,
            ),
        )

        raw_json = response.text
        if raw_json:
            data = json.loads(raw_json)
            return SymptomAnalysis(**data)
        else:
            raise ValueError("Empty response from model")

    except Exception as e:
        logging.error(f"Error analyzing symptoms: {e}")
        return SymptomAnalysis(
            prediction="Unable to analyze symptoms. Please consult a healthcare professional.",
            confidence=0.0,
            recommendations=["Consult with a doctor", "Monitor symptoms"],
            urgency_level="medium"
        )

def generate_health_goals(user_profile: dict) -> list[HealthGoalSuggestion]:
    """Generate personalized health goals based on user profile"""
    try:
        profile_text = json.dumps(user_profile)
        
        system_prompt = (
            "You are a health coaching AI. Based on the user profile, suggest 3-5 "
            "realistic health goals. Consider their age, health status, and preferences. "
            "Provide specific, measurable goals with appropriate timelines. "
            "Respond with JSON array of goals in this format: "
            "[{'goal_type': 'type', 'title': 'title', 'description': 'desc', 'target_value': number, 'unit': 'unit', 'timeline_days': number}]"
        )

        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(role="user", parts=[types.Part(text=f"User profile: {profile_text}")])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )

        raw_json = response.text
        if raw_json:
            data = json.loads(raw_json)
            return [HealthGoalSuggestion(**goal) for goal in data]
        else:
            raise ValueError("Empty response from model")

    except Exception as e:
        logging.error(f"Error generating health goals: {e}")
        return []

def generate_health_advice(goal_type: str, current_progress: dict) -> str:
    """Generate personalized health advice based on goal progress"""
    try:
        progress_text = json.dumps(current_progress)
        
        prompt = (
            f"Provide encouraging and practical health advice for a {goal_type} goal. "
            f"Current progress: {progress_text}. "
            "Give specific, actionable recommendations to help achieve the goal."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text or "Keep up the great work on your health journey!"

    except Exception as e:
        logging.error(f"Error generating health advice: {e}")
        return "Continue working towards your health goals. Consistency is key!"
