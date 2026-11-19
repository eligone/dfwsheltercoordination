import { StrictMode, useEffect, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { Button, Card, PageShell } from '../components/ui';
import { NavigationContext } from '../components/ui/PageShell.jsx';
import MatchFlow from '../features/anais/MatchFlow.jsx';
import AlertsInbox from '../features/avalon/AlertsInbox.jsx';
import NotificationPreferences from '../features/avalon/NotificationPreferences.jsx';
import CapacityHistory from '../features/hoang/CapacityHistory.jsx';
import UpdateCapacity from '../features/hoang/UpdateCapacity.jsx';
import RequestAnimalTransfer from '../features/joshua/RequestAnimalTransfer.jsx';
import RespondTransfer from '../features/joshua/RespondTransfer.jsx';
import MyDogsTransfers from '../features/saif/MyDogsTransfers.jsx';
import { StaffSignIn } from '../features/saif/SharedDashboard.jsx';
import { createApp } from '../services/index.js';
import Dashboard, { ShelterDetails } from './Dashboard.jsx';

const TABS = { Home: 'home', 'My Dogs': 'dogs', Settings: 'settings', Alerts: 'alerts' };

function ShelterApp({ app }) {
  const [staff, setStaff] = useState(null);
  const [view, setView] = useState({ name: 'home' });
  const [, render] = useReducer((version) => version + 1, 0);

  useEffect(() => {
    const offAlerts = app.events.on('alerts-changed', render);
    const offTransfers = app.events.on('transfer-changed', render);
    const timer = setInterval(() => app.notifications.sendReminders(), 30_000);
    return () => {
      offAlerts();
      offTransfers();
      clearInterval(timer);
    };
  }, [app]);

  function go(name, data) { setView({ name, ...data }); }
  function signOut() {
    app.auth.signOut();
    setStaff(null);
    go('home');
  }

  if (!staff) return <StaffSignIn app={app} onSignIn={setStaff} />;

  const home = () => go('home');
  const dogs = () => go('dogs');
  const startMatch = () => go('match', { prompt: staff.verified ? app.matchEngine.takePrompt(staff.shelterID) : null });
  let page;
  switch (view.name) {
    case 'capacity':
      page = <UpdateCapacity app={app} onFindMatch={staff.verified ? startMatch : undefined} />;
      break;
    case 'details':
      page = <ShelterDetails app={app} shelterID={view.shelterID} onBack={home} />;
      break;
    case 'match':
      page = <MatchFlow app={app} onBack={home} prompt={view.prompt} />;
      break;
    case 'dogs':
      page = (
        <PageShell nav="My Dogs" title="My Dogs’ Transfers" actions={<>
          <Button variant="secondary" onClick={() => go('incoming')}>Incoming Requests</Button>
          <Button onClick={() => go('request')}>Request Animal Transfer</Button>
        </>}>
          <MyDogsTransfers app={app} />
        </PageShell>
      );
      break;
    case 'request':
      page = <PageShell nav="My Dogs" title="Request Animal Transfer" actions={<Button variant="secondary" onClick={dogs}>Back to My Dogs</Button>}>
        <RequestAnimalTransfer app={app} />
      </PageShell>;
      break;
    case 'incoming':
      page = <PageShell nav="My Dogs" title="Respond to Transfer" actions={<Button variant="secondary" onClick={dogs}>Back to My Dogs</Button>}>
        <RespondTransfer app={app} initialRequestID={view.requestID} />
      </PageShell>;
      break;
    case 'settings':
      page = <PageShell nav="Settings" title="Settings">
        <Card><div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => go('history')}>Capacity History</Button>
          <Button variant="secondary" onClick={() => go('preferences')}>Notification Preferences</Button>
        </div></Card>
      </PageShell>;
      break;
    case 'history':
      page = <CapacityHistory app={app} nav="Settings" />;
      break;
    case 'preferences':
      page = <NotificationPreferences app={app} />;
      break;
    case 'alerts':
      page = <AlertsInbox app={app} onBack={home} onOpenTransfer={(requestID) => go('incoming', { requestID })} />;
      break;
    default:
      page = <Dashboard app={app} onCapacity={() => go('capacity')} onMatch={startMatch} onDetails={(shelterID) => go('details', { shelterID })} />;
  }

  const navigation = {
    user: app.shelterStore.getShelter(staff.shelterID).name,
    unread: app.alerts.unreadCount(),
    onNavigate: (tab) => go(TABS[tab]),
    onSignOut: signOut,
  };

  return <NavigationContext.Provider value={navigation}>{page}</NavigationContext.Provider>;
}

// Keep the demo's original shelter timestamps meaningful while letting time advance within a session.
const startedAt = Date.now();
const fixtureNow = Date.parse('2026-11-04T10:00:00Z');
const app = createApp({ clock: { now: () => new Date(fixtureNow + Date.now() - startedAt) } });

createRoot(document.getElementById('root')).render(<StrictMode><ShelterApp app={app} /></StrictMode>);
