/**
 * demo.jsx - preview page for UC-3 and UC-4 (opened at /joshua-demo.html by `npm run dev`).
 * Purpose: builds one in-memory app from services/, signs in a mock account and shows TransferFlow.
 * Clock is fixed at 2026-11-04 10:00 UTC (precondition P0 in the test plan) so results match the test cases.
 * URL options (one per test-case precondition, so each state can be shown and screenshotted):
 *   ?as=collin            start signed in as Collin County staff on UC-4 (default: Richardson on UC-3)
 *   ?release=D-1042       give Biscuit "no active transfer" (TC-3-01 precondition; removes seed request T-301)
 *   ?scenario=no-match    every other shelter is full (TC-3-03)
 *   ?scenario=medical     Collin cannot handle medical needs (TC-3-04)
 *   ?scenario=collin-full Collin is at 110/110 (TC-4-04)
 *   ?mapping=fail         the Mapping service fails (TC-3-05)
 * Owner: Joshua Nakka. AI-assisted draft (Claude); reviewed and explained by the owner.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { createApp } from '../../services/index.js';
import { createStubMapping } from '../../services/matchEngine.js';
import TransferFlow from './TransferFlow.jsx';

const params = new URLSearchParams(window.location.search);
const P0_NOW = new Date('2026-11-04T10:00:00Z');

const app = createApp({
  clock: { now: () => new Date(P0_NOW) },
  mapping: createStubMapping({ fail: params.get('mapping') === 'fail' }),
});

const shelter = (id) => app.state.shelters.find((s) => s.id === id);
const scenario = params.get('scenario');
if (scenario === 'no-match') app.state.shelters.forEach((s) => { if (s.id !== 'rich') s.dogsHoused = s.totalCapacity; });
if (scenario === 'medical') shelter('collin').medicalCapable = false;
if (scenario === 'collin-full') shelter('collin').dogsHoused = shelter('collin').totalCapacity;
const release = params.get('release');
if (release) {
  const gone = app.state.transfers.filter((t) => t.dogId === release).map((t) => t.id);
  app.state.transfers = app.state.transfers.filter((t) => t.dogId !== release);
  app.state.alerts = app.state.alerts.filter((a) => !gone.includes(a.transferRequestID));
}

// Mock accounts from services/seed.js (no real passwords exist in Part 1).
const ACCOUNTS = { rich: ['jdoe@richardson.example', 'pw-rich'], collin: ['staff@collin.example', 'pw-collin'] };
const startAs = params.get('as') === 'collin' ? 'collin' : 'rich';
app.auth.signIn(...ACCOUNTS[startAs]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TransferFlow app={app} accounts={ACCOUNTS} start={startAs === 'collin' ? 'respond' : 'request'} />
  </StrictMode>,
);
