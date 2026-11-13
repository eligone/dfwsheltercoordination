/**
 * transferService.js - transfer requests, responses, status changes, audit log and "My Dogs"
 * (UC-3 FR-9 to FR-11 and FR-18; UC-4 FR-7, FR-11, FR-19, FR-20; UC-7 FR-16; UC-10 FR-36; NFR-8, NFR-9).
 * Purpose: the single place that creates and changes transfer requests, so the rules (one active transfer
 * per dog, legal status changes, capacity updates, alerts, audit record) cannot be skipped by a screen.
 * Owner: Joshua Nakka (UC-3, UC-4); createFromMatch is the UC-7 side (Anais); listMyDogs is UC-10 (Saif).
 * AI-assisted draft; each owner reviews and explains their part.
 */
import { MESSAGES } from './messages.js';
import { ServiceError, TransferStatus as S, AlertType, addDays, RETENTION_DAYS } from './models.js';

/** State-transition rule (class diagram: TransferRequest.canMoveTo). */
const TRANSITIONS = {
  [S.PENDING]: [S.ACCEPTED, S.DECLINED, S.CANCELLED],
  [S.ACCEPTED]: [S.COMPLETED, S.CANCELLED],
  [S.DECLINED]: [], [S.COMPLETED]: [], [S.CANCELLED]: [],
};
export const canMoveTo = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;
const ACTIVE = [S.PENDING, S.ACCEPTED];

export function createTransferService(ctx) {
  const { state, clock, auth, events } = ctx;
  const shelter = (id) => state.shelters.find((s) => s.id === id);
  const dogOf = (id) => state.dogs.find((d) => d.id === id);
  const request = (id) => {
    const r = state.transfers.find((t) => t.id === id);
    if (!r) throw new ServiceError('NOT_FOUND', 'Transfer request not found.');
    return r;
  };

  /** NFR-9: every action leaves an audit entry that is kept for the retention period. */
  function audit(r, action, staff) {
    const now = clock.now();
    state.auditLog.push({ entryID: state.counters.entry++, requestID: r.id, action, outcome: r.status, timestamp: now, senderShelterID: r.fromShelterID, recipientShelterID: r.toShelterID, actorStaffID: staff?.staffID ?? null, retainUntil: addDays(now, RETENTION_DAYS) });
  }
  const hasActiveTransfer = (dogId) => state.transfers.some((t) => t.dogId === dogId && ACTIVE.includes(t.status));
  const notifySender = (r, text, priority = 'medium') => ctx.alerts.create({ type: AlertType.STATUS_CHANGE, priority, message: text, recipientShelterID: r.fromShelterID, senderShelterID: r.toShelterID, transferRequestID: r.id, dogId: r.dogId });
  const changed = (r) => events.emit('transfer-changed', { requestID: r.id, status: r.status });

  /** Reserve the dog first (synchronously) so two simultaneous submits cannot both succeed (NFR-8). */
  function reserve({ dog, staff, urgency, notes, toShelterID = null }) {
    if (hasActiveTransfer(dog.id)) throw new ServiceError('DUPLICATE', MESSAGES.ACTIVE_TRANSFER);
    const r = { id: `T-${state.counters.transfer++}`, dogId: dog.id, fromShelterID: staff.shelterID, toShelterID, urgency, status: S.PENDING, notes, declineReason: null, requestedAt: clock.now(), respondedAt: null, offeredTo: [], alertedTo: [], responses: {}, viewedBy: {}, reminded: {} };
    state.transfers.push(r);
    audit(r, 'Created', staff);
    return r;
  }
  function rollback(r) {
    state.transfers = state.transfers.filter((t) => t !== r);
    state.auditLog = state.auditLog.filter((e) => e.requestID !== r.id);
  }
  function validate(values, required) {
    const missing = required.filter((k) => !values[k]);
    if (missing.length) throw new ServiceError('VALIDATION', MESSAGES.COMPLETE_FIELDS, missing);
  }
  function ownDog(dogId, staff) {
    const dog = dogOf(dogId);
    if (!dog) throw new ServiceError('NOT_FOUND', 'Dog not found.');
    if (dog.shelterID !== staff.shelterID) throw new ServiceError('FORBIDDEN', MESSAGES.NOT_YOUR_DOG);
    return dog;
  }

  return {
    canMoveTo, hasActiveTransfer, getRequest: request,

    /** UC-3 main course: create the request, rank shelters, alert the best three (FR-9, FR-10, FR-11, FR-17, FR-18). */
    async createRequest({ dogId, urgency, notes = '' }) {
      const staff = auth.requireVerified(); // NFR-6: the ranked results include contact details
      validate({ dogId, urgency }, ['dogId', 'urgency']);
      const dog = ownDog(dogId, staff);
      const r = reserve({ dog, staff, urgency, notes });
      let matches;
      try { matches = await ctx.matchEngine.rank({ dog, size: dog.size, fromShelterID: staff.shelterID }); }
      catch (e) { rollback(r); throw e; }
      r.offeredTo = matches.map((m) => m.shelterID);
      r.alertedTo = r.offeredTo.slice(0, 3);
      for (const sid of r.alertedTo) ctx.alerts.create({ type: AlertType.MATCH_FOUND, priority: ctx.alerts.priorityFor(dog, urgency), message: `Transfer request for ${dog.name} (${dog.id})`, recipientShelterID: sid, senderShelterID: staff.shelterID, transferRequestID: r.id, dogId: dog.id });
      if (matches.length) ctx.alerts.create({ type: AlertType.STATUS_CHANGE, priority: 'medium', message: `Transfer ${r.id} requested for ${dog.name} (${dog.id})`, recipientShelterID: staff.shelterID, senderShelterID: null, transferRequestID: r.id, dogId: dog.id });
      changed(r);
      return { request: r, matches, message: matches.length ? MESSAGES.TRANSFER_SENT : MESSAGES.NO_MATCH };
    },

    /** UC-7 main course: send a request to one chosen shelter from the match results (FR-16). */
    createFromMatch({ shelterID, dogId, size, notes = '' }) {
      const staff = auth.requireVerified();
      validate({ shelterID, dogId, size }, ['shelterID', 'dogId', 'size']);
      const dog = ownDog(dogId, staff);
      const target = shelter(shelterID);
      if (!target) throw new ServiceError('NOT_FOUND', 'Shelter not found.');
      if (!target.acceptedSizes.includes(size)) throw new ServiceError('SIZE', MESSAGES.CANNOT_HOUSE(size));
      if (target.totalCapacity - target.dogsHoused <= 0) throw new ServiceError('NO_SPACE', MESSAGES.NO_SPACE);
      const r = reserve({ dog, staff, urgency: dog.highRisk ? 'HIGH' : 'NORMAL', notes, toShelterID: shelterID });
      r.offeredTo = [shelterID]; r.alertedTo = [shelterID];
      ctx.alerts.create({ type: AlertType.MATCH_FOUND, priority: ctx.alerts.priorityFor(dog, r.urgency), message: `Transfer request for ${dog.name} (${dog.id})`, recipientShelterID: shelterID, senderShelterID: staff.shelterID, transferRequestID: r.id, dogId: dog.id });
      changed(r);
      return { request: r, status: r.status, message: MESSAGES.TRANSFER_SENT };
    },

    /** The receiving shelter's staff must be among the shelters the request was sent to. */
    _responder(r) {
      const staff = auth.requireStaff();
      if (!(r.toShelterID === staff.shelterID || r.alertedTo.includes(staff.shelterID))) throw new ServiceError('FORBIDDEN', MESSAGES.ONLY_RESPOND_OWN);
      return staff;
    },

    /** UC-4 accept (FR-7, FR-19, FR-20): Pending -> Accepted, one kennel is used, sender is told, other alerts are cancelled. */
    accept(id) {
      const r = request(id);
      const staff = this._responder(r);
      if (!canMoveTo(r.status, S.ACCEPTED)) throw new ServiceError('NOT_PENDING', MESSAGES.NOT_PENDING);
      const me = shelter(staff.shelterID);
      if (me.totalCapacity - me.dogsHoused <= 0) throw new ServiceError('NO_SPACE', MESSAGES.NO_SPACE);
      me.dogsHoused += 1; me.lastUpdated = clock.now();
      r.status = S.ACCEPTED; r.toShelterID = me.id; r.respondedAt = clock.now(); r.responses[me.id] = { status: S.ACCEPTED };
      state.alerts.filter((a) => a.transferRequestID === r.id && a.type === AlertType.MATCH_FOUND && a.recipientShelterID !== me.id).forEach((a) => { a.cancelled = true; });
      audit(r, 'Accepted', staff);
      notifySender(r, `Transfer ${r.id} accepted by ${me.name}`);
      changed(r);
      return { request: r, shelter: ctx.shelterStore._toView(me) };
    },

    /** UC-4 decline with an optional reason: offer to the next ranked shelter, or end as Declined when none are left. */
    decline(id, reason = '') {
      const r = request(id);
      const staff = this._responder(r);
      if (!canMoveTo(r.status, S.DECLINED)) throw new ServiceError('NOT_PENDING', MESSAGES.NOT_PENDING);
      const me = shelter(staff.shelterID);
      r.responses[me.id] = { status: S.DECLINED, reason };
      r.declineReason = reason || null;
      const next = r.offeredTo.find((sid) => !r.alertedTo.includes(sid));
      if (next) {
        r.alertedTo.push(next);
        const dog = dogOf(r.dogId);
        ctx.alerts.create({ type: AlertType.MATCH_FOUND, priority: ctx.alerts.priorityFor(dog, r.urgency), message: `Transfer request for ${dog.name} (${dog.id})`, recipientShelterID: next, senderShelterID: r.fromShelterID, transferRequestID: r.id, dogId: dog.id });
      } else if (r.alertedTo.every((sid) => r.responses[sid]?.status === S.DECLINED)) { r.status = S.DECLINED; r.respondedAt = clock.now(); }
      audit(r, 'Declined', staff);
      notifySender(r, `Transfer ${r.id} declined by ${me.name}`);
      changed(r);
      return { request: r, offeredTo: next ?? null };
    },

    /** UC-4 completed (FR-7, FR-20): the dog has left; the sending shelter gets its kennel back. */
    complete(id) {
      const r = request(id);
      const staff = auth.requireStaff();
      if (![r.fromShelterID, r.toShelterID].includes(staff.shelterID)) throw new ServiceError('FORBIDDEN', MESSAGES.ONLY_RESPOND_OWN);
      if (r.status === S.PENDING) throw new ServiceError('ACCEPT_FIRST', MESSAGES.ACCEPT_FIRST);
      if (!canMoveTo(r.status, S.COMPLETED)) throw new ServiceError('NOT_PENDING', MESSAGES.NOT_PENDING);
      const from = shelter(r.fromShelterID);
      from.dogsHoused -= 1; from.lastUpdated = clock.now();
      dogOf(r.dogId).shelterID = r.toShelterID; // the dog now lives at the receiving shelter, so it cannot be re-requested from here
      r.status = S.COMPLETED; r.respondedAt = clock.now();
      audit(r, 'Completed', staff);
      notifySender(r, `Transfer ${r.id} completed`, 'low');
      changed(r);
      return { request: r, shelter: ctx.shelterStore._toView(from) };
    },

    /** FR-21: the sending shelter cancels; an accepted transfer gives the receiving kennel back. */
    cancel(id) {
      const r = request(id);
      const staff = auth.requireStaff();
      if (staff.shelterID !== r.fromShelterID) throw new ServiceError('FORBIDDEN', MESSAGES.OWN_SHELTER_ONLY);
      if (!canMoveTo(r.status, S.CANCELLED)) throw new ServiceError('NOT_PENDING', MESSAGES.NOT_PENDING);
      const wasAccepted = r.status === S.ACCEPTED;
      // FR-21: tell the shelters involved. An accepting shelter must release the kennel it reserved.
      const recipients = wasAccepted ? [r.toShelterID] : r.alertedTo.filter((sid) => r.responses[sid]?.status !== S.DECLINED);
      if (wasAccepted) { const to = shelter(r.toShelterID); to.dogsHoused -= 1; to.lastUpdated = clock.now(); }
      r.status = S.CANCELLED; r.respondedAt = clock.now();
      state.alerts.filter((a) => a.transferRequestID === r.id && a.type === AlertType.MATCH_FOUND).forEach((a) => { a.cancelled = true; });
      audit(r, 'Cancelled', staff);
      const fromName = shelter(r.fromShelterID).name;
      for (const sid of recipients) {
        ctx.alerts.create({ type: AlertType.STATUS_CHANGE, priority: wasAccepted ? 'high' : 'medium', message: wasAccepted ? MESSAGES.TRANSFER_CANCELLED_RELEASE(r.id, fromName) : MESSAGES.TRANSFER_CANCELLED(r.id, fromName), recipientShelterID: sid, senderShelterID: r.fromShelterID, transferRequestID: r.id, dogId: r.dogId });
      }
      changed(r);
      return { request: r };
    },

    /** UC-10 (FR-36): this shelter's dogs that have a transfer; Completed ones stay visible (team decision). */
    listMyDogs() {
      const staff = auth.requireStaff();
      const rows = state.transfers.filter((t) => t.fromShelterID === staff.shelterID).sort((a, b) => b.requestedAt - a.requestedAt).map((t) => this._myDogRow(t, staff.verified));
      return { rows, message: rows.length ? null : MESSAGES.NO_ACTIVE_TRANSFERS };
    },
    _myDogRow(t, withContacts = true) {
      const dog = dogOf(t.dogId); const to = t.toShelterID ? shelter(t.toShelterID) : null;
      return { requestID: t.id, dogId: dog.id, dogName: dog.name, breed: dog.breed, size: dog.size, status: t.status, toShelterName: to?.name ?? null, requestedAt: t.requestedAt, receivingContact: to ? { phone: withContacts ? to.phone : null, email: withContacts ? to.email : null } : null };
    },
    getMyDogTransfer(requestID) {
      const staff = auth.requireStaff();
      const t = request(requestID);
      if (t.fromShelterID !== staff.shelterID) throw new ServiceError('FORBIDDEN', MESSAGES.OWN_SHELTER_ONLY);
      return this._myDogRow(t, staff.verified);
    },

    /** NFR-9: audit entries still inside the retention period; purgeExpired removes the others. */
    getAuditLog() { return state.auditLog.filter((e) => e.retainUntil > clock.now()); },
    purgeExpired() { const before = state.auditLog.length; state.auditLog = state.auditLog.filter((e) => e.retainUntil > clock.now()); return before - state.auditLog.length; },
  };
}
