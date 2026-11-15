/**
 * RespondTransfer.jsx - the UC-4 Respond to Transfer screen (receiving shelter).
 * Purpose: staff see the transfer requests sent to their shelter, open one (from its alert), check the dog,
 * the sending shelter, the distance and match score and their own capacity, then Accept, Decline (with a
 * reason) or Mark as Completed. Every rule (who may answer, legal status changes, kennel counts, alerts,
 * audit record) is in services/transferService.js (FR-7, FR-11, FR-19, FR-20); the screen shows the result
 * or the service's message ("This shelter no longer has space.", "Accept the request first.", ...).
 * Owner: Joshua Nakka. AI-assisted draft (Claude); reviewed and explained by the owner.
 */
import { useState } from 'react';
import { Badge, Banner, Button, CapacityBar, Card, Input, Modal, Table } from '../../components/ui';
import { scoreShelter } from '../../services/matchEngine.js';

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '');
const round = (n) => Number(n.toFixed(4));
const statusTone = (s) => (s === 'Pending' ? 'outdated' : 'neutral');

const Row = ({ label, children }) => (
  <>
    <dt className="text-muted">{label}</dt>
    <dd>{children}</dd>
  </>
);

/** @param app the shared services from createApp() (staff of the receiving shelter signed in) */
export default function RespondTransfer({ app }) {
  const staff = app.auth.currentStaff();
  const [openId, setOpenId] = useState(null);
  const [match, setMatch] = useState(null); // { distance, score } worked out when the request is opened
  const [notice, setNotice] = useState(null); // { tone, title, body }
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  if (!staff) return <Banner tone="alert" title="Please sign in." />;
  const shelterOf = (id) => app.state.shelters.find((s) => s.id === id);
  const me = shelterOf(staff.shelterID);
  const myAvailable = me.totalCapacity - me.dogsHoused;

  // Requests this shelter was alerted about (or accepted). Read-only view of the shared state.
  const incoming = app.state.transfers
    .filter((t) => t.toShelterID === me.id || t.alertedTo.includes(me.id))
    .sort((a, b) => b.requestedAt - a.requestedAt);
  const myStatus = (t) => (t.responses[me.id]?.status === 'Declined' && t.status === 'Pending' ? 'Declined' : t.status);

  /** Opening a request opens its alert (marks it read, FR-25/FR-26) and works out distance and score. */
  async function open(t) {
    setNotice(null); setDeclining(false); setReason(''); setMatch(null);
    const alert = app.state.alerts.find((a) => a.transferRequestID === t.id && a.recipientShelterID === me.id && !a.cancelled);
    if (alert) app.alerts.openAlert(alert.id);
    setOpenId(t.id);
    try {
      const distance = await app.mapping.getDistance(shelterOf(t.fromShelterID), me);
      setMatch({ distance, score: scoreShelter({ distanceMi: distance, openSpaces: me.totalCapacity - me.dogsHoused, sizeFit: 1 }) });
    } catch {
      setMatch({ distance: null, score: null });
    }
  }

  function run(action) {
    try {
      const msg = action();
      setNotice(msg);
    } catch (err) {
      setNotice({ tone: 'alert', title: err.message });
    }
    refresh();
  }

  const accept = (t) => run(() => {
    app.transfers.accept(t.id);
    return { tone: 'success', title: 'Transfer request accepted.', body: `${shelterOf(t.fromShelterID).name} has been notified. Coordinate pickup with their staff below.` };
  });
  const confirmDecline = (t) => {
    run(() => {
      const { offeredTo, request } = app.transfers.decline(t.id, reason.trim());
      const next = offeredTo ? `${shelterOf(offeredTo).name} has been alerted next.` : request.status === 'Declined' ? 'No other shelters are left, so the request is now Declined.' : '';
      return { tone: 'success', title: 'Transfer request declined.', body: `${shelterOf(t.fromShelterID).name} has been notified. ${next}` };
    });
    setDeclining(false); setReason('');
  };
  const complete = (t) => run(() => {
    app.transfers.complete(t.id);
    const from = shelterOf(t.fromShelterID);
    return { tone: 'success', title: 'Transfer marked as completed.', body: `${from.name} now has ${from.totalCapacity - from.dogsHoused} available kennels.` };
  });

  const t = incoming.find((x) => x.id === openId) ?? null;
  const dog = t ? app.state.dogs.find((d) => d.id === t.dogId) : null;
  const from = t ? shelterOf(t.fromShelterID) : null;
  const acceptedByMe = t && t.toShelterID === me.id && ['Accepted', 'Completed'].includes(t.status);

  return (
    <div className="relative space-y-6">
      <Card title="Incoming transfer requests">
        {incoming.length === 0 ? <p className="text-sm text-muted">No transfer requests have been sent to your shelter.</p> : (
          <Table
            columns={[
              { key: 'id', header: 'Request' },
              { key: 'dog', header: 'Dog', render: (r) => { const d = app.state.dogs.find((x) => x.id === r.dogId); return `${d.name} (${d.id})`; } },
              { key: 'from', header: 'From', render: (r) => shelterOf(r.fromShelterID).name },
              { key: 'requestedAt', header: 'Requested', render: (r) => fmt(r.requestedAt) },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(myStatus(r))}>{myStatus(r)}</Badge> },
              { key: 'action', header: '', align: 'right', render: (r) => <Button variant={r.id === openId ? 'primary' : 'secondary'} size="sm" onClick={() => open(r)}>{r.id === openId ? 'Opened' : 'Open'}</Button> },
            ]}
            rows={incoming}
          />
        )}
      </Card>

      {notice && <Banner tone={notice.tone} title={notice.title}>{notice.body}</Banner>}

      {t && (
        <>
          <div className="grid grid-cols-3 gap-6">
            <Card title={`Request ${t.id}`} className="col-span-2" actions={<Badge tone={statusTone(myStatus(t))}>{myStatus(t)}</Badge>}>
              <div className="space-y-4">
                <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
                  <Row label="From">{from.name}</Row>
                  <Row label="Requested">{fmt(t.requestedAt)}</Row>
                  <Row label="Urgency">{t.urgency === 'HIGH' ? 'High' : 'Normal'}</Row>
                  <Row label="Distance">{match ? (match.distance == null ? 'Not available' : `${match.distance} mi`) : '…'}</Row>
                  <Row label="Match score">{match ? (match.score == null ? 'Not available' : round(match.score)) : '…'}</Row>
                  {t.notes && <Row label="Notes">{t.notes}</Row>}
                  {t.responses[me.id]?.reason && <Row label="Your decline reason">{t.responses[me.id].reason}</Row>}
                </dl>
                <div className="rounded-md border border-line bg-canvas p-3">
                  <p className="mb-2 text-sm font-semibold">Animal</p>
                  <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
                    <Row label="Dog">{dog.name} ({dog.id})</Row>
                    <Row label="Breed">{dog.breed}</Row>
                    <Row label="Size"><span className="capitalize">{dog.size}</span></Row>
                    <Row label="Medical needs">{dog.medical}</Row>
                    <Row label="Risk">{dog.highRisk ? <Badge tone="full">High risk</Badge> : <Badge>Standard</Badge>}</Row>
                  </dl>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => { setNotice(null); setDeclining(true); }}>Decline</Button>
                  <Button onClick={() => accept(t)}>Accept</Button>
                  <Button variant="secondary" onClick={() => complete(t)}>Mark as Completed</Button>
                </div>
              </div>
            </Card>
            <Card title="Your capacity">
              <div className="space-y-3 text-sm">
                <CapacityBar occupied={me.dogsHoused} total={me.totalCapacity} />
                <dl className="grid grid-cols-2 gap-y-1">
                  <Row label="Available kennels"><span data-testid="my-available">{myAvailable}</span></Row>
                  <Row label="Accepts sizes"><span className="capitalize">{me.acceptedSizes.join(', ')}</span></Row>
                  <Row label="Last updated">{fmt(me.lastUpdated)}</Row>
                </dl>
              </div>
            </Card>
          </div>

          {acceptedByMe && (
            <Card title="Transfer contact">
              <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
                <Row label="Shelter">{from.name}</Row>
                <Row label="Phone">{from.phone}</Row>
                <Row label="Email">{from.email}</Row>
                <Row label="Address">{from.address}</Row>
                <Row label="Their available kennels">{from.totalCapacity - from.dogsHoused}</Row>
              </dl>
            </Card>
          )}
        </>
      )}

      {declining && t && (
        <Modal
          title="Decline Transfer Request"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setDeclining(false); setReason(''); }}>Cancel</Button>
              <Button onClick={() => confirmDecline(t)}>Confirm Decline</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">{from.name} will be notified that request {t.id} for {dog.name} was declined.</p>
            <Input label="Reason for declining" aria-label="Reason for declining" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. No medical staff on site" />
          </div>
        </Modal>
      )}
    </div>
  );
}
