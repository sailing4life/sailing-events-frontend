import { useState } from 'react';
import type { Event, Skipper, InvitationRole, EventTypeConfig } from '../types';
import type { Batch, Selection } from '../services/planningApi';
import { roles, durations } from '../services/planningApi';

type Props = { events: Event[]; eventTypes: EventTypeConfig[]; skippers: Skipper[]; batches: Batch[]; selections: Selection[];
  onChange: (items: Selection[]) => void; disabled: boolean };
const supported = (s: Skipper, role: InvitationRole) => role === 'coach' ? s.is_coach : role === 'race_director' ? s.is_race_director : s.is_skipper;
const roleStyles: Record<InvitationRole, string> = {
  skipper: 'border-cyan-300 bg-cyan-50 text-cyan-900',
  head_skipper: 'border-amber-300 bg-amber-50 text-amber-900',
  race_director: 'border-purple-300 bg-purple-50 text-purple-900',
  coach: 'border-green-300 bg-green-50 text-green-900',
};
const roleDescriptions: Record<InvitationRole, string> = {
  skipper: 'Schipper aan boord', head_skipper: 'Coördinatie als hoofdschipper',
  race_director: 'Begeleiding van de wedstrijd', coach: 'Coaching en begeleiding',
};
const roleKeys: InvitationRole[] = ['skipper', 'head_skipper', 'race_director', 'coach'];

export function InvitationMatrix({ events, eventTypes, skippers, batches, selections, onChange, disabled }: Props) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<InvitationRole>('skipper');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [eventFilter, setEventFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [undo, setUndo] = useState<Selection[] | null>(null);
  const chosen = new Map(selections.map(s => [`${s.event_id}:${s.skipper_id}`, s]));
  const typeLabel = (code: string) => eventTypes.find(t => t.code === code)?.label || code;
  const monthTypes = [...new Set(events.map(e => e.event_type))].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b), 'nl'));
  const typeEvents = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date)).filter(e => !typeFilter || e.event_type === typeFilter);
  const visibleEvents = typeEvents.filter(e => !eventFilter || e.id === Number(eventFilter));
  const hiddenSelections = selections.filter(s => !visibleEvents.some(e => e.id === s.event_id)).length;
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
  function changeRole(eventId: number, skipper: Skipper, nextRole: InvitationRole) {
    if (!supported(skipper, nextRole)) return;
    change(selections.map(item => item.event_id === eventId && item.skipper_id === skipper.id ? { ...item, role: nextRole } : item));
  }
  function addMany(eventList: Event[], personList: Skipper[]) {
    const additions = eventList.flatMap(e => personList.filter(s => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`))
      .map(s => ({ event_id: e.id, skipper_id: s.id, role })));
    if (additions.length) change([...selections, ...additions]);
  }
  const additionsCount = visibleEvents.reduce((sum, e) => sum + people.filter(s => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`)).length, 0);

  return <div className="space-y-4">
    <fieldset disabled={disabled} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-2 text-base font-semibold text-slate-900">Voor welke rol nodig je mensen uit?</legend>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{roleKeys.map(key => <button type="button" key={key} aria-pressed={role === key} onClick={() => setRole(key)} className={`rounded-lg border-2 p-3 text-left transition-colors ${role === key ? `${roleStyles[key]} ring-2 ring-slate-400 ring-offset-2` : 'border-slate-200 bg-white text-slate-600'}`}>
        <span className="block text-base font-bold">{role === key ? '✓ ' : ''}{roles[key]}</span>
        <span className="mt-1 block text-xs">{roleDescriptions[key]}</span>
        <span className="mt-2 block text-xs font-semibold">{selections.filter(item => item.role === key).length} uitnodigingen geselecteerd</span>
      </button>)}</div>
      <p className="mt-4 text-sm text-slate-700">Nieuwe selecties worden uitgenodigd als <strong>{roles[role]}</strong>. Je ziet personen die deze rol kunnen vervullen. Eerder gekozen rollen veranderen niet als je hierboven wisselt.</p>
    </fieldset>
    <div className="grid gap-3 lg:grid-cols-3">
      <label className="text-sm font-medium text-slate-600">Zoek schipper<input type="search" placeholder="Naam of e-mailadres…" value={search} onChange={e => setSearch(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-600">Eventtype<select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setEventFilter(''); }} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"><option value="">Alle eventtypes</option>{monthTypes.map(code => <option key={code} value={code}>{typeLabel(code)} ({events.filter(e => e.event_type === code).length})</option>)}</select></label>
      <label className="text-sm font-medium text-slate-600">Events<select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"><option value="">{typeFilter ? `Alle events: ${typeLabel(typeFilter)}` : 'Alle events in deze maand'}</option>{typeEvents.map(e => <option key={e.id} value={e.id}>{e.event_name} — {typeLabel(e.event_type)}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={selectedOnly} onChange={e => setSelectedOnly(e.target.checked)} />Alleen personen met een selectie</label>
      <span className="text-slate-500">{people.length} personen · {visibleEvents.length} events</span>
    </div>
    {hiddenSelections > 0 && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{hiddenSelections} eerder gekozen uitnodigingen vallen buiten het eventfilter. Ze blijven onderdeel van de uitvraag. <button className="font-medium underline" onClick={() => { setTypeFilter(''); setEventFilter(''); }}>Alle events tonen</button></p>}
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ocean-50 p-3 text-sm">
      <button disabled={disabled || !additionsCount} onClick={() => addMany(visibleEvents, people)} className="rounded-md bg-white px-3 py-2 font-semibold text-ocean-800 shadow-sm disabled:opacity-40">Zichtbare personen als {roles[role]} toevoegen aan alle getoonde events ({additionsCount})</button>
      <button disabled={disabled || !selections.length} onClick={() => change([])} className="px-2 py-2 text-slate-600 underline disabled:opacity-40">Selectie wissen</button>
      {undo && <button disabled={disabled} onClick={() => { onChange(undo); setUndo(null); }} className="px-2 py-2 font-medium text-ocean-800 underline">Ongedaan maken</button>}
    </div>
    <p className="text-sm text-slate-500">Vink een persoon aan bij een event. De rol staat bij elke uitnodiging en kun je daar direct wijzigen. Per persoon kies je een rol per event.</p>
    <div className="max-h-[560px] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-20"><tr>
          <th scope="col" className="sticky left-0 z-30 min-w-[210px] border-b border-r border-slate-200 bg-slate-100 p-4 text-left">Persoon <span className="block text-xs font-normal text-slate-500">Nieuwe uitnodigingen als {roles[role]}</span></th>
          {visibleEvents.map(e => <th key={e.id} scope="col" className="min-w-[190px] max-w-[230px] border-b border-r border-slate-200 bg-slate-50 p-3 text-left align-top">
            <span className="text-xs font-semibold uppercase tracking-wide text-ocean-700">{new Date(`${e.event_date}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
            <span className="mt-1 block font-semibold text-slate-900">{e.event_name}</span>
            <span className="mt-2 inline-block rounded bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-800">{typeLabel(e.event_type)}</span>
            <span className="mt-1 block text-xs font-normal text-slate-500">{e.start_time && e.end_time ? `${e.start_time.slice(0, 5)} – ${e.end_time.slice(0, 5)}` : durations[e.duration]}</span>
            <span className="mt-2 block text-xs font-normal text-slate-600">{selections.filter(v => v.event_id === e.id).length} geselecteerd</span>
            <div className="mt-2 flex flex-wrap gap-1">{roleKeys.map(key => { const count = selections.filter(v => v.event_id === e.id && v.role === key).length; return count ? <span key={key} className={`rounded border px-2 py-1 text-xs font-medium ${roleStyles[key]}`}>{count} × {roles[key]}</span> : null; })}</div>
            <button disabled={disabled || !people.some(s => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`))} onClick={() => addMany([e], people)} className="mt-2 text-xs font-medium text-ocean-700 underline disabled:opacity-40">Iedereen als {roles[role]} toevoegen</button>
          </th>)}
        </tr></thead>
        <tbody>{people.map(s => <tr key={s.id} className="group">
          <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white p-3 text-left group-hover:bg-slate-50">
            <span className="block font-medium">{s.first_name} {s.last_name}</span>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">{selections.filter(v => v.skipper_id === s.id).length} events geselecteerd</span>
            <button disabled={disabled || !visibleEvents.some(e => !reserved(e, s) && !chosen.has(`${e.id}:${s.id}`))} onClick={() => addMany(visibleEvents, [s])} className="mt-1 text-xs font-normal text-ocean-700 underline disabled:opacity-40">Als {roles[role]} voor alle getoonde events</button>
          </th>
          {visibleEvents.map(e => { const item = chosen.get(`${e.id}:${s.id}`); const locked = reserved(e, s);
            return <td key={e.id} className={`border-b border-r border-slate-100 p-3 text-center ${item ? 'bg-ocean-50' : 'bg-white group-hover:bg-slate-50'}`}>
              {locked ? <div className="text-xs text-slate-500"><span className="block font-semibold">{roles[e.invitations.find(i => i.skipper.id === s.id)!.role]}</span><span>Al uitgenodigd / voorbereid</span></div> : <div className="flex min-h-12 flex-col items-center justify-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" disabled={disabled} checked={Boolean(item)} onChange={() => toggle(e, s)} aria-label={`${s.first_name} ${s.last_name} als ${roles[item?.role || role]} uitnodigen voor ${e.event_name}`} className="h-5 w-5 accent-cyan-700" />{item ? 'Uitnodigen als' : `Als ${roles[role]}`}</label>
                {item && <select disabled={disabled} aria-label={`Rol van ${s.first_name} ${s.last_name} bij ${e.event_name}`} value={item.role} onChange={event => changeRole(e.id, s, event.target.value as InvitationRole)} className={`w-full rounded-lg border px-2 py-2 text-sm font-semibold ${roleStyles[item.role]}`}>
                  {roleKeys.filter(key => supported(s, key)).map(key => <option key={key} value={key}>{roles[key]}</option>)}
                </select>}
              </div>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
      {!people.length && <p className="p-8 text-center text-slate-500">Geen personen met deze filters. Pas je zoekopdracht of rol aan.</p>}
    </div>
  </div>;
}
