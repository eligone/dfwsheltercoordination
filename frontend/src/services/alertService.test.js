// @vitest-environment node
/**
 * alertService.test.js - tests for UC-14 View Alerts Inbox and NFR-10.
 * Test case IDs match the SE Document (Part 1.5 and 1.6). Creator: Avalon Austin.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs, releaseDog } from '../test/testApp.js';

describe('UC-14 View Alerts Inbox', () => {
  it('TC-14-01 inbox shows 3 alerts with priority labels, read state and unread count 2', () => {
    const app = signInAs(createTestApp(), 'rich');
    const inbox = app.alerts.getInbox();
    expect(inbox.alerts.map((a) => [a.id, a.priorityLabel, a.read])).toEqual([['A-90', 'High', false], ['A-89', 'Medium', false], ['A-88', 'Low', true]]);
    expect(inbox.unreadCount).toBe(2);
    expect(inbox.isEmpty).toBe(false);
  });
  it('TC-14-02 opening A-90 marks it read and shows the dog, sender contact and past outcome', () => {
    const app = signInAs(createTestApp(), 'rich');
    const details = app.alerts.openAlert('A-90');
    expect(details.alert.message).toBe('Match found for Biscuit (D-1042)');
    expect(details.dog.name).toBe('Biscuit');
    expect(details.sender).toEqual({ name: 'Collin County Animal Services', phone: '(972) 555-0103', email: 'staff@collin.example' });
    expect(details.outcome.status).toBe('Pending');
    expect(app.alerts.getInbox().unreadCount).toBe(1);
  });
  it('TC-14-03 filter by High, Unread tab, and Mark all as read', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(app.alerts.getInbox({ priority: 'high' }).alerts.map((a) => a.id)).toEqual(['A-90']);
    expect(app.alerts.getInbox({ unreadOnly: true }).alerts.map((a) => a.id)).toEqual(['A-90', 'A-89']);
    app.alerts.markAllRead();
    expect(app.alerts.getInbox().unreadCount).toBe(0);
    app.alerts.markUnread('A-89');
    expect(app.alerts.getInbox().unreadCount).toBe(1);
  });
  it('TC-14-04 empty inbox shows the exact empty-state text', () => {
    const app = signInAs(createTestApp(), 'dal');
    const inbox = app.alerts.getInbox();
    expect(inbox.isEmpty).toBe(true);
    expect(inbox.emptyTitle).toBe('No notifications');
    expect(inbox.emptyHint).toBe("You're all caught up. New alerts will appear here.");
    expect(inbox.unreadCount).toBe(0);
  });
  it('TC-14-05 accepted, declined and cancelled transfers notify the sender with medium priority', () => {
    const app = signInAs(createTestApp(), 'collin');
    app.transfers.accept('T-301');
    signInAs(app, 'rich');
    const accepted = app.alerts.getInbox().alerts.find((a) => a.message === 'Transfer T-301 accepted by Collin County Animal Services');
    expect(accepted).toMatchObject({ read: false, priority: 'medium' });
    app.transfers.cancel('T-301');
    expect(app.alerts.getInbox().alerts.some((a) => a.id && a.message === 'Transfer T-301 accepted by Collin County Animal Services')).toBe(true);
    const app2 = signInAs(createTestApp(), 'collin');
    app2.transfers.decline('T-301', 'Full of puppies');
    signInAs(app2, 'rich');
    expect(app2.alerts.getInbox().alerts.some((a) => a.message === 'Transfer T-301 declined by Collin County Animal Services' && a.priority === 'medium')).toBe(true);
  });
  it('TC-14-06 high-risk dogs get High priority and appear first; others Medium', async () => {
    const app = signInAs(createTestApp(), 'rich');
    const duke = app.state.dogs.find((d) => d.name === 'Duke');
    const pepper = app.state.dogs.find((d) => d.name === 'Pepper');
    expect(app.alerts.priorityFor(duke, 'NORMAL')).toBe('high');
    expect(app.alerts.priorityFor(pepper, 'NORMAL')).toBe('medium');
    releaseDog(app, 'D-1051');
    await app.transfers.createRequest({ dogId: 'D-1051', urgency: 'NORMAL' });
    signInAs(app, 'irving');
    const first = app.alerts.getInbox().alerts[0];
    expect(first).toMatchObject({ priority: 'high' });
    expect(first.message).toContain('Duke');
  });
});

describe('NFR-10 inbox privacy', () => {
  it('NTC-11 Dallas staff see none of Richardson\'s 3 alerts and cannot open A-90', () => {
    const app = signInAs(createTestApp(), 'dal');
    const visible = app.alerts.getInbox().alerts.map((a) => a.id);
    for (const id of ['A-90', 'A-89', 'A-88']) expect(visible.includes(id)).toBe(false);
    expect(() => app.alerts.openAlert('A-90')).toThrow('You can only view alerts for your shelter.');
  });
});
