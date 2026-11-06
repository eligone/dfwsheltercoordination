import { Badge, Banner, Button, Card, Input, PageShell } from '../../components/ui';
import { shelters, myShelterId, availableKennels, statusLabel } from '../../mock/shelters';
import { findMatches, matchDog, shelterStatus } from './matching';

export const meta = {
  uc: 'UC-7',
  title: 'Request Dog Transfer',
  owner: 'Anais',
  screen: 'Animal Matching & Transfer Requests',
  states: ['default', 'sent', 'unavailable', 'send-error'],
  width: 1024,
};

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-t border-line py-2 text-sm first:border-t-0">
    <span className="text-muted">{label}</span>
    <span className="text-right font-medium">{children}</span>
  </div>
);

export default function RequestTransfer({ state }) {
  const from = shelters.find((s) => s.id === myShelterId);
  const to = findMatches(matchDog, 25)[0]; // the top match from UC-6
  const sent = state === 'sent';
  const status = shelterStatus(to);

  return (
    <PageShell nav="Home" title="Request Dog Transfer" subtitle={from.name}>
      <p className="text-sm text-muted">Home / Find Match / Request Transfer</p>

      {sent && (
        <Banner tone="success" title="Transfer request sent.">
          Request T-303 for {matchDog.name} is <Badge>Pending</Badge>. You will be notified when {to.name} responds.
        </Banner>
      )}
      {state === 'unavailable' && (
        <Banner tone="alert" title="This shelter no longer has available kennels." action={<Button variant="secondary" size="sm">Back to match results</Button>}>
          {to.name} updated its capacity after you searched. Your request was not sent.
        </Banner>
      )}
      {state === 'send-error' && (
        <Banner tone="alert" title="Unable to send request.">Your request was not sent. Please try again.</Banner>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card title="Dog">
          <Row label="Name">{matchDog.name} ({matchDog.id})</Row>
          <Row label="Breed">{matchDog.breed}</Row>
          <Row label="Size">{matchDog.size}</Row>
          <Row label="Medical needs">{matchDog.medical}</Row>
          <Row label="Risk">{matchDog.highRisk ? <Badge tone="full">High risk</Badge> : 'Not high risk'}</Row>
        </Card>
        <Card title="Receiving shelter">
          <Row label="Shelter">{to.name}</Row>
          <Row label="Distance">{to.distanceMi} mi</Row>
          <Row label="Available kennels">{state === 'unavailable' ? 0 : availableKennels(to)} of {to.totalCapacity}</Row>
          <Row label="Status">{state === 'unavailable' ? <Badge tone="full">Full</Badge> : <Badge tone={status}>{statusLabel[status]}</Badge>}</Row>
          <Row label="Contact">{to.phone} · {to.email}</Row>
        </Card>
      </div>

      <Card title="Request details">
        <div className="max-w-lg space-y-4">
          <Input label="Message to receiving shelter (optional)" defaultValue={sent ? 'Duke needs daily meds; we can send a 2-week supply.' : ''} placeholder="Notes about the dog, pickup, or medical needs" disabled={sent} />
          <p className="text-sm text-muted">The receiving shelter can accept or decline. Both shelters get a notification when the status changes.</p>
          <div className="flex gap-3">
            {sent ? <Button variant="secondary">View my requests</Button> : <><Button disabled={state === 'unavailable'}>Send Request</Button><Button variant="secondary">Cancel</Button></>}
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
