// @vitest-environment node
/**
 * shelterStore.test.js - tests for UC-1 Update Shelter Capacity, UC-2 View Capacity Change History, NTC-01.
 * Test case IDs match the SE Document (Part 1.5 and 1.6). Creator: Hoang Pham.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, signInAs, availableOf, TEST_NOW } from '../test/testApp.js';

const RANGE_MSG = 'Enter a whole number between 0 and 60.';

describe('UC-1 Update Shelter Capacity', () => {
  it('TC-1-01 update by typing: confirm text first, then saved with record and message', () => {
    const app = signInAs(createTestApp(), 'rich');
    const before = app.state.capacityRecords.length;
    const preview = app.shelterStore.previewCapacityChange('rich', '5');
    expect(preview.prompt).toBe('Change available kennels from 2 to 5?');
    expect(availableOf(app, 'rich')).toBe(2); // nothing saved before the confirmation
    expect(app.state.capacityRecords).toHaveLength(before);
    const result = app.shelterStore.updateCapacity('rich', '5');
    expect(result.message).toBe('Capacity updated.');
    expect(availableOf(app, 'rich')).toBe(5);
    expect(app.state.shelters.find((s) => s.id === 'rich').dogsHoused).toBe(55);
    expect(result.shelter.lastUpdated.toISOString()).toBe('2026-11-04T10:00:00.000Z');
    expect(result.record).toMatchObject({ previousAvailable: 2, newAvailable: 5, changedByName: 'J. Doe', shelterID: 'rich' });
    expect(app.state.capacityRecords).toHaveLength(before + 1);
  });
  it('TC-1-02 update by dropdown value 10', () => {
    const app = signInAs(createTestApp(), 'rich');
    const result = app.shelterStore.updateCapacity('rich', 10);
    expect(availableOf(app, 'rich')).toBe(10);
    expect(app.state.shelters.find((s) => s.id === 'rich').dogsHoused).toBe(50);
    expect(result.message).toBe('Capacity updated.');
  });
  it('TC-1-03 out-of-range values -1 and 61 are rejected with the exact message', () => {
    const app = signInAs(createTestApp(), 'rich');
    const before = app.state.capacityRecords.length;
    for (const bad of [-1, 61, '-1', '61']) {
      expect(() => app.shelterStore.previewCapacityChange('rich', bad)).toThrow(RANGE_MSG);
      expect(() => app.shelterStore.updateCapacity('rich', bad)).toThrow(RANGE_MSG);
    }
    expect(availableOf(app, 'rich')).toBe(2);
    expect(app.state.capacityRecords).toHaveLength(before);
  });
  it('TC-1-04 boundary values 0 and 60 are accepted (Full and Open)', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(app.shelterStore.updateCapacity('rich', 0).shelter.statusLabel).toBe('Full');
    expect(app.shelterStore.updateCapacity('rich', 60).shelter.statusLabel).toBe('Open');
    expect(app.state.shelters.find((s) => s.id === 'rich').dogsHoused).toBe(0);
  });
  it('TC-1-05 non-numeric, empty and decimal input is rejected', () => {
    const app = signInAs(createTestApp(), 'rich');
    for (const bad of ['abc', '', '   ', 2.5, '2.5', null, undefined]) {
      expect(() => app.shelterStore.updateCapacity('rich', bad)).toThrow(RANGE_MSG);
    }
    expect(availableOf(app, 'rich')).toBe(2);
  });
  it('TC-1-06 cancelling (never calling update) leaves capacity and history unchanged', () => {
    const app = signInAs(createTestApp(), 'rich');
    const before = app.state.capacityRecords.length;
    app.shelterStore.previewCapacityChange('rich', '5'); // pop-up shown, then the staff member clicks Cancel
    expect(availableOf(app, 'rich')).toBe(2);
    expect(app.state.capacityRecords).toHaveLength(before);
  });
});

describe('UC-2 View Capacity Change History', () => {
  it('TC-2-01 past month shows the 2 records from the last 30 days, newest first', () => {
    const app = signInAs(createTestApp(), 'rich');
    const { records, message } = app.shelterStore.getHistory('rich', 'PAST_MONTH');
    expect(message).toBe(null);
    expect(records).toHaveLength(2);
    expect(records.map((r) => [r.previousAvailable, r.newAvailable, r.changedByName])).toEqual([[4, 2, 'J. Doe'], [6, 4, 'M. Lee']]);
  });
  it('TC-2-02 six months gives 3 records, one year gives 4; the 500-day record never appears', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(app.shelterStore.getHistory('rich', 'PAST_SIX_MONTHS').records).toHaveLength(3);
    const year = app.shelterStore.getHistory('rich', 'PAST_YEAR').records;
    expect(year).toHaveLength(4);
    expect(year.some((r) => r.previousAvailable === 5 && r.newAvailable === 8)).toBe(false);
  });
  it('TC-2-03 no records in range gives "No changes were found."', () => {
    const app = signInAs(createTestApp(), 'dal');
    const { records, message } = app.shelterStore.getHistory('dal', 'PAST_MONTH');
    expect(records).toHaveLength(0);
    expect(message).toBe('No changes were found.');
  });
  it('TC-2-04 PDF export is a valid PDF holding exactly the displayed records', () => {
    const app = signInAs(createTestApp(), 'rich');
    const { records } = app.shelterStore.getHistory('rich', 'PAST_YEAR');
    const pdf = app.shelterStore.exportHistoryPdf('rich', records, 'PAST_YEAR');
    const text = new TextDecoder('latin1').decode(pdf.bytes);
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text.includes('%%EOF')).toBe(true);
    expect(pdf.mimeType).toBe('application/pdf');
    expect(pdf.filename).toBe('capacity-history-rich-past_year.pdf');
    for (const r of records) expect(text.includes(`${r.previousAvailable} -> ${r.newAvailable} available | ${r.changedByName}`)).toBe(true);
    expect(text.includes('5 -> 8 available')).toBe(false); // the 500-day-old record is not exported
  });
  it('TC-2-05 a range must be chosen first; no PDF when there are no records', () => {
    const app = signInAs(createTestApp(), 'rich');
    expect(() => app.shelterStore.getHistory('rich', undefined)).toThrow('Select a time range to view records.');
    expect(() => app.shelterStore.exportHistoryPdf('rich', [], 'PAST_MONTH')).toThrow('No changes were found.');
  });
});

describe('NFR-1 authorization of capacity updates', () => {
  it('NTC-01 other shelters and anonymous visitors cannot update Richardson (4 of 4 rejected)', () => {
    const app = createTestApp();
    const outcomes = [];
    const attempt = (v) => { try { app.shelterStore.updateCapacity('rich', v); outcomes.push('allowed'); } catch (e) { outcomes.push(e.code); } };
    signInAs(app, 'dal');
    [5, 0].forEach(attempt);
    app.auth.signOut();
    [5, 0].forEach(attempt);
    expect(outcomes).toEqual(['FORBIDDEN', 'FORBIDDEN', 'AUTH_REQUIRED', 'AUTH_REQUIRED']);
    signInAs(app, 'dal');
    expect(() => app.shelterStore.updateCapacity('rich', 5)).toThrow('You can only update your own shelter.');
    expect(availableOf(app, 'rich')).toBe(2);
    expect(TEST_NOW).toBe('2026-11-04T10:00:00Z');
  });
});
