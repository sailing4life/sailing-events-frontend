export function Footer() {
  const version = "0.1.6";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>
            © {currentYear} Team Heiner Event Manager
          </div>
          <div className="flex items-center gap-2">
            <span>Versie {version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
