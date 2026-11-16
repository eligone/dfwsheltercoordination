/**
 * UC-10 / FR-36: own-shelter transfer list, authorized details and event-driven updates.
 * Owner: Saif Yusuff. Transfer creation and state transitions remain in the shared service.
 */
import { useEffect, useReducer, useState } from 'react';
import { Badge, Button, Card, Table } from '../../components/ui';

const timestamp = (date) => date ? date.toISOString().slice(0, 16).replace('T', ' ') : 'Not available';

export default function MyDogsTransfers({ app, initialRequestID = null }) {
  const [selected, setSelected] = useState(initialRequestID);
  const [, update] = useReducer((n) => n + 1, 0);
  // Re-read authorized service views after each change, including the open details card.
  useEffect(() => app.events.on('transfer-changed', () => update()), [app]);

  let list;
  try { list = app.transfers.listMyDogs(); }
  catch (error) { return <p role="alert">{error.message}</p>; }

  let details = null;
  let detailsError = null;
  if (selected) {
    try { details = app.transfers.getMyDogTransfer(selected); }
    catch (error) { detailsError = error.message; }
  }
  const columns = [
    { key: 'dogName', header: 'Dog' },
    { key: 'breed', header: 'Breed' },
    { key: 'size', header: 'Size' },
    { key: 'toShelterName', header: 'Receiving shelter', render: (row) => row.toShelterName ?? 'Not assigned' },
    { key: 'requestedAt', header: 'Requested (UTC)', render: (row) => timestamp(row.requestedAt) },
    { key: 'status', header: 'Transfer status', render: (row) => <Badge tone="neutral">{row.status}</Badge> },
    { key: 'details', header: 'Details', render: (row) => <Button variant="secondary" size="sm" onClick={() => setSelected(row.requestID)} aria-label={`View ${row.dogName} transfer details`}>View details</Button> },
  ];

  return <>
    <Card title="My shelter’s transfers">
      {list.rows.length ? <div className="overflow-x-auto"><Table columns={columns} rows={list.rows} rowKey="requestID" /></div> : <p role="status">No active transfers.</p>}
    </Card>
    {detailsError && <div className="space-y-3"><p role="alert">{detailsError}</p><Button variant="secondary" onClick={() => setSelected(null)}>Close details</Button></div>}
    {details && <section aria-label={`Transfer details for ${details.dogName}`}>
      <Card title={`Transfer details — ${details.dogName}`} actions={<Button variant="secondary" onClick={() => setSelected(null)}>Close details</Button>}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Request</dt><dd>{details.requestID}</dd></div>
          <div><dt className="text-muted">Dog</dt><dd>{details.dogName} · {details.breed} · {details.size}</dd></div>
          <div><dt className="text-muted">Receiving shelter</dt><dd>{details.toShelterName ?? 'Not assigned'}</dd></div>
          <div><dt className="text-muted">Requested (UTC)</dt><dd>{timestamp(details.requestedAt)}</dd></div>
          <div><dt className="text-muted">Transfer status</dt><dd aria-live="polite">{details.status}</dd></div>
          <div><dt className="text-muted">Receiving shelter phone</dt><dd>{details.receivingContact?.phone ?? 'Not available'}</dd></div>
          <div><dt className="text-muted">Receiving shelter email</dt><dd>{details.receivingContact?.email ?? 'Not available'}</dd></div>
        </dl>
      </Card>
    </section>}
  </>;
}
