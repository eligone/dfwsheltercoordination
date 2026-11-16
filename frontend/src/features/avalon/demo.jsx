/**
 * demo.jsx - preview page for UC-14 and UC-15 (opened at /avalon-demo.html by `npm run dev` and by Playwright).
 * Purpose: builds one in-memory app from services/, signs in a mock Richardson account and shows AlertsFlow.
 * Clock is fixed at 2026-11-04 10:00 UTC (precondition P0 in the test plan) so times match the tests.
 * URL options: ?user=dal signs in Dallas staff, who have no alerts (UC-14 empty inbox, NTC-11);
 * ?scenario=failed-delivery makes the email stub fail for staff@richardson.example and sends one High alert, so
 * the contact shows "Delivery failed" (TC-15-05, NFR-7).
 * Owner: Avalon Austin. AI-assisted draft; the owner reviews and explains it.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { createApp } from '../../services/index.js';
import AlertsFlow from './AlertsFlow.jsx';

const params = new URLSearchParams(window.location.search);
const P0_NOW = new Date('2026-11-04T10:00:00Z');
const app = createApp({ clock: { now: () => new Date(P0_NOW) } });

// Mock accounts from services/seed.js (no real passwords exist in Part 1).
const ACCOUNTS = { rich: ['jdoe@richardson.example', 'pw-rich'], dal: ['staff@dallas.example', 'pw-dal'], intern: ['intern@richardson.example', 'pw-intern'] };
app.auth.signIn(...(ACCOUNTS[params.get('user')] ?? ACCOUNTS.rich));

if (params.get('scenario') === 'failed-delivery') {
  app.channels.EMAIL.failFor.add('staff@richardson.example');
  app.alerts.create({ type: 'MATCH_FOUND', priority: 'high', message: 'Match found for Duke (D-1051)', recipientShelterID: 'rich', senderShelterID: 'irving', dogId: 'D-1051' });
}

app.settle().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AlertsFlow app={app} />
    </StrictMode>,
  );
});
