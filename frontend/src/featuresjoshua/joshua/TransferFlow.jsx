/**
 * TransferFlow.jsx - puts UC-3 and UC-4 on one page with the shared nav bar.
 * Purpose: shows UC-3 (Request Animal Transfer) for the sending shelter and UC-4 (Respond to Transfer) for
 * the receiving shelter. Both screens share one in-memory app, so a request sent in UC-3 shows up in the
 * receiving shelter's UC-4 list. The "Signed in as" switch is a demo stand-in for signing out and in as a
 * different shelter (real sign-in is the shared Sign In screen, NFR-14).
 * Owner: Joshua Nakka. AI-assisted draft (Claude); reviewed and explained by the owner.
 */
import { useState } from 'react';
import { Button, NavBar } from '../../components/ui';
import RequestAnimalTransfer from './RequestAnimalTransfer.jsx';
import RespondTransfer from './RespondTransfer.jsx';

const SCREENS = {
  request: { nav: 'My Dogs', title: 'Request Animal Transfer', subtitle: 'Send a dog to the best-matched participating shelters.' },
  respond: { nav: 'Home', title: 'Incoming Transfer Requests', subtitle: 'Accept or decline transfer requests sent to your shelter.' },
};

/**
 * @param app       the shared services from createApp()
 * @param accounts  { [shelterID]: [email, password] } mock accounts the demo switch can sign in with
 * @param start     'request' (UC-3) or 'respond' (UC-4)
 */
export default function TransferFlow({ app, accounts, start = 'request' }) {
  const [screen, setScreen] = useState(start);
  const [, setVersion] = useState(0);
  const staff = app.auth.currentStaff();
  const shelterName = staff ? app.state.shelters.find((s) => s.id === staff.shelterID)?.name : 'Not signed in';
  const unread = staff ? app.alerts.unreadCount() : 0;

  function switchTo(shelterID, next) {
    app.auth.signIn(...accounts[shelterID]);
    setScreen(next);
    setVersion((v) => v + 1);
  }

  const s = SCREENS[screen];
  return (
    <div className="min-h-screen bg-canvas">
      <NavBar active={s.nav} user={shelterName} unread={unread} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-center gap-3 rounded-md border border-dashed border-line bg-surface px-4 py-2 text-sm">
          <span className="text-muted">Demo – signed in as:</span>
          <Button size="sm" variant={screen === 'request' ? 'primary' : 'secondary'} onClick={() => switchTo('rich', 'request')}>Richardson (UC-3 Request)</Button>
          <Button size="sm" variant={screen === 'respond' ? 'primary' : 'secondary'} onClick={() => switchTo('collin', 'respond')}>Collin County (UC-4 Respond)</Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{s.title}</h1>
          <p className="text-sm text-muted">{shelterName} · {s.subtitle}</p>
        </div>
        {screen === 'request'
          ? <RequestAnimalTransfer key={`req-${staff?.staffID}`} app={app} />
          : <RespondTransfer key={`resp-${staff?.staffID}`} app={app} />}
      </main>
    </div>
  );
}
