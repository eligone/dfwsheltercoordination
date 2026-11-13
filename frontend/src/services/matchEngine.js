/**
 * matchEngine.js - find, score and rank shelters for a dog (UC-5 and UC-6: FR-12 to FR-15; also used by UC-3: FR-10, FR-18).
 * Purpose: score = 0.5 x (1 - distance/20) + 0.3 x min(open spaces/50, 1) + 0.2 x sizeFit (team-approved weights).
 * Also keeps saved searches that rerun when a shelter's capacity changes (UC-5 alternate course 4a)
 * and asks for the dog's size when a shelter becomes Full (FR-12).
 * Owner: Anais Elizabeth Gonzalez (UC-5, UC-7 side). AI-assisted draft; the owner reviews and explains it.
 */
import { MESSAGES } from './messages.js';
import { ServiceError, AlertType } from './models.js';

export const WEIGHTS = { distance: 0.5, open: 0.3, size: 0.2 };
export const SERVICE_AREA_MI = 20; // FR-32

/** Pure scoring rule (unit-tested on its own). `sizeFit` is 1 when the shelter houses the dog's size. */
export function scoreShelter({ distanceMi, openSpaces, sizeFit = 1 }) {
  const near = Math.min(Math.max(1 - distanceMi / SERVICE_AREA_MI, 0), 1);
  return WEIGHTS.distance * near + WEIGHTS.open * Math.min(openSpaces / 50, 1) + WEIGHTS.size * sizeFit;
}

/** Stand-in for the external MappingService: uses the seed distances (measured from Richardson). */
export function createStubMapping({ delayMs = 0, fail = false } = {}) {
  return {
    calls: 0,
    async getDistance(from, to) {
      this.calls += 1;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      if (fail) throw new Error('Mapping service unavailable');
      if (from.id === to.id) return 0;
      if (from.id === 'rich') return to.distanceMi;
      if (to.id === 'rich') return from.distanceMi;
      return Math.abs(from.distanceMi - to.distanceMi); // rough estimate for non-Richardson origins
    },
  };
}

export function createMatchEngine(ctx) {
  const { state, clock, auth, events } = ctx;
  const find = (id) => state.shelters.find((s) => s.id === id);

  /** Core search with no sign-in check, so saved searches can rerun in the background. */
  async function rank({ dog, size, fromShelterID, radiusMi = SERVICE_AREA_MI, excludeIDs = [] }) {
    const from = find(fromShelterID);
    const candidates = state.shelters.filter((s) => s.id !== fromShelterID && !excludeIDs.includes(s.id)
      && s.acceptedSizes.includes(size) && s.totalCapacity - s.dogsHoused > 0
      && (!dog || dog.medical === 'None' || s.medicalCapable)); // FR-18
    let distances;
    try { distances = await Promise.all(candidates.map((c) => ctx.mapping.getDistance(from, c))); } // one call per shelter, in parallel
    catch { throw new ServiceError('MAPPING_FAILED', MESSAGES.MAPPING_FAILED); }
    const results = candidates.map((c, i) => {
      const openSpaces = c.totalCapacity - c.dogsHoused;
      return { shelterID: c.id, shelterName: c.name, distance: distances[i], openSpaces, sizeFit: true, score: scoreShelter({ distanceMi: distances[i], openSpaces, sizeFit: 1 }), contact: { phone: c.phone, email: c.email } };
    }).filter((r) => r.distance <= radiusMi);
    results.sort((a, b) => b.score - a.score || a.distance - b.distance);
    return results.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /** FR-12 and UC-5 alternate course 4a: react to capacity changes. */
  events.on('capacity-updated', async ({ shelterID, available, becameFull }) => {
    if (becameFull) state.prompts.push({ kind: 'SELECT_SIZE', shelterID, message: MESSAGES.SIZE_PROMPT });
    if (available > 0) await rerunSaved();
  });
  async function rerunSaved() {
    for (const saved of [...state.savedSearches]) {
      const dog = state.dogs.find((d) => d.id === saved.dogID);
      const matches = await rank({ dog, size: saved.size, fromShelterID: saved.requestingShelterID, radiusMi: saved.radiusMi });
      if (!matches.length) continue;
      state.savedSearches = state.savedSearches.filter((s) => s.searchID !== saved.searchID);
      ctx.alerts.create({ type: AlertType.MATCH_FOUND, priority: ctx.alerts.priorityFor(dog, 'NORMAL'), message: `Match found for ${dog.name} (${dog.id}): ${matches.map((m) => m.shelterName).join(', ')}`, recipientShelterID: saved.requestingShelterID, senderShelterID: matches[0].shelterID, dogId: dog.id });
    }
  }

  return {
    rank,
    /** UC-5 step 2: the size field is filled in from the dog's record. */
    startManualMatch(dogId) {
      auth.requireVerified();
      const dog = state.dogs.find((d) => d.id === dogId);
      if (!dog) throw new ServiceError('NOT_FOUND', 'Dog not found.');
      return { dog, size: dog.size };
    },
    /** UC-5 / UC-6 main course (FR-13, FR-14, FR-15, NFR-5, NFR-6). */
    async findMatches({ dogId, size, radiusMi = SERVICE_AREA_MI, save = true }) {
      const staff = auth.requireVerified();
      if (!size) throw new ServiceError('VALIDATION', MESSAGES.SELECT_SIZE, ['size']);
      const dog = state.dogs.find((d) => d.id === dogId) ?? null;
      const matches = await rank({ dog, size, fromShelterID: staff.shelterID, radiusMi });
      if (matches.length) return { matches, message: null, canWiden: false };
      let searchID = null;
      if (save && dog) { searchID = state.counters.search++; state.savedSearches.push({ searchID, dogID: dog.id, requestingShelterID: staff.shelterID, size, radiusMi, createdAt: clock.now() }); }
      return { matches: [], message: MESSAGES.NO_MATCH, canWiden: true, searchID };
    },
    /** UC-5 "Widen search" button. */
    async widenSearch(searchID, radiusMi = 30) {
      auth.requireVerified();
      const saved = state.savedSearches.find((s) => s.searchID === searchID);
      if (!saved) throw new ServiceError('NOT_FOUND', 'Search not found.');
      saved.radiusMi = radiusMi;
      return this.findMatches({ dogId: saved.dogID, size: saved.size, radiusMi, save: false });
    },
    /** The next screen prompt waiting for this shelter's staff (e.g. "Select the dog's size"). */
    takePrompt(shelterID) {
      const i = state.prompts.findIndex((p) => p.shelterID === shelterID);
      return i < 0 ? null : state.prompts.splice(i, 1)[0];
    },
    rerunSaved,
  };
}
