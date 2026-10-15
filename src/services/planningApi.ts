import axios from 'axios';
import type { InvitationRole, InvitationStatus } from '../types';

// Separate client: a skipper session must never redirect to the admin login.
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, headers: { 'Content-Type': 'application/json', 'X-Planning-Request': '1', 'ngrok-skip-browser-warning': 'true' } });

export interface PlanningInvitation {
  id: number; event_name: string; company_name: string; date: string; duration: string;
  start_time: string | null; end_time: string | null; role: InvitationRole; status: InvitationStatus;
  note: string; can_respond: boolean; boats: string[]; withdrawal_requested: boolean;
}
export interface Planning { name: string; invitations: PlanningInvitation[]; history?: PlanningInvitation[] }
export interface Selection { event_id: number; skipper_id: number; role: InvitationRole }
export interface Batch {
  id: string; month: string; kind: string;
  recipients: { id: string; name: string; email: string; state: string; error: string | null; delivered_at: string | null;
    events: { id: number; name: string; date: string; time: string; role: string }[] }[];
}
export const roles: Record<InvitationRole, string> = { skipper: 'Schipper', head_skipper: 'Hoofdschipper', coach: 'Coach', race_director: 'Wedstrijdleiding' };
export const durations: Record<string, string> = { morning: 'Ochtend', afternoon: 'Middag', evening: 'Avond', full_day: 'Hele dag', half_day: 'Halve dag' };
export const errorMessage = (error: unknown) => axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
  ? error.response.data.detail : 'Dit is niet gelukt. Probeer het opnieuw.';
export const planningApi = {
  get: async () => (await client.get<Planning>('/api/planning')).data,
  requestLink: async (email: string) => (await client.post('/api/planning/request-link', { email })).data,
  login: async (token: string) => client.post('/api/planning/login', { token }),
  logout: async () => client.post('/api/planning/logout'),
  respond: async (answers: { id: number; status: string; note: string }[]) => client.post('/api/planning/responses', { answers }),
  withdraw: async (id: number, reason: string) => client.post(`/api/planning/${id}/withdraw`, { reason }),
};
export const batchesApi = {
  list: async () => (await client.get<Batch[]>('/api/invitation-batches')).data,
  prepare: async (month: string, selections: Selection[]) => (await client.post<Batch>('/api/invitation-batches/prepare', { month, selections })).data,
  send: async (id: string) => (await client.post<Batch>(`/api/invitation-batches/${id}/send`)).data,
  discard: async (id: string) => client.delete(`/api/invitation-batches/${id}`),
};
