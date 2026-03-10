import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boatsApi, skippersApi, eventTypesApi, eventsApi } from '../services/api';
import type { Boat, EventDuration, EventTypeConfig, HistoricalEventCreateInput, Skipper } from '../types';
import { toast } from 'sonner';

interface HistoricalEventFormData {
  event_name: string;
  company_name: string;
  event_date: string;
  duration: EventDuration;
  event_type: string;
  notes: string;
  required_race_directors: number;
  required_coaches: number;
  selected_boat_ids: number[];
  boat_assignments: Record<number, number | ''>;
  head_skipper_id: number | '';
  race_director_ids: number[];
  coach_ids: number[];
}

const durationOptions: Array<{ value: EventDuration; label: string }> = [
  { value: 'morning', label: 'Ochtend' },
  { value: 'afternoon', label: 'Middag' },
  { value: 'full_day', label: 'Hele dag' },
];

export function CreateHistoricalEventPage() {
  const navigate = useNavigate();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [skippers, setSkippers] = useState<Skipper[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<HistoricalEventFormData>({
    event_name: '',
    company_name: '',
    event_date: '',
    duration: 'full_day',
    event_type: '',
    notes: '',
    required_race_directors: 0,
    required_coaches: 0,
    selected_boat_ids: [],
    boat_assignments: {},
    head_skipper_id: '',
    race_director_ids: [],
    coach_ids: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [boatsData, skippersData, eventTypesData] = await Promise.all([
          boatsApi.getAll(),
          skippersApi.getAll(),
          eventTypesApi.getAll(),
        ]);
        setBoats(boatsData);
        setSkippers(skippersData);
        setEventTypes(eventTypesData);
        if (eventTypesData.length > 0) {
          const defaultType = eventTypesData.find((type) => type.code === 'event')?.code || eventTypesData[0].code;
          setFormData((prev) => ({
            ...prev,
            event_type: prev.event_type || defaultType,
            required_race_directors: prev.required_race_directors || (defaultType === 'training' ? 0 : 1),
          }));
        }
      } catch (error) {
        console.error('Error loading historical event data:', error);
        toast.error('Fout bij het laden van boten, schippers of event types');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const usedSkipperIds = new Set<number>();
  Object.values(formData.boat_assignments).forEach((skipperId) => {
    if (skipperId !== '') {
      usedSkipperIds.add(skipperId);
    }
  });
  if (formData.head_skipper_id !== '') {
    usedSkipperIds.add(formData.head_skipper_id);
  }
  formData.race_director_ids.forEach((skipperId) => usedSkipperIds.add(skipperId));
  formData.coach_ids.forEach((skipperId) => usedSkipperIds.add(skipperId));

  const toggleBoat = (boatId: number) => {
    setFormData((prev) => {
      const selected = prev.selected_boat_ids.includes(boatId)
        ? prev.selected_boat_ids.filter((id) => id !== boatId)
        : [...prev.selected_boat_ids, boatId];
      const nextAssignments = { ...prev.boat_assignments };
      if (!selected.includes(boatId)) {
        delete nextAssignments[boatId];
      } else if (!(boatId in nextAssignments)) {
        nextAssignments[boatId] = '';
      }

      return {
        ...prev,
        selected_boat_ids: selected,
        boat_assignments: nextAssignments,
      };
    });
  };

  const updateBoatAssignment = (boatId: number, skipperId: number | '') => {
    setFormData((prev) => ({
      ...prev,
      boat_assignments: {
        ...prev.boat_assignments,
        [boatId]: skipperId,
      },
    }));
  };

  const toggleRoleSelection = (field: 'race_director_ids' | 'coach_ids', skipperId: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(skipperId)
        ? prev[field].filter((id) => id !== skipperId)
        : [...prev[field], skipperId],
    }));
  };

  const getAvailableSkippersForBoat = (boatId: number) => {
    const currentSelection = formData.boat_assignments[boatId];
    return skippers.filter((skipper) => {
      if (!skipper.is_skipper) return false;
      if (currentSelection === skipper.id) return true;
      return !usedSkipperIds.has(skipper.id);
    });
  };

  const getAvailableRoleSkippers = (predicate: (skipper: Skipper) => boolean, currentIds: number[]) => {
    return skippers.filter((skipper) => {
      if (!predicate(skipper)) return false;
      if (currentIds.includes(skipper.id)) return true;
      return !usedSkipperIds.has(skipper.id);
    });
  };

  const selectedBoats = boats.filter((boat) => formData.selected_boat_ids.includes(boat.id));
  const selectedAssignments = selectedBoats.map((boat) => ({
    boat,
    skipperId: formData.boat_assignments[boat.id] ?? '',
  }));

  const handleSubmit = async () => {
    const payload: HistoricalEventCreateInput = {
      event_name: formData.event_name,
      company_name: formData.company_name,
      event_date: formData.event_date,
      duration: formData.duration,
      event_type: formData.event_type,
      notes: formData.notes || undefined,
      required_race_directors: formData.required_race_directors,
      required_coaches: formData.required_coaches,
      boat_assignments: selectedAssignments.map(({ boat, skipperId }) => ({
        boat_id: boat.id,
        skipper_id: skipperId === '' ? undefined : skipperId,
      })),
      head_skipper_id: formData.head_skipper_id === '' ? undefined : formData.head_skipper_id,
      race_director_ids: formData.race_director_ids,
      coach_ids: formData.coach_ids,
    };

    setSubmitting(true);
    try {
      const event = await eventsApi.createHistorical(payload);
      toast.success('Historisch event opgeslagen zonder uitnodigingen of mails');
      navigate(`/events/${event.id}`);
    } catch (error: any) {
      console.error('Error creating historical event:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het opslaan van het historische event';
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/events/new" className="text-cyan-600 hover:text-cyan-700 text-sm inline-block mb-2">
            Normale event wizard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historisch Event Invoeren</h1>
          <p className="text-gray-600">
            Sla een oud event direct op met aanwezigen en boottoewijzingen, zonder uitnodigingen of mails.
          </p>
        </div>
        <Link to="/events/new" className="btn-secondary whitespace-nowrap">
          Normaal event
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-900 font-medium mb-1">Deze flow omzeilt mailstappen</p>
        <p className="text-sm text-amber-800">
          Het event wordt meteen als afgerond opgeslagen. Gebruik dit alleen voor events die al geweest zijn.
        </p>
      </div>

      <div className="card space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Event informatie</h2>
            <p className="text-sm text-gray-600 mt-1">Basisgegevens voor het historische event.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event naam</label>
              <input
                type="text"
                value={formData.event_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, event_name: e.target.value }))}
                className="input-field"
                placeholder="Bijv. Bedrijfsregatta september"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
                className="input-field"
                placeholder="Bijv. Acme BV"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duur</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value as EventDuration }))}
                className="input-field"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event type</label>
              <select
                value={formData.event_type}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    event_type: nextType,
                    required_race_directors: nextType === 'training' ? 0 : prev.required_race_directors,
                    required_coaches: ['academie', 'proces'].includes(nextType) ? prev.required_coaches : 0,
                    coach_ids: ['academie', 'proces'].includes(nextType) ? prev.coach_ids : [],
                  }));
                }}
                className="input-field"
              >
                {eventTypes.map((type) => (
                  <option key={type.id} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wedstrijdleiding nodig</label>
              <input
                type="number"
                min="0"
                value={formData.required_race_directors}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  required_race_directors: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))}
                className="input-field"
              />
            </div>
            {['academie', 'proces'].includes(formData.event_type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coaches nodig</label>
                <input
                  type="number"
                  min="0"
                  value={formData.required_coaches}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    required_coaches: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))}
                  className="input-field"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="input-field"
              placeholder="Optionele context over dit historische event"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Boten en schippers</h2>
            <p className="text-sm text-gray-600 mt-1">Selecteer de gebruikte boten en wijs optioneel een schipper toe per boot.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {boats.map((boat) => (
              <button
                key={boat.id}
                type="button"
                onClick={() => toggleBoat(boat.id)}
                className={`text-left p-4 border-2 rounded-lg transition-all ${
                  formData.selected_boat_ids.includes(boat.id)
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{boat.name}</p>
                    <p className="text-sm text-gray-600">{boat.boat_type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {boat.intern_extern}{!boat.is_active ? ' • momenteel inactief' : ''}
                    </p>
                  </div>
                  {formData.selected_boat_ids.includes(boat.id) && (
                    <span className="text-cyan-700 text-sm font-medium">Geselecteerd</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedAssignments.length > 0 && (
            <div className="space-y-3">
              {selectedAssignments.map(({ boat, skipperId }) => (
                <div key={boat.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schipper voor {boat.name}
                  </label>
                  <select
                    value={skipperId}
                    onChange={(e) => updateBoatAssignment(boat.id, e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="input-field"
                  >
                    <option value="">Selecteer schipper</option>
                    {getAvailableSkippersForBoat(boat.id).map((skipper) => (
                      <option key={skipper.id} value={skipper.id}>
                        {skipper.first_name} {skipper.last_name}{!skipper.is_active ? ' (inactief)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Overige aanwezigen</h2>
            <p className="text-sm text-gray-600 mt-1">Optioneel: hoofdschipper, wedstrijdleiding en coaches die aanwezig waren.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hoofdschipper</label>
            <select
              value={formData.head_skipper_id}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                head_skipper_id: e.target.value ? parseInt(e.target.value, 10) : '',
              }))}
              className="input-field"
            >
              <option value="">Geen hoofdschipper</option>
              {getAvailableRoleSkippers((skipper) => skipper.is_skipper, formData.head_skipper_id === '' ? [] : [formData.head_skipper_id]).map((skipper) => (
                <option key={skipper.id} value={skipper.id}>
                  {skipper.first_name} {skipper.last_name}{!skipper.is_active ? ' (inactief)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Wedstrijdleiding</label>
              <span className="text-xs text-gray-500">{formData.race_director_ids.length} geselecteerd</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getAvailableRoleSkippers((skipper) => skipper.is_race_director, formData.race_director_ids).map((skipper) => (
                <button
                  key={skipper.id}
                  type="button"
                  onClick={() => toggleRoleSelection('race_director_ids', skipper.id)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    formData.race_director_ids.includes(skipper.id)
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{skipper.first_name} {skipper.last_name}</p>
                  <p className="text-sm text-gray-600">
                    {skipper.email}{!skipper.is_active ? ' • momenteel inactief' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {['academie', 'proces'].includes(formData.event_type) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Coaches</label>
                <span className="text-xs text-gray-500">{formData.coach_ids.length} geselecteerd</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAvailableRoleSkippers((skipper) => skipper.is_coach, formData.coach_ids).map((skipper) => (
                  <button
                    key={skipper.id}
                    type="button"
                    onClick={() => toggleRoleSelection('coach_ids', skipper.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      formData.coach_ids.includes(skipper.id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{skipper.first_name} {skipper.last_name}</p>
                    <p className="text-sm text-gray-600">
                      {skipper.email}{!skipper.is_active ? ' • momenteel inactief' : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-between">
        <Link to="/" className="btn-secondary">
          Annuleren
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            !formData.event_name ||
            !formData.company_name ||
            !formData.event_date ||
            !formData.event_type ||
            selectedAssignments.length === 0
          }
          className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Opslaan...' : 'Historisch Event Opslaan'}
        </button>
      </div>
    </div>
  );
}
