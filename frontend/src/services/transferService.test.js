// @vitest-environment node
/**
 * transferService.test.js - tests for UC-3 Request Animal Transfer, UC-4 Respond to Transfer Match, NFR-8, NFR-9.
 * Test case IDs match the SE Document (Part 1.5 and 1.6). Creator: Joshua Nakka.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs, fillShelters, availableOf, releaseDog, DAY } from '../test/testApp.js';
import { createStubMapping } from './matchEngine.js';
import { canMoveTo } from './transferService.js';

const ids = (matches) => matches.map((m) => m.shelterID);

describe('UC-3 Request Animal Transfer', () => {
  it('TC-3-01 creates a Pending request, ranks shelters and alerts the top three', async () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    const result = await app.transfers.createRequest({ dogId: 'D-1042', urgency: 'HIGH' });
    await app.settle();
    expect(result.request.status).toBe('Pending');
    expect(result.request.id).toBe('T-303');
    expect(ids(result.matches)).toEqual(['irving', 'carr', 'collin', 'dal']); // Plano (no large dogs) and Richardson absent
    expect(result.matches.map((m) => m.score)[0]).toBeCloseTo(0.549, 3);
    const alertsFor = (sid) => app.state.alerts.filter((a) => a.transferRequestID === 'T-303' && a.recipientShelterID === sid);
    for (const sid of ['irving', 'carr', 'collin']) {
      expect(alertsFor(sid)).toHaveLength(1);
      expect(alertsFor(sid)[0]).toMatchObject({ read: false, priority: 'high', type: 'MATCH_FOUND' });
    }
    expect(alertsFor('dal')).toHaveLength(0);
    expect(alertsFor('rich')).toHaveLength(1); // the requesting shelter is told too (FR-17)
    expect(result.message).toBe('Transfer request sent.');
  });
  it('TC-3-02 missing fields are named and nothing is created', async () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    const before = app.state.transfers.length;
    await expect(app.transfers.createRequest({})).rejects.toThrow('Please complete the highlighted fields.');
    try { await app.transfers.createRequest({}); } catch (e) { expect(e.fields).toEqual(['dogId', 'urgency']); }
    await expect(app.transfers.createRequest({ dogId: 'D-1042' })).rejects.toThrow('Please complete the highlighted fields.');
    expect(app.state.transfers).toHaveLength(before);
  });
  it('TC-3-03 no shelter can take the dog: "No match found", request stays Pending, no alerts', async () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    fillShelters(app, ['dal', 'collin', 'plano', 'irving', 'carr']);
    const alertsBefore = app.state.alerts.length;
    const result = await app.transfers.createRequest({ dogId: 'D-1042', urgency: 'NORMAL' });
    expect(result.message).toBe('No match found');
    expect(result.matches).toHaveLength(0);
    expect(result.request.status).toBe('Pending');
    expect(app.state.alerts).toHaveLength(alertsBefore);
  });
  it('TC-3-04 a shelter that cannot handle medical needs is filtered out (FR-18)', async () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    app.state.shelters.find((s) => s.id === 'collin').medicalCapable = false;
    const result = await app.transfers.createRequest({ dogId: 'D-1042', urgency: 'HIGH' });
    expect(ids(result.matches)).toEqual(['irving', 'carr', 'dal']);
  });
  it('TC-3-05 Mapping API failure: friendly message, nothing saved, dog can be retried', async () => {
    const app = signInAs(createTestApp({ mapping: createStubMapping({ fail: true }) }), 'rich');
    releaseDog(app, 'D-1042');
    const before = [app.state.transfers.length, app.state.auditLog.length, app.state.alerts.length];
    await expect(app.transfers.createRequest({ dogId: 'D-1042', urgency: 'HIGH' })).rejects.toThrow('Could not calculate distances. Try again.');
    expect([app.state.transfers.length, app.state.auditLog.length, app.state.alerts.length]).toEqual(before);
    expect(app.transfers.hasActiveTransfer('D-1042')).toBe(false); // the dog is free again, so staff can retry
  });
});

describe('UC-4 Respond to Transfer Match', () => {
  it('TC-4-01 accept: status, Collin capacity 40 -> 39, sender notified', () => {
    const app = signInAs(createTestApp(), 'collin');
    expect(availableOf(app, 'collin')).toBe(40);
    const { request } = app.transfers.accept('T-301');
    expect(request.status).toBe('Accepted');
    expect(availableOf(app, 'collin')).toBe(39);
    const told = app.state.alerts.find((a) => a.recipientShelterID === 'rich' && a.message === 'Transfer T-301 accepted by Collin County Animal Services');
    expect(told).toMatchObject({ read: false, priority: 'medium' });
    expect(app.state.auditLog.some((e) => e.requestID === 'T-301' && e.action === 'Accepted')).toBe(true);
  });
  it('TC-4-01b accepting cancels the alerts sent to the other shelters', async () => {
    const app = signInAs(createTestApp(), 'rich');
    await app.transfers.createRequest({ dogId: 'D-1051', urgency: 'NORMAL' });
    signInAs(app, 'irving');
    app.transfers.accept('T-303');
    const others = app.state.alerts.filter((a) => a.transferRequestID === 'T-303' && a.type === 'MATCH_FOUND' && a.recipientShelterID !== 'irving');
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((a) => a.cancelled)).toBe(true);
  });
  it('TC-4-02 completed: Richardson capacity 2 -> 3', () => {
    const app = signInAs(createTestApp(), 'collin');
    app.transfers.accept('T-301');
    signInAs(app, 'rich');
    const { request, shelter } = app.transfers.complete('T-301');
    expect(request.status).toBe('Completed');
    expect(availableOf(app, 'rich')).toBe(3);
    expect(shelter.availableKennels).toBe(3);
  });
  it('TC-4-03 decline with reason: stored, next ranked shelter alerted, no capacity change', () => {
    const app = signInAs(createTestApp(), 'collin');
    const { request, offeredTo } = app.transfers.decline('T-301', 'No medical staff on site');
    expect(request.responses.collin).toEqual({ status: 'Declined', reason: 'No medical staff on site' });
    expect(offeredTo).toBe('carr');
    expect(app.state.alerts.some((a) => a.recipientShelterID === 'carr' && a.transferRequestID === 'T-301' && a.type === 'MATCH_FOUND')).toBe(true);
    expect(availableOf(app, 'collin')).toBe(40);
    expect(availableOf(app, 'rich')).toBe(2);
    expect(request.status).toBe('Pending'); // still open for the next shelter
  });
  it('TC-4-03b the last shelter declining ends the request as Declined', () => {
    const app = signInAs(createTestApp(), 'plano');
    app.state.transfers.push({ id: 'T-900', dogId: 'D-1051', fromShelterID: 'rich', toShelterID: 'plano', urgency: 'NORMAL', status: 'Pending', notes: '', declineReason: null, requestedAt: new Date(), respondedAt: null, offeredTo: ['plano'], alertedTo: ['plano'], responses: {}, viewedBy: {}, reminded: {} });
    expect(app.transfers.decline('T-900', '').request.status).toBe('Declined');
  });
  it('TC-4-04 accepting when the shelter has filled: message, still Pending, never negative', () => {
    const app = signInAs(createTestApp(), 'collin');
    fillShelters(app, ['collin']);
    expect(() => app.transfers.accept('T-301')).toThrow('This shelter no longer has space.');
    expect(app.transfers.getRequest('T-301').status).toBe('Pending');
    expect(availableOf(app, 'collin')).toBe(0);
  });
  it('TC-4-05 illegal status changes are rejected and statuses stay the same', () => {
    const app = signInAs(createTestApp(), 'irving');
    expect(() => app.transfers.accept('T-298')).toThrow('This request is no longer pending.');
    signInAs(app, 'rich');
    expect(() => app.transfers.complete('T-301')).toThrow('Accept the request first.');
    expect(app.transfers.getRequest('T-298').status).toBe('Completed');
    expect(app.transfers.getRequest('T-301').status).toBe('Pending');
    signInAs(app, 'dal');
    expect(() => app.transfers.accept('T-301')).toThrow('You can only respond to requests sent to your shelter.');
  });
  it('state-transition table', () => {
    expect(canMoveTo('Pending', 'Accepted')).toBe(true);
    expect(canMoveTo('Accepted', 'Completed')).toBe(true);
    expect(canMoveTo('Pending', 'Completed')).toBe(false);
    expect(canMoveTo('Completed', 'Accepted')).toBe(false);
    expect(canMoveTo('Declined', 'Pending')).toBe(false);
  });
});

describe('NFR-8 and NFR-9', () => {
  it('NTC-09 two simultaneous requests for one dog: exactly one succeeds (100 runs)', async () => {
    for (let i = 0; i < 100; i += 1) {
      const app = signInAs(createTestApp(), 'rich');
      app.state.transfers = app.state.transfers.filter((t) => t.dogId !== 'D-1042'); // Biscuit starts with no active transfer
      const results = await Promise.allSettled([app.transfers.createRequest({ dogId: 'D-1042', urgency: 'HIGH' }), app.transfers.createRequest({ dogId: 'D-1042', urgency: 'HIGH' })]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((r) => r.status === 'rejected');
      expect(rejected.reason.message).toBe('This dog already has an active transfer.');
      expect(app.state.transfers.filter((t) => t.dogId === 'D-1042' && ['Pending', 'Accepted'].includes(t.status))).toHaveLength(1);
    }
  });
  it('NTC-10 audit record has the required fields and is kept 364 days but removed at 366', async () => {
    const app = signInAs(createTestApp(), 'rich');
    await app.transfers.createRequest({ dogId: 'D-1051', urgency: 'HIGH' });
    signInAs(app, 'irving');
    app.transfers.accept('T-303');
    const entries = () => app.transfers.getAuditLog().filter((e) => e.requestID === 'T-303');
    expect(entries().map((e) => e.action)).toEqual(['Created', 'Accepted']);
    expect(entries()[1]).toMatchObject({ requestID: 'T-303', senderShelterID: 'rich', recipientShelterID: 'irving', outcome: 'Accepted' });
    expect(entries()[1].timestamp instanceof Date).toBe(true);
    app.clock.advance(364 * DAY);
    expect(entries()).toHaveLength(2);
    app.clock.advance(2 * DAY);
    expect(app.transfers.purgeExpired()).toBeGreaterThan(0);
    expect(entries()).toHaveLength(0);
  });
});

describe('Audit fix B1: a completed dog cannot be transferred again', () => {
  it('TC-4-06 after Completed the dog belongs to the receiving shelter; re-request is refused; My Dogs still lists it', async () => {
    const app = signInAs(createTestApp(), 'collin');
    app.transfers.accept('T-301');
    signInAs(app, 'rich');
    app.transfers.complete('T-301');
    expect(app.state.dogs.find((d) => d.id === 'D-1042').shelterID).toBe('collin');
    await expect(app.transfers.createRequest({ dogId: 'D-1042', urgency: 'HIGH' })).rejects.toThrow('This dog is not at your shelter.');
    expect(() => app.transfers.createFromMatch({ shelterID: 'irving', dogId: 'D-1042', size: 'large' })).toThrow('This dog is not at your shelter.');
    expect(app.state.transfers.filter((t) => t.dogId === 'D-1042')).toHaveLength(1); // no second transfer was created
    const row = app.transfers.listMyDogs().rows.find((r) => r.dogName === 'Biscuit');
    expect(row).toMatchObject({ status: 'Completed', toShelterName: 'Collin County Animal Services' }); // still visible in My Dogs (FR-36)
  });
});

describe('Audit fix B4: cancelling notifies the other shelter (FR-21)', () => {
  const inboxMessages = (app, who) => { signInAs(app, who); return app.alerts.getInbox().alerts; };

  it('TC-4-07a cancelling an Accepted transfer frees the kennel and tells the receiving shelter to release it (High)', () => {
    const app = signInAs(createTestApp(), 'collin');
    app.transfers.accept('T-301');
    expect(availableOf(app, 'collin')).toBe(39);
    signInAs(app, 'rich');
    app.transfers.cancel('T-301');
    expect(availableOf(app, 'collin')).toBe(40);
    const notice = inboxMessages(app, 'collin').find((a) => a.message.startsWith('Transfer T-301 cancelled'));
    expect(notice).toMatchObject({ message: 'Transfer T-301 cancelled by Richardson Animal Shelter. Please release the reserved kennel.', priority: 'high', read: false, type: 'STATUS_CHANGE' });
  });
  it('TC-4-07b cancelling a Pending transfer notifies every shelter that was asked, with no capacity change', async () => {
    const app = signInAs(createTestApp(), 'rich');
    await app.transfers.createRequest({ dogId: 'D-1051', urgency: 'NORMAL' });
    const before = ['irving', 'carr', 'collin'].map((id) => availableOf(app, id));
    app.transfers.cancel('T-303');
    expect(['irving', 'carr', 'collin'].map((id) => availableOf(app, id))).toEqual(before);
    for (const who of ['irving', 'carr', 'collin']) {
      const msgs = inboxMessages(app, who).filter((a) => a.message.includes('T-303'));
      expect(msgs.map((a) => a.message)).toEqual(['Transfer T-303 cancelled by Richardson Animal Shelter']); // the old match alert is hidden, only the cancel notice remains
      expect(msgs[0].priority).toBe('medium');
    }
  });
  it('TC-4-07c a shelter that already declined is not told; other shelters cannot cancel', () => {
    const app = signInAs(createTestApp(), 'collin');
    app.transfers.decline('T-301', 'No room for large dogs');
    signInAs(app, 'dal');
    expect(() => app.transfers.cancel('T-301')).toThrow('You can only update your own shelter.');
    signInAs(app, 'rich');
    app.transfers.cancel('T-301');
    expect(inboxMessages(app, 'collin').some((a) => a.message.startsWith('Transfer T-301 cancelled'))).toBe(false);
    expect(inboxMessages(app, 'carr').some((a) => a.message.startsWith('Transfer T-301 cancelled'))).toBe(true);
  });
});
