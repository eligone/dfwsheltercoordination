
/**
 * UC-2 View Capacity Change History
 * FR-4, FR-5, FR-6
 * Author: Hoang Pham
 */
import { useState } from 'react';
import {
  Banner, Button, Card, PageShell, Table
} from '../../components/ui';

const ranges = [
  { value: 'PAST_MONTH', label: 'Past month' },
  { value: 'PAST_SIX_MONTHS', label: 'Past six months' },
  { value: 'PAST_YEAR', label: 'Past year' },
];

export default function CapacityHistory({ app }) {
  const staff = app.auth.currentStaff();
  const shelterId = staff?.shelterID;

  const [range, setRange] = useState('');
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState(
    'Select a time range to view records.'
  );
  const [error, setError] = useState('');

  function handleRangeChange(event) {
    const selected = event.target.value;
    setRange(selected);
    setError('');

    if (!selected) {
      setRecords([]);
      setMessage('Select a time range to view records.');
      return;
    }

    try {
      const result = app.shelterStore.getHistory(
        shelterId, selected
      );
      setRecords(result.records);
      setMessage(result.message || '');
    } catch (err) {
      setError(err.message);
      setRecords([]);
    }
  }

  function downloadPdf() {
    try {
      const pdf = app.shelterStore.exportHistoryPdf(
        shelterId, records, range
      );

      const blob = new Blob([pdf.bytes], {
        type: pdf.mimeType
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = pdf.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!staff) {
    return <p>Please sign in to view capacity history.</p>;
  }

  const columns = [
    {
      key: 'recordedAt',
      header: 'Date and time',
      render: (r) => new Date(
        r.recordedAt
      ).toLocaleString()
    },
    {
      key: 'previousAvailable',
      header: 'Previous',
    },
    {
      key: 'newAvailable',
      header: 'New',
    },
    {
      key: 'changedByName',
      header: 'Updated by',
    },
  ];

  return (
    <PageShell
      nav="Home"
      title="Capacity Change History"
      subtitle="Richardson Animal Shelter"
    >
      {error && (
        <Banner tone="alert" title="Error">
          {error}
        </Banner>
      )}

      <Card title="Filter capacity history">
        <div className="space-y-4">
          <label
            htmlFor="history-range"
            className="block font-semibold"
          >
            Select a time range
          </label>

          <select
            id="history-range"
            value={range}
            onChange={handleRangeChange}
            className="rounded border border-line bg-surface p-3"
          >
            <option value="">Choose a time range</option>
            {ranges.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <div>
            <Button
              onClick={downloadPdf}
              disabled={!range || records.length === 0}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Capacity change records">
        {records.length > 0 ? (
          <>
            <p className="mb-3 text-sm">
              Showing {records.length} records
            </p>
            <Table
              columns={columns}
              rows={records}
              rowKey="recordID"
            />
          </>
        ) : (
          <p role="status" className="text-muted">
            {message}
          </p>
        )}
      </Card>
    </PageShell>
  );
}
