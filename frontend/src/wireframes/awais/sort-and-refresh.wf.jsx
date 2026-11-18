import { Banner, Button, Select } from '../../components/ui';
import { availableKennels, shelters } from '../../mock/shelters';
import ShelterSummary from './shelter-summary.jsx';

export const meta = {
  uc: 'UC-12, UC-13',
  title: 'Sort & Refresh',
  owner: 'Awais',
  screen: 'Home / Shelter Summary',
  states: ['default', 'sorted', 'refreshing', 'refreshed', 'refresh-error'],
};

const sortLabels = {
  name: 'Shelter name (A–Z)',
  available: 'Available kennels (most first)',
  updated: 'Last updated (newest first)',
};

export default function SortAndRefresh({ state }) {
  const sort = state === 'default' ? 'name' : 'available';
  const refreshing = state === 'refreshing';
  const snapshot = state === 'refreshed' ? shelters.map((shelter) =>
    shelter.id === 'collin' ? { ...shelter, dogsHoused: 59, lastUpdated: '2026-11-04 10:00' } : shelter,
  ) : shelters;
  const rows = [...snapshot].sort(sort === 'name'
    ? (a, b) => a.name.localeCompare(b.name)
    : (a, b) => availableKennels(b) - availableKennels(a));

  const feedback = {
    refreshed: <Banner tone="success" title="Shelter data refreshed" />,
    'refresh-error': <Banner tone="alert" title="Could not refresh shelter data">
      Showing the last available data. Select Refresh to try again.
    </Banner>,
  }[state];

  return (
    <ShelterSummary
      rows={rows}
      toolbar={<Select label="Sort by" options={Object.values(sortLabels)} defaultValue={sortLabels[sort]} />}
      actions={<Button variant="secondary" size="sm" disabled={refreshing}>
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </Button>}
      feedback={feedback}
    />
  );
}
