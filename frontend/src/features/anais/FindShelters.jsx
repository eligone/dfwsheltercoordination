/**
 * FindShelters.jsx - the UC-5 Find Available Shelters screen, ending in the ranked results table (UC-6).
 * Purpose: staff pick a dog, confirm its size, and see other shelters ranked by services/matchEngine.js
 * (FR-12 to FR-15, NFR-5, NFR-6). This screen holds no business rules: searching, ranking, saving a
 * search and the verified-account check all happen in the service, and the screen shows what comes back.
 * Owner: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and explained by the owner.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Banner, Button, Card, Select, Table } from '../../components/ui';
import { MESSAGES } from '../../services/messages.js';

export const SIZES = ['small', 'medium', 'large'];
// Default search is the 20-mile service area (FR-32); "Widen search" offers larger distances (UC-5 alternate 4a).
const DISTANCES = { 'Within 30 miles': 30, 'Within 50 miles': 50 };
// Not a team-approved (†) message yet: see the "guesses" list in the hand-off notes.
export const SAVED_SEARCH_NOTE = 'Your search was saved. It will run again when any shelter updates its capacity.';

const dogLabel = (d) => `${d.name} (${d.id})`;
const round = (n) => Number(n.toFixed(4)); // 0.5375 stays 0.5375, 0.549000001 shows 0.549

/**
 * @param app       the shared services from createApp()
 * @param initial   { dogId, size, radiusMi } to start from (used when coming back from UC-7)
 * @param autoSearch run the search as soon as the screen opens (UC-7 alternate 4a: "updated match list")
 * @param notice    a message to show at the top, e.g. "This shelter no longer has space."
 * @param prompt    the size prompt the service created when this shelter became Full (FR-12)
 * @param onCancel  UC-5 alternate 3a: back to the dashboard, no search
 * @param onSelect  (match, { dog, size, radiusMi }) when staff choose "Request Transfer" on a row
 */
export default function FindShelters({ app, initial = {}, autoSearch = false, notice = null, prompt = null, onCancel, onSelect }) {
  // NFR-6: only verified staff may search. Asking the service once decides what the screen shows.
  const access = useMemo(() => {
    try { return { staff: app.auth.requireVerified(), error: null }; } catch (e) { return { staff: null, error: e.message }; }
  }, [app]);
  const dogs = access.staff ? app.state.dogs.filter((d) => d.shelterID === access.staff.shelterID) : [];

  const firstDogId = initial.dogId ?? dogs[0]?.id ?? '';
  // UC-5 step 2: the size comes from the dog's record; after "shelter became Full" the system asks for it, so it starts empty.
  const sizeOf = (dogId) => (dogId ? app.matchEngine.startManualMatch(dogId).size : '');
  const [dogId, setDogId] = useState(firstDogId);
  const [size, setSize] = useState(() => initial.size ?? (prompt || !access.staff ? '' : sizeOf(firstDogId)));
  const [radiusMi, setRadiusMi] = useState(initial.radiusMi ?? 20);
  const [widenLabel, setWidenLabel] = useState('Within 30 miles');
  const [result, setResult] = useState(null); // { matches, message, canWiden, searchID, widened }
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [sizeError, setSizeError] = useState(null);

  const dog = dogs.find((d) => d.id === dogId) ?? null;

  async function search() {
    setError(null); setSizeError(null);
    setSearching(true);
    try {
      const r = await app.matchEngine.findMatches({ dogId, size, radiusMi });
      setResult({ ...r, widened: false });
    } catch (e) {
      if (e.code === 'VALIDATION' && e.fields?.includes('size')) setSizeError(e.message); // "Select the dog's size."
      else setError(e.message);
    } finally { setSearching(false); }
  }

  async function widen() {
    setError(null);
    setSearching(true);
    try {
      const miles = DISTANCES[widenLabel];
      const r = await app.matchEngine.widenSearch(result.searchID, miles);
      setRadiusMi(miles);
      setResult({ ...r, searchID: result.searchID, widened: true }); // keep the saved search's ID for the next widen
    } catch (e) { setError(e.message); } finally { setSearching(false); }
  }

  // Coming back from UC-7 after "no longer has space": rerun once so the list is up to date.
  const ran = useRef(false);
  useEffect(() => {
    if (autoSearch && access.staff && !ran.current) { ran.current = true; search(); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!access.staff) {
    return <Banner tone="alert" title={access.error} />;
  }

  const columns = [
    { key: 'rank', header: '#' },
    { key: 'shelterName', header: 'Shelter', render: (m) => <span className="font-medium">{m.shelterName}</span> },
    { key: 'distance', header: 'Distance', render: (m) => `${m.distance} mi`, align: 'right' },
    { key: 'openSpaces', header: 'Open spaces', align: 'right' },
    { key: 'score', header: 'Score', render: (m) => round(m.score), align: 'right' },
    { key: 'contact', header: 'Contact', render: (m) => <span className="text-xs">{m.contact.phone} · {m.contact.email}</span> },
    { key: 'action', header: '', render: (m) => <Button size="sm" onClick={() => onSelect?.(m, { dog, size, radiusMi })}>Request Transfer</Button>, align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {notice && <Banner tone="alert" title={notice}>The list below was updated.</Banner>}
      {prompt && <Banner tone="info" title={prompt.message}>Your shelter is marked Full. Choose a dog and its size to find shelters with space.</Banner>}
      {error && <Banner tone="alert" title={error} />}

      <Card title="Match criteria">
        <div className="grid grid-cols-2 items-start gap-4">
          <Select
            label="Dog" aria-label="Dog" options={dogs.map(dogLabel)} value={dog ? dogLabel(dog) : ''}
            onChange={(e) => { const d = dogs.find((x) => dogLabel(x) === e.target.value); setDogId(d.id); setSize(sizeOf(d.id)); setResult(null); }}
          />
          <Select
            label="Dog size" aria-label="Dog size" options={['', ...SIZES]} value={size} error={sizeError}
            aria-invalid={sizeError ? 'true' : undefined}
            onChange={(e) => { setSize(e.target.value); setSizeError(null); setResult(null); }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">{dog ? `Medical: ${dog.medical} · ${dog.highRisk ? 'High risk' : 'Not high risk'}` : ''}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => onCancel?.()}>Cancel</Button>
            <Button onClick={search} disabled={searching}>Find Match</Button>
          </div>
        </div>
      </Card>

      {searching && <p className="text-sm text-muted" role="status">Searching shelters…</p>}

      {result && result.matches.length > 0 && (
        <Card title={`Match results · ${result.matches.length} shelters within ${radiusMi} miles`}>
          <div className="space-y-3">
            <Table columns={columns} rows={result.matches} rowKey="shelterID" />
            <p className="text-xs text-muted">
              Showing shelters that house {size} dogs and have at least one open space, best match first.
              Score = 0.5 × nearness + 0.3 × open spaces + 0.2 × size fit.
            </p>
          </div>
        </Card>
      )}

      {result && result.matches.length === 0 && (
        <Banner
          tone="alert" title={result.message}
          action={result.canWiden && (
            <div className="flex items-end gap-2">
              <Select aria-label="Search distance" options={Object.keys(DISTANCES)} value={widenLabel} onChange={(e) => setWidenLabel(e.target.value)} />
              <Button variant="secondary" size="sm" onClick={widen} disabled={searching}>Widen search</Button>
            </div>
          )}
        >
          No shelter within {radiusMi} miles houses {size} dogs and has an open space.
          {result.widened ? <> <Badge>Saved</Badge> {SAVED_SEARCH_NOTE}</> : ' Try a larger distance.'}
        </Banner>
      )}
    </div>
  );
}
