import { useState, useEffect } from 'react';
import { skippersApi, excelApi } from '../services/api';
import type { Skipper } from '../types';
import { SkipperDetailsModal } from '../components/skippers/SkipperDetailsModal';
import { toast } from 'sonner';

export function SkippersPage() {
  const [skippers, setSkippers] = useState<Skipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingSkipper, setEditingSkipper] = useState<Skipper | null>(null);
  const [selectedSkipper, setSelectedSkipper] = useState<Skipper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'skipper' | 'coach' | 'race_director'>('all');
  const [createFormData, setCreateFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    half_day_rate: 0,
    full_day_rate: 0,
    notes: '',
    is_active: true,
    is_skipper: true,
    is_coach: false,
    is_race_director: false,
  });
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    half_day_rate: 0,
    full_day_rate: 0,
    notes: '',
    is_active: true,
    is_skipper: true,
    is_coach: false,
    is_race_director: false,
  });

  useEffect(() => {
    loadSkippers();
  }, []);

  const loadSkippers = async () => {
    try {
      const data = await skippersApi.getAll();
      setSkippers(data);
    } catch (error) {
      console.error('Error loading skippers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await excelApi.import(file);
      toast.success(result.message);
      await loadSkippers();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Fout bij uploaden van Excel bestand');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditModal = (skipper: Skipper) => {
    setEditingSkipper(skipper);
    setEditFormData({
      first_name: skipper.first_name,
      last_name: skipper.last_name,
      email: skipper.email,
      phone: skipper.phone,
      half_day_rate: skipper.half_day_rate,
      full_day_rate: skipper.full_day_rate,
      notes: skipper.notes || '',
      is_active: skipper.is_active,
      is_skipper: skipper.is_skipper,
      is_coach: skipper.is_coach,
      is_race_director: skipper.is_race_director,
    });
    setShowEditModal(true);
  };

  const handleOpenDetails = (skipper: Skipper) => {
    setSelectedSkipper(skipper);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedSkipper(null);
  };

  const handleEditSubmit = async () => {
    if (!editingSkipper) return;

    try {
      await skippersApi.update(editingSkipper.id, editFormData);
      toast.success('Schipper succesvol bijgewerkt!');
      setShowEditModal(false);
      await loadSkippers();
    } catch (error) {
      console.error('Error updating skipper:', error);
      toast.error('Fout bij bijwerken van schipper');
    }
  };

  const handleCreateSubmit = async () => {
    setCreating(true);
    try {
      await skippersApi.create(createFormData);
      toast.success('Schipper succesvol toegevoegd!');
      setShowCreateModal(false);
      setCreateFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        half_day_rate: 0,
        full_day_rate: 0,
        notes: '',
        is_active: true,
        is_skipper: true,
        is_coach: false,
        is_race_director: false,
      });
      await loadSkippers();
    } catch (error) {
      console.error('Error creating skipper:', error);
      toast.error('Fout bij toevoegen van schipper');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schippers</h1>
          <p className="text-gray-600">Beheer je freelance schippers</p>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              ➕ Nieuwe Schipper
            </button>
            <label className="btn-primary cursor-pointer inline-block">
              {uploading ? 'Uploaden...' : '📤 Excel Importeren'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Zoek op naam, email of telefoon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'Alle' },
            { key: 'skipper', label: 'Schippers' },
            { key: 'coach', label: 'Coaches' },
            { key: 'race_director', label: 'Wedstrijdleiders' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                roleFilter === key
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {skippers.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-600 mb-4">Nog geen schippers in de database</p>
          <p className="text-sm text-gray-500">Upload een Excel bestand om schippers toe te voegen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skippers
            .filter((s) => {
              const query = searchQuery.toLowerCase();
              const matchesSearch = !query ||
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query) ||
                s.phone.includes(query);
              const matchesRole = roleFilter === 'all' ||
                (roleFilter === 'skipper' && s.is_skipper) ||
                (roleFilter === 'coach' && s.is_coach) ||
                (roleFilter === 'race_director' && s.is_race_director);
              return matchesSearch && matchesRole;
            })
            .map((skipper) => (
          <div key={skipper.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {skipper.first_name} {skipper.last_name}
                </h3>
                <p className="text-sm text-gray-500">{skipper.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenDetails(skipper)}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  Details
                </button>
                <button
                  onClick={() => handleOpenEditModal(skipper)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  title="Bewerken"
                >
                  ✏️
                </button>
                <span className={`badge ${skipper.is_active ? 'badge-yes' : 'bg-gray-200 text-gray-600'}`}>
                  {skipper.is_active ? 'Actief' : 'Inactief'}
                </span>
              </div>
            </div>

            {/* Role badges */}
            <div className="flex flex-wrap gap-1 mb-3">
              {skipper.is_skipper && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">
                  Schipper
                </span>
              )}
              {skipper.is_coach && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Coach
                </span>
              )}
              {skipper.is_race_director && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Wedstrijdleider
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {skipper.phone}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tarief (hele dag):</span>
                <span className="font-semibold text-gray-900">€{skipper.full_day_rate}</span>
              </div>
            </div>

            {skipper.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 italic">{skipper.notes}</p>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nieuwe Schipper</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voornaam *
                    </label>
                    <input
                      type="text"
                      value={createFormData.first_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, first_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achternaam *
                    </label>
                    <input
                      type="text"
                      value={createFormData.last_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefoon *
                    </label>
                    <input
                      type="tel"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Halve dag tarief (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createFormData.half_day_rate}
                      onChange={(e) => setCreateFormData({ ...createFormData, half_day_rate: parseFloat(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hele dag tarief (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createFormData.full_day_rate}
                      onChange={(e) => {
                        const fullDayRate = parseFloat(e.target.value) || 0;
                        setCreateFormData({
                          ...createFormData,
                          full_day_rate: fullDayRate,
                          half_day_rate: fullDayRate * 0.75
                        });
                      }}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notities
                  </label>
                  <textarea
                    value={createFormData.notes}
                    onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="create_is_active"
                      checked={createFormData.is_active}
                      onChange={(e) => setCreateFormData({ ...createFormData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="create_is_active" className="ml-2 text-sm font-medium text-gray-700">
                      Actief (beschikbaar voor events)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="create_is_skipper"
                      checked={createFormData.is_skipper}
                      onChange={(e) => setCreateFormData({ ...createFormData, is_skipper: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="create_is_skipper" className="ml-2 text-sm font-medium text-gray-700">
                      Schipper (kan als schipper worden ingezet)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="create_is_coach"
                      checked={createFormData.is_coach}
                      onChange={(e) => setCreateFormData({ ...createFormData, is_coach: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="create_is_coach" className="ml-2 text-sm font-medium text-gray-700">
                      Coach (kan coaching events doen)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="create_is_race_director"
                      checked={createFormData.is_race_director}
                      onChange={(e) => setCreateFormData({ ...createFormData, is_race_director: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="create_is_race_director" className="ml-2 text-sm font-medium text-gray-700">
                      Wedstrijdleider (kan wedstrijdleiding doen)
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

      <SkipperDetailsModal
        isOpen={showDetailsModal}
        skipper={selectedSkipper}
        onClose={handleCloseDetails}
      />

      {/* Edit Modal */}
      {showEditModal && editingSkipper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Schipper Bewerken</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voornaam *
                    </label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achternaam *
                    </label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefoon *
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Rate Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Halve dag tarief (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.half_day_rate}
                      onChange={(e) => setEditFormData({ ...editFormData, half_day_rate: parseFloat(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hele dag tarief (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.full_day_rate}
                      onChange={(e) => {
                        const fullDayRate = parseFloat(e.target.value) || 0;
                        setEditFormData({
                          ...editFormData,
                          full_day_rate: fullDayRate,
                          half_day_rate: fullDayRate * 0.75  // Auto-update half day to 75%
                        });
                      }}
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notities
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editFormData.is_active}
                      onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                      Actief (beschikbaar voor events)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_skipper"
                      checked={editFormData.is_skipper}
                      onChange={(e) => setEditFormData({ ...editFormData, is_skipper: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_skipper" className="ml-2 text-sm font-medium text-gray-700">
                      Schipper (kan als schipper worden ingezet)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_coach"
                      checked={editFormData.is_coach}
                      onChange={(e) => setEditFormData({ ...editFormData, is_coach: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_coach" className="ml-2 text-sm font-medium text-gray-700">
                      Coach (kan coaching events doen)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_race_director"
                      checked={editFormData.is_race_director}
                      onChange={(e) => setEditFormData({ ...editFormData, is_race_director: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_race_director" className="ml-2 text-sm font-medium text-gray-700">
                      Wedstrijdleider (kan wedstrijdleiding doen)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="btn-primary"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
