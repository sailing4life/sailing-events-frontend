import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventsApi, eventTypesApi } from '../services/api';
import type { Event, EventTypeConfig } from '../types';
import { toast } from 'sonner';

interface EventFormData {
  event_name: string;
  company_name: string;
  event_date: string;
  duration: 'half_day' | 'morning' | 'afternoon' | 'full_day';
  event_type: string;
  notes: string;
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
  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    company_name: '',
    event_date: '',
    duration: 'full_day',
    event_type: '',
    notes: '',
    required_race_directors: 0,
    required_coaches: 0,
  });

  useEffect(() => {
    loadEvent();
    loadEventTypes();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;

    try {
      const data = await eventsApi.getById(parseInt(id));
      setEvent(data);

      // Pre-fill form with existing data
      setFormData({
        event_name: data.event_name,
        company_name: data.company_name,
        event_date: data.event_date,
        duration: data.duration,
        event_type: data.event_type,
        notes: data.notes || '',
        required_race_directors: data.required_race_directors || 0,
        required_coaches: data.required_coaches || 0,
      });
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Fout bij het laden van het event');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadEventTypes = async () => {
    try {
      const data = await eventTypesApi.getAll();
      setEventTypes(data);
    } catch (error) {
      console.error('Error loading event types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    setSubmitting(true);
    try {
      await eventsApi.update(parseInt(id), {
        event_name: formData.event_name,
        company_name: formData.company_name,
        event_date: formData.event_date,
        duration: formData.duration,
        event_type: formData.event_type,
        notes: formData.notes || undefined,
        required_race_directors: formData.required_race_directors,
        required_coaches: formData.required_coaches,
      });

      toast.success('Event succesvol bijgewerkt!');
      navigate(`/events/${id}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het bijwerken van het event';
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
        <Link to="/" className="text-cyan-600 hover:text-cyan-700">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to={`/events/${id}`} className="text-cyan-600 hover:text-cyan-700 text-sm mb-2 inline-block">
          ← Terug naar event details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Bewerken</h1>
        <p className="text-gray-600">Wijzig de details van het event (boten en schippers kunnen niet gewijzigd worden)</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Naam *
            </label>
            <input
              type="text"
              required
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              className="input-field"
              placeholder="Bijv. Teambuilding Zomerdag"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrijfsnaam *
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="input-field"
              placeholder="Bijv. Acme Corporation"
            />
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum *
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duur *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
                className="input-field"
              >
                <option value="">-- Selecteer duur --</option>
                <option value="morning">☀️ Ochtend</option>
                <option value="afternoon">🌅 Middag</option>
                <option value="full_day">📅 Hele dag</option>
              </select>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Event *
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="input-field"
            >
              {eventTypes.length === 0 ? (
                <option value="" disabled>Geen types beschikbaar</option>
              ) : (
                eventTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wedstrijdleiding nodig
            </label>
            <input
              type="number"
              min="0"
              value={formData.required_race_directors}
              onChange={(e) => setFormData({
                ...formData,
                required_race_directors: Math.max(0, parseInt(e.target.value, 10) || 0)
              })}
              className="input-field"
            />
          </div>

          {formData.event_type === 'coaching' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coaches nodig
              </label>
              <input
                type="number"
                min="0"
                value={formData.required_coaches}
                onChange={(e) => setFormData({
                  ...formData,
                  required_coaches: Math.max(0, parseInt(e.target.value, 10) || 0)
                })}
                className="input-field"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={4}
              placeholder="Extra informatie over het event..."
            />
          </div>

          {/* Boat/Skipper Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Let op</p>
                <p className="text-sm text-blue-700 mt-1">
                  De toegewezen boten en schippers kunnen niet worden gewijzigd nadat het event is aangemaakt.
                  Als je de boot- of schippertoewijzingen wilt wijzigen, maak dan een nieuw event aan.
                </p>
              </div>
            </div>
          </div>

          {/* Current Boat/Skipper Assignments */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Huidige Toewijzingen</h3>
            <div className="space-y-2">
              {event.event_boats.map((eventBoat) => (
                <div key={eventBoat.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">⛵ {eventBoat.boat.name}</p>
                    {eventBoat.skipper && (
                      <p className="text-sm text-gray-600">
                        {eventBoat.skipper.first_name} {eventBoat.skipper.last_name}
                      </p>
                    )}
                  </div>
                  <span className={`badge ${
                    eventBoat.response_status === 'yes' ? 'badge-yes' :
                    eventBoat.response_status === 'no' ? 'badge-no' :
                    eventBoat.response_status === 'maybe' ? 'badge-maybe' :
                    'badge-pending'
                  }`}>
                    {
                      eventBoat.response_status === 'yes' ? '✓ Bevestigd' :
                      eventBoat.response_status === 'no' ? '✗ Afgewezen' :
                      eventBoat.response_status === 'maybe' ? '? Misschien' :
                      '⏳ Wachtend'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <Link
            to={`/events/${id}`}
            className="btn-secondary flex-1"
          >
            Annuleren
          </Link>
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
