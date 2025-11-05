import React from 'react';
import { Routes, Route, Navigate, Link, NavLink, useLocation } from 'react-router-dom';
import IconsPage from './pages/icons';
import LabPage from './pages/lab';
import PadPage from './pages/pad';
import UxPage from './pages/ux';
import { ThemeToggle } from './components/ThemeToggle';
import { Heartbeat, ConstellationHUD } from '@gratiaos/presence-kernel';

function TopNav() {
  const base = 'inline-flex items-center gap-2 rounded-full border border-border bg-elev px-3 py-1.5 text-sm transition-colors';
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-md px-2 py-0.5 outline-none',
      isActive ? 'bg-accent text-inverse' : 'hover:bg-border/60',
      'focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    ].join(' ');

  return (
    <nav className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-lg font-semibold">
          Garden Core
        </Link>
        <span className="opacity-60">·</span>
        <span className="opacity-80 text-sm">Playground</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={base} role="navigation" aria-label="Pages">
          <NavLink to="/" className={linkCls}>
            Pad
          </NavLink>
          <NavLink to="/lab" className={linkCls}>
            Lab
          </NavLink>
          <NavLink to="/icons" className={linkCls}>
            Icons
          </NavLink>
          <NavLink to="/ux" className={linkCls}>
            UX
          </NavLink>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}

export default function App() {
  const location = useLocation();
  React.useEffect(() => {
    const bodyClasses = ['min-h-dvh', 'bg-surface', 'text-text'];
    document.body.classList.add(...bodyClasses);
    return () => {
      document.body.classList.remove(...bodyClasses);
    };
  }, []);

  React.useEffect(() => {
    const map: Record<string, string> = {
      '/': 'Garden Core · Pad',
      '/lab': 'Garden Core · Lab',
      '/icons': 'Garden Core · Icons',
      '/ux': 'Garden Core · UX',
    };
    // Exact match first, then prefix match for nested paths under /lab or /icons
    const exact = map[location.pathname];
    const pref = location.pathname.startsWith('/lab')
      ? map['/lab']
      : location.pathname.startsWith('/icons')
      ? map['/icons']
      : location.pathname.startsWith('/ux')
      ? map['/ux']
      : map['/'];
    document.title = exact ?? pref;
  }, [location.pathname]);

  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<PadPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/icons" element={<IconsPage />} />
        <Route path="/ux" element={<UxPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Heartbeat />
      <ConstellationHUD />
    </>
  );
}
