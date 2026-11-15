// UC-3 Request Animal Transfer (FR-7–9).
// Staff at a shelter near capacity pick one of their dogs and a receiving shelter
// with open kennels, then send a transfer request. States: form, validation error, sent.
import { Badge, Banner, Button, CapacityBar, Card, Input, PageShell, Select, Table } from '../../components/ui';
import { dogs, transfers } from '../../mock/dogs.js';
import { availableKennels, capacityStatus, myShelterId, shelters, statusLabel } from '../../mock/shelters.js';

export const meta = {
  uc: 'UC-3',
  title: 'Request Animal Transfer',
  owner: 'Joshua',
  screen: 'Animal Matching & Transfer Requests',
  states: ['default', 'error', 'sent'],
};

const myDogs = dogs.filter((d) => d.id.startsWith('D-10'));
const destinations = shelters.filter((s) => s.id !== myShelterId);
const byId = (id) => shelters.find((s) => s.id === id);
const dogById = (id) => dogs.find((d) => d.id === id);

function DogSummary({ dog }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-line bg-canvas p-3 text-sm">
      <dt className="text-muted">Dog ID</dt><dd>{dog.id}</dd>
      <dt className="text-muted">Breed</dt><dd>{dog.breed}</dd>
      <dt className="text-muted">Size</dt><dd className="capitalize">{dog.size}</dd>
      <dt className="text-muted">Medical needs</dt><dd>{dog.medical}</dd>
      <dt className="text-muted">Risk</dt>
      <dd>{dog.highRisk ? <Badge tone="full">High risk</Badge> : <Badge>Standard</Badge>}</dd>
    </dl>
  );
}

function ShelterSummary({ shelter, sizeError }) {
  const status = capacityStatus(shelter.dogsHoused, shelter.totalCapacity);
  return (
    <div className="space-y-3 rounded-md border border-line bg-canvas p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{shelter.name}</span>
        <Badge tone={status}>{statusLabel[status]}</Badge>
      </div>
      <CapacityBar occupied={shelter.dogsHoused} total={shelter.totalCapacity} />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt className="text-muted">Available kennels</dt><dd>{availableKennels(shelter)}</dd>
        <dt className="text-muted">Distance</dt><dd>{shelter.distanceMi} mi</dd>
        <dt className="text-muted">Accepts sizes</dt>
        <dd className={`capitalize ${sizeError ? 'font-semibold' : ''}`}>{shelter.sizes.join(', ')}</dd>
        <dt className="text-muted">Last updated</dt><dd>{shelter.lastUpdated}</dd>
      </dl>
    </div>
  );
}

function RequestForm({ error }) {
  const dog = dogs[0]; // Biscuit, large, high risk
  const dest = byId(error ? 'plano' : 'collin');
  return (
    <>
      {error && (
        <Banner tone="alert" title="Transfer request could not be sent.">
          Fix the highlighted fields and try again.
        </Banner>
      )}
      <div className="grid grid-cols-2 gap-6">
        <Card title="1. Animal">
          <div className="space-y-4">
            <Select label="Dog to transfer" options={myDogs.map((d) => `${d.name} (${d.id})`)} defaultValue={`${dog.name} (${dog.id})`} />
            <DogSummary dog={dog} />
          </div>
        </Card>
        <Card title="2. Receiving shelter">
          <div className="space-y-4">
            <Select
              label="Receiving shelter"
              options={destinations.map((s) => s.name)}
              defaultValue={dest.name}
              hint="Only participating shelters are listed."
              error={error ? 'Plano Animal Services does not accept large dogs.' : undefined}
            />
            <ShelterSummary shelter={dest} sizeError={error} />
          </div>
        </Card>
      </div>
      <Card title="3. Request details">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Reason for transfer"
            placeholder="e.g. Shelter at capacity, dog flagged high risk"
            defaultValue={error ? '' : 'Richardson is at 97% capacity; Biscuit is flagged high risk.'}
            error={error ? 'Reason for transfer is required.' : undefined}
          />
          <Input label="Requested transfer date" type="date" defaultValue="2026-11-06" />
          <Select label="Priority" options={['High', 'Medium', 'Low']} defaultValue="High" hint="High priority alerts the receiving shelter right away." />
          <Input label="Notes for receiving shelter (optional)" placeholder="Temperament, feeding, transport…" />
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button>Send Request</Button>
      </div>
    </>
  );
}

function Sent() {
  const rows = transfers
    .filter((t) => t.from === myShelterId)
    .map((t) => ({ ...t, dog: dogById(t.dogId), toName: byId(t.to).name }));
  return (
    <>
      <Banner tone="success" title="Transfer request sent." action={<Button variant="secondary" size="sm">View request</Button>}>
        Collin County Animal Services has been notified. Request T-301 for Biscuit (D-1042) is <b>Pending</b> until they respond.
      </Banner>
      <Card title="My transfer requests">
        <Table
          columns={[
            { key: 'id', header: 'Request' },
            { key: 'dog', header: 'Dog', render: (r) => `${r.dog.name} (${r.dog.id})` },
            { key: 'toName', header: 'Receiving shelter' },
            { key: 'requested', header: 'Requested' },
            { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Pending' ? 'outdated' : 'neutral'}>{r.status}</Badge> },
            { key: 'action', header: '', align: 'right', render: (r) => (r.status === 'Pending' ? <Button variant="ghost" size="sm">Cancel request</Button> : null) },
          ]}
          rows={rows}
        />
      </Card>
    </>
  );
}

export default function RequestTransfer({ state }) {
  return (
    <PageShell
      nav="My Dogs"
      title="Request Animal Transfer"
      subtitle="Send a dog to a participating shelter with open kennels."
    >
      {state === 'sent' ? <Sent /> : <RequestForm error={state === 'error'} />}
    </PageShell>
  );
}
