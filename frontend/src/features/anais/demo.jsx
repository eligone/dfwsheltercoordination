/**
 * demo.jsx - preview page for UC-5 and UC-7 (opened at /anais-demo.html by `npm run dev` and by Playwright).
 * Purpose: builds one in-memory app from services/, signs in a mock Richardson account and shows MatchFlow.
 * Clock is fixed at 2026-11-04 10:00 UTC (precondition P0 in the test plan) so statuses match the tests.
 * URL options: ?user=intern signs in the unverified account (NFR-6); ?delayMs=300 slows the stub
 * Mapping service per shelter (NFR-5 timing check); ?scenario=no-match fills every other shelter so
 * UC-5 alternate course 4a ("No match found", Widen search) can be seen.
 * Owner: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and explained by the owner.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { createApp } from '../../services/index.js';
import { createStubMapping } from '../../services/matchEngine.js';
import MatchFlow from './MatchFlow.jsx';

const params = new URLSearchParams(window.location.search);
const P0_NOW = new Date('2026-11-04T10:00:00Z');

const app = createApp({
  clock: { now: () => new Date(P0_NOW) },
  mapping: createStubMapping({ delayMs: Number(params.get('delayMs') || 0) }),
});

// Demo only: make every shelter except Richardson full, so the search finds nothing.
if (params.get('scenario') === 'no-match') {
  app.state.shelters.forEach((s) => { if (s.id !== 'rich') s.dogsHoused = s.totalCapacity; });
}

// Mock accounts from services/seed.js (no real passwords exist in Part 1).
const ACCOUNTS = { rich: ['jdoe@richardson.example', 'pw-rich'], intern: ['intern@richardson.example', 'pw-intern'] };
app.auth.signIn(...(ACCOUNTS[params.get('user')] ?? ACCOUNTS.rich));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MatchFlow app={app} />
  </StrictMode>,
);
