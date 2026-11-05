import { Banner, Button, Card, Input, Modal, PageShell, CapacityBar } from '../../components/ui';
import { shelters, myShelterId, availableKennels } from '../../mock/shelters';

export const meta = {
  uc: 'UC-1',
  title: 'Update Capacity',
  owner: 'Hoang',
  screen: 'Capacity Update',
  states: ['default', 'confirm', 'invalid', 'success', 'save-error'],
  width: 1024,
};

export default function UpdateCapacity({ state }) {
  const shelter = shelters.find((s) => s.id === myShelterId);
  const saved = state === 'success';
  const available = saved ? 8 : availableKennels(shelter);
  return (
    <PageShell nav="Home" title="Update Shelter Capacity" subtitle={shelter.name}>
      {saved && <Banner tone="success" title="Capacity updated successfully.">Available kennels: 8 · Updated Nov 4, 2026, 10:00 AM. The dashboard now shows the updated capacity.</Banner>}
      {state === 'save-error' && <Banner tone="alert" title="Unable to save changes.">Your capacity has not changed. Please try again.</Banner>}
      <Card title="Current capacity">
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div><p className="text-sm text-muted">Dogs housed</p><p className="text-2xl font-bold">{shelter.totalCapacity - available}</p></div>
          <div><p className="text-sm text-muted">Available kennels</p><p className="text-2xl font-bold">{available}</p></div>
          <div><p className="text-sm text-muted">Total capacity</p><p className="text-2xl font-bold">{shelter.totalCapacity}</p></div>
        </div>
        <CapacityBar occupied={shelter.totalCapacity - available} total={shelter.totalCapacity} />
        <p className="text-xs text-muted mt-3">Last updated: {saved ? '2026-11-04 10:00' : shelter.lastUpdated} · Sample data</p>
      </Card>
      <Card title="Edit available kennels">
        <div className="space-y-4 max-w-lg">
          <Input label="Available kennels" type="number" min="0" max={shelter.totalCapacity} defaultValue={state === 'invalid' ? 65 : 8} error={state === 'invalid' ? 'Enter a whole number between 0 and 60.' : undefined} hint="Enter the number of kennels currently available. Total capacity is 60." />
          <p className="text-sm text-muted">Changes are recorded in Capacity History with your name and the update time.</p>
          <div className="flex gap-3"><Button>Save changes</Button><Button variant="secondary">Cancel</Button></div>
        </div>
      </Card>
      <Button variant="ghost">Back to dashboard</Button>
      {state === 'confirm' && <Modal title="Confirm capacity update" footer={<><Button variant="secondary">Cancel</Button><Button>Confirm</Button></>}>
        <div className="space-y-3"><p>Update available kennels for {shelter.name}?</p><p className="font-semibold">{availableKennels(shelter)} → 8 available kennels</p><p className="text-sm text-muted">Total capacity remains 60. This change will be saved in Capacity History.</p></div>
      </Modal>}
    </PageShell>
  );
}
