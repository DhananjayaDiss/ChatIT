export const Config = {
  // Initial application state
  initialState: {
    activeTab: 'camera',
    isListening: false,
    isDrawing: false,
    currentTool: 'pen',
    currentColor: '#000000',
    currentBrushSize: 5,
    lastX: 0,
    lastY: 0,
    cameraStream: null,
    cameraEnabled: false,
    recognition: null,
    silenceTimer: null,
    activeSpeech: null,
    blankCanvasData: null,
    selectedFile: null,
    isSketchExpanded: false,
    isDrawingShape: false,
    startX: 0,
    startY: 0,
    currentSessionId: 'session-' + Date.now(),
    indicatorTimeout: null
  },

  // Camera configuration
  camera: {
    constraints: {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    },
    captureQuality: 0.8
  },

  // Speech recognition configuration
  speech: {
    lang: 'en-US',
    continuous: true,
    interimResults: true
  },

  // File upload configuration
  fileUpload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    acceptedTypes: {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'csv', 'html', 'htm'],
      audio: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'],
      video: ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp']
    }
  },

  // Drawing tools configuration
  drawing: {
    tools: ['pen', 'eraser', 'line', 'rectangle', 'circle', 'arrow'],
    colors: ['#000000', '#FF3B30', '#FF9500', '#4CD964', '#007AFF', '#5856D6'],
    sizes: [1, 2, 5, 10, 15, 20],
    defaultTool: 'pen',
    defaultColor: '#000000',
    defaultSize: 5
  },

  // UI animations
  animations: {
    messageSlide: 'cubic-bezier(0.4, 0, 0.2, 1)',
    tabSlider: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fadeInDuration: 0.5,
    scaleInDuration: 0.3
  },

  // API endpoints - Update these for production
  api: {
    chat: '/api/chat',
    newChat: '/api/new-chat',
    sessionInfo: '/api/session-info',
    sessions: '/api/sessions',
    cleanupSessions: '/api/cleanup-sessions',
    supportedFormats: '/api/supported-formats',
    health: '/health'
  },

  // Particles configuration
  particles: {
    count: 15,
    sizeRange: { min: 2, max: 6 },
    animationDuration: { min: 4, max: 8 }
  }
};