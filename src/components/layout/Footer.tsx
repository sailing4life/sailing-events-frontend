export function Footer() {
  const version = "1.0.6";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500">
          <div>© {currentYear} Team Heiner Event Manager</div>
          <div>Versie {version}</div>
        </div>
      </div>
    </footer>
  );
}
