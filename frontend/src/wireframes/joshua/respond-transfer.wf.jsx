// UC-4 Respond to Transfer (FR-10–11).
// The receiving shelter opens an incoming request (from the bell alert), checks its own
// capacity, and accepts or declines. Declining asks for a reason. Accepting shares contact info.
import { Badge, Banner, Button, CapacityBar, Card, Input, Modal, PageShell, Select } from '../../components/ui';
import { dogs, incomingTransfer as request } from '../../mock/dogs.js';
import { availableKennels, shelters } from '../../mock/shelters.js';

export const meta = {
  uc: 'UC-4',
  title: 'Respond to Transfer',
  owner: 'Joshua',
  screen: 'Animal Matching & Transfer Requests',
  states: ['default', 'decline', 'accepted'],
};

const dog = dogs.find((d) => d.id === request.dogId);
const from = shelters.find((s) => s.id === request.from);
const me = shelters.find((s) => s.id === request.to);

const Row = ({ label, children }) => (
  <>
    <dt className="text-muted">{label}</dt>
    <dd>{children}</dd>
  </>
);

function RequestDetails({ status }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Card title={`Request ${request.id}`} className="col-span-2" actions={<Badge tone={status === 'Pending' ? 'outdated' : 'neutral'}>{status}</Badge>}>
        <div className="space-y-4">
          <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <Row label="From">{from.name}</Row>
            <Row label="Requested">{request.requested}</Row>
            <Row label="Reason">{request.reason}</Row>
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
        </div>
      </Card>
      <Card title="Your capacity">
        <div className="space-y-3 text-sm">
          <CapacityBar occupied={status === 'Accepted' ? me.dogsHoused + 1 : me.dogsHoused} total={me.totalCapacity} />
          <dl className="grid grid-cols-2 gap-y-1">
            <Row label="Available kennels">{status === 'Accepted' ? availableKennels(me) - 1 : availableKennels(me)}</Row>
            <Row label="Accepts sizes"><span className="capitalize">{me.sizes.join(', ')}</span></Row>
            <Row label="Last updated">{me.lastUpdated}</Row>
          </dl>
          {status === 'Accepted' && <p className="text-muted">1 kennel reserved for {dog.name}.</p>}
        </div>
      </Card>
    </div>
  );
}

function DeclineModal() {
  return (
    <Modal
      title="Decline Transfer Request"
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button>Confirm Decline</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {from.name} will be notified that request {request.id} for {dog.name} was declined.
        </p>
        <Select
          label="Reason for declining"
          options={['No available kennels', 'Cannot meet medical needs', 'Dog size not accepted', 'Other']}
          defaultValue="Cannot meet medical needs"
        />
        <Input label="Message to requesting shelter (optional)" placeholder="e.g. Try Collin County; they have open large-dog kennels." />
      </div>
    </Modal>
  );
}

function Accepted() {
  return (
    <>
      <Banner tone="success" title="Transfer request accepted.">
        {from.name} has been notified. Coordinate pickup with their staff below.
      </Banner>
      <RequestDetails status="Accepted" />
      <Card title="Transfer contact" actions={<Button variant="secondary" size="sm">Mark as Completed</Button>}>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <Row label="Shelter">{from.name}</Row>
          <Row label="Phone">{from.phone}</Row>
          <Row label="Email">{from.email}</Row>
          <Row label="Address">{from.address}</Row>
        </dl>
      </Card>
    </>
  );
}

export default function RespondTransfer({ state }) {
  const pending = state !== 'accepted';
  return (
    <PageShell
      nav="Home"
      unread={pending ? 2 : 1}
      title="Incoming Transfer Request"
      subtitle={`${from.name} wants to transfer ${dog.name} to your shelter.`}
      actions={
        pending && (
          <>
            <Button variant="secondary">Decline</Button>
            <Button>Accept</Button>
          </>
        )
      }
    >
      {state === 'accepted' ? <Accepted /> : <RequestDetails status="Pending" />}
      {state === 'decline' && <DeclineModal />}
    </PageShell>
  );
}
