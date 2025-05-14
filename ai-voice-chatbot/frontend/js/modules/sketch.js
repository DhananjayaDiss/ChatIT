  import { Config } from '../config.js';

  export class SketchManager {
    constructor(state) {
      this.state = state;
      this.elements = {};
      this.ctx = null;
      this.shapeCtx = null;
    }

    async init() {
      this.elements = {
        expandBtn: document.getElementById('expand-sketch'),
        expandText: document.getElementById('expand-text'),
        mainContainer: document.getElementById('main-container'),
        canvasContainer: document.getElementById('sketch-canvas-container'),
        canvas: document.getElementById('sketch-canvas'),
        shapeOverlay: document.getElementById('shape-overlay'),
        toolButtons: document.querySelectorAll('[data-tool]'),
        colorOptions: document.querySelectorAll('.color-option'),
        sizeOptions: document.querySelectorAll('.size-option'),
        clearBtn: document.getElementById('clear-sketch'),
        sendBtn: document.getElementById('send-sketch'),
        autoIndicator: document.getElementById('sketch-auto-indicator')
      };

      this.validateElements();
      this.initCanvases();
      this.setupEventListeners();
      this.setupDrawingEvents();
      this.initCanvas();
    }

    validateElements() {
      const required = ['expandBtn', 'canvas', 'shapeOverlay'];
      const missing = required.filter(key => !this.elements[key]);
      
      if (missing.length > 0) {
        throw new Error(`Sketch elements not found: ${missing.join(', ')}`);
      }
    }

    initCanvases() {
      this.ctx = this.elements.canvas.getContext('2d');
      this.shapeCtx = this.elements.shapeOverlay.getContext('2d');
      
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        this.handleResize();
      });
    }

    setupEventListeners() {
      // Expand/collapse sketch
      this.elements.expandBtn.addEventListener('click', () => {
        this.toggleExpansion();
      });

      // Tool selection
      this.elements.toolButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.selectTool(button);
        });
      });

      // Color selection
      this.elements.colorOptions.forEach(option => {
        option.addEventListener('click', () => {
          this.selectColor(option);
        });
      });

      // Size selection
      this.elements.sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
          this.selectSize(option);
        });
      });

      // Clear canvas
      this.elements.clearBtn.addEventListener('click', () => {
        this.clear();
      });

      // Send sketch
      this.elements.sendBtn.addEventListener('click', () => {
        this.sendSketch();
      });
    }

    setupDrawingEvents() {
      // Mouse events
      this.elements.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
      this.elements.canvas.addEventListener('mousemove', (e) => this.draw(e));
      this.elements.canvas.addEventListener('mouseup', () => this.stopDrawing());
      this.elements.canvas.addEventListener('mouseout', () => this.stopDrawing());

      // Touch events
      this.elements.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        this.elements.canvas.dispatchEvent(mouseEvent);
      });

      this.elements.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        this.elements.canvas.dispatchEvent(mouseEvent);
      });

      this.elements.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup');
        this.elements.canvas.dispatchEvent(mouseEvent);
      });
    }

    initCanvas() {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
      this.state.blankCanvasData = this.elements.canvas.toDataURL();
      this.elements.autoIndicator.classList.add('show');
      this.updateCursor();
    }

    toggleExpansion() {
      this.state.isSketchExpanded = !this.state.isSketchExpanded;
      
      if (this.state.isSketchExpanded) {
        this.elements.mainContainer.classList.add('expanded-sketch');
        this.elements.expandBtn.classList.add('expanded');
        this.elements.expandText.textContent = 'Exit Expanded';
        this.showIndicator('Sketch canvas expanded', 'success');
      } else {
        this.elements.mainContainer.classList.remove('expanded-sketch');
        this.elements.expandBtn.classList.remove('expanded');
        this.elements.expandText.textContent = 'Expand Sketch';
        this.showIndicator('Sketch canvas restored', 'info');
      }
      
      setTimeout(() => {
        this.handleResize();
      }, 300);
    }

    selectTool(button) {
      this.elements.toolButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      this.state.currentTool = button.dataset.tool;
      this.updateCursor();
    }

    selectColor(option) {
      this.elements.colorOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      this.state.currentColor = option.dataset.color;
    }

    selectSize(option) {
      this.elements.sizeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      this.state.currentBrushSize = parseInt(option.dataset.size);
    }

    updateCursor() {
      const cursor = {
        'eraser': 'grab',
        'line': 'crosshair',
        'rectangle': 'crosshair',
        'circle': 'crosshair',
        'arrow': 'crosshair'
      }[this.state.currentTool] || 'crosshair';
      
      this.elements.canvas.style.cursor = cursor;
    }

    getCanvasPos(e) {
      const rect = this.elements.canvas.getBoundingClientRect();
      const scaleX = this.elements.canvas.width / rect.width;
      const scaleY = this.elements.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    startDrawing(e) {
      const pos = this.getCanvasPos(e);
      
      if (['line', 'rectangle', 'circle', 'arrow'].includes(this.state.currentTool)) {
        this.state.isDrawingShape = true;
        this.state.startX = pos.x;
        this.state.startY = pos.y;
      } else {
        this.state.isDrawing = true;
        this.state.lastX = pos.x;
        this.state.lastY = pos.y;
        
        this.setupContextForDrawing();
        this.ctx.beginPath();
        this.ctx.moveTo(this.state.lastX, this.state.lastY);
      }
    }

    setupContextForDrawing() {
      this.ctx.strokeStyle = this.state.currentColor;
      this.ctx.lineWidth = this.state.currentBrushSize;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      if (this.state.currentTool === 'eraser') {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = this.state.currentBrushSize * 2;
      } else {
        this.ctx.globalCompositeOperation = 'source-over';
      }
    }

    draw(e) {
      const pos = this.getCanvasPos(e);
      
      if (this.state.isDrawingShape) {
        // Only draw if canvas has valid dimensions
        if (this.elements.shapeOverlay.width > 0 && this.elements.shapeOverlay.height > 0) {
          this.drawShape(pos);
        }
      } else if (this.state.isDrawing) {
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.state.lastX = pos.x;
        this.state.lastY = pos.y;
      }
    }

    drawShape(pos) {
      // Clear shape overlay and redraw
      this.shapeCtx.clearRect(0, 0, this.elements.shapeOverlay.width, this.elements.shapeOverlay.height);
      this.shapeCtx.strokeStyle = this.state.currentColor;
      this.shapeCtx.lineWidth = this.state.currentBrushSize;
      this.shapeCtx.lineCap = 'round';
      this.shapeCtx.lineJoin = 'round';
      
      const width = pos.x - this.state.startX;
      const height = pos.y - this.state.startY;
      
      switch (this.state.currentTool) {
        case 'line':
          this.shapeCtx.beginPath();
          this.shapeCtx.moveTo(this.state.startX, this.state.startY);
          this.shapeCtx.lineTo(pos.x, pos.y);
          this.shapeCtx.stroke();
          break;
          
        case 'rectangle':
          this.shapeCtx.beginPath();
          this.shapeCtx.rect(this.state.startX, this.state.startY, width, height);
          this.shapeCtx.stroke();
          break;
          
        case 'circle':
          const radius = Math.sqrt(width * width + height * height);
          this.shapeCtx.beginPath();
          this.shapeCtx.arc(this.state.startX, this.state.startY, radius, 0, 2 * Math.PI);
          this.shapeCtx.stroke();
          break;
          
        case 'arrow':
          this.shapeCtx.beginPath();
          this.shapeCtx.moveTo(this.state.startX, this.state.startY);
          this.shapeCtx.lineTo(pos.x, pos.y);
          
          // Draw arrow head
          const angle = Math.atan2(pos.y - this.state.startY, pos.x - this.state.startX);
          const arrowLength = 20;
          const arrowWidth = Math.PI / 6;
          
          this.shapeCtx.lineTo(
            pos.x - arrowLength * Math.cos(angle - arrowWidth),
            pos.y - arrowLength * Math.sin(angle - arrowWidth)
          );
          this.shapeCtx.moveTo(pos.x, pos.y);
          this.shapeCtx.lineTo(
            pos.x - arrowLength * Math.cos(angle + arrowWidth),
            pos.y - arrowLength * Math.sin(angle + arrowWidth)
          );
          this.shapeCtx.stroke();
          break;
      }
    }

    stopDrawing() {
      if (this.state.isDrawingShape) {
        // Check if canvas dimensions are valid before drawing
        if (this.elements.shapeOverlay.width > 0 && this.elements.shapeOverlay.height > 0) {
          this.ctx.drawImage(this.elements.shapeOverlay, 0, 0);
        }
        this.shapeCtx.clearRect(0, 0, this.elements.shapeOverlay.width, this.elements.shapeOverlay.height);
        this.state.isDrawingShape = false;
      }
      this.state.isDrawing = false;
    }

    clear() {
      // Only clear if canvas dimensions are valid
      if (this.elements.canvas.width > 0 && this.elements.canvas.height > 0) {
        this.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        this.state.blankCanvasData = this.elements.canvas.toDataURL();
      }
      
      if (this.elements.shapeOverlay.width > 0 && this.elements.shapeOverlay.height > 0) {
        this.shapeCtx.clearRect(0, 0, this.elements.shapeOverlay.width, this.elements.shapeOverlay.height);
      }
      
      this.showIndicator('Canvas cleared!', 'success');
    }

    sendSketch() {
      const imageData = this.elements.canvas.toDataURL('image/png');
      const event = new CustomEvent('sendMessage', {
        detail: { 
          manualCapture: true,
          imageData,
          mediaType: 'sketch'
        }
      });
      document.dispatchEvent(event);
    }

    handleResize() {
      const container = this.elements.canvasContainer;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      
      // Only set dimensions if we have valid dimensions
      if (rect.width > 0 && rect.height > 0) {
        // Set canvas dimensions
        this.elements.canvas.width = rect.width;
        this.elements.canvas.height = rect.height;
        this.elements.shapeOverlay.width = rect.width;
        this.elements.shapeOverlay.height = rect.height;
        
        // Reinitialize canvas background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        this.state.blankCanvasData = this.elements.canvas.toDataURL();
      } else {
        // If container is not ready, retry after a short delay
        setTimeout(() => this.handleResize(), 100);
      }
    }

    isCanvasBlank() {
      return this.elements.canvas.toDataURL() === this.state.blankCanvasData;
    }

    getCanvasData() {
      if (this.isCanvasBlank()) {
        return null;
      }
      return this.elements.canvas.toDataURL('image/png');
    }

    showIndicator(message, type) {
      const event = new CustomEvent('showIndicator', {
        detail: { message, type }
      });
      document.dispatchEvent(event);
    }
  }