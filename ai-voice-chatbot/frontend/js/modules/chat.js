import { Config } from '../config.js';

export class ChatManager {
  constructor(state, managers) {
    this.state = state;
    this.managers = managers;
    this.elements = {};
  }

  init() {
    this.elements = {
      chatMessages: document.getElementById('chat-messages'),
      userInput: document.getElementById('user-input'),
      sendButton: document.getElementById('send-button')
    };

    this.validateElements();
    this.setupEventListeners();
  }

  validateElements() {
    const required = ['chatMessages', 'userInput', 'sendButton'];
    const missing = required.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      throw new Error(`Chat elements not found: ${missing.join(', ')}`);
    }
  }

  setupEventListeners() {
    // Enter key to send message
    this.elements.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Show/hide send button based on input
    this.elements.userInput.addEventListener('input', () => {
      if (this.elements.userInput.value.trim()) {
        this.elements.sendButton.classList.add('show');
      } else {
        this.elements.sendButton.classList.remove('show');
      }
    });

    // Send button click
    this.elements.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Listen for sendMessage events from other modules
    document.addEventListener('sendMessage', (event) => {
      const { manualCapture, imageData, mediaType } = event.detail;
      this.sendMessage(manualCapture, imageData, mediaType);
    });

    // Setup voice controls for bot messages
    this.setupBotMessageControls();
  }

  sendMessage(isManualCapture = false, manualData = null, mediaType = null) {
    const message = this.elements.userInput.value.trim();
    
    // Check if we have something to send
    if (!message && !isManualCapture && !this.managers.file.hasSelectedFile()) {
      return;
    }

    // Handle file upload
    if (this.managers.file.hasSelectedFile()) {
      this.sendFileMessage(message);
      return;
    }

    // Get image data from camera or sketch
    let imageData = manualData;
    if (!isManualCapture) {
      // Auto-capture from camera if enabled
      if (this.managers.camera.isEnabled() && this.managers.tabs.getActiveTab() === 'camera') {
        imageData = this.managers.camera.capture();
        mediaType = 'camera';
      }
      
      // Auto-capture from sketch if not blank
      const sketchData = this.managers.sketch.getCanvasData();
      if (!imageData && sketchData) {
        imageData = sketchData;
        mediaType = 'sketch';
      }
    }

    this.displayUserMessage(message, imageData);
    this.clearInput();
    this.showThinking();

    // Prepare request data
    let requestMessage = message;
    if (!message && imageData) {
      requestMessage = mediaType === 'sketch' ? "Please analyze this sketch." : "Please analyze this image.";
    }

    const requestData = {
      message: requestMessage,
      session_id: this.state.currentSessionId
    };

    if (imageData) {
      requestData.image = imageData;
    }

    // Send to API
    this.sendToAPI(requestData);
  }

  sendFileMessage(message) {
    const formData = new FormData();
    formData.append('message', message || 'Please analyze this file.');
    formData.append('file', this.managers.file.getSelectedFile());
    formData.append('session_id', this.state.currentSessionId);

    this.displayUserMessage(message, null, this.managers.file.getSelectedFile());
    this.clearInput();
    this.showThinking('Analyzing file...');

    // Send to API
    this.sendToAPI(formData, true);
  }

  async sendToAPI(data, isFormData = false) {
    try {
      const options = {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data)
      };

      if (!isFormData) {
        options.headers = {
          'Content-Type': 'application/json'
        };
      }

      const response = await fetch(Config.api.chat, options);
      const result = await response.json();

      this.hideThinking();
      this.displayBotMessage(result);

      // Clear selected file if it was used
      if (isFormData && this.managers.file.hasSelectedFile()) {
        this.managers.file.removeFile();
      }
    } catch (error) {
      this.hideThinking();
      console.error('API Error:', error);
      this.managers.indicator.show('Connection error', 'error');
    }
  }

  displayUserMessage(message, imageData, file) {
    const messageElement = this.createMessageElement('user-message');
    
    if (message) {
      const textDiv = document.createElement('div');
      textDiv.textContent = message;
      messageElement.appendChild(textDiv);
    }
    
    if (imageData) {
      const imageElement = this.createImageElement(imageData);
      messageElement.appendChild(imageElement);
    }
    
    if (file) {
      const fileDiv = this.createFileElement(file);
      messageElement.appendChild(fileDiv);
    }
    
    this.elements.chatMessages.appendChild(messageElement);
    this.scrollToBottom();
  }

  displayBotMessage(data) {
    const messageElement = this.createMessageElement('bot-message');
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bot-message-content';
    
    if (data.error) {
      contentDiv.textContent = '❌ Error: ' + data.error;
    } else {
      contentDiv.innerHTML = this.formatBotMessage(data.response);
    }
    
    messageElement.appendChild(contentDiv);
    messageElement.appendChild(this.createVoiceControl(data.response));
    
    this.elements.chatMessages.appendChild(messageElement);
    this.scrollToBottom();
  }

  createMessageElement(className) {
    const element = document.createElement('div');
    element.className = className;
    return element;
  }

  createImageElement(imageData) {
    const imageElement = document.createElement('img');
    imageElement.src = imageData;
    imageElement.className = 'message-image';
    imageElement.onclick = () => {
      this.managers.modal.show(imageData);
    };
    return imageElement;
  }

  createFileElement(file) {
    const fileDiv = document.createElement('div');
    fileDiv.innerHTML = `📁 ${file.name} (${this.managers.file.formatFileSize(file.size)})`;
    fileDiv.style.marginTop = '0.5rem';
    fileDiv.style.fontSize = '0.9rem';
    fileDiv.style.opacity = '0.8';
    return fileDiv;
  }

  createVoiceControl(text) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'bot-message-controls';
    
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'voice-control-btn';
    voiceBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    voiceBtn.setAttribute('data-text', text);
    
    voiceBtn.addEventListener('click', function() {
      const text = this.getAttribute('data-text');
      if (this.classList.contains('playing')) {
        this.managers.voice.stopSpeaking();
      } else {
        this.managers.voice.speakText(text, this);
      }
    }.bind(this));
    
    controlsDiv.appendChild(voiceBtn);
    return controlsDiv;
  }

  formatBotMessage(text) {
    let formatted = text;
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  showThinking(message = 'Thinking...🤔') {
    const thinkingElement = this.createMessageElement('bot-message');
    thinkingElement.id = 'thinking';
    thinkingElement.innerHTML = `<div class="bot-message-content">${message}</div>`;
    this.elements.chatMessages.appendChild(thinkingElement);
    this.scrollToBottom();
  }

  hideThinking() {
    const thinkingElement = document.getElementById('thinking');
    if (thinkingElement) {
      thinkingElement.remove();
    }
  }

  clearInput() {
    this.elements.userInput.value = '';
    this.elements.sendButton.classList.remove('show');
  }

  scrollToBottom() {
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }

  setupBotMessageControls() {
    // This will be called after each bot message is added
    // Voice controls are set up in createVoiceControl method
  }
}