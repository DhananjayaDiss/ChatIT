export class IndicatorManager {
  constructor() {
    this.elements = {};
    this.currentTimeout = null;
  }

  init() {
    this.elements = {
      indicator: document.getElementById('floating-indicator'),
      text: document.getElementById('indicator-text')
    };

    this.validateElements();
    this.setupEventListeners();
  }

  validateElements() {
    const required = ['indicator', 'text'];
    const missing = required.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      throw new Error(`Indicator elements not found: ${missing.join(', ')}`);
    }
  }

  setupEventListeners() {
    // Listen for show indicator events
    document.addEventListener('showIndicator', (event) => {
      const { message, type = 'info' } = event.detail;
      this.show(message, type);
    });

    // Listen for hide indicator events
    document.addEventListener('hideIndicator', () => {
      this.hide();
    });
  }

  show(message, type = 'info', duration = 3000) {
    if (!this.elements.indicator || !this.elements.text) return;

    // Clear any existing timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    // Update text and show
    this.elements.text.textContent = message;
    this.elements.indicator.classList.add('show');

    // Update color based on type
    this.updateColor(type);

    // Auto-hide after duration
    if (duration > 0) {
      this.currentTimeout = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  hide() {
    if (!this.elements.indicator) return;

    this.elements.indicator.classList.remove('show');
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  updateColor(type) {
    const colors = {
      success: 'rgba(76, 217, 100, 0.9)',
      error: 'rgba(255, 59, 48, 0.9)',
      warning: 'rgba(255, 149, 0, 0.9)',
      info: 'rgba(102, 126, 234, 0.9)'
    };

    const color = colors[type] || colors.info;
    this.elements.indicator.style.background = color;
  }

  isVisible() {
    return this.elements.indicator && this.elements.indicator.classList.contains('show');
  }

  cleanup() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
  }
}