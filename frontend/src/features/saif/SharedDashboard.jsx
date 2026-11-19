/** UC-8/UC-10: authenticated dashboard and My Dogs screen flow.
 * Owner: Saif Yusuff. Composes shared UI and consumes existing shelter/auth services.
 */
import { useEffect, useReducer, useState } from 'react';
import { Badge, Button, Card, Input, PageShell, Table } from '../../components/ui';
import MyDogsTransfers from './MyDogsTransfers.jsx';

export function StaffSignIn({ app, onSignIn }) {
  const [error, setError] = useState('');

  function signIn(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      onSignIn(app.auth.signIn(data.get('email'), data.get('password')));
    } catch (e) { setError(e.message); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-8">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">DFW Shelter Tracker</h1>
        <h2 className="text-lg font-semibold">Shelter staff sign in</h2>
        <Card><form onSubmit={signIn} className="space-y-4">
          <Input label="Staff email" name="email" type="email" autoComplete="username" required />
          <Input label="Password" name="password" type="password" autoComplete="current-password" required />
          {error && <p role="alert">{error}</p>}
          <Button type="submit">Sign in</Button>
        </form></Card>
      </div>
    </main>
  );
}

export function ShelterTable({ rows, message = 'No shelter data available.', onDetails }) {
  const columns = [
    { key: 'name', header: 'Shelter', render: (row) => onDetails ? (
      <Button variant="ghost" size="sm" className="text-left underline" onClick={() => onDetails(row.id)}>{row.name}</Button>
    ) : row.name },
    { key: 'dogsHoused', header: 'Dogs housed', align: 'right' },
    { key: 'totalCapacity', header: 'Total kennels', align: 'right' },
    { key: 'availableKennels', header: 'Available kennels', align: 'right' },
    { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status}>{row.statusLabel}</Badge> },
    { key: 'lastUpdatedLabel', header: 'Last updated (UTC)' },
  ];
  return rows.length ? <div className="overflow-x-auto"><Table columns={columns} rows={rows} /></div> : <p role="status">{message}</p>;
}

export default function SharedDashboard({ app, initialPage = 'home', initialRequestID = null }) {
  const [page, setPage] = useState(initialPage === 'dogs' ? 'dogs' : 'home');
  const [session, setSession] = useState(() => app.auth.currentStaff()?.staffID ?? null);
  const [, refresh] = useReducer((n) => n + 1, 0);
  // Capacity changes in this app update Home immediately; polling also updates stale labels.
  useEffect(() => {
    const unsubscribe = app.events.on('capacity-updated', refresh);
    const timer = setInterval(refresh, 5000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [app]);
  const staff = app.auth.currentStaff();
  // Observe external sign-out; protected rows are never retained in component state.
  useEffect(() => {
    const timer = setInterval(() => {
      const next = app.auth.currentStaff()?.staffID ?? null;
      setSession(next);
    }, 250);
    return () => clearInterval(timer);
  }, [app]);

  if (!staff || session !== staff.staffID) return <StaffSignIn app={app} onSignIn={(user) => setSession(user.staffID)} />;

  const rows = page === 'home' ? app.shelterStore.listShelters() : [];
  return (
    <PageShell nav={page === 'dogs' ? 'My Dogs' : 'Home'}
      title={page === 'dogs' ? "My Dogs’ Transfers" : 'Shared Dashboard'}
      subtitle={page === 'dogs' ? 'Transfer requests sent by your shelter, including completed transfers' : 'Participating shelters within the 20-mile service area'}
      actions={<>
        <Button variant="secondary" onClick={() => setPage(page === 'dogs' ? 'home' : 'dogs')}>{page === 'dogs' ? 'Back to Home' : 'View my dogs'}</Button>
        <Button variant="secondary" onClick={() => { app.auth.signOut(); setSession(null); }}>Sign out</Button>
      </>}>
      <p className="text-sm text-muted">Signed in: {staff.name} · {app.shelterStore.getShelter(staff.shelterID)?.name}</p>
      {page === 'dogs' ? <MyDogsTransfers key={staff.staffID} app={app} initialRequestID={initialRequestID} /> : <>
      <Card title="Nearby shelters" actions={<Button variant="secondary" size="sm" onClick={refresh}>Refresh</Button>}>
        <ShelterTable rows={rows} />
      </Card>
      <p className="text-sm text-muted">Near Full: at least 85% occupied. Full: 100% occupied. Outdated: no update for 24 hours or more, or no update recorded.</p>
      </>}
    </PageShell>
  );
}
