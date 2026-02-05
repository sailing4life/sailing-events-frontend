import { useState } from 'react';
import type { Invitation, EventBoat } from '../../types';

interface ManualAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation | null;
  availableBoats: EventBoat[];
  onAssign: (skipperId: number, boatId: number) => Promise<void>;
}

export function ManualAssignmentModal({
  isOpen,
  onClose,
  invitation,
  availableBoats,
  onAssign
}: ManualAssignmentModalProps) {
  const [selectedBoatId, setSelectedBoatId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  const handleSubmit = async () => {
    if (!selectedBoatId || !invitation) return;

    setAssigning(true);
    try {
      await onAssign(invitation.skipper.id, selectedBoatId);
      setSelectedBoatId(null);
      onClose();
    } catch (error) {
      // Error handled by parent
      console.error('Error assigning skipper:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    if (!assigning) {
      setSelectedBoatId(null);
      onClose();
    }
  };

  if (!isOpen || !invitation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            👤 Direct Toewijzen: {invitation.skipper.first_name} {invitation.skipper.last_name}
          </h2>

          <p className="text-gray-600 mb-6">
            Selecteer een boot om deze schipper direct toe te wijzen.
            Er wordt een bevestigingsmail verstuurd.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecteer boot:
            </label>
            {availableBoats.length === 0 ? (
              <p className="text-red-600 text-sm">Geen beschikbare boten</p>
            ) : (
              <select
                value={selectedBoatId || ''}
                onChange={(e) => setSelectedBoatId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={assigning}
              >
                <option value="">-- Kies een boot --</option>
                {availableBoats.map(eventBoat => (
                  <option key={eventBoat.boat.id} value={eventBoat.boat.id}>
                    {eventBoat.boat.name} ({eventBoat.boat.boat_type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={assigning}
            >
              Annuleren
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedBoatId || assigning}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? 'Bezig...' : 'Toewijzen & Email Versturen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
