import type { EventDuration, Skipper } from '../types';

export const defaultInvitationRate = (person: Skipper, duration: EventDuration) =>
  (duration === 'full_day' ? person.full_day_rate : person.half_day_rate) ?? 0;

export const formatRate = (amount: number) =>
  amount.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });

export const validRate = (rate: number | undefined) =>
  rate === undefined || (Number.isFinite(rate) && rate >= 0 && Math.abs(rate * 100 - Math.round(rate * 100)) < 0.000001);

export const ratesForPeople = (people: Skipper[], duration: EventDuration, overrides: Record<number, number | undefined>) =>
  Object.fromEntries(people.map(person => [person.id, overrides[person.id] ?? defaultInvitationRate(person, duration)]));
