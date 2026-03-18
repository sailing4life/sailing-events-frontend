export function InfoPage() {
  const sections = [
    {
      title: 'Hoe werkt het uitnodigingssysteem?',
      content: [
        {
          subtitle: '1. Event aanmaken',
          text: 'Maak een nieuw event aan via "Events → Nieuw event". Vul de datum, bedrijf, type en benodigde rollen in (schippers, wedstrijdleiding, coaches).',
        },
        {
          subtitle: '2. Uitnodigingen versturen',
          text: 'Open het event en klik op "Uitnodigingen versturen". Selecteer welke schippers je wilt uitnodigen per rol. Ze ontvangen een email met drie knoppen: Ja / Nee / Misschien.',
        },
        {
          subtitle: '3. Responses bijhouden',
          text: 'De event detailpagina ververst automatisch elke 30 seconden. Je ziet per schipper de status: Wachtend / Beschikbaar / Niet beschikbaar / Misschien. Je krijgt ook een notificatie zodra iemand reageert.',
        },
        {
          subtitle: '4. Schippers bevestigen',
          text: 'Klik op "Bevestig" naast een beschikbare schipper om ze definitief te selecteren. Ze ontvangen dan een bevestigingsmail met event details en tarief.',
        },
        {
          subtitle: '5. Event finaliseren',
          text: 'Als alle rollen gevuld zijn, klik je op "Finaliseer event". Schippers die niet geselecteerd zijn ontvangen automatisch een beleefde afwijzingsmail.',
        },
      ],
    },
    {
      title: 'Invitation statussen',
      content: [
        { subtitle: 'Wachtend (grijs)', text: 'Uitnodiging verstuurd, schipper heeft nog niet gereageerd.' },
        { subtitle: 'Beschikbaar (groen)', text: 'Schipper heeft "Ja" geklikt in de email.' },
        { subtitle: 'Niet beschikbaar (rood)', text: 'Schipper heeft "Nee" geklikt.' },
        { subtitle: 'Misschien (geel)', text: 'Schipper heeft "Misschien" geklikt, eventueel met een toelichting.' },
        { subtitle: 'Bevestigd (donkerblauw)', text: 'Jij hebt de schipper definitief bevestigd via de "Bevestig" knop.' },
        { subtitle: 'Niet geselecteerd (grijs)', text: 'Event is gefinaliseerd maar deze schipper is niet gekozen.' },
      ],
    },
    {
      title: 'Rollen in een event',
      content: [
        { subtitle: 'Schipper', text: 'Vaart met een boot. Meerdere schippers per event mogelijk, één per boot.' },
        { subtitle: 'Hoofdschipper', text: 'Coördineert de schippers op het water. Eén per event.' },
        { subtitle: 'Wedstrijdleiding', text: 'Leidt de wedstrijd / regatta vanaf de wal of een tender. Eén per event.' },
        { subtitle: 'Coach', text: 'Begeleidt de deelnemers. Meerdere coaches per event mogelijk.' },
      ],
    },
    {
      title: 'Technische setup',
      content: [
        {
          subtitle: 'Backend',
          text: 'FastAPI (Python) draait lokaal op deze Windows PC. Start via start-backend.bat. Bereikbaar via cloudflared tunnel op https://api.teamheinerevents.nl.',
        },
        {
          subtitle: 'Frontend',
          text: 'React app gehost op Vercel. Bereikbaar via https://teamheinerevents.nl. Elke push naar de "sailing-events-frontend" GitHub repo triggert automatisch een nieuwe Vercel deploy.',
        },
        {
          subtitle: 'Database',
          text: 'PostgreSQL draait lokaal op poort 5432. Database naam: sailing_events. Verbinding via DATABASE_URL in backend/.env.',
        },
        {
          subtitle: 'Cloudflared tunnel',
          text: 'Maakt de lokale backend bereikbaar via internet zonder port forwarding. Start via tunnel-setup.bat of als Windows service. Config staat in cloudflared-config.yml.',
        },
        {
          subtitle: 'Email (Resend)',
          text: 'Emails worden verstuurd via Resend.com met het domein @teamheinerevents.nl. API key staat in backend/.env als RESEND_API_KEY.',
        },
      ],
    },
    {
      title: 'Database backup',
      content: [
        {
          subtitle: 'Handmatig backup maken',
          text: 'Dubbelklik op backend/backup.bat, of run: python backup_db.py in de backend map. Backups worden opgeslagen in backend/backups/ als .sql bestanden.',
        },
        {
          subtitle: 'Automatisch inplannen',
          text: 'Windows Task Scheduler → Create Basic Task → Daily → Program: venv/Scripts/python.exe, Arguments: backup_db.py, Start in: backend map.',
        },
        {
          subtitle: 'Backup locatie wijzigen',
          text: 'Open backend/backup_db.py en verander DEFAULT_BACKUP_DIR naar bijv. een OneDrive of externe schijf map. De laatste 30 backups worden bewaard.',
        },
        {
          subtitle: 'Database herstellen',
          text: 'Run: psql -h localhost -U postgres -d sailing_events -f backups/sailing_events_DATUM.sql',
        },
      ],
    },
    {
      title: 'Configuratie bestanden',
      content: [
        { subtitle: 'backend/.env', text: 'Alle geheime instellingen: database URL, email API key, wachtwoord hash, frontend URL, CORS origins. Nooit committen naar Git.' },
        { subtitle: 'backend/app/services/email_service.py', text: 'De HTML inhoud van alle emails die verstuurd worden (uitnodiging, bevestiging, afwijzing, herinneringen).' },
        { subtitle: 'frontend/src/pages/ResponsPage.tsx', text: 'De bevestigingspagina die schippers zien nadat ze op ja/nee/misschien hebben geklikt.' },
        { subtitle: 'backend/app/api/routes/invitations.py', text: 'Het "Misschien" formulier (HTML pagina op de backend) en de redirect logica naar de frontend.' },
      ],
    },
    {
      title: 'GitHub repositories',
      content: [
        { subtitle: 'sailing4life/sailing-events-frontend', text: 'Frontend React code. Push hier naar main → Vercel deployt automatisch naar teamheinerevents.nl.' },
        { subtitle: 'sailing4life/sailing-events-backend', text: 'Backend FastAPI code. Na push: op de PC de backend herstarten om wijzigingen toe te passen.' },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Systeem Informatie</h1>
        <p className="text-gray-500 mt-1">Documentatie over hoe het systeem werkt — voor als je het later nog eens wil nalezen.</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-ocean-50 border-b border-ocean-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-ocean-800">{section.title}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {section.content.map((item) => (
                <div key={item.subtitle} className="px-6 py-4">
                  <div className="flex gap-4">
                    <div className="w-52 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-700">{item.subtitle}</span>
                    </div>
                    <p className="text-sm text-gray-600 flex-1">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center">
        Laatste update: maart 2026 — Team Heiner Event Manager
      </p>
    </div>
  );
}
