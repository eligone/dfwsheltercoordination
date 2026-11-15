// @vitest-environment node
/**
 * matchEngine.test.js - tests for UC-5 Find Available Shelters (and UC-6 results), UC-7 Request Dog Transfer, NFR-5, NFR-6.
 * Test case IDs match the SE Document (Part 1.5 and 1.6). Creator: Anais Elizabeth Gonzalez.
 * Owner: Anais Elizabeth Gonzalez. TC-5-07 to TC-5-10 (incl. 5-09b) and TC-7-05 to TC-7-08 (bottom of the file) were added
 * on 2026-11-14 with AI assistance (Claude Code) to cover score edge cases, widening, and the UC-7 rules
 * (all fields missing, one active transfer per dog, audit record, unknown dog).
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs, fillShelters, availableOf, releaseDog } from '../test/testApp.js';
import { createStubMapping, scoreShelter } from './matchEngine.js';

const ids = (m) => m.map((x) => x.shelterID);

describe('scoring rule', () => {
  it('0.5 x (1 - d/20) + 0.3 x min(open/50, 1) + 0.2 x sizeFit', () => {
    expect(scoreShelter({ distanceMi: 17.8, openSpaces: 49, sizeFit: 1 })).toBeCloseTo(0.549, 4);
    expect(scoreShelter({ distanceMi: 6.1, openSpaces: 16, sizeFit: 1 })).toBeCloseTo(0.6435, 4);
    expect(scoreShelter({ distanceMi: 0, openSpaces: 500, sizeFit: 1 })).toBeCloseTo(1, 6);
  });
});

describe('UC-5 Find Available Shelters', () => {
  it('TC-5-01 large dog: size prefilled, ranked Irving, Carrollton, Collin, Dallas, with details', async () => {
    const app = signInAs(createTestApp(), 'rich');
    const start = app.matchEngine.startManualMatch('D-1042');
    expect(start.size).toBe('large');
    const { matches, message } = await app.matchEngine.findMatches({ dogId: 'D-1042', size: start.size });
    expect(message).toBe(null);
    expect(ids(matches)).toEqual(['irving', 'carr', 'collin', 'dal']);
    [0.549, 0.5375, 0.4525, 0.405].forEach((score, i) => expect(matches[i].score).toBeCloseTo(score, 4));
    expect(matches.map((m) => m.rank)).toEqual([1, 2, 3, 4]);
    expect(matches[0]).toMatchObject({ shelterName: 'Irving Animal Care Campus', distance: 17.8, openSpaces: 49, contact: { phone: '(972) 555-0105', email: 'staff@irving.example' } });
    expect(ids(matches).includes('plano')).toBe(false);
  });
  it('TC-5-02 small dog: Plano ranks first', async () => {
    const app = signInAs(createTestApp(), 'rich');
    const { matches } = await app.matchEngine.findMatches({ dogId: 'D-1043', size: 'small' });
    expect(ids(matches)).toEqual(['plano', 'irving', 'carr', 'collin', 'dal']);
    expect(matches[0].score).toBeCloseTo(0.6435, 4);
  });
  it('TC-5-03 a shelter becoming Full asks for the dog size without a manual search', async () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(app.matchEngine.takePrompt('rich')).toBe(null);
    app.shelterStore.updateCapacity('rich', 0);
    await app.settle();
    expect(app.matchEngine.takePrompt('rich')).toMatchObject({ kind: 'SELECT_SIZE', message: "Select the dog's size" });
    expect(app.matchEngine.takePrompt('rich')).toBe(null);
  });
  it('TC-5-04 no match: message, widen option, search saved', async () => {
    const app = signInAs(createTestApp(), 'rich');
    fillShelters(app, ['dal', 'collin', 'plano', 'irving', 'carr']);
    const result = await app.matchEngine.findMatches({ dogId: 'D-1042', size: 'large' });
    expect(result).toMatchObject({ matches: [], message: 'No match found', canWiden: true });
    expect(app.state.savedSearches).toHaveLength(1);
  });
  it('TC-5-05 the saved search reruns when another shelter frees space and alerts Richardson', async () => {
    const app = signInAs(createTestApp(), 'rich');
    fillShelters(app, ['dal', 'collin', 'plano', 'irving', 'carr']);
    await app.matchEngine.findMatches({ dogId: 'D-1042', size: 'large' });
    signInAs(app, 'collin');
    app.shelterStore.updateCapacity('collin', 5);
    await app.settle();
    const alert = app.state.alerts.find((a) => a.recipientShelterID === 'rich' && a.message.startsWith('Match found for Biscuit') && a.message.includes('Collin County Animal Services'));
    expect(alert).toMatchObject({ type: 'MATCH_FOUND', read: false });
    expect(app.state.savedSearches).toHaveLength(0);
  });
  it('TC-5-06 no size means no search; cancelling means no search either', async () => {
    const app = signInAs(createTestApp(), 'rich');
    await expect(app.matchEngine.findMatches({ dogId: 'D-1042', size: '' })).rejects.toThrow("Select the dog's size.");
    expect(app.mapping.calls).toBe(0); // the Mapping service was never called
    app.matchEngine.startManualMatch('D-1042'); // opens the size prompt; the user clicks Cancel
    expect(app.mapping.calls).toBe(0);
  });
});

describe('UC-7 Request Dog Transfer', () => {
  it('TC-7-01 sends the request to Collin: Pending, saved, Collin alerted', () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    const result = app.transfers.createFromMatch({ shelterID: 'collin', dogId: 'D-1042', size: 'large', notes: 'Needs daily meds' });
    expect(result.message).toBe('Transfer request sent.');
    expect(result.status).toBe('Pending');
    expect(app.transfers.getRequest(result.request.id)).toMatchObject({ toShelterID: 'collin', dogId: 'D-1042', notes: 'Needs daily meds' });
    expect(app.state.alerts.some((a) => a.recipientShelterID === 'collin' && a.transferRequestID === result.request.id)).toBe(true);
  });
  it('TC-7-02 missing information: fields named, nothing saved', () => {
    const app = signInAs(createTestApp(), 'rich');
    const before = app.state.transfers.length;
    expect(() => app.transfers.createFromMatch({ shelterID: 'collin', dogId: '', size: 'large' })).toThrow('Please complete the highlighted fields.');
    try { app.transfers.createFromMatch({ shelterID: 'collin', dogId: '', size: 'large' }); } catch (e) { expect(e.fields).toEqual(['dogId']); }
    expect(app.state.transfers).toHaveLength(before);
  });
  it('TC-7-03 the shelter filled up meanwhile: message, nothing saved', () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    fillShelters(app, ['collin']);
    const before = app.state.transfers.length;
    expect(() => app.transfers.createFromMatch({ shelterID: 'collin', dogId: 'D-1042', size: 'large' })).toThrow('This shelter no longer has space.');
    expect(app.state.transfers).toHaveLength(before);
  });
  it('TC-7-04 a large dog cannot be sent to Plano', () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    const before = app.state.transfers.length;
    expect(() => app.transfers.createFromMatch({ shelterID: 'plano', dogId: 'D-1042', size: 'large' })).toThrow('This shelter cannot house large dogs.');
    expect(app.state.transfers).toHaveLength(before);
    expect(availableOf(app, 'plano')).toBe(16);
  });
});

describe('NFR-5 and NFR-6', () => {
  it('NTC-06 match results appear within 5000 ms (30 runs, 300 ms Mapping delay per shelter)', async () => {
    const app = signInAs(createTestApp({ mapping: createStubMapping({ delayMs: 300 }) }), 'rich');
    const times = [];
    for (let i = 0; i < 30; i += 1) {
      const t0 = performance.now();
      await app.matchEngine.findMatches({ dogId: 'D-1042', size: 'large', save: false });
      times.push(performance.now() - t0);
    }
    const max = Math.max(...times);
    const median = [...times].sort((a, b) => a - b)[15];
    console.log(`NTC-06 max ${max.toFixed(0)} ms, median ${median.toFixed(0)} ms`);
    expect(max).toBeLessThanOrEqual(5000);
  });
  it('NTC-07 an unverified account is denied matches and contact details', async () => {
    const app = signInAs(createTestApp(), 'intern');
    await expect(app.matchEngine.findMatches({ dogId: 'D-1042', size: 'large' })).rejects.toThrow('Your account must be verified to view matches.');
    expect(() => app.matchEngine.startManualMatch('D-1042')).toThrow('Your account must be verified to view matches.');
    expect(() => app.transfers.createFromMatch({ shelterID: 'collin', dogId: 'D-1042', size: 'large' })).toThrow('Your account must be verified to view matches.');
    expect(app.mapping.calls).toBe(0);
  });
});

describe('Audit fix B3: unverified accounts never get matches or contact details (NFR-6)', () => {
  it('NTC-07b the intern is refused with FORBIDDEN by createRequest, getShelterDetails and every matching call', async () => {
    const app = signInAs(createTestApp(), 'intern');
    const refused = async (fn) => { try { await fn(); return 'allowed'; } catch (e) { return `${e.code}: ${e.message}`; } };
    const msg = 'FORBIDDEN: Your account must be verified to view matches.';
    expect(await refused(() => app.transfers.createRequest({ dogId: 'D-1051', urgency: 'HIGH' }))).toBe(msg);
    expect(await refused(() => app.matchEngine.findMatches({ dogId: 'D-1042', size: 'large' }))).toBe(msg);
    expect(await refused(() => app.matchEngine.startManualMatch('D-1042'))).toBe(msg);
    expect(await refused(() => app.matchEngine.widenSearch(1))).toBe(msg);
    expect(await refused(() => app.transfers.createFromMatch({ shelterID: 'collin', dogId: 'D-1051', size: 'large' }))).toBe(msg);
    expect(await refused(() => app.shelterStore.getShelterDetails('collin'))).toBe(msg);
    expect(app.state.transfers).toHaveLength(3); // nothing was created; the seed has T-298, T-301, T-302
    expect(app.mapping.calls).toBe(0);
  });
  it('NTC-07c contact fields are blank for the intern in the dashboard, alerts and My Dogs, and present for verified staff', () => {
    const intern = signInAs(createTestApp(), 'intern');
    const rows = intern.shelterStore.listShelters();
    expect(rows).toHaveLength(6); // the numbers are still shown
    expect(rows.every((r) => r.phone === null && r.email === null)).toBe(true);
    expect(intern.alerts.openAlert('A-90').sender).toEqual({ name: 'Collin County Animal Services', phone: null, email: null });
    expect(intern.transfers.listMyDogs().rows[0].receivingContact).toEqual({ phone: null, email: null });
    expect(intern.transfers.getMyDogTransfer('T-301').receivingContact).toEqual({ phone: null, email: null });
    const staff = signInAs(createTestApp(), 'rich');
    expect(staff.shelterStore.listShelters().every((r) => r.phone && r.email)).toBe(true);
    expect(staff.alerts.openAlert('A-90').sender.phone).toBe('(972) 555-0103');
    expect(staff.shelterStore.getShelterDetails('collin').phone).toBe('(972) 555-0103');
  });
});

// ---------------------------------------------------------------------------------------------
// Added 2026-11-14 (Anais Elizabeth Gonzalez, AI-assisted): edge cases and UC-7 rules not covered above.
// ---------------------------------------------------------------------------------------------

describe('UC-5 score edge cases and widening', () => {
  it('TC-5-07 E: open spaces stop counting at 50, far shelters get no distance credit (never negative), size fit is worth 0.2', () => {
    expect(scoreShelter({ distanceMi: 10, openSpaces: 50 })).toBeCloseTo(scoreShelter({ distanceMi: 10, openSpaces: 500 }), 10);
    expect(scoreShelter({ distanceMi: 20, openSpaces: 0 })).toBeCloseTo(0.2, 10); // only the size-fit part is left
    expect(scoreShelter({ distanceMi: 25, openSpaces: 0 })).toBeCloseTo(0.2, 10); // past 20 miles: 0, not -0.125
    expect(scoreShelter({ distanceMi: 0, openSpaces: 0 })).toBeCloseTo(0.7, 10);
    expect(scoreShelter({ distanceMi: 5, openSpaces: 10, sizeFit: 1 }) - scoreShelter({ distanceMi: 5, openSpaces: 10, sizeFit: 0 })).toBeCloseTo(0.2, 10);
  });
  it('TC-5-08 A: the own shelter and full shelters are never listed', async () => {
    const app = signInAs(createTestApp(), 'rich');
    fillShelters(app, ['irving']);
    const { matches } = await app.matchEngine.findMatches({ dogId: 'D-1051', size: 'large' });
    expect(ids(matches)).toEqual(['carr', 'collin', 'dal']);
    expect(ids(matches).includes('rich')).toBe(false);
  });
  it('TC-5-09 A: "Widen search" finds a shelter past 20 miles; if still nothing, the search stays saved', async () => {
    const app = signInAs(createTestApp(), 'rich');
    fillShelters(app, ['dal', 'plano', 'irving', 'carr']);
    app.state.shelters.find((s) => s.id === 'collin').distanceMi = 25; // only Collin has space, and it is 25 mi away
    const first = await app.matchEngine.findMatches({ dogId: 'D-1051', size: 'large' });
    expect(first).toMatchObject({ matches: [], message: 'No match found', canWiden: true });
    const wider = await app.matchEngine.widenSearch(first.searchID, 30);
    expect(ids(wider.matches)).toEqual(['collin']);
    expect(wider.matches[0].score).toBeCloseTo(0.3 * (40 / 50) + 0.2, 4); // 0.44: distance part is 0, not negative
  });
  it('TC-5-09b A: widening still finds nothing, so the search stays saved with the wider distance', async () => {
    const app = signInAs(createTestApp(), 'rich');
    fillShelters(app, ['dal', 'collin', 'plano', 'irving', 'carr']);
    const first = await app.matchEngine.findMatches({ dogId: 'D-1051', size: 'large' });
    const still = await app.matchEngine.widenSearch(first.searchID, 50);
    expect(still).toMatchObject({ matches: [], message: 'No match found' });
    expect(app.state.savedSearches).toEqual([expect.objectContaining({ searchID: first.searchID, dogID: 'D-1051', size: 'large', radiusMi: 50 })]);
  });
});

describe('UC-7 rules (transfers.createFromMatch)', () => {
  it('TC-7-05 I: every empty required field is named', () => {
    const app = signInAs(createTestApp(), 'rich');
    let err;
    try { app.transfers.createFromMatch({ shelterID: 'irving', dogId: '', size: '' }); } catch (e) { err = e; }
    expect(err).toMatchObject({ code: 'VALIDATION', message: 'Please complete the highlighted fields.', fields: ['dogId', 'size'] });
    expect(app.state.transfers).toHaveLength(3);
  });
  it('TC-7-06 E: a dog never gets a second active transfer (NFR-8), whether Pending or Accepted', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(() => app.transfers.createFromMatch({ shelterID: 'irving', dogId: 'D-1042', size: 'large' })).toThrow('This dog already has an active transfer.'); // T-301 Pending
    expect(() => app.transfers.createFromMatch({ shelterID: 'irving', dogId: 'D-1043', size: 'small' })).toThrow('This dog already has an active transfer.'); // T-302 Accepted
    const first = app.transfers.createFromMatch({ shelterID: 'irving', dogId: 'D-1051', size: 'large' });
    expect(first.status).toBe('Pending');
    expect(() => app.transfers.createFromMatch({ shelterID: 'carr', dogId: 'D-1051', size: 'large' })).toThrow('This dog already has an active transfer.');
    expect(app.state.transfers.filter((t) => t.dogId === 'D-1051')).toHaveLength(1);
  });
  it('TC-7-07 S: every request is recorded (NFR-9) with sender, recipient, staff and outcome', () => {
    const app = signInAs(createTestApp(), 'rich');
    const { request } = app.transfers.createFromMatch({ shelterID: 'irving', dogId: 'D-1051', size: 'large', notes: 'Needs daily meds' });
    expect(request).toMatchObject({ id: 'T-303', status: 'Pending', fromShelterID: 'rich', toShelterID: 'irving', urgency: 'HIGH' }); // Duke is high risk
    const entry = app.transfers.getAuditLog().find((e) => e.requestID === 'T-303');
    expect(entry).toMatchObject({ action: 'Created', outcome: 'Pending', senderShelterID: 'rich', recipientShelterID: 'irving', actorStaffID: 1 });
  });
  it('TC-7-08 I: an unknown dog ID is refused and nothing is saved', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(() => app.transfers.createFromMatch({ shelterID: 'irving', dogId: 'D-9999', size: 'large' })).toThrow('Dog not found.');
    expect(app.state.transfers).toHaveLength(3);
  });
});

describe('UC-5 alternate 4a: a saved search ends once widening finds a shelter', () => {
  it('TC-5-10 A: widen finds Collin, so the saved search is removed and no stale "Match found" alert is sent later', async () => {
    const app = signInAs(createTestApp(), 'rich');
    fillShelters(app, ['dal', 'plano', 'irving', 'carr']);
    app.state.shelters.find((s) => s.id === 'collin').distanceMi = 25;
    const first = await app.matchEngine.findMatches({ dogId: 'D-1051', size: 'large' });
    expect(app.state.savedSearches).toHaveLength(1);
    const wider = await app.matchEngine.widenSearch(first.searchID, 30);
    expect(ids(wider.matches)).toEqual(['collin']);
    expect(app.state.savedSearches).toHaveLength(0); // staff now have a match; nothing left to rerun
    signInAs(app, 'dal');
    app.shelterStore.updateCapacity('dal', 5); // any capacity update used to rerun the old search
    await app.settle();
    expect(app.state.alerts.some((a) => a.recipientShelterID === 'rich' && a.message.startsWith('Match found for Duke'))).toBe(false);
  });
});
