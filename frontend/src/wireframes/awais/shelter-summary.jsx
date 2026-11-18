import { Badge, Card, Table } from '../../components/ui';
import { availableKennels, capacityStatus, statusLabel } from '../../mock/shelters';

export function shelterStatus(shelter) {
  return shelter.id === 'irving' ? 'outdated' : capacityStatus(shelter.dogsHoused, shelter.totalCapacity);
}

const columns = [
  { key: 'name', header: 'Shelter' },
  { key: 'dogsHoused', header: 'Dogs housed', align: 'right' },
  { key: 'totalCapacity', header: 'Total kennels', align: 'right' },
  { key: 'available', header: 'Available kennels', align: 'right', render: availableKennels },
  { key: 'status', header: 'Status', render: (row) => {
    const tone = shelterStatus(row);
    return <Badge tone={tone}>{statusLabel[tone]}</Badge>;
  } },
  { key: 'lastUpdated', header: 'Last updated (UTC)' },
];

export default function ShelterSummary({ actions, toolbar, feedback, rows }) {
  return (
    <Card title="Nearby shelters" actions={actions}>
      <div className="flex flex-wrap items-end gap-3">{toolbar}</div>
      {feedback}
      {rows.length ? <Table columns={columns} rows={rows} /> : <p>No matching shelters found.</p>}
    </Card>
  );
}
