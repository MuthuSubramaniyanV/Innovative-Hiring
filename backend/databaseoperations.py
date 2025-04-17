from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime
import random
import string
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

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

# Global variable for email storage
received_email = None
active_otps = {}  # Store OTPs with expiration times

# Helper functions
def generate_otp(length=6):
    """Generate a random OTP of specified length."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp):
    """Send OTP via email."""
    try:
        email_sender = 'innovativehiring032@gmail.com'
        email_password = os.getenv('EMAIL_PASSWORD', 'gyyj zcta jsxs fmdt')
        
        msg = EmailMessage()
        msg.set_content(f"""
        Dear User,

        Your OTP for password reset is: {otp}

        This OTP will expire in 15 minutes.

        If you did not request this, please ignore this email.

        Best regards,
        Innovative Hiring Team
        """)
        
        msg["Subject"] = "Password Reset OTP"
        msg["From"] = email_sender
        msg["To"] = email

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(email_sender, email_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False

# Jobs routes
@app.route('/jobs', methods=['GET'])
def get_jobs():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT post_id, title, description, minimum_experience, exam_type
            FROM post
            WHERE status = 'active'
        """)

        jobs = [
            {
                "job_id": row[0],
                "job_title": row[1],
                "description": row[2],
                "minimum_experience": row[3],
                "exam_type": row[4]
            }
            for row in cur.fetchall()
        ]

        return jsonify(jobs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username_or_email = data.get("username")
    password = data.get("password")

    if not username_or_email or not password:
        return jsonify({"message": "Username or email and password are required", "status": "error"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed", "status": "error"}), 500

    try:
        cursor = conn.cursor()
        query = """
            SELECT id, username, email, user_password, user_role, user_status 
            FROM users 
            WHERE (username = %s OR email = %s)
        """
        cursor.execute(query, (username_or_email, username_or_email))
        user = cursor.fetchone()

        if user and user[5] == 'Deactivated':  # Check if account is deactivated
            return jsonify({"message": "Account is deactivated", "status": "error"}), 401

        if user and user[3] == password:  # Verify password
            # Restrict login only to panel members
           

            # Get assigned candidates count
            cursor.execute("""
                SELECT COUNT(*) 
                FROM candidate 
                WHERE assigned_panel = %s
            """, (user[0],))
            assigned_count = cursor.fetchone()[0]

            return jsonify({
                "message": "Login successful",
                "user": {
                    "user_id": user[0],
                    "username": user[1],
                    "email": user[2],
                    "role": user[4],
                    "assigned_candidates_count": assigned_count
                },
                "status": "success"
            }), 200
        else:
            return jsonify({"message": "Invalid credentials", "status": "error"}), 401

    except Exception as e:
        return jsonify({"message": str(e), "status": "error"}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/panel/assigned-candidates', methods=['GET'])
def get_assigned_candidates():
    panel_id = request.args.get('id')
    panel_id = int(panel_id)   

    if not panel_id:
        return jsonify({"message": "Panel ID is required", "status": "error"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verify panel member exists and is active
        cursor.execute("""
            SELECT id FROM users 
            WHERE id = %s AND user_role = 'Panel' AND user_status = 'Activated'
        """, (panel_id,))
        panel_member = cursor.fetchone()

        if not panel_member:
            return jsonify({
                "message": "Invalid or inactive panel member", 
                "status": "error"
            }), 403

        # Fetch assigned candidates
        query = """
            SELECT 
                
                c.name,
                c.email,
                c.phone,
                
               
                c.interview_performance,
                c.interview_feedback,
                c.interview_conversation,
                c.progress,
                c.selected,
                c.candidate_level,
                p.title AS job_title,
                p.description AS job_description
            FROM candidate c
            LEFT JOIN post p ON c.job_id = p.post_id
            WHERE c.assigned_panel = %s
            ORDER BY c.applied_at DESC
        """
        cursor.execute(query, (panel_id,))
        candidates = cursor.fetchall()

        candidates_list = [
    {
        "name": row[0],  # name
        "email": row[1],  # email
        "phone": row[2],  # phone
        "interview_performance": row[3],  # interview_performance
        "interview_feedback": row[4],  # interview_feedback
        "interview_conversation": row[5],  # interview_conversation
        "progress": row[6],  # progress
        "selected": row[7],  # selected
        "candidate_level": row[8],  # candidate_level
        "job_title": row[9],  # job_title
        "job_description": row[10],  # job_description
    }
    for row in candidates
]

    

        return jsonify({
            "message": "Candidates fetched successfully", 
            "candidates": candidates_list,
            "total_count": len(candidates_list),
            "status": "success"
        }), 200

    except Exception as e:
        return jsonify({"message": str(e), "status": "error"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Email registration routes
@app.route('/api/send-email', methods=['OPTIONS', 'POST'])
def receive_email():
    global received_email
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight OK"}), 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data received"}), 400

        email1 = data.get("email")
        if not email1:
            return jsonify({"success": False, "message": "Email is required"}), 400

        received_email = email1
        return jsonify({"success": True, "message": "Email send successfully"})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    global received_email
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required", "status": "error"}), 400

    if not received_email:
        return jsonify({"message": "No email found. Please send email first.", "status": "error"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed", "status": "error"}), 500

    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE email = %s", (received_email,))
    user_data = cursor.fetchone()

    if not user_data:
        cursor.close()
        conn.close()
        return jsonify({"message": "Email not found", "status": "error"}), 400

    email = received_email

    update_query = """
        UPDATE users 
        SET username = %s, user_password = %s, is_registered = TRUE, user_status = 'Activated'
        WHERE email = %s
        RETURNING id, username, user_role
    """
    cursor.execute(update_query, (username, password, email))
    new_user = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "user_id": new_user[0],
            "username": new_user[1],
            "role": new_user[2]
        },
        "status": "success"
    }), 201

@app.route('/api/create-user', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data received"}), 400

        email = data.get("email")
        role = data.get("role")

        if not email or not role:
            return jsonify({"success": False, "message": "Email and role are required!"}), 400

        if role not in ["Admin", "Hr", "Panel"]:
            return jsonify({"success": False, "message": "Invalid role!"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"success": False, "message": "Unable to establish database connection"}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "Email already registered!"}), 400

        cursor.execute(
            """
            INSERT INTO users 
            (email, user_role, user_status, is_registered, created_at)
            VALUES (%s, %s::roles, 'Deactivated'::status, FALSE, %s)
            RETURNING id
            """,
            (email, role, datetime.now())
        )
        user_id = cursor.fetchone()
        if not user_id:
            raise Exception("Failed to create user record")

        conn.commit()

        # Sending email
        register_link = f"http://localhost:5173/register?email={email}"
        email_sender = 'innovativehiring032@gmail.com'
        email_password = os.getenv('EMAIL_PASSWORD', 'gyyj zcta jsxs fmdt')
        email_receiver = email

        msg = EmailMessage()
        msg.set_content(f"""
        Welcome to our platform!
        
        Click the following link to complete your registration: {register_link}
        
        This link will allow you to set up your username and password.
        """)
        msg["Subject"] = "Complete Your Registration"
        msg["From"] = email_sender
        msg["To"] = email_receiver

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(email_sender, email_password)
            server.send_message(msg)

        return jsonify({"success": True, "message": "User created successfully!"}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"success": False, "message": "An unexpected error occurred"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/update-user-status', methods=['POST'])
def update_user_status():
    data = request.json
    user_id = data.get("user_id")
    new_status = data.get("status")

    if not user_id or not new_status:
        return jsonify({"message": "User ID and status are required", "success": False}), 400

    # Validate status value
    if new_status not in ['Activated', 'Deactivated']:
        return jsonify({"message": "Invalid status value", "success": False}), 400

    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"message": "Database connection failed", "success": False}), 500

        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET user_status = %s::status WHERE id = %s RETURNING user_status",
            (new_status, user_id)
        )
        updated_status = cursor.fetchone()
        conn.commit()
        
        if updated_status:
            return jsonify({
                "message": f"User status updated to {updated_status[0]}", 
                "success": True
            })
        else:
            return jsonify({
                "message": "User not found", 
                "success": False
            }), 404

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        return jsonify({
            "message": "Database error", 
            "success": False, 
            "error": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/get-users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email, user_role, user_status 
            FROM users
        """)
        
        users = [
            {
                "id": row[0],
                "name": row[1] or "Not Set",
                "email": row[2],
                "role": row[3],
                "status": row[4]
            }
            for row in cursor.fetchall()
        ]

        return jsonify(users)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Add these new routes after your existing routes
@app.route('/api/panel/questions', methods=['GET'])
def get_panel_questions():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, content, panel_type, created_at 
            FROM panel_questions 
            ORDER BY created_at DESC
        """)
        
        questions = [
            {
                "id": row[0],
                "content": row[1],
                "panelType": row[2],
                "createdAt": row[3].isoformat() if row[3] else None
            }
            for row in cursor.fetchall()
        ]

        return jsonify(questions)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/panel/questions', methods=['POST'])
def create_panel_question():
    data = request.json
    content = data.get('content')
    panel_type = data.get('panelType')

    if not content:
        return jsonify({"success": False, "message": "Question content is required"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO panel_questions (content, panel_type, created_at)
            VALUES (%s, %s, NOW())
            RETURNING id
        """, (content, panel_type))
        
        question_id = cursor.fetchone()[0]
        conn.commit()

        return jsonify({
            "success": True, 
            "message": "Question created successfully",
            "id": question_id
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/panel/questions/<int:id>', methods=['PUT'])
def update_panel_question(id):
    data = request.json
    content = data.get('content')

    if not content:
        return jsonify({"success": False, "message": "Question content is required"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE panel_questions 
            SET content = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id
        """, (content, id))
        
        if cursor.fetchone():
            conn.commit()
            return jsonify({"success": True, "message": "Question updated successfully"})
        else:
            return jsonify({"success": False, "message": "Question not found"}), 404

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/panel/questions/<int:id>', methods=['DELETE'])
def delete_panel_question(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM panel_questions WHERE id = %s RETURNING id", (id,))
        
        if cursor.fetchone():
            conn.commit()
            return jsonify({"success": True, "message": "Question deleted successfully"})
        else:
            return jsonify({"success": False, "message": "Question not found"}), 404

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/panel/tasks', methods=['GET'])
def get_panel_tasks():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, description, status, created_at 
            FROM panel_tasks 
            WHERE status = 'active'
            ORDER BY created_at DESC
        """)
        
        tasks = [
            {
                "id": row[0],
                "description": row[1],
                "status": row[2],
                "createdAt": row[3].isoformat() if row[3] else None
            }
            for row in cursor.fetchall()
        ]

        return jsonify(tasks)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/send-otp', methods=['OPTIONS', 'POST'])
def send_otp():
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight OK"}), 200
        
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Email not found'}), 404
        
        # Generate OTP
        otp = generate_otp()
        expiration_time = datetime.now() + timedelta(minutes=15)
        active_otps[email] = {
            'otp': otp,
            'expires_at': expiration_time
        }
        
        
        
        # Send OTP via email
        if send_otp_email(email, otp):
            return jsonify({'success': True, 'message': 'OTP sent successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send OTP'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/candidates', methods=['GET'])
def get_candidates():
    level = request.args.get('level', 'Beginner')  # Default to "Beginner"
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = "SELECT candidate_id, name, email, phone, candidate_level FROM candidate WHERE candidate_level = %s;"
    cur.execute(query, (level,))
    candidates = cur.fetchall()
    
    cur.close()
    conn.close()
    
    result = [
        {"candidate_id": row[0], "name": row[1], "email": row[2], "phone": row[3], "candidate_level": row[4]}
        for row in candidates
    ]
    
    return jsonify(result)


@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({'success': False, 'message': 'Email and OTP are required'}), 400
    
    if email not in active_otps:
        return jsonify({'success': False, 'message': 'No active OTP found for this email'}), 404
    
    otp_data = active_otps[email]
    
    if datetime.now() > otp_data['expires_at']:
        del active_otps[email]
        return jsonify({'success': False, 'message': 'OTP has expired'}), 400
    
    if otp != otp_data['otp']:
        return jsonify({'success': False, 'message': 'Invalid OTP'}), 400
    
    return jsonify({'success': True, 'message': 'OTP verified successfully'})

    
@app.route('/api/reset-credentials', methods=['POST'])
def reset_credentials():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_username = data.get('newUsername')
    new_password = data.get('newPassword')
    
    if not all([email, otp, new_username, new_password]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    if email not in active_otps or otp != active_otps[email]['otp']:
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400
    
    if datetime.now() > active_otps[email]['expires_at']:
        del active_otps[email]
        return jsonify({'success': False, 'message': 'OTP has expired'}), 400
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor()
        
        # Check if new username conflicts with existing users
        cursor.execute(
            "SELECT id FROM users WHERE username = %s AND email != %s",
            (new_username, email)
        )
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Username already taken'}), 400
        
        # Update user credentials
        cursor.execute(
            """
            UPDATE users 
            SET username = %s, user_password = %s, is_registered = TRUE, 
                user_status = 'Activated'
            WHERE email = %s
            RETURNING id
            """,
            (new_username, new_password, email)
        )
        
        if cursor.fetchone():
            conn.commit()
            del active_otps[email]  # Clean up used OTP
            return jsonify({'success': True, 'message': 'Credentials updated successfully'})
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)