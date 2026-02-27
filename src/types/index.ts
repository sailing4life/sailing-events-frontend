export type EventDuration = 'half_day' | 'morning' | 'afternoon' | 'full_day';
export type EventType = string;
export type ResponseStatus = 'pending' | 'yes' | 'no' | 'maybe';
export type EventWorkflowPhase = 'invitation' | 'finalized';
export type InvitationRole = 'skipper' | 'head_skipper' | 'race_director' | 'coach';
export type InvitationStatus = 'pending' | 'available' | 'unavailable' | 'maybe' | 'confirmed';

export interface Boat {
  id: number;
  name: string;
  capacity: number;
  boat_type: string;
  intern_extern: string;
  is_active: boolean;
}

export interface BoatMaintenance {
  id: number;
  boat_id: number;
  boat_name?: string;
  task: string;
  is_completed: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  completed_at?: string;
  notes?: string;
}

export interface Skipper {
  id: number;
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
}

export interface EventBoat {
  id: number;
  boat: Boat;
  skipper?: Skipper;
  response_status: ResponseStatus;
  email_sent_at?: string;
  response_received_at?: string;
}

export interface Invitation {
  id: number;
  skipper: Skipper;
  role: InvitationRole;
  status: InvitationStatus;
  invitation_sent_at?: string;
  response_received_at?: string;
}

export interface Event {
  id: number;
  event_name: string;
  company_name: string;
  event_date: string;
  duration: EventDuration;
  event_type: EventType;
  notes?: string;
  required_race_directors: number;
  required_coaches: number;
  workflow_phase: EventWorkflowPhase;
  event_boats: EventBoat[];
  invitations: Invitation[];
  created_at: string;
}

export interface EventTypeConfig {
  id: number;
  code: string;
  label: string;
  is_active: boolean;
}

export interface SkipperStats {
  skipper: Skipper;
  total_events: number;
  total_confirmations: number;
  total_declines: number;
  total_maybes: number;
  response_rate: number;
}

export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  event_id?: number;
  invitation_id?: number;
  skipper_id?: number;
  response_status?: string;
  is_read: boolean;
  created_at: string;
}

export interface SkipperEventHistory {
  event_id: number;
  event_name: string;
  company_name: string;
  event_date: string;
  duration: string;
  role: string;
  status: string;
}

export interface SkipperOpenEvent {
  event_id: number;
  event_name: string;
  company_name: string;
  event_date: string;
  duration: string;
  remaining_skippers: number;
}
