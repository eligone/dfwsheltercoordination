/**
 * AlertsFlow.jsx - connects UC-14 and UC-15: Home stand-in -> Alerts inbox, or Home -> Notification Preferences.
 * Purpose: decides which of the two screens is showing and keeps the bell badge in step. The "Home" here is a
 * stand-in (Saif's real dashboard is in his own folder and is not imported, check-ui Rule 6). The shared NavBar's
 * bell and tabs are not clickable yet, so the two entry points are buttons on this stand-in Home.
 * Owner: Avalon Austin. AI-assisted draft; the owner reviews and explains it.
 */
import { useState } from 'react';
import { Banner, Button, Card, PageShell } from '../../components/ui';
import AlertsInbox from './AlertsInbox.jsx';
import NotificationPreferences from './NotificationPreferences.jsx';

export default function AlertsFlow({ app }) {
  const [screen, setScreen] = useState('home');
  const [, setVersion] = useState(0);
  const staff = app.auth.currentStaff();
  const home = () => { setScreen('home'); setVersion((v) => v + 1); };

  if (screen === 'alerts') return <AlertsInbox app={app} onChange={() => setVersion((v) => v + 1)} onBack={home} />;
  if (screen === 'settings') return <NotificationPreferences app={app} onBack={home} />;

  const unread = staff ? app.alerts.unreadCount() : 0;
  return (
    <PageShell nav="Home" unread={unread} title="Home" subtitle={staff ? app.shelterStore.getShelter(staff.shelterID).name : undefined}>
      {!staff ? <Banner tone="alert" title="Please sign in." /> : (
        <Card title="Alerts and notifications">
          <p className="text-sm">{unread} unread {unread === 1 ? 'alert' : 'alerts'}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => setScreen('alerts')}>Open alerts</Button>
            <Button variant="secondary" onClick={() => setScreen('settings')}>Notification Preferences</Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
