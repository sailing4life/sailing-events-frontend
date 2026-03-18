import { useSearchParams } from 'react-router-dom';

const RESPONSE_CONFIG = {
  yes: {
    icon: '✅',
    title: 'Bedankt voor je bevestiging!',
    detail: 'Je hebt aangegeven beschikbaar te zijn. Je ontvangt zo snel mogelijk officieel bericht of je bent ingedeeld.',
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
    <>
      <style>{`
        .respons-outer {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 40px;
          padding-bottom: 40px;
          box-sizing: border-box;
        }
        .respons-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .respons-title {
          color: #0891b2;
          margin-top: 0;
          font-size: 22px;
          line-height: 1.3;
        }
        .respons-detail {
          color: #374151;
          font-size: 16px;
          line-height: 1.6;
        }
        .respons-row {
          margin: 10px 0;
          font-size: 15px;
          line-height: 1.5;
        }
        .respons-footer {
          color: #64748b;
          font-size: 14px;
          margin-top: 28px;
          line-height: 1.6;
        }
        @media (max-width: 480px) {
          .respons-outer {
            padding: 12px;
            padding-top: 20px;
            padding-bottom: 20px;
            align-items: flex-start;
          }
          .respons-card {
            padding: 24px 20px;
            border-radius: 10px;
          }
          .respons-title {
            font-size: 20px;
          }
          .respons-detail {
            font-size: 15px;
          }
          .respons-row {
            font-size: 14px;
          }
        }
      `}</style>
      <div className="respons-outer">
        <div className="respons-card">
          {config ? (
            <>
              <h1 className="respons-title">{config.icon} {config.title}</h1>
              <p className="respons-detail">{config.detail}</p>

              <div style={{
                background: config.bg,
                borderLeft: `4px solid ${config.border}`,
                padding: '14px 16px',
                margin: '20px 0',
                borderRadius: 4,
              }}>
                {eventName && (
                  <div className="respons-row">
                    <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Event:</span> {eventName}
                  </div>
                )}
                {datum && (
                  <div className="respons-row">
                    <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Datum:</span> {datum}
                  </div>
                )}
                {rol && (
                  <div className="respons-row">
                    <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Rol:</span> {rol}
                  </div>
                )}
                <div className="respons-row">
                  <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Je response:</span>{' '}
                  <strong style={{ color: config.color }}>{config.label}</strong>
                </div>
                {r === 'maybe' && note && (
                  <div className="respons-row">
                    <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>Je toelichting:</span> {note}
                  </div>
                )}
              </div>

              <p className="respons-footer">
                Je kunt deze pagina nu sluiten. Bij vragen kun je contact opnemen via het opgegeven contactadres.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ color: '#dc2626', marginTop: 0, fontSize: 22 }}>❌ Ongeldige link</h1>
              <p style={{ color: '#374151' }}>Deze pagina kon niet worden geladen. Probeer de link in de e-mail opnieuw te openen.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
