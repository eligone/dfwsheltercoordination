// Mock dogs, transfers and alerts. Statuses follow the glossary.
// Transfer status: Pending | Accepted | Declined | Completed | Cancelled
// Notification priority: high | medium | low

export const dogs = [
  { id: 'D-1042', name: 'Biscuit', breed: 'Lab mix', size: 'large', medical: 'Heartworm positive', highRisk: true },
  { id: 'D-1043', name: 'Pepper', breed: 'Terrier mix', size: 'small', medical: 'None', highRisk: false },
  { id: 'D-1051', name: 'Duke', breed: 'Shepherd mix', size: 'large', medical: 'Needs daily meds', highRisk: true },
  { id: 'D-1060', name: 'Luna', breed: 'Pit bull mix', size: 'medium', medical: 'None', highRisk: false },
];

export const transfers = [
  { id: 'T-301', dogId: 'D-1042', from: 'rich', to: 'collin', requested: '2026-11-03 14:20', status: 'Pending' },
  { id: 'T-302', dogId: 'D-1043', from: 'rich', to: 'plano', requested: '2026-11-02 09:10', status: 'Accepted' },
  { id: 'T-298', dogId: 'D-1060', from: 'rich', to: 'irving', requested: '2026-10-30 16:45', status: 'Completed' },
];

export const alerts = [
  { id: 'A-90', priority: 'high', read: false, title: 'Match found for Biscuit (D-1042)', from: 'collin', time: '2026-11-04 08:20' },
  { id: 'A-89', priority: 'medium', read: false, title: 'Transfer T-302 accepted by Plano', from: 'plano', time: '2026-11-03 11:02' },
  { id: 'A-88', priority: 'low', read: true, title: 'Reminder: request T-297 not viewed', from: 'dal', time: '2026-11-02 18:30' },
];
