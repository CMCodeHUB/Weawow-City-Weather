/* ==========================================================================
   PIXEL ART CITY WEATHER DASHBOARD - CITY ENGINE
   Layered Pixel-Art Cityscape Architecture, Interactive Windows,
   Street Lamps, Neon Billboards, Pixel Cat Easter Egg & Celestial Bodies
   ========================================================================== */

class PixelCityEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error("Cityscape container not found:", containerId);
      return;
    }

    this.windows = [];
    this.totalWindows = 0;
    this.litWindowsCount = 0;
    this.timeOfDay = 'day'; // 'dawn' | 'day' | 'sunset' | 'night'
    this.condition = 'clear';

    this.onWindowToggleCallback = null;
    this.trainTimer = null;

    this.init();
  }

  init() {
    this.buildCityHTML();
    this.cacheElements();
    this.bindEvents();
    this.setupParallax();
    this.startMonorailLoop();
  }

  buildCityHTML() {
    this.container.innerHTML = `
      <!-- SKY CONTAINER WITH CELESTIAL BODIES -->
      <div class="sky-backdrop" id="skyBackdrop"></div>

      <!-- CELESTIAL BODY (SUN / MOON) -->
      <div class="celestial-container" id="celestialContainer">
        <div class="pixel-sun" id="pixelSun">
          <div class="sun-core"></div>
          <div class="sun-rays">
            <span class="ray ray-1"></span>
            <span class="ray ray-2"></span>
            <span class="ray ray-3"></span>
            <span class="ray ray-4"></span>
          </div>
        </div>
        <div class="pixel-moon" id="pixelMoon">
          <div class="moon-core">
            <span class="crater c1"></span>
            <span class="crater c2"></span>
            <span class="crater c3"></span>
          </div>
        </div>
      </div>

      <!-- CLOUDS LAYER -->
      <div class="pixel-clouds-layer" id="pixelCloudsLayer">
        <div class="pixel-cloud cloud-1" data-speed="25"></div>
        <div class="pixel-cloud cloud-2" data-speed="40"></div>
        <div class="pixel-cloud cloud-3" data-speed="18"></div>
        <div class="pixel-cloud cloud-4" data-speed="32"></div>
      </div>

      <!-- LAYER 1: FAR DISTANT HORIZON (SILHOUETTE TOWERS & PEAKS) -->
      <div class="skyline-layer layer-far" id="layerFar">
        <div class="distant-tower dt-1"><div class="beacon red-beacon"></div></div>
        <div class="distant-tower dt-2"></div>
        <div class="distant-tower dt-3"><div class="beacon red-beacon"></div></div>
        <div class="distant-tower dt-4"></div>
        <div class="distant-tower dt-5"><div class="beacon red-beacon"></div></div>
        <div class="distant-tower dt-6"></div>
        <div class="distant-tower dt-7"><div class="beacon red-beacon"></div></div>
      </div>

      <!-- ELEVATED MONORAIL TRACK -->
      <div class="monorail-track" id="monorailTrack">
        <div class="pixel-train" id="pixelTrain">
          <div class="train-car front">
            <span class="train-light"></span>
            <span class="train-window"></span>
          </div>
          <div class="train-car mid">
            <span class="train-window"></span>
            <span class="train-window"></span>
          </div>
          <div class="train-car back">
            <span class="train-window"></span>
            <span class="train-tail-light"></span>
          </div>
        </div>
      </div>

      <!-- LAYER 2: MIDGROUND CITY WITH NEON BILLBOARDS -->
      <div class="skyline-layer layer-mid" id="layerMid">
        <!-- Mid Tower 1 -->
        <div class="mid-tower mt-1">
          <div class="antenna"><div class="beacon white-beacon"></div></div>
          <div class="rooftop-fan"></div>
          <div class="mid-windows-strip"></div>
        </div>
        <!-- Mid Tower 2 with Animated Neon Billboard -->
        <div class="mid-tower mt-2">
          <div class="neon-billboard billboard-cyber">
            <span class="neon-text glow-cyan">8-BIT</span>
            <span class="neon-text glow-pink">WEATHER</span>
            <div class="pixel-glitch-line"></div>
          </div>
          <div class="water-tank"></div>
          <div class="mid-windows-strip"></div>
        </div>
        <!-- Mid Tower 3 with Cafe Billboard -->
        <div class="mid-tower mt-3">
          <div class="neon-billboard billboard-cafe">
            <div class="pixel-coffee-cup">
              <div class="steam s1"></div>
              <div class="steam s2"></div>
            </div>
            <span class="neon-label">CAFE</span>
          </div>
          <div class="antenna"><div class="beacon red-beacon"></div></div>
          <div class="mid-windows-strip"></div>
        </div>
        <!-- Mid Tower 4 -->
        <div class="mid-tower mt-4">
          <div class="rooftop-dish"></div>
          <div class="mid-windows-strip"></div>
        </div>
        <!-- Mid Tower 5 -->
        <div class="mid-tower mt-5">
          <div class="neon-billboard billboard-arrow">
            <span class="neon-arrow">▶▶▶</span>
          </div>
          <div class="mid-windows-strip"></div>
        </div>
      </div>

      <!-- LAYER 3: FOREGROUND BUILDINGS WITH CLICKABLE WINDOWS & CAT -->
      <div class="skyline-layer layer-fore" id="layerFore">
        <!-- Building A: Classic Brownstone Rooftop -->
        <div class="fore-building b-1">
          <div class="building-roof">
            <div class="water-tower-wood">
              <div class="tank-body"></div>
              <div class="tank-stilts"></div>
            </div>
            <div class="chimney"></div>
            <!-- EASTER EGG: PIXEL CAT -->
            <div class="pixel-cat-container" id="pixelCat" title="Click me for a meow!">
              <div class="pixel-cat">
                <div class="cat-body"></div>
                <div class="cat-head">
                  <span class="cat-ear ear-l"></span>
                  <span class="cat-ear ear-r"></span>
                  <span class="cat-eye eye-l"></span>
                  <span class="cat-eye eye-r"></span>
                </div>
                <div class="cat-tail"></div>
              </div>
              <div class="cat-heart" id="catHeart">♥</div>
            </div>
          </div>
          <div class="building-facade facade-brick" id="gridB1"></div>
        </div>

        <!-- Building B: Modern Cyber Highrise -->
        <div class="fore-building b-2">
          <div class="building-roof">
            <div class="helipad">
              <span class="helipad-h">H</span>
            </div>
            <div class="ac-units">
              <span class="ac-box"></span>
              <span class="ac-box"></span>
            </div>
          </div>
          <div class="building-facade facade-cyber" id="gridB2"></div>
        </div>

        <!-- Building C: Central Commercial Tower -->
        <div class="fore-building b-3">
          <div class="building-roof">
            <div class="roof-stepped"></div>
            <div class="antenna spire"><div class="beacon red-beacon"></div></div>
          </div>
          <div class="building-facade facade-stone" id="gridB3"></div>
        </div>

        <!-- Building D: Industrial Loft with Fire Escape -->
        <div class="fore-building b-4">
          <div class="building-roof">
            <div class="skylight"></div>
            <div class="pipe-stack"></div>
          </div>
          <div class="building-facade facade-industrial" id="gridB4">
            <div class="fire-escape-scaffold"></div>
          </div>
        </div>

        <!-- Building E: Sleek Tech Monolith -->
        <div class="fore-building b-5">
          <div class="building-roof">
            <div class="radio-dome"></div>
          </div>
          <div class="building-facade facade-tech" id="gridB5"></div>
        </div>
      </div>

      <!-- STREET LEVEL WITH GLOWING STREET LAMPS -->
      <div class="street-level" id="streetLevel">
        <div class="sidewalk-line"></div>
        <div class="street-lamp-wrapper" id="lamp1" title="Click street lamp to toggle!">
          <div class="street-lamp">
            <div class="lamp-head"></div>
            <div class="lamp-pole"></div>
            <div class="lamp-base"></div>
            <div class="lamp-cone"></div>
          </div>
        </div>
        <div class="street-lamp-wrapper" id="lamp2" title="Click street lamp to toggle!">
          <div class="street-lamp">
            <div class="lamp-head"></div>
            <div class="lamp-pole"></div>
            <div class="lamp-base"></div>
            <div class="lamp-cone"></div>
          </div>
        </div>
        <div class="street-lamp-wrapper" id="lamp3" title="Click street lamp to toggle!">
          <div class="street-lamp">
            <div class="lamp-head"></div>
            <div class="lamp-pole"></div>
            <div class="lamp-base"></div>
            <div class="lamp-cone"></div>
          </div>
        </div>
        <div class="street-road">
          <div class="road-markings"></div>
        </div>
      </div>
    `;

    this.generateWindowGrids();
  }

  cacheElements() {
    this.skyBackdrop = document.getElementById('skyBackdrop');
    this.celestialContainer = document.getElementById('celestialContainer');
    this.pixelSun = document.getElementById('pixelSun');
    this.pixelMoon = document.getElementById('pixelMoon');
    this.pixelCloudsLayer = document.getElementById('pixelCloudsLayer');
    this.pixelCat = document.getElementById('pixelCat');
    this.catHeart = document.getElementById('catHeart');
    this.pixelTrain = document.getElementById('pixelTrain');
    this.layerFar = document.getElementById('layerFar');
    this.layerMid = document.getElementById('layerMid');
    this.layerFore = document.getElementById('layerFore');
  }

  generateWindowGrids() {
    // Generate window grids across the 5 buildings
    const buildingConfigs = [
      { id: 'gridB1', rows: 6, cols: 3, colorPalette: ['amber', 'warm', 'peach'] },
      { id: 'gridB2', rows: 8, cols: 4, colorPalette: ['cyan', 'teal', 'amber'] },
      { id: 'gridB3', rows: 9, cols: 4, colorPalette: ['amber', 'warm', 'purple'] },
      { id: 'gridB4', rows: 7, cols: 3, colorPalette: ['amber', 'warm', 'peach'] },
      { id: 'gridB5', rows: 8, cols: 3, colorPalette: ['cyan', 'amber', 'mint'] }
    ];

    this.windows = [];
    let globalIndex = 0;

    buildingConfigs.forEach((cfg) => {
      const el = document.getElementById(cfg.id);
      if (!el) return;

      el.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;
      el.style.gridTemplateRows = `repeat(${cfg.rows}, 1fr)`;

      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const win = document.createElement('div');
          win.className = 'pixel-window';
          
          const color = cfg.colorPalette[Math.floor(Math.random() * cfg.colorPalette.length)];
          win.dataset.color = color;
          win.dataset.index = globalIndex;
          
          // Default initial state: based on time
          const isLit = Math.random() > 0.45;
          win.dataset.lit = isLit ? 'true' : 'false';
          if (isLit) {
            win.classList.add('is-lit', `lit-${color}`);
          }

          win.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleWindow(win);
          });

          el.appendChild(win);
          this.windows.push(win);
          globalIndex++;
        }
      }
    });

    this.totalWindows = this.windows.length;
    this.updateLitCounter();
  }

  toggleWindow(winEl) {
    const isCurrentlyLit = winEl.dataset.lit === 'true';
    const nextState = !isCurrentlyLit;
    const color = winEl.dataset.color || 'amber';

    winEl.dataset.lit = nextState ? 'true' : 'false';
    if (nextState) {
      winEl.classList.add('is-lit', `lit-${color}`);
      winEl.classList.add('window-pulse');
      setTimeout(() => winEl.classList.remove('window-pulse'), 300);
    } else {
      winEl.classList.remove('is-lit', `lit-${color}`);
    }

    if (window.weatherAudio) {
      window.weatherAudio.playWindowClick(nextState);
    }

    this.updateLitCounter();
  }

  toggleAllLights(forceState = null) {
    this.windows.forEach(win => {
      const nextState = forceState !== null ? forceState : (win.dataset.lit !== 'true');
      const color = win.dataset.color || 'amber';
      win.dataset.lit = nextState ? 'true' : 'false';
      if (nextState) {
        win.classList.add('is-lit', `lit-${color}`);
      } else {
        win.classList.remove('is-lit', `lit-${color}`);
      }
    });

    if (window.weatherAudio) {
      window.weatherAudio.playUiBeep();
    }
    this.updateLitCounter();
  }

  randomizeLights(targetLitProbability = 0.5) {
    this.windows.forEach(win => {
      const shouldLight = Math.random() < targetLitProbability;
      const color = win.dataset.color || 'amber';
      win.dataset.lit = shouldLight ? 'true' : 'false';
      if (shouldLight) {
        win.classList.add('is-lit', `lit-${color}`);
      } else {
        win.classList.remove('is-lit', `lit-${color}`);
      }
    });
    this.updateLitCounter();
  }

  updateLitCounter() {
    this.litWindowsCount = this.windows.filter(w => w.dataset.lit === 'true').length;
    if (this.onWindowToggleCallback) {
      this.onWindowToggleCallback(this.litWindowsCount, this.totalWindows);
    }
  }

  bindEvents() {
    // Pixel cat interaction
    if (this.pixelCat) {
      this.pixelCat.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pixelCat.classList.add('cat-jump');
        if (this.catHeart) {
          this.catHeart.classList.add('show-heart');
          setTimeout(() => this.catHeart.classList.remove('show-heart'), 900);
        }
        if (window.weatherAudio) {
          window.weatherAudio.playCatMeow();
        }
        setTimeout(() => this.pixelCat.classList.remove('cat-jump'), 600);
      });
    }

    // Street lamps toggle
    ['lamp1', 'lamp2', 'lamp3'].forEach(id => {
      const lamp = document.getElementById(id);
      if (lamp) {
        lamp.addEventListener('click', (e) => {
          e.stopPropagation();
          lamp.classList.toggle('lamp-off');
          lamp.classList.add('lamp-flicker');
          setTimeout(() => lamp.classList.remove('lamp-flicker'), 400);
          if (window.weatherAudio) {
            window.weatherAudio.playLampClick();
          }
        });
      }
    });

    // Cloud click easter egg
    if (this.pixelCloudsLayer) {
      this.pixelCloudsLayer.addEventListener('click', () => {
        if (window.weatherFX) {
          window.weatherFX.triggerShootingStar();
        }
      });
    }
  }

  setupParallax() {
    // Subtle parallax tilt when moving cursor over dashboard
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    window.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetX = (e.clientX - centerX) / centerX;
      targetY = (e.clientY - centerY) / centerY;
    });

    const updateParallax = () => {
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;

      if (this.layerFar) {
        this.layerFar.style.transform = `translateX(${curX * 6}px) translateY(${curY * 3}px)`;
      }
      if (this.layerMid) {
        this.layerMid.style.transform = `translateX(${curX * 14}px) translateY(${curY * 6}px)`;
      }
      if (this.layerFore) {
        this.layerFore.style.transform = `translateX(${curX * 24}px) translateY(${curY * 10}px)`;
      }

      requestAnimationFrame(updateParallax);
    };

    requestAnimationFrame(updateParallax);
  }

  startMonorailLoop() {
    const launchTrain = () => {
      if (this.pixelTrain) {
        this.pixelTrain.classList.remove('train-animating');
        // Trigger reflow
        void this.pixelTrain.offsetWidth;
        this.pixelTrain.classList.add('train-animating');
      }
      // Schedule next train in 18 to 35 seconds
      this.trainTimer = setTimeout(launchTrain, 18000 + Math.random() * 17000);
    };

    // First train after 3 seconds
    this.trainTimer = setTimeout(launchTrain, 3000);
  }

  /**
   * Update cityscape color palette, lighting, celestial bodies & atmosphere
   */
  updateAtmosphere(timeOfDay, condition, isDay = true) {
    this.timeOfDay = timeOfDay;
    this.condition = condition;

    // 1. Update container classes for global CSS variables
    const validTimes = ['dawn', 'day', 'sunset', 'night'];
    validTimes.forEach(t => this.container.classList.remove(`time-${t}`));
    this.container.classList.add(`time-${timeOfDay}`);

    const validConditions = ['clear', 'cloudy', 'partly_cloudy', 'rain', 'snow', 'thunderstorm', 'fog', 'drizzle'];
    validConditions.forEach(c => this.container.classList.remove(`weather-${c}`));
    this.container.classList.add(`weather-${condition}`);

    // 2. Celestial Body (Sun vs Moon)
    if (this.pixelSun && this.pixelMoon) {
      if (isDay && (timeOfDay === 'day' || timeOfDay === 'dawn' || timeOfDay === 'sunset')) {
        this.pixelSun.style.display = 'block';
        this.pixelMoon.style.display = 'none';

        if (timeOfDay === 'dawn') {
          this.celestialContainer.className = 'celestial-container pos-dawn';
        } else if (timeOfDay === 'sunset') {
          this.celestialContainer.className = 'celestial-container pos-sunset';
        } else {
          this.celestialContainer.className = 'celestial-container pos-noon';
        }
      } else {
        this.pixelSun.style.display = 'none';
        this.pixelMoon.style.display = 'block';
        this.celestialContainer.className = 'celestial-container pos-night';
      }
    }

    // 3. Auto-adjust window lighting density to feel realistic
    if (timeOfDay === 'night') {
      this.randomizeLights(0.70); // 70% lit at night
    } else if (timeOfDay === 'sunset' || timeOfDay === 'dawn') {
      this.randomizeLights(0.55); // 55% lit at twilight
    } else {
      this.randomizeLights(0.25); // 25% lit during broad daylight
    }

    // 4. Street lamps auto-glow based on time
    const lamps = document.querySelectorAll('.street-lamp-wrapper');
    lamps.forEach(l => {
      if (timeOfDay === 'night' || timeOfDay === 'sunset' || timeOfDay === 'dawn' || condition === 'thunderstorm') {
        l.classList.remove('lamp-off');
      } else {
        l.classList.add('lamp-off');
      }
    });
  }
}

window.PixelCityEngine = PixelCityEngine;
