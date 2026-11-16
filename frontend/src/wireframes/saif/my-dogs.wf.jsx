import { Badge, Button, Card, PageShell, Table } from '../../components/ui';
import { dogs, transfers } from '../../mock/dogs';
import { shelters } from '../../mock/shelters';

export const meta = {
  uc: 'UC-10',
  title: 'My Dogs’ Transfers',
  owner: 'Saif',
  screen: 'My Dogs',
  states: ['default', 'details', 'empty'],
  width: 1024,
};

export default function MyDogs({ state }) {
  const rows = state === 'empty' ? [] : transfers.map((t) => ({ ...t, dog: dogs.find((d) => d.id === t.dogId), shelter: shelters.find((s) => s.id === t.to) }));
  const columns = [
    { key: 'dog', header: 'Dog', render: (t) => t.dog.name },
    { key: 'breed', header: 'Breed', render: (t) => t.dog.breed },
    { key: 'size', header: 'Size', render: (t) => t.dog.size },
    { key: 'shelter', header: 'Receiving shelter', render: (t) => t.shelter.name },
    { key: 'requested', header: 'Requested (UTC)' },
    { key: 'status', header: 'Transfer status', render: (t) => <Badge tone="neutral">{t.status}</Badge> },
    { key: 'action', header: 'Details', render: () => <Button variant="secondary" size="sm">View details</Button> },
  ];
  const selected = rows[0];
  return <PageShell nav="My Dogs" title="My Dogs’ Transfers" subtitle="Transfer requests sent by your shelter, including completed transfers"
    actions={<><Button variant="secondary">Back to Home</Button><Button variant="secondary">Sign out</Button></>}>
    <p className="text-sm text-muted">Signed in: J. Doe · Richardson Animal Shelter</p>
    <Card title="My shelter’s transfers">
      {rows.length ? <Table columns={columns} rows={rows} /> : <p>No active transfers.</p>}
    </Card>
    {state === 'details' && <Card title={`Transfer details — ${selected.dog.name}`} actions={<Button variant="secondary">Close details</Button>}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-muted">Request</dt><dd>{selected.id}</dd></div>
        <div><dt className="text-muted">Dog</dt><dd>{selected.dog.name} · {selected.dog.breed} · {selected.dog.size}</dd></div>
        <div><dt className="text-muted">Receiving shelter</dt><dd>{selected.shelter.name}</dd></div>
        <div><dt className="text-muted">Requested (UTC)</dt><dd>{selected.requested}</dd></div>
        <div><dt className="text-muted">Transfer status</dt><dd>{selected.status}</dd></div>
        <div><dt className="text-muted">Receiving shelter phone</dt><dd>{selected.shelter.phone}</dd></div>
        <div><dt className="text-muted">Receiving shelter email</dt><dd>{selected.shelter.email}</dd></div>
      </dl>
    </Card>}
  </PageShell>;
}
