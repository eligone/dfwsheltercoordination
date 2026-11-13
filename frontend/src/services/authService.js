/**
 * authService.js - sign in, sign out and "who is using the app" (NFR-14, plus the checks behind NFR-1, NFR-4, NFR-6).
 * Purpose: one place decides who is signed in and whether they may act on a shelter, so no screen repeats the rule.
 * Owner: Awais Afridi (NFR-14); used by every other service.
 */
import { MESSAGES } from './messages.js';
import { ServiceError } from './models.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicView = ({ password, ...rest }) => rest; // the password never leaves this module

export function createAuthService(ctx) {
  let session = null;
  return {
    /** NFR-14: wrong credentials give the exact message from Assignment 3. */
    signIn(email, password) {
      if (!EMAIL.test(String(email ?? '').trim())) throw new ServiceError('VALIDATION', MESSAGES.INVALID_EMAIL, ['email']);
      const staff = ctx.state.staff.find((s) => s.email.toLowerCase() === String(email).trim().toLowerCase());
      if (!staff || staff.password !== password) throw new ServiceError('BAD_LOGIN', MESSAGES.BAD_LOGIN);
      session = staff.staffID;
      return publicView(staff);
    },
    signOut() { session = null; },
    currentStaff() {
      const staff = ctx.state.staff.find((s) => s.staffID === session);
      return staff ? publicView(staff) : null;
    },
    /** Screens call this first; AUTH_REQUIRED means "send the user to the Sign In page". */
    requireStaff() {
      const staff = this.currentStaff();
      if (!staff) throw new ServiceError('AUTH_REQUIRED', 'Please sign in.');
      return staff;
    },
    /** NFR-6: only verified accounts may see matches and contact details. */
    requireVerified() {
      const staff = this.requireStaff();
      if (!staff.verified) throw new ServiceError('NOT_VERIFIED', MESSAGES.NEED_VERIFIED);
      return staff;
    },
    /** NFR-1 and NFR-4: staff act only on their own shelter. */
    isAuthorizedFor(staff, shelterID) { return !!staff && staff.shelterID === shelterID; },
  };
}
