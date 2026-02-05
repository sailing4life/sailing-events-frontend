import { useState, useEffect } from 'react';
import { boatsApi } from '../services/api';
import type { BoatMaintenance } from '../types';

export function MaintenancePage() {
  const [tasks, setTasks] = useState<BoatMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await boatsApi.getAllMaintenance();
      setTasks(data);
    } catch (error) {
      console.error('Error loading maintenance tasks:', error);
      alert('Fout bij het laden van onderhoudstaken');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: BoatMaintenance) => {
    try {
      await boatsApi.updateMaintenance(task.boat_id, task.id, {
        is_completed: !task.is_completed
      });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Fout bij het bijwerken van taak');
    }
  };

  const handleDeleteTask = async (task: BoatMaintenance) => {
    if (!confirm('Weet je zeker dat je deze taak wilt verwijderen?')) return;

    try {
      await boatsApi.deleteMaintenance(task.boat_id, task.id);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Fout bij het verwijderen van taak');
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

  const getPriorityOrder = (priority: string) => {
    switch (priority) {
      case 'urgent': return 0;
      case 'high': return 1;
      case 'normal': return 2;
      case 'low': return 3;
      default: return 4;
    }
  };

  // Group tasks by boat
  const tasksByBoat = tasks.reduce((acc, task) => {
    const boatName = task.boat_name || 'Onbekend';
    if (!acc[boatName]) {
      acc[boatName] = [];
    }
    acc[boatName].push(task);
    return acc;
  }, {} as Record<string, BoatMaintenance[]>);

  // Sort boats alphabetically
  const sortedBoatNames = Object.keys(tasksByBoat).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🔧 Onderhoud Overzicht</h1>
        <p className="text-gray-600 mt-2">Alle onderhoudstaken van alle boten</p>
      </div>

      {sortedBoatNames.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Geen onderhoudstaken gevonden</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedBoatNames.map((boatName) => {
            const boatTasks = tasksByBoat[boatName];
            const pendingTasks = boatTasks
              .filter(t => !t.is_completed)
              .sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority));
            const completedTasks = boatTasks.filter(t => t.is_completed);

            return (
              <div key={boatName} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Boat Header */}
                <div className="bg-cyan-600 text-white px-6 py-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    ⛵ {boatName}
                    <span className="text-sm font-normal opacity-90">
                      ({pendingTasks.length} te doen, {completedTasks.length} voltooid)
                    </span>
                  </h2>
                </div>

                <div className="p-6">
                  {/* Pending Tasks */}
                  {pendingTasks.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        📋 Te doen ({pendingTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-cyan-300 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => handleToggleComplete(task)}
                              className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{task.task}</p>
                              {task.notes && (
                                <p className="text-sm text-gray-500 mt-1">{task.notes}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Toegevoegd: {new Date(task.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Verwijder taak"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        ✅ Voltooid ({completedTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleComplete(task)}
                              className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
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
                              onClick={() => handleDeleteTask(task)}
                              className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Verwijder taak"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingTasks.length === 0 && completedTasks.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Geen onderhoudstaken voor deze boot
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
