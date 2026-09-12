'use client';

import { useState, useMemo } from 'react';
import { crmService } from '@/services/crmService';
import { Lead, TeamMember, CRMStats, LeadStatus, ScheduledMeetingItem } from '@/types/crm';
import { useLeads, useTeamMembers, useUpcomingMeetings, useCRMStats, useInvalidateCRM } from '@/hooks/useCRMQueries';
import { Button } from '@/components/ui/button';
import { LeadDialog } from '@/components/leads/lead-dialog';
import { AssignDialog } from '@/components/leads/assign-dialog';
import { MemberDialog } from '@/components/team/member-dialog';
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings';
import { ScheduleMeetingDialog } from '@/components/leads/schedule-meeting-dialog';
import {
  Users2,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  UserPlus,
  UserCheck,
  Building2,
  ArrowRight,
  Check,
  Phone,
  Sparkles,
  Layers,
  Calendar,
  Video,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { profile, isOwner } = useAuth();
  const ownerId = profile?.owner_id;

  // React Query cached hooks - shared across all pages
  const { data: leads = [], isLoading: leadsLoading } = useLeads(ownerId);
  const { data: teamMembers = [], isLoading: teamsLoading } = useTeamMembers(ownerId);
  const { data: upcomingMeetings = [], isLoading: meetingsLoading } = useUpcomingMeetings(ownerId);
  const { data: statsData, isLoading: statsLoading } = useCRMStats(
    ownerId,
    leads.length > 0 ? leads : undefined
  );
  const { invalidateAll, invalidateLeads, invalidateTeamMembers } = useInvalidateCRM();

  const loading = leadsLoading || teamsLoading || statsLoading;

  const stats: CRMStats = statsData || {
    totalLeads: 0,
    newLeads: 0,
    inProgressLeads: 0,
    wonLeads: 0,
    unassignedLeads: 0,
    pipelineValue: 0,
    conversionRate: 0,
  };

  // Dialog states
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleSaveLead = async (formData: any) => {
    if (selectedLead) {
      await crmService.updateLead(selectedLead.id, formData, ownerId);
    } else {
      await crmService.createLead(formData, ownerId);
    }
    await invalidateLeads(ownerId);
  };

  const handleAssignLead = async (leadId: string, memberId: string | null) => {
    await crmService.assignLead(leadId, memberId, ownerId);
    await invalidateLeads(ownerId);
  };

  const handleSaveMember = async (formData: any) => {
    await crmService.createTeamMember(formData, ownerId);
    await invalidateTeamMembers();
  };

  const unassignedLeads = leads.filter((l) => !l.assigned_to);

  // Pipeline stages calculation
  const pipelineStages: { label: string; status: LeadStatus; count: number; value: number }[] = [
    {
      label: 'New',
      status: 'New',
      count: leads.filter((l) => l.status === 'New').length,
      value: leads.filter((l) => l.status === 'New').reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0),
    },
    {
      label: 'Contacted',
      status: 'Contacted',
      count: leads.filter((l) => l.status === 'Contacted').length,
      value: leads.filter((l) => l.status === 'Contacted').reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0),
    },
    {
      label: 'In Progress',
      status: 'In Progress',
      count: leads.filter((l) => l.status === 'In Progress').length,
      value: leads.filter((l) => l.status === 'In Progress').reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0),
    },
    {
      label: 'Proposal Sent',
      status: 'Proposal Sent',
      count: leads.filter((l) => l.status === 'Proposal Sent').length,
      value: leads.filter((l) => l.status === 'Proposal Sent').reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0),
    },
    {
      label: 'Won / Signed',
      status: 'Won',
      count: leads.filter((l) => l.status === 'Won').length,
      value: leads.filter((l) => l.status === 'Won').reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full text-neutral-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="size-3 text-neutral-300" />
            {profile?.is_owner ? 'Admissions CRM (Owner Portal)' : `Admissions CRM (${profile?.role || 'Staff'})`}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Overview Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Welcome back, <strong className="text-white">{profile?.name}</strong>{profile?.organization ? ` • ${profile.organization}` : ''}. Monitor school inquiries and allocations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setScheduleDialogOpen(true)}
            className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-white/5 flex items-center gap-1.5"
          >
            <Calendar className="size-3.5 text-indigo-400" />
            Schedule Meeting
          </Button>

          {isOwner && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMemberDialogOpen(true)}
              className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-white/5"
            >
              <UserPlus className="size-3.5 mr-1.5" />
              Add Member
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setSelectedLead(null);
              setLeadDialogOpen(true);
            }}
            className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-5 shadow-sm"
          >
            <Plus className="size-3.5 mr-1.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Leads</span>
            <Users2 className="size-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {stats.totalLeads}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="rounded-full bg-white text-black text-[10px] font-semibold px-2 py-0.5">
              +{stats.newLeads} new
            </span>
            <span>unqualified</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Active Pipeline Value</span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            ₹{stats.pipelineValue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-neutral-400">
            Across open inquiries & proposals
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">In Active Pipeline</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {stats.inProgressLeads}
          </div>
          <div className="text-xs text-neutral-400">
            {stats.conversionRate}% overall win / conversion rate
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 transition-colors ${
          stats.unassignedLeads > 0
            ? 'border-amber-500/30 bg-[#151310]'
            : 'border-white/8 bg-[#121215]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Unassigned Leads</span>
            <AlertCircle className={`size-4 ${stats.unassignedLeads > 0 ? 'text-amber-400' : 'text-neutral-400'}`} />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {stats.unassignedLeads}
          </div>
          <div className="text-xs text-neutral-400">
            {stats.unassignedLeads > 0
              ? 'Needs representative allocation'
              : 'All inquiries allocated'}
          </div>
        </div>
      </div>

      {/* Upcoming Meetings & Demos Card */}
      <UpcomingMeetings
        meetings={upcomingMeetings}
        onRefresh={() => invalidateAll()}
        onOpenSchedule={() => setScheduleDialogOpen(true)}
      />

      {/* Pipeline Stage Distribution Banner */}
      <div className="p-6 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Layers className="size-4 text-neutral-400" />
              Admissions Pipeline Stages
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Breakdown of school opportunities by conversion phase
            </p>
          </div>
          <Link
            href="/leads"
            className="text-xs text-neutral-300 hover:text-white font-medium flex items-center gap-1 hover:underline"
          >
            Open Kanban Board <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {pipelineStages.map((stage) => (
            <div
              key={stage.status}
              className="p-4 rounded-2xl border border-white/5 bg-[#18181c] space-y-1.5 hover:border-white/15 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300">{stage.label}</span>
                <span className="rounded-full bg-[#242428] text-white text-[10px] font-bold px-2 py-0.5">
                  {stage.count}
                </span>
              </div>
              <div className="text-sm font-bold text-white pt-1">
                ₹{stage.value.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two Columns: Unassigned Leads & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Leads Allocation Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Pending Allocations
              </h2>
              <p className="text-xs text-neutral-400">
                Newly received inquiries that require a dedicated team member.
              </p>
            </div>
            <Link
              href="/leads"
              className="text-xs text-neutral-300 hover:text-white font-medium flex items-center gap-1 hover:underline"
            >
              View all inquiries <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/8 bg-[#121215] overflow-hidden shadow-xl">
            {unassignedLeads.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="size-10 rounded-full bg-white/5 text-white mx-auto flex items-center justify-center">
                  <Check className="size-5" />
                </div>
                <div className="text-sm font-semibold text-white">
                  All inquiries assigned
                </div>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Every active school lead is being handled by a team member. New submissions will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {unassignedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-sm text-white flex items-center gap-2 hover:underline group cursor-pointer"
                        title="View full lead history & communication logs"
                      >
                        <Building2 className="size-4 text-neutral-400 group-hover:text-white" />
                        <span>{lead.organization}</span>
                        <span className="rounded-full bg-[#18181c] text-neutral-300 text-[10px] px-2.5 py-0.5 border border-white/5">
                          {lead.source}
                        </span>
                      </Link>
                      <div className="text-xs text-neutral-400 flex items-center gap-2">
                        <span>{lead.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {lead.phone}
                        </span>
                        {lead.city && <span>• {lead.city}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {/* Call with auto-log */}
                        <button
                          type="button"
                          onClick={async () => {
                            window.location.href = `tel:${lead.phone}`;
                            await crmService.createActivity({
                              lead_id: lead.id,
                              type: 'call',
                              title: 'Quick Call Initiated',
                              description: `Called ${lead.name} (${lead.phone}) from dashboard.`,
                              outcome: 'Call Initiated',
                              performed_by: profile?.name || 'Staff',
                            });
                          }}
                          className="size-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors"
                          title="Call (Auto-logs)"
                        >
                          <Phone className="size-3.5" />
                        </button>

                        {/* WhatsApp with auto-log */}
                        <button
                          type="button"
                          onClick={async () => {
                            let clean = lead.phone.replace(/[^0-9]/g, '');
                            if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;
                            window.open(`https://wa.me/${clean}?text=Hello%20${encodeURIComponent(lead.name)},%20regarding%20${encodeURIComponent(lead.organization)}:`, '_blank');
                            await crmService.createActivity({
                              lead_id: lead.id,
                              type: 'whatsapp',
                              title: 'Quick WhatsApp Started',
                              description: `Started WhatsApp chat with ${lead.name} (${lead.phone}) from dashboard.`,
                              outcome: 'Chat Opened',
                              performed_by: profile?.name || 'Staff',
                            });
                          }}
                          className="size-8 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center transition-colors"
                          title="WhatsApp (Auto-logs)"
                        >
                          <MessageCircle className="size-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          ₹{(Number(lead.deal_value) || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                          Deal Value
                        </div>
                      </div>
                      <Button
                        size="xs"
                        onClick={() => {
                          setSelectedLead(lead);
                          setAssignDialogOpen(true);
                        }}
                        className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 shadow-xs"
                      >
                        <UserCheck className="size-3 mr-1" />
                        Assign Rep
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Members Workload Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Team Workload
              </h2>
              <p className="text-xs text-neutral-400">Active allocations per agent</p>
            </div>
            <Link
              href="/team"
              className="text-xs text-neutral-300 hover:text-white font-medium flex items-center gap-1 hover:underline"
            >
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/8 bg-[#121215] p-5 space-y-3 shadow-xl">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-2xl border border-white/5 bg-[#18181c] flex items-center justify-between gap-3 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {member.name}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {member.role}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {member.assigned_leads_count || 0} leads
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {member.status === 'active' ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemberDialogOpen(true)}
              className="w-full rounded-full border border-white/10 bg-[#18181c] text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#202026] mt-2"
            >
              <UserPlus className="size-3.5 mr-1.5" />
              Add Team Member
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <LeadDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        lead={selectedLead}
        teamMembers={teamMembers}
        onSave={handleSaveLead}
      />

      <AssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        lead={selectedLead}
        teamMembers={teamMembers}
        onAssign={handleAssignLead}
      />

      <MemberDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        onSave={handleSaveMember}
      />

      <ScheduleMeetingDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        leads={leads}
        onMeetingScheduled={() => invalidateLeads(ownerId)}
      />
    </div>
  );
}
