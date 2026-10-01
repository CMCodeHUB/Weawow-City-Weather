/* ==========================================================================
   PIXEL ART CITY WEATHER DASHBOARD - MAIN APPLICATION CONTROLLER
   State Management, UI Orchestration, Autocomplete, Clock & Simulation
   ========================================================================== */

class WeatherDashboardApp {
  constructor() {
    this.cityEngine = null;
    this.weatherFX = null;
    this.audioSynth = window.weatherAudio;

    // App state
    this.currentCity = null;
    this.weatherData = null;
    this.tempUnit = localStorage.getItem('pixel_temp_unit') || 'C';
    this.crtEnabled = localStorage.getItem('pixel_crt_mode') === 'true';
    this.isManualSim = false;
    this.manualState = { timeOfDay: null, condition: null };
    this.clockInterval = null;
    this.searchDebounceTimer = null;

    this.init();
  }

  async init() {
    // 1. Initialize Engines
    this.cityEngine = new PixelCityEngine('cityContainer');
    this.weatherFX = new WeatherFXEngine('weatherCanvas');
    window.weatherFX = this.weatherFX;

    // Hook window counter
    this.cityEngine.onWindowToggleCallback = (lit, total) => {
      const counterEl = document.getElementById('windowCountText');
      if (counterEl) counterEl.textContent = `${lit}/${total}`;
    };

    // 2. Setup CRT initial state
    if (this.crtEnabled) {
      document.body.classList.add('crt-active');
      const crtBtn = document.getElementById('crtToggleBtn');
      if (crtBtn) crtBtn.classList.add('active');
    }

    // 3. Bind UI Events
    this.bindUIEvents();

    // 4. Load initial city (saved Indian city or Kolkata as default)
    const savedCity = localStorage.getItem('pixel_last_city');
    let initialCity = WeatherAPI.PRESET_CITIES[0]; // Kolkata
    if (savedCity) {
      try {
        const parsed = JSON.parse(savedCity);
        if (parsed && parsed.name && parsed.name.toLowerCase() !== 'tokyo') {
          initialCity = parsed;
        }
      } catch (e) {
        initialCity = WeatherAPI.PRESET_CITIES[0];
      }
    }

    await this.loadCity(initialCity);
  }

  bindUIEvents() {
    // Search input & autocomplete
    const searchInput = document.getElementById('citySearchInput');
    const searchResults = document.getElementById('searchResults');
    const searchForm = document.getElementById('searchForm');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchDebounceTimer);
        const query = e.target.value.trim();
        if (query.length < 2) {
          if (searchResults) searchResults.innerHTML = '';
          if (searchResults) searchResults.classList.remove('active');
          return;
        }

        this.searchDebounceTimer = setTimeout(async () => {
          const cities = await WeatherAPI.searchCities(query);
          this.renderSearchResults(cities);
        }, 260);
      });

      searchInput.addEventListener('focus', () => {
        if (searchResults && searchResults.children.length > 0) {
          searchResults.classList.add('active');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box-wrapper')) {
          if (searchResults) searchResults.classList.remove('active');
        }
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;
        const cities = await WeatherAPI.searchCities(query);
        if (cities.length > 0) {
          await this.loadCity(cities[0]);
          if (searchResults) searchResults.classList.remove('active');
          searchInput.blur();
        }
      });
    }

    // Preset quick pills
    const presetPills = document.querySelectorAll('.preset-city-pill');
    presetPills.forEach(pill => {
      pill.addEventListener('click', async () => {
        const cityName = pill.dataset.city;
        const found = WeatherAPI.PRESET_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
        if (found) {
          presetPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          await this.loadCity(found);
        }
      });
    });

    // Temperature Unit Toggle (°C / °F)
    const unitToggleBtn = document.getElementById('unitToggleBtn');
    if (unitToggleBtn) {
      unitToggleBtn.textContent = `°${this.tempUnit}`;
      unitToggleBtn.addEventListener('click', () => {
        this.tempUnit = this.tempUnit === 'C' ? 'F' : 'C';
        localStorage.setItem('pixel_temp_unit', this.tempUnit);
        unitToggleBtn.textContent = `°${this.tempUnit}`;
        if (this.weatherData) {
          this.renderWeatherDisplay();
        }
        if (this.audioSynth) this.audioSynth.playUiBeep();
      });
    }

    // Audio Mute / Unmute Toggle
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', () => {
        const isNowPlaying = this.audioSynth.toggleMute();
        audioToggleBtn.classList.toggle('active', isNowPlaying);
        const iconSpan = audioToggleBtn.querySelector('.audio-icon');
        const textSpan = audioToggleBtn.querySelector('.audio-label');
        if (iconSpan) iconSpan.textContent = isNowPlaying ? '🔊' : '🔇';
        if (textSpan) textSpan.textContent = isNowPlaying ? 'SOUND ON' : 'MUTE';
      });
    }

    // CRT Scanline Toggle
    const crtToggleBtn = document.getElementById('crtToggleBtn');
    if (crtToggleBtn) {
      crtToggleBtn.addEventListener('click', () => {
        this.crtEnabled = !this.crtEnabled;
        localStorage.setItem('pixel_crt_mode', this.crtEnabled);
        document.body.classList.toggle('crt-active', this.crtEnabled);
        crtToggleBtn.classList.toggle('active', this.crtEnabled);
        if (this.audioSynth) this.audioSynth.playUiBeep();
      });
    }

    // Window Lights Controls
    const toggleAllLightsBtn = document.getElementById('toggleAllLightsBtn');
    if (toggleAllLightsBtn) {
      toggleAllLightsBtn.addEventListener('click', () => {
        const allLit = this.cityEngine.litWindowsCount === this.cityEngine.totalWindows;
        this.cityEngine.toggleAllLights(!allLit);
      });
    }

    const randomizeLightsBtn = document.getElementById('randomizeLightsBtn');
    if (randomizeLightsBtn) {
      randomizeLightsBtn.addEventListener('click', () => {
        this.cityEngine.randomizeLights(0.5);
        if (this.audioSynth) this.audioSynth.playUiBeep();
      });
    }

    // Simulator Override Buttons (Test Mode)
    const simBtns = document.querySelectorAll('.sim-btn');
    simBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        simBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const simType = btn.dataset.sim;
        if (simType === 'realtime') {
          this.isManualSim = false;
          if (this.weatherData) {
            this.applyAtmosphere(this.weatherData.timeOfDay, this.weatherData.current.weatherInfo.type, this.weatherData.current.isDay, this.weatherData.current.windSpeed);
          }
        } else if (['dawn', 'day', 'sunset', 'night'].includes(simType)) {
          this.isManualSim = true;
          const condition = this.weatherData ? this.weatherData.current.weatherInfo.type : 'clear';
          const isDay = simType !== 'night';
          this.applyAtmosphere(simType, condition, isDay, 12);
        } else if (['rain', 'snow', 'thunderstorm', 'clear', 'fog'].includes(simType)) {
          this.isManualSim = true;
          const time = this.weatherData ? this.weatherData.timeOfDay : 'night';
          const isDay = time !== 'night';
          this.applyAtmosphere(time, simType, isDay, simType === 'thunderstorm' ? 35 : 12);
        }

        if (this.audioSynth) this.audioSynth.playUiBeep();
      });
    });

    // Refresh weather button
    const refreshBtn = document.getElementById('refreshWeatherBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        if (this.currentCity) {
          refreshBtn.classList.add('spin-anim');
          await this.loadCity(this.currentCity);
          setTimeout(() => refreshBtn.classList.remove('spin-anim'), 600);
        }
      });
    }

    // Quick easter egg: Click title for shooting star
    const titleEl = document.querySelector('.brand-title');
    if (titleEl) {
      titleEl.addEventListener('click', () => {
        this.weatherFX.triggerShootingStar();
        if (this.audioSynth) this.audioSynth.playUiBeep();
      });
    }
  }

  renderSearchResults(cities) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    if (cities.length === 0) {
      searchResults.innerHTML = `<div class="search-empty">No cities found</div>`;
      searchResults.classList.add('active');
      return;
    }

    searchResults.innerHTML = cities.map((c, idx) => `
      <div class="search-item" data-idx="${idx}">
        <span class="city-name">${c.name}</span>
        <span class="city-sub">${c.admin1 ? c.admin1 + ', ' : ''}${c.country}</span>
      </div>
    `).join('');

    searchResults.classList.add('active');

    const items = searchResults.querySelectorAll('.search-item');
    items.forEach(item => {
      item.addEventListener('click', async () => {
        const idx = parseInt(item.dataset.idx, 10);
        const selected = cities[idx];
        if (selected) {
          searchResults.classList.remove('active');
          const searchInput = document.getElementById('citySearchInput');
          if (searchInput) searchInput.value = `${selected.name}, ${selected.country}`;
          await this.loadCity(selected);
        }
      });
    });
  }

  async loadCity(city) {
    this.currentCity = city;
    localStorage.setItem('pixel_last_city', JSON.stringify(city));

    // Synchronize active preset city pill if current city matches
    const presetPills = document.querySelectorAll('.preset-city-pill');
    presetPills.forEach(pill => {
      if (pill.dataset.city && pill.dataset.city.toLowerCase() === (city.name || '').toLowerCase()) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Show loading state
    const loader = document.getElementById('weatherLoader');
    if (loader) loader.classList.add('is-loading');

    try {
      this.weatherData = await WeatherAPI.fetchWeatherData(city.latitude, city.longitude, city.timezone);
      this.renderWeatherDisplay();

      // Apply environmental background theme
      if (!this.isManualSim) {
        this.applyAtmosphere(
          this.weatherData.timeOfDay,
          this.weatherData.current.weatherInfo.type,
          this.weatherData.current.isDay,
          this.weatherData.current.windSpeed
        );
      }

      this.startCityClock(city.timezone);
    } catch (err) {
      console.error("Failed to load weather for city:", city.name, err);
      // Fallback display if network issue
      this.renderOfflineFallback(city);
    } finally {
      if (loader) loader.classList.remove('is-loading');
    }
  }

  applyAtmosphere(timeOfDay, condition, isDay, windSpeed = 10) {
    // 1. Update cityscape architecture, windows & celestial objects
    this.cityEngine.updateAtmosphere(timeOfDay, condition, isDay);

    // 2. Update weather FX particles (Rain, Snow, Lightning, Fog, Stars)
    this.weatherFX.setCondition(condition, timeOfDay, windSpeed);

    // 3. Update procedural audio generators (Rain, Wind, City Drone)
    if (this.audioSynth) {
      this.audioSynth.updateWeatherSound(condition, windSpeed);
    }

    // 4. Update HUD theme badges
    const timeBadge = document.getElementById('hudTimeBadge');
    if (timeBadge) {
      timeBadge.textContent = timeOfDay.toUpperCase();
      timeBadge.className = `badge time-tag time-${timeOfDay}`;
    }
  }

  startCityClock(timezone) {
    if (this.clockInterval) clearInterval(this.clockInterval);

    const clockEl = document.getElementById('localClockDisplay');
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        const dateStr = now.toLocaleDateString('en-US', {
          timeZone: timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        if (clockEl) {
          clockEl.innerHTML = `
            <span class="clock-time">${timeStr}</span>
            <span class="clock-date">${dateStr}</span>
          `;
        }
      } catch (e) {
        if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();
      }
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  renderWeatherDisplay() {
    const data = this.weatherData;
    if (!data) return;

    const current = data.current;
    const isF = this.tempUnit === 'F';
    const tempMain = WeatherAPI.convertTemp(current.temperature, this.tempUnit);
    const feelsLike = WeatherAPI.convertTemp(current.apparentTemp, this.tempUnit);
    const tempMax = WeatherAPI.convertTemp(current.tempMaxToday, this.tempUnit);
    const tempMin = WeatherAPI.convertTemp(current.tempMinToday, this.tempUnit);

    // City heading & location
    const cityNameEl = document.getElementById('displayCityName');
    const countryEl = document.getElementById('displayCountryName');
    if (cityNameEl) cityNameEl.textContent = this.currentCity.name;
    if (countryEl) countryEl.textContent = `${this.currentCity.admin1 ? this.currentCity.admin1 + ', ' : ''}${this.currentCity.country}`;

    // Temperature & Condition
    const mainTempEl = document.getElementById('mainTempNumber');
    const feelsLikeEl = document.getElementById('feelsLikeText');
    const hiLowEl = document.getElementById('hiLowText');
    const conditionBadgeEl = document.getElementById('conditionBadge');
    const weatherIconContainer = document.getElementById('weatherIconContainer');

    if (mainTempEl) mainTempEl.textContent = `${tempMain}°`;
    if (feelsLikeEl) feelsLikeEl.textContent = `Feels like ${feelsLike}°${this.tempUnit}`;
    if (hiLowEl) hiLowEl.textContent = `H: ${tempMax}° L: ${tempMin}°`;
    if (conditionBadgeEl) conditionBadgeEl.textContent = current.weatherInfo.label;
    if (weatherIconContainer) weatherIconContainer.innerHTML = this.getPixelWeatherSVG(current.weatherInfo.icon);

    // Detailed metrics
    const humidityEl = document.getElementById('valHumidity');
    const windEl = document.getElementById('valWind');
    const pressureEl = document.getElementById('valPressure');
    const cloudsEl = document.getElementById('valClouds');
    const sunriseEl = document.getElementById('valSunrise');
    const sunsetEl = document.getElementById('valSunset');

    if (humidityEl) humidityEl.textContent = `${current.humidity}%`;
    if (windEl) windEl.textContent = `${current.windSpeed} km/h`;
    if (pressureEl) pressureEl.textContent = `${current.pressure} hPa`;
    if (cloudsEl) cloudsEl.textContent = `${current.cloudCover}%`;

    if (sunriseEl && data.todaySunrise) {
      sunriseEl.textContent = data.todaySunrise.toLocaleTimeString('en-US', {
        timeZone: data.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    if (sunsetEl && data.todaySunset) {
      sunsetEl.textContent = data.todaySunset.toLocaleTimeString('en-US', {
        timeZone: data.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // Render Hourly Forecast Cards (24 hours)
    const hourlyContainer = document.getElementById('hourlyScrollContainer');
    if (hourlyContainer && data.hourlyForecast) {
      hourlyContainer.innerHTML = data.hourlyForecast.map(h => {
        const hTemp = WeatherAPI.convertTemp(h.temp, this.tempUnit);
        return `
          <div class="hourly-card">
            <span class="hourly-time">${h.hourLabel}</span>
            <div class="hourly-icon">${this.getPixelWeatherSVG(h.weatherInfo.icon, 28)}</div>
            <span class="hourly-temp">${hTemp}°</span>
            <div class="hourly-precip ${h.precipProb > 20 ? 'has-precip' : ''}">
              <span class="precip-drop">💧</span>
              <span class="precip-text">${h.precipProb}%</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render 7-Day Daily Forecast Cards
    const dailyContainer = document.getElementById('dailyForecastList');
    if (dailyContainer && data.forecastDays) {
      dailyContainer.innerHTML = data.forecastDays.map((d, index) => {
        const dMax = WeatherAPI.convertTemp(d.tempMax, this.tempUnit);
        const dMin = WeatherAPI.convertTemp(d.tempMin, this.tempUnit);
        
        return `
          <div class="daily-row ${index === 0 ? 'is-today' : ''}">
            <div class="daily-day">
              <span class="day-name">${d.dayName}</span>
              ${index === 0 ? '<span class="today-tag">NOW</span>' : ''}
            </div>
            <div class="daily-condition">
              <span class="daily-icon">${this.getPixelWeatherSVG(d.weatherInfo.icon, 24)}</span>
              <span class="daily-label">${d.weatherInfo.label}</span>
            </div>
            <div class="daily-precip-bar">
              ${d.precipProb > 10 ? `<span class="rain-chance">💧 ${d.precipProb}%</span>` : `<span class="rain-dry">--</span>`}
            </div>
            <div class="daily-temp-range">
              <span class="temp-min">${dMin}°</span>
              <div class="range-bar-track">
                <div class="range-bar-fill" style="width: ${Math.min(100, Math.max(20, (dMax - dMin) * 8))}%;"></div>
              </div>
              <span class="temp-max">${dMax}°</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderOfflineFallback(city) {
    const cityNameEl = document.getElementById('displayCityName');
    const mainTempEl = document.getElementById('mainTempNumber');
    const conditionBadgeEl = document.getElementById('conditionBadge');

    if (cityNameEl) cityNameEl.textContent = `${city.name} (Sim)`;
    if (mainTempEl) mainTempEl.textContent = `22°`;
    if (conditionBadgeEl) conditionBadgeEl.textContent = "Partly Cloudy";

    this.applyAtmosphere('day', 'partly_cloudy', true, 10);
  }

  /**
   * Crisp, custom Pixel-Art SVG icons
   */
  getPixelWeatherSVG(iconType, size = 48) {
    switch (iconType) {
      case 'sun':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg sun-svg">
            <rect x="6" y="2" width="4" height="2" fill="#ffd166"/>
            <rect x="6" y="12" width="4" height="2" fill="#ffd166"/>
            <rect x="2" y="6" width="2" height="4" fill="#ffd166"/>
            <rect x="12" y="6" width="2" height="4" fill="#ffd166"/>
            <rect x="4" y="4" width="8" height="8" fill="#ffb703"/>
            <rect x="5" y="5" width="6" height="6" fill="#ffe49e"/>
          </svg>`;
      case 'moon':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg moon-svg">
            <rect x="5" y="3" width="5" height="10" fill="#e2e8f0"/>
            <rect x="10" y="4" width="2" height="8" fill="#e2e8f0"/>
            <rect x="8" y="5" width="2" height="2" fill="#94a3b8"/>
            <rect x="6" y="9" width="3" height="2" fill="#94a3b8"/>
            <rect x="3" y="5" width="2" height="6" fill="#f8fafc"/>
          </svg>`;
      case 'cloud':
      case 'cloudy':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg cloud-svg">
            <rect x="5" y="5" width="6" height="4" fill="#cbd5e1"/>
            <rect x="3" y="8" width="10" height="4" fill="#94a3b8"/>
            <rect x="4" y="7" width="8" height="4" fill="#e2e8f0"/>
          </svg>`;
      case 'cloud-sun':
      case 'sun-cloud':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg sun-cloud-svg">
            <rect x="3" y="2" width="5" height="5" fill="#ffd166"/>
            <rect x="4" y="6" width="9" height="5" fill="#cbd5e1"/>
            <rect x="5" y="5" width="7" height="5" fill="#f1f5f9"/>
          </svg>`;
      case 'rain':
      case 'rain-light':
      case 'rain-heavy':
      case 'drizzle':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg rain-svg">
            <rect x="3" y="4" width="10" height="5" fill="#64748b"/>
            <rect x="4" y="3" width="8" height="5" fill="#94a3b8"/>
            <rect x="4" y="11" width="1" height="3" fill="#60a5fa"/>
            <rect x="7" y="10" width="1" height="3" fill="#60a5fa"/>
            <rect x="10" y="12" width="1" height="3" fill="#60a5fa"/>
          </svg>`;
      case 'thunder':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg thunder-svg">
            <rect x="3" y="3" width="10" height="4" fill="#475569"/>
            <rect x="4" y="2" width="8" height="4" fill="#64748b"/>
            <polygon points="8,7 6,11 9,11 7,15 11,10 8,10" fill="#ffd166"/>
          </svg>`;
      case 'snow':
      case 'snow-heavy':
      case 'sleet':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg snow-svg">
            <rect x="3" y="4" width="10" height="4" fill="#94a3b8"/>
            <rect x="4" y="10" width="2" height="2" fill="#ffffff"/>
            <rect x="8" y="12" width="2" height="2" fill="#ffffff"/>
            <rect x="11" y="9" width="2" height="2" fill="#ffffff"/>
          </svg>`;
      case 'fog':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg fog-svg">
            <rect x="3" y="5" width="10" height="2" fill="#94a3b8"/>
            <rect x="2" y="8" width="12" height="2" fill="#cbd5e1"/>
            <rect x="4" y="11" width="8" height="2" fill="#94a3b8"/>
          </svg>`;
      default:
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 16 16" class="pixel-svg default-svg">
            <rect x="4" y="4" width="8" height="8" fill="#ffd166"/>
          </svg>`;
    }
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WeatherDashboardApp();
});
