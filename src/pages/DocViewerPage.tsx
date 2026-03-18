import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export function DocViewerPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [pdfLoading, setPdfLoading] = useState(true);

  // Block print shortcut
  useEffect(() => {
    function blockPrint(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', blockPrint);
    return () => window.removeEventListener('keydown', blockPrint);
  }, []);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Measure container width for responsive rendering
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerWidth(node.getBoundingClientRect().width - 40);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Verify password
      const verifyRes = await fetch(`${API_BASE}/api/documents/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.detail || 'Verkeerd wachtwoord');
        return;
      }
      const verifyData = await verifyRes.json();
      setFilename(verifyData.filename);

      // Fetch PDF as blob
      const pdfRes = await fetch(`${API_BASE}/api/documents/${token}/file?pw=${encodeURIComponent(password)}`);
      if (!pdfRes.ok) {
        setError('Kon document niet laden.');
        return;
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setVerified(true);
    } catch {
      setError('Er ging iets mis. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  if (verified && blobUrl) {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#334155', userSelect: 'none' }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Header */}
        <div style={{ background: '#0891b2', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{filename}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 16, opacity: currentPage <= 1 ? 0.4 : 1 }}
            >‹</button>
            <span style={{ fontSize: 13 }}>{currentPage} / {numPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 16, opacity: currentPage >= numPages ? 0.4 : 1 }}
            >›</button>
          </div>
        </div>

        {/* Loading bar */}
        {pdfLoading && (
          <div style={{ position: 'absolute', top: 44, left: 0, right: 0, height: 3, zIndex: 10 }}>
            <div style={{ height: '100%', background: '#38bdf8', width: '60%', animation: 'pulse 1.2s ease-in-out infinite', borderRadius: 2 }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:.4;width:30%} 50%{opacity:1;width:70%} }`}</style>
          </div>
        )}

        {/* PDF viewer */}
        <div
          ref={containerRef}
          style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px 0' }}
        >
          <Document
            file={blobUrl}
            onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPdfLoading(false); }}
            onLoadError={(err) => { console.error('PDF load error:', err); setPdfLoading(false); }}
            loading={<div style={{ color: 'white', padding: 40 }}>Laden...</div>}
            error={<div style={{ color: '#f87171', padding: 40 }}>Fout bij laden PDF.</div>}
          >
            <Page
              pageNumber={currentPage}
              width={Math.min(containerWidth, 900)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        <div style={{ background: '#1e293b', color: '#64748b', textAlign: 'center', padding: '8px', fontSize: 12 }}>
          Team Heiner Event Manager
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 40, maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Beveiligd document</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Voer het wachtwoord in om dit document te bekijken.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            required
            autoFocus
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, marginBottom: 12, boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#0891b2', color: 'white', border: 'none', borderRadius: 8, padding: '11px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Controleren...' : 'Bekijken'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>Team Heiner Event Manager</p>
      </div>
    </div>
  );
}
