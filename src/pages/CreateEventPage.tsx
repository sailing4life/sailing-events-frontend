import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boatsApi, skippersApi, eventsApi, eventTypesApi } from '../services/api';
import type { Boat, Skipper, EventTypeConfig } from '../types';
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
  selected_boats: number[];
  selected_head_skipper: number | null;
  selected_skippers: number[];
  selected_race_directors: number[];
  selected_coaches: number[];
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [skippers, setSkippers] = useState<Skipper[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [creatingType, setCreatingType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('head_skipper');
  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    company_name: '',
    event_date: '',
    duration: 'full_day',
    event_type: '',
    notes: '',
    required_race_directors: 0,
    required_coaches: 0,
    selected_boats: [],
    selected_head_skipper: null,
    selected_skippers: [],
    selected_race_directors: [],
    selected_coaches: [],
  });

  const totalSteps = 4;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [boatsData, skippersData, eventTypesData] = await Promise.all([
        boatsApi.getAll(),
        skippersApi.getAll(),
        eventTypesApi.getAll(),
      ]);
      setBoats(boatsData.filter(b => b.is_active));
      setSkippers(skippersData.filter(s => s.is_active));
      setEventTypes(eventTypesData);
      if (eventTypesData.length > 0 && !formData.event_type) {
        const initialType = eventTypesData.find(type => type.code === 'event')?.code
          || eventTypesData[0].code;
        setFormData(prev => ({
          ...prev,
          event_type: initialType,
          required_race_directors: initialType === 'training' ? 0 : 1,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fout bij het laden van boten, schippers of event types');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Step 1: Create event with boats only
      const event = await eventsApi.create({
        event_name: formData.event_name,
        company_name: formData.company_name,
        event_date: formData.event_date,
        duration: formData.duration,
        event_type: formData.event_type,
        notes: formData.notes || undefined,
        required_race_directors: formData.required_race_directors,
        required_coaches: formData.required_coaches,
        boat_ids: formData.selected_boats,
      });

      // Step 2: Send invitations to skippers, head skipper, race directors and coaches
      const invitationResult = await eventsApi.sendInvitations(event.id, {
        skipper_ids: formData.selected_skippers,
        head_skipper_id: formData.selected_head_skipper || undefined,
        race_director_ids: formData.selected_race_directors.length > 0
          ? formData.selected_race_directors
          : undefined,
        coach_ids: formData.selected_coaches.length > 0
          ? formData.selected_coaches
          : undefined,
      });

      toast.success(`Event succesvol aangemaakt! ${invitationResult.message}`);
      navigate('/');
    } catch (error: any) {
      console.error('Error creating event:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het aanmaken van het event';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEventType = async () => {
    if (!newTypeLabel.trim()) return;
    setCreatingType(true);
    try {
      await eventTypesApi.create({
        label: newTypeLabel.trim(),
        is_active: true,
      });
      const updated = await eventTypesApi.getAll();
      setEventTypes(updated);
      if (!formData.event_type && updated.length > 0) {
        const defaultType = updated.find(type => type.code === 'event')?.code
          || updated[0].code;
        setFormData(prev => ({ ...prev, event_type: defaultType }));
      }
      setNewTypeLabel('');
    } catch (error) {
      console.error('Error creating event type:', error);
      toast.error('Fout bij toevoegen van event type');
    } finally {
      setCreatingType(false);
    }
  };

  const toggleBoat = (boatId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_boats: prev.selected_boats.includes(boatId)
        ? prev.selected_boats.filter(id => id !== boatId)
        : [...prev.selected_boats, boatId],
    }));
  };

  const toggleSkipper = (skipperId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_skippers: prev.selected_skippers.includes(skipperId)
        ? prev.selected_skippers.filter(id => id !== skipperId)
        : [...prev.selected_skippers, skipperId],
    }));
  };

  const toggleRaceDirector = (skipperId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_race_directors: prev.selected_race_directors.includes(skipperId)
        ? prev.selected_race_directors.filter(id => id !== skipperId)
        : [...prev.selected_race_directors, skipperId],
    }));
  };

  const toggleCoach = (skipperId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_coaches: prev.selected_coaches.includes(skipperId)
        ? prev.selected_coaches.filter(id => id !== skipperId)
        : [...prev.selected_coaches, skipperId],
    }));
  };

  const selectHeadSkipper = (skipperId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_head_skipper: prev.selected_head_skipper === skipperId ? null : skipperId,
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.event_name && formData.company_name && formData.event_date && formData.event_type;
      case 2:
        return formData.selected_boats.length > 0;
      case 3:
        // Allow proceeding even with fewer skippers or race directors than required.
        return true;
      default:
        return true;
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nieuw Event Aanmaken</h1>
        <p className="text-gray-600">Maak een nieuw zeilevent aan in {totalSteps} stappen</p>
      </div>

      {/* Step Indicators */}
      <div className="mb-8">
        <div className="grid grid-cols-4 text-center">
          {['Event Info', 'Boten', 'Uitnodigen', 'Review'].map((label, index) => {
            const s = index + 1;
            return (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                <span className="mt-2 text-sm text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="card mb-6">
        {/* Step 1: Event Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Event Informatie</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Naam</label>
              <input
                type="text"
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                className="input-field"
                placeholder="bijv. Tech Corp Team Building"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="input-field"
                placeholder="bijv. Tech Corp Amsterdam"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duur</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <div className="flex items-center gap-3">
                <select
                  value={formData.event_type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setFormData({
                      ...formData,
                      event_type: nextType,
                      required_race_directors: nextType === 'training' ? 0 : 1,
                    });
                  }}
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
                <button
                  type="button"
                  onClick={() => setShowEventTypeModal(true)}
                  className="btn-secondary whitespace-nowrap"
                >
                  Beheer types
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wedstrijdleiding nodig</label>
              <input
                type="number"
                min="0"
                value={formData.required_race_directors}
                onChange={(e) => setFormData({
                  ...formData,
                  required_race_directors: Math.max(0, parseInt(e.target.value, 10) || 0)
                })}
                className="input-field"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Aantal wedstrijdleiders dat nodig is voor dit event.</p>
            </div>

            {formData.event_type === 'coaching' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coaches nodig</label>
                <input
                  type="number"
                  min="0"
                  value={formData.required_coaches}
                  onChange={(e) => setFormData({
                    ...formData,
                    required_coaches: Math.max(0, parseInt(e.target.value, 10) || 0)
                  })}
                  className="input-field"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Aantal coaches dat nodig is voor dit coaching event.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notities (optioneel)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Extra informatie over het event..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Select Boats */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Selecteer Boten</h2>
            <p className="text-gray-600 mb-4">Kies de boten die je wilt gebruiken voor dit event</p>

            <div className="grid grid-cols-2 gap-4">
              {boats.map((boat) => (
                <div
                  key={boat.id}
                  onClick={() => toggleBoat(boat.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.selected_boats.includes(boat.id)
                      ? 'border-cyan-600 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{boat.name}</h3>
                      <p className="text-sm text-gray-600">{boat.boat_type}</p>
                      <p className="text-sm text-gray-500 mt-1">{boat.intern_extern}</p>
                    </div>
                    {formData.selected_boats.includes(boat.id) && (
                      <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {formData.selected_boats.length > 0 && (
              <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                <p className="text-sm text-cyan-800">
                  {formData.selected_boats.length} {formData.selected_boats.length === 1 ? 'boot' : 'boten'} geselecteerd
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Invite Skippers */}
        {step === 3 && (() => {
          const totalSkippers = formData.selected_skippers.length + (formData.selected_head_skipper ? 1 : 0);
          const skipperShortage = formData.selected_boats.length - totalSkippers;
          const rdShortage = formData.required_race_directors - formData.selected_race_directors.length;
          const coachShortage = formData.required_coaches - formData.selected_coaches.length;
          const hasShortage = skipperShortage > 0 || rdShortage > 0 || (coachShortage > 0 && formData.event_type === 'coaching');

          const renderPersonCard = (
            skipper: Skipper,
            isSelected: boolean,
            onSelect: () => void,
            colorClass: string,
            checkColor: string
          ) => (
            <div
              key={skipper.id}
              onClick={onSelect}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected ? colorClass : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {skipper.first_name} {skipper.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    €{['morning', 'afternoon', 'half_day'].includes(formData.duration) ? skipper.half_day_rate : skipper.full_day_rate}
                  </p>
                  {skipper.notes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Notities: {skipper.notes}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <svg className={`w-5 h-5 ${checkColor}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          );

          const toggleSection = (section: string) => {
            setExpandedSection(prev => prev === section ? null : section);
          };

          return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Schippers Uitnodigen</h2>

            {/* Summary bar */}
            <div className={`mb-4 p-3 rounded-lg border ${hasShortage ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className={skipperShortage > 0 ? 'text-yellow-800' : 'text-green-800'}>
                  ⛵ {totalSkippers}/{formData.selected_boats.length} schippers
                </span>
                <span className={rdShortage > 0 ? 'text-yellow-800' : 'text-green-800'}>
                  📋 {formData.selected_race_directors.length}/{formData.required_race_directors} wedstrijdleiding
                </span>
                {formData.event_type === 'coaching' && (
                  <span className={coachShortage > 0 ? 'text-yellow-800' : 'text-green-800'}>
                    🏅 {formData.selected_coaches.length}/{formData.required_coaches} coaches
                  </span>
                )}
              </div>
            </div>

            {formData.event_type === 'coaching' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Alleen coaches worden getoond voor coaching events
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* Head Skipper */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('head_skipper')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 transition-transform ${expandedSection === 'head_skipper' ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">👑 Hoofdschipper</h3>
                    <span className="text-xs text-gray-500">(optioneel)</span>
                  </div>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    formData.selected_head_skipper ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {formData.selected_head_skipper ? '1' : '0'}
                  </span>
                </button>
                {expandedSection === 'head_skipper' && (
                  <div className="p-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">Selecteer één hoofdschipper voor dit event</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {skippers
                        .filter(s => !formData.selected_skippers.includes(s.id))
                        .filter(s => !formData.selected_race_directors.includes(s.id))
                        .filter(s => !formData.selected_coaches.includes(s.id))
                        .filter(s => formData.event_type === 'coaching' ? s.is_coach : s.is_skipper)
                        .map(s => renderPersonCard(s, formData.selected_head_skipper === s.id, () => selectHeadSkipper(s.id), 'border-blue-600 bg-blue-50', 'text-blue-600'))}
                    </div>
                  </div>
                )}
              </div>

              {/* Skippers */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('skippers')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 transition-transform ${expandedSection === 'skippers' ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">⛵ Schippers</h3>
                  </div>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    skipperShortage > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {formData.selected_skippers.length}
                  </span>
                </button>
                {expandedSection === 'skippers' && (
                  <div className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {skippers
                        .filter(s => s.id !== formData.selected_head_skipper)
                        .filter(s => !formData.selected_race_directors.includes(s.id))
                        .filter(s => !formData.selected_coaches.includes(s.id))
                        .filter(s => formData.event_type === 'coaching' ? s.is_coach : s.is_skipper)
                        .map(s => renderPersonCard(s, formData.selected_skippers.includes(s.id), () => toggleSkipper(s.id), 'border-cyan-600 bg-cyan-50', 'text-cyan-600'))}
                    </div>
                  </div>
                )}
              </div>

              {/* Race Directors */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('race_directors')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 transition-transform ${expandedSection === 'race_directors' ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">📋 Wedstrijdleiding</h3>
                    <span className="text-xs text-gray-500">(optioneel)</span>
                  </div>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    rdShortage > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {formData.selected_race_directors.length}
                  </span>
                </button>
                {expandedSection === 'race_directors' && (
                  <div className="p-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">Wedstrijdleiding krijgt geen boot toegewezen maar wordt wel uitgenodigd</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {skippers
                        .filter(s => s.id !== formData.selected_head_skipper)
                        .filter(s => !formData.selected_skippers.includes(s.id))
                        .filter(s => !formData.selected_coaches.includes(s.id))
                        .filter(s => s.is_race_director)
                        .map(s => renderPersonCard(s, formData.selected_race_directors.includes(s.id), () => toggleRaceDirector(s.id), 'border-purple-600 bg-purple-50', 'text-purple-600'))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coaches (only for coaching events) */}
              {formData.event_type === 'coaching' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('coaches')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-4 h-4 transition-transform ${expandedSection === 'coaches' ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold text-gray-900">🏅 Coaches</h3>
                    </div>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      coachShortage > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {formData.selected_coaches.length}
                    </span>
                  </button>
                  {expandedSection === 'coaches' && (
                    <div className="p-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">Coaches krijgen geen boot toegewezen maar worden wel uitgenodigd</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {skippers
                          .filter(s => s.id !== formData.selected_head_skipper)
                          .filter(s => !formData.selected_skippers.includes(s.id))
                          .filter(s => !formData.selected_race_directors.includes(s.id))
                          .filter(s => s.is_coach)
                          .map(s => renderPersonCard(s, formData.selected_coaches.includes(s.id), () => toggleCoach(s.id), 'border-green-600 bg-green-50', 'text-green-600'))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Review & Bevestigen</h2>
            <p className="text-gray-600 mb-6">Controleer je event voor het versturen van uitnodigingen</p>

            <div className="space-y-6">
              {/* Event Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Event Informatie</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-medium">{formData.event_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bedrijf:</span>
                    <span className="font-medium">{formData.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Datum:</span>
                    <span className="font-medium">{new Date(formData.event_date).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duur:</span>
                    <span className="font-medium">
                      {formData.duration === 'morning' ? '☀️ Ochtend' :
                       formData.duration === 'afternoon' ? '🌅 Middag' :
                       formData.duration === 'half_day' ? 'Halve dag' : '📅 Hele dag'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Boats */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Geselecteerde Boten</h3>
                <div className="space-y-2">
                  {formData.selected_boats.map((boatId) => {
                    const boat = boats.find(b => b.id === boatId);
                    return (
                      <div key={boatId} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">⛵ {boat?.name}</p>
                        <p className="text-sm text-gray-600">{boat?.boat_type}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Head Skipper */}
              {formData.selected_head_skipper && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Hoofdschipper</h3>
                  <div>
                    {(() => {
                      const skipper = skippers.find(s => s.id === formData.selected_head_skipper);
                      return (
                        <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                          <p className="font-medium">
                            {skipper?.first_name} {skipper?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">👑 Hoofdschipper</p>
                          {skipper?.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              Notities: {skipper?.notes}
                            </p>
                          )}
                        </div>
                          <span className="text-sm font-medium text-gray-700">
                            €{['morning', 'afternoon', 'half_day'].includes(formData.duration) ? skipper?.half_day_rate : skipper?.full_day_rate}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Invited Skippers */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Uitgenodigde Schippers</h3>
                <div className="space-y-2">
                  {formData.selected_skippers.map((skipperId) => {
                    const skipper = skippers.find(s => s.id === skipperId);
                    return (
                      <div key={skipperId} className="bg-cyan-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {skipper?.first_name} {skipper?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">⛵ Schipper</p>
                          {skipper?.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              Notities: {skipper?.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          €{['morning', 'afternoon', 'half_day'].includes(formData.duration) ? skipper?.half_day_rate : skipper?.full_day_rate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invited Race Directors */}
              {formData.selected_race_directors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Uitgenodigde Wedstrijdleiding</h3>
                  <div className="space-y-2">
                    {formData.selected_race_directors.map((skipperId) => {
                      const skipper = skippers.find(s => s.id === skipperId);
                      return (
                        <div key={skipperId} className="bg-purple-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                          <p className="font-medium">
                            {skipper?.first_name} {skipper?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">📋 Wedstrijdleiding</p>
                          {skipper?.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              Notities: {skipper?.notes}
                            </p>
                          )}
                        </div>
                          <span className="text-sm font-medium text-gray-700">
                            €{['morning', 'afternoon', 'half_day'].includes(formData.duration) ? skipper?.half_day_rate : skipper?.full_day_rate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invited Coaches */}
              {formData.selected_coaches.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Uitgenodigde Coaches</h3>
                  <div className="space-y-2">
                    {formData.selected_coaches.map((skipperId) => {
                      const skipper = skippers.find(s => s.id === skipperId);
                      return (
                        <div key={skipperId} className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                          <p className="font-medium">
                            {skipper?.first_name} {skipper?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">🏅 Coach</p>
                          {skipper?.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              Notities: {skipper?.notes}
                            </p>
                          )}
                        </div>
                          <span className="text-sm font-medium text-gray-700">
                            €{['morning', 'afternoon', 'half_day'].includes(formData.duration) ? skipper?.half_day_rate : skipper?.full_day_rate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ℹ️ Hoe werkt het nieuwe proces?
                </p>
                <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>Event wordt aangemaakt met geselecteerde boten</li>
                  <li>Uitnodigingsemails worden verstuurd naar alle schippers</li>
                  <li>Schippers geven hun beschikbaarheid door via de email</li>
                  <li>Jij wijst later de beschikbare schippers toe aan boten</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => step === 1 ? navigate('/') : handleBack()}
          className="btn-secondary"
        >
          {step === 1 ? 'Annuleren' : 'Vorige'}
        </button>

        {step < totalSteps ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`btn-primary ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Aanmaken...' : 'Event Aanmaken & Uitnodigingen Versturen'}
          </button>
        )}
      </div>

      {showEventTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Types</h2>
                <button
                  onClick={() => setShowEventTypeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nieuw type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newTypeLabel}
                      onChange={(e) => setNewTypeLabel(e.target.value)}
                      className="input"
                      placeholder="Label (bijv. Clinic)"
                    />
                    <button
                      type="button"
                      onClick={handleCreateEventType}
                      className="btn-primary"
                      disabled={creatingType}
                    >
                      {creatingType ? 'Toevoegen...' : 'Toevoegen'}
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bestaande types</h3>
                  <div className="space-y-2">
                    {eventTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-gray-900">{type.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full ${type.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {type.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEventTypeModal(false)}
                  className="btn-secondary"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
