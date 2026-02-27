import { useState } from 'react';
import type { Invitation, Skipper } from '../../types';
import { toast } from 'sonner';

interface ReplaceSkipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation | null;
  availableSkippers: Skipper[];
  onReplace: (invitationId: number, replacementSkipperId: number, reason: string) => Promise<void>;
}

export function ReplaceSkipperModal({
  isOpen,
  onClose,
  invitation,
  availableSkippers,
  onReplace
}: ReplaceSkipperModalProps) {
  const [selectedSkipperId, setSelectedSkipperId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const predefinedReasons = [
    'Ziek',
    'Noodgeval',
    'Persoonlijke omstandigheden',
    'Anders (specificeer hieronder)'
  ];

  const handleSubmit = async () => {
    if (!invitation || !selectedSkipperId) return;

    const finalReason = reason === 'Anders (specificeer hieronder)' ? customReason : reason;

    if (!finalReason.trim()) {
      toast.info('Selecteer of specificeer een reden');
      return;
    }

    setSubmitting(true);
    try {
      await onReplace(invitation.id, selectedSkipperId, finalReason);
      handleClose();
    } catch (error) {
      console.error('Error replacing skipper:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedSkipperId(null);
    setReason('');
    setCustomReason('');
    onClose();
  };

  if (!isOpen || !invitation) return null;

  const selectedSkipper = availableSkippers.find(s => s.id === selectedSkipperId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Schipper Vervangen</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current Skipper Info */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Huidige schipper:</h3>
            <p className="text-gray-700">
              {invitation.skipper.first_name} {invitation.skipper.last_name}
            </p>
            <p className="text-sm text-gray-600">{invitation.skipper.email}</p>
          </div>

          {/* Replacement Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reden voor vervanging *
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((r) => (
                <label key={r} className="flex items-center">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-gray-700">{r}</span>
                </label>
              ))}
            </div>

            {reason === 'Anders (specificeer hieronder)' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specificeer de reden..."
                className="mt-3 input"
              />
            )}
          </div>

          {/* Replacement Skipper Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecteer vervanger *
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableSkippers.map((skipper) => (
                <div
                  key={skipper.id}
                  onClick={() => setSelectedSkipperId(skipper.id)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedSkipperId === skipper.id
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
                    </div>
                    {selectedSkipperId === skipper.id && (
                      <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedSkipper && (
              <p className="mt-2 text-sm text-gray-600">
                Geselecteerd: {selectedSkipper.first_name} {selectedSkipper.last_name}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Let op:</strong> De huidige schipper ontvangt een annuleringsmail en de vervanger ontvangt een bevestigingsmail.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedSkipperId || !reason || (reason === 'Anders (specificeer hieronder)' && !customReason.trim())}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Bezig met vervangen...' : 'Vervangen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
