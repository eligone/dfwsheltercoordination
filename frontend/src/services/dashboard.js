/**
 * dashboard.js - search, filter, sort, refresh and auto-refresh of the shared shelter list
 * (UC-8 FR-32 to FR-34 and FR-37; UC-11 FR-38, FR-39; UC-12 FR-40; UC-13 FR-41, FR-42; NFR-3, NFR-13).
 * Purpose: the Dashboard class from the class diagram, as plain functions plus a small state holder, so the
 * rules are testable without a screen and the Home screen only displays what `view()` returns.
 * Owner: Saif Yusuff (UC-8) and Awais Afridi (UC-11, UC-13). AI-assisted draft; each owner reviews their part.
 */
import { MESSAGES } from './messages.js';

export const REFRESH_INTERVAL_MS = 5000; // NFR-3

/** FR-38: case-insensitive match on name, city or address; blank text means "no search". */
export function searchShelters(list, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => [s.name, s.city, s.address].some((f) => String(f ?? '').toLowerCase().includes(q)));
}
/** FR-39: filter by the status label (Open, Near Full, Full, Outdated); null/'' means all. */
export function filterByStatus(list, label) { return label ? list.filter((s) => s.statusLabel === label) : list; }
/** FR-37/FR-40: sort by availableKennels, distanceMi or name. */
export function sortShelters(list, field, ascending = true) {
  if (!field) return list;
  const dir = ascending ? 1 : -1;
  return [...list].sort((a, b) => (typeof a[field] === 'string' ? a[field].localeCompare(b[field]) : a[field] - b[field]) * dir);
}

/**
 * @param {{fetchShelters: () => Promise<object[]>, now?: () => Date}} deps  fetchShelters returns the shelter views (see shelterStore.listShelters).
 */
export function createDashboard({ fetchShelters, now = () => new Date() }) {
  let shelters = [];
  let inFlight = null;
  const d = { searchQuery: '', statusFilter: null, sortField: null, sortAscending: true, lastRefreshedAt: null, refreshIntervalSec: REFRESH_INTERVAL_MS / 1000 };

  /** FR-42 / UC-13: reload the latest saved data. One request at a time; a failure keeps the rows on screen. */
  d.refresh = function refresh() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        shelters = await fetchShelters();
        d.lastRefreshedAt = now();
        return { ok: true, message: MESSAGES.DASHBOARD_REFRESHED };
      } catch {
        return { ok: false, message: MESSAGES.REFRESH_FAILED };
      } finally { inFlight = null; }
    })();
    return inFlight;
  };

  /** What the Home screen shows: rows after search, filter and sort, plus the empty-state message when needed. */
  d.view = function view() {
    let rows = searchShelters(shelters, d.searchQuery);
    rows = filterByStatus(rows, d.statusFilter);
    rows = sortShelters(rows, d.sortField, d.sortAscending);
    const message = rows.length ? null : shelters.length === 0 ? MESSAGES.NO_SHELTER_DATA : MESSAGES.NO_MATCHING;
    return { rows, message };
  };
  d.searchShelter = (q) => { d.searchQuery = q; return d.view(); };
  d.filterByStatus = (label) => { d.statusFilter = label; return d.view(); };
  d.sortBy = (field, ascending = true) => { d.sortField = field; d.sortAscending = ascending; return d.view(); };

  /** NFR-3: refresh every 5 seconds. The timer functions are passed in so tests can fake them. */
  d.startAutoRefresh = ({ setIntervalFn = setInterval, clearIntervalFn = clearInterval } = {}) => {
    const id = setIntervalFn(() => { d.refresh(); }, REFRESH_INTERVAL_MS);
    return () => clearIntervalFn(id);
  };
  return d;
}
