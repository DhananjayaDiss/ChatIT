#!/bin/bash
# Setup script for AI Voice Chatbot

set -e

echo "🚀 Setting up AI Voice Chatbot..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
cd backend
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "❗ Please edit backend/.env and add your GOOGLE_API_KEY"
fi

# Create frontend directory if it doesn't exist
cd ..
if [ ! -d "frontend" ]; then
    echo "📁 Creating frontend directory..."
    mkdir -p frontend/css
    mkdir -p frontend/js/modules
fi

# Check for required files
echo "✅ Checking required files..."
required_files=(
    "frontend/index.html"
    "frontend/css/styles.css"
    "frontend/js/main.js"
    "frontend/js/config.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required files present!"
else
    echo "❌ Missing files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo "Please ensure all frontend files are in place."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your GOOGLE_API_KEY to backend/.env"
echo "2. Run: cd backend && source venv/bin/activate && python app.py"
echo "3. Open: http://localhost:5000"