import os
import base64
import io
import mimetypes
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Create Flask app with correct static folder path
app = Flask(__name__, static_folder='../frontend')
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Configure upload settings
MAX_SIZE = int(os.getenv('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))
app.config['MAX_CONTENT_LENGTH'] = MAX_SIZE

ALLOWED_EXTENSIONS = {
    # Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff',
    # Documents
    'pdf', 'doc', 'docx', 'txt', 'rtf', 'csv', 'tsv', 'html', 'htm',
    # Audio
    'mp3', 'wav', 'aiff', 'aac', 'ogg', 'flac', 'm4a', 'wma',
    # Video
    'mp4', 'mov', 'avi', 'flv', 'mpg', 'mpeg', 'wmv', 'webm', 'mkv', '3gp'
}

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def setup_gemini():
    """Configure and set up the Gemini model."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    
    genai.configure(api_key=api_key)
    model_name = "models/gemini-2.0-flash"
    print(f"Using model: {model_name}")
    return genai.GenerativeModel(model_name)

# Initialize the model and chat session at startup
model = setup_gemini()
sessions = {}  # Store chat sessions by session ID

# Session timeout in hours
SESSION_TIMEOUT_HOURS = int(os.getenv('SESSION_TIMEOUT_HOURS', 24))

# Session management
def get_or_create_session(session_id):
    """Get existing session or create a new one."""
    if session_id not in sessions:
        sessions[session_id] = {
            'chat': model.start_chat(history=[]),
            'created_at': datetime.now(),
            'message_count': 0
        }
        print(f"Created new session: {session_id}")
    else:
        print(f"Using existing session: {session_id} with {sessions[session_id]['message_count']} messages")
    return sessions[session_id]

def log_session_info():
    """Log information about active sessions."""
    print(f"Active sessions: {len(sessions)}")
    for sid, session in sessions.items():
        print(f"  - {sid}: {session['message_count']} messages, created at {session['created_at']}")

def process_image(base64_image):
    """Convert base64 image to PIL Image."""
    # Remove the data:image/jpeg;base64, prefix if present
    if base64_image.startswith('data:image'):
        base64_image = base64_image.split(',')[1]
    
    # Decode base64 image
    image_data = base64.b64decode(base64_image)
    image = Image.open(io.BytesIO(image_data))
    return image

def process_file(file):
    """Process uploaded file and return appropriate format for Gemini."""
    filename = secure_filename(file.filename)
    file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    # Read file content
    file_content = file.read()
    file.seek(0)  # Reset file pointer
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(filename)
    if not mime_type:
        # Fallback MIME type detection
        if file_extension in {'jpg', 'jpeg'}:
            mime_type = 'image/jpeg'
        elif file_extension == 'png':
            mime_type = 'image/png'
        elif file_extension == 'pdf':
            mime_type = 'application/pdf'
        elif file_extension in {'mp3'}:
            mime_type = 'audio/mpeg'
        elif file_extension == 'mp4':
            mime_type = 'video/mp4'
        else:
            mime_type = 'application/octet-stream'
    
    print(f"Processing file: {filename}, MIME type: {mime_type}")
    
    # For images, convert to PIL Image
    if mime_type.startswith('image/'):
        try:
            image = Image.open(io.BytesIO(file_content))
            return image
        except Exception as e:
            print(f"Error processing image file: {str(e)}")
            raise
    
    # For other file types, use Gemini's file upload
    try:
        # Upload file to Gemini
        temp_file = genai.upload_file(file, mime_type=mime_type)
        return temp_file
    except Exception as e:
        print(f"Error uploading file to Gemini: {str(e)}")
        raise

@app.route('/api/chat', methods=['POST'])
def chat():
    # Check if request contains files
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        # Handle file upload request
        user_input = request.form.get('message', '')
        session_id = request.form.get('session_id', 'default')
        uploaded_file = request.files.get('file')
        
        print(f"File upload request - Session: {session_id}, Message: {user_input}")
        print(f"Has file: {bool(uploaded_file)}")
        
        # Get or create session
        session = get_or_create_session(session_id)
        chat_session = session['chat']
        
        try:
            # Prepare the content for the message
            content = [user_input] if user_input else ["Please analyze this file."]
            
            # If there's a file, process it
            if uploaded_file and uploaded_file.filename:
                if not allowed_file(uploaded_file.filename):
                    return jsonify({'error': 'File type not supported'}), 400
                
                try:
                    processed_file = process_file(uploaded_file)
                    content.append(processed_file)
                    print("File processed successfully")
                except Exception as e:
                    print(f"Error processing file: {str(e)}")
                    return jsonify({'error': f'Error processing file: {str(e)}'}), 400
            
            # Send the message
            response = chat_session.send_message(content)
            session['message_count'] += 1
            
            # Log session info periodically
            if session['message_count'] % 5 == 0:
                log_session_info()
            
            return jsonify({'response': response.text})
        except Exception as e:
            print(f"Error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    else:
        # Handle JSON request (existing functionality for base64 images)
        data = request.json
        user_input = data.get('message')
        session_id = data.get('session_id', 'default')
        image_data = data.get('image')
        
        print(f"JSON request - Session: {session_id}, Message: {user_input}")
        print(f"Has image: {bool(image_data)}")
        
        # Get or create session
        session = get_or_create_session(session_id)
        chat_session = session['chat']
        
        try:
            # Prepare the content for the message
            content = [user_input]
            
            # If there's an image, add it to the content
            if image_data:
                try:
                    image = process_image(image_data)
                    content.append(image)
                    print("Image processed successfully")
                except Exception as e:
                    print(f"Error processing image: {str(e)}")
                    return jsonify({'error': f'Error processing image: {str(e)}'}), 400
            
            # Send the message (with or without image)
            response = chat_session.send_message(content)
            session['message_count'] += 1
            
            # Log session info periodically
            if session['message_count'] % 5 == 0:
                log_session_info()
            
            return jsonify({'response': response.text})
        except Exception as e:
            print(f"Error: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/new-chat', methods=['POST'])
def new_chat():
    """Create a new chat session."""
    try:
        # Generate a new session ID
        new_session_id = f"session-{datetime.now().timestamp()}"
        
        # Create new session
        sessions[new_session_id] = {
            'chat': model.start_chat(history=[]),
            'created_at': datetime.now(),
            'message_count': 0
        }
        
        print(f"Created new chat session: {new_session_id}")
        return jsonify({
            'session_id': new_session_id,
            'status': 'created'
        })
    except Exception as e:
        print(f"Error creating new chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session-info/<session_id>', methods=['GET'])
def get_session_info(session_id):
    """Get information about a specific session."""
    if session_id in sessions:
        session = sessions[session_id]
        return jsonify({
            'session_id': session_id,
            'message_count': session['message_count'],
            'created_at': session['created_at'].isoformat(),
            'exists': True
        })
    else:
        return jsonify({
            'session_id': session_id,
            'exists': False
        })

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    """List all active sessions."""
    session_list = []
    for sid, session in sessions.items():
        session_list.append({
            'session_id': sid,
            'message_count': session['message_count'],
            'created_at': session['created_at'].isoformat()
        })
    
    # Sort by creation time (newest first)
    session_list.sort(key=lambda s: s['created_at'], reverse=True)
    
    return jsonify({
        'sessions': session_list,
        'total_sessions': len(sessions)
    })

@app.route('/api/cleanup-sessions', methods=['POST'])
def cleanup_sessions():
    """Clean up old sessions (older than SESSION_TIMEOUT_HOURS)."""
    try:
        from datetime import timedelta
        
        cutoff_time = datetime.now() - timedelta(hours=SESSION_TIMEOUT_HOURS)
        sessions_to_remove = []
        
        for sid, session in sessions.items():
            if session['created_at'] < cutoff_time:
                sessions_to_remove.append(sid)
        
        for sid in sessions_to_remove:
            del sessions[sid]
        
        print(f"Cleaned up {len(sessions_to_remove)} old sessions")
        return jsonify({
            'cleaned_up': len(sessions_to_remove),
            'remaining_sessions': len(sessions)
        })
    except Exception as e:
        print(f"Error cleaning up sessions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/supported-formats', methods=['GET'])
def get_supported_formats():
    """Return list of supported file formats."""
    return jsonify({
        'image_formats': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
        'document_formats': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'csv', 'tsv', 'html', 'htm'],
        'audio_formats': ['mp3', 'wav', 'aiff', 'aac', 'ogg', 'flac', 'm4a', 'wma'],
        'video_formats': ['mp4', 'mov', 'avi', 'flv', 'mpg', 'mpeg', 'wmv', 'webm', 'mkv', '3gp'],
        'max_file_size': f'{MAX_SIZE / (1024*1024):.0f}MB'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        'status': 'healthy',
        'active_sessions': len(sessions),
        'model': model._model_name,
        'timestamp': datetime.now().isoformat()
    })

# Serve frontend files (catch-all route should be last)
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_frontend(path):
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # Return index.html for client-side routing
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    # Print startup information
    print("Starting AI Chat Server...")
    print(f"Using Gemini model: {model._model_name}")
    print(f"Frontend folder: {app.static_folder}")
    print(f"Max file size: {MAX_SIZE / (1024*1024):.0f}MB")
    
    # Clean up sessions on startup (optional)
    print("Starting with clean session state...")
    
    # Get port from environment or default to 5000
    port = int(os.getenv('PORT', 5000))
    app.run(debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true', port=port, host='0.0.0.0')