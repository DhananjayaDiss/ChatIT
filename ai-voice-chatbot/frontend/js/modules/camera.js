import { Config } from '../config.js';

export class CameraManager {
  constructor(state) {
    this.state = state;
    this.elements = {};
  }

  init() {
    this.elements = {
      feed: document.getElementById('camera-feed'),
      placeholder: document.getElementById('camera-placeholder'),
      canvas: document.getElementById('camera-canvas'),
      enableBtn: document.getElementById('enable-camera'),
      disableBtn: document.getElementById('disable-camera'),
      captureBtn: document.getElementById('capture-button'),
      autoIndicator: document.getElementById('camera-auto-indicator')
    };

    this.validateElements();
    this.setupEventListeners();
  }

  validateElements() {
    const missing = Object.entries(this.elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      throw new Error(`Camera elements not found: ${missing.join(', ')}`);
    }
  }

  setupEventListeners() {
    this.elements.enableBtn.addEventListener('click', () => this.enable());
    this.elements.disableBtn.addEventListener('click', () => this.disable());
    this.elements.captureBtn.addEventListener('click', () => this.capture());
  }

  async enable() {
    try {
      this.showIndicator('Initializing camera...', 'info');
      
      const stream = await navigator.mediaDevices.getUserMedia(Config.camera.constraints);
      
      this.elements.feed.srcObject = stream;
      this.elements.feed.style.display = 'block';
      this.elements.placeholder.style.display = 'none';
      this.elements.enableBtn.style.display = 'none';
      this.elements.disableBtn.style.display = 'block';
      this.elements.captureBtn.style.display = 'block';
      this.elements.autoIndicator.classList.add('show');
      
      this.state.cameraStream = stream;
      this.state.cameraEnabled = true;
      
      this.showIndicator('Camera enabled! Auto-capture active', 'success');
    } catch (error) {
      console.error('Camera error:', error);
      this.showIndicator('Camera access denied', 'error');
    }
  }

  disable() {
    if (this.state.cameraStream) {
      this.state.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    this.elements.feed.style.display = 'none';
    this.elements.placeholder.style.display = 'flex';
    this.elements.enableBtn.style.display = 'block';
    this.elements.disableBtn.style.display = 'none';
    this.elements.captureBtn.style.display = 'none';
    this.elements.autoIndicator.classList.remove('show');
    
    this.state.cameraStream = null;
    this.state.cameraEnabled = false;
    
    this.showIndicator('Camera disabled', 'info');
  }

  capture() {
    if (!this.state.cameraEnabled || !this.state.cameraStream) {
      return null;
    }
    
    const canvas = this.elements.canvas;
    const video = this.elements.feed;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Flash effect
    video.style.filter = 'brightness(1.5)';
    setTimeout(() => video.style.filter = 'brightness(1)', 200);
    
    return canvas.toDataURL('image/jpeg', Config.camera.captureQuality);
  }

  isEnabled() {
    return this.state.cameraEnabled;
  }

  showIndicator(message, type) {
    const event = new CustomEvent('showIndicator', {
      detail: { message, type }
    });
    document.dispatchEvent(event);
  }

  cleanup() {
    if (this.state.cameraStream) {
      this.state.cameraStream.getTracks().forEach(track => track.stop());
    }
  }
}