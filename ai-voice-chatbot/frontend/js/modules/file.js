import { Config } from '../config.js';

export class FileManager {
  constructor(state) {
    this.state = state;
    this.elements = {};
  }

  init() {
    this.elements = {
      fileButton: document.getElementById('file-button'),
      fileInput: document.getElementById('file-input'),
      dropZone: document.getElementById('file-drop-zone'),
      preview: document.getElementById('file-preview'),
      icon: document.getElementById('file-icon'),
      name: document.getElementById('file-name'),
      size: document.getElementById('file-size'),
      removeBtn: document.getElementById('file-remove')
    };

    this.validateElements();
    this.setupEventListeners();
  }

  validateElements() {
    const required = ['fileButton', 'fileInput', 'dropZone'];
    const missing = required.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      throw new Error(`File elements not found: ${missing.join(', ')}`);
    }
  }

  setupEventListeners() {
    // File button click
    this.elements.fileButton.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    // File selection
    this.elements.fileInput.addEventListener('change', (e) => {
      this.handleFileSelection(e);
    });

    // Drag and drop
    this.elements.dropZone.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.dropZone.classList.add('dragover');
    });

    this.elements.dropZone.addEventListener('dragleave', () => {
      this.elements.dropZone.classList.remove('dragover');
    });

    this.elements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elements.dropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.selectFile(files[0]);
      }
    });

    // Remove file
    if (this.elements.removeBtn) {
      this.elements.removeBtn.addEventListener('click', () => {
        this.removeFile();
      });
    }
  }

  handleFileSelection(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  selectFile(file) {
    if (file.size > Config.fileUpload.maxSize) {
      this.showIndicator('File size must be less than 50MB', 'error');
      return;
    }

    this.state.selectedFile = file;
    this.updateFilePreview(file);
    this.showIndicator(`File selected: ${file.name}`, 'success');
  }

  updateFilePreview(file) {
    if (!this.elements.preview) return;

    this.elements.preview.classList.add('show');
    
    if (this.elements.name) this.elements.name.textContent = file.name;
    if (this.elements.size) this.elements.size.textContent = this.formatFileSize(file.size);
    
    // Update icon based on file type
    if (this.elements.icon) {
      const icon = this.getFileIcon(file);
      this.elements.icon.textContent = icon;
    }
  }

  getFileIcon(file) {
    const fileType = file.type.split('/')[0];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (fileType === 'image') return '🖼️';
    if (fileType === 'video') return '🎥';
    if (fileType === 'audio') return '🎵';
    if (extension === 'pdf') return '📄';
    if (['doc', 'docx'].includes(extension)) return '📝';
    return '📁';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile() {
    this.state.selectedFile = null;
    if (this.elements.preview) this.elements.preview.classList.remove('show');
    this.elements.fileInput.value = '';
    this.showIndicator('File removed', 'info');
  }

  getSelectedFile() {
    return this.state.selectedFile;
  }

  hasSelectedFile() {
    return this.state.selectedFile !== null;
  }

  showIndicator(message, type) {
    const event = new CustomEvent('showIndicator', {
      detail: { message, type }
    });
    document.dispatchEvent(event);
  }
}