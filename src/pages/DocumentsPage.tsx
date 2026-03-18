import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface Document {
  id: number;
  filename: string;
  access_token: string;
  created_at: string;
  is_active: boolean;
  share_url: string;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const res = await api.get('/api/documents');
      setDocuments(res.data);
    } catch {}
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0] || !password) return;

    const formData = new FormData();
    formData.append('file', fileRef.current.files[0]);
    formData.append('password', password);

    setUploading(true);
    try {
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPassword('');
      if (fileRef.current) fileRef.current.value = '';
      await loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload mislukt');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(token: string) {
    if (!confirm('Document verwijderen?')) return;
    await api.delete(`/api/documents/${token}`);
    await loadDocuments();
  }

  function copyLink(url: string, token: string) {
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Documenten delen</h1>
        <p className="text-gray-500 mt-1">Upload een PDF en deel hem via een beveiligde link met wachtwoord.</p>
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Nieuw document uploaden</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF bestand</label>
            <input ref={fileRef} type="file" accept=".pdf" required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-ocean-50 file:text-ocean-700 hover:file:bg-ocean-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Kies een wachtwoord voor dit document"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-700 disabled:opacity-50"
          >
            {uploading ? 'Uploaden...' : 'Uploaden & link genereren'}
          </button>
        </form>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Gedeelde documenten</h2>
        </div>
        {documents.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">Nog geen documenten geüpload.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map(doc => (
              <div key={doc.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(doc.created_at).toLocaleDateString('nl-NL')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(doc.share_url, doc.access_token)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                  >
                    {copied === doc.access_token ? '✓ Gekopieerd' : 'Kopieer link'}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.access_token)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
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
