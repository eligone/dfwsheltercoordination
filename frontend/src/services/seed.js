/**
 * seed.js - builds the starting in-memory data from src/mock/ plus the extra fields the services need.
 * Purpose: every test and every screen starts from the same six shelters, four dogs and three transfers.
 * Owner: shared (Awais Afridi keeps the test factories that call this).
 */
import { shelters as mockShelters } from '../mock/shelters.js';
import { dogs as mockDogs, transfers as mockTransfers, alerts as mockAlerts } from '../mock/dogs.js';
import { parseTs, addDays, addMs, RETENTION_DAYS, AlertType } from './models.js';

/** One staff account per shelter (mock credentials only; a real backend stores hashes, never the browser). */
const STAFF = [
  { staffID: 1, name: 'J. Doe', email: 'jdoe@richardson.example', password: 'pw-rich', verified: true, shelterID: 'rich' },
  { staffID: 2, name: 'M. Lee', email: 'staff@dallas.example', password: 'pw-dal', verified: true, shelterID: 'dal' },
  { staffID: 3, name: 'R. Cruz', email: 'staff@collin.example', password: 'pw-collin', verified: true, shelterID: 'collin' },
  { staffID: 4, name: 'P. Nguyen', email: 'staff@plano.example', password: 'pw-plano', verified: true, shelterID: 'plano' },
  { staffID: 5, name: 'S. Ortiz', email: 'staff@irving.example', password: 'pw-irving', verified: true, shelterID: 'irving' },
  { staffID: 6, name: 'K. Patel', email: 'staff@carrollton.example', password: 'pw-carr', verified: true, shelterID: 'carr' },
  { staffID: 7, name: 'T. Intern', email: 'intern@richardson.example', password: 'pw-intern', verified: false, shelterID: 'rich' },
];

export function createSeed(now) {
  const shelters = mockShelters.map((s) => ({
    id: s.id, name: s.name, city: s.city, address: s.address, phone: s.phone, email: s.email,
    distanceMi: s.distanceMi, totalCapacity: s.totalCapacity, dogsHoused: s.dogsHoused,
    lastUpdated: parseTs(s.lastUpdated), acceptedSizes: [...s.sizes], medicalCapable: true,
  }));
  const dogs = mockDogs.map((d) => ({ id: d.id, name: d.name, breed: d.breed, size: d.size, medical: d.medical, highRisk: d.highRisk, shelterID: 'rich' }));

  const transfers = mockTransfers.map((t) => ({
    id: t.id, dogId: t.dogId, fromShelterID: t.from, toShelterID: t.to, urgency: 'NORMAL', status: t.status, notes: '',
    declineReason: null, requestedAt: parseTs(t.requested), respondedAt: null,
    offeredTo: [t.to], alertedTo: [t.to], responses: {}, viewedBy: {}, reminded: {},
  }));
  const t301 = transfers.find((t) => t.id === 'T-301');
  t301.offeredTo = ['collin', 'carr', 'dal']; // ranked list; Collin is alerted first

  const senderOf = (a) => a.from;
  const alerts = mockAlerts.map((a) => ({
    id: a.id, type: a.title.startsWith('Match') ? AlertType.MATCH_FOUND : a.title.startsWith('Reminder') ? AlertType.REMINDER : AlertType.STATUS_CHANGE,
    priority: a.priority, message: a.title, createdAt: parseTs(a.time), read: a.read, recipientShelterID: 'rich',
    senderShelterID: senderOf(a), transferRequestID: a.title.includes('T-302') ? 'T-302' : a.title.includes('D-1042') ? 'T-301' : null, dogId: a.title.includes('D-1042') ? 'D-1042' : null, cancelled: false,
  }));
  alerts.push({ id: 'A-91', type: AlertType.MATCH_FOUND, priority: 'high', message: 'Transfer request for Biscuit (D-1042)', createdAt: parseTs('2026-11-03 14:21'), read: false, recipientShelterID: 'collin', senderShelterID: 'rich', transferRequestID: 'T-301', dogId: 'D-1042', cancelled: false });

  // Richardson capacity history (previous -> new available kennels), relative to "now".
  const hist = [[3, 4, 2, 1], [20, 6, 4, 2], [100, 3, 6, 1], [300, 8, 3, 2], [500, 5, 8, 1]];
  const capacityRecords = hist.map(([days, prev, next, staffID], i) => ({
    recordID: i + 1, shelterID: 'rich', recordedAt: addDays(now, -days), previousAvailable: prev, newAvailable: next, totalCapacity: 60,
    changedByStaffID: staffID, changedByName: STAFF.find((s) => s.staffID === staffID).name,
  }));

  const preferences = {};
  shelters.forEach((s, i) => {
    preferences[s.id] = {
      reminderDelayMinutes: 60, sendToContactsFor: 'HIGH_ONLY',
      contacts: [{ contactID: i + 1, type: 'EMAIL', value: s.email, deliveryStatus: 'VERIFIED' }],
    };
  });

  const auditLog = [{ entryID: 1, requestID: 'T-301', action: 'Created', outcome: 'Pending', timestamp: t301.requestedAt, senderShelterID: 'rich', recipientShelterID: 'collin', actorStaffID: 1, retainUntil: addDays(t301.requestedAt, RETENTION_DAYS) }];

  return {
    staff: STAFF.map((s) => ({ ...s })), shelters, dogs, transfers, alerts, capacityRecords, preferences, auditLog,
    deliveryLog: [], savedSearches: [], prompts: [],
    counters: { transfer: 303, alert: 92, record: 6, entry: 2, log: 1, contact: 100, search: 1 },
  };
}
