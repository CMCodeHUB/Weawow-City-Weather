/* ==========================================================================
   PIXEL ART CITY WEATHER DASHBOARD - WEATHER API SERVICE
   Open-Meteo Integration with Geocoding, WMO Interpretation & Time of Day
   ========================================================================== */

const WeatherAPI = {
  // Preset fallback data for instantaneous startup or offline fallback
  PRESET_CITIES: [
    { name: "Kolkata", country: "India", country_code: "IN", latitude: 22.5726, longitude: 88.3639, timezone: "Asia/Kolkata" },
    { name: "Mumbai", country: "India", country_code: "IN", latitude: 19.0760, longitude: 72.8777, timezone: "Asia/Kolkata" },
    { name: "Delhi", country: "India", country_code: "IN", latitude: 28.6139, longitude: 77.2090, timezone: "Asia/Kolkata" },
    { name: "Bengaluru", country: "India", country_code: "IN", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
    { name: "Chennai", country: "India", country_code: "IN", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
    { name: "Hyderabad", country: "India", country_code: "IN", latitude: 17.3850, longitude: 78.4867, timezone: "Asia/Kolkata" },
    { name: "Jaipur", country: "India", country_code: "IN", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" }
  ],

  // WMO Weather interpretation codes
  // WMO code map: category, label, pixel icon type
  WMO_MAP: {
    0:  { label: "Clear Sky", type: "clear", icon: "sun" },
    1:  { label: "Mainly Clear", type: "clear", icon: "sun-cloud" },
    2:  { label: "Partly Cloudy", type: "partly_cloudy", icon: "cloud-sun" },
    3:  { label: "Overcast", type: "cloudy", icon: "cloud" },
    45: { label: "Foggy Mist", type: "fog", icon: "fog" },
    48: { label: "Depositing Rime Fog", type: "fog", icon: "fog" },
    51: { label: "Light Drizzle", type: "drizzle", icon: "drizzle" },
    53: { label: "Moderate Drizzle", type: "drizzle", icon: "drizzle" },
    55: { label: "Dense Drizzle", type: "drizzle", icon: "rain" },
    56: { label: "Freezing Drizzle", type: "snow", icon: "sleet" },
    57: { label: "Heavy Freezing Drizzle", type: "snow", icon: "snow" },
    61: { label: "Slight Rain", type: "rain", icon: "rain-light" },
    63: { label: "Moderate Rain", type: "rain", icon: "rain" },
    65: { label: "Heavy Rain", type: "rain", icon: "rain-heavy" },
    66: { label: "Freezing Rain", type: "snow", icon: "sleet" },
    67: { label: "Heavy Freezing Rain", type: "snow", icon: "snow" },
    71: { label: "Slight Snow Fall", type: "snow", icon: "snow" },
    73: { label: "Moderate Snow Fall", type: "snow", icon: "snow" },
    75: { label: "Heavy Snow Fall", type: "snow", icon: "snow-heavy" },
    77: { label: "Snow Grains", type: "snow", icon: "snow" },
    80: { label: "Slight Rain Showers", type: "rain", icon: "rain-light" },
    81: { label: "Moderate Showers", type: "rain", icon: "rain" },
    82: { label: "Violent Showers", type: "rain", icon: "rain-heavy" },
    85: { label: "Slight Snow Showers", type: "snow", icon: "snow" },
    86: { label: "Heavy Snow Showers", type: "snow", icon: "snow-heavy" },
    95: { label: "Thunderstorm", type: "thunderstorm", icon: "thunder" },
    96: { label: "Thunderstorm with Hail", type: "thunderstorm", icon: "thunder" },
    99: { label: "Severe Thunderstorm", type: "thunderstorm", icon: "thunder" }
  },

  getWeatherInfo(wmoCode, isDay = 1) {
    const defaultInfo = { label: "Moderate Conditions", type: "clear", icon: isDay ? "sun" : "moon" };
    const info = this.WMO_MAP[wmoCode] || defaultInfo;
    let icon = info.icon;
    if (!isDay && (icon === 'sun' || icon === 'sun-cloud' || icon === 'cloud-sun')) {
      icon = icon === 'sun' ? 'moon' : 'moon-cloud';
    }
    return {
      label: info.label,
      type: info.type,
      icon: icon
    };
  },

  /**
   * Search for cities using Open-Meteo Geocoding API
   */
  async searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      if (!data.results) return [];

      return data.results.map(city => ({
        name: city.name,
        country: city.country || "",
        country_code: city.country_code || "",
        admin1: city.admin1 || "",
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone || "UTC"
      }));
    } catch (err) {
      console.warn("Geocoding fetch error:", err);
      // Fallback matching in local preset cities
      const q = query.toLowerCase();
      return this.PRESET_CITIES.filter(c => c.name.toLowerCase().includes(q));
    }
  },

  /**
   * Fetch complete weather and forecast for given coordinates
   */
  async fetchWeatherData(lat, lon, timezone = "auto") {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m` +
        `&hourly=temperature_2m,precipitation_probability,weather_code,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=${encodeURIComponent(timezone)}` +
        `&forecast_days=7`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);
      const data = await res.json();
      return this.parseWeatherData(data);
    } catch (err) {
      console.error("Weather API Error:", err);
      throw err;
    }
  },

  /**
   * Parse API response into clean UI-ready format
   */
  parseWeatherData(data) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    const tz = data.timezone || "UTC";

    // Calculate time of day based on current local time vs sunrise and sunset
    const nowLocal = new Date(current.time);
    const todaySunrise = daily.sunrise && daily.sunrise[0] ? new Date(daily.sunrise[0]) : null;
    const todaySunset = daily.sunset && daily.sunset[0] ? new Date(daily.sunset[0]) : null;

    const timeOfDay = this.calculateTimeOfDay(nowLocal, todaySunrise, todaySunset, current.is_day);
    const weatherInfo = this.getWeatherInfo(current.weather_code, current.is_day);

    // Format 7-Day Daily Forecast
    const forecastDays = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const dateObj = new Date(daily.time[i] + "T00:00:00");
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const dayWmo = daily.weather_code[i];
        const dayInfo = this.getWeatherInfo(dayWmo, 1);

        forecastDays.push({
          date: daily.time[i],
          dayName: dayName,
          weatherCode: dayWmo,
          weatherInfo: dayInfo,
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          precipProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
          precipSum: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
          windMax: daily.wind_speed_10m_max ? Math.round(daily.wind_speed_10m_max[i]) : 0,
          sunrise: daily.sunrise ? daily.sunrise[i] : null,
          sunset: daily.sunset ? daily.sunset[i] : null
        });
      }
    }

    // Format Next 24-Hour Timeline
    const hourlyForecast = [];
    if (hourly && hourly.time) {
      const currentIsoHour = current.time.slice(0, 13);
      let startIndex = hourly.time.findIndex(t => t.startsWith(currentIsoHour));
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < Math.min(startIndex + 24, hourly.time.length); i++) {
        const hourTime = new Date(hourly.time[i]);
        const hourLabel = i === startIndex ? "Now" : hourTime.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
        const hourWmo = hourly.weather_code[i];
        const isDayHour = hourly.is_day ? hourly.is_day[i] : 1;
        const hourInfo = this.getWeatherInfo(hourWmo, isDayHour);

        hourlyForecast.push({
          time: hourly.time[i],
          hourLabel: hourLabel,
          temp: Math.round(hourly.temperature_2m[i]),
          weatherInfo: hourInfo,
          precipProb: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
          isDay: isDayHour
        });
      }
    }

    return {
      timezone: tz,
      current: {
        time: current.time,
        temperature: Math.round(current.temperature_2m),
        apparentTemp: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        cloudCover: current.cloud_cover,
        precipitation: current.precipitation,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m,
        pressure: Math.round(current.pressure_msl),
        isDay: current.is_day === 1,
        weatherCode: current.weather_code,
        weatherInfo: weatherInfo,
        tempMaxToday: forecastDays[0] ? forecastDays[0].tempMax : Math.round(current.temperature_2m),
        tempMinToday: forecastDays[0] ? forecastDays[0].tempMin : Math.round(current.temperature_2m)
      },
      timeOfDay: timeOfDay, // 'dawn' | 'day' | 'sunset' | 'night'
      todaySunrise: todaySunrise,
      todaySunset: todaySunset,
      forecastDays: forecastDays,
      hourlyForecast: hourlyForecast
    };
  },

  /**
   * Determine whether the atmosphere is Dawn, Day, Sunset, or Night
   */
  calculateTimeOfDay(now, sunrise, sunset, isDayFlag) {
    if (!sunrise || !sunset) {
      return isDayFlag === 1 ? 'day' : 'night';
    }

    const nowTime = now.getTime();
    const sunriseTime = sunrise.getTime();
    const sunsetTime = sunset.getTime();

    const dawnWindowStart = sunriseTime - 45 * 60 * 1000;
    const dawnWindowEnd = sunriseTime + 60 * 60 * 1000;

    const sunsetWindowStart = sunsetTime - 60 * 60 * 1000;
    const sunsetWindowEnd = sunsetTime + 45 * 60 * 1000;

    if (nowTime >= dawnWindowStart && nowTime <= dawnWindowEnd) {
      return 'dawn';
    } else if (nowTime > dawnWindowEnd && nowTime < sunsetWindowStart) {
      return 'day';
    } else if (nowTime >= sunsetWindowStart && nowTime <= sunsetWindowEnd) {
      return 'sunset';
    } else {
      return 'night';
    }
  },

  /**
   * Format degrees Celsius to Fahrenheit if requested
   */
  convertTemp(celsius, unit = 'C') {
    if (unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }
};

window.WeatherAPI = WeatherAPI;
