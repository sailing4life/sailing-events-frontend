import { useState } from 'react';
import type { Event, Skipper, InvitationRole } from '../types';
import type { Batch, Selection } from '../services/planningApi';
import { roles, durations } from '../services/planningApi';

type Props = { events: Event[]; skippers: Skipper[]; batches: Batch[]; selections: Selection[];
  onChange: (items: Selection[]) => void; disabled: boolean };
const supported = (s: Skipper, role: InvitationRole) => role === 'coach' ? s.is_coach : role === 'race_director' ? s.is_race_director : s.is_skipper;

export function InvitationMatrix({ events, skippers, batches, selections, onChange, disabled }: Props) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<InvitationRole>('skipper');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [eventFilter, setEventFilter] = useState('');
  const [undo, setUndo] = useState<Selection[] | null>(null);
  const chosen = new Map(selections.map(s => [`${s.event_id}:${s.skipper_id}`, s]));
  const visibleEvents = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date)).filter(e => !eventFilter || e.id === Number(eventFilter));
  const people = skippers.filter(s => s.is_active && supported(s, role)
    && `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
    && (!selectedOnly || selections.some(v => v.skipper_id === s.id)))
    .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'nl'));
  function reserved(e: Event, s: Skipper) {
    const existing = e.invitations?.find(i => i.skipper.id === s.id);
    return Boolean(existing && (existing.invitation_sent_at || existing.status !== 'pending'
      || batches.some(b => b.recipients.some(r => r.email === s.email && r.events.some(v => v.id === e.id)))));
  }
  function change(items: Selection[]) { setUndo(selections); onChange(items); }
  function toggle(e: Event, s: Skipper) {
    const key = `${e.id}:${s.id}`;
    change(chosen.has(key) ? selections.filter(v => `${v.event_id}:${v.skipper_id}` !== key)
      : [...selections, { event_id: e.id, skipper_id: s.id, role }]);
  }
  function addMany(eventList: Event[], personList: Skipper[]) {
    const additions = eventList.flatMap(e => personList.filter(s => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`))
      .map(s => ({ event_id: e.id, skipper_id: s.id, role })));
    if (additions.length) change([...selections, ...additions]);
  }
  const additionsCount = visibleEvents.reduce((sum, e) => sum + people.filter(s => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`)).length, 0);

  return <div className="space-y-4">
    <div className="grid gap-3 lg:grid-cols-[1fr_200px_220px]">
      <label className="text-sm font-medium text-slate-600">Zoek schipper<input type="search" placeholder="Naam of e-mailadres…" value={search} onChange={e => setSearch(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-600">Uitnodigen als<select value={role} onChange={e => setRole(e.target.value as InvitationRole)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">{Object.entries(roles).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-600">Events<select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"><option value="">Alle events in deze maand</option>{events.map(e => <option key={e.id} value={e.id}>{e.event_name}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={selectedOnly} onChange={e => setSelectedOnly(e.target.checked)} />Alleen personen met een selectie</label>
      <span className="text-slate-500">{people.length} personen · {visibleEvents.length} events</span>
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ocean-50 p-3 text-sm">
      <button disabled={disabled || !additionsCount} onClick={() => addMany(visibleEvents, people)} className="rounded-md bg-white px-3 py-2 font-semibold text-ocean-800 shadow-sm disabled:opacity-40">Zichtbare personen voor alle getoonde events toevoegen ({additionsCount})</button>
      <button disabled={disabled || !selections.length} onClick={() => change([])} className="px-2 py-2 text-slate-600 underline disabled:opacity-40">Selectie wissen</button>
      {undo && <button disabled={disabled} onClick={() => { onChange(undo); setUndo(null); }} className="px-2 py-2 font-medium text-ocean-800 underline">Ongedaan maken</button>}
    </div>
    <p className="text-sm text-slate-500">Vink per persoon en event aan. Met ‘Iedereen toevoegen’ kies je de zichtbare personen in één keer. Bestaande selecties houden hun rol.</p>
    <div className="max-h-[560px] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-20"><tr>
          <th scope="col" className="sticky left-0 z-30 min-w-[210px] border-b border-r border-slate-200 bg-slate-100 p-4 text-left">Schipper <span className="block text-xs font-normal text-slate-500">Selecteer over de hele maand</span></th>
          {visibleEvents.map(e => <th key={e.id} scope="col" className="min-w-[190px] max-w-[230px] border-b border-r border-slate-200 bg-slate-50 p-3 text-left align-top">
            <span className="text-xs font-semibold uppercase tracking-wide text-ocean-700">{new Date(`${e.event_date}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
            <span className="mt-1 block font-semibold text-slate-900">{e.event_name}</span>
            <span className="mt-1 block text-xs font-normal text-slate-500">{e.start_time && e.end_time ? `${e.start_time.slice(0, 5)} – ${e.end_time.slice(0, 5)}` : durations[e.duration]}</span>
            <span className="mt-2 block text-xs font-normal text-slate-600">{selections.filter(v => v.event_id === e.id).length} geselecteerd</span>
            <button disabled={disabled || !people.some(s => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`))} onClick={() => addMany([e], people)} className="mt-2 text-xs font-medium text-ocean-700 underline disabled:opacity-40">Iedereen toevoegen</button>
          </th>)}
        </tr></thead>
        <tbody>{people.map(s => <tr key={s.id} className="group">
          <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white p-3 text-left group-hover:bg-slate-50">
            <span className="block font-medium">{s.first_name} {s.last_name}</span>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">{selections.filter(v => v.skipper_id === s.id).length} events geselecteerd</span>
            <button disabled={disabled || !visibleEvents.some(e => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`))} onClick={() => addMany(visibleEvents, [s])} className="mt-1 text-xs font-normal text-ocean-700 underline disabled:opacity-40">Alle getoonde events toevoegen</button>
          </th>
          {visibleEvents.map(e => { const item = chosen.get(`${e.id}:${s.id}`); const locked = reserved(e, s);
            return <td key={e.id} className={`border-b border-r border-slate-100 p-3 text-center ${item ? 'bg-ocean-50' : 'bg-white group-hover:bg-slate-50'}`}>
              {locked ? <span className="text-xs text-slate-400">Al uitgenodigd / voorbereid</span> : <label className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1">
                <input type="checkbox" disabled={disabled} checked={Boolean(item)} onChange={() => toggle(e, s)} aria-label={`${s.first_name} ${s.last_name} uitnodigen voor ${e.event_name}`} className="h-5 w-5 accent-cyan-700" />
                {item && <span className="text-xs font-medium text-ocean-800">{roles[item.role]}</span>}
              </label>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
      {!people.length && <p className="p-8 text-center text-slate-500">Geen personen met deze filters. Pas je zoekopdracht of rol aan.</p>}
    </div>
  </div>;
}
