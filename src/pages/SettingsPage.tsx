import { useEffect, useState } from 'react';
import { eventTypesApi, settingsApi } from '../services/api';
import type { EventTypeConfig } from '../types';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { toast } from 'sonner';

export function SettingsPage() {
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');

  // Admin notification settings
  const [adminEmail, setAdminEmail] = useState('');
  const [adminNotificationsEnabled, setAdminNotificationsEnabled] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<EventTypeConfig | null>(null);

  // Automatic reminder settings
  const [automaticRemindersEnabled, setAutomaticRemindersEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [savingReminders, setSavingReminders] = useState(false);

  useEffect(() => {
    loadEventTypes();
    loadAdminSettings();
    loadReminderSettings();
  }, []);

  const loadEventTypes = async () => {
    try {
      const data = await eventTypesApi.getAll(true);
      setEventTypes(data);
    } catch (error) {
      console.error('Error loading event types:', error);
      toast.error('Fout bij het laden van event types');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const data = await settingsApi.getAdminNotifications();
      setAdminEmail(data.admin_email);
      setAdminNotificationsEnabled(data.admin_notifications_enabled);
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const loadReminderSettings = async () => {
    try {
      const data = await settingsApi.getReminderSettings();
      setAutomaticRemindersEnabled(data.automatic_reminders_enabled);
      setReminderDaysBefore(data.reminder_days_before);
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const handleSaveAdminSettings = async () => {
    setSavingNotifications(true);
    try {
      await settingsApi.updateAdminNotifications({
        admin_email: adminEmail,
        admin_notifications_enabled: adminNotificationsEnabled,
      });
      toast.success('Admin notificatie instellingen opgeslagen!');
    } catch (error) {
      console.error('Error saving admin settings:', error);
      toast.error('Fout bij opslaan van admin instellingen');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveReminderSettings = async () => {
    setSavingReminders(true);
    try {
      await settingsApi.updateReminderSettings({
        automatic_reminders_enabled: automaticRemindersEnabled,
        reminder_days_before: reminderDaysBefore,
      });
      toast.success('Automatische herinnering instellingen opgeslagen!');
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      toast.error('Fout bij opslaan van herinnering instellingen');
    } finally {
      setSavingReminders(false);
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
      toast.error('Fout bij toevoegen van event type');
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
      toast.error('Fout bij bijwerken van event type');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (eventType: EventTypeConfig) => {
    setDeleteConfirm(eventType);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await eventTypesApi.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadEventTypes();
    } catch (error) {
      console.error('Error deleting event type:', error);
      toast.error('Event type kan niet verwijderd worden (mogelijk in gebruik)');
      setDeleteConfirm(null);
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
        <p className="text-gray-600">Beheer applicatie instellingen</p>
      </div>

      {/* Admin Email Notifications */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Admin Email Notificaties</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ontvang een email wanneer schippers reageren op uitnodigingen of andere belangrijke events plaatsvinden.
        </p>
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={adminNotificationsEnabled}
                onChange={(e) => setAdminNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 mr-2"
              />
              Email notificaties inschakelen
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email Adres
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className="input max-w-md"
              disabled={!adminNotificationsEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Notificaties worden naar dit email adres gestuurd
            </p>
          </div>
          <div>
            <button
              onClick={handleSaveAdminSettings}
              className="btn-primary"
              disabled={savingNotifications}
            >
              {savingNotifications ? 'Opslaan...' : 'Instellingen Opslaan'}
            </button>
          </div>
        </div>
      </div>

      {/* Automatic Reminders */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">⏰ Automatische Herinneringen</h2>
        <p className="text-sm text-gray-600 mb-4">
          Verstuur automatisch herinneringen naar schippers die nog niet hebben gereageerd op uitnodigingen.
        </p>
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={automaticRemindersEnabled}
                onChange={(e) => setAutomaticRemindersEnabled(e.target.checked)}
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 mr-2"
              />
              Automatische herinneringen inschakelen
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aantal dagen na uitnodiging
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(parseInt(e.target.value) || 3)}
              className="input max-w-xs"
              disabled={!automaticRemindersEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Herinneringen worden verstuurd naar schippers die {reminderDaysBefore} {reminderDaysBefore === 1 ? 'dag' : 'dagen'} geleden uitgenodigd zijn en nog niet hebben gereageerd
            </p>
          </div>
          <div>
            <button
              onClick={handleSaveReminderSettings}
              className="btn-primary"
              disabled={savingReminders}
            >
              {savingReminders ? 'Opslaan...' : 'Instellingen Opslaan'}
            </button>
          </div>
        </div>
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

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Event type verwijderen"
        message={`Weet je zeker dat je "${deleteConfirm?.label}" wilt verwijderen?`}
        confirmLabel="Verwijderen"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
