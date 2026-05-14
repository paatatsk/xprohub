// XProHub — Global TypeScript Types

export type UserRole = 'customer' | 'worker' | 'both';

export type BeltLevel =
  | 'white' | 'yellow' | 'orange' | 'green'
  | 'blue' | 'purple' | 'brown' | 'black';

export type JobStatus =
  | 'open' | 'matched' | 'in_progress' | 'pending_confirmation'
  | 'completed' | 'cancelled' | 'expired' | 'disputed';

export type EscrowStatus =
  | 'pending' | 'held' | 'released' | 'refunded' | 'disputed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  bio?: string;
  belt_level: BeltLevel;
  xp_total: number;
  xp_level: number;
  level_name: string;
  rating_avg: number;
  jobs_completed: number;
  jobs_posted: number;
  total_earned: number;
  total_spent: number;
  is_verified: boolean;
  is_insured: boolean;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  city: string;
  state: string;
  insurance_tier: 'basic' | 'standard' | 'premium';
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  worker_id?: string;
  title: string;
  description?: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  agreed_price?: number;
  status: JobStatus;
  timing: 'asap' | 'scheduled' | 'flexible';
  scheduled_at?: string;
  location_address?: string;
  photos?: string[];
  watcher_count: number;
  is_urgent: boolean;
  created_at: string;
}

export interface Bid {
  id: string;
  job_id: string;
  worker_id: string;
  proposed_price: number;
  message?: string;
  match_score?: number;
  match_reasons?: string[];
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'job_card' | 'payment_request' | 'system';
  is_read: boolean;
  created_at: string;
}
