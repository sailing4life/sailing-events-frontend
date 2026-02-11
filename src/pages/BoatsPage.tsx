import { useState, useEffect } from 'react';
import { boatsApi } from '../services/api';
import type { Boat } from '../types';
import { BoatEditModal } from '../components/boats/BoatEditModal';
import { toast } from 'sonner';

export function BoatsPage() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createFormData, setCreateFormData] = useState({
    name: '',
    capacity: 12,
    boat_type: '',
    intern_extern: 'Intern',
    is_active: true,
  });

  useEffect(() => {
    loadBoats();
  }, []);

  const loadBoats = async () => {
    try {
      const data = await boatsApi.getAll();
      setBoats(data);
    } catch (error) {
      console.error('Error loading boats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (boatId: number) => {
    try {
      const updatedBoat = await boatsApi.toggleAvailability(boatId);
      setBoats(boats.map(b => b.id === boatId ? { ...b, is_active: updatedBoat.is_active } : b));
    } catch (error) {
      console.error('Error toggling boat availability:', error);
      toast.error('Fout bij het wijzigen van beschikbaarheid');
    }
  };

  const handleOpenEdit = (boat: Boat) => {
    setSelectedBoat(boat);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedBoat(null);
  };

  const handleBoatUpdated = (updatedBoat: Boat) => {
    setBoats(prev => prev.map(b => b.id === updatedBoat.id ? updatedBoat : b));
    setSelectedBoat(updatedBoat);
  };

  const handleCreateSubmit = async () => {
    setCreating(true);
    try {
      await boatsApi.create(createFormData);
      toast.success('Boot succesvol toegevoegd!');
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        capacity: 12,
        boat_type: '',
        intern_extern: 'Intern',
        is_active: true,
      });
      await loadBoats();
    } catch (error) {
      console.error('Error creating boat:', error);
      toast.error('Fout bij toevoegen van boot');
    } finally {
      setCreating(false);
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Boten</h1>
          <p className="text-gray-600">Beheer je vloot</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          ➕ Nieuwe Boot
        </button>
      </div>

      {/* Search */}
      {boats.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Zoek op naam of type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>
      )}

      {boats.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-600 mb-4">Nog geen boten in de database</p>
          <p className="text-sm text-gray-500">Gebruik de Excel import op de Schippers pagina om boten toe te voegen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {boats
            .filter((b) => {
              const query = searchQuery.toLowerCase();
              return !query || b.name.toLowerCase().includes(query) || b.boat_type.toLowerCase().includes(query);
            })
            .map((boat) => (
          <div key={boat.id} className="card">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center">
                <span className="text-3xl">⛵</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{boat.name}</h3>
              <span className={`badge ${boat.is_active ? 'badge-yes' : 'bg-gray-200 text-gray-600'}`}>
                {boat.is_active ? 'Beschikbaar' : 'Niet beschikbaar'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">{boat.boat_type}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Eigendom:</span>
                <span className="font-medium text-gray-900">{boat.intern_extern}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              <button
                onClick={() => handleOpenEdit(boat)}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
              >
                🔧 Onderhoud
              </button>
              <button
                onClick={() => toggleAvailability(boat.id)}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  boat.is_active
                    ? 'bg-ocean-100 text-ocean-700 hover:bg-ocean-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {boat.is_active ? '✓ Beschikbaar' : '✗ Niet beschikbaar'}
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nieuwe Boot</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
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
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <input
                    type="text"
                    value={createFormData.boat_type}
                    onChange={(e) => setCreateFormData({ ...createFormData, boat_type: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intern/Extern
                    </label>
                    <select
                      value={createFormData.intern_extern}
                      onChange={(e) => setCreateFormData({ ...createFormData, intern_extern: e.target.value })}
                      className="input"
                    >
                      <option value="Intern">Intern</option>
                      <option value="Extern">Extern</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="create_is_active_boat"
                      checked={createFormData.is_active}
                      onChange={(e) => setCreateFormData({ ...createFormData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="create_is_active_boat" className="ml-2 text-sm font-medium text-gray-700">
                      Beschikbaar
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateSubmit}
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Toevoegen...' : 'Toevoegen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boat Edit Modal */}
      <BoatEditModal
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        onUpdated={handleBoatUpdated}
        boat={selectedBoat}
      />
    </div>
  );
}
