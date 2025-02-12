from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

# PostgreSQL connection
conn = psycopg2.connect(
    dbname="INNOVATIVE HIRING",
    user="postgres",
    password="admin",
    host="localhost",
    port="5432"
)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username_or_email = data.get("username")
    password = data.get("password")

    cursor = conn.cursor()
    query = "SELECT user_id, username, email FROM users WHERE (username = %s OR email = %s) AND password = %s"
    cursor.execute(query, (username_or_email, username_or_email, password))
    user = cursor.fetchone()
    cursor.close()

    if user:
        return jsonify({"message": "Login successful", "user": {"user_id": user[0], "username": user[1], "email": user[2]}, "status": "success"}), 200
    else:
        return jsonify({"message": "Invalid credentials", "status": "error"}), 401

if __name__ == '__main__':
    app.run(debug=True)
