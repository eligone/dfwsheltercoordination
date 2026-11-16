/**
 * NotificationPreferences.test.jsx - component tests (React Testing Library) for the UC-15 screen.
 * Purpose: the screen part of TC-15-01, TC-15-02, TC-15-03, TC-15-05 and TC-15-06: adding, validating, saving,
 * cancelling and removing contacts, and the failed-delivery status. Validation and retry rules themselves are
 * unit-tested in services/notificationService.test.js.
 * Owner/creator: Avalon Austin. AI-assisted draft; the owner reviews and runs it.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestApp, signInAs } from '../../test/testApp.js';
import NotificationPreferences from './NotificationPreferences.jsx';

function setup(prepare = () => {}) {
  const app = signInAs(createTestApp(), 'rich');
  prepare(app);
  const onBack = vi.fn();
  const view = render(<NotificationPreferences app={app} onBack={onBack} />);
  return { app, onBack, view, user: userEvent.setup() };
}
const REMINDER = /Send a reminder/;
const PRIORITY = /Also send to my contacts/;
const contactValues = () => screen.queryAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[1].textContent);

async function addContact(user, type, value) {
  await user.click(screen.getByRole('button', { name: 'Add phone number or email' }));
  const dialog = screen.getByRole('dialog');
  await user.selectOptions(within(dialog).getByLabelText('Type'), type);
  const field = within(dialog).getByLabelText(type === 'Email' ? /Email address/ : /Phone number/);
  await user.clear(field);
  await user.type(field, value);
  await user.click(within(dialog).getByRole('button', { name: 'Add contact' }));
}

describe('UC-15 Manage Notification Preferences (screen)', () => {
  it('shows the saved contact, 1 hour and High priority only', () => {
    setup();
    expect(contactValues()).toEqual(['staff@richardson.example']);
    expect(screen.getByLabelText(REMINDER)).toHaveValue('1 hour');
    expect(screen.getByLabelText(PRIORITY)).toHaveValue('High priority only');
  });

  it('TC-15-01 (screen) add an email, Save changes: listed, "Preferences saved.", stored', async () => {
    const { app, user } = setup();
    await addContact(user, 'Email', 'intake2@richardson.example');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(contactValues()).toEqual(['staff@richardson.example', 'intake2@richardson.example']);
    expect(app.notifications.getPreferences().contacts).toHaveLength(1); // not saved yet
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Preferences saved.')).toBeInTheDocument();
    expect(app.notifications.getPreferences().contacts.map((c) => c.value)).toContain('intake2@richardson.example');
  });

  it('TC-15-02 (screen) invalid email and phone: exact messages, nothing added; a valid phone is then added', async () => {
    const { user } = setup();
    await addContact(user, 'Email', 'intake@richardson');
    expect(screen.getByText(/Enter a valid email address/)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // stays open so it can be corrected
    await user.selectOptions(screen.getByLabelText('Type'), 'Phone');
    await user.type(screen.getByLabelText(/Phone number/), '12345');
    await user.click(screen.getByRole('button', { name: 'Add contact' }));
    expect(screen.getByText(/Enter a valid phone number/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Phone number/));
    await user.type(screen.getByLabelText(/Phone number/), '(972) 555-0199');
    await user.click(screen.getByRole('button', { name: 'Add contact' }));
    expect(contactValues()).toEqual(['staff@richardson.example', '(972) 555-0199']);
  });

  it('TC-15-03 (screen) Save keeps 2 hours and High and medium; Cancel keeps the old 1 hour and High only', async () => {
    const { app, view, user } = setup();
    await user.selectOptions(screen.getByLabelText(REMINDER), '2 hours');
    await user.selectOptions(screen.getByLabelText(PRIORITY), 'High and medium priority');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText(REMINDER)).toHaveValue('1 hour');
    expect(screen.getByLabelText(PRIORITY)).toHaveValue('High priority only');
    expect(app.notifications.getPreferences()).toMatchObject({ reminderDelayMinutes: 60, sendToContactsFor: 'HIGH_ONLY' });

    await user.selectOptions(screen.getByLabelText(REMINDER), '2 hours');
    await user.selectOptions(screen.getByLabelText(PRIORITY), 'High and medium priority');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Preferences saved.')).toBeInTheDocument();
    view.unmount(); // reopen the screen: the saved values are still there
    render(<NotificationPreferences app={app} />);
    expect(screen.getByLabelText(REMINDER)).toHaveValue('2 hours');
    expect(screen.getByLabelText(PRIORITY)).toHaveValue('High and medium priority');
  });

  it('TC-15-05 (screen) a failed delivery shows "Delivery failed" and "Retried 3 times. Failure logged."', async () => {
    const app = signInAs(createTestApp(), 'rich');
    app.channels.EMAIL.failFor.add('staff@richardson.example');
    app.alerts.create({ type: 'MATCH_FOUND', priority: 'high', message: 'x', recipientShelterID: 'rich' });
    await app.settle();
    render(<NotificationPreferences app={app} />);
    expect(screen.getByText('Delivery failed')).toBeInTheDocument();
    expect(screen.getByText('Retried 3 times. Failure logged.')).toBeInTheDocument();
    expect(app.channels.EMAIL.calls).toBe(3);
  });

  it('TC-15-06 (screen) a duplicate is refused with the exact message; Remove deletes the contact', async () => {
    const { user } = setup();
    await addContact(user, 'Email', 'staff@richardson.example');
    expect(screen.getByText(/This contact has already been added\./)).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(contactValues()).toEqual(['staff@richardson.example']);
    await user.click(screen.getByRole('button', { name: 'Remove staff@richardson.example' }));
    expect(contactValues()).toEqual([]);
    expect(screen.getByText('No contacts added yet.')).toBeInTheDocument();
  });

  it('signed-out visitors get "Please sign in."; Back to Home calls onBack', async () => {
    const { onBack, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(onBack).toHaveBeenCalledOnce();
    render(<NotificationPreferences app={createTestApp()} />);
    expect(screen.getByText('Please sign in.')).toBeInTheDocument();
  });
});
