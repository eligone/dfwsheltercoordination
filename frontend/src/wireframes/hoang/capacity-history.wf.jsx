import { Banner, Button, Card, PageShell, Select, Table } from '../../components/ui';
import { shelters, myShelterId } from '../../mock/shelters';

export const meta = {
  uc: 'UC-2',
  title: 'Capacity History',
  owner: 'Hoang',
  screen: 'Settings › Capacity History',
  states: ['default', 'empty'],
  width: 1024,
};

// Illustrative history records for this wireframe only.
const records = [
  { id: 1, time: 'Nov 4, 2026 · 10:00 AM', before: 2, after: 8, staff: 'Hoang Pham' },
  { id: 2, time: 'Nov 4, 2026 · 8:15 AM', before: 5, after: 2, staff: 'Shelter Staff A' },
  { id: 3, time: 'Nov 3, 2026 · 4:30 PM', before: 3, after: 5, staff: 'Shelter Staff B' },
];
const columns = [
  { key: 'time', header: 'Date and time' },
  { key: 'before', header: 'Before (available kennels)' },
  { key: 'after', header: 'After (available kennels)' },
  { key: 'staff', header: 'Changed by' },
];

export default function CapacityHistory({ state }) {
  const shelter = shelters.find((s) => s.id === myShelterId);
  const empty = state === 'empty';
  return (
    <PageShell nav="Settings" title="Capacity History" subtitle={shelter.name}>
      <p className="text-sm text-muted">Settings / Capacity History</p>
      <Card title="Capacity changes" actions={<Button variant="secondary" disabled={empty}>Download PDF</Button>}>
        <div className="space-y-5">
          <div className="max-w-xs"><Select label="Time range" options={['Last 1 month', 'Last 6 months', 'Last 12 months']} defaultValue="Last 1 month" hint="History is displayed for the selected time range." /></div>
          <p className="text-sm text-muted">Available kennels before and after each change · Most recent first · Times shown in Central Time</p>
          {empty ? <Banner title="No capacity history found.">There are no changes in this time range. Choose a longer time range.</Banner> : <Table columns={columns} rows={records} />}
          <p className="text-xs text-muted">{empty ? '0 records' : '3 sample records'} · Total capacity: {shelter.totalCapacity}</p>
        </div>
      </Card>
      <Button variant="ghost">Back to dashboard</Button>
    </PageShell>
  );
}
