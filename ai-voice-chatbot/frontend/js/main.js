import { ParticleManager } from './modules/particles.js';
import { SidebarManager } from './modules/sidebar.js';
import { TabManager } from './modules/tabs.js';
import { ChatManager } from './modules/chat.js';
import { CameraManager } from './modules/camera.js';
import { SketchManager } from './modules/sketch.js';
import { FileManager } from './modules/file.js';
import { VoiceManager } from './modules/voice.js';
import { VoiceSettingsUI } from './modules/voice-settings-ui.js';
import { ModalManager } from './modules/modal.js';
import { IndicatorManager } from './modules/indicator.js';
import { Config } from './config.js';

class App {
  constructor() {
    this.state = Config.initialState;
    this.managers = {};
    this.initialized = false;
    this.voiceSettingsUI = null;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Initialize all managers
      this.managers.particles = new ParticleManager();
      this.managers.sidebar = new SidebarManager(this.state);
      this.managers.tabs = new TabManager(this.state);
      this.managers.camera = new CameraManager(this.state);
      this.managers.sketch = new SketchManager(this.state);
      this.managers.file = new FileManager(this.state);
      this.managers.modal = new ModalManager();
      this.managers.indicator = new IndicatorManager();
      
      // Initialize voice manager with ElevenLabs support
      this.managers.voice = new VoiceManager(this.state);
      
      // Initialize chat manager last since it depends on other managers
      this.managers.chat = new ChatManager(this.state, this.managers);

      // Start initialization
      await this.managers.particles.init();
      this.managers.sidebar.init();
      this.managers.tabs.init();
      this.managers.camera.init();
      await this.managers.sketch.init();
      this.managers.file.init();
      this.managers.modal.init();
      this.managers.indicator.init();
      
      // Initialize voice manager and voice settings UI if ElevenLabs is enabled
      await this.managers.voice.init();
      if (this.managers.voice.useElevenlabs) {
        this.voiceSettingsUI = new VoiceSettingsUI(this.managers.voice);
        this.voiceSettingsUI.init();
        
        // Wait for ElevenLabs voices to load, then populate the UI
        setTimeout(() => {
          if (this.voiceSettingsUI && this.managers.voice.elevenlabsVoices.length > 0) {
            this.voiceSettingsUI.populateVoices();
          }
        }, 1000);
      }
      
      // Initialize chat manager last
      this.managers.chat.init();

      this.setupEventListeners();
      this.initialized = true;

      console.log('App initialized successfully');
      this.showWelcomeMessage();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.managers.indicator.show('Failed to initialize app: ' + error.message, 'error');
    }
  }

  setupEventListeners() {
    // Global event listeners
    window.addEventListener('resize', () => {
      this.managers.sketch.handleResize();
    });

    // Handle unload to clean up resources
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Listen for global error events
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.managers.indicator.show('An error occurred: ' + event.error.message, 'error');
    });
    
    // Handle network status changes
    window.addEventListener('online', () => {
      this.managers.indicator.show('Back online', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.managers.indicator.show('Connection lost', 'error');
    });
  }

  showWelcomeMessage() {
    // Display welcome message with info about ElevenLabs if enabled
    let welcomeText = 'App initialized successfully!';
    
    if (this.managers.voice.useElevenlabs) {
      welcomeText += ' ElevenLabs voice synthesis enabled.';
      if (this.managers.voice.selectedVoice) {
        welcomeText += ` Default voice: ${this.managers.voice.selectedVoice.name}.`;
      }
    }
    
    this.managers.indicator.show(welcomeText, 'success');
  }

  cleanup() {
    // Clean up all managers
    Object.values(this.managers).forEach(manager => {
      if (manager && typeof manager.cleanup === 'function') {
        manager.cleanup();
      }
    });
    
    // Clean up any other resources
    if (this.state.activeSpeech) {
      this.managers.voice.stopSpeaking();
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();
});

export default App;