import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../services/api';
import type { Event, Invitation } from '../types';

const DURATION_LABEL: Record<string, string> = {
  half_day: 'Halve dag',
  morning: 'Ochtend',
  afternoon: 'Middag',
  full_day: 'Hele dag',
};

const ROLE_LABEL: Record<string, string> = {
  skipper: 'Schipper',
  head_skipper: 'Hoofdschipper',
  race_director: 'Wedstrijdleiding',
  coach: 'Coach',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function getAvailableUnconfirmed(invitations: Invitation[]) {
  return invitations.filter((i) => i.status === 'available');
}

function getPendingInvitations(invitations: Invitation[]) {
  return invitations.filter((i) => i.status === 'pending');
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: bg,
    }}>
      {label}
    </span>
  );
}

export function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.getAll().then((data) => {
      setEvents(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureEvents = events
    .filter((e) => new Date(e.event_date + 'T00:00:00') >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  // All events this month (past + future)
  const thisMonthEvents = events.filter((e) => {
    const d = new Date(e.event_date + 'T00:00:00');
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const needsConfirmation = futureEvents.filter(
    (e) => e.workflow_phase === 'invitation' && getAvailableUnconfirmed(e.invitations).length > 0
  );

  const awaitingResponse = futureEvents.filter(
    (e) => e.workflow_phase === 'invitation' && getPendingInvitations(e.invitations).length > 0
  );

  // Count people (not events) for the summary cards
  const needsConfirmationCount = needsConfirmation.reduce(
    (sum, e) => sum + getAvailableUnconfirmed(e.invitations).length, 0
  );
  const awaitingResponseCount = awaitingResponse.reduce(
    (sum, e) => sum + getPendingInvitations(e.invitations).length, 0
  );

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Laden...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c4a6e', marginBottom: 20 }}>
        Dashboard
      </h1>

      {/* 3-column layout: cards | action sections | upcoming events */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1.6fr', gap: 16, alignItems: 'start' }}>

        {/* Column 1: summary cards stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SummaryCard icon="📅" value={thisMonthEvents.length} label="Events deze maand" color="#0891b2" bg="#f0f9ff" />
          <SummaryCard icon="✅" value={needsConfirmationCount} label="Schippers te bevestigen" color="#16a34a" bg="#f0fdf4" highlight={needsConfirmationCount > 0} />
          <SummaryCard icon="⏳" value={awaitingResponseCount} label="Openstaande uitvragen" color="#d97706" bg="#fffbeb" />
          <SummaryCard icon="📋" value={futureEvents.length} label="Aankomende events" color="#7c3aed" bg="#faf5ff" />
        </div>

        {/* Column 2: te bevestigen + wacht op reactie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Section title="✅ Te bevestigen" accent="#16a34a">
            {needsConfirmation.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '10px 16px', margin: 0, fontSize: 13 }}>Geen acties nodig.</p>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {needsConfirmation.map((event) => {
                  const available = getAvailableUnconfirmed(event.invitations);
                  return (
                    <EventRow key={event.id} event={event}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {available.map((inv) => (
                          <StatusBadge
                            key={inv.id}
                            label={`${inv.skipper.first_name} ${inv.skipper.last_name} (${ROLE_LABEL[inv.role] ?? inv.role})`}
                            color="#15803d"
                            bg="#dcfce7"
                          />
                        ))}
                      </div>
                    </EventRow>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="⏳ Wacht op reactie" accent="#d97706">
            {awaitingResponse.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '10px 16px', margin: 0, fontSize: 13 }}>Geen openstaande uitvragen.</p>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {awaitingResponse.map((event) => {
                  const pending = getPendingInvitations(event.invitations);
                  return (
                    <EventRow key={event.id} event={event}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {pending.map((inv) => (
                          <StatusBadge
                            key={inv.id}
                            label={`${inv.skipper.first_name} ${inv.skipper.last_name}`}
                            color="#92400e"
                            bg="#fef3c7"
                          />
                        ))}
                      </div>
                    </EventRow>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Column 3: upcoming events */}
        <Section title="📅 Aankomende events" accent="#0891b2">
          {futureEvents.length === 0 ? (
            <p style={{ color: '#94a3b8', padding: '12px 16px', margin: 0, fontSize: 13 }}>Geen aankomende events.</p>
          ) : (
            <>
              <div style={{ maxHeight: 560, overflowY: 'auto' }}>
                {futureEvents.slice(0, 12).map((event) => (
                  <EventRow key={event.id} event={event}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 3 }}>
                      <PhaseChip phase={event.workflow_phase} />
                      {event.invitations.length > 0 && (
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {event.invitations.filter((i) => i.status === 'confirmed').length}/{event.invitations.length} bevestigd
                        </span>
                      )}
                    </div>
                  </EventRow>
                ))}
              </div>
              {futureEvents.length > 12 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>
                  + {futureEvents.length - 12} meer —{' '}
                  <Link to="/events" style={{ color: '#0891b2' }}>Bekijk alle events →</Link>
                </div>
              )}
            </>
          )}
        </Section>

      </div>
    </div>
  );
}

function SummaryCard({
  icon, value, label, color, bg, highlight = false,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${highlight ? color : 'transparent'}`,
      borderRadius: 10,
      padding: '14px 18px',
      boxShadow: highlight ? `0 0 0 2px ${color}22` : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 24, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Section({
  title, accent, children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 10,
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        borderLeft: `4px solid ${accent}`,
        padding: '12px 20px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        fontWeight: 600,
        fontSize: 14,
        color: '#1e293b',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function EventRow({ event, children }: { event: Event; children?: React.ReactNode }) {
  const days = daysUntil(event.event_date);
  return (
    <Link
      to={`/events/${event.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.event_name}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>
              {event.company_name} · {formatDate(event.event_date)} · {DURATION_LABEL[event.duration] ?? event.duration}
            </div>
          </div>
          <DaysBadge days={days} />
        </div>
        {children}
      </div>
    </Link>
  );
}

function DaysBadge({ days }: { days: number }) {
  if (days === 0) return <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '2px 7px', borderRadius: 10 }}>Vandaag</span>;
  if (days === 1) return <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: 10 }}>Morgen</span>;
  if (days <= 7) return <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: 10 }}>over {days} d</span>;
  if (days <= 30) return <span style={{ flexShrink: 0, fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: 10 }}>over {days} d</span>;
  return <span style={{ flexShrink: 0, fontSize: 11, color: '#94a3b8', background: '#f8fafc', padding: '2px 7px', borderRadius: 10 }}>over {days} d</span>;
}

function PhaseChip({ phase }: { phase: string }) {
  if (phase === 'finalized') {
    return <StatusBadge label="Definitief" color="#1d4ed8" bg="#eff6ff" />;
  }
  return <StatusBadge label="Uitvraag loopt" color="#7c3aed" bg="#f5f3ff" />;
}
