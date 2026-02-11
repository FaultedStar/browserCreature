let fancyButton = null;
let statsButton = null;
let watchingColor, awayColor;  // Cached colors for performance

function drawUI(show) {
  if (!show) return;

  let padding = 15;
  let panelWidth = 300;
  let panelHeight = 175;
  let barHeight = 12;
  let cornerRadius = 10;

  // Panel background
  fill(0, 0, 0, 140);
  noStroke();
  rect(padding, padding, panelWidth, panelHeight, cornerRadius);

  let x = padding + 15;
  let y = padding + 18;

  // Mood label
  fill(255);
  noStroke();
  textSize(18);
  textAlign(LEFT, TOP);
  let mood = creature.mood;
  let moodDisplay = mood.charAt(0).toUpperCase() + mood.slice(1);
  text(moodDisplay, x, y);

  // Visit count (right-aligned)
  fill(255, 180);
  textSize(14);
  textAlign(RIGHT, TOP);
  text(`Visit #${creature.totalVisits}`, padding + panelWidth - 15, y + 2);

  // Need bar background
  y += 32;
  let barWidth = panelWidth - 30;
  fill(255, 50);
  noStroke();
  rect(x, y, barWidth, barHeight, barHeight / 2);

  // Need bar fill (color matches mood)
  let fillWidth = map(creature.need, 0, 100, 0, barWidth);
  fill(currentColor);
  rect(x, y, fillWidth, barHeight, barHeight / 2);

  // Need percentage
  y += 24;
  fill(255, 180);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Need: ${creature.need.toFixed(0)}%`, x, y);

  // Watching status
  if (!watchingColor) watchingColor = color(150, 255, 150, 180);
  if (!awayColor) awayColor = color(255, 150, 150, 180);

  let watchingText = creature.isBeingWatched ? "[watching]" : "[away]";
  fill(creature.isBeingWatched ? watchingColor : awayColor);
  textAlign(RIGHT, TOP);
  text(watchingText, padding + panelWidth - 15, y);

  // Instructions
  y += 24;
  fill(255, 120);
  textSize(13);
  textAlign(LEFT, TOP);
  text(`Click to feed · Notices when you leave`, x, y);

  // Buttons row
  let buttonY = padding + panelHeight - 42;
  let buttonStyle = {
    fontSize: '12px',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '5px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    cursor: 'pointer'
  };

  // Stats button
  if (!statsButton) {
    statsButton = createButton('Stats');
    applyButtonStyle(statsButton, buttonStyle);
    statsButton.mousePressed(showStats);
  }
  statsButton.position(x, buttonY);

  // Fancy version button
  if (!fancyButton) {
    fancyButton = createButton('Fancy Version');
    applyButtonStyle(fancyButton, buttonStyle);
    fancyButton.mousePressed(() => window.location.href = 'fancy.html');
  }
  fancyButton.position(x + 60, buttonY);

}

function applyButtonStyle(btn, style) {
  btn.style('font-size', style.fontSize);
  btn.style('padding', style.padding);
  btn.style('border', style.border);
  btn.style('border-radius', style.borderRadius);
  btn.style('background', style.background);
  btn.style('color', style.color);
  btn.style('cursor', style.cursor);
  btn.mouseOver(() => btn.style('background', 'rgba(255,255,255,0.35)'));
  btn.mouseOut(() => btn.style('background', 'rgba(255,255,255,0.2)'));
}

function showStats() {
  let now = new Date();
  let lastVisitText = "First visit!";

  if (creature.lastVisit) {
    let elapsed = Date.now() - creature.lastVisit;
    let hours = Math.floor(elapsed / (1000 * 60 * 60));
    let minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      lastVisitText = `${hours}h ${minutes}m ago`;
    } else {
      lastVisitText = `${minutes}m ago`;
    }
  }

  let stats = `CREATURE STATS
━━━━━━━━━━━━━━━━━━━━

Need Level:     ${creature.need.toFixed(1)}%
Current Mood:   ${creature.mood}
Total Visits:   ${creature.totalVisits}
Times Left Tab: ${creature.timesLeft}
Last Visit:     ${lastVisitText}

━━━━━━━━━━━━━━━━━━━━
Base Size:      ${creatureSize}px
Position:       (${Math.round(creature.x)}, ${Math.round(creature.y)})
Being Watched:  ${creature.isBeingWatched ? 'Yes' : 'No'}`;

  alert(stats);
}

