import { Config } from '../config.js';

export class ParticleManager {
  constructor() {
    this.particles = [];
    this.particlesContainer = null;
  }

  async init() {
    this.particlesContainer = document.getElementById('particles');
    if (!this.particlesContainer) {
      throw new Error('Particles container not found');
    }
    
    this.createParticles();
  }

  createParticles() {
    const { count, sizeRange, animationDuration } = Config.particles;
    
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle();
      this.particlesContainer.appendChild(particle);
      this.particles.push(particle);
    }
  }

  createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const { sizeRange, animationDuration } = Config.particles;
    const size = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;
    const duration = Math.random() * (animationDuration.max - animationDuration.min) + animationDuration.min;
    
    // Set styles
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.animationDelay = Math.random() * 8 + 's';
    particle.style.animationDuration = duration + 's';
    
    return particle;
  }

  cleanup() {
    this.particles = [];
    if (this.particlesContainer) {
      this.particlesContainer.innerHTML = '';
    }
  }
}