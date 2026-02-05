import { NavLink } from 'react-router-dom';

export function Navigation() {
  const navItems = [
    { path: '/', label: 'Events', icon: '📅' },
    { path: '/skippers', label: 'Schippers', icon: '⚓' },
    { path: '/boats', label: 'Boten', icon: '⛵' },
    { path: '/maintenance', label: 'Onderhoud', icon: '🔧' },
    { path: '/statistics', label: 'Statistieken', icon: '📊' },
    { path: '/notifications', label: 'Notificaties', icon: '🔔' },
    { path: '/settings', label: 'Instellingen', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-ocean-600 text-ocean-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
