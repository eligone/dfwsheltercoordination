import Button from './Button.jsx';

// NFR-11: no more than three main tabs: Home, My Dogs, Settings (sitemap 4.1).
// Alerts/Notifications open from the bell (FR-22, FR-27 unread count).
export const NAV_ITEMS = ['Home', 'My Dogs', 'Settings'];

export default function NavBar({ active, user = 'Richardson Animal Shelter', unread = 0, onNavigate, onSignOut }) {
  const alerts = (
    <>
      <span aria-hidden="true">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-status-full px-1.5 text-[10px] text-white">{unread}</span>
      )}
    </>
  );
  return (
    <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-6 py-3">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <span className="font-bold">DFW Shelter Tracker</span>
        <ul className="flex gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <li
              key={item}
              className={onNavigate ? undefined : `rounded-md px-3 py-1.5 ${item === active ? 'bg-accent text-accent-ink' : 'text-muted'}`}
            >
              {onNavigate ? (
                <Button size="sm" variant={item === active ? 'primary' : 'ghost'} aria-current={item === active ? 'page' : undefined} onClick={() => onNavigate(item)}>
                  {item}
                </Button>
              ) : item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-5 text-sm">
        {onNavigate ? (
          <Button variant="ghost" size="sm" className="relative" aria-label={`Alerts (${unread} unread)`} aria-current={active === 'Alerts' ? 'page' : undefined} onClick={() => onNavigate('Alerts')}>
            {alerts}
          </Button>
        ) : <span className={`relative rounded-md px-1.5 py-0.5 ${active === 'Alerts' ? 'bg-fill' : ''}`} aria-label="Alerts">{alerts}</span>}
        <span className="text-muted">{user}</span>
        {onSignOut && <Button variant="secondary" size="sm" onClick={onSignOut}>Sign out</Button>}
      </div>
    </nav>
  );
}
