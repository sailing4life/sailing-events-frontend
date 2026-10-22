import type { Event, Invitation } from '../types/index.ts';

export function getEventStatus(event: Event) {
  const invitations = Array.isArray(event.invitations) ? event.invitations : [];
  const boats = Array.isArray(event.event_boats) ? event.event_boats : [];
  const invitedIds = new Set(invitations.map(inv => inv.skipper.id));
  // Keep legacy boat assignments when the event also has newer invitations.
  const legacyBoats = boats.filter(boat => boat.response_status === 'yes'
    && (!boat.skipper || !invitedIds.has(boat.skipper.id)));
  const legacyIds = legacyBoats.map(boat => boat.skipper?.id ?? `boat-${boat.id}`);
  const isSkipper = (inv: Invitation) => inv.role === 'skipper' || inv.role === 'head_skipper'
    || (inv.role === 'coach' && inv.skipper.is_skipper);
  const count = (people: Invitation[]) => ({
    skippers: new Set([...people.filter(isSkipper).map(inv => inv.skipper.id), ...legacyIds]).size,
    raceDirectors: new Set(people.filter(inv => inv.role === 'race_director').map(inv => inv.skipper.id)).size,
    coaches: new Set(people.filter(inv => inv.role === 'coach').map(inv => inv.skipper.id)).size,
  });
  const available = count(invitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed'));
  const confirmed = count(invitations.filter(inv => inv.status === 'confirmed'));
  const required = {
    skippers: boats.length,
    raceDirectors: event.required_race_directors || 0,
    coaches: event.required_coaches || 0,
  };
  const totalRequired = required.skippers + required.raceDirectors + required.coaches;
  const confirmedAttendance = event.workflow_phase === 'finalized'
    && invitations.some(inv => inv.status === 'confirmed');
  const coversRequirements = (people: typeof available) => (totalRequired > 0 || confirmedAttendance)
    && people.skippers >= required.skippers
    && people.raceDirectors >= required.raceDirectors
    && people.coaches >= required.coaches;
  const isComplete = coversRequirements(available);
  const allConfirmed = event.is_fully_staffed ?? coversRequirements(confirmed);
  const hasPending = invitations.some(inv => inv.status === 'pending')
    || boats.some(boat => boat.response_status === 'pending'
      && (!boat.skipper || !invitedIds.has(boat.skipper.id)));
  // Extra unanswered invitations do not undo an event's complete staffing.
  const status = isComplete ? 'complete' : hasPending ? 'pending' : 'available';
  const badges = {
    complete: { label: 'Compleet', className: 'badge badge-complete' },
    pending: { label: 'Wachtend', className: 'badge badge-pending' },
    available: { label: 'Beschikbaar', className: 'badge badge-available' },
  };
  return {
    ...badges[status], status, isComplete, allConfirmed, hasPending,
    available, confirmed, required, totalRequired,
    availableCount: available.skippers + available.raceDirectors + available.coaches,
  };
}
