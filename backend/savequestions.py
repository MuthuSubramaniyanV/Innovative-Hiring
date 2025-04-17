from flask import Flask, request, jsonify
from flask_cors import CORS  # Importing the CORS module
import psycopg2
import json

app = Flask(__name__)

# Enable CORS for all origins
CORS(app)  # This will allow all domains by default

# Database connection function
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="INNOVATIVE_HIRING",
            user="postgres",
            password="admin",
            host="localhost",
            port="5432"
        )
        return conn
    except psycopg2.Error as e:
        print("Error connecting to PostgreSQL:", e)
        return None

# API to save questions (Interview)
@app.route('/api/save_questions', methods=['POST'])
def save_questions():
    data = request.json
    question_title = data.get("question_title")
    questions = data.get("questions")  # JSON structure (for MCQ)
    exam_type = "Interview"  # Set exam_type to Interview

    if not question_title or not questions:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        cur.execute(""" 
            INSERT INTO question (question_title, questions, exam_type)
            VALUES (%s, %s, %s)
        """, (question_title, json.dumps(questions), exam_type))

        conn.commit()
        return jsonify({"message": "Question saved successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# API to save selected MCQ questions with a file name
@app.route('/api/save-selected-questions', methods=['POST'])
def save_selected_questions():
    data = request.json
    file_name = data.get("file_name")
    questions = data.get("questions")

    if not file_name or not questions:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        # Save the selected questions as a new entry
        cur.execute(""" 
            INSERT INTO question (question_title, questions, exam_type)
            VALUES (%s, %s, %s)
        """, (file_name, json.dumps(questions), "MCQ"))

        conn.commit()
        return jsonify({"message": "Selected MCQ questions saved successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# API to fetch all questions
@app.route('/api/questions', methods=['GET'])
def get_questions():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT question_id, question_title, questions, exam_type
            FROM question
        """)
        questions = [
            {
                "question_id": row[0],
                "question_title": row[1],
                "questions": row[2],  # JSONB data
                "exam_type": row[3]
            }
            for row in cur.fetchall()
        ]

        return jsonify(questions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# API to filter questions by exam type (Interview/MCQ)
@app.route('/api/questions/<exam_type>', methods=['GET'])
def get_questions_by_type(exam_type):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT question_id, question_title, questions, exam_type
            FROM question
            WHERE exam_type = %s
        """, (exam_type,))

        questions = [
            {
                "question_id": row[0],
                "question_title": row[1],
                "questions": row[2],
                "exam_type": row[3]
            }
            for row in cur.fetchall()
        ]

        return jsonify(questions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Run Flask server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
