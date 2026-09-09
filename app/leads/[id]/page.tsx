'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { crmService } from '@/services/crmService';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, TeamMember, LeadStatus, LeadActivity, ActivityType } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/leads/activity-timeline';
import { LogActivityDialog } from '@/components/leads/log-activity-dialog';
import { ScheduleMeetingDialog } from '@/components/leads/schedule-meeting-dialog';
import { LeadDialog } from '@/components/leads/lead-dialog';
import { AssignDialog } from '@/components/leads/assign-dialog';
import { QuickContactLoggerDialog } from '@/components/leads/quick-contact-logger-dialog';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  PhoneCall,
  PlusCircle,
  ArrowLeft,
  Edit2,
  UserCheck,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  Briefcase,
  Video,
} from 'lucide-react';
import Link from 'next/link';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;
  const { profile } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [quickContactOpen, setQuickContactOpen] = useState(false);
  const [quickContactType, setQuickContactType] = useState<'call' | 'whatsapp'>('call');

  // Timeline type filter
  const [timelineFilter, setTimelineFilter] = useState<'all' | ActivityType>('all');

  const loadData = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      const [fetchedLead, fetchedActivities, fetchedTeams] = await Promise.all([
        crmService.getLeadById(leadId),
        crmService.getLeadActivities(leadId),
        crmService.getTeamMembers(),
      ]);
      setLead(fetchedLead);
      setActivities(fetchedActivities);
      setTeamMembers(fetchedTeams);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leadId]);

  // Clean phone string for dialing and WhatsApp URL
  const getCleanPhone = (phoneStr: string) => {
    return phoneStr.replace(/[^0-9]/g, '');
  };

  // When user clicks Call: Open dialer and show instant outcome logger
  const handleInitiateCall = () => {
    if (!lead) return;
    window.location.href = `tel:${lead.phone}`;
    setQuickContactType('call');
    setQuickContactOpen(true);
  };

  // When user clicks WhatsApp: Open WhatsApp chat and show instant outcome logger
  const handleInitiateWhatsApp = () => {
    if (!lead) return;
    let cleanNum = getCleanPhone(lead.phone);
    if (!cleanNum.startsWith('91') && cleanNum.length === 10) {
      cleanNum = '91' + cleanNum;
    }
    window.open(
      `https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(lead.name)},%20regarding%20${encodeURIComponent(lead.organization)}%20admissions%20solution:`,
      '_blank'
    );
    setQuickContactType('whatsapp');
    setQuickContactOpen(true);
  };

  const handleSaveQuickContact = async (data: {
    type: 'call' | 'whatsapp';
    title: string;
    outcome: string;
    description: string;
    newStatus?: LeadStatus;
  }) => {
    if (!lead) return;

    try {
      await crmService.createActivity(
        {
          lead_id: lead.id,
          type: data.type,
          title: data.title,
          outcome: data.outcome,
          description: data.description,
          performed_by: profile?.name || 'Representative',
        },
        profile?.owner_id
      );

      if (data.newStatus && data.newStatus !== lead.status) {
        await crmService.updateLeadStatus(lead.id, data.newStatus, profile?.owner_id);
        await crmService.createActivity(
          {
            lead_id: lead.id,
            type: 'status_change',
            title: `Stage Moved to "${data.newStatus}"`,
            description: `Pipeline stage moved to "${data.newStatus}" following ${data.type === 'call' ? 'phone call' : 'WhatsApp conversation'}.`,
            performed_by: profile?.name || 'Representative',
          },
          profile?.owner_id
        );
      }

      await loadData();
    } catch (err: any) {
      console.error('Failed to record contact outcome:', err);
      alert('Error saving contact log: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    await crmService.updateLeadStatus(lead.id, newStatus);
    // Log status change
    await crmService.createActivity({
      lead_id: lead.id,
      type: 'status_change',
      title: `Stage Changed to "${newStatus}"`,
      description: `Pipeline stage moved from "${lead.status}" to "${newStatus}".`,
      performed_by: profile?.name || 'Representative',
    });
    await loadData();
  };

  const handleSaveActivity = async (activityData: any) => {
    await crmService.createActivity(activityData);
    const updated = await crmService.getLeadActivities(leadId);
    setActivities(updated);
  };

  const handleSaveLead = async (formData: any) => {
    if (!lead) return;
    await crmService.updateLead(lead.id, formData);
    await loadData();
  };

  const handleAssign = async (lId: string, memberId: string | null) => {
    await crmService.assignLead(lId, memberId);
    await crmService.createActivity({
      lead_id: lId,
      type: 'note',
      title: 'Lead Assignment Updated',
      description: memberId
        ? `Inquiry reassigned to ${teamMembers.find((m) => m.id === memberId)?.name || 'representative'}.`
        : 'Inquiry unassigned.',
      performed_by: profile?.name || 'Representative',
    });
    await loadData();
  };

  const filteredActivities = activities.filter((act) => {
    if (timelineFilter === 'all') return true;
    return act.type === timelineFilter;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-400 space-y-2">
        <RefreshCw className="size-6 animate-spin mx-auto text-white" />
        <div className="text-xs">Loading inquiry details...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-lg font-bold text-white">Inquiry not found</div>
        <Link href="/leads">
          <Button variant="outline" size="sm" className="rounded-full">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Leads
          </Button>
        </Link>
      </div>
    );
  }

  const assigned =
    lead.assigned_member || teamMembers.find((m) => m.id === lead.assigned_to);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full text-neutral-100">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-medium transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Leads Pipeline
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            title="Refresh"
            className="rounded-full size-9 p-0 border-white/10"
          >
            <RefreshCw className="size-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-white/5"
          >
            <Edit2 className="size-3.5 mr-1.5" />
            Edit Inquiry
          </Button>
        </div>
      </div>

      {/* Main Profile & Quick Action Card */}
      <div className="rounded-3xl border border-white/8 bg-[#121215] p-4 sm:p-6 md:p-8 shadow-2xl space-y-5 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#1e1e24] text-neutral-300 text-[11px] px-3 py-0.5 border border-white/6 font-medium">
                {lead.source}
              </span>
              <span
                className={`rounded-full text-[11px] px-3 py-0.5 font-semibold ${
                  lead.priority === 'High'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : lead.priority === 'Medium'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                ● {lead.priority} Priority
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="size-7 text-neutral-400 shrink-0" />
              {lead.organization}
            </h1>

            <div className="flex items-center gap-3 text-xs text-neutral-400 flex-wrap pt-1">
              <span className="font-medium text-neutral-200">{lead.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="size-3 text-neutral-400" />
                {lead.phone}
              </span>
              {lead.email && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="size-3 text-neutral-400" />
                    {lead.email}
                  </span>
                </>
              )}
              {lead.city && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-neutral-400" />
                    {lead.city}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Value & Assignee Header Block */}
          <div className="flex lg:flex-col lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5">
            <div className="lg:text-right">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                Opportunity Value
              </div>
              <div className="text-2xl font-extrabold text-white mt-0.5">
                ₹{(Number(lead.deal_value) || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {assigned ? (
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-white text-black font-bold text-[10px] flex items-center justify-center">
                    {assigned.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-white">{assigned.name}</div>
                    <button
                      type="button"
                      onClick={() => setAssignDialogOpen(true)}
                      className="text-[10px] text-neutral-400 hover:text-white underline"
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  size="xs"
                  onClick={() => setAssignDialogOpen(true)}
                  className="rounded-full bg-[#202026] text-amber-400 border border-amber-500/30 hover:bg-[#282830]"
                >
                  <UserCheck className="size-3 mr-1" />
                  Assign Representative
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Contact & Action Buttons (CALL & WHATSAPP AUTO-LOGGING) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#18181c] border border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-wrap">
            {/* CALL BUTTON: Auto-logs on click */}
            <Button
              size="sm"
              onClick={handleInitiateCall}
              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 sm:px-4 gap-1.5 shadow-md text-xs h-9 justify-center"
              title="Call lead & automatically log call event"
            >
              <PhoneCall className="size-3.5" />
              Call Now
            </Button>

            {/* WHATSAPP BUTTON: Auto-logs on click */}
            <Button
              size="sm"
              onClick={handleInitiateWhatsApp}
              className="rounded-full bg-green-600 hover:bg-green-500 text-white font-bold px-3 sm:px-4 gap-1.5 shadow-md text-xs h-9 justify-center"
              title="Message on WhatsApp & automatically log chat event"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </Button>

            {/* SCHEDULE MEETING BUTTON */}
            <Button
              size="sm"
              onClick={() => setScheduleDialogOpen(true)}
              className="col-span-2 sm:col-span-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 sm:px-4 gap-1.5 shadow-md text-xs h-9 justify-center"
              title="Schedule a live demo or meeting with this school"
            >
              <Calendar className="size-3.5" />
              Schedule Meeting
            </Button>

            {/* MANUAL LOG ACTIVITY BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogDialogOpen(true)}
              className="col-span-2 sm:col-span-1 rounded-full border-white/10 bg-[#222226] text-neutral-200 hover:text-white px-3 sm:px-4 gap-1.5 text-xs h-9 justify-center"
            >
              <PlusCircle className="size-3.5 text-neutral-400" />
              Log Activity / Notes
            </Button>
          </div>

          {/* Quick Stage Progression Dropdown */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <span className="text-xs text-neutral-400">Stage:</span>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="h-8.5 rounded-full border border-white/10 bg-[#121215] px-3 text-xs font-semibold text-white outline-none cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won / Signed</option>
              <option value="Lost">Lost / Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two Columns: Details Left & Activity Timeline Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requirements & Profile Info */}
        <div className="space-y-6">
          {/* Notes Card */}
          <div className="rounded-3xl border border-white/8 bg-[#121215] p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Briefcase className="size-4 text-neutral-400" />
              Inquiry Notes & Requirements
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed bg-[#18181c] p-3.5 rounded-2xl border border-white/5 whitespace-pre-wrap">
              {lead.notes || 'No notes specified.'}
            </p>
          </div>

          {/* Contact Details Breakdown Card */}
          <div className="rounded-3xl border border-white/8 bg-[#121215] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Contact Information</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Contact Person</span>
                <span className="font-medium text-white">{lead.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Direct Phone</span>
                <span className="font-medium text-white">{lead.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Email Address</span>
                <span className="font-medium text-white">{lead.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Location</span>
                <span className="font-medium text-white">{lead.city || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Created At</span>
                <span className="font-medium text-white">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive History & Activity Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Clock className="size-4.5 text-neutral-400" />
                Communication & Activity Timeline
              </h2>
              <p className="text-xs text-neutral-400">
                Chronological log of phone calls, WhatsApp chats, meetings, and updates.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center rounded-full border border-white/8 bg-[#121215] p-1 text-xs">
              <button
                type="button"
                onClick={() => setTimelineFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  timelineFilter === 'all'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('call')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  timelineFilter === 'call'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Calls
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('whatsapp')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  timelineFilter === 'whatsapp'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('note')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  timelineFilter === 'note'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Notes
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('meeting')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  timelineFilter === 'meeting'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Meetings
              </button>
            </div>
          </div>

          {/* Timeline View Component */}
          <div className="rounded-3xl border border-white/8 bg-[#121215] p-6 shadow-xl">
            <ActivityTimeline activities={filteredActivities} />
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <ScheduleMeetingDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        leads={[lead]}
        preselectedLeadId={lead.id}
        onMeetingScheduled={loadData}
      />

      <LogActivityDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        leadId={lead.id}
        leadName={lead.organization}
        performedBy={profile?.name || 'Representative'}
        onSave={handleSaveActivity}
      />

      <LeadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={lead}
        teamMembers={teamMembers}
        onSave={handleSaveLead}
      />

      <AssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        lead={lead}
        teamMembers={teamMembers}
        onAssign={handleAssign}
      />

      {lead && (
        <QuickContactLoggerDialog
          open={quickContactOpen}
          onOpenChange={setQuickContactOpen}
          type={quickContactType}
          lead={lead}
          performedBy={profile?.name || 'Representative'}
          onSave={handleSaveQuickContact}
        />
      )}
    </div>
  );
}
