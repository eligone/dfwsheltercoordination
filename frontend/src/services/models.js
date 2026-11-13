/**
 * models.js - shared constants, the ServiceError type and small date helpers.
 * Purpose: one place for the enumerations in the class diagram (Part 3) and for the error type that
 * every service throws, so screens can show `error.message` and tests can check `error.code`.
 * Owner: shared (all six students).
 */
export const TransferStatus = { PENDING: 'Pending', ACCEPTED: 'Accepted', DECLINED: 'Declined', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
export const AlertPriority = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
export const AlertType = { MATCH_FOUND: 'MATCH_FOUND', STATUS_CHANGE: 'STATUS_CHANGE', REMINDER: 'REMINDER' };
export const UrgencyLevel = { NORMAL: 'NORMAL', HIGH: 'HIGH' };
export const HistoryRange = { PAST_MONTH: 'PAST_MONTH', PAST_SIX_MONTHS: 'PAST_SIX_MONTHS', PAST_YEAR: 'PAST_YEAR' };
export const ContactType = { EMAIL: 'EMAIL', PHONE: 'PHONE' };
export const DeliveryStatus = { VERIFIED: 'VERIFIED', DELIVERY_FAILED: 'DELIVERY_FAILED' };
export const PriorityThreshold = { HIGH_ONLY: 'HIGH_ONLY', HIGH_AND_MEDIUM: 'HIGH_AND_MEDIUM', ALL: 'ALL' };

export const RANGE_DAYS = { PAST_MONTH: 30, PAST_SIX_MONTHS: 182, PAST_YEAR: 365 };
export const RETENTION_DAYS = 365; // NFR-9 (retention period, team-approved assumption)
export const OUTDATED_HOURS = 24; // UC-8 alternate course 3a

/** Every business-rule failure is a ServiceError: `code` for logic, `message` for the screen, `fields` for highlighting. */
export class ServiceError extends Error {
  constructor(code, message, fields = []) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.fields = fields;
  }
}

/** Mock dates look like "2026-11-04 08:15"; they are read as UTC so tests give the same result in every time zone. */
export function parseTs(value) {
  if (value == null) return null;
  if (value instanceof Date) return value;
  return new Date(String(value).replace(' ', 'T') + ':00Z');
}
export const addMs = (date, ms) => new Date(date.getTime() + ms);
export const addDays = (date, days) => addMs(date, days * 86400000);
export const DAY_MS = 86400000;
