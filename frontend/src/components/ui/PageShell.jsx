import { createContext, useContext } from 'react';
import NavBar from './NavBar.jsx';

export const NavigationContext = createContext(null);

// Full-page layout: NavBar + page title + primary actions top-right.
// Use it when a frame should show the whole page; skip it for section crops.
export default function PageShell({ nav, title, subtitle, actions, unread, children }) {
  const navigation = useContext(NavigationContext);
  return (
    <div className="min-h-full bg-canvas">
      <NavBar active={nav} unread={unread} {...navigation} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {(title || actions) && (
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
