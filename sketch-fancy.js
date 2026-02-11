// ============================================
// WEATHER BLOB - A creature that reacts to weather!
// ============================================
// Features:
// - Sunny: Glows warmly with radial glow effect
// - Rainy: Holds an umbrella above its head
// - Windy/Stormy: Umbrella flips inside-out
// - Cold: Shivers more intensely
// - Night: Slower animations, droopier eyes

const FEED_AMOUNT = 20;               // How much clicking helps
const DECAY_RATE = 0.005;             // How fast need increases
const AWAY_DECAY_RATE = 0.15;         // Decay when not focused

// Creature colors for each mood (initialized in setup)
let creatureColors;

// ============================================
// STONE COLLECTION SYSTEM
// ============================================

const STONE_TYPES = [
  { name: 'Blue Stone',    rgb: [100, 150, 255] },
  { name: 'Orange Stone',  rgb: [255, 150, 80] },
  { name: 'Green Stone',   rgb: [100, 200, 120] },
  { name: 'Pink Stone',    rgb: [255, 130, 180] },
  { name: 'Gold Stone',    rgb: [255, 215, 100] },
  { name: 'Purple Stone',  rgb: [180, 100, 255] },
];

let stoneInventory = [];          // Collected stones
let activeStoneColor = null;      // Currently applied stone color
let lastStoneCheck = 0;           // Timer for stone finding
let stoneCheckInterval = 5000;    // Check for new stone every 5 seconds
let stoneFindChance = 0.15;       // 15% chance each check
let notificationsEnabled = false; // Track if we have permission

// ============================================
// CREATURE STATE
// ============================================

let creature = {
  need: 50,             // 0 = happy, 100 = desperate
  mood: 'neutral',      // 'happy', 'neutral', or 'distressed'
  x: 0,
  y: 0,
  baseSize: 300,        // Overall size in pixels (for z_ui_fancy.js)

  // Animation phases
  breathe: 0,
  bob: 0,
  isBlinking: false,
  blinkTimer: 0,

  // Persistence
  lastVisit: null,
  totalVisits: 0,

  // Focus tracking
  isBeingWatched: true,
  timesLeft: 0,
  justReturned: false,
  returnTimer: 0
};

// For z_ui_fancy.js compatibility (expects creatureColor, not currentColor)
let creatureColor, targetColor;


// ============================================
// SETUP
// ============================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  creature.x = width / 2;
  creature.y = height / 2;

  // Create color palette
  creatureColors = {
    happy:      color(145, 137, 240),  // Lavender
    neutral:    color(126, 102, 145),  // Muted purple
    distressed: color(184, 51, 65)     // Reddish
  };

  // Initialize colors
  creatureColor = creatureColors.neutral;
  targetColor = creatureColors.neutral;

  // Initialize weather system
  initWeather();

  // Initialize stone collection
  initStoneSystem();

  // Load saved state
  loadCreatureState();

  // Auto-save
  setInterval(saveCreatureState, 30000);
  window.addEventListener('beforeunload', saveCreatureState);
}


// ============================================
// DRAW LOOP
// ============================================

function draw() {
  // Update weather and draw weather background
  updateWeather();
  drawWeatherBackground();

  updateFocus();
  updateCreature();
  updateStoneSearch();

  // Smooth color transition (use stone color if active, otherwise mood color)
  let finalTargetColor = activeStoneColor ? activeStoneColor : targetColor;
  creatureColor = lerpColor(creatureColor, finalTargetColor, 0.03);

  // Draw weather particles behind creature
  drawWeatherParticles();

  drawCreature();
  drawUI(true);  // Set to false to hide UI
  drawInventory();
}


// ============================================
// INPUT 1: MOUSE
// ============================================

function mousePressed() {
  // Check inventory clicks first
  if (handleInventoryClick()) return;

  // Then check creature click
  let d = dist(mouseX, mouseY, creature.x, creature.y);
  if (d < creature.baseSize) {
    creature.need = max(0, creature.need - FEED_AMOUNT);
  }
}


// ============================================
// INPUT 2: WINDOW FOCUS
// ============================================

function updateFocus() {
  let wasWatching = creature.isBeingWatched;
  creature.isBeingWatched = document.hasFocus();

  if (wasWatching && !creature.isBeingWatched) {
    creature.timesLeft++;
  }
  if (!wasWatching && creature.isBeingWatched) {
    creature.justReturned = true;
    creature.returnTimer = 60;
  }
}


// ============================================
// CREATURE LOGIC
// ============================================

function updateCreature() {
  // Need increases over time (faster when not watching)
  creature.need += creature.isBeingWatched ? DECAY_RATE : AWAY_DECAY_RATE;
  creature.need = constrain(creature.need, 0, 100);

  // Update mood
  if (creature.need <= 30) creature.mood = 'happy';
  else if (creature.need <= 70) creature.mood = 'neutral';
  else creature.mood = 'distressed';

  // Update target color
  targetColor = creatureColors[creature.mood];

  // Animation speed based on time of day
  let currentIsDay = overrideIsDay !== null ? overrideIsDay : weather.isDay;
  let animSpeed = currentIsDay ? 1.0 : 0.6;  // Slower at night

  // Animation phases
  creature.breathe += 0.02 * animSpeed;
  creature.bob += 0.014 * animSpeed;

  // Blinking
  creature.blinkTimer--;
  if (creature.blinkTimer <= 0) {
    creature.isBlinking = !creature.isBlinking;
    creature.blinkTimer = creature.isBlinking ? 6 : random(60, 180);
  }

  // Return animation
  if (creature.justReturned) {
    creature.returnTimer--;
    if (creature.returnTimer <= 0) creature.justReturned = false;
  }
}


// ============================================
// DRAWING THE CREATURE
// ============================================

function drawCreature() {
  push();
  translate(creature.x, creature.y);

  // Animations
  translate(0, sin(creature.bob) * 5);  // Bob

  // Get current weather conditions
  let currentCondition = overrideWeather !== null ? overrideWeather : weather.condition;
  let currentIsDay = overrideIsDay !== null ? overrideIsDay : weather.isDay;

  // Distressed shaking (or cold shivering)
  let shakeAmount = 0;
  if (creature.mood === 'distressed') {
    shakeAmount = 2;
  }
  // Cold shivering (temperature below 10C)
  if (weather.loaded && weather.temperature < 10) {
    shakeAmount = max(shakeAmount, map(weather.temperature, 10, -5, 1, 4));
  }
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount/2, shakeAmount/2));
  }

  let breatheScale = 1 + sin(creature.breathe) * 0.03;
  scale(breatheScale);

  // Return bounce
  if (creature.justReturned) {
    let bounce = sin(creature.returnTimer * 0.5) * 0.1;
    scale(1 + bounce);
  }

  // Sunny glow effect (behind creature)
  if (currentCondition === 'sunny' && currentIsDay) {
    drawCreatureGlow();
  }

  drawBody();
  drawEyes();
  drawMouth();

  // Umbrella for rain/storm
  if (currentCondition === 'rainy' || currentCondition === 'stormy') {
    drawUmbrella(currentCondition === 'stormy');
  }

  pop();
}

function drawCreatureGlow() {
  // Warm glow behind creature when sunny
  noStroke();
  for (let r = 200; r > 0; r -= 25) {
    let alpha = map(r, 0, 200, 60, 0);
    fill(255, 220, 150, alpha);
    ellipse(0, 0, creature.baseSize + r, creature.baseSize * 0.9 + r);
  }
}

function drawBody() {
  noStroke();
  fill(creatureColor);
  ellipse(0, 0, creature.baseSize, creature.baseSize * 0.9);

  // Highlight
  fill(255, 255, 255, 30);
  ellipse(-creature.baseSize * 0.2, -creature.baseSize * 0.2, creature.baseSize * 0.3, creature.baseSize * 0.25);
}

function drawEyes() {
  let eyeSpacing = creature.baseSize * 0.25;
  let eyeY = -creature.baseSize * 0.1;
  let eyeSize = creature.baseSize * 0.25;

  // Get current conditions for droopy eyes
  let currentIsDay = overrideIsDay !== null ? overrideIsDay : weather.isDay;

  // Mood affects eyes
  if (creature.mood === 'distressed') {
    eyeY += 5;
    eyeSize *= 0.9;
  } else if (creature.mood === 'happy') {
    eyeSize *= 1.1;
  }

  // Night: droopy eyes (eyes lower on face)
  if (!currentIsDay) {
    eyeY += 8;
    eyeSize *= 0.95;
  }

  if (creature.isBlinking) {
    // Closed eyes
    stroke(80);
    strokeWeight(2);
    line(-eyeSpacing - eyeSize/2, eyeY, -eyeSpacing + eyeSize/2, eyeY);
    line(eyeSpacing - eyeSize/2, eyeY, eyeSpacing + eyeSize/2, eyeY);
    noStroke();
  } else {
    // Open eyes
    noStroke();
    fill(255);
    ellipse(-eyeSpacing, eyeY, eyeSize);
    ellipse(eyeSpacing, eyeY, eyeSize);

    // Pupils follow mouse
    let angle = atan2(mouseY - creature.y, mouseX - creature.x);
    let pupilMove = min(eyeSize * 0.2, dist(mouseX, mouseY, creature.x, creature.y) * 0.01);
    let px = cos(angle) * pupilMove;
    let py = sin(angle) * pupilMove;

    fill(40);
    let pupilSize = eyeSize * 0.5;
    ellipse(-eyeSpacing + px, eyeY + py, pupilSize);
    ellipse(eyeSpacing + px, eyeY + py, pupilSize);

    // Shine
    fill(255);
    ellipse(-eyeSpacing + px - 2, eyeY + py - 2, pupilSize * 0.3);
    ellipse(eyeSpacing + px - 2, eyeY + py - 2, pupilSize * 0.3);
  }
}

function drawMouth() {
  let mouthY = creature.baseSize * 0.2;

  stroke(80);
  strokeWeight(2);
  noFill();

  if (creature.mood === 'happy') {
    arc(0, mouthY, creature.baseSize * 0.3, creature.baseSize * 0.15, 0, PI);
  } else if (creature.mood === 'neutral') {
    line(-creature.baseSize * 0.1, mouthY, creature.baseSize * 0.1, mouthY);
  } else {
    arc(0, mouthY + 10, creature.baseSize * 0.25, creature.baseSize * 0.12, PI, TWO_PI);
  }
  noStroke();
}


// ============================================
// UMBRELLA (Weather-reactive accessory)
// ============================================

function drawUmbrella(flipped) {
  push();

  // Position above creature's head
  let umbrellaY = -creature.baseSize * 0.55;
  translate(0, umbrellaY);

  // Umbrella sways in wind
  let swayAngle = sin(frameCount * 0.05) * 0.1;
  if (flipped) {
    // Stormy: flip inside out and rotate more dramatically
    swayAngle = sin(frameCount * 0.08) * 0.3;
  }
  rotate(swayAngle);

  // Handle
  stroke(80, 50, 30);
  strokeWeight(4);
  line(0, 0, 0, 50);

  // Handle curve at bottom
  noFill();
  strokeWeight(3);
  arc(8, 50, 16, 16, 0, PI);

  noStroke();

  if (flipped) {
    // Inside-out umbrella (stormy)
    fill(180, 60, 80);  // Reddish umbrella

    // Inverted canopy (cup shape facing up)
    beginShape();
    vertex(-60, 10);
    bezierVertex(-50, -20, -20, -30, 0, -25);
    bezierVertex(20, -30, 50, -20, 60, 10);
    bezierVertex(30, 5, 0, 0, 0, 0);
    bezierVertex(0, 0, -30, 5, -60, 10);
    endShape(CLOSE);

    // Umbrella ribs (bent outward)
    stroke(60, 30, 40);
    strokeWeight(2);
    line(0, 0, -50, 5);
    line(0, 0, -25, -15);
    line(0, 0, 25, -15);
    line(0, 0, 50, 5);
  } else {
    // Normal umbrella (rainy)
    fill(255, 100, 120);  // Pink umbrella

    // Canopy (dome shape)
    arc(0, 0, 120, 60, PI, TWO_PI);

    // Scalloped edge
    fill(230, 80, 100);
    for (let i = -2; i <= 2; i++) {
      arc(i * 24, 0, 26, 15, 0, PI);
    }

    // Umbrella ribs
    stroke(180, 60, 80);
    strokeWeight(1);
    for (let i = -2; i <= 2; i++) {
      line(0, -5, i * 24, 0);
    }
  }

  pop();
}


// ============================================
// WINDOW RESIZE
// ============================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  creature.x = width / 2;
  creature.y = height / 2;

  // Reinitialize particles for new size
  initRain();
  initSnow();
  initStars();
  initClouds();
}


// ============================================
// STONE COLLECTION SYSTEM
// ============================================

function initStoneSystem() {
  // Request notification permission
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      notificationsEnabled = true;
      console.log("notifications are enabled, the creature will occasionally find precious stones 💎")
      console.log("notifications only appear if browser has been given permission to use notifications at system level")
    } else if (Notification.permission !== 'denied') {
      console.log("notifications are not enabled")
      Notification.requestPermission().then(permission => {
        notificationsEnabled = (permission === 'granted');
      });
    }
  }

  // Load saved inventory
  loadStoneInventory();

  lastStoneCheck = millis();
}

function updateStoneSearch() {
  // Check for new stones periodically
  if (millis() - lastStoneCheck > stoneCheckInterval) {
    lastStoneCheck = millis();

    // Random chance to find a stone
    if (random() < stoneFindChance) {
      findRandomStone();
    }
  }
}

function findRandomStone() {
  // Pick a random stone type
  let stoneType = random(STONE_TYPES);

  // Add to inventory
  stoneInventory.push({
    name: stoneType.name,
    rgb: stoneType.rgb,
    foundAt: Date.now()
  });

  // Save inventory
  saveStoneInventory();

  // Send notification
  sendStoneNotification(stoneType.name);
}

function sendStoneNotification(stoneName) {
  if (notificationsEnabled && 'Notification' in window) {
    new Notification('Stone Found!', {
      body: `Your creature found a ${stoneName}!`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💎</text></svg>'
    });
  }

  // Also log to console as backup
  console.log(`Found: ${stoneName}!`);
}

function drawInventory() {
  if (stoneInventory.length === 0) return;

  let stoneSize = 40;
  let padding = 10;
  let startX = width - padding - stoneSize;
  let startY = height - padding - stoneSize;

  // Draw label
  fill(255, 200);
  noStroke();
  textSize(12);
  textAlign(RIGHT, BOTTOM);
  text('Stones (click to use)', startX + stoneSize, startY - 5);

  // Draw "Clear" button if a stone is active
  if (activeStoneColor) {
    fill(255, 100);
    textSize(10);
    text('[clear]', startX - (stoneInventory.length * (stoneSize + padding)) - 10, startY + stoneSize/2 + 4);
  }

  // Draw each stone
  for (let i = 0; i < stoneInventory.length; i++) {
    let stone = stoneInventory[i];
    let x = startX - i * (stoneSize + padding);
    let y = startY;

    // Stone glow/shadow
    noStroke();
    fill(0, 0, 0, 50);
    ellipse(x + stoneSize/2 + 2, y + stoneSize/2 + 2, stoneSize * 0.9);

    // Stone body
    fill(stone.rgb[0], stone.rgb[1], stone.rgb[2]);
    ellipse(x + stoneSize/2, y + stoneSize/2, stoneSize * 0.85);

    // Shine
    fill(255, 255, 255, 120);
    ellipse(x + stoneSize/2 - 6, y + stoneSize/2 - 6, stoneSize * 0.25);

    // Highlight if this stone's color is active
    if (activeStoneColor &&
        red(activeStoneColor) === stone.rgb[0] &&
        green(activeStoneColor) === stone.rgb[1] &&
        blue(activeStoneColor) === stone.rgb[2]) {
      noFill();
      stroke(255);
      strokeWeight(2);
      ellipse(x + stoneSize/2, y + stoneSize/2, stoneSize);
      noStroke();
    }
  }
}

function handleInventoryClick() {
  if (stoneInventory.length === 0) return false;

  let stoneSize = 40;
  let padding = 10;
  let startX = width - padding - stoneSize;
  let startY = height - padding - stoneSize;

  // Check clear button area
  if (activeStoneColor) {
    let clearX = startX - (stoneInventory.length * (stoneSize + padding)) - 50;
    if (mouseX > clearX && mouseX < clearX + 50 &&
        mouseY > startY && mouseY < startY + stoneSize) {
      activeStoneColor = null;
      saveStoneInventory();
      return true;
    }
  }

  // Check each stone
  for (let i = 0; i < stoneInventory.length; i++) {
    let stone = stoneInventory[i];
    let x = startX - i * (stoneSize + padding) + stoneSize/2;
    let y = startY + stoneSize/2;

    if (dist(mouseX, mouseY, x, y) < stoneSize/2) {
      // Apply this stone's color
      activeStoneColor = color(stone.rgb[0], stone.rgb[1], stone.rgb[2]);
      saveStoneInventory();
      return true;
    }
  }

  return false;
}

function saveStoneInventory() {
  try {
    let data = {
      inventory: stoneInventory,
      activeColor: activeStoneColor ? [red(activeStoneColor), green(activeStoneColor), blue(activeStoneColor)] : null
    };
    localStorage.setItem('creatureStones', JSON.stringify(data));
  } catch (e) {
    console.log('Could not save stone inventory');
  }
}

function loadStoneInventory() {
  try {
    let saved = localStorage.getItem('creatureStones');
    if (saved) {
      let data = JSON.parse(saved);
      stoneInventory = data.inventory || [];
      if (data.activeColor) {
        activeStoneColor = color(data.activeColor[0], data.activeColor[1], data.activeColor[2]);
      }
    }
  } catch (e) {
    console.log('Could not load stone inventory');
  }
}
