/**
 * NotificationPreferences.jsx - the UC-15 Manage Notification Preferences screen (Settings).
 * Purpose: staff add or remove the phone numbers and emails that also receive notifications, choose the reminder
 * delay and which priorities are also sent to contacts, then "Save changes" or "Cancel" (FR-23, FR-24, NFR-7).
 * Changes are kept in a draft; nothing is stored until the service's savePreferences() is called, so Cancel just
 * drops the draft. Validation, duplicates, delivery status and retries live in services/notificationService.js.
 * Owner: Avalon Austin. AI-assisted draft; the owner reviews and explains it.
 */
import { useState } from 'react';
import { Badge, Banner, Button, Card, Input, PageShell, Select, Table } from '../../components/ui';
import { ContactType, PriorityThreshold } from '../../services/models.js';

export const REMINDER_OPTIONS = { '30 minutes': 30, '1 hour': 60, '2 hours': 120, '4 hours': 240 };
export const PRIORITY_OPTIONS = {
  'High priority only': PriorityThreshold.HIGH_ONLY,
  'High and medium priority': PriorityThreshold.HIGH_AND_MEDIUM,
  'All priorities (high, medium, low)': PriorityThreshold.ALL,
};
const TYPE_OPTIONS = { Email: ContactType.EMAIL, Phone: ContactType.PHONE };

const labelFor = (map, value) => Object.keys(map).find((k) => map[k] === value);
const typeLabel = (t) => labelFor(TYPE_OPTIONS, t);

function AddContactModal({ onAdd, onCancel }) {
  const [type, setType] = useState('Email');
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const submit = () => { try { onAdd({ type: TYPE_OPTIONS[type], value }); } catch (e) { setError(e.message); } };

  return (
    <div role="dialog" aria-modal="true" aria-label="Add phone number or email" className="fixed inset-0 z-20">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/40 p-6">
        <div className="w-full max-w-md rounded-lg border border-line bg-surface shadow-lg">
          <header className="border-b border-line px-5 py-3 font-semibold">Add phone number or email</header>
          <div className="space-y-4 p-5">
            <Select label="Type" options={Object.keys(TYPE_OPTIONS)} value={type} onChange={(e) => { setType(e.target.value); setValue(''); setError(null); }} />
            <Input
              label={type === 'Email' ? 'Email address' : 'Phone number'}
              placeholder={type === 'Email' ? 'name@shelter.org' : '(972) 555-0100'}
              value={value} error={error ?? undefined} autoFocus
              hint="We will send a verification message to this contact."
              onChange={(e) => { setValue(e.target.value); setError(null); }}
            />
          </div>
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button onClick={submit}>Add contact</Button>
          </footer>
        </div>
      </div>
    </div>
  );
}

/**
 * @param app     the shared services from createApp()
 * @param onBack  "Back to Home"
 */
export default function NotificationPreferences({ app, onBack }) {
  const load = () => { try { return { prefs: app.notifications.getPreferences(), error: null }; } catch (e) { return { prefs: null, error: e.message }; } };
  const [initial] = useState(load);
  const [draft, setDraft] = useState(initial.prefs);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  if (!draft) return <PageShell nav="Settings" title="Settings"><Banner tone="alert" title={initial.error} /></PageShell>;

  // A contact's delivery status can change after the draft was made (a failed send), so read it from the saved copy.
  const stored = new Map(app.notifications.getPreferences().contacts.map((c) => [c.contactID, c]));
  const columns = [
    { key: 'type', header: 'Type', render: (c) => typeLabel(c.type) },
    { key: 'value', header: 'Contact' },
    {
      key: 'status', header: 'Status',
      render: (c) => {
        const d = app.notifications.describeDelivery(stored.get(c.contactID) ?? c);
        return d.detail ? (
          <div><Badge tone="full">{d.label}</Badge><p className="mt-1 text-xs text-muted">{d.detail}</p></div>
        ) : <Badge tone="open">{d.label}</Badge>;
      },
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (c) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" aria-label={`Remove ${c.value}`} onClick={() => { setSaved(false); setDraft({ ...draft, contacts: draft.contacts.filter((x) => `${x.type}:${x.value}` !== c.rowKey) }); }}>Remove</Button>
        </div>
      ),
    },
  ];
  // Contacts added in this draft have no ID yet, so rows (and Remove) are keyed by type and value, not by ID.
  const rows = draft.contacts.map((c) => ({ ...c, rowKey: `${c.type}:${c.value}` }));

  const delayLabel = labelFor(REMINDER_OPTIONS, draft.reminderDelayMinutes) ?? `${draft.reminderDelayMinutes} minutes`;
  const delayOptions = Object.keys(REMINDER_OPTIONS).includes(delayLabel) ? Object.keys(REMINDER_OPTIONS) : [...Object.keys(REMINDER_OPTIONS), delayLabel];

  const edit = (patch) => { setSaved(false); setError(null); setDraft({ ...draft, ...patch }); };
  function save() {
    setError(null);
    try { app.notifications.savePreferences(draft); setDraft(app.notifications.getPreferences()); setSaved(true); } catch (e) { setError(e.message); }
  }
  function cancel() { setDraft(app.notifications.getPreferences()); setSaved(false); setError(null); } // UC-15: the old values stay

  return (
    <PageShell
      nav="Settings"
      unread={app.alerts.unreadCount()}
      title="Settings"
      subtitle="Notification Preferences"
      actions={
        <>
          {onBack && <Button variant="ghost" onClick={onBack}>Back to Home</Button>}
          <Button variant="secondary" onClick={cancel}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      {saved && <Banner tone="success" title="Preferences saved.">Your notification settings have been updated.</Banner>}
      {error && <Banner tone="alert" title={error} />}

      <Card title="Where to send notifications" actions={<Button variant="secondary" size="sm" onClick={() => setAdding(true)}>Add phone number or email</Button>}>
        <p className="mb-3 text-sm text-muted">Alerts always appear in your inbox. Contacts below also receive notifications.</p>
        {rows.length ? <Table columns={columns} rows={rows} rowKey="rowKey" /> : <p className="text-sm text-muted">No contacts added yet.</p>}
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Reminders">
          <Select
            label="Send a reminder if a request has not been viewed after"
            options={delayOptions} value={delayLabel}
            hint="Reminders are sent to your inbox and to all contacts above."
            onChange={(e) => edit({ reminderDelayMinutes: REMINDER_OPTIONS[e.target.value] ?? draft.reminderDelayMinutes })}
          />
        </Card>
        <Card title="Priority">
          <Select
            label="Also send to my contacts for"
            options={Object.keys(PRIORITY_OPTIONS)} value={labelFor(PRIORITY_OPTIONS, draft.sendToContactsFor)}
            hint="Dogs at high risk of euthanasia are always labeled high priority."
            onChange={(e) => edit({ sendToContactsFor: PRIORITY_OPTIONS[e.target.value] })}
          />
        </Card>
      </div>

      {adding && (
        <AddContactModal
          onCancel={() => setAdding(false)}
          onAdd={(contact) => { setDraft(app.notifications.addContactToDraft(draft, contact)); setSaved(false); setAdding(false); }}
        />
      )}
    </PageShell>
  );
}
