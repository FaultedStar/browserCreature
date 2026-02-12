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
  // Only handle touches on the canvas — let UI buttons work normally
  if (touches.length > 0) {
    let t = touches[0];
    let canvas = document.querySelector('canvas');
    let rect = canvas.getBoundingClientRect();
    let tx = t.x !== undefined ? t.x : t.clientX;
    let ty = t.y !== undefined ? t.y : t.clientY;

    // Check if the touch landed on the canvas
    if (tx >= rect.left && tx <= rect.right && ty >= rect.top && ty <= rect.bottom) {
      mousePressed();
      return false; // Prevent default only for canvas touches
    }
  }
  // Let the event propagate so UI elements (buttons, etc.) work
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
