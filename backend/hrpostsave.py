from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
from enum import Enum

app = Flask(__name__)

# Simple CORS configuration
CORS(app, 
     origins=["http://localhost:5173"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:admin@localhost:5432/INNOVATIVE_HIRING'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Models
class QuestionType(Enum):
    MCQ = 'MCQ'
    Interview = 'Interview'

class Post(db.Model):
    __tablename__ = 'post'
    
    post_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    minimum_experience = db.Column(db.Integer)
    category = db.Column(db.String(100))
    panel_id = db.Column(db.String(255))
    question_id = db.Column(db.String(255))
    followup = db.Column(db.Integer)
    coverage = db.Column(db.Integer)
    time = db.Column(db.Integer)
    exam_type = db.Column(db.Enum(QuestionType), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    test_start_date = db.Column(db.Date)
    application_deadline = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')

class PanelMember(db.Model):
    __tablename__ = 'panel_members'
    
    userid = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)

# Routes
@app.route('/posts', methods=['GET'])
def get_posts():
    try:
        posts = Post.query.all()
        return jsonify({
            'success': True,
            'posts': [{
                'post_id': post.post_id,
                'title': post.title,
                'description': post.description,
                'minimum_experience': post.minimum_experience,
                'category': post.category,
                'panel_id': post.panel_id.split(',') if post.panel_id else [],
                'followup': post.followup,
                'coverage': post.coverage,
                'time': post.time,
                'exam_type': post.exam_type.value,
                'application_deadline': post.application_deadline.isoformat() if post.application_deadline else None,
                'test_start_date': post.test_start_date.isoformat() if post.test_start_date else None,
                'status': post.status
            } for post in posts]
        }), 200
    except Exception as e:
        print(f"Error fetching posts: {str(e)}")  # Log the error
        return jsonify({
            'success': False,
            'error': 'Failed to fetch posts',
            'details': str(e)
        }), 500

@app.route('/save-post', methods=['POST', 'OPTIONS'])
def create_post():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate required fields
        required_fields = ['title', 'description', 'minimum_experience', 
                         'category', 'exam_type', 'time', 
                         'application_deadline', 'test_start_date']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Create new post
        new_post = Post(
            title=data['title'],
            description=data['description'],
            minimum_experience=data['minimum_experience'],
            category=data['category'],
            exam_type=data['exam_type'],
            followup=data.get('followup'),
            coverage=data.get('coverage'),
            time=data['time'],
            application_deadline=datetime.strptime(data['application_deadline'], '%Y-%m-%d').date(),
            test_start_date=datetime.strptime(data['test_start_date'], '%Y-%m-%d').date(),
            status='pending'
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        response = jsonify({
            'success': True,
            'message': 'Post created successfully',
            'post_id': new_post.post_id
        })
        return response, 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating post: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create post',
            'details': str(e)
        }), 500

@app.route('/update-post/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        data = request.json
        
        post.title = data['title']
        post.description = data['description']
        post.minimum_experience = data['minimum_experience']
        post.category = data['category']
        post.exam_type = data['exam_type']
        post.followup = data.get('followup')
        post.coverage = data.get('coverage')
        post.time = data['time']
        post.application_deadline = datetime.strptime(data['application_deadline'], '%Y-%m-%d').date()
        post.test_start_date = datetime.strptime(data['test_start_date'], '%Y-%m-%d').date()
        
        db.session.commit()
        return jsonify({'message': 'Post updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/delete-post/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        db.session.delete(post)
        db.session.commit()
        return jsonify({'message': 'Post deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/panel-members', methods=['GET'])
def get_panel_members():
    try:
        members = PanelMember.query.all()
        return jsonify([{
            'userid': member.userid,
            'username': member.username,
            'email': member.email
        } for member in members])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update-panel', methods=['PUT'])
def update_panel():
    try:
        data = request.json
        post = Post.query.get_or_404(data['post_id'])
        post.panel_id = ','.join(data['panels'])
        db.session.commit()
        return jsonify({'message': 'Panel updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/check-report-status/<int:post_id>', methods=['GET'])
def check_report_status(post_id):
    try:
        # This is a placeholder implementation
        # You should implement the actual logic to check for reportable/reported candidates
        return jsonify({
            'hasReportable': False,
            'hasReported': False
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/jobs', methods=['GET'])
def get_jobs():
    try:
        jobs = Post.query.filter_by(status='active').all()
        return jsonify([{
            'id': job.post_id,
            'title': job.title,
            'description': job.description,
            'minimum_experience': job.minimum_experience,
            'category': job.category,
            'exam_type': job.exam_type.value,
            'followup': job.followup,
            'coverage': job.coverage,
            'time': job.time,
            'application_deadline': job.application_deadline.isoformat() if job.application_deadline else None,
            'test_start_date': job.test_start_date.isoformat() if job.test_start_date else None,
            'status': job.status
        } for job in jobs])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    try:
        with app.app_context():
            # Create tables
            db.create_all()
            print("✅ Database tables created successfully")
        
        # Start server
        print("🚀 Starting server on http://localhost:5000")
        app.run(
            host='0.0.0.0',  # Listen on all available interfaces
            port=5000,
            debug=True
        )
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")