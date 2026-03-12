import { useState, useEffect } from 'react';
import type { Boat, BoatMaintenance } from '../../types';
import { boatsApi } from '../../services/api';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { toast } from 'sonner';

interface BoatEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (boat: Boat) => void;
  boat: Boat | null;
}

export function BoatEditModal({ isOpen, onClose, onUpdated, boat }: BoatEditModalProps) {
  const [maintenanceTasks, setMaintenanceTasks] = useState<BoatMaintenance[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);
  const [savingBoat, setSavingBoat] = useState(false);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<number | null>(null);
  const [boatForm, setBoatForm] = useState({
    name: '',
    capacity: 0,
    boat_type: '',
    intern_extern: 'Intern',
    is_active: true,
  });

  useEffect(() => {
    if (isOpen && boat) {
      loadMaintenanceTasks();
      setBoatForm({
        name: boat.name,
        capacity: boat.capacity,
        boat_type: boat.boat_type,
        intern_extern: boat.intern_extern,
        is_active: boat.is_active,
      });
    }
  }, [isOpen, boat]);

  const loadMaintenanceTasks = async () => {
    if (!boat) return;
    try {
      const tasks = await boatsApi.getMaintenance(boat.id);
      setMaintenanceTasks(tasks);
    } catch (error) {
      console.error('Error loading maintenance tasks:', error);
    }
  };

  const handleAddTask = async () => {
    if (!boat || !newTask.trim()) return;

    setLoading(true);
    try {
      await boatsApi.createMaintenance(boat.id, {
        task: newTask,
        priority: newPriority
      });
      setNewTask('');
      setNewPriority('normal');
      await loadMaintenanceTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Fout bij het toevoegen van taak');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: BoatMaintenance) => {
    if (!boat) return;

    try {
      await boatsApi.updateMaintenance(boat.id, task.id, {
        is_completed: !task.is_completed
      });
      await loadMaintenanceTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setDeleteTaskConfirm(taskId);
  };

  const executeDeleteTask = async () => {
    if (!boat || deleteTaskConfirm === null) return;

    try {
      await boatsApi.deleteMaintenance(boat.id, deleteTaskConfirm);
      setDeleteTaskConfirm(null);
      await loadMaintenanceTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Fout bij het verwijderen van taak');
      setDeleteTaskConfirm(null);
    }
  };

  const handleSaveBoat = async () => {
    if (!boat) return;

    setSavingBoat(true);
    try {
      const updated = await boatsApi.update(boat.id, {
        name: boatForm.name.trim(),
        capacity: boatForm.capacity,
        boat_type: boatForm.boat_type.trim(),
        intern_extern: boatForm.intern_extern,
        is_active: boatForm.is_active,
      });
      onUpdated?.(updated);
      toast.success('Bootgegevens bijgewerkt!');
    } catch (error) {
      console.error('Error updating boat:', error);
      toast.error('Fout bij het bijwerken van de boot');
    } finally {
      setSavingBoat(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen || !boat) return null;

  const pendingTasks = maintenanceTasks.filter(t => !t.is_completed);
  const completedTasks = maintenanceTasks.filter(t => t.is_completed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">⛵ {boat.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {boat.boat_type} • {boat.capacity} personen • {boat.intern_extern}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Boat Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bootgegevens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                <input
                  type="text"
                  value={boatForm.name}
                  onChange={(e) => setBoatForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capaciteit</label>
                <input
                  type="number"
                  min={1}
                  value={boatForm.capacity}
                  onChange={(e) => setBoatForm(prev => ({ ...prev, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  value={boatForm.boat_type}
                  onChange={(e) => setBoatForm(prev => ({ ...prev, boat_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eigendom</label>
                <select
                  value={boatForm.intern_extern}
                  onChange={(e) => setBoatForm(prev => ({ ...prev, intern_extern: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="Intern">Intern</option>
                  <option value="Extern">Extern</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="boat-active"
                  type="checkbox"
                  checked={boatForm.is_active}
                  onChange={(e) => setBoatForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <label htmlFor="boat-active" className="text-sm text-gray-700">
                  Beschikbaar
                </label>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleSaveBoat}
                disabled={savingBoat || !boatForm.name.trim()}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
              >
                {savingBoat ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>

          {/* Maintenance Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Onderhoud Taken</h3>

            {/* Add New Task */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Nieuwe onderhouds taak..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  disabled={loading}
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="low">Laag</option>
                  <option value="normal">Normaal</option>
                  <option value="high">Hoog</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  onClick={handleAddTask}
                  disabled={loading || !newTask.trim()}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                >
                  Toevoegen
                </button>
              </div>
            </div>

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Te doen ({pendingTasks.length})</h4>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleToggleComplete(task)}
                        className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                      />
                      <div className="flex-1">
                        <p className="text-gray-900">{task.task}</p>
                        {task.notes && <p className="text-sm text-gray-500 mt-1">{task.notes}</p>}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Voltooid ({completedTasks.length})</h4>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggleComplete(task)}
                        className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                      />
                      <div className="flex-1">
                        <p className="text-gray-500 line-through">{task.task}</p>
                        {task.completed_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Voltooid: {new Date(task.completed_at).toLocaleDateString('nl-NL')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {maintenanceTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Geen onderhoudstaken. Voeg er een toe om te beginnen!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            Sluiten
          </button>
        </div>

        <ConfirmDialog
          isOpen={deleteTaskConfirm !== null}
          title="Taak verwijderen"
          message="Weet je zeker dat je deze taak wilt verwijderen?"
          confirmLabel="Verwijderen"
          variant="danger"
          onConfirm={executeDeleteTask}
          onCancel={() => setDeleteTaskConfirm(null)}
        />
      </div>
    </div>
  );
}
