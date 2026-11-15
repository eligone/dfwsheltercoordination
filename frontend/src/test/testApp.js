/**
 * testApp.js - test helpers: a controllable clock, a fresh app with the seed data, and quick sign-in.
 * Purpose: every test starts from the same state (clock fixed at 2026-11-04 10:00 UTC, P0 in the SE Document).
 * Owner: Awais Afridi (test factories).
 */
import { createApp } from '../services/index.js';

export const TEST_NOW = '2026-11-04T10:00:00Z';

export function createTestClock(iso = TEST_NOW) {
  let t = new Date(iso);
  return {
    now: () => new Date(t.getTime()),
    advance(ms) { t = new Date(t.getTime() + ms); },
    set(isoString) { t = new Date(isoString); },
  };
}

export const CREDENTIALS = {
  rich: ['jdoe@richardson.example', 'pw-rich'], dal: ['staff@dallas.example', 'pw-dal'], collin: ['staff@collin.example', 'pw-collin'],
  plano: ['staff@plano.example', 'pw-plano'], irving: ['staff@irving.example', 'pw-irving'], carr: ['staff@carrollton.example', 'pw-carr'],
  intern: ['intern@richardson.example', 'pw-intern'],
};

export const MIN = 60000;
export const DAY = 86400000;

export function createTestApp(options = {}) { return createApp({ clock: createTestClock(), ...options }); }
export function signInAs(app, who) { app.auth.signIn(...CREDENTIALS[who]); return app; }
/** Marks shelters as completely full (dogs housed = total capacity). */
export function fillShelters(app, ids) { ids.forEach((id) => { const s = app.state.shelters.find((x) => x.id === id); s.dogsHoused = s.totalCapacity; }); }
export const availableOf = (app, id) => { const s = app.state.shelters.find((x) => x.id === id); return s.totalCapacity - s.dogsHoused; };
/** Gives a dog "no active transfer" (the seed has T-301 for Biscuit), as the UC-3 test preconditions require. */
export function releaseDog(app, dogId) { app.state.transfers = app.state.transfers.filter((t) => t.dogId !== dogId); }
