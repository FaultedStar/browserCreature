// ============================================
// CREATURE SETTINGS — CHANGE THESE!
// ============================================

const FEED_AMOUNT = 20;               // How much clicking helps
const DECAY_RATE = 0.005;              // How fast need increases
const AWAY_DECAY_RATE = 0.15;         // Decay when not focused (3x faster)

let creatureSize = 300;               // Overall size in pixels

// Creature colors for each mood (initialized in setup)
let creatureColors;


// ============================================
// CREATURE STATE
// ============================================

let creature = {
  need: 50,             // 0 = happy, 100 = desperate
  mood: 'neutral',      // 'happy', 'neutral', or 'distressed'
  x: 0,
  y: 0,

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

let currentColor, targetColor;


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
  currentColor = creatureColors.neutral;
  targetColor = creatureColors.neutral;

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
  background(243, 255, 242);

  updateFocus();
  updateCreature();

  // Smooth color transition
  currentColor = lerpColor(currentColor, targetColor, 0.03);

  drawCreature();
  drawUI(true);  // Set to false to hide UI
}


// ============================================
// INPUT 1: MOUSE
// ============================================

function mousePressed() {
  let d = dist(mouseX, mouseY, creature.x, creature.y);
  if (d < creatureSize) {
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

  // Animation phases
  creature.breathe += 0.02;
  creature.bob += 0.014;

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
  if (creature.mood === 'distressed') {
    translate(random(-2, 2), random(-1, 1));  // Shake
  }
  let breatheScale = 1 + sin(creature.breathe) * 0.03;
  scale(breatheScale);

  // Return bounce
  if (creature.justReturned) {
    let bounce = sin(creature.returnTimer * 0.5) * 0.1;
    scale(1 + bounce);
  }

  drawBody();
  drawEyes();
  drawMouth();

  pop();
}

function drawBody() {
  noStroke();
  fill(currentColor);
  ellipse(0, 0, creatureSize, creatureSize * 0.9);

  // Highlight
  fill(255, 255, 255, 30);
  ellipse(-creatureSize * 0.2, -creatureSize * 0.2, creatureSize * 0.3, creatureSize * 0.25);
}

function drawEyes() {
  let eyeSpacing = creatureSize * 0.25;
  let eyeY = -creatureSize * 0.1;
  let eyeSize = creatureSize * 0.25;

  // Mood affects eyes
  if (creature.mood === 'distressed') {
    eyeY += 5;
    eyeSize *= 0.9;
  } else if (creature.mood === 'happy') {
    eyeSize *= 1.1;
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
  let mouthY = creatureSize * 0.2;

  stroke(80);
  strokeWeight(2);
  noFill();

  if (creature.mood === 'happy') {
    arc(0, mouthY, creatureSize * 0.3, creatureSize * 0.15, 0, PI);
  } else if (creature.mood === 'neutral') {
    line(-creatureSize * 0.1, mouthY, creatureSize * 0.1, mouthY);
  } else {
    arc(0, mouthY + 10, creatureSize * 0.25, creatureSize * 0.12, PI, TWO_PI);
  }
  noStroke();
}
