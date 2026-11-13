// NFR-11: no more than three main tabs: Home, My Dogs, Settings (sitemap 4.1).
// Alerts/Notifications open from the bell (FR-22, FR-27 unread count).
export const NAV_ITEMS = ['Home', 'My Dogs', 'Settings'];

export default function NavBar({ active, user = 'Richardson Animal Shelter', unread = 0 }) {
  return (
    <nav className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <div className="flex items-center gap-8">
        <span className="font-bold">DFW Shelter Tracker</span>
        <ul className="flex gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <li
              key={item}
              className={`rounded-md px-3 py-1.5 ${item === active ? 'bg-accent text-accent-ink' : 'text-muted'}`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <span className={`relative rounded-md px-1.5 py-0.5 ${active === 'Alerts' ? 'bg-fill' : ''}`} aria-label="Alerts">
          🔔
          {unread > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-status-full px-1.5 text-[10px] text-white">{unread}</span>
          )}
        </span>
        <span className="text-muted">{user}</span>
      </div>
    </nav>
  );
}
