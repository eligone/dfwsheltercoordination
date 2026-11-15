// @vitest-environment node
/**
 * notificationService.test.js - tests for UC-15 Manage Notification Preferences and NFR-7.
 * Test case IDs match the SE Document (Part 1.5 and 1.6). Creator: Avalon Austin.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs, fillShelters, releaseDog, MIN } from '../test/testApp.js';

describe('UC-15 Manage Notification Preferences', () => {
  it('TC-15-01 add a valid email, save: listed and saved with message', () => {
    const app = signInAs(createTestApp(), 'rich');
    const draft = app.notifications.addContactToDraft(app.notifications.getPreferences(), { type: 'EMAIL', value: 'intake2@richardson.example' });
    expect(draft.contacts.map((c) => c.value)).toContain('intake2@richardson.example');
    const saved = app.notifications.savePreferences(draft);
    expect(saved.message).toBe('Preferences saved.');
    const stored = app.notifications.getPreferences().contacts.find((c) => c.value === 'intake2@richardson.example');
    expect(stored.contactID).toBeGreaterThan(0);
  });
  it('TC-15-02 invalid email and phone are rejected with the exact messages', () => {
    const app = signInAs(createTestApp(), 'rich');
    const draft = app.notifications.getPreferences();
    expect(() => app.notifications.addContactToDraft(draft, { type: 'EMAIL', value: 'intake@richardson' })).toThrow('Enter a valid email address');
    expect(() => app.notifications.addContactToDraft(draft, { type: 'PHONE', value: '12345' })).toThrow('Enter a valid phone number');
    expect(app.notifications.getPreferences().contacts).toHaveLength(1);
    expect(app.notifications.addContactToDraft(draft, { type: 'PHONE', value: '(972) 555-0199' }).contacts).toHaveLength(2);
  });
  it('TC-15-03 save keeps new reminder and priority settings; cancel keeps the old ones', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(app.notifications.getPreferences()).toMatchObject({ reminderDelayMinutes: 60, sendToContactsFor: 'HIGH_ONLY' });
    const draft = { ...app.notifications.getPreferences(), reminderDelayMinutes: 120, sendToContactsFor: 'HIGH_AND_MEDIUM' };
    // Cancel: the draft is dropped without saving
    expect(app.notifications.getPreferences()).toMatchObject({ reminderDelayMinutes: 60, sendToContactsFor: 'HIGH_ONLY' });
    expect(app.notifications.savePreferences(draft).message).toBe('Preferences saved.');
    expect(app.notifications.getPreferences()).toMatchObject({ reminderDelayMinutes: 120, sendToContactsFor: 'HIGH_AND_MEDIUM' });
  });
  it('TC-15-04 reminder goes to the inbox and all contacts when a request is unviewed after the delay', async () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    fillShelters(app, ['dal', 'plano', 'irving', 'carr']); // only Collin can take Biscuit
    await app.transfers.createRequest({ dogId: 'D-1042', urgency: 'NORMAL' });
    await app.settle();
    app.clock.advance(61 * MIN);
    const made = app.notifications.sendReminders();
    await app.settle();
    expect(made).toHaveLength(1);
    expect(made[0]).toMatchObject({ type: 'REMINDER', recipientShelterID: 'collin', message: 'Reminder: request T-303 not viewed' });
    expect(app.channels.EMAIL.sent.some((s) => s.to === 'staff@collin.example' && s.alertId === made[0].id)).toBe(true);
    expect(app.notifications.sendReminders()).toHaveLength(0); // only one reminder per request
  });
  it('TC-15-04b no reminder when the request was viewed in time', async () => {
    const app = signInAs(createTestApp(), 'rich');
    releaseDog(app, 'D-1042');
    fillShelters(app, ['dal', 'plano', 'irving', 'carr']);
    await app.transfers.createRequest({ dogId: 'D-1042', urgency: 'NORMAL' });
    app.clock.advance(30 * MIN);
    signInAs(app, 'collin');
    const alert = app.state.alerts.find((a) => a.recipientShelterID === 'collin' && a.transferRequestID === 'T-303');
    app.alerts.openAlert(alert.id);
    app.clock.advance(31 * MIN);
    expect(app.notifications.sendReminders()).toHaveLength(0);
  });
  it('TC-15-05 failed delivery: 3 attempts, one log entry, contact marked failed, inbox alert still arrives', async () => {
    const app = signInAs(createTestApp(), 'rich');
    const draft = app.notifications.addContactToDraft(app.notifications.getPreferences(), { type: 'EMAIL', value: 'intake@richardson.example' });
    app.notifications.savePreferences(draft);
    app.channels.EMAIL.failFor.add('intake@richardson.example');
    const alert = app.alerts.create({ type: 'MATCH_FOUND', priority: 'high', message: 'Match found for Duke (D-1051)', recipientShelterID: 'rich', senderShelterID: 'collin' });
    await app.settle();
    const failed = app.channels.EMAIL.calls - app.channels.EMAIL.sent.length; // refused calls
    expect(failed).toBe(3);
    expect(app.state.deliveryLog).toHaveLength(1);
    expect(app.state.deliveryLog[0]).toMatchObject({ alertID: alert.id, attempts: 3 });
    const contact = app.notifications.getPreferences().contacts.find((c) => c.value === 'intake@richardson.example');
    expect(app.notifications.describeDelivery(contact)).toEqual({ label: 'Delivery failed', detail: 'Retried 3 times. Failure logged.' });
    expect(app.alerts.getInbox().alerts.some((a) => a.id === alert.id)).toBe(true);
    expect(app.channels.EMAIL.sent.some((s) => s.to === 'staff@richardson.example')).toBe(true); // the other contact still got it
  });
  it('TC-15-06 duplicate contact is refused; remove deletes it', () => {
    const app = signInAs(createTestApp(), 'rich');
    const draft = app.notifications.getPreferences();
    expect(() => app.notifications.addContactToDraft(draft, { type: 'EMAIL', value: 'staff@richardson.example' })).toThrow('This contact has already been added.');
    const removed = app.notifications.removeContactFromDraft(draft, draft.contacts[0].contactID);
    app.notifications.savePreferences(removed);
    expect(app.notifications.getPreferences().contacts).toHaveLength(0);
  });
  it('priority threshold: a Low alert is not sent to contacts when only High is selected', async () => {
    const app = signInAs(createTestApp(), 'rich');
    app.alerts.create({ type: 'REMINDER', priority: 'low', message: 'low one', recipientShelterID: 'rich' });
    await app.settle();
    expect(app.channels.EMAIL.calls).toBe(0);
  });
});

describe('NFR-7 retry and log', () => {
  it('NTC-08 exactly 3 attempts and exactly 1 log entry with alert ID, contact and time', async () => {
    const app = signInAs(createTestApp(), 'rich');
    app.channels.EMAIL.failFor.add('staff@richardson.example');
    const alert = app.alerts.create({ type: 'MATCH_FOUND', priority: 'high', message: 'x', recipientShelterID: 'rich' });
    await app.settle();
    expect(app.channels.EMAIL.calls).toBe(3);
    expect(app.state.deliveryLog).toHaveLength(1);
    expect(app.state.deliveryLog[0]).toMatchObject({ alertID: alert.id, contactID: 1, attempts: 3 });
    expect(app.state.deliveryLog[0].loggedAt instanceof Date).toBe(true);
  });
});
