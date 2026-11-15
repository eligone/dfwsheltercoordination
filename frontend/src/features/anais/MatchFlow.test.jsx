/**
 * MatchFlow.test.jsx - component tests for moving between the dashboard, UC-5 and UC-7.
 * Purpose: TC-5-03 (shelter marked Full asks for the size), TC-5-06 (Cancel returns to the dashboard)
 * and TC-7-03 (shelter filled up: staff are told and see an UPDATED match list) at screen level.
 * Owner/creator: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and run by the owner.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestApp, signInAs, fillShelters, availableOf } from '../../test/testApp.js';
import MatchFlow from './MatchFlow.jsx';

function setup() {
  const app = signInAs(createTestApp(), 'rich');
  render(<MatchFlow app={app} />);
  return { app, user: userEvent.setup() };
}
const heading = () => screen.getByRole('heading', { level: 1 }).textContent;
const resultNames = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[1].textContent);

describe('UC-5 / UC-7 flow (screens)', () => {
  it('TC-5-03 (screen) marking the shelter Full opens Find Available Shelters and asks for the dog size; no search yet', async () => {
    const { app, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Mark shelter Full' }));
    expect(availableOf(app, 'rich')).toBe(0);
    expect(heading()).toBe('Find Available Shelters');
    expect(screen.getByText("Select the dog's size")).toBeInTheDocument();
    expect(screen.getByLabelText('Dog size')).toHaveValue('');
    expect(app.mapping.calls).toBe(0);
  });

  it('TC-5-06 (screen) Cancel returns to the dashboard and runs no search', async () => {
    const { app, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    expect(heading()).toBe('Find Available Shelters');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(heading()).toBe('Home');
    expect(app.mapping.calls).toBe(0);
  });

  it('TC-7-03 (screen) the chosen shelter fills up: staff are told and returned to an updated match list', async () => {
    const { app, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    await user.selectOptions(screen.getByLabelText('Dog'), 'Duke (D-1051)');
    await user.click(screen.getByRole('button', { name: 'Find Match' }));
    await screen.findByRole('table');
    expect(resultNames()[0]).toBe('Irving Animal Care Campus');
    await user.click(within(screen.getAllByRole('row')[1]).getByRole('button', { name: 'Request Transfer' }));
    expect(heading()).toBe('Request Dog Transfer');

    fillShelters(app, ['irving']); // Irving's last kennel is taken before staff submit
    await user.click(screen.getByRole('button', { name: 'Send Request' }));

    expect(heading()).toBe('Find Available Shelters');
    expect(screen.getByText('This shelter no longer has space.')).toBeInTheDocument();
    await screen.findByRole('table');
    expect(resultNames()).toEqual(['Carrollton Animal Services & Adoption Center', 'Collin County Animal Services', 'Dallas Animal Services']);
    expect(screen.getByLabelText('Dog')).toHaveValue('Duke (D-1051)'); // same dog and size, no retyping
    expect(app.state.transfers).toHaveLength(3); // nothing was saved
  });
});
