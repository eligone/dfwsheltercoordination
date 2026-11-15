/** Saif Yusuff: UC-10 component/integration acceptance and authorization tests. */
import { StrictMode } from 'react';
import { render, screen, within, act, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';
import { createTestApp, signInAs } from '../../test/testApp.js';
import MyDogsTransfers from './MyDogsTransfers.jsx';
import SharedDashboard from './SharedDashboard.jsx';

afterEach(cleanup);
describe('UC-10 My Dogs transfers', () => {
  it('TC-10-01 displays seeded transfers, including Completed with breed, size, destination and date', () => {
    const app = signInAs(createTestApp(), 'rich');
    render(<MyDogsTransfers app={app} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);
    for (const [i, transfer] of app.transfers.listMyDogs().rows.entries()) {
      const row = within(rows[i + 1]);
      for (const value of [transfer.dogName, transfer.breed, transfer.size, transfer.toShelterName, transfer.status]) expect(row.getByText(value, { exact: true })).toBeInTheDocument();
      expect(row.getByText(transfer.requestedAt.toISOString().slice(0,16).replace('T',' '))).toBeInTheDocument();
    }
    expect(within(rows[3]).getByText('Completed')).toBeInTheDocument();
  });
  it('TC-10-02 opens authorized details and closes them', async () => {
    render(<MyDogsTransfers app={signInAs(createTestApp(), 'rich')} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'View Biscuit transfer details' }));
    const details = screen.getByRole('region', { name: 'Transfer details for Biscuit' });
    for (const value of ['T-301', '2026-11-03 14:20', '(972) 555-0103', 'staff@collin.example']) expect(within(details).getByText(value)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('TC-10-03 renders the exact empty state', () => {
    render(<MyDogsTransfers app={signInAs(createTestApp(), 'dal')} />);
    expect(screen.getByRole('status')).toHaveTextContent(/^No active transfers\.$/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('TC-10-03 updates both list and open details through the existing service event', async () => {
    const app = signInAs(createTestApp(), 'rich');
    render(<StrictMode><MyDogsTransfers app={app} /></StrictMode>);
    await userEvent.setup().click(screen.getByRole('button', { name: 'View Biscuit transfer details' }));
    act(() => { signInAs(app, 'collin'); app.transfers.accept('T-301'); signInAs(app, 'rich'); });
    expect(within(screen.getAllByRole('row')[1]).getByText('Accepted')).toBeInTheDocument();
    expect(within(screen.getByRole('region')).getByText('Accepted')).toBeInTheDocument();
  });
  it('TC-10-04 refuses cross-shelter detail links at service and screen', () => {
    const app = signInAs(createTestApp(), 'dal');
    expect(() => app.transfers.getMyDogTransfer('T-301')).toThrow('You can only update your own shelter.');
    render(<MyDogsTransfers app={app} initialRequestID="T-301" />);
    expect(screen.getByRole('alert')).toHaveTextContent('You can only update your own shelter.');
    expect(screen.queryByText(/Biscuit|Pepper|Luna|staff@collin.example/)).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('refuses anonymous list and detail access', () => {
    const app = createTestApp();
    expect(() => app.transfers.listMyDogs()).toThrow('Please sign in.');
    expect(() => app.transfers.getMyDogTransfer('T-301')).toThrow('Please sign in.');
    render(<SharedDashboard app={app} initialPage="dogs" initialRequestID="T-301" />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Biscuit')).not.toBeInTheDocument();
  });
  it('hides receiving contacts for unverified staff and handles missing requests', async () => {
    const app = signInAs(createTestApp(), 'intern');
    render(<MyDogsTransfers app={app} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'View Biscuit transfer details' }));
    expect(within(screen.getByRole('region')).getAllByText('Not available')).toHaveLength(2);
    expect(screen.queryByText('staff@collin.example')).not.toBeInTheDocument();
    cleanup();
    render(<MyDogsTransfers app={app} initialRequestID="T-missing" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Transfer request not found.');
  });
  it('supports Home/My Dogs flow and removes open details after session loss', async () => {
    const app = signInAs(createTestApp(), 'rich'); const user = userEvent.setup();
    render(<SharedDashboard app={app} />);
    await user.click(screen.getByRole('button', { name: 'View my dogs' }));
    expect(screen.getByRole('heading', { name: 'My Dogs’ Transfers' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(screen.getByRole('heading', { name: 'Shared Dashboard' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View my dogs' }));
    await user.click(screen.getByRole('button', { name: 'View Biscuit transfer details' }));
    app.auth.signOut();
    await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument());
    expect(screen.queryByText('Biscuit')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
  it('drops prior-shelter selection when a different staff member signs in', async () => {
    const app = signInAs(createTestApp(), 'rich');
    render(<SharedDashboard app={app} initialPage="dogs" initialRequestID="T-301" />);
    expect(screen.getByRole('region')).toBeInTheDocument();
    signInAs(app, 'dal');
    await waitFor(() => expect(screen.queryByText('Biscuit')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('No active transfers.');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
