/**
 * AlertsInbox.jsx - the UC-14 View Alerts Inbox screen (opened from the bell).
 * Purpose: staff see their shelter's alerts with read/unread dots, priority badges and the unread count, filter by
 * priority or unread, open an alert (dog information, sender contact, past outcomes) and mark alerts read or unread
 * (FR-17, FR-21, FR-22, FR-25 to FR-31, NFR-10). This screen holds no business rules: sorting, filtering, the unread
 * count, the high-risk priority and the "own shelter only" check all happen in services/alertService.js.
 * Owner: Avalon Austin. AI-assisted draft; the owner reviews and explains it.
 */
import { useEffect, useState } from 'react';
import { Badge, Banner, Button, Card, PageShell, Select } from '../../components/ui';
import { MESSAGES } from '../../services/messages.js';

const TONE = { high: 'full', medium: 'near', low: 'open' }; // Badge tones for High / Medium / Low
const PRIORITY_OPTIONS = ['All priorities', 'High', 'Medium', 'Low'];
const TABS = ['All', 'Unread'];

/** Mock and service dates are UTC; show them the same way in every time zone. */
export const formatTime = (d) => (d ? `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC` : '');

function AlertRow({ a, onView, onToggleRead }) {
  return (
    <li className={`flex items-start gap-4 border-t border-line px-4 py-3 first:border-t-0 ${a.read ? 'bg-surface' : 'bg-canvas'}`}>
      <span
        role="img"
        aria-label={a.read ? 'Read' : 'Unread'}
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border ${a.read ? 'border-line bg-surface' : 'border-status-full bg-status-full'}`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${a.read ? '' : 'font-semibold'}`}>{a.message}</p>
        <p className="text-xs text-muted">{[a.senderName, formatTime(a.createdAt)].filter(Boolean).join(' · ')}</p>
      </div>
      <Badge tone={TONE[a.priority]}>{a.priorityLabel}</Badge>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" aria-label={`View ${a.message}`} onClick={() => onView(a.id)}>View</Button>
        <Button variant="ghost" size="sm" aria-label={`${a.read ? 'Mark as unread' : 'Mark as read'}: ${a.message}`} onClick={() => onToggleRead(a)}>
          {a.read ? 'Mark as unread' : 'Mark as read'}
        </Button>
      </div>
    </li>
  );
}

function Detail({ details, onClose, onOpenTransfer }) {
  const { alert, dog, sender, outcome, incomingRequestID } = details;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={alert.message} className="fixed inset-0 z-20">
      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto bg-ink/40 p-6">
        <div className="w-full max-w-lg rounded-lg border border-line bg-surface shadow-lg">
          <header className="border-b border-line px-5 py-3 font-semibold">{alert.message}</header>
          <div className="space-y-3 p-5 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone={TONE[alert.priority]}>{alert.priorityLabel}</Badge>
              <span className="text-muted">{formatTime(alert.createdAt)}</span>
            </div>
            {sender && (
              <>
                <p><span className="font-semibold">From:</span> {sender.name}</p>
                <p><span className="font-semibold">Contact:</span> {sender.phone && sender.email ? `${sender.phone} · ${sender.email}` : MESSAGES.NOT_AVAILABLE}</p>
              </>
            )}
            {dog && (
              <p>
                <span className="font-semibold">Dog:</span> {dog.name} ({dog.id}) · {dog.breed} · {dog.size}
                <br /><span className="text-muted">Medical: {dog.medical}{dog.highRisk ? ' · High risk' : ''}</span>
              </p>
            )}
            {outcome ? (
              <div>
                <p><span className="font-semibold">Request {outcome.requestID}:</span> {outcome.status}</p>
                <ul className="mt-1 text-muted">
                  {outcome.history.map((h) => <li key={h.entryID}>{h.action} · {h.outcome} · {formatTime(h.timestamp)}</li>)}
                </ul>
              </div>
            ) : (
              <p className="text-muted">No transfer request is linked to this alert.</p>
            )}
          </div>
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">
            {onOpenTransfer && incomingRequestID && <Button onClick={() => onOpenTransfer(incomingRequestID)}>Open transfer request</Button>}
            <Button variant="secondary" autoFocus onClick={onClose}>Close</Button>
          </footer>
        </div>
      </div>
    </div>
  );
}

/**
 * @param app       the shared services from createApp()
 * @param onChange  called after anything that changes the unread count, so the shell can refresh the bell badge
 * @param onBack    "Back to Home"
 */
export default function AlertsInbox({ app, onChange = () => {}, onBack, onOpenTransfer }) {
  const [priority, setPriority] = useState('All priorities');
  const [tab, setTab] = useState('All');
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [, setVersion] = useState(0); // bumped after each service call so the list is read again

  let inbox;
  let authError = null;
  try {
    inbox = app.alerts.getInbox({ priority: priority === 'All priorities' ? null : priority.toLowerCase(), unreadOnly: tab === 'Unread' });
  } catch (e) { authError = e.message; }

  if (authError) {
    return <PageShell nav="Alerts" title="Alerts"><Banner tone="alert" title={authError} /></PageShell>;
  }

  const refresh = () => { setVersion((v) => v + 1); onChange(); };
  /** Runs one service call; a refusal (for example another shelter's alert) is shown as a message, never thrown at the user. */
  const run = (fn) => {
    setError(null);
    try { fn(); refresh(); } catch (e) { setError(e.message); }
  };
  const open = (id) => run(() => setDetails(app.alerts.openAlert(id)));

  // The banner counts every unread High alert, whatever filter is on, so it never hides a response that is needed.
  const urgent = app.alerts.getInbox({ priority: 'high', unreadOnly: true }).alerts;
  const total = app.alerts.getInbox().alerts.length;

  return (
    <PageShell
      nav="Alerts"
      unread={inbox.unreadCount}
      title="Alerts"
      subtitle={inbox.isEmpty ? undefined : `${inbox.unreadCount} unread`}
      actions={
        <>
          {onBack && <Button variant="secondary" onClick={onBack}>Back to Home</Button>}
          <Button variant="secondary" disabled={inbox.isEmpty} onClick={() => run(() => app.alerts.markAllRead())}>Mark all as read</Button>
        </>
      }
    >
      {error && <Banner tone="alert" title={error} />}
      {urgent.length > 0 && (
        <Banner
          tone="alert"
          title={`${urgent.length} high-priority ${urgent.length === 1 ? 'alert needs' : 'alerts need'} a response`}
          action={<Button size="sm" onClick={() => open(urgent[0].id)}>View</Button>}
        >
          {urgent[0].message}
        </Banner>
      )}

      <div role="tablist" aria-label="Show" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t} type="button" role="tab" aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm ${tab === t ? 'border-b-2 border-accent font-semibold' : 'text-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="w-48">
        <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value)} />
      </div>

      <Card>
        {inbox.isEmpty ? (
          <div className="py-10 text-center">
            <p className="font-semibold">{inbox.emptyTitle}</p>
            <p className="text-sm text-muted">{inbox.emptyHint}</p>
          </div>
        ) : inbox.alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No alerts match this filter.</p>
        ) : (
          <ul aria-label="Alert list" className="-m-4">
            {inbox.alerts.map((a) => (
              <AlertRow
                key={a.id} a={a} onView={open}
                onToggleRead={(x) => run(() => (x.read ? app.alerts.markUnread(x.id) : app.alerts.markRead(x.id)))}
              />
            ))}
          </ul>
        )}
      </Card>
      {!inbox.isEmpty && <p className="text-center text-sm text-muted">Showing {inbox.alerts.length} of {total} alerts</p>}

      {details && <Detail details={details} onClose={() => setDetails(null)} onOpenTransfer={onOpenTransfer} />}
    </PageShell>
  );
}
