// @vitest-environment node
/**
 * dashboard.test.js - tests for UC-8 View Shared Dashboard, UC-9 View Shelter Details, UC-11 Search and Filter,
 * UC-12 Sort, UC-13 Refresh, NFR-3, NFR-13, NFR-14. Test case IDs match the SE Document (Part 1.5 and 1.6).
 * Creators: Saif Yusuff (UC-8, UC-9), Awais Afridi (UC-11, UC-12, UC-13, NFR-13, NFR-14).
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs } from '../test/testApp.js';
import { occupancyStatus } from './shelterStore.js';
import { createDashboard, REFRESH_INTERVAL_MS } from './dashboard.js';

const names = (rows) => rows.map((r) => r.name.split(' ')[0]);
async function loadedDashboard(app) { const d = app.createDashboard(); await d.refresh(); return d; }

describe('UC-8 View Shared Dashboard / UC-9 Shelter Details', () => {
  it('TC-8-01 six shelters with housed, available, total and status labels at 2026-11-04 10:00', () => {
    const app = signInAs(createTestApp(), 'rich');
    const rows = app.shelterStore.listShelters();
    expect(rows).toHaveLength(6);
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect([by.rich.dogsHoused, by.rich.availableKennels, by.rich.totalCapacity, by.rich.statusLabel]).toEqual([58, 2, 60, 'Near Full']);
    expect([by.dal.dogsHoused, by.dal.availableKennels, by.dal.totalCapacity, by.dal.statusLabel]).toEqual([310, 10, 320, 'Near Full']);
    expect([by.collin.dogsHoused, by.collin.availableKennels, by.collin.statusLabel]).toEqual([70, 40, 'Open']);
    expect([by.plano.dogsHoused, by.plano.availableKennels, by.plano.statusLabel]).toEqual([84, 16, 'Open']);
    expect([by.irving.dogsHoused, by.irving.availableKennels, by.irving.statusLabel]).toEqual([41, 49, 'Outdated']);
    expect([by.carr.dogsHoused, by.carr.availableKennels, by.carr.statusLabel]).toEqual([55, 20, 'Open']);
  });
  it('TC-8-02 status boundaries: 50/60 Open, 51/60 Near Full, 59/60 Near Full, 60/60 Full, 0/60 Open', () => {
    expect([[50, 60], [51, 60], [59, 60], [60, 60], [0, 60]].map(([h, t]) => occupancyStatus(h, t))).toEqual(['open', 'near', 'near', 'full', 'open']);
  });
  it('TC-8-03 no data gives "No shelter data available."', async () => {
    const d = createDashboard({ fetchShelters: async () => [] });
    await d.refresh();
    expect(d.view()).toEqual({ rows: [], message: 'No shelter data available.' });
  });
  it('TC-8-04 a signed-out visitor is sent to Sign In (AUTH_REQUIRED)', () => {
    const app = createTestApp();
    try { app.shelterStore.listShelters(); expect(true).toBe(false); } catch (e) { expect(e.code).toBe('AUTH_REQUIRED'); }
  });
  it('TC-9-01 shelter details: address, phone, email, last update', () => {
    const app = signInAs(createTestApp(), 'rich');
    const s = app.shelterStore.getShelterDetails('collin');
    expect([s.name, s.address, s.phone, s.email, s.lastUpdatedLabel]).toEqual(['Collin County Animal Services', '4750 Community Ave, McKinney, TX', '(972) 555-0103', 'staff@collin.example', '2026-11-03 17:05']);
  });
});

describe('UC-11 Search and Filter Shelters / UC-12 Sort', () => {
  it('TC-11-01 search by name (any case) and by location', async () => {
    const d = await loadedDashboard(signInAs(createTestApp(), 'rich'));
    expect(names(d.searchShelter('plano').rows)).toEqual(['Plano']);
    expect(names(d.searchShelter('McKinney').rows)).toEqual(['Collin']);
  });
  it('TC-11-02 status filter, and search combined with a filter', async () => {
    const d = await loadedDashboard(signInAs(createTestApp(), 'rich'));
    expect(names(d.filterByStatus('Near Full').rows)).toEqual(['Richardson', 'Dallas']);
    d.filterByStatus('Open');
    expect(names(d.searchShelter('Animal').rows).sort()).toEqual(['Carrollton', 'Collin', 'Plano']);
  });
  it('TC-11-03 clearing the search restores the list for the current filter', async () => {
    const d = await loadedDashboard(signInAs(createTestApp(), 'rich'));
    d.searchShelter('plano');
    expect(d.searchShelter('').rows).toHaveLength(6);
  });
  it('TC-11-04 no match gives "No matching shelters found."', async () => {
    const d = await loadedDashboard(signInAs(createTestApp(), 'rich'));
    expect(d.searchShelter('zzz')).toEqual({ rows: [], message: 'No matching shelters found.' });
    d.searchShelter('');
    expect(d.filterByStatus('Full')).toEqual({ rows: [], message: 'No matching shelters found.' });
    expect(d.filterByStatus(null).rows).toHaveLength(6);
  });
  it('TC-11-05 odd input: spaces, symbols and 300 characters never crash', async () => {
    const d = await loadedDashboard(signInAs(createTestApp(), 'rich'));
    expect(d.searchShelter('  ').rows).toHaveLength(6);
    expect(d.searchShelter('%%').message).toBe('No matching shelters found.');
    expect(d.searchShelter('a'.repeat(300)).message).toBe('No matching shelters found.');
    expect(d.searchShelter(null).rows).toHaveLength(6);
  });
  it('TC-12-01 sort by available kennels descending, then reversed', async () => {
    const d = await loadedDashboard(signInAs(createTestApp(), 'rich'));
    expect(d.sortBy('availableKennels', false).rows.map((r) => r.availableKennels)).toEqual([49, 40, 20, 16, 10, 2]);
    expect(d.sortBy('availableKennels', true).rows.map((r) => r.availableKennels)).toEqual([2, 10, 16, 20, 40, 49]);
    expect(d.sortBy('distanceMi', true).rows.map((r) => r.distanceMi)).toEqual([0, 6.1, 11.3, 14.2, 17.8, 19.5]);
  });
});

describe('UC-13 Refresh Dashboard', () => {
  it('TC-13-01 Refresh shows the latest saved data, a newer update time and the message', async () => {
    const app = signInAs(createTestApp(), 'rich');
    const d = await loadedDashboard(app);
    const oldTime = d.view().rows.find((r) => r.id === 'plano').lastUpdatedLabel;
    app.clock.advance(60000);
    signInAs(app, 'plano');
    app.shelterStore.updateCapacity('plano', 10); // Plano is now 90/100
    signInAs(app, 'rich');
    const result = await d.refresh();
    const plano = d.view().rows.find((r) => r.id === 'plano');
    expect([plano.dogsHoused, plano.availableKennels]).toEqual([90, 10]);
    expect(plano.lastUpdatedLabel).toBe('2026-11-04 10:01');
    expect(oldTime).toBe('2026-11-04 09:30');
    expect(result).toEqual({ ok: true, message: 'Dashboard refreshed.' });
  });
  it('TC-13-02 each shelter shows its last-updated time; a missing one shows "Not available"', async () => {
    const app = signInAs(createTestApp(), 'rich');
    app.state.shelters.find((s) => s.id === 'dal').lastUpdated = null;
    const rows = (await loadedDashboard(app)).view().rows;
    expect(rows.find((r) => r.id === 'rich').lastUpdatedLabel).toBe('2026-11-04 08:15');
    expect(rows.find((r) => r.id === 'dal').lastUpdatedLabel).toBe('Not available');
  });
  it('TC-13-03 a failed refresh keeps the rows and shows the message; a double click sends one request', async () => {
    const app = signInAs(createTestApp(), 'rich');
    let calls = 0; let fail = false;
    const d = createDashboard({ fetchShelters: async () => { calls += 1; await new Promise((r) => setTimeout(r, 20)); if (fail) throw new Error('down'); return app.shelterStore.listShelters(); } });
    const [a, b] = [d.refresh(), d.refresh()];
    await Promise.all([a, b]);
    expect(calls).toBe(1);
    fail = true;
    const result = await d.refresh();
    expect(result).toEqual({ ok: false, message: 'Could not refresh. Showing last saved data.' });
    expect(d.view().rows).toHaveLength(6);
  });
});

describe('NFR-3 dashboard refresh and search time', () => {
  it('NTC-03 auto-refresh every 5 s: 6 refreshes in 30 s', async () => {
    const app = signInAs(createTestApp(), 'rich');
    let calls = 0;
    const d = createDashboard({ fetchShelters: async () => { calls += 1; return app.shelterStore.listShelters(); } });
    let tick; let interval = null;
    const stop = d.startAutoRefresh({ setIntervalFn: (fn, ms) => { tick = fn; interval = ms; return 7; }, clearIntervalFn: (id) => { interval = `cleared ${id}`; } });
    expect(interval).toBe(5000);
    expect(REFRESH_INTERVAL_MS).toBe(5000);
    for (let t = 5; t <= 30; t += 5) { tick(); await d.refresh(); }
    expect(calls).toBe(6);
    stop();
    expect(interval).toBe('cleared 7');
  });
  it('NTC-04 20 searches each finish within 4000 ms (500 ms simulated service delay)', async () => {
    const app = signInAs(createTestApp(), 'rich');
    const d = createDashboard({ fetchShelters: async () => { await new Promise((r) => setTimeout(r, 500)); return app.shelterStore.listShelters(); } });
    const terms = ['plano', 'irving', 'dallas', 'mckinney', 'carrollton', 'richardson', 'animal', 'services', 'zzz', 'campus'];
    const times = [];
    for (let i = 0; i < 20; i += 1) { const t0 = performance.now(); await d.refresh(); d.searchShelter(terms[i % terms.length]); times.push(performance.now() - t0); }
    console.log(`NTC-04 max ${Math.max(...times).toFixed(0)} ms`);
    expect(Math.max(...times)).toBeLessThanOrEqual(4000);
  });
});

describe('NFR-13 search and filter on 500 shelters', () => {
  it('NTC-14 95th percentile of 100 searches and filters is at most 4000 ms', async () => {
    const big = Array.from({ length: 500 }, (_, i) => ({ id: `s${i}`, name: `Shelter ${i} Animal Services`, city: ['Dallas', 'Plano', 'Irving'][i % 3], address: `${i} Main St`, statusLabel: ['Open', 'Near Full', 'Full', 'Outdated'][i % 4], availableKennels: i % 50, distanceMi: i % 20 }));
    const d = createDashboard({ fetchShelters: async () => big });
    await d.refresh();
    const times = [];
    for (let i = 0; i < 100; i += 1) {
      const t0 = performance.now();
      if (i % 2) d.searchShelter(`shelter ${i}`); else d.filterByStatus(['Open', 'Near Full', 'Full', 'Outdated'][i % 4]);
      d.view();
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[94];
    console.log(`NTC-14 p95 ${p95.toFixed(2)} ms`);
    expect(p95).toBeLessThanOrEqual(4000);
  });
});

describe('NFR-14 sign in required', () => {
  it('NTC-15 signed out -> AUTH_REQUIRED; wrong password -> exact message; correct -> dashboard data', () => {
    const app = createTestApp();
    try { app.shelterStore.listShelters(); expect(true).toBe(false); } catch (e) { expect(e.code).toBe('AUTH_REQUIRED'); }
    expect(() => app.auth.signIn('jdoe@richardson.example', 'wrong')).toThrow('Incorrect email or password.');
    expect(() => app.auth.signIn('nobody@nowhere.example', 'pw-rich')).toThrow('Incorrect email or password.');
    expect(() => app.auth.signIn('not-an-email', 'x')).toThrow('Enter a valid email address');
    const staff = app.auth.signIn('jdoe@richardson.example', 'pw-rich');
    expect(staff.password).toBe(undefined); // the password never leaves the auth service
    expect(app.shelterStore.listShelters()).toHaveLength(6);
    app.auth.signOut();
    expect(app.auth.currentStaff()).toBe(null);
  });
});
