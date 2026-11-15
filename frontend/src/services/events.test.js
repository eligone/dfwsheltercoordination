// @vitest-environment node
/** Saif Yusuff: lifecycle checks for the existing event bus used by UC-10. */
import { it, expect, vi } from 'vitest';
import { createTestApp } from '../test/testApp.js';
it('unsubscribes once without removing a duplicate subscription', () => {
  const { events } = createTestApp(); const fn = vi.fn();
  const off = events.on('transfer-changed', fn);
  const off2 = events.on('transfer-changed', fn);
  off(); off(); events.emit('transfer-changed', {});
  expect(fn).toHaveBeenCalledTimes(1);
  off2(); events.emit('transfer-changed', {});
  expect(fn).toHaveBeenCalledTimes(1);
});
it('delivers to all subscribers even when one unsubscribes itself', () => {
  const { events } = createTestApp(); const second = vi.fn();
  const off = events.on('transfer-changed', () => off());
  events.on('transfer-changed', second); events.emit('transfer-changed', {});
  expect(second).toHaveBeenCalledTimes(1);
});
