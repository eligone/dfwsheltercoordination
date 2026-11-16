/**
 * RequestAnimalTransfer.jsx - the UC-3 Request Animal Transfer screen.
 * Purpose: staff pick one of their dogs and an urgency and press "Send Request". The request goes through
 * transfers.createRequest (FR-9, FR-10, FR-11, FR-17, FR-18, NFR-8, NFR-9), which checks the fields, ranks
 * the shelters, alerts the top three and writes the audit record. This screen holds no business rules:
 * it only shows what the service returns (highlighted fields, a message, the ranked list, "Pending").
 * It also lists this shelter's transfer requests with a "Cancel request" button (FR-21).
 * Owner: Joshua Nakka. AI-assisted draft (Claude); reviewed and explained by the owner.
 */
import { useState } from 'react';
import { Badge, Banner, Button, Card, Input, Select, Table } from '../../components/ui';
import { MESSAGES } from '../../services/messages.js';

// The form shows "High" / "Normal"; the service uses the UrgencyLevel values from models.js.
const URGENCY = { High: 'HIGH', Normal: 'NORMAL' };
const ALERTED = 3; // the service alerts the top three shelters (FR-11)

export const dogLabel = (d) => `${d.name} (${d.id})`;
const round = (n) => Number(n.toFixed(4));
const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '');

/** @param app the shared services from createApp() (a verified staff member must be signed in) */
export default function RequestAnimalTransfer({ app }) {
  const staff = app.auth.currentStaff();
  const myDogs = staff ? app.state.dogs.filter((d) => d.shelterID === staff.shelterID) : [];

  const [form, setForm] = useState({ dog: '', urgency: '', notes: '' });
  const [missing, setMissing] = useState([]); // field names the service says are empty (TC-3-02)
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { request, matches, message }
  const [sending, setSending] = useState(false);
  const [listNotice, setListNotice] = useState(null);
  const [, setVersion] = useState(0); // re-render after "Cancel request"
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null); setMissing([]); setResult(null); setListNotice(null);
    setSending(true);
    const dog = myDogs.find((d) => dogLabel(d) === form.dog);
    try {
      const r = await app.transfers.createRequest({ dogId: dog?.id ?? '', urgency: URGENCY[form.urgency] ?? '', notes: form.notes.trim() });
      setResult({ ...r, dog });
      setForm({ dog: '', urgency: '', notes: '' });
    } catch (err) {
      // The form keeps what was typed, so staff can simply press Send Request again (TC-3-05).
      if (err.code === 'VALIDATION') setMissing(err.fields ?? []);
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function cancel(requestID) {
    try {
      app.transfers.cancel(requestID);
      setListNotice({ tone: 'success', title: `Transfer ${requestID} cancelled.` });
    } catch (err) {
      setListNotice({ tone: 'alert', title: err.message });
    }
    setVersion((v) => v + 1);
  }

  if (!staff) return <Banner tone="alert" title="Please sign in." />;
  const isMissing = (k) => missing.includes(k);
  const rows = app.transfers.listMyDogs().rows;

  return (
    <div className="space-y-6">
      {error && <Banner tone="alert" title={error} />}

      {result && result.message === MESSAGES.TRANSFER_SENT && (
        <Banner tone="success" title={result.message}>
          Request {result.request.id} for {dogLabel(result.dog)} is <Badge>{result.request.status}</Badge>.{' '}
          {Math.min(ALERTED, result.matches.length)} shelters have been alerted.
        </Banner>
      )}
      {result && result.message === MESSAGES.NO_MATCH && (
        <Banner tone="alert" title={result.message}>
          No shelter within 20 miles can take {dogLabel(result.dog)} right now. Request {result.request.id} is saved as{' '}
          <Badge>{result.request.status}</Badge> and no shelter was alerted.
        </Banner>
      )}

      <Card title="New transfer request">
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Dog to transfer" aria-label="Dog to transfer" options={['', ...myDogs.map(dogLabel)]} value={form.dog} onChange={set('dog')}
              error={isMissing('dogId') ? 'Required' : undefined} aria-invalid={isMissing('dogId') ? 'true' : undefined} />
            <Select label="Urgency" aria-label="Urgency" options={['', ...Object.keys(URGENCY)]} value={form.urgency} onChange={set('urgency')}
              hint="High urgency sends High priority alerts." error={isMissing('urgency') ? 'Required' : undefined} aria-invalid={isMissing('urgency') ? 'true' : undefined} />
          </div>
          <Input label="Notes for receiving shelter (optional)" aria-label="Notes" value={form.notes} onChange={set('notes')}
            placeholder="Temperament, feeding, transport…" />
          {form.dog && (() => {
            const d = myDogs.find((x) => dogLabel(x) === form.dog);
            return d ? <p className="text-sm text-muted">Size: {d.size} · Medical: {d.medical} · {d.highRisk ? 'High risk' : 'Standard risk'}</p> : null;
          })()}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setForm({ dog: '', urgency: '', notes: '' }); setMissing([]); setError(null); }}>Cancel</Button>
            <Button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send Request'}</Button>
          </div>
        </form>
      </Card>

      {result && result.matches.length > 0 && (
        <Card title={`Ranked matches for ${result.dog.name}`}>
          <Table
            rowKey="shelterID"
            columns={[
              { key: 'rank', header: '#' },
              { key: 'shelterName', header: 'Shelter' },
              { key: 'distance', header: 'Distance', align: 'right', render: (m) => `${m.distance} mi` },
              { key: 'openSpaces', header: 'Open spaces', align: 'right' },
              { key: 'score', header: 'Score', align: 'right', render: (m) => round(m.score) },
              { key: 'alert', header: 'Alert', render: (m) => (m.rank <= ALERTED ? <Badge>Alert sent</Badge> : <span className="text-muted">Next in line</span>) },
            ]}
            rows={result.matches}
          />
          <p className="mt-3 text-xs text-muted">Score = 0.5 × nearness + 0.3 × open spaces + 0.2 × size fit. Shelters that do not house the dog's size, are full, or cannot meet its medical needs are left out.</p>
        </Card>
      )}

      <Card title="My transfer requests">
        {listNotice && <div className="mb-3"><Banner tone={listNotice.tone} title={listNotice.title} /></div>}
        {rows.length === 0 ? <p className="text-sm text-muted">{MESSAGES.NO_ACTIVE_TRANSFERS}</p> : (
          <Table
            rowKey="requestID"
            columns={[
              { key: 'requestID', header: 'Request' },
              { key: 'dog', header: 'Dog', render: (r) => `${r.dogName} (${r.dogId})` },
              { key: 'toShelterName', header: 'Receiving shelter', render: (r) => r.toShelterName ?? <span className="text-muted">Waiting for a reply</span> },
              { key: 'requestedAt', header: 'Requested', render: (r) => fmt(r.requestedAt) },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Pending' ? 'outdated' : 'neutral'}>{r.status}</Badge> },
              { key: 'action', header: '', align: 'right', render: (r) => (['Pending', 'Accepted'].includes(r.status) ? <Button variant="ghost" size="sm" onClick={() => cancel(r.requestID)}>Cancel request</Button> : null) },
            ]}
            rows={rows}
          />
        )}
      </Card>
    </div>
  );
}
