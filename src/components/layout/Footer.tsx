export function Footer() {
  const version = "1.0.1";
  const currentYear = new Date().getFullYear();
  const isStaging = import.meta.env.VITE_APP_ENV === 'staging';

  return (
    <>
      {isStaging && (
        <div className="bg-yellow-400 text-yellow-900 text-center text-sm font-semibold py-2 px-4">
          TEST OMGEVING — wijzigingen hier hebben geen effect op de echte data
        </div>
      )}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              © {currentYear} Team Heiner Event Manager
              {isStaging && <span className="ml-2 text-yellow-600 font-medium">(Test omgeving)</span>}
            </div>
            <div className="flex items-center gap-2">
              <span>Versie {version}</span>
              {isStaging && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">STAGING</span>}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
