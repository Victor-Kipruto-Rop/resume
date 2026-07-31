// app.js - Background Animation, Mobile Menu, Subscribe & Animations

// 0. Backend API base URL for the subscribe/notify service (see /server folder).
//    Point this at your deployed backend (Render, Railway, Fly.io, etc). Left blank,
//    subscriptions are queued locally in the browser until a real API is configured.
const API_BASE_URL = window.API_BASE_URL || "";

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


// 3. Newsletter / Subscribe Handler
// Posts { fullName, email, subscribedAt } to the backend defined in /server.
// See /server/README.md for deployment instructions. Falls back to a local
// pending queue (localStorage) if no backend is configured yet, so no
// signups are lost while you finish deployment.
async function handleNewsletter(e) {
  e.preventDefault();
  const form = e.target;
  const nameInput = document.getElementById('subscribe-name');
  const emailInput = document.getElementById('subscribe-email');
  const statusEl = document.getElementById('subscribe-status');
  const btn = document.getElementById('subscribe-btn');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';

  if (!fullName || !email) {
    if (statusEl) { statusEl.textContent = 'Please fill in your name and email.'; statusEl.className = 'subscribe-status error'; }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
  if (statusEl) { statusEl.textContent = 'Submitting...'; statusEl.className = 'subscribe-status loading'; }

  const payload = { fullName, email, subscribedAt: new Date().toISOString() };

  try {
    if (!API_BASE_URL) {
      // No backend configured yet: queue locally so the signup isn't lost.
      const pending = JSON.parse(localStorage.getItem('pendingSubscribers') || '[]');
      pending.push(payload);
      localStorage.setItem('pendingSubscribers', JSON.stringify(pending));
      throw new Error('NO_BACKEND');
    }

    const res = await fetch(`${API_BASE_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Subscription failed');
    }

    if (statusEl) { statusEl.textContent = `Thanks, ${fullName}! You're subscribed to Engineering Dispatch.`; statusEl.className = 'subscribe-status success'; }
    form.reset();
  } catch (err) {
    if (err.message === 'NO_BACKEND') {
      if (statusEl) { statusEl.textContent = `Thanks, ${fullName}! Saved locally — backend not yet connected (see /server).`; statusEl.className = 'subscribe-status success'; }
      form.reset();
    } else {
      if (statusEl) { statusEl.textContent = `Couldn't subscribe right now: ${err.message}`; statusEl.className = 'subscribe-status error'; }
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
  }
}

// 4. Scroll-reveal animation for .fade-in-up elements re-triggered on view
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        entry.target.style.opacity = entry.target.style.opacity || '';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fade-in-up').forEach(el => revealObserver.observe(el));
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fade-in-up').forEach(el => el.classList.add('js-fallback'));
  });
}

// 5. Share helpers for individual article pages (WhatsApp, Telegram, LinkedIn, Copy Link)
function shareToWhatsApp(title, url) {
  window.open(`https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}`, '_blank', 'noopener');
}
function shareToTelegram(title, url) {
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener');
}
function shareToLinkedIn(url) {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener');
}
async function copyArticleLink(btnEl, url) {
  try {
    await navigator.clipboard.writeText(url);
    if (btnEl) {
      const original = btnEl.innerHTML;
      btnEl.classList.add('copied');
      btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => { btnEl.classList.remove('copied'); btnEl.innerHTML = original; }, 1800);
    }
  } catch (err) {
    console.error('Copy failed', err);
  }
}
