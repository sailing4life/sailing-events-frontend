import { useState } from 'react';
import type { EventDuration, Skipper } from '../../types';
import { defaultInvitationRate, validRate } from '../../utils/invitationRates';
import { InvitationRateInput } from './InvitationRateInput';

type Props = { people: Skipper[]; duration: EventDuration; rates: Record<number, number | undefined>;
  onChange: (rates: Record<number, number | undefined>) => void; disabled?: boolean };

export function InvitationRatesEditor({ people, duration, rates, onChange, disabled }: Props) {
  const [bulkRate, setBulkRate] = useState('');
  if (!people.length) return null;
  return <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
    <h3 className="font-semibold text-slate-900">Tarieven in de uitnodigingen</h3>
    <p className="text-sm text-slate-600">Het bedrag geldt per persoon voor dit event en staat in de uitvraag. Je kunt per persoon afwijken van het standaardtarief.</p>
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm font-medium text-slate-700">Zelfde tarief voor deze selectie (€)
        <input type="number" min="0" step="0.01" inputMode="decimal" value={bulkRate} disabled={disabled}
          onChange={event => setBulkRate(event.target.value)} className="mt-1 block min-h-11 w-44 rounded-lg border px-3 py-2" />
      </label>
      <button type="button" disabled={disabled || bulkRate === '' || !validRate(Number(bulkRate))}
        onClick={() => onChange({ ...rates, ...Object.fromEntries(people.map(person => [person.id, Number(bulkRate)])) })}
        className="min-h-11 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-ocean-700 disabled:opacity-40">Toepassen op selectie</button>
      <button type="button" disabled={disabled} onClick={() => onChange({ ...rates, ...Object.fromEntries(people.map(person => [person.id, undefined])) })}
        className="min-h-11 px-2 text-sm text-slate-600 underline">Standaardtarieven herstellen</button>
    </div>
    <div className="space-y-3">{people.map(person => <div key={person.id} className="grid items-start gap-2 rounded-lg border bg-white p-3 sm:grid-cols-2">
      <p className="font-medium text-slate-900">{person.first_name} {person.last_name}</p>
      <InvitationRateInput name={`${person.first_name} ${person.last_name}`} defaultRate={defaultInvitationRate(person, duration)}
        value={rates[person.id]} disabled={disabled} onChange={value => onChange({ ...rates, [person.id]: value })} />
    </div>)}</div>
  </section>;
}
