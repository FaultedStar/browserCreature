// ========== STORAGE HELPERS ==========
// You don't need to modify this file!
// These functions save and load your creature's state using localStorage.

// AFK decay settings (how much need builds up while you're away)
const AFK_DECAY_PER_HOUR = 5;    // How much "need" increases per hour while page is closed
const MAX_DECAY_HOURS = 168;     // Cap decay at 7 days (168 hours)

function saveCreatureState() {
  try {
    let saveData = {
      need: creature.need,
      lastVisit: Date.now(),
      totalVisits: creature.totalVisits
    };
    localStorage.setItem('creatureState', JSON.stringify(saveData));
  } catch (e) {
    console.log('Could not save creature state');
  }
}

function loadCreatureState() {
  try {
    let saved = localStorage.getItem('creatureState');
    if (saved) {
      let data = JSON.parse(saved);
      creature.need = data.need || 50;
      creature.lastVisit = data.lastVisit;
      creature.totalVisits = (data.totalVisits || 0) + 1;

      // Calculate how much need increased while away
      if (creature.lastVisit) {
        let elapsedMs = Date.now() - creature.lastVisit;
        let elapsedHours = elapsedMs / (1000 * 60 * 60);
        elapsedHours = min(elapsedHours, MAX_DECAY_HOURS);
        creature.need += elapsedHours * AFK_DECAY_PER_HOUR;
        creature.need = constrain(creature.need, 0, 100);
        console.log(`Welcome back! Away for ${elapsedHours.toFixed(1)} hours.`);
      }
    } else {
      // First visit!
      creature.totalVisits = 1;
      console.log('Welcome! This is your new creature.');
    }
  } catch (e) {
    console.log('Could not load creature state, starting fresh');
    creature.totalVisits = 1;
  }

}
