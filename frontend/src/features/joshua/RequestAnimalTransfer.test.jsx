/**
 * RequestAnimalTransfer.test.jsx - component tests (React Testing Library) for the UC-3 screen.
 * Purpose: the screen part of TC-3-01 to TC-3-05: what staff see after pressing "Send Request"
 * (ranked list and "Transfer request sent.", highlighted fields, "No match found", medical filter,
 * mapping failure with the form kept).
 * Owner/creator: Joshua Nakka. AI-assisted draft (Claude); reviewed and run by the owner.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestApp, signInAs, fillShelters, releaseDog } from '../../test/testApp.js';
import { createStubMapping } from '../../services/matchEngine.js';
import RequestAnimalTransfer from './RequestAnimalTransfer.jsx';

/** P0 with Biscuit given "no active transfer" (the test-case precondition), signed in as Richardson. */
function setup(options = {}) {
  const app = signInAs(createTestApp(options), 'rich');
  releaseDog(app, 'D-1042');
  render(<RequestAnimalTransfer app={app} />);
  return { app, user: userEvent.setup() };
}
async function send(user, { dog, urgency, notes } = {}) {
  if (dog) await user.selectOptions(screen.getByLabelText('Dog to transfer'), dog);
  if (urgency) await user.selectOptions(screen.getByLabelText('Urgency'), urgency);
  if (notes) await user.type(screen.getByLabelText('Notes'), notes);
  await user.click(screen.getByRole('button', { name: 'Send Request' }));
}
/** Shelter names in the "Ranked matches" table, in order. */
function rankedNames(dogName = 'Biscuit') {
  const card = screen.getByRole('heading', { name: `Ranked matches for ${dogName}` }).closest('section');
  return within(card).getAllByRole('row').slice(1).map((r) => r.cells[1].textContent);
}

describe('UC-3 Request Animal Transfer (screen)', () => {
  it('TC-3-01 (screen) Send Request shows "Transfer request sent.", Pending and the ranked list', async () => {
    const { app, user } = setup();
    await send(user, { dog: 'Biscuit (D-1042)', urgency: 'High' });
    expect(await screen.findByText('Transfer request sent.')).toBeInTheDocument();
    expect(screen.getByText(/Request T-303 for Biscuit \(D-1042\)/)).toBeInTheDocument();
    expect(rankedNames()).toEqual(['Irving Animal Care Campus', 'Carrollton Animal Services & Adoption Center', 'Collin County Animal Services', 'Dallas Animal Services']);
    expect(screen.getAllByText('Alert sent')).toHaveLength(3);
    expect(screen.getByText('Next in line')).toBeInTheDocument();
    expect(app.transfers.getRequest('T-303').status).toBe('Pending');
    for (const sid of ['irving', 'carr', 'collin']) {
      expect(app.state.alerts.filter((a) => a.transferRequestID === 'T-303' && a.recipientShelterID === sid)).toHaveLength(1);
    }
  });

  it('TC-3-02 (screen) an empty form highlights both fields with "Please complete the highlighted fields."; nothing saved', async () => {
    const { app, user } = setup();
    const before = app.state.transfers.length;
    await send(user);
    expect(await screen.findByText('Please complete the highlighted fields.')).toBeInTheDocument();
    expect(screen.getByLabelText('Dog to transfer')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Urgency')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText(/Required/)).toHaveLength(2);
    expect(app.state.transfers).toHaveLength(before);
  });

  it('TC-3-03 (screen) with every other shelter full the screen shows "No match found" and the request stays Pending', async () => {
    const { app, user } = setup();
    fillShelters(app, ['dal', 'collin', 'plano', 'irving', 'carr']);
    const alertsBefore = app.state.alerts.length;
    await send(user, { dog: 'Biscuit (D-1042)', urgency: 'Normal' });
    expect(await screen.findByText('No match found')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Ranked matches/ })).not.toBeInTheDocument();
    expect(app.transfers.getRequest('T-303').status).toBe('Pending');
    expect(app.state.alerts).toHaveLength(alertsBefore);
  });

  it('TC-3-04 (screen) a shelter that cannot meet medical needs is not in the ranked list (FR-18)', async () => {
    const { app, user } = setup();
    app.state.shelters.find((s) => s.id === 'collin').medicalCapable = false;
    await send(user, { dog: 'Biscuit (D-1042)', urgency: 'High' });
    await screen.findByText('Transfer request sent.');
    expect(rankedNames()).toEqual(['Irving Animal Care Campus', 'Carrollton Animal Services & Adoption Center', 'Dallas Animal Services']);
  });

  it('TC-3-05 (screen) a Mapping failure shows "Could not calculate distances. Try again." and keeps the form', async () => {
    const { app, user } = setup({ mapping: createStubMapping({ fail: true }) });
    const before = app.state.transfers.length;
    await send(user, { dog: 'Biscuit (D-1042)', urgency: 'High', notes: 'Crate trained' });
    expect(await screen.findByText('Could not calculate distances. Try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('Dog to transfer')).toHaveValue('Biscuit (D-1042)');
    expect(screen.getByLabelText('Urgency')).toHaveValue('High');
    expect(screen.getByLabelText('Notes')).toHaveValue('Crate trained');
    expect(app.state.transfers).toHaveLength(before);
  });
});
