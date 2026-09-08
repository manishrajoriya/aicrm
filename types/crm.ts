export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'In Progress'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost';

export type LeadPriority = 'Low' | 'Medium' | 'High';

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Cold Call'
  | 'Social Media'
  | 'Event'
  | 'WhatsApp'
  | 'Other';

export type TeamRole = 'Sales Executive' | 'Lead Specialist' | 'Manager' | 'Admin';

export type ActivityType =
  | 'call'
  | 'whatsapp'
  | 'note'
  | 'meeting'
  | 'email'
  | 'status_change';

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  outcome?: string | null;
  performed_by?: string | null;
  scheduled_at?: string | null;
  meeting_link?: string | null;
  created_at: string;
}

export interface ScheduledMeetingItem extends LeadActivity {
  lead?: Lead;
}

export interface TeamMember {
  id: string;
  user_id?: string | null;
  owner_id?: string | null;
  organization_name?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  role: TeamRole;
  is_owner?: boolean;
  status: 'active' | 'inactive';
  avatar_url?: string | null;
  password?: string;
  created_at?: string;
  updated_at?: string;
  assigned_leads_count?: number;
}

export interface TeamMemberCreationResult {
  member: TeamMember;
  authCreated: boolean;
  authMessage?: string;
  credentials?: {
    email: string;
    password?: string;
    role: TeamRole;
    name: string;
  };
}

export interface Lead {
  id: string;
  owner_id?: string | null;
  name: string;
  organization: string;
  email?: string | null;
  phone: string;
  city?: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  deal_value: number;
  assigned_to?: string | null;
  assigned_member?: TeamMember | null;
  notes?: string | null;
  last_contacted?: string | null;
  created_at?: string;
  updated_at?: string;
  activities?: LeadActivity[];
  next_meeting?: LeadActivity | null;
}

export interface CRMStats {
  totalLeads: number;
  newLeads: number;
  inProgressLeads: number;
  wonLeads: number;
  unassignedLeads: number;
  pipelineValue: number;
  conversionRate: number;
}

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  is_owner: boolean;
  owner_id?: string;
  organization?: string;
  team_member_id?: string;
}
