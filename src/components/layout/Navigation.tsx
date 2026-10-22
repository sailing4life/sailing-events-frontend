import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const location = useLocation();
  const isActive = activePaths.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)
        && !menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      if (!ref.current) return;
      const bounds = ref.current.getBoundingClientRect();
      const width = Math.min(208, window.innerWidth - 16);
      const top = bounds.bottom + 4;
      setMenuPosition({
        top,
        left: Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8)),
        width,
        maxHeight: Math.max(0, window.innerHeight - top - 8),
      });
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={label || 'Instellingen'}
        aria-expanded={open}
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

      {open && menuPosition && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', ...menuPosition, zIndex: 100 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-y-auto"
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
        </div>,
        document.body,
      )}
    </div>
  );
}

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          <NavLink to="/maanduitvragen" className={({ isActive }) => `whitespace-nowrap px-3 py-4 text-sm font-medium border-b-2 ${isActive ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-gray-500'}`}>Maanduitvragen</NavLink>

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
