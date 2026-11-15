/**
 * FindShelters.test.jsx - component tests (React Testing Library) for the UC-5 screen.
 * Purpose: the screen part of TC-5-01, TC-5-02, TC-5-04, TC-5-06, TC-5-09 and NFR-6 (NTC-07): what staff
 * see and click. The ranking rules themselves are unit-tested in services/matchEngine.test.js.
 * Owner/creator: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and run by the owner.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestApp, signInAs, fillShelters } from '../../test/testApp.js';
import FindShelters, { SAVED_SEARCH_NOTE } from './FindShelters.jsx';

function setup(who = 'rich', prepare = () => {}) {
  const app = signInAs(createTestApp(), who);
  prepare(app);
  const onCancel = vi.fn();
  const onSelect = vi.fn();
  render(<FindShelters app={app} onCancel={onCancel} onSelect={onSelect} />);
  return { app, onCancel, onSelect, user: userEvent.setup() };
}
/** Shelter names in the results table, top to bottom. */
const resultNames = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[1].textContent);

describe('UC-5 Find Available Shelters (screen)', () => {
  it('TC-5-01 (screen) large dog: size filled from the record, ranked list with scores and contact details, Plano absent', async () => {
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText('Dog'), 'Duke (D-1051)');
    expect(screen.getByLabelText('Dog size')).toHaveValue('large');
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    await screen.findByRole('table');
    expect(resultNames()).toEqual(['Irving Animal Care Campus', 'Carrollton Animal Services & Adoption Center', 'Collin County Animal Services', 'Dallas Animal Services']);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell')[4].textContent)).toEqual(['0.549', '0.5375', '0.4525', '0.405']);
    expect(within(rows[0]).getByText(/\(972\) 555-0105 · staff@irving\.example/)).toBeInTheDocument();
    expect(screen.queryByText('Plano Animal Services')).not.toBeInTheDocument();
  });

  it('TC-5-02 (screen) small dog: Plano ranks first', async () => {
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText('Dog'), 'Pepper (D-1043)');
    expect(screen.getByLabelText('Dog size')).toHaveValue('small');
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    await screen.findByRole('table');
    expect(resultNames()[0]).toBe('Plano Animal Services');
    expect(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[4]).toHaveTextContent('0.6435');
  });

  it('TC-5-06 (screen) no size: "Select the dog\'s size." and no search; Cancel goes back without searching', async () => {
    const { app, user, onCancel } = setup();
    await user.selectOptions(screen.getByLabelText('Dog size'), '');
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    expect(await screen.findByText(/Select the dog's size\./)).toBeInTheDocument();
    expect(screen.getByLabelText('Dog size')).toHaveAttribute('aria-invalid', 'true');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(app.mapping.calls).toBe(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('TC-5-04 / TC-5-09 (screen) no match: "No match found", widen, still none: search saved', async () => {
    const { app, user } = setup('rich', (a) => fillShelters(a, ['dal', 'collin', 'plano', 'irving', 'carr']));
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    expect(await screen.findByText('No match found')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Search distance'), 'Within 50 miles');
    await user.click(screen.getByRole('button', { name: 'Widen search' }));
    expect(await screen.findByText(SAVED_SEARCH_NOTE, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/No shelter within 50 miles/)).toBeInTheDocument();
    expect(app.state.savedSearches).toHaveLength(1);
    expect(app.state.savedSearches[0]).toMatchObject({ dogID: 'D-1042', size: 'large', radiusMi: 50 });
  });

  it('UC-5 step 6 -> UC-7 step 1: "Request Transfer" hands the chosen row and the search to the next screen', async () => {
    const { user, onSelect } = setup();
    await user.selectOptions(screen.getByLabelText('Dog'), 'Duke (D-1051)');
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    await screen.findByRole('table');
    await user.click(within(screen.getAllByRole('row')[1]).getByRole('button', { name: 'Request Transfer' }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ shelterID: 'irving', rank: 1 }),
      expect.objectContaining({ dog: expect.objectContaining({ id: 'D-1051' }), size: 'large', radiusMi: 20 }),
    );
  });

  it('NTC-07 (screen) an unverified account sees the refusal, no search form, no results and no contact details', () => {
    const { app } = setup('intern');
    expect(screen.getByText('Your account must be verified to view matches.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Find Match' })).not.toBeInTheDocument();
    expect(screen.queryByText(/555-01/)).not.toBeInTheDocument();
    expect(app.mapping.calls).toBe(0);
  });
});
