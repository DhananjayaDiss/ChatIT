export class ModalManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.elements = {
      modal: document.getElementById('imageModal'),
      modalImage: document.getElementById('modalImage'),
      closeBtn: document.getElementsByClassName('close')[0]
    };

    this.validateElements();
    this.setupEventListeners();
  }

  validateElements() {
    const required = ['modal', 'modalImage', 'closeBtn'];
    const missing = required.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      console.warn(`Modal elements not found: ${missing.join(', ')}`);
    }
  }

  setupEventListeners() {
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === this.elements.modal) {
        this.close();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  show(imageSrc) {
    if (!this.elements.modal || !this.elements.modalImage) return;

    this.elements.modalImage.src = imageSrc;
    this.elements.modal.style.display = 'block';
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.elements.modal) return;

    this.elements.modal.style.display = 'none';
    this.elements.modalImage.src = '';
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  isOpen() {
    return this.elements.modal && this.elements.modal.style.display === 'block';
  }
}