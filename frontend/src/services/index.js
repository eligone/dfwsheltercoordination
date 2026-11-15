/**
 * index.js - wires the shared services together: createApp() returns one set of services sharing one in-memory state.
 * Purpose: screens call createApp() once (in main.jsx); every test calls it with a fixed clock and fresh seed data.
 * Owner: shared (Awais Afridi keeps it with the test factories).
 */
import { createSeed } from './seed.js';
import { createAuthService } from './authService.js';
import { createShelterStore } from './shelterStore.js';
import { createAlertService } from './alertService.js';
import { createNotificationService, createStubChannels } from './notificationService.js';
import { createMatchEngine, createStubMapping } from './matchEngine.js';
import { createTransferService } from './transferService.js';
import { createDashboard } from './dashboard.js';

function createEvents(track) {
  const handlers = {};
  return {
    // Return a cleanup function so mounted screens can unsubscribe (UC-10).
    on(name, fn) {
      const list = handlers[name] ??= [];
      list.push(fn);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        const i = list.indexOf(fn);
        if (i !== -1) list.splice(i, 1);
      };
    },
    emit(name, payload) { [...(handlers[name] ?? [])].forEach((fn) => track(fn(payload))); },
  };
}

/**
 * @param {{clock?: {now: () => Date}, mapping?: object, channels?: object, seed?: object}} options
 */
export function createApp({ clock = { now: () => new Date() }, mapping = createStubMapping(), channels = createStubChannels(), seed } = {}) {
  const pending = [];
  const track = (p) => { if (p && typeof p.then === 'function') pending.push(p); return p; };
  const ctx = { state: seed ?? createSeed(clock.now()), clock, mapping, track };
  ctx.events = createEvents(track);
  ctx.auth = createAuthService(ctx);
  ctx.shelterStore = createShelterStore(ctx);
  ctx.alerts = createAlertService(ctx);
  ctx.notifications = createNotificationService(ctx, channels);
  ctx.matchEngine = createMatchEngine(ctx);
  ctx.transfers = createTransferService(ctx);
  return {
    state: ctx.state, clock, channels, mapping,
    auth: ctx.auth, shelterStore: ctx.shelterStore, alerts: ctx.alerts, notifications: ctx.notifications,
    matchEngine: ctx.matchEngine, transfers: ctx.transfers, events: ctx.events,
    /** A Dashboard bound to the signed-in staff member's view of the shelters. */
    createDashboard: () => createDashboard({ fetchShelters: async () => ctx.shelterStore.listShelters(), now: () => clock.now() }),
    /** Waits for background work (alert delivery, saved-search reruns) to finish; tests call this before asserting. */
    async settle() { while (pending.length) await Promise.allSettled(pending.splice(0)); },
  };
}
