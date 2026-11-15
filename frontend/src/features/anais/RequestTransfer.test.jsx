/**
 * RequestTransfer.test.jsx - component tests (React Testing Library) for the UC-7 screen.
 * Purpose: the screen part of TC-7-01, TC-7-02, TC-7-03 and TC-7-06: shelter details, highlighted
 * missing fields, "Pending" confirmation, "no longer has space" hand-back, one active transfer per dog.
 * Owner/creator: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and run by the owner.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestApp, signInAs, fillShelters } from '../../test/testApp.js';
import RequestTransfer from './RequestTransfer.jsx';

/** Opens the screen the way FindShelters does: Duke (large) and the top match, Irving. */
async function setup({ dogId = 'D-1051' } = {}) {
  const app = signInAs(createTestApp(), 'rich');
  const dog = app.state.dogs.find((d) => d.id === dogId);
  const { matches } = await app.matchEngine.findMatches({ dogId, size: dog.size, save: false });
  const irving = matches.find((m) => m.shelterID === 'irving');
  const onBack = vi.fn();
  const onDone = vi.fn();
  render(<RequestTransfer app={app} match={irving} dog={dog} size={dog.size} onBack={onBack} onDone={onDone} />);
  return { app, onBack, onDone, user: userEvent.setup() };
}

describe('UC-7 Request Dog Transfer (screen)', () => {
  it('TC-7-01 (screen) shows the shelter details and a filled form; Send Request gives "Transfer request sent." and Pending', async () => {
    const { app, user, onDone } = await setup();
    expect(screen.getByText('Irving Animal Care Campus')).toBeInTheDocument();
    expect(screen.getByText('4140 Valley View Ln, Irving, TX')).toBeInTheDocument();
    expect(screen.getByText('(972) 555-0105')).toBeInTheDocument();
    expect(screen.getByText('49 of 90')).toBeInTheDocument();
    expect(screen.getByLabelText('Dog ID')).toHaveValue('D-1051');
    expect(screen.getByLabelText('Dog size')).toHaveValue('large');
    await user.type(screen.getByLabelText('Notes'), 'Needs daily meds');
    await user.click(screen.getByRole('button', { name: 'Send Request' }));
    expect(screen.getByText('Transfer request sent.')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(app.transfers.getRequest('T-303')).toMatchObject({ dogId: 'D-1051', toShelterID: 'irving', status: 'Pending', notes: 'Needs daily meds' });
    expect(screen.queryByRole('button', { name: 'Send Request' })).not.toBeInTheDocument(); // cannot be sent twice
    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('TC-7-02 (screen) empty Dog ID and size are highlighted with "Please complete the highlighted fields."; nothing saved', async () => {
    const { app, user } = await setup();
    await user.clear(screen.getByLabelText('Dog ID'));
    await user.selectOptions(screen.getByLabelText('Dog size'), '');
    await user.click(screen.getByRole('button', { name: 'Send Request' }));
    expect(screen.getByText('Please complete the highlighted fields.')).toBeInTheDocument();
    expect(screen.getByLabelText('Dog ID')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Dog size')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('aria-invalid');
    expect(screen.getAllByText(/Required/)).toHaveLength(2);
    expect(app.state.transfers).toHaveLength(3);
  });

  it('TC-7-03 (screen) the shelter filled up after the search: the screen hands "This shelter no longer has space." back; nothing saved', async () => {
    const { app, user, onBack } = await setup();
    fillShelters(app, ['irving']); // another user took the last kennel while this form was open
    await user.click(screen.getByRole('button', { name: 'Send Request' }));
    expect(onBack).toHaveBeenCalledWith('This shelter no longer has space.');
    expect(app.state.transfers).toHaveLength(3);
  });

  it('TC-7-06 (screen) a dog that already has an active transfer is refused with the message', async () => {
    const { app, user } = await setup({ dogId: 'D-1042' }); // Biscuit: T-301 is Pending
    await user.click(screen.getByRole('button', { name: 'Send Request' }));
    expect(screen.getByText('This dog already has an active transfer.')).toBeInTheDocument();
    expect(app.state.transfers.filter((t) => t.dogId === 'D-1042')).toHaveLength(1);
  });

  it('"Back to match results" returns without a message (no refresh needed)', async () => {
    const { user, onBack } = await setup();
    await user.click(screen.getByRole('button', { name: 'Back to match results' }));
    expect(onBack).toHaveBeenCalledWith(null);
  });
});
