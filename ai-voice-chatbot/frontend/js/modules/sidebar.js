export class SidebarManager {
  constructor(state) {
    this.state = state;
    this.sidebar = null;
    this.sidebarToggle = null;
    this.newChatBtn = null;
    this.mainContent = null;
    this.chatMessages = null;
  }

  init() {
    this.sidebar = document.getElementById('sidebar');
    this.sidebarToggle = document.getElementById('sidebar-toggle');
    this.newChatBtn = document.getElementById('new-chat-btn');
    this.mainContent = document.querySelector('.main-content');
    this.chatMessages = document.getElementById('chat-messages');
    
    if (!this.sidebar || !this.sidebarToggle || !this.newChatBtn) {
      throw new Error('Sidebar elements not found');
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle sidebar
    this.sidebarToggle.addEventListener('click', () => {
      this.toggle();
    });

    // New chat button
    this.newChatBtn.addEventListener('click', () => {
      this.startNewChat();
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1200 && 
          this.sidebar.classList.contains('expanded') &&
          !this.sidebar.contains(e.target) &&
          !this.sidebarToggle.contains(e.target)) {
        this.close();
      }
    });
  }

  toggle() {
    this.sidebar.classList.toggle('expanded');
  }

  close() {
    this.sidebar.classList.remove('expanded');
  }

  startNewChat() {
    // Generate new session ID
    this.state.currentSessionId = 'session-' + Date.now();
    
    // Clear chat messages except welcome message
    this.chatMessages.innerHTML = `
      <div class="bot-message">
        <div class="bot-message-content">
          <strong>👋 Welcome!</strong><br>
          I'm your AI assistant with voice, vision, and file reading capabilities. 
          <br><br>• 💬 Chat with me normally<br>• 🎤 Click the mic to start/stop voice input<br>• 📸 Enable camera for auto-capture with messages<br>• 🎨 Draw sketches that auto-send with messages<br>• 📁 Upload any file (images, documents, audio, video)
        </div>
      </div>
    `;
    
    // Clear input
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    if (userInput) userInput.value = '';
    if (sendButton) sendButton.classList.remove('show');
    
    // Show indicator
    const event = new CustomEvent('showIndicator', {
      detail: { message: 'New chat started', type: 'success' }
    });
    document.dispatchEvent(event);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1200) {
      this.close();
    }
  }
}