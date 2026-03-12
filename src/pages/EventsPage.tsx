import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, eventTypesApi } from '../services/api';
import { EventCard } from '../components/events/EventCard';
import { EventCalendarView } from '../components/events/EventCalendarView';
import { EventCardSkeleton } from '../components/common/Skeleton';
import type { Event, EventTypeConfig } from '../types';
import { toast } from 'sonner';

type ViewMode = 'cards' | 'list' | 'calendar';

function getEventStatus(event: Event): { label: string; className: string } {
  const invitations = Array.isArray(event.invitations) ? event.invitations : [];
  const eventBoats = Array.isArray(event.event_boats) ? event.event_boats : [];
  const useInvitations = invitations.length > 0;

  if (event.workflow_phase === 'finalized') {
    return { label: 'Afgesloten', className: 'badge badge-yes' };
  }

  const skipperInvitations = useInvitations ? invitations.filter(inv => inv.role !== 'race_director') : [];
  const raceDirectorInvitations = useInvitations ? invitations.filter(inv => inv.role === 'race_director') : [];
  const requiredSkippers = eventBoats.length;
  const requiredRaceDirectors = event.required_race_directors || 0;
  const availableSkippers = useInvitations
    ? skipperInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length
    : eventBoats.filter(eb => eb.response_status === 'yes').length;
  const availableRaceDirectors = useInvitations
    ? raceDirectorInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length
    : 0;
  const isComplete = requiredSkippers > 0
    && availableSkippers >= requiredSkippers
    && availableRaceDirectors >= requiredRaceDirectors;
  const hasPending = useInvitations
    ? invitations.some(inv => inv.status === 'pending')
    : eventBoats.some(eb => eb.response_status === 'pending');

  if (!hasPending && isComplete) return { label: 'Compleet', className: 'badge badge-complete' };
  if (hasPending) return { label: 'Wachtend', className: 'badge badge-pending' };
  return { label: 'Beschikbaar', className: 'badge badge-available' };
}

export function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'complete' | 'pending'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const [data, types] = await Promise.all([
        eventsApi.getAll(),
        eventTypesApi.getAll(),
      ]);
      setEvents(data);
      setEventTypes(types);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Fout bij het laden van events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.company_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const invitations = Array.isArray(event.invitations) ? event.invitations : [];
    const eventBoats = Array.isArray(event.event_boats) ? event.event_boats : [];
    const useInvitations = invitations.length > 0;

    const skipperInvitations = useInvitations
      ? invitations.filter(inv => inv.role !== 'race_director')
      : [];
    const raceDirectorInvitations = useInvitations
      ? invitations.filter(inv => inv.role === 'race_director')
      : [];
    const requiredSkippers = eventBoats.length;
    const requiredRaceDirectors = event.required_race_directors || 0;
    const availableSkippers = useInvitations
      ? skipperInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length
      : eventBoats.filter(eb => eb.response_status === 'yes').length;
    const availableRaceDirectors = useInvitations
      ? raceDirectorInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length
      : 0;
    const isComplete = requiredSkippers > 0
      && availableSkippers >= requiredSkippers
      && availableRaceDirectors >= requiredRaceDirectors;
    const hasPending = useInvitations
      ? invitations.some(inv => inv.status === 'pending')
      : eventBoats.some(eb => eb.response_status === 'pending');

    if (filterStatus === 'confirmed') {
      return event.workflow_phase === 'finalized';
    }
    if (filterStatus === 'complete') {
      // Show events where all responses are in (no pending), but not yet finalized
      return event.workflow_phase === 'invitation' && !hasPending && isComplete;
    }
    if (filterStatus === 'pending') {
      return hasPending;
    }
    return true;
  });

  const eventTypeLabels = eventTypes.reduce<Record<string, string>>((acc, type) => {
    acc[type.code] = type.label;
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const pastEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  }).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Beheer al je zeilevenementen op één plek</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
        <p className="text-gray-600">Beheer al je zeilevenementen op één plek</p>
      </div>

      {/* View Toggle and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek op event naam of bedrijf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 transition-colors ${viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              title="Kaart weergave"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              title="Lijst weergave"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 transition-colors ${viewMode === 'calendar' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              title="Kalender weergave"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Status filters */}
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-ocean-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alle ({events.length})
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Afgesloten
          </button>
          <button
            onClick={() => setFilterStatus('complete')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'complete'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Compleet
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Wachtend
          </button>
        </div>
      </div>
      {viewMode === 'cards' && (
        <div className="mb-8 flex flex-wrap gap-2 text-sm text-gray-600">
          <span className="badge badge-available">Beschikbaar</span>
          <span className="badge badge-complete">Compleet</span>
          <span className="badge badge-yes">Afgesloten</span>
          <span className="badge badge-pending">Wachtend</span>
        </div>
      )}

      {/* Events Display */}
      {viewMode === 'calendar' ? (
        <EventCalendarView events={filteredEvents} />
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Geen events gevonden</h3>
          <p className="mt-1 text-sm text-gray-500">Probeer een andere zoekopdracht of filter.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-8">
          {[{ title: 'Aankomende events', rows: upcomingEvents }, { title: 'Oude events', rows: pastEvents }].map(({ title, rows }) => (
            <div key={title}>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
              {rows.length === 0 ? (
                <div className="text-sm text-gray-500">Geen {title.toLowerCase()}</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Datum</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Event naam</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Bedrijf</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Boten</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {rows.map((event) => {
                        const status = getEventStatus(event);
                        return (
                          <tr
                            key={event.id}
                            onClick={() => navigate(`/events/${event.id}`)}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {new Date(event.event_date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{event.event_name}</td>
                            <td className="px-4 py-3 text-gray-700">{event.company_name}</td>
                            <td className="px-4 py-3 text-gray-700">{eventTypeLabels[event.event_type] || event.event_type}</td>
                            <td className="px-4 py-3 text-gray-700">{Array.isArray(event.event_boats) ? event.event_boats.length : 0}</td>
                            <td className="px-4 py-3">
                              <span className={status.className}>{status.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Aankomende events</h2>
            {upcomingEvents.length === 0 ? (
              <div className="text-sm text-gray-500">Geen aankomende events</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} eventTypeLabels={eventTypeLabels} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Oude events</h2>
            {pastEvents.length === 0 ? (
              <div className="text-sm text-gray-500">Geen oude events</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} eventTypeLabels={eventTypeLabels} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
