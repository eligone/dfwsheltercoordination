import { Badge, Button, Card, PageShell, Table } from '../../components/ui';
import { shelters, availableKennels, capacityStatus, statusLabel } from '../../mock/shelters';

export const meta = {
  uc: 'UC-8',
  title: 'Shared Dashboard',
  owner: 'Saif',
  screen: 'Home',
  states: ['default', 'outdated', 'empty'],
  width: 1024,
};

export default function SharedDashboard({ state }) {
  const rows = state === 'empty' ? [] : shelters;
  const columns = [
    { key: 'name', header: 'Shelter' },
    { key: 'dogsHoused', header: 'Dogs housed', align: 'right' },
    { key: 'totalCapacity', header: 'Total kennels', align: 'right' },
    { key: 'available', header: 'Available kennels', align: 'right', render: availableKennels },
    { key: 'status', header: 'Status', render: (s) => {
      const tone = s.id === 'irving' || (state === 'outdated' && s.id === 'rich') ? 'outdated' : capacityStatus(s.dogsHoused, s.totalCapacity);
      return <Badge tone={tone}>{statusLabel[tone]}</Badge>;
    } },
    { key: 'lastUpdated', header: 'Last updated (UTC)' },
  ];
  return <PageShell nav="Home" title="Shared Dashboard" subtitle="Participating shelters within the 20-mile service area"
    actions={<><Button variant="secondary">View my dogs</Button><Button variant="secondary">Sign out</Button></>}>
    <p className="text-sm text-muted">Signed in: J. Doe · Richardson Animal Shelter</p>
    <Card title="Nearby shelters" actions={<Button variant="secondary" size="sm">Refresh</Button>}>
      {rows.length ? <Table columns={columns} rows={rows} /> : <p>No shelter data available.</p>}
    </Card>
    <p className="text-sm text-muted">Near Full: at least 85% occupied. Full: 100% occupied. Outdated: no update for 24 hours or more, or no update recorded.</p>
  </PageShell>;
}
