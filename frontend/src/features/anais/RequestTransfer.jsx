/**
 * RequestTransfer.jsx - the UC-7 Request Dog Transfer screen.
 * Purpose: show the chosen shelter's details and a request form (dog ID, size, notes), then send the
 * request through transfers.createFromMatch (FR-16, NFR-6, NFR-8, NFR-9). The service checks the
 * required fields, the shelter's space, the size, "one active transfer per dog" and writes the audit
 * record; this screen only shows the outcome (highlighted fields, a message, or "Pending").
 * Owner: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and explained by the owner.
 */
import { useMemo, useState } from 'react';
import { Badge, Banner, Button, Card, Input, Select } from '../../components/ui';
import { SIZES } from './FindShelters.jsx';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-t border-line py-2 text-sm first:border-t-0">
    <span className="text-muted">{label}</span>
    <span className="text-right font-medium">{children}</span>
  </div>
);

/**
 * @param app     the shared services from createApp()
 * @param match   the row chosen in FindShelters (shelterID, shelterName, distance, ...)
 * @param dog     the dog being matched (pre-fills the form)
 * @param size    the size used for the search (pre-fills the form)
 * @param onBack  (message | null): back to the match list; a message means "the list must be refreshed" (alternate 4a)
 * @param onDone  after the request was sent: back to the dashboard
 */
export default function RequestTransfer({ app, match, dog, size, onBack, onDone }) {
  // UC-7 step 2 + NFR-6: contact details come only from the service, which refuses unverified accounts.
  const details = useMemo(() => {
    try { return { shelter: app.shelterStore.getShelterDetails(match.shelterID), error: null }; } catch (e) { return { shelter: null, error: e.message }; }
  }, [app, match.shelterID]);

  const [form, setForm] = useState({ dogId: dog?.id ?? '', size: size ?? '', notes: '' });
  const [missing, setMissing] = useState([]); // field names the service says are empty (alternate 3a)
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function submit(e) {
    e.preventDefault();
    setError(null); setMissing([]);
    try {
      setSent(app.transfers.createFromMatch({ shelterID: match.shelterID, dogId: form.dogId.trim(), size: form.size, notes: form.notes.trim() }));
    } catch (err) {
      if (err.code === 'NO_SPACE') { onBack?.(err.message); return; } // alternate 4a: tell staff, go back to an updated list
      if (err.code === 'VALIDATION') setMissing(err.fields);
      setError(err.message);
    }
  }

  if (!details.shelter) return <Banner tone="alert" title={details.error ?? 'Shelter not found.'} />;
  const s = details.shelter;
  const isMissing = (k) => missing.includes(k);

  return (
    <div className="space-y-6">
      {sent && (
        <Banner tone="success" title={sent.message} action={<Button variant="secondary" size="sm" onClick={() => onDone?.()}>Back to dashboard</Button>}>
          Request {sent.request.id} for dog {sent.request.dogId} to {s.name} is <Badge>{sent.status}</Badge>. The receiving shelter has been notified.
        </Banner>
      )}
      {error && <Banner tone="alert" title={error} />}

      <div className="grid grid-cols-2 gap-6">
        <Card title="Receiving shelter">
          <Row label="Shelter">{s.name}</Row>
          <Row label="Address">{s.address}</Row>
          <Row label="Distance">{match.distance} mi</Row>
          <Row label="Available kennels">{s.availableKennels} of {s.totalCapacity}</Row>
          <Row label="Status"><Badge tone={s.status}>{s.statusLabel}</Badge></Row>
          <Row label="Phone">{s.phone}</Row>
          <Row label="Email">{s.email}</Row>
          <Row label="Last updated">{s.lastUpdatedLabel}</Row>
        </Card>

        <Card title="Transfer request">
          <form className="space-y-4" onSubmit={submit} noValidate>
            <Input label="Dog ID" aria-label="Dog ID" value={form.dogId} onChange={set('dogId')} disabled={!!sent}
              error={isMissing('dogId') ? 'Required' : undefined} aria-invalid={isMissing('dogId') ? 'true' : undefined} />
            <Select label="Dog size" aria-label="Dog size" options={['', ...SIZES]} value={form.size} onChange={set('size')} disabled={!!sent}
              error={isMissing('size') ? 'Required' : undefined} aria-invalid={isMissing('size') ? 'true' : undefined} />
            <Input label="Notes (optional)" aria-label="Notes" value={form.notes} onChange={set('notes')} disabled={!!sent}
              placeholder="Medical needs, pickup details, temperament" />
            {!sent && (
              <div className="flex gap-3">
                <Button type="submit">Send Request</Button>
                <Button variant="secondary" onClick={() => onBack?.(null)}>Back to match results</Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
