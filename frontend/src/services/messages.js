/**
 * messages.js - every user-facing message in one place (Assignment 4, Part 1.3 and 1.5).
 * Purpose: the screens and the tests must show exactly the same text, so both import it from here.
 * Messages marked [A3] come from the Assignment 3 document or the wireframes; the others are the
 * team-approved wording (the dagger messages in the SE Document).
 * Owner: shared (all six students). Changes go through a PR that updates the test cases too.
 */
export const MESSAGES = {
  // UC-1 / UC-2 (Hoang)
  CAPACITY_UPDATED: 'Capacity updated.',
  OWN_SHELTER_ONLY: 'You can only update your own shelter.',
  NO_CHANGES: 'No changes were found.', // [A3]
  SELECT_RANGE: 'Select a time range to view records.',
  RANGE_ERROR: (total) => `Enter a whole number between 0 and ${total}.`,
  CONFIRM_CHANGE: (prev, next) => `Change available kennels from ${prev} to ${next}?`,
  // UC-3 / UC-4 / UC-7 (Joshua, Anais)
  COMPLETE_FIELDS: 'Please complete the highlighted fields.',
  NO_MATCH: 'No match found', // [A3]
  MAPPING_FAILED: 'Could not calculate distances. Try again.',
  NO_SPACE: 'This shelter no longer has space.',
  NOT_PENDING: 'This request is no longer pending.',
  ACCEPT_FIRST: 'Accept the request first.',
  ACTIVE_TRANSFER: 'This dog already has an active transfer.',
  ONLY_RESPOND_OWN: 'You can only respond to requests sent to your shelter.',
  CANNOT_HOUSE: (size) => `This shelter cannot house ${size} dogs.`,
  TRANSFER_SENT: 'Transfer request sent.',
  // UC-5 (Anais)
  SELECT_SIZE: "Select the dog's size.",
  SIZE_PROMPT: "Select the dog's size",
  NEED_VERIFIED: 'Your account must be verified to view matches.',
  // UC-8 / UC-10 / UC-11 / UC-13 (Saif, Awais)
  NO_SHELTER_DATA: 'No shelter data available.', // [A3]
  NO_MATCHING: 'No matching shelters found.', // [A3]
  NO_ACTIVE_TRANSFERS: 'No active transfers.', // [A3]
  DASHBOARD_REFRESHED: 'Dashboard refreshed.',
  REFRESH_FAILED: 'Could not refresh. Showing last saved data.',
  NOT_AVAILABLE: 'Not available',
  // UC-14 / UC-15 (Avalon)
  NO_NOTIFICATIONS: 'No notifications', // [A3 wireframe]
  ALL_CAUGHT_UP: "You're all caught up. New alerts will appear here.", // [A3 wireframe]
  OWN_ALERTS: 'You can only view alerts for your shelter.',
  INVALID_EMAIL: 'Enter a valid email address', // [A3 wireframe]
  INVALID_PHONE: 'Enter a valid phone number',
  PREFS_SAVED: 'Preferences saved.', // [A3 wireframe]
  DUPLICATE_CONTACT: 'This contact has already been added.',
  DELIVERY_FAILED: 'Delivery failed',
  DELIVERY_DETAIL: 'Retried 3 times. Failure logged.',
  // NFR-14 sign in (Awais)
  BAD_LOGIN: 'Incorrect email or password.', // [A3]
};
