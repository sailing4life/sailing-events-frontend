import { formatRate, validRate } from '../../utils/invitationRates';

type Props = { name: string; defaultRate: number; value: number | undefined;
  onChange: (value: number | undefined) => void; disabled?: boolean };

export function InvitationRateInput({ name, defaultRate, value, onChange, disabled }: Props) {
  return <label className="block text-left text-sm font-medium text-slate-700">
    Tarief voor dit event (€)
    <input type="number" min="0" step="0.01" inputMode="decimal" disabled={disabled}
      aria-label={`Tarief voor ${name}`} aria-invalid={!validRate(value)}
      value={value ?? ''} placeholder={defaultRate.toFixed(2)}
      onChange={event => onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)}
      className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
    <span className="mt-1 block text-xs font-normal text-slate-500">Standaard: {formatRate(defaultRate)}. Leeg = standaard.</span>
    {!validRate(value) && <span className="block text-xs text-red-700">Vul een positief bedrag of 0 in, met maximaal 2 decimalen.</span>}
  </label>;
}
