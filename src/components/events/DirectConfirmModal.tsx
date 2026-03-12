import { useState } from 'react';
import type { Skipper, Event } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { toast } from 'sonner';

interface DirectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  allSkippers: Skipper[];
  onConfirm: (assignments: Array<{ skipper_id: number; role: string }>) => Promise<void>;
}

type RoleType = 'skipper' | 'head_skipper' | 'race_director' | 'coach';

export function DirectConfirmModal({
  isOpen,
  onClose,
  event,
  allSkippers,
  onConfirm
}: DirectConfirmModalProps) {
  const [selectedSkippers, setSelectedSkippers] = useState<Set<number>>(new Set());
  const [selectedRole, setSelectedRole] = useState<RoleType>('skipper');
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleToggleSkipper = (skipperId: number) => {
    setSelectedSkippers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skipperId)) {
        newSet.delete(skipperId);
      } else {
        newSet.add(skipperId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (selectedSkippers.size === 0) {
      toast.info('Selecteer minimaal één schipper');
      return;
    }
    setShowConfirmDialog(true);
  };

  const executeSubmit = async () => {
    setShowConfirmDialog(false);
    setConfirming(true);
    try {
      const assignments = Array.from(selectedSkippers).map(skipper_id => ({
        skipper_id,
        role: selectedRole
      }));

      await onConfirm(assignments);
      setSelectedSkippers(new Set());
      setSelectedRole('skipper');
      onClose();
    } catch (error) {
      console.error('Error confirming skippers:', error);
    } finally {
      setConfirming(false);
    }
  };

  const roleLabel = {
    skipper: 'schipper(s)',
    head_skipper: 'hoofdschipper',
    race_director: 'wedstrijdleider(s)',
    coach: 'coach(es)'
  }[selectedRole];

  const handleClose = () => {
    if (!confirming) {
      setSelectedSkippers(new Set());
      setSelectedRole('skipper');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">👤 Persoonlijk Toewijzen</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecteer schippers om direct te bevestigen voor dit event
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={confirming}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol voor geselecteerde schippers:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={confirming}
            >
              <option value="skipper">⛵ Schipper</option>
              <option value="head_skipper">👑 Hoofdschipper</option>
              <option value="race_director">📋 Wedstrijdleider</option>
              <option value="coach">🏅 Coach</option>
            </select>
          </div>

          {/* Selection Counter */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-cyan-700">{selectedSkippers.size}</span>{' '}
              schipper(s) geselecteerd
            </p>
          </div>

          {/* Skipper Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Beschikbare Schippers</h3>
            {allSkippers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Geen actieve schippers beschikbaar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allSkippers.map((skipper) => (
                  <div
                    key={skipper.id}
                    onClick={() => handleToggleSkipper(skipper.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedSkippers.has(skipper.id)
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {skipper.first_name} {skipper.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{skipper.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tarief: €{event.duration === 'half_day' || event.duration === 'morning' || event.duration === 'afternoon'
                            ? skipper.half_day_rate
                            : skipper.full_day_rate}
                        </p>
                      </div>
                      {selectedSkippers.has(skipper.id) && (
                        <svg className="w-5 h-5 text-cyan-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={confirming}
            >
              Annuleren
            </button>
            <button
              onClick={handleSubmit}
              disabled={confirming || selectedSkippers.size === 0}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {confirming ? 'Bezig...' : `${selectedSkippers.size} Bevestigen & Email Versturen`}
            </button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showConfirmDialog}
          title="Schippers bevestigen"
          message={`Wil je ${selectedSkippers.size} ${roleLabel} direct bevestigen voor dit event?`}
          confirmLabel="Bevestigen"
          variant="info"
          onConfirm={executeSubmit}
          onCancel={() => setShowConfirmDialog(false)}
        />
      </div>
    </div>
  );
}
