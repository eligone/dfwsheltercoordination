/**
 * alertService.js - alerts and the shelter inbox (UC-14: FR-17, FR-21, FR-22, FR-25 to FR-31, NFR-10).
 * Purpose: create alerts with the right priority, and give each shelter's staff their own inbox with
 * read/unread state, unread count, priority filter and the alert detail view.
 * Owner: Avalon Austin (UC-14). AI-assisted draft; the owner reviews and explains it.
 */
import { MESSAGES } from './messages.js';
import { ServiceError, AlertPriority } from './models.js';

const RANK = { high: 0, medium: 1, low: 2 };
const LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

export function createAlertService(ctx) {
  const { state, clock, auth } = ctx;
  const shelterName = (id) => state.shelters.find((s) => s.id === id)?.name ?? id;

  const view = (a) => ({
    id: a.id, type: a.type, priority: a.priority, priorityLabel: LABEL[a.priority], read: a.read, message: a.message,
    senderShelterID: a.senderShelterID, senderName: a.senderShelterID ? shelterName(a.senderShelterID) : null,
    createdAt: a.createdAt, transferRequestID: a.transferRequestID, dogId: a.dogId,
  });
  const mine = (staff) => state.alerts.filter((a) => a.recipientShelterID === staff.shelterID && !a.cancelled);

  return {
    /** FR-31: alerts about dogs at high risk (or sent with High urgency) are High priority; others are Medium. */
    priorityFor(dog, urgency) { return dog?.highRisk || urgency === 'HIGH' ? AlertPriority.HIGH : AlertPriority.MEDIUM; },

    /** Stores an alert and, when the recipient's preferences say so, sends it to their saved contacts too. */
    create({ type, priority, message, recipientShelterID, senderShelterID = null, transferRequestID = null, dogId = null, dispatch = true }) {
      const alert = { id: `A-${state.counters.alert++}`, type, priority, message, createdAt: clock.now(), read: false, recipientShelterID, senderShelterID, transferRequestID, dogId, cancelled: false };
      state.alerts.push(alert);
      if (dispatch) ctx.track(ctx.notifications.dispatch(alert));
      return alert;
    },

    /** UC-14 main course: this staff member's shelter inbox (FR-22, FR-26, FR-27, FR-28, FR-29, NFR-10). */
    getInbox({ priority = null, unreadOnly = false } = {}) {
      const staff = auth.requireStaff();
      const all = mine(staff);
      let list = all;
      if (priority) list = list.filter((a) => a.priority === priority);
      if (unreadOnly) list = list.filter((a) => !a.read);
      list = [...list].sort((a, b) => RANK[a.priority] - RANK[b.priority] || b.createdAt - a.createdAt);
      return {
        alerts: list.map(view), unreadCount: all.filter((a) => !a.read).length, isEmpty: all.length === 0,
        emptyTitle: all.length === 0 ? MESSAGES.NO_NOTIFICATIONS : null, emptyHint: all.length === 0 ? MESSAGES.ALL_CAUGHT_UP : null,
      };
    },

    /** FR-25, FR-26, FR-30, NFR-10: open one alert; it becomes read and shows dog, sender contact and past outcomes. */
    openAlert(id) {
      const staff = auth.requireStaff();
      const alert = state.alerts.find((a) => a.id === id);
      if (!alert) throw new ServiceError('NOT_FOUND', 'Alert not found.');
      if (alert.recipientShelterID !== staff.shelterID) throw new ServiceError('FORBIDDEN', MESSAGES.OWN_ALERTS);
      alert.read = true;
      const request = state.transfers.find((t) => t.id === alert.transferRequestID);
      if (request) request.viewedBy[staff.shelterID] = clock.now(); // stops the FR-24 reminder
      const sender = alert.senderShelterID ? state.shelters.find((s) => s.id === alert.senderShelterID) : null;
      const dog = state.dogs.find((d) => d.id === (alert.dogId ?? request?.dogId)) ?? null;
      return {
        alert: view(alert), dog, sender: sender ? { name: sender.name, phone: sender.phone, email: sender.email } : null,
        outcome: request ? { requestID: request.id, status: request.status, history: state.auditLog.filter((e) => e.requestID === request.id) } : null,
      };
    },
    markUnread(id) {
      const staff = auth.requireStaff();
      const a = state.alerts.find((x) => x.id === id && x.recipientShelterID === staff.shelterID);
      if (!a) throw new ServiceError('FORBIDDEN', MESSAGES.OWN_ALERTS);
      a.read = false;
    },
    markAllRead() { mine(auth.requireStaff()).forEach((a) => { a.read = true; }); },
    unreadCount() { return mine(auth.requireStaff()).filter((a) => !a.read).length; },
  };
}
