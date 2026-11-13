/**
 * shelterStore.js - shelters, capacity updates, capacity history and the PDF export.
 * Purpose: UC-1 (update capacity: FR-1 to FR-3, FR-7, NFR-1, NFR-2), UC-2 (history: FR-4 to FR-6) and the
 * read side used by UC-8/UC-9/UC-11/UC-13 (status labels, last-updated).
 * Owner: Hoang Pham (UC-1, UC-2). AI-assisted draft; the owner reviews and explains it.
 */
import { MESSAGES } from './messages.js';
import { ServiceError, RANGE_DAYS, OUTDATED_HOURS, addDays } from './models.js';
import { buildPdf } from './pdf.js';

/** Existing mock rule kept as is: Near Full from 85% occupancy, Full at 100%. */
export function occupancyStatus(dogsHoused, totalCapacity) {
  const pct = dogsHoused / totalCapacity;
  if (pct >= 1) return 'full';
  if (pct >= 0.85) return 'near';
  return 'open';
}
export const STATUS_LABEL = { open: 'Open', near: 'Near Full', full: 'Full', outdated: 'Outdated' };

/** FR-34 plus UC-8 alternate 3a: a shelter not updated for 24 hours (or never) is Outdated. */
export function statusOf(shelter, now) {
  const last = shelter.lastUpdated;
  if (!last || now.getTime() - last.getTime() >= OUTDATED_HOURS * 3600000) return 'outdated';
  return occupancyStatus(shelter.dogsHoused, shelter.totalCapacity);
}

export function createShelterStore(ctx) {
  const { state, clock, auth, events } = ctx;
  const find = (id) => state.shelters.find((s) => s.id === id);

  /** FR-33/FR-35: what the dashboard and the details page show for one shelter. */
  function toView(s, withContacts = true) {
    const status = statusOf(s, clock.now());
    return {
      id: s.id, name: s.name, city: s.city, address: s.address, phone: withContacts ? s.phone : null, email: withContacts ? s.email : null, distanceMi: s.distanceMi,
      dogsHoused: s.dogsHoused, totalCapacity: s.totalCapacity, availableKennels: s.totalCapacity - s.dogsHoused,
      status, statusLabel: STATUS_LABEL[status], lastUpdated: s.lastUpdated, lastUpdatedLabel: s.lastUpdated ? formatTs(s.lastUpdated) : MESSAGES.NOT_AVAILABLE,
    };
  }
  const formatTs = (d) => d.toISOString().slice(0, 16).replace('T', ' ');

  /** FR-2: a whole number from 0 to the shelter's total capacity; text from a form field is accepted. */
  function parseAvailable(raw, total) {
    const bad = () => new ServiceError('VALIDATION', MESSAGES.RANGE_ERROR(total), ['available']);
    let n = raw;
    if (typeof raw === 'string') { if (!/^\d+$/.test(raw.trim())) throw bad(); n = Number(raw.trim()); }
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > total) throw bad();
    return n;
  }
  function ownShelter(shelterID) {
    const staff = auth.requireStaff();
    if (!auth.isAuthorizedFor(staff, shelterID)) throw new ServiceError('FORBIDDEN', MESSAGES.OWN_SHELTER_ONLY);
    const shelter = find(shelterID);
    if (!shelter) throw new ServiceError('NOT_FOUND', 'Shelter not found.');
    return { staff, shelter };
  }

  return {
    /** NFR-6: unverified accounts see the dashboard numbers but no phone numbers or emails. */
    listShelters() { const staff = auth.requireStaff(); return state.shelters.map((s) => toView(s, staff.verified)); },
    getShelter(id) { const staff = auth.requireStaff(); const s = find(id); return s ? toView(s, staff.verified) : null; },
    /** UC-9: details page data (FR-35). Contact details need a verified account (NFR-6). */
    getShelterDetails(id) { const staff = auth.requireVerified(); const s = find(id); return s ? toView(s, staff.verified) : null; },

    /** FR-3: validate first and return the text for the confirmation pop-up; nothing is saved yet. */
    previewCapacityChange(shelterID, raw) {
      const { shelter } = ownShelter(shelterID);
      const next = parseAvailable(raw, shelter.totalCapacity);
      const prev = shelter.totalCapacity - shelter.dogsHoused;
      return { previousAvailable: prev, newAvailable: next, prompt: MESSAGES.CONFIRM_CHANGE(prev, next) };
    },

    /** UC-1 main course after the staff member confirms (FR-1, FR-2, FR-7, NFR-1). */
    updateCapacity(shelterID, raw) {
      const { staff, shelter } = ownShelter(shelterID);
      const next = parseAvailable(raw, shelter.totalCapacity);
      const prev = shelter.totalCapacity - shelter.dogsHoused;
      const now = clock.now();
      shelter.dogsHoused = shelter.totalCapacity - next;
      shelter.lastUpdated = now;
      const record = { recordID: state.counters.record++, shelterID, recordedAt: now, previousAvailable: prev, newAvailable: next, totalCapacity: shelter.totalCapacity, changedByStaffID: staff.staffID, changedByName: staff.name };
      state.capacityRecords.push(record);
      events.emit('capacity-updated', { shelterID, available: next, becameFull: next === 0 });
      return { record, shelter: toView(shelter), message: MESSAGES.CAPACITY_UPDATED };
    },

    /** UC-2 (FR-4, FR-5): records in the chosen range, newest first. */
    getHistory(shelterID, range) {
      ownShelter(shelterID);
      if (!range || !(range in RANGE_DAYS)) throw new ServiceError('VALIDATION', MESSAGES.SELECT_RANGE, ['range']);
      const cutoff = addDays(clock.now(), -RANGE_DAYS[range]);
      const records = state.capacityRecords.filter((r) => r.shelterID === shelterID && r.recordedAt >= cutoff).sort((a, b) => b.recordedAt - a.recordedAt);
      return { records, message: records.length ? null : MESSAGES.NO_CHANGES };
    },

    /** UC-2 (FR-6): a PDF holding exactly the records passed in. */
    exportHistoryPdf(shelterID, records, range = '') {
      const { shelter } = ownShelter(shelterID);
      if (!records.length) throw new ServiceError('NO_RECORDS', MESSAGES.NO_CHANGES);
      const lines = records.map((r) => `${formatTs(r.recordedAt)} | ${r.previousAvailable} -> ${r.newAvailable} available | ${r.changedByName}`);
      const bytes = buildPdf(`Capacity history - ${shelter.name}`, lines);
      return { filename: `capacity-history-${shelterID}-${String(range).toLowerCase()}.pdf`, bytes, mimeType: 'application/pdf' };
    },
    _toView: toView,
  };
}
