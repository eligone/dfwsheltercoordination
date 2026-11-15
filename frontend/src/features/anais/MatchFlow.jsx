/**
 * MatchFlow.jsx - connects UC-5 and UC-7: dashboard -> Find Available Shelters -> Request Dog Transfer.
 * Purpose: decides which of the two screens is showing and passes data between them. The "dashboard" here
 * is a stand-in with the two ways UC-5 starts (FR-12 shelter marked Full, FR-13 "Find Match"); Saif's real
 * dashboard (UC-8) is in his own folder and is not imported here (check-ui Rule 6).
 * Owner: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and explained by the owner.
 */
import { useState } from 'react';
import { Banner, Button, Card, PageShell } from '../../components/ui';
import FindShelters from './FindShelters.jsx';
import RequestTransfer from './RequestTransfer.jsx';

const TITLES = { dashboard: 'Home', find: 'Find Available Shelters', request: 'Request Dog Transfer' };

export default function MatchFlow({ app }) {
  const [view, setView] = useState({ screen: 'dashboard' });
  const staff = app.auth.currentStaff();
  const home = staff ? app.shelterStore.getShelter(staff.shelterID) : null;

  /** FR-12: marking the shelter Full goes through the capacity service (UC-1), which leaves a size prompt for us. */
  function markFull() {
    app.shelterStore.updateCapacity(staff.shelterID, 0);
    setView({ screen: 'find', prompt: app.matchEngine.takePrompt(staff.shelterID) });
  }

  let body;
  if (view.screen === 'dashboard') {
    body = !staff ? <Banner tone="alert" title="Please sign in." /> : (
      <Card title="My shelter">
        <p className="text-sm">{home.availableKennels} of {home.totalCapacity} kennels available · {home.statusLabel}</p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => setView({ screen: 'find' })}>Find Match</Button>
          <Button variant="secondary" onClick={markFull} disabled={home.availableKennels === 0}>Mark shelter Full</Button>
        </div>
      </Card>
    );
  } else if (view.screen === 'find') {
    body = (
      <FindShelters
        key={view.key ?? 'find'} app={app} prompt={view.prompt} notice={view.notice} initial={view.initial} autoSearch={!!view.initial}
        onCancel={() => setView({ screen: 'dashboard' })}
        onSelect={(match, criteria) => setView({ screen: 'request', match, ...criteria })}
      />
    );
  } else {
    body = (
      <RequestTransfer
        app={app} match={view.match} dog={view.dog} size={view.size}
        // UC-7 alternate 4a: a message means the shelter filled up, so rerun the same search for an updated list.
        onBack={(message) => setView({ screen: 'find', key: Date.now(), notice: message, initial: { dogId: view.dog?.id, size: view.size, radiusMi: view.radiusMi } })}
        onDone={() => setView({ screen: 'dashboard' })}
      />
    );
  }

  return (
    <PageShell nav="Home" title={TITLES[view.screen]} subtitle={home?.name}>
      {body}
    </PageShell>
  );
}
