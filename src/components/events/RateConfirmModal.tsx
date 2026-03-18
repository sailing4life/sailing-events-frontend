import { useState } from 'react';

interface Participant {
  invitationId: number;
  name: string;
  role: string;
  rate: number;
}

interface Props {
  participants: Participant[];
  title: string;
  confirmLabel: string;
  onConfirm: (rates: Record<number, number>) => void;
  onCancel: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  skipper: 'Schipper',
  head_skipper: 'Hoofdschipper',
  race_director: 'Wedstrijdleiding',
  coach: 'Coach',
};

export function RateConfirmModal({ participants, title, confirmLabel, onConfirm, onCancel }: Props) {
  const [rates, setRates] = useState<Record<number, number>>(
    Object.fromEntries(participants.map(p => [p.invitationId, p.rate]))
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>
          Controleer het tarief{participants.length > 1 ? ' per deelnemer' : ''} en pas aan indien nodig.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {participants.map(p => (
            <div key={p.invitationId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{ROLE_LABELS[p.role] || p.role}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates[p.invitationId]}
                  onChange={e => setRates(r => ({ ...r, [p.invitationId]: parseFloat(e.target.value) || 0 }))}
                  style={{ width: 90, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, fontWeight: 600, textAlign: 'right' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 14, color: '#374151' }}
          >
            Annuleren
          </button>
          <button
            onClick={() => onConfirm(rates)}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#0891b2', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
