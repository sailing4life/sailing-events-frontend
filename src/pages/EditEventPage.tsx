import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventsApi, eventTypesApi, boatsApi } from '../services/api';
import type { Event, EventTypeConfig, Boat } from '../types';
import { toast } from 'sonner';

interface EventFormData {
  event_name: string;
  company_name: string;
  event_date: string;
  duration: 'half_day' | 'morning' | 'afternoon' | 'full_day';
  event_type: string;
  notes: string;
  start_time: string;
  end_time: string;
  required_race_directors: number;
  required_coaches: number;
}

export function EditEventPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoatIds, setSelectedBoatIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    company_name: '',
    event_date: '',
    duration: 'full_day',
    event_type: '',
    notes: '',
    start_time: '',
    end_time: '',
    required_race_directors: 0,
    required_coaches: 0,
  });

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    if (!id) return;
    try {
      const [eventData, eventTypesData, boatsData] = await Promise.all([
        eventsApi.getById(parseInt(id)),
        eventTypesApi.getAll(),
        boatsApi.getAll(),
      ]);

      setEvent(eventData);
      setEventTypes(eventTypesData);
      setBoats(boatsData.filter(b => b.is_active));

      setFormData({
        event_name: eventData.event_name,
        company_name: eventData.company_name,
        event_date: eventData.event_date,
        duration: eventData.duration,
        event_type: eventData.event_type,
        notes: eventData.notes || '',
        start_time: eventData.start_time || '',
        end_time: eventData.end_time || '',
        required_race_directors: eventData.required_race_directors || 0,
        required_coaches: eventData.required_coaches || 0,
      });

      // Pre-select current boats
      setSelectedBoatIds(eventData.event_boats.map((eb: any) => eb.boat.id));
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Fout bij het laden van het event');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const defaultTimes: Record<string, { start: string; end: string }> = {
    morning:   { start: '09:00', end: '13:00' },
    afternoon: { start: '13:00', end: '17:00' },
    full_day:  { start: '09:00', end: '17:00' },
    half_day:  { start: '09:00', end: '13:00' },
  };

  const handleDurationChange = (duration: string) => {
    const times = defaultTimes[duration];
    setFormData({ ...formData, duration: duration as any, start_time: times?.start ?? '', end_time: times?.end ?? '' });
  };

  const toggleBoat = (boatId: number) => {
    setSelectedBoatIds(prev =>
      prev.includes(boatId) ? prev.filter(id => id !== boatId) : [...prev, boatId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (selectedBoatIds.length === 0) {
      toast.error('Selecteer minimaal één boot');
      return;
    }

    setSubmitting(true);
    try {
      await eventsApi.update(parseInt(id), {
        event_name: formData.event_name,
        company_name: formData.company_name,
        event_date: formData.event_date,
        duration: formData.duration,
        event_type: formData.event_type,
        notes: formData.notes || undefined,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        required_race_directors: formData.required_race_directors,
        required_coaches: formData.required_coaches,
        boat_ids: selectedBoatIds,
      });

      toast.success('Event succesvol bijgewerkt!');
      navigate(`/events/${id}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      const detail = error.response?.data?.detail;
      const errorMessage = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ')
          : 'Fout bij het bijwerken van het event';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Event niet gevonden</h2>
        <Link to="/" className="text-cyan-600 hover:text-cyan-700">Terug naar overzicht</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to={`/events/${id}`} className="text-cyan-600 hover:text-cyan-700 text-sm mb-2 inline-block">
          ← Terug naar event details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Bewerken</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Naam *</label>
            <input
              type="text"
              required
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bedrijfsnaam *</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Datum *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duur *</label>
              <select
                value={formData.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="input-field"
              >
                <option value="half_day">🕐 Halve dag</option>
                <option value="morning">☀️ Ochtend</option>
                <option value="afternoon">🌅 Middag</option>
                <option value="full_day">📅 Hele dag</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type Event *</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="input-field"
            >
              {eventTypes.map((type) => (
                <option key={type.code} value={type.code}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Wedstrijdleiding nodig</label>
            <input
              type="number"
              min="0"
              value={formData.required_race_directors}
              onChange={(e) => setFormData({ ...formData, required_race_directors: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="input-field"
            />
          </div>

          {formData.event_type === 'coaching' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coaches nodig</label>
              <input
                type="number"
                min="0"
                value={formData.required_coaches}
                onChange={(e) => setFormData({ ...formData, required_coaches: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="input-field"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Starttijd (optioneel)</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eindtijd (optioneel)</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notities (optioneel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={4}
            />
          </div>

          {/* Boat selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boten * <span className="text-gray-500 font-normal">({selectedBoatIds.length} geselecteerd)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {boats.map((boat) => {
                const selected = selectedBoatIds.includes(boat.id);
                return (
                  <button
                    key={boat.id}
                    type="button"
                    onClick={() => toggleBoat(boat.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selected
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">⛵ {boat.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{boat.boat_type} · {boat.capacity} pers.</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t">
          <Link to={`/events/${id}`} className="btn-secondary flex-1">Annuleren</Link>
          <button
            type="submit"
            disabled={submitting}
            className={`btn-primary flex-1 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
}
