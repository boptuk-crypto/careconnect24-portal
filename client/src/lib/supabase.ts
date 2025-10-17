import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export type UserRole = 'customer' | 'caregiver' | 'admin';
export type DaySlot = 'morning' | 'noon' | 'afternoon' | 'evening';
export type VitalType = 'blood_pressure' | 'heart_rate' | 'blood_glucose' | 'temperature' | 'oxygen_saturation';
export type TaskStatus = 'open' | 'in_progress' | 'done';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  display_name: string;
  birth_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Vital {
  id: number;
  patient_id: string;
  type: VitalType;
  systolic: number | null;
  diastolic: number | null;
  value: number | null;
  measured_at: string;
  recorded_by: string | null;
}

export interface CareLog {
  id: number;
  patient_id: string;
  slot: DaySlot;
  title: string | null;
  details: string | null;
  mood: string | null;
  completed: boolean;
  occurred_at: string;
  recorded_by: string | null;
}

export interface Task {
  id: number;
  patient_id: string;
  assigned_to: string | null;
  title: string;
  due_at: string | null;
  status: TaskStatus;
  created_by: string | null;
  created_at: string;
}

export interface Document {
  id: number;
  patient_id: string | null;
  owner_id: string | null;
  path: string;
  label: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: string | null;
  action: string;
  table_name: string;
  row_id: string | null;
  patient_id: string | null;
  details: any;
  created_at: string;
}

// Helper function to get signed URL for document download
export async function getSignedDocumentUrl(path: string): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/sign-url?path=${encodeURIComponent(path)}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

// Helper function to submit lead capture form
export async function submitLead(data: {
  type: 'customer' | 'caregiver';
  name: string;
  email: string;
  phone: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/lead-capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to submit lead' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting lead:', error);
    return { success: false, error: 'Network error' };
  }
}

