// ========== WEATHER INPUT ==========
// This file adds real-time weather effects to your creature's world.
// The background and particles change based on actual weather at your location.

// ========== WEATHER OVERRIDE (for testing) ==========
// Set these to test different conditions without waiting for real weather.
let overrideWeather = null;   // 'sunny', 'cloudy', 'rainy', 'stormy', 'snowy', or null
let overrideIsDay = null;     // true, false, or null

// ========== SETTINGS ==========
const WEATHER_UPDATE_INTERVAL = 600000; // Update every 10 minutes
const DEFAULT_LATITUDE = -41.29;        // Wellington, NZ
const DEFAULT_LONGITUDE = 174.78;

// ========== SKY COLORS ==========
let skyColorPalette;
let skyTopColor, skyBottomColor;
let targetSkyTop, targetSkyBottom;
const SKY_LERP_SPEED = 0.015;

// ========== PARTICLE SYSTEMS ==========
let raindrops = [];
let snowflakes = [];
let stars = [];
let clouds = [];

// ========== WEATHER STATE ==========
let weather = {
  loaded: false,
  fetching: false,
  error: false,
  temperature: 20,
  condition: 'unknown',
  isDay: true,
  lastUpdate: 0
};

// ========== INITIALIZATION ==========

function initWeather() {
  // Sky color palette
  skyColorPalette = {
    sunny:   { top: color(100, 160, 220), bottom: color(160, 200, 240) },
    cloudy:  { top: color(120, 130, 150), bottom: color(150, 160, 175) },
    rainy:   { top: color(60, 70, 90),    bottom: color(80, 90, 110) },
    stormy:  { top: color(30, 35, 50),    bottom: color(50, 45, 65) },
    snowy:   { top: color(170, 180, 200), bottom: color(200, 210, 225) },
    night:   { top: color(10, 10, 30),    bottom: color(20, 15, 40) },
    default: { top: color(26, 26, 46),    bottom: color(40, 35, 50) },
  };

  skyTopColor = skyColorPalette.default.top;
  skyBottomColor = skyColorPalette.default.bottom;
  targetSkyTop = skyColorPalette.default.top;
  targetSkyBottom = skyColorPalette.default.bottom;

  // Initialize particle systems
  initRain();
  initSnow();
  initStars();
  initClouds();

  // Fetch weather
  fetchWeather();
}

function initRain() {
  raindrops = [];
  for (let i = 0; i < 150; i++) {
    raindrops.push({
      x: random(width),
      y: random(-height, height),
      speed: random(15, 25),
      length: random(10, 25),
      thickness: random(1, 2.5)
    });
  }
}

function initSnow() {
  snowflakes = [];
  for (let i = 0; i < 100; i++) {
    snowflakes.push({
      x: random(width),
      y: random(-50, height),
      size: random(2, 6),
      speed: random(1, 3),
      wobble: random(TWO_PI),
      wobbleSpeed: random(0.02, 0.05)
    });
  }
}

function initStars() {
  stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.7),
      size: random(1, 3),
      twinkleSpeed: random(0.02, 0.08),
      twinkleOffset: random(TWO_PI)
    });
  }
}

function initClouds() {
  clouds = [];
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: random(width),
      y: random(50, height * 0.4),
      size: random(100, 250),
      speed: random(0.1, 0.3),
      opacity: random(30, 60)
    });
  }
}

// ========== UPDATE ==========

function updateWeather() {
  // Refresh weather data periodically
  if (!weather.fetching && Date.now() - weather.lastUpdate > WEATHER_UPDATE_INTERVAL) {
    fetchWeather();
  }

  // Update target sky colors
  if (weather.loaded || overrideWeather !== null) {
    let currentCondition = overrideWeather !== null ? overrideWeather : weather.condition;
    let currentIsDay = overrideIsDay !== null ? overrideIsDay : weather.isDay;

    let skyKey = skyColorPalette[currentCondition] ? currentCondition : 'default';
    if (!currentIsDay) skyKey = 'night';

    targetSkyTop = skyColorPalette[skyKey].top;
    targetSkyBottom = skyColorPalette[skyKey].bottom;
  }

  // Smooth color transitions
  skyTopColor = lerpColor(skyTopColor, targetSkyTop, SKY_LERP_SPEED);
  skyBottomColor = lerpColor(skyBottomColor, targetSkyBottom, SKY_LERP_SPEED);
}

// ========== DRAWING ==========

function drawWeatherBackground() {
  // Gradient sky (draw bands every 4px for better performance)
  noStroke();
  for (let y = 0; y < height; y += 4) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(skyTopColor, skyBottomColor, inter);
    fill(c);
    rect(0, y, width, 4);
  }
}

function drawWeatherParticles() {
  let currentCondition = overrideWeather !== null ? overrideWeather : weather.condition;
  let currentIsDay = overrideIsDay !== null ? overrideIsDay : weather.isDay;

  // Night: stars
  if (!currentIsDay) {
    drawStars();
  }

  // Cloudy/rainy/stormy: clouds
  if (currentCondition === 'cloudy' || currentCondition === 'rainy' || currentCondition === 'stormy') {
    drawClouds();
  }

  // Sunny: sun glow
  if (currentCondition === 'sunny' && currentIsDay) {
    drawSunGlow();
  }

  // Rain
  if (currentCondition === 'rainy' || currentCondition === 'stormy') {
    drawRain();
  }

  // Snow
  if (currentCondition === 'snowy') {
    drawSnow();
  }

  // Storm: lightning
  if (currentCondition === 'stormy' && random() < 0.003) {
    drawLightning();
  }
}

function drawStars() {
  noStroke();
  for (let star of stars) {
    let twinkle = sin(frameCount * star.twinkleSpeed + star.twinkleOffset);
    let alpha = map(twinkle, -1, 1, 80, 255);
    fill(255, 255, 255, alpha);
    ellipse(star.x, star.y, star.size, star.size);
  }
}

function drawClouds() {
  noStroke();
  for (let cloud of clouds) {
    // Move clouds slowly
    cloud.x += cloud.speed;
    if (cloud.x > width + cloud.size) {
      cloud.x = -cloud.size;
    }

    // Draw cloud as overlapping ellipses
    fill(255, 255, 255, cloud.opacity);
    ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
    ellipse(cloud.x - cloud.size * 0.3, cloud.y + 10, cloud.size * 0.7, cloud.size * 0.5);
    ellipse(cloud.x + cloud.size * 0.35, cloud.y + 5, cloud.size * 0.6, cloud.size * 0.45);
  }
}

function drawSunGlow() {
  // Soft sun glow in top right
  let sunX = width * 0.85;
  let sunY = height * 0.15;

  noStroke();
  for (let r = 200; r > 0; r -= 20) {
    let alpha = map(r, 0, 200, 80, 0);
    fill(255, 240, 180, alpha);
    ellipse(sunX, sunY, r, r);
  }

  // Sun core
  fill(255, 250, 220);
  ellipse(sunX, sunY, 60, 60);
}

function drawRain() {
  stroke(150, 180, 210, 180);
  for (let drop of raindrops) {
    strokeWeight(drop.thickness);
    line(drop.x, drop.y, drop.x + 2, drop.y + drop.length);

    // Move raindrop
    drop.y += drop.speed;
    drop.x += 2; // Wind effect

    // Reset when off screen
    if (drop.y > height) {
      drop.y = random(-50, -10);
      drop.x = random(-50, width);
    }
  }
  noStroke();
}

function drawSnow() {
  noStroke();
  fill(255, 255, 255, 220);
  for (let flake of snowflakes) {
    // Wobble sideways
    flake.wobble += flake.wobbleSpeed;
    let wobbleX = sin(flake.wobble) * 2;

    ellipse(flake.x + wobbleX, flake.y, flake.size, flake.size);

    // Move snowflake
    flake.y += flake.speed;
    flake.x += wobbleX * 0.1;

    // Reset when off screen
    if (flake.y > height + 10) {
      flake.y = random(-50, -10);
      flake.x = random(width);
    }
  }
}

function drawLightning() {
  // Flash
  push();
  blendMode(ADD);
  fill(255, 255, 255, 150);
  rect(0, 0, width, height);
  pop();

  // Lightning bolt
  stroke(255, 255, 255, 200);
  strokeWeight(3);
  let x = random(width * 0.2, width * 0.8);
  let y = 0;
  beginShape();
  vertex(x, y);
  for (let i = 0; i < 8; i++) {
    y += random(30, 60);
    x += random(-30, 30);
    vertex(x, y);
  }
  endShape();
  noStroke();
}

// ========== WEATHER API ==========

async function fetchWeather() {
  weather.fetching = true;

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherForLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.log('Location unavailable, using default');
        fetchWeatherForLocation(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
      },
      { timeout: 5000 }
    );
  } else {
    fetchWeatherForLocation(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
  }
}

async function fetchWeatherForLocation(lat, lon) {
  try {
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`;
    let response = await fetch(url);
    let data = await response.json();

    weather.temperature = data.current.temperature_2m;
    weather.isDay = data.current.is_day === 1;
    weather.condition = weatherCodeToCondition(data.current.weather_code);
    weather.loaded = true;
    weather.fetching = false;
    weather.lastUpdate = Date.now();

    console.log(`Weather loaded: ${weather.temperature}°C, ${weather.condition}, ${weather.isDay ? 'day' : 'night'}`);
  } catch (error) {
    console.log('Weather fetch failed:', error);
    weather.error = true;
    weather.condition = 'cloudy';
    weather.loaded = true;
    weather.fetching = false;
    weather.lastUpdate = Date.now();
  }
}

function weatherCodeToCondition(code) {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 59) return 'cloudy';
  if (code <= 69) return 'rainy';
  if (code <= 79) return 'snowy';
  if (code <= 86) return 'snowy';
  if (code >= 95) return 'stormy';
  return 'cloudy';
}

function getWeatherDebugText() {
  if (overrideWeather !== null || overrideIsDay !== null) {
    let condition = overrideWeather !== null ? overrideWeather : weather.condition;
    let isDay = overrideIsDay !== null ? overrideIsDay : weather.isDay;
    return `Weather: ${condition}, Day: ${isDay} (OVERRIDE)`;
  }
  if (weather.loaded) {
    return `Weather: ${weather.condition}, ${weather.temperature.toFixed(1)}°C, Day: ${weather.isDay}`;
  }
  return 'Weather: loading...';
}

