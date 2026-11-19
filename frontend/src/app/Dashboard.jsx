import { useEffect, useReducer, useState } from 'react';
import { Badge, Banner, Button, Card, Input, PageShell, Select } from '../components/ui';
import { ShelterTable } from '../features/saif/SharedDashboard.jsx';
import { REFRESH_INTERVAL_MS } from '../services/dashboard.js';

const ALL_STATUSES = 'All statuses';
const STATUSES = [ALL_STATUSES, 'Open', 'Near Full', 'Full', 'Outdated'];
const SORTS = {
  'Shelter name (A–Z)': ['name', true],
  'Available kennels (most first)': ['availableKennels', false],
  'Last updated (newest first)': ['lastUpdated', false],
  'Distance (nearest first)': ['distanceMi', true],
};
const DEFAULT_SORT = 'Shelter name (A–Z)';

export default function Dashboard({ app, onCapacity, onMatch, onDetails }) {
  const [dashboard] = useState(() => app.createDashboard());
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [feedback, setFeedback] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, render] = useReducer((version) => version + 1, 0);

  useEffect(() => {
    dashboard.sortBy(...SORTS[DEFAULT_SORT]);
    let active = true;
    async function refresh() {
      const result = await dashboard.refresh();
      if (!active) return;
      if (!result.ok) setFeedback(result);
      render();
    }
    void refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    const offCapacity = app.events.on('capacity-updated', refresh);
    const offTransfers = app.events.on('transfer-changed', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      offCapacity();
      offTransfers();
    };
  }, [app, dashboard]);

  async function manualRefresh() {
    setRefreshing(true);
    const result = await dashboard.refresh();
    setFeedback(result);
    setRefreshing(false);
  }

  const { rows, message } = dashboard.view();
  return (
    <PageShell nav="Home" title="Shared Dashboard" subtitle="Participating shelters within the 20-mile service area"
      actions={<><Button variant="secondary" onClick={onCapacity}>Update Capacity</Button><Button onClick={onMatch}>Find Match</Button></>}>
      <Card title="Nearby shelters" actions={
        <Button variant="secondary" size="sm" disabled={refreshing} onClick={manualRefresh}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>
      }>
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Search shelters" type="search" placeholder="Name, city or address" value={dashboard.searchQuery}
              onChange={(event) => { dashboard.searchShelter(event.target.value); render(); }} />
            <Select label="Capacity status" options={STATUSES} value={dashboard.statusFilter ?? ALL_STATUSES}
              onChange={(event) => { dashboard.filterByStatus(event.target.value === ALL_STATUSES ? null : event.target.value); render(); }} />
            <Button variant="secondary" disabled={!dashboard.searchQuery && !dashboard.statusFilter}
              onClick={() => { dashboard.searchShelter(''); dashboard.filterByStatus(null); render(); }}>Clear filters</Button>
            <Select label="Sort by" options={Object.keys(SORTS)} value={sort}
              onChange={(event) => { dashboard.sortBy(...SORTS[event.target.value]); setSort(event.target.value); }} />
          </div>
          {feedback && <Banner tone={feedback.ok ? 'success' : 'alert'} title={feedback.message} />}
          <ShelterTable rows={rows} message={message} onDetails={onDetails} />
        </div>
      </Card>
      <p className="text-sm text-muted">Near Full: at least 85% occupied. Full: 100% occupied. Outdated: no update for 24 hours or more, or no update recorded.</p>
    </PageShell>
  );
}

export function ShelterDetails({ app, shelterID, onBack }) {
  let shelter, error;
  try { shelter = app.shelterStore.getShelterDetails(shelterID); } catch (reason) { error = reason.message; }
  return (
    <PageShell nav="Home" title="Shelter Details" subtitle={shelter?.name}
      actions={<Button variant="secondary" onClick={onBack}>Back to Home</Button>}>
      {shelter ? (
        <Card title={shelter.name} actions={<Badge tone={shelter.status}>{shelter.statusLabel}</Badge>}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt>Address</dt><dd>{shelter.address}</dd>
            <dt>Phone</dt><dd>{shelter.phone}</dd>
            <dt>Email</dt><dd>{shelter.email}</dd>
            <dt>Dogs housed</dt><dd>{shelter.dogsHoused}</dd>
            <dt>Available kennels</dt><dd>{shelter.availableKennels} of {shelter.totalCapacity}</dd>
            <dt>Last updated (UTC)</dt><dd>{shelter.lastUpdatedLabel}</dd>
          </dl>
        </Card>
      ) : <Banner tone="alert" title={error ?? 'Shelter not found.'} />}
    </PageShell>
  );
}
