let basicButton = null;
let statsButton = null;
let reportButton = null;
let watchingColor, awayColor;  // Cached colors

function drawUI(show) {
  if (!show) return;

  let padding = 15;
  let panelWidth = 320;
  let panelHeight = 210;
  let barHeight = 12;
  let cornerRadius = 10;

  // Panel background
  fill(0, 0, 0, 160);
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
  fill(creatureColor);
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

  // Weather info
  y += 24;
  fill(255, 150);
  textSize(13);
  textAlign(LEFT, TOP);
  let weatherText = getWeatherDisplayText();
  text(weatherText, x, y);

  // Instructions
  y += 22;
  fill(255, 100);
  textSize(12);
  text(`Click to feed · Weather-reactive · Tab-aware`, x, y);

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

  // Basic version button
  if (!basicButton) {
    basicButton = createButton('Basic Version');
    applyButtonStyle(basicButton, buttonStyle);
    basicButton.mousePressed(() => window.location.href = 'index.html');
  }
  basicButton.position(x + 60, buttonY);

  // Efficiency Report button
  if (!reportButton) {
    reportButton = createButton('Efficiency Report');
    applyButtonStyle(reportButton, buttonStyle);
    reportButton.mousePressed(showEfficiencyReport);
  }
  reportButton.position(x + 175, buttonY);
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

function getWeatherDisplayText() {
  if (overrideWeather !== null) {
    return `${overrideWeather} (testing)`;
  }
  if (!weather.loaded) {
    return "Loading weather...";
  }
  let dayNight = weather.isDay ? "day" : "night";
  return `${weather.temperature.toFixed(0)}°C · ${weather.condition} · ${dayNight}`;
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

  let weatherInfo = weather.loaded
    ? `${weather.temperature.toFixed(1)}°C, ${weather.condition}`
    : "Loading...";

  let stats = `CREATURE STATS
━━━━━━━━━━━━━━━━━━━━━━

Need Level:     ${creature.need.toFixed(1)}%
Current Mood:   ${creature.mood}
Total Visits:   ${creature.totalVisits}
Times Left Tab: ${creature.timesLeft || 0}
Last Visit:     ${lastVisitText}

━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT

Weather:        ${weatherInfo}
Time of Day:    ${weather.isDay ? 'Day' : 'Night'}
Being Watched:  ${creature.isBeingWatched ? 'Yes' : 'No'}

━━━━━━━━━━━━━━━━━━━━━━
CREATURE

Base Size:      ${creature.baseSize}px
Position:       (${Math.round(creature.x)}, ${Math.round(creature.y)})`;

  alert(stats);
}

function showEfficiencyReport() {
  let weatherContext = weather.loaded
    ? `Current environmental conditions (${weather.temperature.toFixed(1)}°C, ${weather.condition}) have been factored into all assessments.`
    : "Environmental data pending integration.";

  let reports = [
    `EFFICIENCY REPORT 7-B
━━━━━━━━━━━━━━━━━━━━━━

Creature productivity remains within acceptable parameters as defined by Section 4.2.1 of the Operational Guidelines (Rev. 3). No further action required pending committee review.

${weatherContext}

Filed by: Sub-Committee on Creature Welfare
CC: All Departments
Status: ARCHIVED`,

    `QUARTERLY ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━

Per Directive 91-C, all metrics have been evaluated against baseline projections established in FY2024. Findings inconclusive. Recommend extending study period by 6-8 weeks.

${weatherContext}

Status: Under Review
Priority: Medium`,

    `MEMORANDUM RE: NEED LEVELS
━━━━━━━━━━━━━━━━━━━━━━

This is to confirm receipt of your inquiry dated today's date. Your concerns have been forwarded to the appropriate department for processing.

Please allow 4-6 weeks for a response.

${weatherContext}

Thank you for your patience.`,

    `FORM A-7 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━

All Form A-7 submissions have been reviewed per Standard Operating Procedure 12.4. Several irregularities were noted but deemed non-critical.

Action Item: Schedule follow-up meeting to discuss scheduling of future meetings.

${weatherContext}

Priority: Medium-Low`,

    `STATUS UPDATE
━━━━━━━━━━━━━━━━━━━━━━

The working group has convened and established a framework for evaluating the proposed framework. Preliminary findings suggest further analysis is warranted.

${weatherContext}

Next Steps: TBD
Timeline: Ongoing
Stakeholders: Various`,

    `WELLNESS CHECK NOTICE
━━━━━━━━━━━━━━━━━━━━━━

This automated message is to inform you that your creature's wellness indicators are being monitored in accordance with Protocol 7.

No action is required on your part at this time.

${weatherContext}

This message was generated automatically.
Do not reply.`
  ];

  alert(random(reports));
}
