// Notification Preferences, reached from Settings.
// Covers: add phone numbers/emails for notifications, reminder after a set time,
// priority labels, and failed-delivery retry/logging (Avalon's requirements).
import { Badge, Banner, Button, Card, Input, Modal, PageShell, Select, Table } from '../../components/ui';

export const meta = {
  uc: 'Alerts',
  title: 'Notification Preferences',
  owner: 'Avalon',
  screen: 'Settings',
  states: ['default', 'add-contact', 'error', 'saved'],
  width: 1024,
};

const contacts = [
  { id: 'c1', type: 'Email', value: 'staff@richardson.example', status: 'Verified' },
  { id: 'c2', type: 'Phone', value: '(972) 555-0101', status: 'Verified' },
  { id: 'c3', type: 'Email', value: 'intake@richardson.example', status: 'Delivery failed' },
];

const columns = [
  { key: 'type', header: 'Type' },
  { key: 'value', header: 'Contact' },
  {
    key: 'status',
    header: 'Status',
    render: (r) =>
      r.status === 'Verified' ? (
        <Badge tone="open">Verified</Badge>
      ) : (
        <div>
          <Badge tone="full">Delivery failed</Badge>
          <p className="mt-1 text-xs text-muted">Retried 3 times. Failure logged.</p>
        </div>
      ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: () => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">Edit</Button>
        <Button variant="ghost" size="sm">Remove</Button>
      </div>
    ),
  },
];

export default function NotificationPreferences({ state }) {
  const saved = state === 'saved';
  const modal = state === 'add-contact' || state === 'error';
  const error = state === 'error';

  return (
    <div className="relative min-h-[720px]">
      <PageShell
        nav="Settings"
        unread={2}
        title="Settings"
        subtitle="Notification Preferences"
        actions={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button>Save changes</Button>
          </>
        }
      >
        {saved && <Banner tone="success" title="Preferences saved.">Your notification settings have been updated.</Banner>}

        <Card
          title="Where to send notifications"
          actions={<Button variant="secondary" size="sm">Add phone number or email</Button>}
        >
          <p className="mb-3 text-sm text-muted">
            Alerts always appear in your inbox. Contacts below also receive notifications.
          </p>
          <Table columns={columns} rows={contacts} />
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Reminders">
            <Select
              label="Send a reminder if a request has not been viewed after"
              options={['30 minutes', '1 hour', '2 hours', '4 hours']}
              defaultValue={saved ? '2 hours' : '1 hour'}
              hint="Reminders are sent to your inbox and to all contacts above."
            />
          </Card>
          <Card title="Priority">
            <Select
              label="Also send to my contacts for"
              options={['High priority only', 'High and medium priority', 'All priorities (high, medium, low)']}
              defaultValue={saved ? 'High and medium priority' : 'High priority only'}
              hint="Dogs at high risk of euthanasia are always labeled high priority."
            />
          </Card>
        </div>
      </PageShell>

      {modal && (
        <Modal
          title="Add phone number or email"
          width="max-w-md"
          footer={
            <>
              <Button variant="secondary">Cancel</Button>
              <Button>Add contact</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Select label="Type" options={['Email', 'Phone']} />
            <Input
              label="Email address"
              placeholder="name@shelter.org"
              defaultValue={error ? 'intake@richardson' : ''}
              error={error ? 'Enter a valid email address' : undefined}
              hint="We will send a verification message to this contact."
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
