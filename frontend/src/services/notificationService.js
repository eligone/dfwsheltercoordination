/**
 * notificationService.js - contacts, notification preferences, reminders and delivery retry (UC-15: FR-23, FR-24, NFR-7).
 * Purpose: staff manage extra phone numbers and emails (shelter level), choose the reminder delay and which
 * priorities are also sent to contacts; the service sends reminders and retries failed deliveries 3 times.
 * Real email/SMS are replaced by stub channels in Part 1 (NotificationChannel in the class diagram).
 * Owner: Avalon Austin (UC-15). AI-assisted draft; the owner reviews and explains it.
 */
import { MESSAGES } from './messages.js';
import { ServiceError, AlertType, AlertPriority, DeliveryStatus, PriorityThreshold, ContactType } from './models.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 3; // NFR-7

/** Stand-ins for EmailChannel and SmsChannel: record what was sent, and fail on demand for tests. */
export function createStubChannels() {
  const make = () => {
    const ch = { sent: [], failFor: new Set(), calls: 0, async send(contact, alert) {
      ch.calls += 1;
      if (ch.failFor.has(contact.value)) throw new Error('Delivery refused');
      ch.sent.push({ to: contact.value, alertId: alert.id });
      return true;
    } };
    return ch;
  };
  return { [ContactType.EMAIL]: make(), [ContactType.PHONE]: make() };
}

const qualifies = (threshold, priority) =>
  threshold === PriorityThreshold.ALL || (threshold === PriorityThreshold.HIGH_AND_MEDIUM && priority !== AlertPriority.LOW) || (threshold === PriorityThreshold.HIGH_ONLY && priority === AlertPriority.HIGH);
const digits = (v) => String(v).replace(/\D/g, '');

export function createNotificationService(ctx, channels = createStubChannels()) {
  const { state, clock, auth } = ctx;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  async function sendWithRetry(contact, alert) {
    let lastError = 'Unknown error';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const ok = await channels[contact.type].send(contact, alert);
        if (ok !== false) { contact.deliveryStatus = DeliveryStatus.VERIFIED; return true; }
        lastError = 'Channel returned false';
      } catch (e) { lastError = e.message; }
    }
    contact.deliveryStatus = DeliveryStatus.DELIVERY_FAILED;
    state.deliveryLog.push({ logID: state.counters.log++, alertID: alert.id, contactID: contact.contactID, attempts: MAX_ATTEMPTS, lastError, loggedAt: clock.now() });
    return false;
  }

  return {
    channels,
    getPreferences() { return clone(state.preferences[auth.requireStaff().shelterID]); },

    /** FR-23: returns a new draft with the contact added (the Add contact button); nothing is saved yet. */
    addContactToDraft(draft, { type, value }) {
      const v = String(value ?? '').trim();
      if (type === ContactType.EMAIL && !EMAIL.test(v)) throw new ServiceError('VALIDATION', MESSAGES.INVALID_EMAIL, ['value']);
      if (type === ContactType.PHONE && digits(v).length !== 10) throw new ServiceError('VALIDATION', MESSAGES.INVALID_PHONE, ['value']);
      const same = (c) => c.type === type && (type === ContactType.PHONE ? digits(c.value) === digits(v) : c.value.toLowerCase() === v.toLowerCase());
      if (draft.contacts.some(same)) throw new ServiceError('DUPLICATE', MESSAGES.DUPLICATE_CONTACT, ['value']);
      return { ...draft, contacts: [...draft.contacts, { contactID: null, type, value: v, deliveryStatus: DeliveryStatus.VERIFIED }] };
    },
    removeContactFromDraft(draft, contactID) { return { ...draft, contacts: draft.contacts.filter((c) => c.contactID !== contactID) }; },

    /** FR-23/FR-24: "Save changes". Cancel simply never calls this, so the old values stay. */
    savePreferences(draft) {
      const shelterID = auth.requireStaff().shelterID;
      if (!Number.isInteger(draft.reminderDelayMinutes) || draft.reminderDelayMinutes <= 0) throw new ServiceError('VALIDATION', 'Enter a reminder delay in minutes.', ['reminderDelayMinutes']);
      if (!Object.values(PriorityThreshold).includes(draft.sendToContactsFor)) throw new ServiceError('VALIDATION', 'Choose which alerts are also sent to contacts.', ['sendToContactsFor']);
      const contacts = draft.contacts.map((c) => ({ ...c, contactID: c.contactID ?? state.counters.contact++ }));
      state.preferences[shelterID] = { reminderDelayMinutes: draft.reminderDelayMinutes, sendToContactsFor: draft.sendToContactsFor, contacts };
      return { message: MESSAGES.PREFS_SAVED, preferences: clone(state.preferences[shelterID]) };
    },

    /** NFR-7: send to the recipient shelter's saved contacts; retry 3 times; log the failure. The inbox copy is never blocked. */
    async dispatch(alert, { force = false } = {}) {
      const prefs = state.preferences[alert.recipientShelterID];
      if (!prefs || (!force && !qualifies(prefs.sendToContactsFor, alert.priority))) return;
      for (const contact of prefs.contacts) await sendWithRetry(contact, alert);
    },

    /** What a contact row shows after a failed delivery. */
    describeDelivery(contact) {
      return contact.deliveryStatus === DeliveryStatus.DELIVERY_FAILED ? { label: MESSAGES.DELIVERY_FAILED, detail: MESSAGES.DELIVERY_DETAIL } : { label: 'Verified', detail: null };
    },

    /** FR-24: remind shelters that have not viewed or answered a pending request; sent to the inbox and all contacts. */
    sendReminders() {
      const now = clock.now();
      const created = [];
      for (const t of state.transfers.filter((x) => x.status === 'Pending')) {
        for (const sid of t.alertedTo) {
          const delay = state.preferences[sid]?.reminderDelayMinutes ?? 60;
          if (t.responses[sid] || t.viewedBy[sid] || t.reminded[sid]) continue;
          if (now.getTime() - t.requestedAt.getTime() < delay * 60000) continue;
          t.reminded[sid] = true;
          const alert = ctx.alerts.create({ type: AlertType.REMINDER, priority: AlertPriority.LOW, message: `Reminder: request ${t.id} not viewed`, recipientShelterID: sid, senderShelterID: t.fromShelterID, transferRequestID: t.id, dogId: t.dogId, dispatch: false });
          ctx.track(this.dispatch(alert, { force: true }));
          created.push(alert);
        }
      }
      return created;
    },
  };
}
