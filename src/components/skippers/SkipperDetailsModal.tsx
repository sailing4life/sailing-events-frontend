import { useEffect, useState } from 'react';
import type { Skipper, SkipperEventHistory, SkipperOpenEvent } from '../../types';
import { skippersApi, eventsApi } from '../../services/api';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { toast } from 'sonner';

interface SkipperDetailsModalProps {
  isOpen: boolean;
  skipper: Skipper | null;
  onClose: () => void;
}

export function SkipperDetailsModal({ isOpen, skipper, onClose }: SkipperDetailsModalProps) {
  const [history, setHistory] = useState<SkipperEventHistory[]>([]);
  const [openEvents, setOpenEvents] = useState<SkipperOpenEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningEventId, setAssigningEventId] = useState<number | null>(null);
  const [confirmAssignEventId, setConfirmAssignEventId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && skipper) {
      loadDetails();
    }
  }, [isOpen, skipper]);

  const formatDuration = (duration: string) => {
    switch (duration) {
      case 'morning':
        return 'Ochtend';
      case 'afternoon':
        return 'Middag';
      case 'half_day':
        return 'Halve dag';
      case 'full_day':
        return 'Hele dag';
      default:
        return duration;
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'skipper':
        return 'Schipper';
      case 'head_skipper':
        return 'Hoofdschipper';
      case 'race_director':
        return 'Wedstrijdleider';
      case 'coach':
        return 'Coach';
      default:
        return role;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Wachtend';
      case 'available':
        return 'Beschikbaar';
      case 'unavailable':
        return 'Niet beschikbaar';
      case 'maybe':
        return 'Misschien';
      case 'confirmed':
        return 'Bevestigd';
      default:
        return status;
    }
  };

  const loadDetails = async () => {
    if (!skipper) return;
    setLoading(true);
    try {
      const [historyData, openEventsData] = await Promise.all([
        skippersApi.getHistory(skipper.id),
        skippersApi.getOpenEvents(skipper.id),
      ]);
      setHistory(historyData);
      setOpenEvents(openEventsData);
    } catch (error) {
      console.error('Error loading skipper details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (eventId: number) => {
    setConfirmAssignEventId(eventId);
  };

  const executeAssign = async () => {
    if (!skipper || confirmAssignEventId === null) return;

    setConfirmAssignEventId(null);
    setAssigningEventId(confirmAssignEventId);
    try {
      await eventsApi.confirmDirect(confirmAssignEventId, [{
        skipper_id: skipper.id,
        role: 'skipper',
      }]);
      await loadDetails();
      toast.success('Schipper direct bevestigd!');
    } catch (error) {
      console.error('Error assigning skipper:', error);
      toast.error('Fout bij het bevestigen van schipper');
    } finally {
      setAssigningEventId(null);
    }
  };

  if (!isOpen || !skipper) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                👤 {skipper.first_name} {skipper.last_name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{skipper.email}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {loading ? (
            <div className="text-gray-600">Laden...</div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Direct bevestigen</h3>
                {openEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">Geen events die nog schippers nodig hebben.</p>
                ) : (
                  <div className="space-y-2">
                    {openEvents.map((event) => (
                      <div key={event.event_id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-gray-900">{event.event_name}</p>
                          <p className="text-sm text-gray-600">
                            {event.company_name} • {new Date(event.event_date).toLocaleDateString('nl-NL')} • {formatDuration(event.duration)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Nog nodig: {event.remaining_skippers}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAssign(event.event_id)}
                          disabled={assigningEventId === event.event_id}
                          className="px-3 py-1.5 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {assigningEventId === event.event_id ? 'Bezig...' : 'Bevestig'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event historie</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">Nog geen events gevonden.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div key={`${item.event_id}-${item.role}-${item.status}`} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{item.event_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.company_name} • {new Date(item.event_date).toLocaleDateString('nl-NL')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRole(item.role)} • {formatStatus(item.status)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmAssignEventId !== null}
          title="Schipper bevestigen"
          message={skipper ? `Wil je ${skipper.first_name} ${skipper.last_name} direct bevestigen voor dit event?` : ''}
          confirmLabel="Bevestigen"
          variant="info"
          onConfirm={executeAssign}
          onCancel={() => setConfirmAssignEventId(null)}
        />
      </div>
    </div>
  );
}
