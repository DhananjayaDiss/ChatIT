export class TabManager {
  constructor(state) {
    this.state = state;
    this.tabButtons = null;
    this.tabSlider = null;
    this.tabContents = null;
  }

  init() {
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabSlider = document.getElementById('tab-slider');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    if (!this.tabButtons.length || !this.tabSlider || !this.tabContents.length) {
      throw new Error('Tab elements not found');
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        this.switchToTab(button.dataset.tab, index);
      });
    });
  }

  switchToTab(tab, index) {
    // Update button states
    this.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.tabButtons[index].classList.add('active');
    
    // Move slider
    this.tabSlider.style.transform = `translateX(${index * 100}%)`;
    
    // Show/hide tab content
    this.tabContents.forEach(content => content.classList.remove('active'));
    const targetContent = document.getElementById(`${tab}-tab`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Update state
    this.state.activeTab = tab;
    
    // Emit tab change event
    const event = new CustomEvent('tabChanged', {
      detail: { tab, index }
    });
    document.dispatchEvent(event);
  }

  getActiveTab() {
    return this.state.activeTab;
  }
}