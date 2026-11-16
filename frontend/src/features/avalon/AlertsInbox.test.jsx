/**
 * AlertsInbox.test.jsx - component tests (React Testing Library) for the UC-14 screen.
 * Purpose: the screen part of TC-14-01 to TC-14-04 and NFR-10 (NTC-11): what staff see and click. The rules
 * (sorting, unread count, filters, own-shelter check) are unit-tested in services/alertService.test.js.
 * Owner/creator: Avalon Austin. AI-assisted draft; the owner reviews and runs it.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { createTestApp, signInAs } from '../../test/testApp.js';
import { ServiceError } from '../../services/models.js';
import { MESSAGES } from '../../services/messages.js';
import AlertsInbox from './AlertsInbox.jsx';

function setup(who = 'rich') {
  const app = signInAs(createTestApp(), who);
  const onChange = vi.fn();
  const onBack = vi.fn();
  render(<AlertsInbox app={app} onChange={onChange} onBack={onBack} />);
  return { app, onChange, onBack, user: userEvent.setup() };
}
/** The alert rows only (the NavBar also has list items). */
const alertList = () => screen.queryByRole('list', { name: 'Alert list' });
const alertRows = () => within(screen.getByRole('list', { name: 'Alert list' })).getAllByRole('listitem');
/** The alert messages in the list, top to bottom. */
const rowTexts = () => alertRows().map((li) => li.querySelector('p').textContent);

describe('UC-14 View Alerts Inbox (screen)', () => {
  it('TC-14-01 (screen) three alerts with High, Medium, Low badges, two unread dots, unread count 2 on the page and the bell', () => {
    setup();
    expect(rowTexts()).toEqual(['Match found for Biscuit (D-1042)', 'Transfer T-302 accepted by Plano', 'Reminder: request T-297 not viewed']);
    const rows = alertRows();
    expect(rows.map((r) => ['High', 'Medium', 'Low'].find((p) => within(r).queryByText(p)))).toEqual(['High', 'Medium', 'Low']);
    expect(screen.getAllByRole('img', { name: 'Unread' })).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: 'Read' })).toHaveLength(1);
    expect(screen.getByText('2 unread')).toBeInTheDocument();
    expect(screen.getByLabelText('Alerts')).toHaveTextContent('2');
    expect(screen.getByText('1 high-priority alert needs a response')).toBeInTheDocument();
  });

  it('TC-14-02 (screen) View on A-90: marked read, count 1, dog, Collin contact and the request outcome; Close and Escape close it', async () => {
    const { app, onChange, user } = setup();
    await user.click(screen.getByRole('button', { name: 'View Match found for Biscuit (D-1042)' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Collin County Animal Services/)).toBeInTheDocument();
    expect(within(dialog).getByText(/\(972\) 555-0103 · staff@collin\.example/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Biscuit \(D-1042\) · Lab mix · large/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Request T-301/).closest('p')).toHaveTextContent('Request T-301: Pending');
    expect(app.alerts.unreadCount()).toBe(1);
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View Transfer T-302 accepted by Plano' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('TC-14-03 (screen) Priority High shows A-90 only; Unread tab shows A-90 and A-89; Mark all as read gives 0', async () => {
    const { app, user } = setup();
    await user.selectOptions(screen.getByLabelText('Priority'), 'High');
    expect(rowTexts()).toEqual(['Match found for Biscuit (D-1042)']);
    await user.selectOptions(screen.getByLabelText('Priority'), 'All priorities');
    await user.click(screen.getByRole('tab', { name: 'Unread' }));
    expect(rowTexts()).toEqual(['Match found for Biscuit (D-1042)', 'Transfer T-302 accepted by Plano']);
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(app.alerts.unreadCount()).toBe(0);
    expect(screen.getByText('0 unread')).toBeInTheDocument();
    expect(screen.getByText('No alerts match this filter.')).toBeInTheDocument();
    expect(screen.queryByText(/high-priority alert/)).not.toBeInTheDocument();
  });

  it('TC-14-04 (screen) empty inbox: both empty-state texts and Mark all as read disabled', () => {
    setup('dal');
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up. New alerts will appear here.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    expect(alertList()).not.toBeInTheDocument();
  });

  it('single-alert actions: Mark as unread then Mark as read change the count; Back to Home calls onBack', async () => {
    const { app, onBack, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Mark as unread: Reminder: request T-297 not viewed' }));
    expect(app.alerts.unreadCount()).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Mark as read: Transfer T-302 accepted by Plano' }));
    expect(app.alerts.unreadCount()).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('NTC-11 (screen) Dallas staff see none of Richardson\'s alerts', () => {
    setup('dal');
    expect(screen.queryByText('Match found for Biscuit (D-1042)')).not.toBeInTheDocument();
  });

  it('a refused open (another shelter\'s alert) shows the message and no dialog', async () => {
    const { app, user } = setup();
    vi.spyOn(app.alerts, 'openAlert').mockImplementation(() => { throw new ServiceError('FORBIDDEN', MESSAGES.OWN_ALERTS); });
    await user.click(screen.getByRole('button', { name: 'View Match found for Biscuit (D-1042)' }));
    expect(screen.getByText('You can only view alerts for your shelter.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('signed-out visitors get "Please sign in." and no alerts', () => {
    render(<AlertsInbox app={createTestApp()} />);
    expect(screen.getByText('Please sign in.')).toBeInTheDocument();
    expect(alertList()).not.toBeInTheDocument();
  });
});
