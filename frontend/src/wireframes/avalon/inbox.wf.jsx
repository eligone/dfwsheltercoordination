// Alerts & Notifications inbox (opened from the bell in the NavBar).
// Owner folder: avalon. Mock data only, no logic.
import { Badge, Banner, Button, Card, Select, Tabs, Modal, PageShell } from '../../components/ui';
import { alerts } from '../../mock/dogs';
import { shelters } from '../../mock/shelters';

export const meta = {
  uc: 'FR-17–31',
  title: 'Alerts Inbox',
  owner: 'Avalon',
  screen: 'Alerts / Notifications',
  states: ['default', 'unread-filter', 'detail', 'empty'],
  width: 1024,
};

const tone = { high: 'full', medium: 'near', low: 'open' };
const shelterName = (id) => shelters.find((s) => s.id === id)?.name ?? id;

function AlertRow({ a }) {
  return (
    <li className={`flex items-start gap-4 border-t border-line px-4 py-3 first:border-t-0 ${a.read ? 'bg-surface' : 'bg-canvas'}`}>
      <span
        aria-label={a.read ? 'Read' : 'Unread'}
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border ${a.read ? 'border-line bg-surface' : 'border-status-full bg-status-full'}`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${a.read ? '' : 'font-semibold'}`}>{a.title}</p>
        <p className="text-xs text-muted">
          {shelterName(a.from)} · {a.time}
        </p>
      </div>
      <Badge tone={tone[a.priority]}>{a.priority[0].toUpperCase() + a.priority.slice(1)}</Badge>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">View</Button>
        <Button variant="ghost" size="sm">{a.read ? 'Mark as unread' : 'Mark as read'}</Button>
      </div>
    </li>
  );
}

export default function AlertsInbox({ state }) {
  const empty = state === 'empty';
  const unreadOnly = state === 'unread-filter';
  const rows = empty ? [] : unreadOnly ? alerts.filter((a) => !a.read) : alerts;
  const unreadCount = alerts.filter((a) => !a.read).length;
  const detail = alerts[0];

  return (
    <div className="relative min-h-[640px]">
      <PageShell
        nav="Alerts"
        unread={empty ? 0 : unreadCount}
        title="Alerts"
        subtitle={empty ? undefined : `${unreadCount} unread`}
        actions={<Button variant="secondary" disabled={empty}>Mark all as read</Button>}
      >
        {!empty && !unreadOnly && (
          <Banner tone="alert" title="1 high-priority alert needs a response" action={<Button size="sm">View</Button>}>
            Match found for Biscuit (D-1042) at Collin County Animal Services.
          </Banner>
        )}

        <Tabs items={['All', 'Unread', 'High priority']} active={unreadOnly ? 'Unread' : 'All'} />

        <div className="flex items-end gap-3">
          <div className="w-48"><Select label="Priority" options={['All priorities', 'High', 'Medium', 'Low']} /></div>
          <div className="w-64"><Select label="Shelter" options={['All shelters', ...shelters.map((s) => s.name)]} /></div>
        </div>

        <Card>
          {rows.length > 0 ? (
            <ul className="-m-4">
              {rows.map((a) => <AlertRow key={a.id} a={a} />)}
            </ul>
          ) : (
            <div className="py-10 text-center">
              <p className="font-semibold">No notifications</p>
              <p className="text-sm text-muted">You're all caught up. New alerts will appear here.</p>
            </div>
          )}
        </Card>

        {rows.length > 0 && <p className="text-center text-sm text-muted">Showing {rows.length} of {alerts.length} alerts</p>}
      </PageShell>

      {state === 'detail' && (
        <Modal
          title={detail.title}
          footer={
            <>
              <Button variant="secondary">Close</Button>
              <Button variant="secondary">Mark as read</Button>
              <Button>View match</Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone="full">High</Badge>
              <span className="text-muted">{detail.time}</span>
            </div>
            <p><span className="font-semibold">From:</span> {shelterName(detail.from)}</p>
            <p className="text-muted">
              Collin County Animal Services has 40 available kennels and can take a large dog with a medical need.
            </p>
            <p><span className="font-semibold">Contact:</span> (972) 555-0103 · staff@collin.example</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
