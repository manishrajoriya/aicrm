'use client';

import { useState, useMemo } from 'react';
import { crmService } from '@/services/crmService';
import { Lead, TeamMember, LeadStatus } from '@/types/crm';
import { useLeads, useTeamMembers, useInvalidateCRM } from '@/hooks/useCRMQueries';
import { Button } from '@/components/ui/button';
import { LeadTable } from '@/components/leads/lead-table';
import { LeadKanban } from '@/components/leads/lead-kanban';
import { LeadDialog } from '@/components/leads/lead-dialog';
import { AssignDialog } from '@/components/leads/assign-dialog';
import { ScheduleMeetingDialog } from '@/components/leads/schedule-meeting-dialog';
import { LogActivityDialog } from '@/components/leads/log-activity-dialog';
import { LeadLogsDialog } from '@/components/leads/lead-logs-dialog';
import { ImportLeadsDialog } from '@/components/leads/import-leads-dialog';
import {
  LeadFilters,
  LeadFiltersState,
  DateJoinedFilterType,
  NextMeetingFilterType,
  SortByType,
} from '@/components/leads/lead-filters';
import { Plus, LayoutGrid, List, RefreshCw, Sparkles, UserCheck, Calendar, PlusCircle, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_FILTERS: LeadFiltersState = {
  search: '',
  status: 'ALL',
  dateJoined: 'ALL',
  nextMeeting: 'ALL',
  assignee: 'ALL',
  sortBy: 'CREATED_DESC',
};

export default function LeadsPage() {
  const { profile } = useAuth();
  const ownerId = profile?.owner_id;

  // TanStack React Query cached hooks - instant load across page transitions
  const {
    data: leads = [],
    isLoading: leadsLoading,
    isFetching: leadsFetching,
    refetch: refetchLeads,
  } = useLeads(ownerId);

  const {
    data: teamMembers = [],
    isLoading: teamLoading,
    refetch: refetchTeams,
  } = useTeamMembers(ownerId);

  const { invalidateLeads } = useInvalidateCRM();

  const loading = leadsLoading || teamLoading;
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [filterMyLeadsOnly, setFilterMyLeadsOnly] = useState(false);
  const [filters, setFilters] = useState<LeadFiltersState>(DEFAULT_FILTERS);

  // Dialogs
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadForLog, setLeadForLog] = useState<Lead | null>(null);
  const [leadForViewLogs, setLeadForViewLogs] = useState<Lead | null>(null);

  const handleRefresh = async () => {
    await Promise.all([refetchLeads(), refetchTeams()]);
  };

  const handleSaveLead = async (formData: any) => {
    if (selectedLead) {
      await crmService.updateLead(selectedLead.id, formData, ownerId);
    } else {
      await crmService.createLead(formData, ownerId);
    }
    await invalidateLeads(ownerId);
  };

  const handleBulkImportLeads = async (newLeads: any[]) => {
    await crmService.createMultipleLeads(newLeads, ownerId);
    await invalidateLeads(ownerId);
  };

  const handleAssign = async (leadId: string, memberId: string | null) => {
    await crmService.assignLead(leadId, memberId, ownerId);
    await invalidateLeads(ownerId);
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    await crmService.updateLeadStatus(leadId, status, ownerId);
    await invalidateLeads(ownerId);
  };

  const handleDeleteLead = async (leadId: string) => {
    await crmService.deleteLead(leadId, ownerId);
    await invalidateLeads(ownerId);
  };

  // Base scope: My Leads vs All Leads
  const currentMemberId = profile?.team_member_id;
  const scopedLeads = useMemo(() => {
    if (filterMyLeadsOnly && currentMemberId) {
      return leads.filter((l) => l.assigned_to === currentMemberId);
    }
    return leads;
  }, [leads, filterMyLeadsOnly, currentMemberId]);

  const myLeadsCount = currentMemberId
    ? leads.filter((l) => l.assigned_to === currentMemberId).length
    : 0;

  // Filtered & Sorted Leads
  const filteredAndSortedLeads = useMemo(() => {
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const result = scopedLeads.filter((lead) => {
      // 1. Text Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchOrg = lead.organization?.toLowerCase().includes(q);
        const matchName = lead.name?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.includes(q);
        const matchCity = lead.city?.toLowerCase().includes(q);
        const matchEmail = lead.email?.toLowerCase().includes(q);
        if (!matchOrg && !matchName && !matchPhone && !matchCity && !matchEmail) {
          return false;
        }
      }

      // 2. Pipeline Stage
      if (filters.status !== 'ALL' && lead.status !== filters.status) {
        return false;
      }

      // 3. Assignee
      if (filters.assignee !== 'ALL') {
        if (filters.assignee === 'UNASSIGNED') {
          if (lead.assigned_to) return false;
        } else if (lead.assigned_to !== filters.assignee) {
          return false;
        }
      }

      // 4. Date Joined Filter
      if (filters.dateJoined !== 'ALL') {
        if (!lead.created_at) return false;
        const leadCreated = new Date(lead.created_at);
        if (isNaN(leadCreated.getTime())) return false;

        if (filters.dateJoined === 'TODAY') {
          if (!isSameDay(leadCreated, today)) return false;
        } else if (filters.dateJoined === 'YESTERDAY') {
          if (!isSameDay(leadCreated, yesterday)) return false;
        } else if (filters.dateJoined === 'LAST_7_DAYS') {
          if (leadCreated.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (filters.dateJoined === 'THIS_MONTH') {
          if (
            leadCreated.getMonth() !== now.getMonth() ||
            leadCreated.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }
      }

      // 5. Next Scheduled Call / Meeting Filter
      if (filters.nextMeeting !== 'ALL') {
        const meeting = lead.next_meeting;
        if (filters.nextMeeting === 'NONE') {
          if (meeting) return false;
        } else if (filters.nextMeeting === 'HAS_UPCOMING') {
          if (!meeting) return false;
        } else {
          if (!meeting?.scheduled_at) return false;
          const meetingDate = new Date(meeting.scheduled_at);
          if (isNaN(meetingDate.getTime())) return false;

          if (filters.nextMeeting === 'TODAY') {
            if (!isSameDay(meetingDate, today)) return false;
          } else if (filters.nextMeeting === 'TOMORROW') {
            if (!isSameDay(meetingDate, tomorrow)) return false;
          } else if (filters.nextMeeting === 'THIS_WEEK') {
            const mt = meetingDate.getTime();
            if (mt < today.getTime() || mt > endOfWeek.getTime()) return false;
          } else if (filters.nextMeeting === 'OVERDUE') {
            if (meetingDate.getTime() >= now.getTime()) return false;
          }
        }
      }

      return true;
    });

    const getSafeTime = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

    // Sort order
    return result.sort((a, b) => {
      if (filters.sortBy === 'CREATED_ASC') {
        return getSafeTime(a.created_at) - getSafeTime(b.created_at);
      }
      if (filters.sortBy === 'VALUE_DESC') {
        return (Number(b.deal_value) || 0) - (Number(a.deal_value) || 0);
      }
      if (filters.sortBy === 'MEETING_ASC') {
        const timeA = a.next_meeting?.scheduled_at ? getSafeTime(a.next_meeting.scheduled_at) : Infinity;
        const timeB = b.next_meeting?.scheduled_at ? getSafeTime(b.next_meeting.scheduled_at) : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return getSafeTime(b.created_at) - getSafeTime(a.created_at);
      }
      // Default: CREATED_DESC
      return getSafeTime(b.created_at) - getSafeTime(a.created_at);
    });
  }, [scopedLeads, filters]);

  const handleOpenScheduleDialog = (lead?: Lead) => {
    setSelectedLead(lead || null);
    setScheduleDialogOpen(true);
  };

  const handleOpenLogDialog = (lead?: Lead) => {
    setLeadForLog(lead || null);
    setLogDialogOpen(true);
  };

  const handleOpenViewLogs = (lead: Lead) => {
    setLeadForViewLogs(lead);
    setLogsDialogOpen(true);
  };

  const handleSaveActivity = async (activityData: any) => {
    await crmService.createActivity(activityData, ownerId);
    await invalidateLeads(ownerId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full text-neutral-100">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="size-3 text-neutral-300" />
            Admissions Pipeline
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            School Leads
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {profile?.name} • Filter by joined date, pipeline stage, or scheduled next calls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* My Leads vs All Leads Toggle */}
          {currentMemberId && (
            <div className="flex items-center rounded-full border border-white/8 bg-[#121215] p-1">
              <button
                type="button"
                onClick={() => setFilterMyLeadsOnly(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !filterMyLeadsOnly
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({leads.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMyLeadsOnly(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterMyLeadsOnly
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserCheck className="size-3" />
                My Leads ({myLeadsCount})
              </button>
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-full border border-white/8 bg-[#121215] p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              Kanban
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            title="Refresh Leads"
            className="rounded-full size-9 p-0 border-white/10"
          >
            <RefreshCw className={`size-3.5 ${leadsFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenScheduleDialog()}
            className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-white/5 flex items-center gap-1.5"
          >
            <Calendar className="size-3.5 text-indigo-400" />
            Schedule Call
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenLogDialog()}
            className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-white/5 flex items-center gap-1.5"
            title="Directly add interaction log or notes"
          >
            <PlusCircle className="size-3.5 text-blue-400" />
            Add Log
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center gap-1.5"
            title="Upload multiple leads from Excel (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" />
            Import Excel
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedLead(null);
              setLeadDialogOpen(true);
            }}
            className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-5 shadow-sm"
          >
            <Plus className="size-3.5 mr-1" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Advanced Filters Bar (Joined date, Next call scheduled, Pipeline stage, Assignee, Sort) */}
      <LeadFilters
        filters={filters}
        onFilterChange={setFilters}
        teamMembers={teamMembers}
        totalCount={scopedLeads.length}
        filteredCount={filteredAndSortedLeads.length}
      />

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <LeadTable
          leads={filteredAndSortedLeads}
          teamMembers={teamMembers}
          onEditLead={(lead) => {
            setSelectedLead(lead);
            setLeadDialogOpen(true);
          }}
          onAssignLead={(lead) => {
            setSelectedLead(lead);
            setAssignDialogOpen(true);
          }}
          onDeleteLead={handleDeleteLead}
          onStatusChange={handleStatusChange}
          onScheduleMeeting={handleOpenScheduleDialog}
          onLogActivity={handleOpenLogDialog}
          onViewLogs={handleOpenViewLogs}
        />
      ) : (
        <LeadKanban
          leads={filteredAndSortedLeads}
          teamMembers={teamMembers}
          onEditLead={(lead) => {
            setSelectedLead(lead);
            setLeadDialogOpen(true);
          }}
          onAssignLead={(lead) => {
            setSelectedLead(lead);
            setAssignDialogOpen(true);
          }}
          onStatusChange={handleStatusChange}
          onScheduleMeeting={handleOpenScheduleDialog}
          onLogActivity={handleOpenLogDialog}
          onViewLogs={handleOpenViewLogs}
        />
      )}

      {/* Dialogs */}
      <LeadDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        lead={selectedLead}
        teamMembers={teamMembers}
        onSave={handleSaveLead}
        onOpenImportExcel={() => setImportDialogOpen(true)}
      />

      <AssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        lead={selectedLead}
        teamMembers={teamMembers}
        onAssign={handleAssign}
      />

      <ScheduleMeetingDialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setSelectedLead(null);
        }}
        leads={leads}
        preselectedLeadId={selectedLead?.id}
        onMeetingScheduled={() => invalidateLeads(ownerId)}
      />

      <LogActivityDialog
        open={logDialogOpen}
        onOpenChange={(open) => {
          setLogDialogOpen(open);
          if (!open) setLeadForLog(null);
        }}
        leadId={leadForLog?.id}
        leadName={leadForLog?.organization || leadForLog?.name}
        leads={leads}
        performedBy={profile?.name || 'Representative'}
        onSave={handleSaveActivity}
      />

      <LeadLogsDialog
        open={logsDialogOpen}
        onOpenChange={(open) => {
          setLogsDialogOpen(open);
          if (!open) setLeadForViewLogs(null);
        }}
        lead={leadForViewLogs}
        onAddLog={handleOpenLogDialog}
      />

      <ImportLeadsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        teamMembers={teamMembers}
        onImportLeads={handleBulkImportLeads}
      />
    </div>
  );
}
