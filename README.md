# AI Multimodal Chat Application for Education using Gemini 2.0 flash API and ElevenLabs API

A modern, interactive AI chatbot with voice recognition, file upload, drawing capabilities, and camera integration. Built with Flask backend and vanilla JavaScript frontend.

## Features

- 🎤 **Voice Recognition**: Speak to the AI using voice commands
- 🎨 **Drawing Tools**: Sketch and draw diagrams that the AI can analyze
- 📸 **Camera Integration**: Auto-capture images from your camera
- 📁 **File Upload**: Support for images, documents, audio, and video files
- 💬 **Multi-modal Chat**: Text, voice, images, and files in one conversation
- 🎯 **Session Management**: Persistent conversations with session tracking
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Google API Key for Gemini AI
- Modern web browser with camera/microphone permissions

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-voice-chatbot.git
cd ai-voice-chatbot
```

2. **Run the setup script**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **Configure environment**
```bash
# Edit backend/.env and add your Google API key
nano backend/.env
```

4. **Start the application**
```bash
cd backend
source venv/bin/activate
python app.py
```

5. **Open in browser**
```
http://localhost:5000
```

## Project Structure

```
ai-voice-chatbot/
├── backend/              # Flask application
│   ├── app.py           # Main application file
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── frontend/            # Static files served by Flask
│   ├── index.html      # Main HTML file
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript modules
├── scripts/            # Deployment scripts
├── Dockerfile         # Docker configuration
└── docker-compose.yml # Docker Compose setup
```

## Configuration

### Environment Variables

Create `backend/.env` with:
```env
GOOGLE_API_KEY=your_google_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here
```

### Frontend Configuration

Update `frontend/js/config.js` for custom settings:
- API endpoints
- File upload limits
- Drawing tools
- Camera settings

## Deployment

### Local Development
```bash
# Development server with auto-reload
cd backend
python app.py
```

### Production with Gunicorn
```bash
# Production deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## API Endpoints

- `POST /api/chat` - Send message with optional files/images
- `POST /api/new-chat` - Create new chat session
- `GET /api/sessions` - List active sessions
- `GET /api/supported-formats` - Get supported file types
- `GET /health` - Health check endpoint

## Browser Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- Camera/microphone permissions for full functionality
- JavaScript enabled
- LocalStorage support for session management

## Development

### Adding New Features

1. Create new module in `frontend/js/modules/`
2. Initialize in `frontend/js/main.js`
3. Add configuration in `frontend/js/config.js`
4. Update backend endpoints in `backend/app.py`

### Code Structure

- **Modular Frontend**: Each feature is a separate module
- **Event-Driven**: Modules communicate via custom events
- **Configuration-Driven**: Settings in `config.js`
- **Session Management**: Persistent chat sessions

## Troubleshooting

### Common Issues

1. **Camera not working**: Ensure HTTPS or localhost, check permissions
2. **Voice recognition fails**: Use supported browsers (Chrome recommended)
3. **File upload errors**: Check file size limits and supported formats
4. **API errors**: Verify Google API key and internet connection

### Debug Mode

Set `FLASK_DEBUG=True` in `.env` for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Acknowledgments

- Google Gemini AI for natural language processing
- Flask for the backend framework
- Modern browser APIs for multimedia features
