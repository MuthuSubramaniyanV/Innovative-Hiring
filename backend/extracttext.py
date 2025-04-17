from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import filetype
import pytesseract
import pdfplumber
import google.generativeai as genai
from docx import Document
from PIL import Image
import json

import os
import logging
import traceback
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})

# Database connection function
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "INNOVATIVE_HIRING"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "admin"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except psycopg2.Error as e:
        logger.error("Database connection failed: %s", e)
        return None

# Configure Google AI Studio
# Configure Google AI Studio with actual API key
genai.configure(api_key="AIzaSyBOq7h29whug3VVqn5hXaStTDLGTPdYoc4")


# Extract text
def extract_text(file_path):
    kind = filetype.guess(file_path)
    if not kind:
        return None, "Unknown file type"

    mime_type = kind.mime
    try:
        if mime_type == "application/pdf":
            with pdfplumber.open(file_path) as pdf:
                return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()]), None
        elif "word" in mime_type:
            return "\n".join([p.text for p in Document(file_path).paragraphs]), None
        elif "image" in mime_type:
            return pytesseract.image_to_string(Image.open(file_path)), None
        return None, "Unsupported file type"
    except Exception as e:
        return None, f"Extraction error: {e}"

# Classify candidate level
def classify_candidate_level(resume_text):
    prompt = f"""
    You are an expert recruitment AI. Analyze the resume text and classify the candidate into one of the three categories: 
     **Beginner**: Less than 2 years of experience, entry-level roles, internships, or student projects. 
     **Intermediate**: 2 to 5 years of experience, mid-level roles, or relevant skills with some advanced projects. 
     **Advanced**: More than 5 years of experience, senior-level roles, leadership positions, or highly specialized expertise.

    Consider keywords such as **years of experience**, **job titles**, **skills**, **projects**, and **certifications**. 

    🔹 **Resume Content:**
    {resume_text}

    Provide ONLY one of these three words in response: **Beginner, Intermediate, or Advanced**.
    """
    try:
        model = genai.GenerativeModel('models/gemini-1.5-pro')
        response = model.generate_content(prompt)
        classification = response.text.strip()

        # Ensure response is valid
        if classification not in ["Beginner", "Intermediate", "Advanced"]:
            classification = "Unknown"

        return classification

    except Exception as e:
        logger.error("Google AI classification failed: %s", e)
        return None

# Update the submit_candidate route
@app.route('/submit', methods=['POST'])
def submit_candidate():
    conn = None
    temp_path = None

    try:
        logger.debug("Received submission request")
        
        if 'resume' not in request.files:
            logger.error("No resume file provided")
            return jsonify({"error": "No resume file provided"}), 400

        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        resume_file = request.files['resume']

        logger.debug(f"Received data: Name={name}, Email={email}, Phone={phone}, File={resume_file.filename}")

        if not all([name, email, phone, resume_file.filename]):
            logger.error("Missing required fields")
            return jsonify({"error": "Missing required fields"}), 400

        allowed_extensions = {'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'}
        if not allowed_file(resume_file.filename, allowed_extensions):
            logger.error(f"Invalid file type: {resume_file.filename}")
            return jsonify({"error": "Invalid file type. Allowed types: PDF, DOC, DOCX, PNG, JPG"}), 400

        # Save and process file
        filename = secure_filename(resume_file.filename)
        temp_path = os.path.join('temp', filename)
        os.makedirs('temp', exist_ok=True)
        resume_file.save(temp_path)

        logger.debug(f"Saved file to: {temp_path}")

        # Extract text from resume
        resume_text, error = extract_text(temp_path)
        if error or not resume_text:
            logger.error("Failed to extract text from resume")
            raise ValueError("Failed to extract text from resume")

        logger.debug(f"Extracted text from resume: {resume_text[:100]}...")

        # Classify candidate level
        candidate_level = classify_candidate_level(resume_text)
        logger.debug(f"Resume classified as: {candidate_level}")

        # Create JSON structure for resume data
        resume_json = {
            "extracted_text": resume_text,
            "file_name": filename,
            
        }

        # Database connection and insertion
        conn = get_db_connection()
        if conn is None:
            logger.error("Failed to connect to the database")
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        query = """
            INSERT INTO candidate (
                name, 
                email, 
                phone, 
                resume, 
                candidate_level,
                progress,
                selected
            )
            VALUES (
                %s, %s, %s, %s, %s::candidate_level, 
                'Applied'::progress, 
                'Pending'::selected
            )
            RETURNING candidate_id
        """
        
        # Add debug logging
        logger.debug(f"Executing query with values: {name}, {email}, {phone}, {candidate_level}")
        
        cursor.execute(
            query, 
            (
                name, 
                email, 
                phone, 
                json.dumps(resume_json), 
                candidate_level
            )
        )
        
        new_candidate_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        
        logger.debug(f"Data inserted successfully. Candidate ID: {new_candidate_id}")

        return jsonify({
            "success": True,
            "message": "Application submitted successfully!",
            "candidate_level": candidate_level,
            "candidate_id": new_candidate_id
        }), 200

    except psycopg2.Error as db_error:
        logger.error(f"Database error: {str(db_error)}")
        return jsonify({
            "success": False,
            "error": "Database error",
            "details": str(db_error)
        }), 500
    except Exception as e:
        logger.error(f"Error processing submission: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": str(e)
        }), 500
    finally:
        if cursor and not cursor.closed:
            cursor.close()
        if conn:
            conn.close()
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Error removing temp file: {str(e)}")

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

if __name__ == '__main__':
    app.run(debug=True, port=5001)
