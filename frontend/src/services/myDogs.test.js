// @vitest-environment node
/**
 * myDogs.test.js - tests for UC-10 View My Dogs' Transfers (FR-36, NFR-4).
 * Test case IDs match the SE Document (Part 1.5). Creator: Saif Yusuff.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs } from '../test/testApp.js';

describe('UC-10 View My Dogs\' Transfers', () => {
  it('TC-10-01 lists Biscuit (Pending), Pepper (Accepted) and Luna (Completed) with receiving shelter and date', () => {
    const app = signInAs(createTestApp(), 'rich');
    const { rows, message } = app.transfers.listMyDogs();
    expect(message).toBe(null);
    expect(rows.map((r) => [r.dogName, r.status, r.toShelterName])).toEqual([
      ['Biscuit', 'Pending', 'Collin County Animal Services'], ['Pepper', 'Accepted', 'Plano Animal Services'], ['Luna', 'Completed', 'Irving Animal Care Campus'],
    ]);
    expect(rows[0]).toMatchObject({ breed: 'Lab mix', size: 'large' });
  });
  it('TC-10-02 transfer details: requested time and receiving shelter contact', () => {
    const app = signInAs(createTestApp(), 'rich');
    const t = app.transfers.getMyDogTransfer('T-301');
    expect(t.requestedAt.toISOString()).toBe('2026-11-03T14:20:00.000Z');
    expect(t.receivingContact).toEqual({ phone: '(972) 555-0103', email: 'staff@collin.example' });
  });
  it('TC-10-03 empty list message, and the status changes live when the transfer is accepted', () => {
    const empty = signInAs(createTestApp(), 'dal');
    expect(empty.transfers.listMyDogs()).toEqual({ rows: [], message: 'No active transfers.' });
    const app = signInAs(createTestApp(), 'rich');
    const heard = [];
    app.events.on('transfer-changed', (e) => heard.push(e));
    signInAs(app, 'collin');
    app.transfers.accept('T-301');
    expect(heard).toEqual([{ requestID: 'T-301', status: 'Accepted' }]);
    signInAs(app, 'rich');
    expect(app.transfers.listMyDogs().rows[0]).toMatchObject({ dogName: 'Biscuit', status: 'Accepted' });
  });
  it('TC-10-04 Dallas staff cannot see Richardson\'s dogs (NFR-4)', () => {
    const app = signInAs(createTestApp(), 'dal');
    const names = app.transfers.listMyDogs().rows.map((r) => r.dogName);
    for (const n of ['Biscuit', 'Pepper', 'Luna']) expect(names.includes(n)).toBe(false);
    expect(() => app.transfers.getMyDogTransfer('T-301')).toThrow('You can only update your own shelter.');
  });
});

describe('NFR-4 staff only, own shelter only', () => {
  it('NTC-05 (a) anonymous sees nothing, (b) Dallas cannot edit Richardson, (c) Richardson can', () => {
    const app = createTestApp();
    let a = 'allowed'; try { app.shelterStore.listShelters(); } catch (e) { a = e.code; }
    signInAs(app, 'dal');
    let b = 'allowed'; try { app.shelterStore.updateCapacity('rich', 5); } catch (e) { b = e.code; }
    signInAs(app, 'rich');
    let c = 'allowed'; try { app.shelterStore.updateCapacity('rich', 5); } catch (e) { c = e.code; }
    expect([a, b, c]).toEqual(['AUTH_REQUIRED', 'FORBIDDEN', 'allowed']);
  });
});
