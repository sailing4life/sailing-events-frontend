import type { Event, ResponseStatus, InvitationStatus } from '../../types';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: Event;
  eventTypeLabels?: Record<string, string>;
}

const getStatusBadge = (status: ResponseStatus) => {
  const badges = {
    pending: 'badge-pending',
    yes: 'badge-yes',
    no: 'badge-no',
    maybe: 'badge-maybe',
  };

  const labels = {
    pending: 'Wachtend',
    yes: 'Beschikbaar',
    no: 'Afgewezen',
    maybe: 'Misschien',
  };

  return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
};

const getInvitationStatusBadge = (status: InvitationStatus, isFinalized = false) => {
  if (isFinalized && (status === 'available' || status === 'maybe' || status === 'pending')) {
    return <span className="badge badge-no">— Niet geselecteerd</span>;
  }

  const badges = {
    pending: 'badge-pending',
    available: 'badge-yes',
    unavailable: 'badge-no',
    maybe: 'badge-maybe',
    confirmed: 'badge-yes',
  };

  const labels = {
    pending: 'Wachtend',
    available: 'Beschikbaar',
    unavailable: 'Niet beschikbaar',
    maybe: 'Misschien',
    confirmed: 'Bevestigd',
  };

  return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
};

const formatEventType = (type: string) => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getDurationLabel = (duration: string) => {
  const labels: { [key: string]: string } = {
    'half_day': 'Halve dag',
    'morning': '☀️ Ochtend',
    'afternoon': '🌅 Middag',
    'full_day': '📅 Hele dag'
  };
  return labels[duration] || 'Hele dag';
};

export function EventCard({ event, eventTypeLabels }: EventCardProps) {
  // Ensure invitations and event_boats are arrays (defensive check)
  const invitations = Array.isArray(event.invitations) ? event.invitations : [];
  const eventBoats = Array.isArray(event.event_boats) ? event.event_boats : [];

  // Use new invitation workflow if invitations exist, otherwise fall back to old workflow
  const useInvitations = invitations.length > 0;

  let availableCount = 0;
  let totalRequired = 0;
  let isComplete = false;

  if (useInvitations) {
    // New workflow: count available skippers (excluding race directors and coaches)
    const skipperInvitations = invitations.filter(inv => inv.role !== 'race_director' && inv.role !== 'coach');
    const raceDirectorInvitations = invitations.filter(inv => inv.role === 'race_director');
    const coachInvitations = invitations.filter(inv => inv.role === 'coach');
    const skipperAvailable = skipperInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
    const raceDirectorAvailable = raceDirectorInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
    const coachAvailable = coachInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
    const requiredSkippers = event.event_boats.length;
    const requiredRaceDirectors = event.required_race_directors || 0;
    const requiredCoaches = event.required_coaches || 0;
    availableCount = skipperAvailable + raceDirectorAvailable + coachAvailable;
    totalRequired = requiredSkippers + requiredRaceDirectors + requiredCoaches;
    isComplete = requiredSkippers > 0
      && skipperAvailable >= requiredSkippers
      && raceDirectorAvailable >= requiredRaceDirectors
      && coachAvailable >= requiredCoaches;
  } else {
    // Old workflow: use event_boats
    availableCount = eventBoats.filter(eb => eb.response_status === 'yes').length;
    totalRequired = eventBoats.length;
    isComplete = totalRequired > 0 && availableCount >= totalRequired;
  }

  const eventDate = new Date(event.event_date);
  const shortDate = eventDate.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedDate = eventDate.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Link to={`/events/${event.id}`} className="card block hover:scale-[1.02] transition-transform">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.event_name}</h3>
          <p className="text-sm text-gray-600">{event.company_name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
        {event.workflow_phase === 'finalized' ? (
          <span className="badge badge-yes">✓ Afgesloten</span>
        ) : isComplete ? (
          <span className="badge badge-complete">✓ Compleet</span>
        ) : (
          <span className="badge badge-available">{availableCount}/{totalRequired} Beschikbaar</span>
        )}
          <span className="badge badge-neutral">{shortDate}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {getDurationLabel(event.duration)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {eventTypeLabels?.[event.event_type] || formatEventType(event.event_type)}
        </div>
      </div>

      <div className="border-t pt-4">
        {useInvitations ? (
          // New workflow: show invitation statuses grouped by role
          <div className="space-y-3">
            {/* Schippers */}
            {(() => {
              const skipperInvs = invitations.filter(inv => inv.role === 'skipper' || inv.role === 'head_skipper');
              const confirmed = skipperInvs.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
              const required = event.event_boats.length;
              return skipperInvs.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    ⛵ Schippers <span className={confirmed >= required ? 'text-green-600' : 'text-amber-600'}>{confirmed}/{required}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skipperInvs.map((inv) => (
                      <div key={inv.id} className="flex items-center space-x-1">
                        <span className="text-sm text-gray-700">
                          {inv.skipper.first_name} {inv.skipper.last_name}
                          {inv.role === 'head_skipper' && ' 👑'}
                        </span>
                        {getInvitationStatusBadge(inv.status, event.workflow_phase === 'finalized')}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            {/* Wedstrijdleiders */}
            {(() => {
              const rdInvs = invitations.filter(inv => inv.role === 'race_director');
              const confirmed = rdInvs.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
              const required = event.required_race_directors || 0;
              return rdInvs.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    📋 Wedstrijdleiding <span className={confirmed >= required ? 'text-green-600' : 'text-amber-600'}>{confirmed}/{required}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rdInvs.map((inv) => (
                      <div key={inv.id} className="flex items-center space-x-1">
                        <span className="text-sm text-gray-700">{inv.skipper.first_name} {inv.skipper.last_name}</span>
                        {getInvitationStatusBadge(inv.status, event.workflow_phase === 'finalized')}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            {/* Coaches */}
            {(() => {
              const coachInvs = invitations.filter(inv => inv.role === 'coach');
              const confirmed = coachInvs.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
              const required = event.required_coaches || 0;
              return coachInvs.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    🏅 Coaches <span className={confirmed >= required ? 'text-green-600' : 'text-amber-600'}>{confirmed}/{required}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {coachInvs.map((inv) => (
                      <div key={inv.id} className="flex items-center space-x-1">
                        <span className="text-sm text-gray-700">{inv.skipper.first_name} {inv.skipper.last_name}</span>
                        {getInvitationStatusBadge(inv.status, event.workflow_phase === 'finalized')}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          // Old workflow: show boat statuses
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Schippers status:</p>
            <div className="flex flex-wrap gap-2">
              {eventBoats.map((eb) => (
                <div key={eb.id} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">{eb.boat.name}</span>
                  {getStatusBadge(eb.response_status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
