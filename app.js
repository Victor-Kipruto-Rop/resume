// app.js - Background Animation & Mobile Menu

// 1. Mobile Menu Toggle
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.getElementById('nav-links');

if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });
}

// 2. Background Canvas Animation
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width; 
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.8; 
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 2 + 1; 
      this.color = Math.random() > 0.3 ? '#FF4D1C' : '#FF8A00';
    }
    update() {
      this.x += this.vx; 
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath(); 
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color; 
      ctx.fill();
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Particle());

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(); 
      particles[i].draw();
      for (let j = i + 1; j < particles.length; j++) {
        const dist = Math.sqrt((particles[i].x - particles[j].x)**2 + (particles[i].y - particles[j].y)**2);
        if (dist < 130) {
          ctx.beginPath(); 
          ctx.moveTo(particles[i].x, particles[i].y); 
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255, 77, 28, ${1 - dist / 130})`; 
          ctx.lineWidth = 0.5; 
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();
}

