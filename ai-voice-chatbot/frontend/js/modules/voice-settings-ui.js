// Create a voice settings component to let users choose voices
export class VoiceSettingsUI {
  constructor(voiceManager) {
    this.voiceManager = voiceManager;
    this.settingsContainer = null;
    this.voiceSelector = null;
    this.initialized = false;
  }

  init() {
    this.createSettingsUI();
    this.initEventListeners();
    this.initialized = true;
  }

  createSettingsUI() {
    // Create container for voice settings
    this.settingsContainer = document.createElement('div');
    this.settingsContainer.className = 'voice-settings';
    this.settingsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 15px;
      z-index: 100;
      display: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    `;

    // Create voice selector
    const selectorContainer = document.createElement('div');
    selectorContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    const label = document.createElement('label');
    label.textContent = 'Select Voice:';
    label.style.cssText = `
      color: white;
      font-size: 14px;
      font-weight: 600;
    `;

    this.voiceSelector = document.createElement('select');
    this.voiceSelector.className = 'voice-selector';
    this.voiceSelector.style.cssText = `
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.8);
      color: black;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      outline: none;
      font-size: 14px;
      width: 200px;
    `;

    selectorContainer.appendChild(label);
    selectorContainer.appendChild(this.voiceSelector);
    this.settingsContainer.appendChild(selectorContainer);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'voice-settings-close';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    `;
    closeButton.onclick = () => this.toggle();
    this.settingsContainer.appendChild(closeButton);

    // Add settings button to main UI
    this.settingsButton = document.createElement('button');
    this.settingsButton.className = 'voice-settings-button';
    this.settingsButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;
    this.settingsButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 99;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    `;
    this.settingsButton.onclick = () => this.toggle();

    // Append to body
    document.body.appendChild(this.settingsButton);
    document.body.appendChild(this.settingsContainer);
  }

  initEventListeners() {
    // Voice selection change
    this.voiceSelector.addEventListener('change', () => {
      const selectedVoiceId = this.voiceSelector.value;
      const selectedVoice = this.voiceManager.elevenlabsVoices.find(v => v.voice_id === selectedVoiceId);
      if (selectedVoice) {
        this.voiceManager.selectedVoice = selectedVoice;
        this.showNotification(`Voice set to ${selectedVoice.name}`);
      }
    });
  }

  populateVoices() {
    if (!this.voiceManager.elevenlabsVoices || this.voiceManager.elevenlabsVoices.length === 0) {
      this.settingsButton.style.display = 'none';
      return;
    }

    // Clear existing options
    this.voiceSelector.innerHTML = '';

    // Add voice options
    this.voiceManager.elevenlabsVoices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voice_id;
      option.textContent = voice.name;
      
      // Set as selected if it's the current voice
      if (this.voiceManager.selectedVoice && voice.voice_id === this.voiceManager.selectedVoice.voice_id) {
        option.selected = true;
      }
      
      this.voiceSelector.appendChild(option);
    });

    // Show settings button
    this.settingsButton.style.display = 'flex';
  }

  toggle() {
    const isVisible = this.settingsContainer.style.display === 'block';
    
    if (isVisible) {
      this.settingsContainer.style.display = 'none';
    } else {
      this.populateVoices();
      this.settingsContainer.style.display = 'block';
    }
  }

  showNotification(message) {
    const event = new CustomEvent('showIndicator', {
      detail: { message, type: 'success' }
    });
    document.dispatchEvent(event);
  }
}