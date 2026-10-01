/* ==========================================================================
   PIXEL ART CITY WEATHER DASHBOARD - WEATHER FX CANVAS ENGINE
   Pixel-art Particle Physics (Rain, Snow, Splashes, Lightning, Fog, Stars)
   ========================================================================== */

class WeatherFXEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("Canvas element not found:", canvasId);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.pixelRatio = window.devicePixelRatio || 1;
    
    this.width = 0;
    this.height = 0;
    this.virtualWidth = 0;
    this.virtualHeight = 0;
    this.pixelScale = 3; // Pixel-art crunch factor

    // Particle pools
    this.rainParticles = [];
    this.splashParticles = [];
    this.snowParticles = [];
    this.fogBands = [];
    this.dustParticles = [];
    this.shootingStars = [];
    this.stars = [];

    // Weather state
    this.currentCondition = 'clear'; // 'clear' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle' | 'fog'
    this.timeOfDay = 'day'; // 'dawn' | 'day' | 'sunset' | 'night'
    this.windSpeed = 10; // km/h
    this.lightningTimer = 0;
    this.activeLightning = null;
    this.screenFlashAlpha = 0;

    this.isRunning = false;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.generateStars();
    this.generateFog();
    this.start();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Use integer scaling for crisp retro pixel art
    this.pixelScale = window.innerWidth < 768 ? 2 : 3;
    this.virtualWidth = Math.ceil(this.width / this.pixelScale);
    this.virtualHeight = Math.ceil(this.height / this.pixelScale);

    this.canvas.width = this.virtualWidth;
    this.canvas.height = this.virtualHeight;

    // Disable smoothing for razor-sharp pixel edges
    this.ctx.imageSmoothingEnabled = false;

    this.generateStars();
  }

  generateStars() {
    this.stars = [];
    const count = Math.floor((this.virtualWidth * this.virtualHeight) / 1200);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * this.virtualWidth),
        y: Math.floor(Math.random() * (this.virtualHeight * 0.65)),
        size: Math.random() > 0.85 ? 2 : 1,
        baseAlpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#b8d5ff' : '#ffe8b3')
      });
    }
  }

  generateFog() {
    this.fogBands = [];
    const bandCount = 5;
    for (let i = 0; i < bandCount; i++) {
      this.fogBands.push({
        x: Math.random() * this.virtualWidth,
        y: this.virtualHeight * 0.4 + i * (this.virtualHeight * 0.1),
        width: 120 + Math.random() * 180,
        height: 18 + Math.random() * 25,
        speed: 0.15 + Math.random() * 0.25,
        alpha: 0.12 + Math.random() * 0.15
      });
    }
  }

  setCondition(condition, timeOfDay = 'day', windSpeed = 10) {
    this.currentCondition = condition;
    this.timeOfDay = timeOfDay;
    this.windSpeed = windSpeed;

    // Re-adjust particle densities
    if (['rain', 'thunderstorm', 'drizzle'].includes(condition)) {
      const maxDrops = condition === 'thunderstorm' ? 220 : condition === 'drizzle' ? 60 : 140;
      this.rainParticles = [];
      for (let i = 0; i < maxDrops; i++) {
        this.rainParticles.push(this.createRainDrop(true));
      }
    } else {
      this.rainParticles = [];
    }

    if (condition === 'snow') {
      const maxFlakes = 110;
      this.snowParticles = [];
      for (let i = 0; i < maxFlakes; i++) {
        this.snowParticles.push(this.createSnowFlake(true));
      }
    } else {
      this.snowParticles = [];
    }

    if (condition === 'clear') {
      this.dustParticles = [];
      for (let i = 0; i < 30; i++) {
        this.dustParticles.push({
          x: Math.random() * this.virtualWidth,
          y: Math.random() * this.virtualHeight,
          size: 1,
          alpha: 0.2 + Math.random() * 0.4,
          speedY: -0.15 - Math.random() * 0.2,
          speedX: (Math.random() - 0.5) * 0.2
        });
      }
    }
  }

  createRainDrop(randomY = false) {
    const angleOffset = (this.windSpeed / 100) * 1.5;
    return {
      x: Math.random() * (this.virtualWidth + 100) - 50,
      y: randomY ? Math.random() * this.virtualHeight : -10,
      length: 5 + Math.floor(Math.random() * 5),
      speedY: 6 + Math.random() * 4,
      speedX: angleOffset * (4 + Math.random() * 2),
      color: this.timeOfDay === 'night' ? '#7cc1ff' : '#a2d2ff',
      alpha: 0.5 + Math.random() * 0.4
    };
  }

  createSplash(x, y) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.splashParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -1.2 - Math.random() * 1.8,
        gravity: 0.18,
        life: 1.0,
        decay: 0.08 + Math.random() * 0.06
      });
    }
  }

  createSnowFlake(randomY = false) {
    return {
      x: Math.random() * this.virtualWidth,
      y: randomY ? Math.random() * this.virtualHeight : -8,
      size: Math.random() > 0.75 ? 2 : 1,
      speedY: 0.6 + Math.random() * 0.8,
      speedX: (Math.random() - 0.5) * 0.4 + (this.windSpeed / 50),
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.03 + Math.random() * 0.04,
      alpha: 0.6 + Math.random() * 0.4
    };
  }

  triggerLightning() {
    this.screenFlashAlpha = 0.85;
    const startX = Math.floor(this.virtualWidth * 0.2 + Math.random() * (this.virtualWidth * 0.6));
    
    // Generate branching pixel lightning bolt segments
    const segments = [];
    let curX = startX;
    let curY = 0;
    const groundY = Math.floor(this.virtualHeight * 0.75);

    while (curY < groundY) {
      const nextY = curY + 4 + Math.floor(Math.random() * 10);
      const nextX = curX + Math.floor((Math.random() - 0.5) * 16);
      segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
      
      // Occasional small branch
      if (Math.random() > 0.65) {
        const branchNextX = nextX + Math.floor((Math.random() - 0.5) * 24);
        const branchNextY = nextY + 6 + Math.floor(Math.random() * 12);
        segments.push({ x1: nextX, y1: nextY, x2: branchNextX, y2: branchNextY, isBranch: true });
      }

      curX = nextX;
      curY = nextY;
    }

    this.activeLightning = {
      segments: segments,
      life: 1.0,
      color: Math.random() > 0.5 ? '#ffffff' : '#c4eeff'
    };

    // Play thunder sound with a slight realistic acoustic delay
    if (window.weatherAudio) {
      setTimeout(() => {
        window.weatherAudio.playThunder();
      }, 150 + Math.random() * 300);
    }
  }

  triggerShootingStar() {
    this.shootingStars.push({
      x: Math.random() * (this.virtualWidth * 0.8),
      y: Math.random() * (this.virtualHeight * 0.35),
      vx: 6 + Math.random() * 4,
      vy: 3 + Math.random() * 2,
      length: 18 + Math.floor(Math.random() * 12),
      life: 1.0,
      decay: 0.035
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 1. Stars twinkle
    for (let star of this.stars) {
      star.phase += star.twinkleSpeed;
    }

    // 2. Shooting stars chance at night
    if ((this.timeOfDay === 'night' || this.timeOfDay === 'sunset') && this.currentCondition === 'clear') {
      if (Math.random() < 0.003 && this.shootingStars.length === 0) {
        this.triggerShootingStar();
      }
    }

    // Update shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;
      if (s.life <= 0) {
        this.shootingStars.splice(i, 1);
      }
    }

    // 3. Lightning trigger in thunderstorm
    if (this.currentCondition === 'thunderstorm') {
      this.lightningTimer += dt;
      if (this.lightningTimer > 4.5 + Math.random() * 6.0) {
        this.lightningTimer = 0;
        this.triggerLightning();
      }
    }

    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - dt * 2.8);
    }

    if (this.activeLightning) {
      this.activeLightning.life -= dt * 4.0;
      if (this.activeLightning.life <= 0) {
        this.activeLightning = null;
      }
    }

    // 4. Rain Particles & Splashes
    if (['rain', 'thunderstorm', 'drizzle'].includes(this.currentCondition)) {
      const rooftopY = this.virtualHeight * 0.72; // approximate rooftop level
      for (let drop of this.rainParticles) {
        drop.x += drop.speedX;
        drop.y += drop.speedY;

        if (drop.y > rooftopY && Math.random() > 0.88) {
          this.createSplash(drop.x, drop.y);
          // Reset drop
          drop.y = -10;
          drop.x = Math.random() * (this.virtualWidth + 100) - 50;
        } else if (drop.y > this.virtualHeight) {
          drop.y = -10;
          drop.x = Math.random() * (this.virtualWidth + 100) - 50;
        }
      }

      // Splashes
      for (let i = this.splashParticles.length - 1; i >= 0; i--) {
        const sp = this.splashParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += sp.gravity;
        sp.life -= sp.decay;
        if (sp.life <= 0) {
          this.splashParticles.splice(i, 1);
        }
      }
    }

    // 5. Snow Particles
    if (this.currentCondition === 'snow') {
      for (let flake of this.snowParticles) {
        flake.swayPhase += flake.swaySpeed;
        flake.y += flake.speedY;
        flake.x += flake.speedX + Math.sin(flake.swayPhase) * 0.5;

        if (flake.y > this.virtualHeight) {
          flake.y = -6;
          flake.x = Math.random() * this.virtualWidth;
        }
        if (flake.x > this.virtualWidth) flake.x = 0;
        if (flake.x < 0) flake.x = this.virtualWidth;
      }
    }

    // 6. Fog bands
    if (this.currentCondition === 'fog' || this.currentCondition === 'cloudy') {
      for (let fog of this.fogBands) {
        fog.x += fog.speed;
        if (fog.x > this.virtualWidth) {
          fog.x = -fog.width;
        }
      }
    }

    // 7. Dust motes in sunny clear
    if (this.currentCondition === 'clear') {
      for (let d of this.dustParticles) {
        d.y += d.speedY;
        d.x += d.speedX;
        if (d.y < 0) {
          d.y = this.virtualHeight;
          d.x = Math.random() * this.virtualWidth;
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 1. Draw Stars (Visible mainly during Night, Sunset, and Dawn)
    if (this.timeOfDay === 'night' || this.timeOfDay === 'sunset' || this.timeOfDay === 'dawn') {
      const timeAlphaMultiplier = this.timeOfDay === 'night' ? 1.0 : (this.timeOfDay === 'sunset' ? 0.4 : 0.6);
      const weatherAlphaMultiplier = this.currentCondition === 'clear' ? 1.0 : (this.currentCondition === 'partly_cloudy' ? 0.5 : 0.05);
      const overallStarAlpha = timeAlphaMultiplier * weatherAlphaMultiplier;

      if (overallStarAlpha > 0.01) {
        for (let star of this.stars) {
          const osc = 0.5 + 0.5 * Math.sin(star.phase);
          const a = star.baseAlpha * osc * overallStarAlpha;
          this.ctx.fillStyle = star.color;
          this.ctx.globalAlpha = a;
          this.ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
        }
      }
    }

    // 2. Draw Shooting Stars
    for (let s of this.shootingStars) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = s.life * 0.9;
      // Draw pixel line
      const steps = Math.floor(s.length);
      for (let i = 0; i < steps; i++) {
        const px = Math.floor(s.x - (s.vx / 3) * i);
        const py = Math.floor(s.y - (s.vy / 3) * i);
        const tailAlpha = (1 - (i / steps)) * s.life;
        this.ctx.globalAlpha = tailAlpha;
        this.ctx.fillRect(px, py, i < 3 ? 2 : 1, i < 3 ? 2 : 1);
      }
    }

    // 3. Draw Lightning Bolts
    if (this.activeLightning) {
      this.ctx.strokeStyle = this.activeLightning.color;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = this.activeLightning.life;
      this.ctx.lineWidth = 1;

      for (let seg of this.activeLightning.segments) {
        this.ctx.beginPath();
        this.ctx.moveTo(seg.x1, seg.y1);
        this.ctx.lineTo(seg.x2, seg.y2);
        this.ctx.stroke();

        // Pixel core
        this.ctx.fillRect(seg.x2, seg.y2, 2, 2);
      }
    }

    // 4. Draw Screen Lightning Flash
    if (this.screenFlashAlpha > 0) {
      this.ctx.fillStyle = '#e8f4fd';
      this.ctx.globalAlpha = this.screenFlashAlpha * 0.75;
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    // 5. Draw Fog Bands
    if (this.currentCondition === 'fog' || (this.currentCondition === 'cloudy' && Math.random() > 0.2)) {
      for (let fog of this.fogBands) {
        this.ctx.fillStyle = this.timeOfDay === 'night' ? '#182438' : '#e2e8f0';
        this.ctx.globalAlpha = fog.alpha;
        this.ctx.fillRect(Math.floor(fog.x), Math.floor(fog.y), Math.floor(fog.width), Math.floor(fog.height));
      }
    }

    // 6. Draw Rain & Splashes
    if (['rain', 'thunderstorm', 'drizzle'].includes(this.currentCondition)) {
      for (let drop of this.rainParticles) {
        this.ctx.fillStyle = drop.color;
        this.ctx.globalAlpha = drop.alpha;
        // Pixel angled streak
        const x = Math.floor(drop.x);
        const y = Math.floor(drop.y);
        for (let l = 0; l < drop.length; l++) {
          this.ctx.fillRect(x + Math.floor(l * (drop.speedX / drop.speedY)), y + l, 1, 1);
        }
      }

      // Splashes
      for (let sp of this.splashParticles) {
        this.ctx.fillStyle = '#c5e2ff';
        this.ctx.globalAlpha = sp.life * 0.8;
        this.ctx.fillRect(Math.floor(sp.x), Math.floor(sp.y), 1, 1);
      }
    }

    // 7. Draw Snow
    if (this.currentCondition === 'snow') {
      this.ctx.fillStyle = '#ffffff';
      for (let flake of this.snowParticles) {
        this.ctx.globalAlpha = flake.alpha;
        this.ctx.fillRect(Math.floor(flake.x), Math.floor(flake.y), flake.size, flake.size);
      }
    }

    // 8. Draw Dust motes
    if (this.currentCondition === 'clear') {
      this.ctx.fillStyle = this.timeOfDay === 'sunset' ? '#ffd166' : '#fff3b0';
      for (let d of this.dustParticles) {
        this.ctx.globalAlpha = d.alpha * (this.timeOfDay === 'night' ? 0.1 : 0.5);
        this.ctx.fillRect(Math.floor(d.x), Math.floor(d.y), d.size, d.size);
      }
    }

    this.ctx.globalAlpha = 1.0;
  }
}

window.WeatherFXEngine = WeatherFXEngine;
