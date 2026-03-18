import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface DropdownItem {
  path: string;
  label: string;
  icon: string;
}

function DropdownNav({
  label,
  icon,
  items,
  activePaths,
}: {
  label?: string;
  icon: string;
  items: DropdownItem[];
  activePaths: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = activePaths.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center space-x-1.5 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
          isActive
            ? 'border-ocean-600 text-ocean-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <span>{icon}</span>
        {label && <span>{label}</span>}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, minWidth: 170 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-ocean-600 bg-ocean-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>🏠</span><span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>📅</span><span>Events</span>
          </NavLink>

          <NavLink
            to="/skippers"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>⚓</span><span>Schippers</span>
          </NavLink>

          <DropdownNav
            icon="⛵"
            label="Boten"
            activePaths={['/boats', '/maintenance']}
            items={[
              { path: '/boats', label: 'Boten overzicht', icon: '⛵' },
              { path: '/maintenance', label: 'Onderhoud', icon: '🔧' },
            ]}
          />

          <NavLink
            to="/statistics"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>📊</span><span>Statistieken</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>🔔</span><span>Notificaties</span>
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>📄</span><span>Documenten</span>
          </NavLink>

          <DropdownNav
            icon="⚙️"
            activePaths={['/settings', '/info']}
            items={[
              { path: '/settings', label: 'Instellingen', icon: '⚙️' },
              { path: '/info', label: 'Info & handleiding', icon: 'ℹ️' },
            ]}
          />

        </div>
      </div>
    </nav>
  );
}
