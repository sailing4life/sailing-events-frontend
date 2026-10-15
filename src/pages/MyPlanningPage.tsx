import { useEffect, useState } from 'react';
import axios from 'axios';
import { planningApi, roles, durations, errorMessage } from '../services/planningApi';
import type { Planning, PlanningInvitation } from '../services/planningApi';

const button = 'rounded-lg bg-ocean-600 px-5 py-3 font-medium text-white hover:bg-ocean-700 disabled:opacity-50';
const input = 'w-full rounded-lg border border-gray-300 p-3';
type Answer = { id: number; status: string; note: string };

export function MyPlanningPage() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [month, setMonth] = useState('');
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [withdrawId, setWithdrawId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Keep the secret out of history/referrers; a deliberate click consumes it.
    window.history.replaceState(null, '', window.location.pathname);
    let active = true;
    planningApi.get().then(data => { if (active) setPlanning(data); }).catch(e => {
      if (active && (!axios.isAxiosError(e) || e.response?.status !== 401)) setError(errorMessage(e));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function action(work: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await work(); } catch (e) {
      setError(errorMessage(e));
      if (axios.isAxiosError(e) && e.response?.status === 401) setPlanning(null);
    } finally { setBusy(false); }
  }

  const visible = (planning?.invitations || []).filter(i => !month || i.date.startsWith(month));
  const months = [...new Set(planning?.invitations.map(i => i.date.slice(0, 7)) || [])];
  function update(inv: PlanningInvitation, status: string, note?: string) {
    setAnswers(old => ({ ...old, [inv.id]: { id: inv.id, status, note: note ?? old[inv.id]?.note ?? inv.note } }));
  }

  function card(inv: PlanningInvitation) {
    const answer = answers[inv.id];
    const status = answer?.status ?? inv.status;
    return <article key={inv.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-ocean-700">{new Date(`${inv.date}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
        {' · '}{inv.start_time && inv.end_time ? `${inv.start_time.slice(0, 5)} – ${inv.end_time.slice(0, 5)}` : durations[inv.duration]}</p>
      <h3 className="mt-2 text-lg font-semibold">{inv.event_name}</h3>
      <p className="text-gray-600">{inv.company_name} · {roles[inv.role]}</p>
      {inv.boats.length > 0 && <p className="mt-2">Boot: {inv.boats.join(', ')}</p>}
      {inv.can_respond ? <fieldset disabled={busy} className="mt-4">
        <legend className="mb-2 text-sm font-medium">Kun je op deze datum?</legend>
        <div className="flex flex-wrap gap-2">{[['available', 'Ja, ik kan'], ['maybe', 'Misschien'], ['unavailable', 'Nee']].map(([value, label]) =>
          <label key={value} className={`cursor-pointer rounded-lg border px-4 py-3 ${status === value ? 'border-ocean-600 bg-ocean-50 text-ocean-800' : 'border-gray-300'}`}>
            <input type="radio" name={`answer-${inv.id}`} value={value} checked={status === value} onChange={() => update(inv, value)} className="mr-2" />{label}
          </label>)}</div>
        {status === 'maybe' && <label className="mt-3 block text-sm">Toelichting (optioneel)
          <textarea className={`${input} mt-1`} maxLength={1000} value={answer?.note ?? inv.note} onChange={e => update(inv, status, e.target.value)} />
        </label>}
      </fieldset> : inv.status === 'confirmed' ? <div className="mt-4">
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">Definitief ingepland</span>
        {inv.withdrawal_requested ? <p className="mt-3 text-amber-800">Afmelding doorgegeven. De planner verwerkt je verzoek.</p> :
          <button disabled={busy} className="mt-4 block text-sm text-gray-600 underline" onClick={() => { setWithdrawId(inv.id); setReason(''); }}>Ik kan toch niet — afmelding doorgeven</button>}
      </div> : <p className="mt-3 text-sm text-gray-600">Deze uitvraag is gesloten. Je bent niet definitief ingepland.</p>}
    </article>;
  }

  return <div className="min-h-screen bg-slate-50 text-gray-900">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5">
      <div><p className="text-sm font-semibold text-ocean-600">Team Heiner</p><h1 className="text-2xl font-bold">Mijn planning</h1></div>
      {planning && <button disabled={busy} className="text-sm underline" onClick={() => action(async () => { await planningApi.logout(); setPlanning(null); setToken(null); setAnswers({}); })}>Uitloggen</button>}
    </div></header>
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
      {loading ? <p>Planning laden…</p> : !planning || token ? <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Welkom aan boord</h2><p className="my-4 text-gray-600">Bekijk je uitnodigingen en bevestigde indeling. Je hebt geen wachtwoord nodig.</p>
        {token && <button disabled={busy} className={`${button} mb-6 w-full`} onClick={() => action(async () => {
          const value = token; setToken(null); setPlanning(null); setAnswers({}); await planningApi.login(value); setPlanning(await planningApi.get());
        })}>Mijn planning openen</button>}
        <form onSubmit={e => { e.preventDefault(); action(async () => { const result = await planningApi.requestLink(email); setMessage(result.message); }); }}>
          <label className="block font-medium">E-mailadres<input type="email" autoComplete="email" required className={`${input} mt-2`} value={email} onChange={e => setEmail(e.target.value)} /></label>
          <button disabled={busy} className={`${button} mt-4`}>Stuur mij een inloglink</button>
          <p className="mt-4 text-sm text-gray-500">De link is 30 minuten geldig. Na inloggen blijf je op dit apparaat 30 dagen ingelogd.</p>
        </form>
      </section> : <>
        <div><h2 className="text-xl font-semibold">Hoi {planning.name}</h2><p className="mt-2 text-gray-600">Geef je beschikbaarheid door. Je bent pas ingepland zodra een event onder ‘Definitief ingepland’ staat.</p></div>
        <label className="block text-sm font-medium">Periode<select className={`${input} mt-2 bg-white`} value={month} onChange={e => setMonth(e.target.value)}><option value="">Alle komende events</option>{months.map(m => <option key={m} value={m}>{new Date(`${m}-01T12:00:00`).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</option>)}</select></label>
        {!visible.length && <p className="rounded-xl border bg-white p-6">Je hebt nog geen uitnodigingen of indelingen voor deze periode.</p>}
        {[
          { title: 'Nog beantwoorden', items: visible.filter(i => i.status === 'pending' && i.can_respond) },
          { title: 'Beschikbaarheid doorgegeven', items: visible.filter(i => ['available', 'maybe'].includes(i.status) && i.can_respond) },
          { title: 'Definitief ingepland', items: visible.filter(i => i.status === 'confirmed') },
          { title: 'Niet beschikbaar of uitvraag gesloten', items: visible.filter(i => i.status === 'unavailable' || (!i.can_respond && i.status !== 'confirmed')) },
        ].filter(g => g.items.length).map(g => <section key={g.title} className="space-y-3"><h2 className="text-lg font-semibold">{g.title} <span className="text-gray-500">({g.items.length})</span></h2>{g.items.map(card)}</section>)}
        {Object.keys(answers).length > 0 && <div className="sticky bottom-3 flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-lg"><span>{Object.keys(answers).length} gewijzigde antwoorden</span>
          <button disabled={busy} className={button} onClick={() => action(async () => { await planningApi.respond(Object.values(answers)); setAnswers({}); setPlanning(await planningApi.get()); setMessage('Je beschikbaarheid is opgeslagen.'); })}>Antwoorden opslaan</button></div>}
        {withdrawId !== null && <section className="rounded-xl border border-amber-300 bg-white p-5"><h2 className="font-semibold">Afmelding doorgeven</h2><p className="my-2 text-sm">De planner ontvangt je verzoek en regelt de vervanging. Je indeling blijft zichtbaar totdat dit verwerkt is.</p>
          <label className="text-sm">Reden<textarea className={input} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>
          <div className="mt-3 flex gap-3"><button disabled={busy || !reason.trim()} className={button} onClick={() => action(async () => { await planningApi.withdraw(withdrawId, reason); setWithdrawId(null); setPlanning(await planningApi.get()); setMessage('Je afmelding is doorgegeven aan de planner.'); })}>Afmelding versturen</button><button disabled={busy} onClick={() => setWithdrawId(null)}>Annuleren</button></div>
        </section>}
      </>}
    </main>
  </div>;
}
