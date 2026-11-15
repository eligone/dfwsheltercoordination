/**
 * RespondTransfer.test.jsx - component tests (React Testing Library) for the UC-4 screen.
 * Purpose: the screen part of TC-4-01 to TC-4-05, signed in as Collin County staff with seed request
 * T-301 (Biscuit from Richardson) waiting: open it, Accept, Mark as Completed, Decline with a reason,
 * accept when full, and the illegal "Completed before Accepted" change.
 * Owner/creator: Joshua Nakka. AI-assisted draft (Claude); reviewed and run by the owner.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestApp, signInAs, fillShelters, availableOf } from '../../test/testApp.js';
import RespondTransfer from './RespondTransfer.jsx';

/** Signed in as Collin with T-301 Pending; the request is opened the way staff open it from the list. */
async function setup({ full = false } = {}) {
  const app = signInAs(createTestApp(), 'collin');
  if (full) fillShelters(app, ['collin']);
  render(<RespondTransfer app={app} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Open' }));
  await screen.findByText('19.5 mi'); // distance comes back from the (stub) Mapping service
  return { app, user };
}
const available = () => screen.getByTestId('my-available').textContent;
const click = (user, name) => user.click(screen.getByRole('button', { name }));

describe('UC-4 Respond to Transfer (screen)', () => {
  it('TC-4-01 (screen) shows profile, sender, distance and score; Accept makes it Accepted and Collin 40 -> 39', async () => {
    const { app, user } = await setup();
    expect(screen.getByText('Heartworm positive')).toBeInTheDocument();
    expect(screen.getAllByText('Richardson Animal Shelter').length).toBeGreaterThan(0);
    expect(screen.getByText('0.4525')).toBeInTheDocument();
    expect(available()).toBe('40');
    await click(user, 'Accept');
    expect(await screen.findByText('Transfer request accepted.')).toBeInTheDocument();
    expect(available()).toBe('39');
    expect(app.transfers.getRequest('T-301').status).toBe('Accepted');
    expect(screen.getByText('(972) 555-0101')).toBeInTheDocument(); // sender contact for pickup
    expect(app.state.alerts.some((a) => a.recipientShelterID === 'rich' && a.message === 'Transfer T-301 accepted by Collin County Animal Services')).toBe(true);
  });

  it('TC-4-02 (screen) Mark as Completed after Accept: Completed, Richardson 2 -> 3', async () => {
    const { app, user } = await setup();
    await click(user, 'Accept');
    await click(user, 'Mark as Completed');
    expect(await screen.findByText('Transfer marked as completed.')).toBeInTheDocument();
    expect(screen.getByText('Richardson Animal Shelter now has 3 available kennels.')).toBeInTheDocument();
    expect(app.transfers.getRequest('T-301').status).toBe('Completed');
    expect(availableOf(app, 'rich')).toBe(3);
    expect(availableOf(app, 'collin')).toBe(39);
  });

  it('TC-4-03 (screen) Decline with a reason: reason stored, Carrollton alerted next, no capacity change', async () => {
    const { app, user } = await setup();
    await click(user, 'Decline');
    await user.type(screen.getByLabelText('Reason for declining'), 'No medical staff on site');
    await click(user, 'Confirm Decline');
    expect(await screen.findByText('Transfer request declined.')).toBeInTheDocument();
    expect(screen.getByText(/Carrollton Animal Services & Adoption Center has been alerted next\./)).toBeInTheDocument();
    expect(app.transfers.getRequest('T-301').responses.collin).toMatchObject({ status: 'Declined', reason: 'No medical staff on site' });
    expect(app.state.alerts.some((a) => a.recipientShelterID === 'carr' && a.transferRequestID === 'T-301')).toBe(true);
    expect([availableOf(app, 'collin'), availableOf(app, 'rich')]).toEqual([40, 2]);
  });

  it('TC-4-04 (screen) Accept when Collin is full shows "This shelter no longer has space."; stays Pending at 0', async () => {
    const { app, user } = await setup({ full: true });
    await click(user, 'Accept');
    expect(await screen.findByText('This shelter no longer has space.')).toBeInTheDocument();
    expect(app.transfers.getRequest('T-301').status).toBe('Pending');
    expect(available()).toBe('0');
  });

  it('TC-4-05 (screen) Mark as Completed on a Pending request shows "Accept the request first."; status unchanged', async () => {
    const { app, user } = await setup();
    await click(user, 'Mark as Completed');
    expect(await screen.findByText('Accept the request first.')).toBeInTheDocument();
    expect(app.transfers.getRequest('T-301').status).toBe('Pending');
    await click(user, 'Accept');
    await click(user, 'Accept');
    expect(await screen.findByText('This request is no longer pending.')).toBeInTheDocument();
  });
});
