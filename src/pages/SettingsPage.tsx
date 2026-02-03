import { useEffect, useState } from 'react';
import { eventTypesApi } from '../services/api';
import type { EventTypeConfig } from '../types';

export function SettingsPage() {
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const data = await eventTypesApi.getAll(true);
      setEventTypes(data);
    } catch (error) {
      console.error('Error loading event types:', error);
      alert('Fout bij het laden van event types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTypeLabel.trim()) return;
    setCreating(true);
    try {
      await eventTypesApi.create({
        label: newTypeLabel.trim(),
        is_active: true,
      });
      setNewTypeLabel('');
      await loadEventTypes();
    } catch (error) {
      console.error('Error creating event type:', error);
      alert('Fout bij toevoegen van event type');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (eventType: EventTypeConfig) => {
    setSavingId(eventType.id);
    try {
      await eventTypesApi.update(eventType.id, {
        label: eventType.label,
        is_active: eventType.is_active,
      });
      await loadEventTypes();
    } catch (error) {
      console.error('Error updating event type:', error);
      alert('Fout bij bijwerken van event type');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (eventType: EventTypeConfig) => {
    if (!confirm(`Weet je zeker dat je "${eventType.label}" wilt verwijderen?`)) return;
    try {
      await eventTypesApi.delete(eventType.id);
      await loadEventTypes();
    } catch (error) {
      console.error('Error deleting event type:', error);
      alert('Event type kan niet verwijderd worden (mogelijk in gebruik)');
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instellingen</h1>
        <p className="text-gray-600">Beheer event types</p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Nieuw event type</h2>
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
            onClick={handleCreate}
            className="btn-primary"
            disabled={creating}
          >
            {creating ? 'Toevoegen...' : 'Toevoegen'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestaande types</h2>
        {eventTypes.length === 0 ? (
          <p className="text-gray-500">Nog geen event types</p>
        ) : (
          <div className="space-y-3">
            {eventTypes.map((type) => (
              <div key={type.id} className="flex flex-col md:flex-row md:items-center gap-3 border border-gray-200 rounded-lg p-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Label</label>
                  <input
                    type="text"
                    value={type.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setEventTypes(prev =>
                        prev.map(t => t.id === type.id ? { ...t, label } : t)
                      );
                    }}
                    className="input"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={type.is_active}
                      onChange={(e) => {
                        const is_active = e.target.checked;
                        setEventTypes(prev =>
                          prev.map(t => t.id === type.id ? { ...t, is_active } : t)
                        );
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2">Actief</span>
                  </label>
                  <button
                    onClick={() => handleUpdate(type)}
                    className="btn-secondary"
                    disabled={savingId === type.id}
                  >
                    {savingId === type.id ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  <button
                    onClick={() => handleDelete(type)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
