import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';

interface EventCalendarViewProps {
  events: Event[];
}

const getDurationLabel = (duration: string) => {
  const labels: Record<string, string> = {
    half_day: 'Halve dag',
    morning: 'Ochtend',
    afternoon: 'Middag',
    full_day: 'Hele dag',
  };
  return labels[duration] || duration;
};

function getEventStatus(event: Event): 'finalized' | 'complete' | 'pending' {
  const invitations = Array.isArray(event.invitations) ? event.invitations : [];
  const eventBoats = Array.isArray(event.event_boats) ? event.event_boats : [];
  const useInvitations = invitations.length > 0;

  if (event.workflow_phase === 'finalized') return 'finalized';

  if (useInvitations) {
    const skipperInvitations = invitations.filter(inv => inv.role !== 'race_director' && inv.role !== 'coach');
    const raceDirectorInvitations = invitations.filter(inv => inv.role === 'race_director');
    const coachInvitations = invitations.filter(inv => inv.role === 'coach');
    const skipperAvailable = skipperInvitations.filter(
      inv => inv.status === 'available' || inv.status === 'confirmed'
    ).length;
    const raceDirectorAvailable = raceDirectorInvitations.filter(
      inv => inv.status === 'available' || inv.status === 'confirmed'
    ).length;
    const coachAvailable = coachInvitations.filter(
      inv => inv.status === 'available' || inv.status === 'confirmed'
    ).length;
    const requiredSkippers = eventBoats.length;
    const requiredRaceDirectors = event.required_race_directors || 0;
    const requiredCoaches = event.required_coaches || 0;
    const isComplete =
      requiredSkippers > 0 &&
      skipperAvailable >= requiredSkippers &&
      raceDirectorAvailable >= requiredRaceDirectors &&
      coachAvailable >= requiredCoaches;
    return isComplete ? 'complete' : 'pending';
  }

  const availableCount = eventBoats.filter(eb => eb.response_status === 'yes').length;
  const totalRequired = eventBoats.length;
  return totalRequired > 0 && availableCount >= totalRequired ? 'complete' : 'pending';
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  finalized: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  complete: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  pending: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
};

export function EventCalendarView({ events }: EventCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6 (European week)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const monthLabel = currentDate.toLocaleDateString('nl-NL', {
    month: 'long',
    year: 'numeric',
  });

  // Build a map of day -> events for this month
  const eventsByDay: Record<number, Event[]> = {};
  events.forEach(event => {
    const d = new Date(event.event_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(event);
    }
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Vorige maand"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 capitalize min-w-[180px] text-center">
            {monthLabel}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Volgende maand"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Vandaag
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const dayEvents = day ? eventsByDay[day] || [] : [];
            const isToday = isCurrentMonth && day === todayDate;
            const isWeekend = idx % 7 >= 5;

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-r border-b last:border-r-0 p-1 ${
                  day === null ? 'bg-gray-50' : isWeekend ? 'bg-gray-50/50' : 'bg-white'
                }`}
              >
                {day !== null && (
                  <>
                    <div className={`text-sm font-medium mb-1 px-1 ${
                      isToday
                        ? 'bg-cyan-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                        : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map(event => {
                        const status = getEventStatus(event);
                        const colors = statusColors[status];
                        return (
                          <Link
                            key={event.id}
                            to={`/events/${event.id}`}
                            className={`block px-1.5 py-0.5 rounded text-xs truncate border ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity`}
                            title={`${event.event_name} - ${event.company_name} (${getDurationLabel(event.duration)})`}
                          >
                            {event.event_name}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-green-300 bg-green-50"></span>
          Afgesloten
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-yellow-300 bg-yellow-50"></span>
          Compleet
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-red-300 bg-red-50"></span>
          Wachtend
        </div>
      </div>
    </div>
  );
}
