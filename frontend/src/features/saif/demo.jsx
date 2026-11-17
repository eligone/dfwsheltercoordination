/** Saif Yusuff: UC-8/UC-10 browser entry; isolated mock service instance, no production integration. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { createApp } from '../../services/index.js';
import SharedDashboard from './SharedDashboard.jsx';

// Explicit fixture mode reproduces the assignment clock; normal preview uses the current time.
const params = new URLSearchParams(window.location.search);
// Export the mock instance for browser fixture tests; no production service is exposed.
export const app = createApp(params.get('fixture') === 'true' ? { clock: { now: () => new Date('2026-11-04T10:00:00Z') } } : {});
if (params.get('scenario') === 'empty') app.state.shelters = [];
createRoot(document.getElementById('root')).render(<StrictMode><SharedDashboard app={app} initialPage={params.get('view')} initialRequestID={params.get('request')} /></StrictMode>);
