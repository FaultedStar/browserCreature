// ========== HELPER FUNCTIONS ==========
// You don't need to modify this file!
// These handle window resizing and touch support.

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  creature.x = width / 2;
  creature.y = height / 2;

  // Reinitialize weather particles if using fancy version
  if (typeof initRain === 'function') initRain();
  if (typeof initSnow === 'function') initSnow();
  if (typeof initStars === 'function') initStars();
  if (typeof initClouds === 'function') initClouds();
}

// Touch support for mobile
function touchStarted() {
  // Forward touch to mousePressed so taps register as clicks
  mousePressed();
  // Prevents default touch behaviour (scrolling, zooming)
  return false;
}


// ========== TOGGLE TIMER HELPER ==========
// Creates a timer that switches between on/off states
// Used for blinking, sleeping, or any periodic toggle

function createToggleTimer(onDuration, offMin, offMax) {
  return {
    isOn: false,
    countdown: random(offMin, offMax),
    update() {
      this.countdown--;
      if (this.countdown <= 0) {
        this.isOn = !this.isOn;
        this.countdown = this.isOn ? onDuration : random(offMin, offMax);
      }
      return this.isOn;
    }
  };
}
