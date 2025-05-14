import { ParticleManager } from './modules/particles.js';
import { SidebarManager } from './modules/sidebar.js';
import { TabManager } from './modules/tabs.js';
import { ChatManager } from './modules/chat.js';
import { CameraManager } from './modules/camera.js';
import { SketchManager } from './modules/sketch.js';
import { FileManager } from './modules/file.js';
import { VoiceManager } from './modules/voice.js';
import { ModalManager } from './modules/modal.js';
import { IndicatorManager } from './modules/indicator.js';
import { Config } from './config.js';

class App {
  constructor() {
    this.state = Config.initialState;
    this.managers = {};
    this.initialized = false;
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
      this.managers.voice = new VoiceManager(this.state);
      this.managers.modal = new ModalManager();
      this.managers.indicator = new IndicatorManager();
      this.managers.chat = new ChatManager(this.state, this.managers);

      // Start initialization
      await this.managers.particles.init();
      this.managers.sidebar.init();
      this.managers.tabs.init();
      this.managers.camera.init();
      await this.managers.sketch.init();
      this.managers.file.init();
      await this.managers.voice.init();
      this.managers.modal.init();
      this.managers.indicator.init();
      this.managers.chat.init();

      this.setupEventListeners();
      this.initialized = true;

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
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
  }

  cleanup() {
    // Clean up all managers
    Object.values(this.managers).forEach(manager => {
      if (manager.cleanup) {
        manager.cleanup();
      }
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();
});

export default App;