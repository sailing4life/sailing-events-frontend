import axios from 'axios';
import type { Boat, BoatMaintenance, Skipper, Event, Invitation, EventTypeConfig, NotificationItem, SkipperEventHistory, SkipperOpenEvent } from '../types';

// API Base URL - uses environment variable if available, falls back to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Bypass ngrok browser warning for API calls
    'ngrok-skip-browser-warning': 'true',
  },
});

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const ensureArray = <T>(value: unknown, label: string): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as T[];
      }
    } catch (error) {
      throw new Error(`${label} response is not valid JSON`);
    }
  }
  throw new Error(`${label} response is not an array`);
};

// Boats API
export const boatsApi = {
  getAll: async (): Promise<Boat[]> => {
    const response = await api.get('/api/boats');
    return ensureArray<Boat>(response.data, 'boats');
  },
  create: async (boatData: {
    name: string;
    capacity: number;
    boat_type: string;
    intern_extern: string;
    is_active: boolean;
  }): Promise<Boat> => {
    const response = await api.post('/api/boats', boatData);
    return response.data;
  },
  update: async (boatId: number, boatData: {
    name?: string;
    capacity?: number;
    boat_type?: string;
    intern_extern?: string;
    is_active?: boolean;
  }): Promise<Boat> => {
    const response = await api.put(`/api/boats/${boatId}`, boatData);
    return response.data;
  },
  toggleAvailability: async (boatId: number): Promise<Boat> => {
    const response = await api.patch(`/api/boats/${boatId}/toggle`);
    return response.data;
  },

  // Boat Maintenance
  getMaintenance: async (boatId: number): Promise<BoatMaintenance[]> => {
    const response = await api.get(`/api/boats/${boatId}/maintenance`);
    return ensureArray<BoatMaintenance>(response.data, 'maintenance tasks');
  },
  getAllMaintenance: async (): Promise<BoatMaintenance[]> => {
    const response = await api.get('/api/boats/maintenance/all');
    return ensureArray<BoatMaintenance>(response.data, 'all maintenance tasks');
  },
  createMaintenance: async (boatId: number, taskData: {
    task: string;
    priority?: string;
    notes?: string;
  }): Promise<BoatMaintenance> => {
    const response = await api.post(`/api/boats/${boatId}/maintenance`, taskData);
    return response.data;
  },
  updateMaintenance: async (boatId: number, taskId: number, taskData: {
    task?: string;
    is_completed?: boolean;
    priority?: string;
    notes?: string;
  }): Promise<BoatMaintenance> => {
    const response = await api.put(`/api/boats/${boatId}/maintenance/${taskId}`, taskData);
    return response.data;
  },
  deleteMaintenance: async (boatId: number, taskId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/boats/${boatId}/maintenance/${taskId}`);
    return response.data;
  },
};

// Skippers API
export const skippersApi = {
  getAll: async (): Promise<Skipper[]> => {
    const response = await api.get('/api/skippers');
    return ensureArray<Skipper>(response.data, 'skippers');
  },
  getHistory: async (skipperId: number): Promise<SkipperEventHistory[]> => {
    const response = await api.get(`/api/skippers/${skipperId}/history`);
    return ensureArray<SkipperEventHistory>(response.data, 'skipper history');
  },
  getOpenEvents: async (skipperId: number): Promise<SkipperOpenEvent[]> => {
    const response = await api.get(`/api/skippers/${skipperId}/open-events`);
    return ensureArray<SkipperOpenEvent>(response.data, 'open events');
  },
  create: async (skipperData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    half_day_rate: number;
    full_day_rate: number;
    notes?: string;
    is_active: boolean;
    is_skipper: boolean;
    is_coach: boolean;
    is_race_director: boolean;
  }): Promise<Skipper> => {
    const response = await api.post('/api/skippers', skipperData);
    return response.data;
  },

  update: async (skipperId: number, skipperData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    half_day_rate: number;
    full_day_rate: number;
    notes?: string;
    is_active: boolean;
    is_skipper: boolean;
    is_coach: boolean;
    is_race_director: boolean;
  }): Promise<Skipper> => {
    const response = await api.put(`/api/skippers/${skipperId}`, skipperData);
    return response.data;
  },
};

// Excel API
export const excelApi = {
  import: async (file: File): Promise<{ success: boolean; message: string; details: any }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/excel/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  export: async (): Promise<Blob> => {
    const response = await api.get('/api/excel/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Events API
export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get('/api/events');
    return ensureArray<Event>(response.data, 'events');
  },

  getById: async (eventId: number): Promise<Event> => {
    const response = await api.get(`/api/events/${eventId}`);
    return response.data;
  },

  create: async (eventData: {
    event_name: string;
    company_name: string;
    event_date: string;
    duration: string;
    event_type: string;
    notes?: string;
    required_race_directors: number;
    required_coaches: number;
    boat_ids: number[];
  }): Promise<Event> => {
    const response = await api.post('/api/events', eventData);
    return response.data;
  },

  update: async (eventId: number, eventData: {
    event_name: string;
    company_name: string;
    event_date: string;
    duration: string;
    event_type: string;
    notes?: string;
    required_race_directors: number;
    required_coaches: number;
    boat_ids?: number[];
  }): Promise<Event> => {
    const response = await api.put(`/api/events/${eventId}`, eventData);
    return response.data;
  },

  delete: async (eventId: number): Promise<{
    message: string;
    deleted: boolean;
    cancellation_emails?: { total: number; sent: number; failed: number; failed_emails: string[] };
  }> => {
    const response = await api.delete(`/api/events/${eventId}`);
    return response.data;
  },

  sendReminder: async (eventId: number): Promise<{ message: string; sent: number; failed: number }> => {
    const response = await api.post(`/api/events/${eventId}/send-reminder`);
    return response.data;
  },

  // Invitations (NEW WORKFLOW)
  sendInvitations: async (
    eventId: number,
    invitationData: {
      skipper_ids?: number[];
      head_skipper_id?: number;
      race_director_ids?: number[];
      coach_ids?: number[];
    }
  ): Promise<{
    message: string;
    invitations_sent: number;
    invitations_failed: number;
    skippers: number;
    head_skipper: number;
    race_directors: number;
    coaches: number;
  }> => {
    const response = await api.post(`/api/events/${eventId}/invitations`, invitationData);
    return response.data;
  },

  getInvitations: async (eventId: number): Promise<Invitation[]> => {
    const response = await api.get(`/api/events/${eventId}/invitations`);
    return ensureArray<Invitation>(response.data, 'invitations');
  },

  sendInvitationReminder: async (eventId: number): Promise<{ message: string; sent: number; failed: number }> => {
    const response = await api.post(`/api/events/${eventId}/invitations/send-reminder`);
    return response.data;
  },

  finalize: async (eventId: number): Promise<{
    success: boolean;
    message: string;
    assignments_created: number;
    notifications_sent: number;
    notifications_failed: number;
    race_directors: number;
  }> => {
    const response = await api.post(`/api/events/${eventId}/finalize`);
    return response.data;
  },

  assignManual: async (
    eventId: number,
    assignment: { skipper_id: number; boat_id: number; role: string }
  ): Promise<{ success: boolean; message: string; event_boat_id: number; notification_sent: boolean }> => {
    const response = await api.post(`/api/events/${eventId}/assign-manual`, assignment);
    return response.data;
  },

  confirmDirect: async (
    eventId: number,
    assignments: Array<{ skipper_id: number; role: string }>
  ): Promise<{
    success: boolean;
    message: string;
    confirmed: number;
    updated: number;
    total_processed: number;
    emails_sent: number;
    emails_failed: number;
  }> => {
    const response = await api.post(`/api/events/${eventId}/confirm-direct`, { assignments });
    return response.data;
  },

  close: async (eventId: number): Promise<{
    message: string;
    emails: { total: number; sent: number; failed: number; failed_emails: string[] };
  }> => {
    const response = await api.post(`/api/events/${eventId}/close`);
    return response.data;
  },

  replaceSkipper: async (eventId: number, data: {
    original_invitation_id: number;
    replacement_skipper_id: number;
    replacement_reason: string;
  }): Promise<{
    success: boolean;
    message: string;
    original_invitation_id: number;
    replacement_invitation_id: number;
    cancellation_email_sent: boolean;
    confirmation_email_sent: boolean;
  }> => {
    const response = await api.post(`/api/events/${eventId}/replace-skipper`, data);
    return response.data;
  },
};

// Event Types API
export const eventTypesApi = {
  getAll: async (includeInactive = false): Promise<EventTypeConfig[]> => {
    const response = await api.get('/api/event-types', {
      params: { include_inactive: includeInactive },
    });
    return ensureArray<EventTypeConfig>(response.data, 'event-types');
  },
  create: async (data: {
    code?: string;
    label: string;
    is_active: boolean;
  }): Promise<EventTypeConfig> => {
    const response = await api.post('/api/event-types', data);
    return response.data;
  },
  update: async (eventTypeId: number, data: {
    label: string;
    is_active: boolean;
  }): Promise<EventTypeConfig> => {
    const response = await api.put(`/api/event-types/${eventTypeId}`, data);
    return response.data;
  },
  delete: async (eventTypeId: number): Promise<{ deleted: boolean }> => {
    const response = await api.delete(`/api/event-types/${eventTypeId}`);
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  getAdminNotifications: async (): Promise<{ admin_email: string; admin_notifications_enabled: boolean }> => {
    const response = await api.get('/api/settings/admin-notifications');
    return response.data;
  },
  updateAdminNotifications: async (settings: { admin_email: string; admin_notifications_enabled: boolean }): Promise<{ admin_email: string; admin_notifications_enabled: boolean }> => {
    const response = await api.put('/api/settings/admin-notifications', settings);
    return response.data;
  },
  getReminderSettings: async (): Promise<{ automatic_reminders_enabled: boolean; reminder_days_before: number }> => {
    const response = await api.get('/api/settings/reminders');
    return response.data;
  },
  updateReminderSettings: async (settings: { automatic_reminders_enabled: boolean; reminder_days_before: number }): Promise<{ automatic_reminders_enabled: boolean; reminder_days_before: number }> => {
    const response = await api.put('/api/settings/reminders', settings);
    return response.data;
  },
};

// Invitations API
export const invitationsApi = {
  confirm: async (invitationId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/invitations/${invitationId}/confirm`);
    return response.data;
  },
  sendReminder: async (invitationId: number): Promise<{ message: string; sent: number; failed: number }> => {
    const response = await api.post(`/api/invitations/${invitationId}/send-reminder`);
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (limit = 50): Promise<NotificationItem[]> => {
    const response = await api.get('/api/notifications', { params: { limit } });
    return ensureArray<NotificationItem>(response.data, 'notifications');
  },
  markRead: async (ids?: number[]): Promise<{ updated: number }> => {
    const response = await api.post('/api/notifications/mark-read', ids || []);
    return response.data;
  },
};

// Statistics API
export const statisticsApi = {
  getOverview: async (): Promise<{
    year: number;
    total_events: number;
    boat_days: number;
    boat_days_by_event_type: Array<{
      event_type: string;
      label?: string;
      boat_days: number;
    }>;
    boat_usage: Array<{
      id: number;
      name: string;
      boat_type: string;
      times_used: number;
    }>;
    skipper_participation: Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      times_participated: number;
    }>;
    event_types: Array<{
      event_type: string;
      count: number;
    }>;
  }> => {
    const response = await api.get('/api/statistics/overview');
    return response.data;
  },
};

export default api;
