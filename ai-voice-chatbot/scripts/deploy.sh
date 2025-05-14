#!/bin/bash
# Production deployment script

set -e

echo "🚀 Deploying AI Voice Chatbot to production..."

# Set production environment
export FLASK_ENV=production
export FLASK_DEBUG=False

# Activate virtual environment
cd backend
source venv/bin/activate

# Install production dependencies
echo "📦 Installing production dependencies..."
pip install gunicorn

# Create logs directory
mkdir -p logs

# Create gunicorn configuration
cat > gunicorn.conf.py << EOF
# Gunicorn configuration file

# Workers
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100

# Binding
bind = "0.0.0.0:5000"

# Logging
errorlog = "logs/gunicorn_error.log"
accesslog = "logs/gunicorn_access.log"
loglevel = "info"

# Process naming
proc_name = "ai-voice-chatbot"

# Preload app for better performance
preload_app = True

# Timeout
timeout = 120
keepalive = 2
EOF

# Start the application with Gunicorn
echo "🚀 Starting application with Gunicorn..."
gunicorn -c gunicorn.conf.py app:app

echo "✅ Application deployed! Check logs/gunicorn_error.log for any issues."