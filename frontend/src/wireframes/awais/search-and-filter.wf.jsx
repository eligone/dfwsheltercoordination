import { Button, Input, Select } from '../../components/ui';
import { shelters, statusLabel } from '../../mock/shelters';
import ShelterSummary, { shelterStatus } from './shelter-summary.jsx';

export const meta = {
  uc: 'UC-11',
  title: 'Search & Filter',
  owner: 'Awais',
  screen: 'Home / Shelter Summary',
  states: ['default', 'filters-applied', 'no-results'],
};

const statusOptions = ['All statuses', ...Object.values(statusLabel)];

export default function SearchAndFilter({ state }) {
  const query = { 'filters-applied': 'Plano', 'no-results': 'Dallas' }[state] ?? '';
  const status = state === 'default' ? 'all' : 'open';
  const rows = shelters.filter((shelter) =>
    shelter.name.toLowerCase().includes(query.toLowerCase()) &&
    (status === 'all' || shelterStatus(shelter) === status),
  );

  return (
    <ShelterSummary rows={rows} toolbar={<>
      <Input label="Search shelters" type="search" placeholder="Shelter name" defaultValue={query} />
      <Select label="Capacity status" options={statusOptions} defaultValue={statusLabel[status] ?? 'All statuses'} />
      <Button variant="secondary" disabled={!query && status === 'all'}>Clear filters</Button>
    </>} />
  );
}
