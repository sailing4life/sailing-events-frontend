import { useSearchParams } from 'react-router-dom';

const RESPONSE_CONFIG = {
  yes: {
    icon: '✅',
    title: 'Bedankt voor je bevestiging!',
    detail: 'Je hebt aangegeven beschikbaar te zijn. Je krijgt een bevestiging zodra het definitief is.',
    label: 'Beschikbaar',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#16a34a',
  },
  no: {
    icon: '📝',
    title: 'Bedankt voor je reactie.',
    detail: 'Je hebt aangegeven niet beschikbaar te zijn. Bedankt voor het laten weten.',
    label: 'Niet beschikbaar',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#dc2626',
  },
  maybe: {
    icon: '🤔',
    title: 'Bedankt voor je reactie.',
    detail: 'Je hebt aangegeven misschien beschikbaar te zijn. We nemen contact met je op om verder af te stemmen.',
    label: 'Misschien',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#d97706',
  },
} as const;

type ResponseKey = keyof typeof RESPONSE_CONFIG;

export function ResponsPage() {
  const [params] = useSearchParams();
  const r = params.get('r') as ResponseKey | null;
  const eventName = params.get('event') ?? '';
  const datum = params.get('datum') ?? '';
  const rol = params.get('rol') ?? '';
  const note = params.get('note') ?? '';

  const config = r && RESPONSE_CONFIG[r] ? RESPONSE_CONFIG[r] : null;

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      margin: 0,
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 10,
        padding: 40,
        maxWidth: 600,
        width: '100%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        {config ? (
          <>
            <h1 style={{ color: '#0891b2', marginTop: 0 }}>{config.icon} {config.title}</h1>
            <p style={{ color: '#374151' }}>{config.detail}</p>

            <div style={{
              background: config.bg,
              borderLeft: `4px solid ${config.border}`,
              padding: 15,
              margin: '20px 0',
              borderRadius: 4,
            }}>
              {eventName && (
                <div style={{ margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Event:</span> {eventName}
                </div>
              )}
              {datum && (
                <div style={{ margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Datum:</span> {datum}
                </div>
              )}
              {rol && (
                <div style={{ margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Rol:</span> {rol}
                </div>
              )}
              <div style={{ margin: '8px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Je response:</span>{' '}
                <strong style={{ color: config.color }}>{config.label}</strong>
              </div>
              {r === 'maybe' && note && (
                <div style={{ margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Je toelichting:</span> {note}
                </div>
              )}
            </div>

            <p style={{ color: '#64748b', fontSize: 14, marginTop: 30 }}>
              Je kunt deze pagina nu sluiten. Bij vragen kun je contact opnemen.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ color: '#dc2626', marginTop: 0 }}>❌ Ongeldige link</h1>
            <p>Deze pagina kon niet worden geladen. Probeer de link in de e-mail opnieuw te openen.</p>
          </>
        )}
      </div>
    </div>
  );
}
