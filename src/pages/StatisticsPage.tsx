import { useState, useEffect } from 'react';
import { statisticsApi } from '../services/api';

interface Statistics {
  year: number;
  total_events: number;
  boat_days: number;
  boat_days_by_event_type: Array<{
    event_type: string;
    label?: string;
    boat_days: number;
  }>;
  boat_usage: Array<{
    id: number;
    name: string;
    boat_type: string;
    times_used: number;
  }>;
  skipper_participation: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    times_participated: number;
  }>;
  event_types: Array<{
    event_type: string;
    label?: string;
    count: number;
  }>;
}

export function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await statisticsApi.getOverview();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Geen statistieken beschikbaar</h2>
      </div>
    );
  }

  const maxBoatUsage = Math.max(...statistics.boat_usage.map(b => b.times_used), 1);
  const maxSkipperParticipation = Math.max(...statistics.skipper_participation.map(s => s.times_participated), 1);
  const maxEventTypeCount = Math.max(...statistics.event_types.map(e => e.count), 1);
  const formatCount = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1));
  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      event: '#06b6d4',
      teamwork: '#8b5cf6',
      coaching: '#10b981',
      training: '#f59e0b',
      other: '#6b7280',
    };
    return colors[type] || '#06b6d4';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistieken {statistics.year}</h1>
        <p className="text-gray-600">Overzicht van je events, boten en schippers dit jaar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-cyan-500 to-cyan-700 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Events Dit Jaar</h3>
          <p className="text-4xl font-bold">{formatCount(statistics.total_events)}</p>
          <p className="text-sm opacity-75 mt-1">Totaal in {statistics.year}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Boot Dagen</h3>
          <p className="text-4xl font-bold">{formatCount(statistics.boat_days)}</p>
          <p className="text-sm opacity-75 mt-1">Totaal in {statistics.year}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Actieve Schippers</h3>
          <p className="text-4xl font-bold">{statistics.skipper_participation.length}</p>
          <p className="text-sm opacity-75 mt-1">Bevestigd dit jaar</p>
        </div>
      </div>

      {/* Boat Usage */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Boot Gebruik</h2>
        {statistics.boat_usage.length > 0 ? (
          <div className="space-y-4">
            {statistics.boat_usage.map((boat) => (
              <div key={boat.id}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">⛵ {boat.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({boat.boat_type})</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCount(boat.times_used)} keer
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-cyan-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(boat.times_used / maxBoatUsage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nog geen boten gebruikt dit jaar</p>
        )}
      </div>

      {/* Boat Days per Event Type */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Boot Dagen per Event Type</h2>
        {statistics.boat_days_by_event_type.length > 0 ? (
          <div className="space-y-4">
            {statistics.boat_days_by_event_type.map((item) => (
              <div key={item.event_type}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.label || formatEventType(item.event_type)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCount(item.boat_days)} dagen
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(item.boat_days / statistics.boat_days) * 100}%`,
                      backgroundColor: getEventTypeColor(item.event_type)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nog geen boot dagen dit jaar</p>
        )}
      </div>

      {/* Skipper Participation */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Schipper Deelname</h2>
        {statistics.skipper_participation.length > 0 ? (
          <div className="space-y-4">
            {statistics.skipper_participation.map((skipper) => (
              <div key={skipper.id}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {skipper.first_name} {skipper.last_name}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">{skipper.email}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCount(skipper.times_participated)} keer
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(skipper.times_participated / maxSkipperParticipation) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nog geen bevestigde schippers dit jaar</p>
        )}
      </div>

      {/* Event Types */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Types</h2>
        {statistics.event_types.length > 0 ? (
          <div className="space-y-4">
            {statistics.event_types.map((eventType) => (
              <div key={eventType.event_type}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {eventType.label || formatEventType(eventType.event_type)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCount(eventType.count)} events
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(eventType.count / maxEventTypeCount) * 100}%`,
                      backgroundColor: getEventTypeColor(eventType.event_type)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nog geen events dit jaar</p>
        )}
      </div>
    </div>
  );
}
