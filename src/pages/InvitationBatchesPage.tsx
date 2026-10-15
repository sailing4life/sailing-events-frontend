import { InvitationMatrix } from '../components/InvitationMatrix';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, skippersApi, eventTypesApi } from '../services/api';
import { batchesApi, errorMessage } from '../services/planningApi';
import type { Batch, Selection } from '../services/planningApi';
import type { Event, Skipper, EventTypeConfig } from '../types';

const button = 'rounded-lg bg-ocean-600 px-4 py-2 font-medium text-white disabled:opacity-50';
const states: Record<string, string> = { draft: 'Klaar voor verzending', sending: 'Verzending gestart', sent: 'Verstuurd', failed: 'Niet verstuurd', unknown: 'Controle nodig', skipped: 'Overgeslagen: niet meer van toepassing' };
const dateNL = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });

export function InvitationBatchesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [skippers, setSkippers] = useState<Skipper[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const [selections, setSelections] = useState<Selection[]>([]);
  const [preview, setPreview] = useState<Batch | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    const [e, s, b, t] = await Promise.all([eventsApi.getAll(), skippersApi.getAll(), batchesApi.list(), eventTypesApi.getAll(true)]);
    setEvents(e); setSkippers(s); setBatches(b); setEventTypes(t);
  }
  useEffect(() => { refresh().catch(e => setError(errorMessage(e))).finally(() => setLoading(false)); }, []);
  async function action(work: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await work(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const monthEvents = events.filter(e => e.event_date.startsWith(month) && e.event_date >= today && e.workflow_phase === 'invitation');
  const availableEvents = monthEvents.filter(e => !e.is_fully_staffed);
  const fullCount = monthEvents.length - availableEvents.length;
  return <div className="w-full space-y-6">
    <div><h1 className="text-3xl font-bold">Maanduitvragen</h1><p className="mt-2 text-gray-600">Selecteer events en personen. Iedere schipper ontvangt één mail met de eigen uitnodigingen.</p><Link className="text-ocean-700 underline" to="/mijn-planning" target="_blank">Persoonlijke planningspagina openen</Link></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    {loading ? <p>Laden…</p> : <>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">1. Kies de maand en uitnodigingen</h2>
        <label className="my-4 block">Maand<input type="month" className="ml-3 rounded-lg border p-2" value={month} disabled={busy} onChange={e => { setMonth(e.target.value); setSelections([]); setPreview(null); }} /></label>
        {fullCount > 0 && <p className="mb-4 text-sm text-gray-500">{fullCount} volledig bezette {fullCount === 1 ? 'event wordt' : 'events worden'} niet getoond.</p>}
        {!availableEvents.length && <p className="text-gray-500">Geen toekomstige events met open plekken in deze maand.</p>}
        {availableEvents.length > 0 && <InvitationMatrix key={`${month}-${batches.length}`} events={availableEvents} eventTypes={eventTypes} skippers={skippers} batches={batches} selections={selections} onChange={setSelections} disabled={busy} />}
        <div className="sticky bottom-3 z-30 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-lg"><button className={button} disabled={busy || selections.length === 0} onClick={() => action(async () => {
          const batch = await batchesApi.prepare(month, selections); setPreview(batch); setSelections([]); await refresh();
        })}>Uitvraag voorbereiden</button><span className="text-sm text-gray-600">{selections.length} uitnodigingen · {new Set(selections.map(s => s.skipper_id)).size} persoonlijke mails</span></div>
        <p className="mt-2 text-sm text-gray-500">Voorbereiden bewaart de bundel. Er wordt pas gemaild na controle en verzending hieronder.</p>
      </section>
      {preview && <section className="rounded-xl border border-ocean-200 bg-white p-5">
        <h2 className="text-lg font-semibold">2. Controleer de mails · {preview.month}</h2><p className="my-2 text-sm text-gray-600">Iedere mail bevat onderstaande events en een persoonlijke knop naar Mijn planning.</p>
        <div className="max-h-[520px] space-y-2 overflow-y-auto">{preview.recipients.map(r => <details key={r.id} className="rounded-lg border p-4">
          <summary className="flex cursor-pointer flex-wrap justify-between gap-2"><span className="font-semibold">{r.name} <span className="text-sm font-normal text-gray-500">? {r.events.length} events</span></span><span className="text-sm">{r.delivered_at ? 'Bezorgd' : states[r.state] || r.state}</span></summary><p className="text-sm text-gray-500">{r.email}</p>
          <ul className="my-3 space-y-2">{r.events.map(e => <li key={e.id}>{dateNL(e.date)} · {e.time} · {e.name} <span className="text-gray-500">({e.role})</span></li>)}</ul>
          {r.error && <p className="text-sm text-red-700">{r.error}</p>}
          {r.state === 'sending' && <p className="text-sm text-amber-700">Bij een onderbroken verzending: controleer Resend voordat je opnieuw uitnodigt.</p>}
        </details>)}</div>
        <button disabled={busy || !preview.recipients.some(r => ['draft', 'failed'].includes(r.state))} className={`${button} mt-5`} onClick={() => action(async () => {
          const result = await batchesApi.send(preview.id); setPreview(result); await refresh();
          setMessage(`Verzending verwerkt: ${result.recipients.filter(r => r.state === 'sent').length} verstuurd, ${result.recipients.filter(r => ['failed', 'unknown', 'sending'].includes(r.state)).length} vereisen aandacht.`);
        })}>{busy ? 'Bezig…' : 'Verstuur de persoonlijke mails'}</button>
        {preview.recipients.every(r => ['draft', 'failed', 'skipped'].includes(r.state)) && <button disabled={busy} className="ml-4 text-sm underline" onClick={() => action(async () => {
          await batchesApi.discard(preview.id); setPreview(null); await refresh(); setMessage('Concept verwijderd. Je kunt de selectie opnieuw maken.');
        })}>Concept verwijderen en opnieuw samenstellen</button>}
      </section>}
      <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 text-lg font-semibold">Opgeslagen verzendbundels</h2>
        {!batches.length && <p className="text-gray-500">Nog geen bundels voorbereid.</p>}
        {batches.map(b => <button key={b.id} className="flex w-full flex-wrap justify-between gap-2 border-b py-3 text-left hover:text-ocean-700" onClick={() => setPreview(b)}><span>{b.month} · {b.kind === 'reminder' ? 'Herinnering' : 'Uitvraag'}</span><span>{b.recipients.length} mails · {b.recipients.filter(r => r.state === 'sent').length} verstuurd · Bekijken</span></button>)}
      </section>
    </>}
  </div>;
}
