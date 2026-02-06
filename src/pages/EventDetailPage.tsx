import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsApi, invitationsApi, boatsApi, skippersApi, eventTypesApi } from '../services/api';
import type { Event, InvitationStatus, Boat, Skipper, EventTypeConfig, Invitation } from '../types';
import { ManualAssignmentModal } from '../components/events/ManualAssignmentModal';
import { DirectConfirmModal } from '../components/events/DirectConfirmModal';
import { ReplaceSkipperModal } from '../components/events/ReplaceSkipperModal';

const getInvitationStatusBadge = (status: InvitationStatus) => {
  const badges = {
    pending: { class: 'badge-pending', label: 'Wachtend', icon: '⏳' },
    available: { class: 'badge-yes', label: 'Beschikbaar', icon: '✓' },
    unavailable: { class: 'badge-no', label: 'Niet beschikbaar', icon: '✗' },
    maybe: { class: 'badge-maybe', label: 'Misschien', icon: '?' },
    confirmed: { class: 'badge-yes', label: 'Bevestigd', icon: '✓✓' },
  };
  return badges[status];
};

const formatEventType = (type: string) => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [skippers, setSkippers] = useState<Skipper[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'head_skipper' | 'skippers' | 'race_director' | null>(null);
  const [selectedSkippers, setSelectedSkippers] = useState<number[]>([]);
  const [selectedRaceDirectors, setSelectedRaceDirectors] = useState<number[]>([]);
  const [selectedHeadSkipper, setSelectedHeadSkipper] = useState<number | null>(null);
  const [invitationFilter, setInvitationFilter] = useState<'all' | 'pending' | 'available' | 'confirmed'>('all');
  const [manualAssignModalOpen, setManualAssignModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [directConfirmModalOpen, setDirectConfirmModalOpen] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [invitationToReplace, setInvitationToReplace] = useState<Invitation | null>(null);
  const [editFormData, setEditFormData] = useState({
    event_name: '',
    company_name: '',
    event_date: '',
    duration: 'full_day' as 'half_day' | 'morning' | 'afternoon' | 'full_day',
    event_type: '' as string,
    notes: '',
    required_race_directors: 0,
    selected_boats: [] as number[],
  });

  useEffect(() => {
    loadEvent();
    loadBoats();
    loadSkippers();
    loadEventTypes();
  }, [id]);

  const loadBoats = async () => {
    try {
      const data = await boatsApi.getAll();
      setBoats(data);
    } catch (error) {
      console.error('Error loading boats:', error);
    }
  };

  const loadSkippers = async () => {
    try {
      const data = await skippersApi.getAll();
      setSkippers(data.filter(s => s.is_active));
    } catch (error) {
      console.error('Error loading skippers:', error);
    }
  };

  const loadEventTypes = async () => {
    try {
      const data = await eventTypesApi.getAll(true);
      setEventTypes(data);
    } catch (error) {
      console.error('Error loading event types:', error);
    }
  };

  const loadEvent = async () => {
    if (!id) return;

    try {
      const data = await eventsApi.getById(parseInt(id));
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };


  const handleCancelEvent = async () => {
    if (!event || !id) return;

    if (!confirm(`Weet je zeker dat je het event "${event.event_name}" wilt annuleren? Deze actie kan niet ongedaan gemaakt worden.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await eventsApi.delete(parseInt(id));
      const emails = result.cancellation_emails;
      const emailSummary = emails
        ? `\nAnnuleringsmails: ${emails.sent} verstuurd, ${emails.failed} mislukt`
        : '';
      alert(`${result.message}${emailSummary}`);
      navigate('/');
    } catch (error) {
      console.error('Error canceling event:', error);
      alert('Fout bij het annuleren van het event');
      setActionLoading(false);
    }
  };

  const handleCloseEvent = async () => {
    if (!event || !id) return;

    if (!confirm(`Wil je het event "${event.event_name}" afsluiten? Beschikbare schippers die niet gekozen zijn krijgen een bericht.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await eventsApi.close(parseInt(id));
      const emails = result.emails;
      const emailSummary = emails
        ? `\nMails: ${emails.sent} verstuurd, ${emails.failed} mislukt`
        : '';
      alert(`${result.message}${emailSummary}`);
      await loadEvent();
    } catch (error: any) {
      console.error('Error closing event:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het afsluiten van het event';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmInvitation = async (invitationId: number, skipperName: string) => {
    if (!confirm(`Wil je ${skipperName} definitief bevestigen voor dit event?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await invitationsApi.confirm(invitationId);
      alert(result.message);
      await loadEvent(); // Reload to show updated status
    } catch (error: any) {
      console.error('Error confirming invitation:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het bevestigen';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendSingleReminder = async (invitationId: number, skipperName: string) => {
    if (!confirm(`Wil je een herinnering sturen naar ${skipperName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await invitationsApi.sendReminder(invitationId);
      alert(result.message);
      await loadEvent();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het versturen van herinnering';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };
  const handleSendReminder = async () => {
    if (!event || !id) return;

    const invitations = Array.isArray(event.invitations) ? event.invitations : [];
    const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
    if (pendingCount === 0) {
      alert('Geen openstaande uitnodigingen - alle schippers hebben al gereageerd');
      return;
    }

    if (!confirm(`Wil je een herinnering versturen naar ${pendingCount} schipper(s) die nog niet hebben gereageerd?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await eventsApi.sendInvitationReminder(parseInt(id));
      alert(result.message);
      await loadEvent(); // Reload to update timestamps
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het versturen van herinneringen';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualAssignment = async (skipperId: number, boatId: number) => {
    if (!id) return;

    setActionLoading(true);
    try {
      await eventsApi.assignManual(parseInt(id), {
        skipper_id: skipperId,
        boat_id: boatId,
        role: selectedInvitation?.role || 'skipper'
      });

      // Reload event data
      await loadEvent();

      setManualAssignModalOpen(false);
      setSelectedInvitation(null);

      alert('Schipper succesvol toegewezen!');
    } catch (error: any) {
      console.error('Error assigning skipper:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij toewijzen';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectConfirm = async (assignments: Array<{ skipper_id: number; role: string }>) => {
    if (!id) return;

    setActionLoading(true);
    try {
      const result = await eventsApi.confirmDirect(parseInt(id), assignments);

      // Show success message with details
      const emailInfo = result.emails_failed > 0
        ? `\n${result.emails_sent} email(s) verstuurd, ${result.emails_failed} mislukt`
        : '';
      alert(`${result.message}${emailInfo}`);

      // Reload event data to show updated invitations
      await loadEvent();

      setDirectConfirmModalOpen(false);
    } catch (error: any) {
      console.error('Error confirming skippers:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het bevestigen van schippers';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceSkipper = async (invitationId: number, replacementSkipperId: number, reason: string) => {
    if (!id) return;

    try {
      const result = await eventsApi.replaceSkipper(parseInt(id), {
        original_invitation_id: invitationId,
        replacement_skipper_id: replacementSkipperId,
        replacement_reason: reason
      });

      const emailStatus = result.cancellation_email_sent && result.confirmation_email_sent
        ? 'Emails verstuurd naar beide schippers'
        : 'Let op: niet alle emails zijn verstuurd';

      alert(`${result.message}\n${emailStatus}`);

      // Reload event data
      await loadEvent();
    } catch (error: any) {
      console.error('Error replacing skipper:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het vervangen van schipper';
      alert(errorMessage);
      throw error;
    }
  };

  const handleOpenInviteModal = (role: 'head_skipper' | 'skippers' | 'race_director') => {
    setInviteRole(role);
    setSelectedSkippers([]);
    setSelectedRaceDirectors([]);
    setSelectedHeadSkipper(null);
    setShowInviteModal(true);
  };

  const toggleSkipperSelection = (skipperId: number) => {
    setSelectedSkippers(prev =>
      prev.includes(skipperId)
        ? prev.filter(id => id !== skipperId)
        : [...prev, skipperId]
    );
  };

  const toggleRaceDirectorSelection = (skipperId: number) => {
    setSelectedRaceDirectors(prev =>
      prev.includes(skipperId)
        ? prev.filter(id => id !== skipperId)
        : [...prev, skipperId]
    );
  };

  const selectHeadSkipper = (skipperId: number) => {
    setSelectedHeadSkipper(prev => (prev === skipperId ? null : skipperId));
  };

  const handleSendAdditionalInvitations = async () => {
    if (!event || !id) return;

    if (inviteRole === 'head_skipper') {
      if (!selectedHeadSkipper) {
        alert('Selecteer een hoofdschipper om uit te nodigen');
        return;
      }
      if (!confirm('Wil je een hoofdschipper uitnodigen voor dit event?')) {
        return;
      }
    } else if (inviteRole === 'race_director') {
      if (selectedRaceDirectors.length === 0) {
        alert('Selecteer minimaal één wedstrijdleider om uit te nodigen');
        return;
      }
      if (!confirm(`Wil je ${selectedRaceDirectors.length} extra wedstrijdleider(s) uitnodigen voor dit event?`)) {
        return;
      }
    } else {
      if (selectedSkippers.length === 0) {
        alert('Selecteer minimaal één schipper om uit te nodigen');
        return;
      }
      if (!confirm(`Wil je ${selectedSkippers.length} extra schipper(s) uitnodigen voor dit event?`)) {
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload =
        inviteRole === 'head_skipper'
          ? { head_skipper_id: selectedHeadSkipper || undefined }
          : inviteRole === 'race_director'
            ? { race_director_ids: selectedRaceDirectors }
            : { skipper_ids: selectedSkippers };
      const result = await eventsApi.sendInvitations(parseInt(id), payload);
      alert(result.message);
      setShowInviteModal(false);
      setInviteRole(null);
      setSelectedSkippers([]);
      setSelectedRaceDirectors([]);
      setSelectedHeadSkipper(null);
      await loadEvent(); // Reload to show new invitations
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het versturen van uitnodigingen';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!event) return;

    setEditFormData({
      event_name: event.event_name,
      company_name: event.company_name,
      event_date: event.event_date,
      duration: event.duration,
      event_type: event.event_type,
      notes: event.notes || '',
      required_race_directors: event.required_race_directors || 0,
      selected_boats: event.event_boats.map(eb => eb.boat.id),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!event || !id) return;

    setActionLoading(true);
    try {
      await eventsApi.update(parseInt(id), {
        event_name: editFormData.event_name,
        company_name: editFormData.company_name,
        event_date: editFormData.event_date,
        duration: editFormData.duration,
        event_type: editFormData.event_type,
        notes: editFormData.notes || undefined,
        required_race_directors: editFormData.required_race_directors,
        boat_ids: editFormData.selected_boats,
      });
      alert('Event succesvol bijgewerkt!');
      setShowEditModal(false);
      await loadEvent(); // Reload to show updated event
    } catch (error: any) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.detail || 'Fout bij het bijwerken van het event';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBoatInEdit = (boatId: number) => {
    setEditFormData(prev => ({
      ...prev,
      selected_boats: prev.selected_boats.includes(boatId)
        ? prev.selected_boats.filter(id => id !== boatId)
        : [...prev.selected_boats, boatId],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Event niet gevonden</h2>
        <Link to="/" className="text-cyan-600 hover:text-cyan-700">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  // Ensure invitations is an array (defensive check)
  const invitations = Array.isArray(event.invitations) ? event.invitations : [];
  const statusInvitations = invitations.filter(inv => inv.role !== 'race_director');
  const raceDirectorInvitations = invitations.filter(inv => inv.role === 'race_director');
  const invitedSkipperIds = new Set(invitations.map(inv => inv.skipper.id));

  // Calculate invitation statistics
  const availableSkippers = statusInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
  const confirmedSkippers = statusInvitations.filter(inv => inv.status === 'confirmed').length;
  const availableRaceDirectors = raceDirectorInvitations.filter(inv => inv.status === 'available' || inv.status === 'confirmed').length;
  const confirmedRaceDirectors = raceDirectorInvitations.filter(inv => inv.status === 'confirmed').length;
  const availableCount = availableSkippers + availableRaceDirectors;
  const totalInvitations = invitations.length;
  const requiredSkippers = event.event_boats.length;
  const requiredRaceDirectors = event.required_race_directors || 0;
  const totalRequired = requiredSkippers + requiredRaceDirectors;
  const allConfirmed = requiredSkippers > 0
    && confirmedSkippers >= requiredSkippers
    && confirmedRaceDirectors >= requiredRaceDirectors;
  const isComplete = requiredSkippers > 0
    && availableSkippers >= requiredSkippers
    && availableRaceDirectors >= requiredRaceDirectors;

  // Helper functions for manual assignment
  const unassignedBoats = event.event_boats.filter(eb => !eb.skipper);

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(event.event_date);
  eventDay.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const needsWarning = daysUntil >= 0 && daysUntil <= 3 && (!isComplete || !allConfirmed);
  const warningStatus = allConfirmed ? '' : isComplete ? 'nog niet bevestigd' : 'nog niet compleet';
  const warningTime = daysUntil === 0 ? 'vandaag' : `over ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'}`;

  const invitationCounts = {
    available: invitations.filter(inv => inv.status === 'available').length,
    unavailable: invitations.filter(inv => inv.status === 'unavailable').length,
    maybe: invitations.filter(inv => inv.status === 'maybe').length,
    pending: invitations.filter(inv => inv.status === 'pending').length,
    confirmed: invitations.filter(inv => inv.status === 'confirmed').length,
  };
  const availabilityLabel = totalRequired > 0
    ? `${availableCount}/${totalRequired} Beschikbaar`
    : 'Geen deelnemers';
  const remainingSkipperConfirmations = Math.max(0, requiredSkippers - confirmedSkippers);
  const completeLabel = isComplete ? 'Compleet' : 'Niet compleet';
  const confirmedLabel = event.workflow_phase === 'finalized' ? 'Afgesloten' : (allConfirmed ? 'Bevestigd' : 'Niet bevestigd');
  const invitationMatchesFilter = (status: InvitationStatus) => (
    invitationFilter === 'all' || status === invitationFilter
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-cyan-600 hover:text-cyan-700 text-sm mb-2 inline-block">
          ← Terug naar overzicht
        </Link>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.event_name}</h1>
            <p className="text-gray-600">{event.company_name}</p>
          </div>
          {event.workflow_phase === 'finalized' ? (
            <span className="badge badge-yes text-lg">✓ Afgesloten</span>
          ) : isComplete ? (
            <span className="badge badge-complete text-lg">✓ Compleet</span>
          ) : (
            <span className="badge badge-available text-lg">
              {availableCount}/{totalRequired} Beschikbaar
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="badge badge-available">{availabilityLabel}</span>
          <span className={`badge ${isComplete ? 'badge-complete' : 'badge-pending'}`}>{completeLabel}</span>
          <span className={`badge ${event.workflow_phase === 'finalized' ? 'badge-yes' : allConfirmed ? 'badge-yes' : 'badge-pending'}`}>{confirmedLabel}</span>
        </div>
        {needsWarning && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            ⚠️ Let op: dit event is {warningTime} en {warningStatus}.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleOpenEditModal}
            disabled={actionLoading || event.workflow_phase === 'finalized'}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
            title={event.workflow_phase === 'finalized' ? 'Event is afgesloten en kan niet meer bewerkt worden' : ''}
          >
            ✏️ Event Bewerken
          </button>
          <button
            onClick={handleCloseEvent}
            disabled={actionLoading || event.workflow_phase !== 'invitation' || !allConfirmed}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            ✅ Event Afsluiten
          </button>
          <button
            onClick={handleCancelEvent}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            🗑️ Event Annuleren
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Info Card */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Datum</p>
                <p className="font-medium text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Duur</p>
                <p className="font-medium text-gray-900">
                  {event.duration === 'morning' ? '☀️ Ochtend' :
                   event.duration === 'afternoon' ? '🌅 Middag' :
                   event.duration === 'half_day' ? 'Halve dag' : '📅 Hele dag'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-medium text-gray-900">
                  {eventTypes.find(type => type.code === event.event_type)?.label || formatEventType(event.event_type)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Aantal boten</p>
                <p className="font-medium text-gray-900">{event.event_boats.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Wedstrijdleiding nodig</p>
                <p className="font-medium text-gray-900">{event.required_race_directors || 0}</p>
              </div>
            </div>
            {event.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Notities</p>
                <p className="text-gray-900">{event.notes}</p>
              </div>
            )}
          </div>

          {/* Invitations (NEW WORKFLOW) */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Uitnodigingen</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Overzicht per rol, inclusief beschikbaarheid en bevestiging
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirectConfirmModalOpen(true)}
                  disabled={actionLoading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Persoonlijk Toewijzen
                </button>
                {invitationCounts.pending > 0 && (
                  <button
                    onClick={handleSendReminder}
                    disabled={actionLoading}
                    className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Bulk: herinnering naar alle wachtenden ({invitationCounts.pending})
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Nog te bevestigen schippers: <span className="font-semibold text-gray-900">{remainingSkipperConfirmations}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { key: 'all', label: 'Alle' },
                { key: 'pending', label: 'Wachtend' },
                { key: 'available', label: 'Beschikbaar' },
                { key: 'confirmed', label: 'Bevestigd' },
              ] as const).map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setInvitationFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    invitationFilter === filter.key
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {[
                {
                  title: '👑 Hoofdschipper',
                  role: 'head_skipper' as const,
                  invitations: invitations.filter(inv => inv.role === 'head_skipper'),
                },
                {
                  title: '⛵ Schippers',
                  role: 'skipper' as const,
                  invitations: invitations.filter(inv => inv.role === 'skipper'),
                },
                {
                  title: '📋 Wedstrijdleiding',
                  role: 'race_director' as const,
                  invitations: invitations.filter(inv => inv.role === 'race_director'),
                },
              ].map(group => (
                <div key={group.role} className="border border-gray-200 rounded-lg p-4">
                  {(() => {
                    const groupTotal = group.invitations.length;
                    const groupConfirmed = group.invitations.filter(inv => inv.status === 'confirmed').length;
                    const visibleInvitations = group.invitations.filter(inv => invitationMatchesFilter(inv.status));

                    return (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{group.title}</h3>
                            <p className="text-xs text-gray-500">
                              {groupTotal} totaal • {groupConfirmed} bevestigd
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenInviteModal(group.role === 'race_director' ? 'race_director' : group.role === 'head_skipper' ? 'head_skipper' : 'skippers')}
                            disabled={actionLoading || event.workflow_phase === 'finalized'}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50"
                            title={event.workflow_phase === 'finalized' ? 'Kan geen nieuwe uitnodigingen versturen voor afgesloten events' : ''}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Toevoegen
                          </button>
                        </div>
                        {groupTotal === 0 ? (
                          <p className="text-sm text-gray-500">Nog niemand uitgenodigd.</p>
                        ) : visibleInvitations.length === 0 ? (
                          <p className="text-sm text-gray-500">Geen uitnodigingen met dit filter.</p>
                        ) : (
                          <div className="space-y-3">
                            {visibleInvitations.map((invitation) => {
                              const statusInfo = getInvitationStatusBadge(invitation.status);
                              const isRaceDirector = invitation.role === 'race_director';
                              const isHeadSkipper = invitation.role === 'head_skipper';

                              return (
                                <div
                                  key={invitation.id}
                                  className={`border-2 rounded-lg p-4 ${
                                    isHeadSkipper ? 'border-blue-200 bg-blue-50' :
                                    isRaceDirector ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">
                                        {invitation.skipper.first_name} {invitation.skipper.last_name}
                                      </p>
                                      <p className="text-sm text-gray-600">{invitation.skipper.email}</p>
                                      {invitation.skipper.notes && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          Notities: {invitation.skipper.notes}
                                        </p>
                                      )}
                                    </div>
                          <div className="flex items-center gap-2">
                            {invitation.status === 'pending' && (
                              <button
                                onClick={() => handleSendSingleReminder(
                                  invitation.id,
                                  `${invitation.skipper.first_name} ${invitation.skipper.last_name}`
                                )}
                                disabled={actionLoading}
                                className="px-3 py-1 text-sm rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                              >
                                ✉️ Herinner
                              </button>
                            )}
                            {invitation.status === 'available' && !isRaceDirector && event.workflow_phase === 'invitation' && (
                              <button
                                onClick={() => handleConfirmInvitation(
                                  invitation.id,
                                  `${invitation.skipper.first_name} ${invitation.skipper.last_name}`
                                )}
                                disabled={actionLoading || remainingSkipperConfirmations === 0}
                                className="px-3 py-1 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                ✓ Bevestig
                              </button>
                            )}
                            {invitation.status === 'confirmed' && !isRaceDirector && event.workflow_phase === 'finalized' && (
                              <button
                                onClick={() => {
                                  setInvitationToReplace(invitation);
                                  setReplaceModalOpen(true);
                                }}
                                disabled={actionLoading}
                                className="px-3 py-1 text-sm rounded-lg font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
                              >
                                🔄 Vervangen
                              </button>
                            )}
                                      <span className={`badge ${statusInfo.class}`}>
                                        {statusInfo.icon} {statusInfo.label}
                                      </span>
                                    </div>
                                  </div>

                                  {invitation.invitation_sent_at && (
                                    <div className="text-xs text-gray-500">
                                      Uitnodiging verstuurd: {new Date(invitation.invitation_sent_at).toLocaleString('nl-NL')}
                                      {invitation.response_received_at && (
                                        <span className="ml-2">
                                          • Beantwoord: {new Date(invitation.response_received_at).toLocaleString('nl-NL')}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Boats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Geselecteerde Boten</h2>
            <div className="space-y-3">
              {event.event_boats.map((eventBoat) => (
                <div key={eventBoat.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">⛵ {eventBoat.boat.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{eventBoat.boat.boat_type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Responses Overzicht</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Beschikbaar</span>
                </div>
                <span className="font-semibold text-gray-900">{availableCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Niet beschikbaar</span>
                </div>
                <span className="font-semibold text-gray-900">{invitationCounts.unavailable}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Misschien</span>
                </div>
                <span className="font-semibold text-gray-900">{invitationCounts.maybe}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Wachtend</span>
                </div>
                <span className="font-semibold text-gray-900">{invitationCounts.pending}</span>
              </div>
            </div>

            {totalRequired > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((availableCount / totalRequired) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {Math.round((availableCount / totalRequired) * 100)}% beschikbaar
                </p>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Event Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Aantal boten</p>
                <p className="font-semibold text-gray-900">{event.event_boats.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uitnodigingen verstuurd</p>
                <p className="font-semibold text-gray-900">{totalInvitations}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Beschikbare deelnemers</p>
                <p className="font-semibold text-orange-600 text-lg">{availableCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bevestigde schippers</p>
                <p className="font-semibold text-green-600 text-lg">{confirmedSkippers}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Tijdlijn</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Event aangemaakt</p>
                  <p className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString('nl-NL')}</p>
                </div>
              </div>
              {invitations.length > 0 && invitations.some(inv => inv.invitation_sent_at) && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Uitnodigingen verstuurd</p>
                    <p className="text-xs text-gray-500">
                      {new Date(invitations[0].invitation_sent_at!).toLocaleString('nl-NL')}
                    </p>
                  </div>
                </div>
              )}
              {availableCount > 0 && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{availableCount} beschikbaar</p>
                    <p className="text-xs text-gray-500">Schippers beschikbaar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Bewerken</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Event Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Event Informatie</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Naam</label>
                      <input
                        type="text"
                        value={editFormData.event_name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, event_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijf</label>
                      <input
                        type="text"
                        value={editFormData.company_name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                      <input
                        type="date"
                        value={editFormData.event_date}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, event_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duur</label>
                      <select
                        value={editFormData.duration}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, duration: e.target.value as 'half_day' | 'morning' | 'afternoon' | 'full_day' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      >
                        <option value="">-- Selecteer duur --</option>
                        <option value="morning">☀️ Ochtend</option>
                        <option value="afternoon">🌅 Middag</option>
                        <option value="full_day">📅 Hele dag</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                      <select
                        value={editFormData.event_type}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, event_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Wedstrijdleiding nodig</label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.required_race_directors}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          required_race_directors: Math.max(0, parseInt(e.target.value, 10) || 0)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
                      <textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Boat Selection */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Boten Selecteren</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {editFormData.selected_boats.length} {editFormData.selected_boats.length === 1 ? 'boot' : 'boten'} geselecteerd
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {boats.filter(b => b.is_active).map((boat) => (
                      <div
                        key={boat.id}
                        onClick={() => toggleBoatInEdit(boat.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          editFormData.selected_boats.includes(boat.id)
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">⛵ {boat.name}</p>
                            <p className="text-sm text-gray-600">{boat.boat_type}</p>
                          </div>
                          {editFormData.selected_boats.includes(boat.id) && (
                            <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={actionLoading || !editFormData.event_name || !editFormData.company_name || !editFormData.event_date || editFormData.selected_boats.length === 0}
                    className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Bezig...' : 'Event Bijwerken'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Additional Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {inviteRole === 'head_skipper'
                    ? 'Hoofdschipper Toevoegen'
                    : inviteRole === 'race_director'
                      ? 'Wedstrijdleiding Toevoegen'
                      : 'Extra Schippers Uitnodigen'}
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Selection Counter */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-cyan-700">
                      {inviteRole === 'head_skipper'
                        ? (selectedHeadSkipper ? 1 : 0)
                        : inviteRole === 'race_director'
                          ? selectedRaceDirectors.length
                          : selectedSkippers.length}
                    </span>{' '}
                    {inviteRole === 'race_director'
                      ? 'wedstrijdleider(s)'
                      : 'schipper(s)'} geselecteerd
                  </p>
                </div>

                {/* Skipper Selection */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {inviteRole === 'head_skipper'
                      ? 'Selecteer Hoofdschipper'
                      : inviteRole === 'race_director'
                        ? 'Selecteer Wedstrijdleiding'
                        : 'Selecteer Schippers'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {inviteRole === 'head_skipper'
                      ? 'Selecteer één hoofdschipper voor dit event'
                      : 'Klik op een schipper om deze te selecteren voor uitnodiging'}
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {skippers
                      .filter(skipper => !invitedSkipperIds.has(skipper.id))
                      .filter(skipper => event.event_type !== 'coaching' || skipper.is_coach)
                      .map((skipper) => (
                        <div
                          key={skipper.id}
                          onClick={() => {
                            if (inviteRole === 'head_skipper') {
                              selectHeadSkipper(skipper.id);
                            } else if (inviteRole === 'race_director') {
                              toggleRaceDirectorSelection(skipper.id);
                            } else {
                              toggleSkipperSelection(skipper.id);
                            }
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            inviteRole === 'head_skipper'
                              ? selectedHeadSkipper === skipper.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                              : inviteRole === 'race_director'
                                ? selectedRaceDirectors.includes(skipper.id)
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                                : selectedSkippers.includes(skipper.id)
                                  ? 'border-cyan-600 bg-cyan-50'
                                  : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {skipper.first_name} {skipper.last_name}
                              </p>
                              <p className="text-sm text-gray-600">{skipper.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Tarief: €{event.duration === 'half_day' ? skipper.half_day_rate : skipper.full_day_rate}
                              </p>
                            </div>
                            {inviteRole === 'head_skipper' && selectedHeadSkipper === skipper.id && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {inviteRole === 'race_director' && selectedRaceDirectors.includes(skipper.id) && (
                              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {inviteRole !== 'head_skipper' && inviteRole !== 'race_director' && selectedSkippers.includes(skipper.id) && (
                              <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {skippers.filter(skipper => !invitedSkipperIds.has(skipper.id)).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Alle actieve schippers zijn al uitgenodigd voor dit event</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleSendAdditionalInvitations}
                    disabled={
                      actionLoading ||
                      (inviteRole === 'head_skipper'
                        ? !selectedHeadSkipper
                        : inviteRole === 'race_director'
                          ? selectedRaceDirectors.length === 0
                          : selectedSkippers.length === 0)
                    }
                    className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading
                      ? 'Bezig...'
                      : inviteRole === 'head_skipper'
                        ? 'Hoofdschipper Uitnodigen'
                        : inviteRole === 'race_director'
                          ? `${selectedRaceDirectors.length} Uitnodiging${selectedRaceDirectors.length === 1 ? '' : 'en'} Versturen`
                          : `${selectedSkippers.length} Uitnodiging${selectedSkippers.length === 1 ? '' : 'en'} Versturen`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Assignment Modal */}
      <ManualAssignmentModal
        isOpen={manualAssignModalOpen}
        onClose={() => setManualAssignModalOpen(false)}
        invitation={selectedInvitation}
        availableBoats={unassignedBoats}
        onAssign={handleManualAssignment}
      />

      {/* Direct Confirm Modal */}
      {event && (
        <DirectConfirmModal
          isOpen={directConfirmModalOpen}
          onClose={() => setDirectConfirmModalOpen(false)}
          event={event}
          allSkippers={skippers}
          onConfirm={handleDirectConfirm}
        />
      )}

      {/* Replace Skipper Modal */}
      <ReplaceSkipperModal
        isOpen={replaceModalOpen}
        onClose={() => {
          setReplaceModalOpen(false);
          setInvitationToReplace(null);
        }}
        invitation={invitationToReplace}
        availableSkippers={skippers.filter(s => !invitedSkipperIds.has(s.id))}
        onReplace={handleReplaceSkipper}
      />
    </div>
  );
}
