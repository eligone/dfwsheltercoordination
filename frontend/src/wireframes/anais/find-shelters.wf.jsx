import { Badge, Banner, Button, Card, Placeholder, PageShell, Select, Table } from '../../components/ui';
import { shelters, myShelterId, availableKennels, statusLabel } from '../../mock/shelters';
import { dogs } from '../../mock/dogs';
import { findMatches, matchDog, shelterStatus } from './matching';

export const meta = {
  uc: 'UC-5, UC-6',
  title: 'Find Available Shelters',
  owner: 'Anais',
  screen: 'Animal Matching',
  states: ['default', 'results', 'no-match'],
  width: 1024,
};

const distances = ['Within 5 miles', 'Within 10 miles', 'Within 25 miles', 'Within 50 miles'];

export default function FindShelters({ state }) {
  const shelter = shelters.find((s) => s.id === myShelterId);
  const noMatch = state === 'no-match';
  const maxMiles = noMatch ? 5 : 25;
  const matches = findMatches(matchDog, maxMiles);

  const columns = [
    { key: 'rank', header: '#', render: (s) => matches.indexOf(s) + 1 },
    { key: 'name', header: 'Shelter', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'distanceMi', header: 'Distance', render: (s) => `${s.distanceMi} mi`, align: 'right' },
    { key: 'kennels', header: 'Available kennels', render: (s) => `${availableKennels(s)} of ${s.totalCapacity}`, align: 'right' },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={shelterStatus(s)}>{statusLabel[shelterStatus(s)]}</Badge> },
    { key: 'lastUpdated', header: 'Last updated' },
    { key: 'action', header: '', render: () => <Button size="sm">Request Transfer</Button>, align: 'right' },
  ];

  return (
    <PageShell nav="Home" title="Find Available Shelters" subtitle={shelter.name}>
      <p className="text-sm text-muted">Home / Find Match</p>

      <Card title="Match criteria">
        <div className="grid grid-cols-3 items-end gap-4">
          <Select label="Dog" options={dogs.map((d) => `${d.name} (${d.id})`)} defaultValue={`${matchDog.name} (${matchDog.id})`} />
          <Select label="Dog size" options={['small', 'medium', 'large']} defaultValue={matchDog.size} hint="Filled in from the dog's record." />
          <Select label="Distance" options={distances} defaultValue={`Within ${maxMiles} miles`} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">Medical: {matchDog.medical} · {matchDog.highRisk ? 'High risk' : 'Not high risk'}</p>
          <Button>Find Match</Button>
        </div>
      </Card>

      {state === 'default' && (
        <Card title="Match results">
          <Placeholder label="Choose a dog and select Find Match to see shelters with open kennels" className="h-32" />
        </Card>
      )}

      {state === 'results' && (
        <Card title={`Match results · ${matches.length} shelters`} actions={<Select options={['Sort: Nearest first', 'Sort: Most available kennels']} />}>
          <div className="space-y-3">
            <Table columns={columns} rows={matches} />
            <p className="text-xs text-muted">
              Showing shelters that accept {matchDog.size} dogs and have at least one available kennel. Outdated means the shelter has not updated capacity in 24 hours; call to confirm before requesting.
            </p>
          </div>
        </Card>
      )}

      {noMatch && (
        <Banner tone="alert" title="No matching shelters found." action={<Button variant="secondary" size="sm">Widen search</Button>}>
          No shelter within {maxMiles} miles accepts {matchDog.size} dogs and has an available kennel. Try a larger distance.
        </Banner>
      )}

      <Button variant="ghost">Back to dashboard</Button>
    </PageShell>
  );
}
