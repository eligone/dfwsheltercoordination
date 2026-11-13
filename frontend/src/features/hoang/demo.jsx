
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createTestApp, signInAs
} from '../../test/testApp.js';

import UpdateCapacity from './UpdateCapacity.jsx';
import CapacityHistory from './CapacityHistory.jsx';
import '../../index.css';

// One shared in-memory app for both use cases.
const app = signInAs(createTestApp(), 'rich');

/*
 * NTC-02 testing setup.
 * A 500 ms delay is enabled only when the demo URL
 * includes ?delayMs=500.
 */
const delayMs = Number(
  new URLSearchParams(window.location.search).get('delayMs') || 0
);

if (delayMs === 500) {
  const originalUpdate =
    app.shelterStore.updateCapacity.bind(app.shelterStore);

  app.shelterStore.updateCapacity = async (...args) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return originalUpdate(...args);
  };
}

function HoangDemo() {
  const [screen, setScreen] = useState('capacity');

  return (
    <div>
      <nav className="flex gap-3 border-b border-line p-4">
        <button
          onClick={() => setScreen('capacity')}
          className="rounded border border-line px-4 py-2"
        >
          UC-1 Update Capacity
        </button>

        <button
          onClick={() => setScreen('history')}
          className="rounded border border-line px-4 py-2"
        >
          UC-2 Capacity History
        </button>
      </nav>

      {screen === 'capacity' ? (
        <UpdateCapacity app={app} />
      ) : (
        <CapacityHistory app={app} />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HoangDemo />
  </React.StrictMode>
);
