import { Config } from '../config.js';

export class VoiceManager {
  constructor(state) {
    this.state = state;
    this.elements = {};
    this.speechSynthesis = null;
  }

  async init() {
    this.elements = {
      micButton: document.getElementById('mic-button'),
      userInput: document.getElementById('user-input')
    };

    this.validateElements();
    this.setupSpeechRecognition();
    this.setupSpeechSynthesis();
    this.setupEventListeners();
  }

  validateElements() {
    const required = ['micButton', 'userInput'];
    const missing = required.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      throw new Error(`Voice elements not found: ${missing.join(', ')}`);
    }
  }

  setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      this.elements.micButton.style.display = 'none';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.state.recognition = new SpeechRecognition();
    
    Object.assign(this.state.recognition, Config.speech);

    this.state.recognition.onstart = () => {
      this.state.isListening = true;
      this.elements.micButton.classList.add('listening');
      this.elements.userInput.placeholder = 'Voice scanning...';
      this.showIndicator('🎙️ Listening...', 'info');
    };

    this.state.recognition.onend = () => {
      this.state.isListening = false;
      this.elements.micButton.classList.remove('listening');
      this.elements.userInput.placeholder = 'Type your message...';
      this.hideIndicator();
    };

    this.state.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimTranscript.trim()) {
        this.showIndicator(`🎙️ "${interimTranscript.trim()}"`, 'info');
      }
      
      if (finalTranscript) {
        this.elements.userInput.value = finalTranscript;
        this.state.recognition.stop();
        setTimeout(() => {
          const event = new CustomEvent('sendMessage', {
            detail: { manualCapture: false }
          });
          document.dispatchEvent(event);
        }, 100);
      }
    };

    this.state.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.showIndicator('Speech recognition error', 'error');
      this.state.isListening = false;
      this.elements.micButton.classList.remove('listening');
      this.elements.userInput.placeholder = 'Type your message...';
    };
  }

  setupSpeechSynthesis() {
    this.speechSynthesis = window.speechSynthesis;
  }

  setupEventListeners() {
    this.elements.micButton.addEventListener('click', () => {
      this.toggleListening();
    });
  }

  toggleListening() {
    if (!this.state.recognition) return;

    if (this.state.isListening) {
      this.state.recognition.stop();
    } else {
      this.state.recognition.start();
    }
  }

  speakText(text, button) {
    if (this.state.activeSpeech) {
      this.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      if (button) button.classList.add('playing');
      this.state.activeSpeech = utterance;
    };

    utterance.onend = () => {
      if (button) button.classList.remove('playing');
      this.state.activeSpeech = null;
    };

    this.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    this.speechSynthesis.cancel();
    document.querySelectorAll('.voice-control-btn.playing').forEach(btn => {
      btn.classList.remove('playing');
    });
    this.state.activeSpeech = null;
  }

  showIndicator(message, type) {
    const event = new CustomEvent('showIndicator', {
      detail: { message, type }
    });
    document.dispatchEvent(event);
  }

  hideIndicator() {
    const event = new CustomEvent('hideIndicator');
    document.dispatchEvent(event);
  }

  cleanup() {
    if (this.state.recognition) {
      this.state.recognition.stop();
    }
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }
}