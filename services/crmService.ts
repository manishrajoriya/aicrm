import { getSupabaseClient, isSupabaseConfigured, createEphemeralClient } from '@/lib/supabase';
import { Lead, TeamMember, CRMStats, LeadStatus, LeadActivity, ScheduledMeetingItem } from '@/types/crm';

const LOCAL_TEAMS_KEY = 'aischoolapp_crm_teams';
const LOCAL_LEADS_KEY = 'aischoolapp_crm_leads';
const LOCAL_ACTIVITIES_KEY = 'aischoolapp_crm_activities';

// Auto-detect if Supabase table has owner_id column
let supportsOwnerIdInDb: boolean | null = null;

// LocalStorage helpers for fallback / multi-tenant workspace storage
function getLocalTeams(ownerId?: string): TeamMember[] {
  if (typeof window === 'undefined') return [];
  const key = ownerId ? `${LOCAL_TEAMS_KEY}_${ownerId}` : LOCAL_TEAMS_KEY;
  const stored = localStorage.getItem(key);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalTeams(teams: TeamMember[], ownerId?: string) {
  if (typeof window !== 'undefined') {
    const key = ownerId ? `${LOCAL_TEAMS_KEY}_${ownerId}` : LOCAL_TEAMS_KEY;
    localStorage.setItem(key, JSON.stringify(teams));
  }
}

function getLocalLeads(ownerId?: string): Lead[] {
  if (typeof window === 'undefined') return [];
  const key = ownerId ? `${LOCAL_LEADS_KEY}_${ownerId}` : LOCAL_LEADS_KEY;
  const stored = localStorage.getItem(key);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: Lead[], ownerId?: string) {
  if (typeof window !== 'undefined') {
    const key = ownerId ? `${LOCAL_LEADS_KEY}_${ownerId}` : LOCAL_LEADS_KEY;
    localStorage.setItem(key, JSON.stringify(leads));
  }
}

function getLocalActivities(ownerId?: string): LeadActivity[] {
  if (typeof window === 'undefined') return [];
  const key = ownerId ? `${LOCAL_ACTIVITIES_KEY}_${ownerId}` : LOCAL_ACTIVITIES_KEY;
  const stored = localStorage.getItem(key);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalActivities(activities: LeadActivity[], ownerId?: string) {
  if (typeof window !== 'undefined') {
    const key = ownerId ? `${LOCAL_ACTIVITIES_KEY}_${ownerId}` : LOCAL_ACTIVITIES_KEY;
    localStorage.setItem(key, JSON.stringify(activities));
  }
}

export const crmService = {
  // Check backend status
  isUsingSupabase(): boolean {
    return isSupabaseConfigured();
  },

  // -------------------------------------------------------------
  // TEAM MEMBERS (Scoped to Owner Workspace with graceful fallback)
  // -------------------------------------------------------------
  async getTeamMembers(ownerId?: string): Promise<TeamMember[]> {
    const client = getSupabaseClient();
    if (client) {
      // 1. Try querying with owner_id if column exists
      if (supportsOwnerIdInDb !== false && ownerId) {
        const { data, error } = await client
          .from('team_members')
          .select('*, leads:leads(count)')
          .or(`owner_id.eq.${ownerId},user_id.eq.${ownerId}`)
          .order('name', { ascending: true });

        if (!error) {
          supportsOwnerIdInDb = true;
          return (data || []).map((m: any) => ({
            ...m,
            assigned_leads_count: Array.isArray(m.leads) ? m.leads[0]?.count || 0 : 0,
          }));
        }

        // Code 42703 means column owner_id does not exist in Supabase yet
        if (error.code === '42703') {
          supportsOwnerIdInDb = false;
        }
      }

      // 2. Fallback query (if owner_id column is not added in Supabase yet)
      let query = client
        .from('team_members')
        .select('*, leads:leads(count)');

      if (ownerId) {
        query = query.eq('user_id', ownerId);
      }

      const { data: fbData, error: fbError } = await query.order('name', { ascending: true });

      if (!fbError && fbData && fbData.length > 0) {
        return fbData.map((m: any) => ({
          ...m,
          assigned_leads_count: Array.isArray(m.leads) ? m.leads[0]?.count || 0 : 0,
        }));
      }

      // If user_id didn't match, return all team members from Supabase
      const { data: allTeams, error: allErr } = await client
        .from('team_members')
        .select('*, leads:leads(count)')
        .order('name', { ascending: true });

      if (!allErr && allTeams) {
        return allTeams.map((m: any) => ({
          ...m,
          assigned_leads_count: Array.isArray(m.leads) ? m.leads[0]?.count || 0 : 0,
        }));
      }

      return getLocalTeams(ownerId);
    }

    // Local fallback
    const teams = getLocalTeams(ownerId);
    const leads = getLocalLeads(ownerId);
    return teams.map((team) => ({
      ...team,
      assigned_leads_count: leads.filter((l) => l.assigned_to === team.id).length,
    }));
  },

  async createTeamMember(
    member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at' | 'assigned_leads_count'> & { password?: string },
    ownerId?: string
  ): Promise<TeamMember & { authCreated?: boolean; authMessage?: string; generatedPassword?: string }> {
    const client = getSupabaseClient();
    const cleanEmail = member.email.trim().toLowerCase();
    const cleanPassword = member.password?.trim();

    let authUserId: string | null = null;
    let authCreated = false;
    let authMessage: string | undefined = undefined;

    // 1. Create a real Supabase Auth login account via Ephemeral Client
    // This uses persistSession: false to ensure the logged-in owner is never signed out!
    if (isSupabaseConfigured() && cleanPassword) {
      try {
        const ephemeralClient = createEphemeralClient();
        if (ephemeralClient) {
          const { data: authData, error: authError } = await ephemeralClient.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: {
                name: member.name,
                role: member.role,
                owner_id: ownerId || null,
                is_owner: false,
                organization: member.organization_name || '',
              },
            },
          });

          if (authError) {
            console.warn('Supabase auth.signUp note for team member:', authError.message);
            authMessage = authError.message;
          } else if (authData?.user) {
            authUserId = authData.user.id;
            authCreated = true;
          }
        }
      } catch (authErr: any) {
        console.warn('Unexpected error in ephemeral signUp:', authErr);
        authMessage = authErr?.message;
      }
    }

    // Strip password field before inserting into public.team_members
    const { password, ...memberFields } = member;

    const basePayload: any = {
      ...memberFields,
      email: cleanEmail,
      is_owner: false,
    };

    if (authUserId) {
      basePayload.user_id = authUserId;
    }

    const payload = ownerId && supportsOwnerIdInDb !== false 
      ? { ...basePayload, owner_id: ownerId } 
      : basePayload;

    if (client) {
      let res = await client
        .from('team_members')
        .insert([payload])
        .select()
        .single();

      // If owner_id or other column does not exist yet, retry gracefully
      if (res.error && res.error.code === '42703') {
        supportsOwnerIdInDb = false;
        const retryPayload = { ...basePayload };
        delete retryPayload.owner_id;
        res = await client
          .from('team_members')
          .insert([retryPayload])
          .select()
          .single();
      }

      if (res.error) {
        throw new Error(res.error.message);
      }

      return {
        ...res.data,
        authCreated,
        authMessage,
        generatedPassword: cleanPassword,
      };
    }

    // Local fallback
    const teams = getLocalTeams(ownerId);
    const newMember: TeamMember = {
      ...payload,
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString(),
      assigned_leads_count: 0,
    };
    teams.push(newMember);
    saveLocalTeams(teams, ownerId);
    return {
      ...newMember,
      authCreated: true,
      authMessage: 'Saved to local workspace',
      generatedPassword: cleanPassword,
    };
  },

  async updateTeamMember(id: string, updates: Partial<TeamMember>, ownerId?: string): Promise<TeamMember> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }

    // Local fallback
    const teams = getLocalTeams(ownerId);
    const index = teams.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Team member not found');
    teams[index] = { ...teams[index], ...updates, updated_at: new Date().toISOString() };
    saveLocalTeams(teams, ownerId);
    return teams[index];
  },

  async deleteTeamMember(id: string, ownerId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      // 1. Unassign any leads currently assigned to this member so they aren't orphaned
      await client
        .from('leads')
        .update({ assigned_to: null })
        .eq('assigned_to', id);

      // 2. Delete the team member record
      const { error } = await client
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
      return;
    }

    // Local fallback
    const teams = getLocalTeams(ownerId);
    const filtered = teams.filter((t) => t.id !== id);
    saveLocalTeams(filtered, ownerId);

    // Unassign in local leads
    const leads = getLocalLeads(ownerId);
    let changed = false;
    leads.forEach((l) => {
      if (l.assigned_to === id) {
        l.assigned_to = undefined;
        changed = true;
      }
    });
    if (changed) {
      saveLocalLeads(leads, ownerId);
    }
  },

  attachNextMeetings(leads: Lead[], activities: LeadActivity[]): Lead[] {
    const meetingMap = new Map<string, LeadActivity>();
    const now = Date.now();

    const validMeetings = activities.filter(
      (a) =>
        a.type === 'meeting' &&
        a.scheduled_at &&
        a.outcome !== 'Completed' &&
        a.outcome !== 'Cancelled' &&
        a.outcome !== 'Rescheduled'
    );

    // Group meetings by lead_id
    const meetingsByLead = new Map<string, LeadActivity[]>();
    for (const m of validMeetings) {
      const list = meetingsByLead.get(m.lead_id) || [];
      list.push(m);
      meetingsByLead.set(m.lead_id, list);
    }

    // For each lead, pick the most relevant meeting:
    // 1) Earliest upcoming meeting (scheduled_at >= now)
    // 2) Or if all are past/overdue, the latest overdue meeting
    for (const [leadId, list] of meetingsByLead.entries()) {
      const upcoming = list
        .filter((m) => new Date(m.scheduled_at!).getTime() >= now)
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

      if (upcoming.length > 0) {
        meetingMap.set(leadId, upcoming[0]);
      } else {
        const past = list.sort(
          (a, b) => new Date(b.scheduled_at!).getTime() - new Date(a.scheduled_at!).getTime()
        );
        if (past.length > 0) {
          meetingMap.set(leadId, past[0]);
        }
      }
    }

    return leads.map((l) => ({
      ...l,
      next_meeting: meetingMap.get(l.id) || null,
    }));
  },

  // -------------------------------------------------------------
  // LEADS (Scoped to Owner Workspace with graceful fallback)
  // -------------------------------------------------------------
  async getLeads(ownerId?: string): Promise<Lead[]> {
    const client = getSupabaseClient();
    if (client) {
      let data: any[] | null = null;
      let leadsError: any = null;

      // 1. Try querying with owner_id if column exists
      if (supportsOwnerIdInDb !== false && ownerId) {
        const res = await client
          .from('leads')
          .select('*, assigned_member:team_members(*)')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });

        if (!res.error) {
          supportsOwnerIdInDb = true;
          data = res.data;
        } else if (res.error.code === '42703') {
          supportsOwnerIdInDb = false;
        } else {
          leadsError = res.error;
        }
      }

      // 2. Fallback query if owner_id column does not exist in Supabase yet
      if (data === null && !leadsError) {
        const res = await client
          .from('leads')
          .select('*, assigned_member:team_members(*)')
          .order('created_at', { ascending: false });

        if (!res.error) {
          data = res.data;
        } else {
          leadsError = res.error;
        }
      }

      if (leadsError) {
        console.error('Error fetching leads from Supabase:', leadsError);
        return this.getLocalLeadsWithAssignees(ownerId);
      }

      const leadsList: Lead[] = data || [];
      if (leadsList.length === 0) {
        return [];
      }

      const leadIdSet = new Set(leadsList.map((l) => l.id));

      const { data: activitiesData, error: actError } = await client
        .from('lead_activities')
        .select('*')
        .eq('type', 'meeting')
        .not('scheduled_at', 'is', null)
        .neq('outcome', 'Completed')
        .neq('outcome', 'Cancelled')
        .neq('outcome', 'Rescheduled')
        .order('scheduled_at', { ascending: true });

      if (actError) {
        console.error('Error fetching meeting activities:', actError);
      }

      const relevantActivities = (activitiesData || []).filter((a) => leadIdSet.has(a.lead_id));
      return this.attachNextMeetings(leadsList, relevantActivities);
    }

    const localLeads = this.getLocalLeadsWithAssignees(ownerId);
    const localActs = getLocalActivities(ownerId);
    return this.attachNextMeetings(localLeads, localActs);
  },

  getLocalLeadsWithAssignees(ownerId?: string): Lead[] {
    const leads = getLocalLeads(ownerId);
    const teams = getLocalTeams(ownerId);
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    return leads.map((lead) => ({
      ...lead,
      assigned_member: lead.assigned_to ? teamMap.get(lead.assigned_to) || null : null,
    }));
  },

  async createLead(
    lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assigned_member'>,
    ownerId?: string
  ): Promise<Lead> {
    const client = getSupabaseClient();
    const payload = ownerId && supportsOwnerIdInDb !== false ? { ...lead, owner_id: ownerId } : lead;

    if (client) {
      let res = await client
        .from('leads')
        .insert([payload])
        .select('*, assigned_member:team_members(*)')
        .single();

      // If owner_id column does not exist, retry without it
      if (res.error && res.error.code === '42703') {
        supportsOwnerIdInDb = false;
        res = await client
          .from('leads')
          .insert([lead])
          .select('*, assigned_member:team_members(*)')
          .single();
      }

      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    }

    // Local fallback
    const leads = getLocalLeads(ownerId);
    const newLead: Lead = {
      ...payload,
      id: 'local-lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    leads.unshift(newLead);
    saveLocalLeads(leads, ownerId);

    const teams = getLocalTeams(ownerId);
    return {
      ...newLead,
      assigned_member: newLead.assigned_to
        ? teams.find((t) => t.id === newLead.assigned_to) || null
        : null,
    };
  },

  async createMultipleLeads(
    leadsList: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assigned_member'>[],
    ownerId?: string
  ): Promise<Lead[]> {
    if (!leadsList || leadsList.length === 0) return [];
    const client = getSupabaseClient();
    const payloads = leadsList.map((l) =>
      ownerId && supportsOwnerIdInDb !== false ? { ...l, owner_id: ownerId } : l
    );

    if (client) {
      let res = await client
        .from('leads')
        .insert(payloads)
        .select('*, assigned_member:team_members(*)');

      if (res.error && res.error.code === '42703') {
        supportsOwnerIdInDb = false;
        res = await client
          .from('leads')
          .insert(leadsList)
          .select('*, assigned_member:team_members(*)');
      }

      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data || [];
    }

    // Local fallback
    const leads = getLocalLeads(ownerId);
    const teams = getLocalTeams(ownerId);
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const inserted: Lead[] = payloads.map((payload) => {
      const newLead: Lead = {
        ...payload,
        id: 'local-lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newLead;
    });

    leads.unshift(...inserted);
    saveLocalLeads(leads, ownerId);

    return inserted.map((l) => ({
      ...l,
      assigned_member: l.assigned_to ? teamMap.get(l.assigned_to) || null : null,
    }));
  },

  async updateLead(id: string, updates: Partial<Lead>, ownerId?: string): Promise<Lead> {
    const client = getSupabaseClient();
    const { assigned_member, ...fieldsToUpdate } = updates;

    if (client) {
      const { data, error } = await client
        .from('leads')
        .update(fieldsToUpdate)
        .eq('id', id)
        .select('*, assigned_member:team_members(*)')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }

    // Local fallback
    const leads = getLocalLeads(ownerId);
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Lead not found');

    leads[index] = {
      ...leads[index],
      ...fieldsToUpdate,
      updated_at: new Date().toISOString(),
    };
    saveLocalLeads(leads, ownerId);

    const teams = getLocalTeams(ownerId);
    return {
      ...leads[index],
      assigned_member: leads[index].assigned_to
        ? teams.find((t) => t.id === leads[index].assigned_to) || null
        : null,
    };
  },

  async assignLead(leadId: string, teamMemberId: string | null, ownerId?: string): Promise<Lead> {
    return this.updateLead(leadId, { assigned_to: teamMemberId }, ownerId);
  },

  async updateLeadStatus(leadId: string, status: LeadStatus, ownerId?: string): Promise<Lead> {
    return this.updateLead(leadId, { status }, ownerId);
  },

  async deleteLead(id: string, ownerId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    // Local fallback
    const leads = getLocalLeads(ownerId);
    const filtered = leads.filter((l) => l.id !== id);
    saveLocalLeads(filtered, ownerId);
  },

  async getLeadById(id: string, ownerId?: string): Promise<Lead | null> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('leads')
        .select('*, assigned_member:team_members(*)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching lead by id:', error);
        return this.getLocalLeadById(id, ownerId);
      }
      return data;
    }
    return this.getLocalLeadById(id, ownerId);
  },

  getLocalLeadById(id: string, ownerId?: string): Lead | null {
    const leads = this.getLocalLeadsWithAssignees(ownerId);
    return leads.find((l) => l.id === id) || null;
  },

  // -------------------------------------------------------------
  // ACTIVITIES & CALL/MSG LOGS
  // -------------------------------------------------------------
  async getLeadActivities(leadId: string, ownerId?: string): Promise<LeadActivity[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return getLocalActivities(ownerId).filter((a) => a.lead_id === leadId);
      }
      return data || [];
    }

    const all = getLocalActivities(ownerId);
    return all.filter((a) => a.lead_id === leadId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createActivity(
    activity: Omit<LeadActivity, 'id' | 'created_at'>,
    ownerId?: string
  ): Promise<LeadActivity> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('lead_activities')
        .insert([activity])
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        throw new Error(error.message);
      }
      return data;
    }

    // Local fallback
    const all = getLocalActivities(ownerId);
    const newAct: LeadActivity = {
      ...activity,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };
    all.unshift(newAct);
    saveLocalActivities(all, ownerId);
    return newAct;
  },

  async updateActivity(id: string, updates: Partial<LeadActivity>, ownerId?: string): Promise<LeadActivity> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('lead_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        throw new Error(error.message);
      }
      return data;
    }

    const all = getLocalActivities(ownerId);
    const idx = all.findIndex((a) => a.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalActivities(all, ownerId);
      return all[idx];
    }
    throw new Error('Activity not found');
  },

  async scheduleMeeting(
    params: {
      lead_id: string;
      title: string;
      scheduled_at: string;
      meeting_link?: string;
      description?: string;
      performed_by?: string;
    },
    ownerId?: string
  ): Promise<LeadActivity> {
    const client = getSupabaseClient();
    if (client) {
      // Mark prior pending meetings for this specific lead as Rescheduled to prevent duplicate stale meetings
      await client
        .from('lead_activities')
        .update({ outcome: 'Rescheduled' })
        .eq('lead_id', params.lead_id)
        .eq('type', 'meeting')
        .eq('outcome', 'Scheduled');
    } else {
      const all = getLocalActivities(ownerId);
      all.forEach((a) => {
        if (a.lead_id === params.lead_id && a.type === 'meeting' && a.outcome === 'Scheduled') {
          a.outcome = 'Rescheduled';
        }
      });
      saveLocalActivities(all, ownerId);
    }

    return this.createActivity(
      {
        lead_id: params.lead_id,
        type: 'meeting',
        title: params.title,
        description: params.description || 'Demo / Discussion meeting scheduled.',
        outcome: 'Scheduled',
        scheduled_at: params.scheduled_at,
        meeting_link: params.meeting_link || null,
        performed_by: params.performed_by || 'Representative',
      },
      ownerId
    );
  },

  async getUpcomingMeetings(ownerId?: string): Promise<ScheduledMeetingItem[]> {
    const client = getSupabaseClient();

    if (client) {
      let query = client
        .from('lead_activities')
        .select('*, lead:leads(*)')
        .eq('type', 'meeting')
        .not('scheduled_at', 'is', null)
        .neq('outcome', 'Completed')
        .neq('outcome', 'Cancelled')
        .neq('outcome', 'Rescheduled')
        .order('scheduled_at', { ascending: true });

      const { data, error } = await query;
      if (!error && data) {
        return (data as any[])
          .filter((act) => {
            if (!act.lead) return false;
            if (ownerId && supportsOwnerIdInDb !== false) {
              return act.lead.owner_id === ownerId;
            }
            return true;
          });
      }
      if (error) {
        console.error('Error fetching upcoming meetings from Supabase:', error);
      }
    }

    // Local fallback
    const leads = getLocalLeads(ownerId);
    const leadMap = new Map(leads.map((l) => [l.id, l]));
    const all = getLocalActivities(ownerId);
    return all
      .filter(
        (a) =>
          a.type === 'meeting' &&
          a.scheduled_at &&
          a.outcome !== 'Completed' &&
          a.outcome !== 'Cancelled' &&
          a.outcome !== 'Rescheduled' &&
          leadMap.has(a.lead_id)
      )
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .map((act) => ({
        ...act,
        lead: leadMap.get(act.lead_id),
      }));
  },

  // -------------------------------------------------------------
  // DASHBOARD STATS (Scoped to Owner Workspace)
  // -------------------------------------------------------------
  async getCRMStats(ownerId?: string, cachedLeads?: Lead[]): Promise<CRMStats> {
    const leads = cachedLeads || (await this.getLeads(ownerId));
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === 'New').length;
    const inProgressLeads = leads.filter(
      (l) => l.status === 'In Progress' || l.status === 'Contacted' || l.status === 'Proposal Sent'
    ).length;
    const wonLeads = leads.filter((l) => l.status === 'Won').length;
    const unassignedLeads = leads.filter((l) => !l.assigned_to).length;

    const pipelineValue = leads
      .filter((l) => l.status !== 'Lost')
      .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      newLeads,
      inProgressLeads,
      wonLeads,
      unassignedLeads,
      pipelineValue,
      conversionRate,
    };
  },
};
