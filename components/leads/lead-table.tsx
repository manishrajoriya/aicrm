'use client';

import { useState, useEffect, useMemo } from 'react';
import { Lead, TeamMember, LeadStatus } from '@/types/crm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  UserCheck,
  Edit2,
  Trash2,
  Building2,
  Phone,
  MapPin,
  PhoneCall,
  MessageCircle,
  Calendar,
  Clock,
  CalendarPlus,
  AlertCircle,
  PlusCircle,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { crmService } from '@/services/crmService';
import { formatJoinedDate, formatMeetingTime } from '@/lib/lead-date-utils';

interface LeadTableProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  onEditLead: (lead: Lead) => void;
  onAssignLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => Promise<void>;
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<void>;
  onScheduleMeeting?: (lead: Lead) => void;
  onLogActivity?: (lead: Lead) => void;
  onViewLogs?: (lead: Lead) => void;
}

export function LeadTable({
  leads,
  teamMembers,
  onEditLead,
  onAssignLead,
  onDeleteLead,
  onStatusChange,
  onScheduleMeeting,
  onLogActivity,
  onViewLogs,
}: LeadTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Reset to page 1 whenever leads list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [leads.length]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(leads.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedLeads = useMemo(() => {
    if (pageSize === 0) return leads;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return leads.slice(startIndex, startIndex + pageSize);
  }, [leads, safeCurrentPage, pageSize]);

  const getStatusPill = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return (
          <span className="rounded-full bg-white text-black font-semibold text-[10px] px-2.5 py-0.5 shadow-xs">
            New
          </span>
        );
      case 'Contacted':
        return (
          <span className="rounded-full bg-[#242428] text-neutral-200 border border-white/10 text-[10px] px-2.5 py-0.5">
            Contacted
          </span>
        );
      case 'In Progress':
        return (
          <span className="rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] px-2.5 py-0.5">
            In Progress
          </span>
        );
      case 'Proposal Sent':
        return (
          <span className="rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] px-2.5 py-0.5">
            Proposal Sent
          </span>
        );
      case 'Won':
        return (
          <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 font-medium">
            Won / Signed
          </span>
        );
      case 'Lost':
        return (
          <span className="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2.5 py-0.5">
            Lost
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-[#1e1e24] text-neutral-300 text-[10px] px-2.5 py-0.5">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl border border-white/8 bg-[#121215] shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[840px]">
          <TableHeader className="bg-[#18181c]/60 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5 pl-5">School & Contact</TableHead>
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5">Joined Date</TableHead>
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5">Pipeline Stage</TableHead>
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5">Next Call / Meeting</TableHead>
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5">Assigned Rep</TableHead>
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5">Deal Value</TableHead>
              <TableHead className="text-neutral-400 font-semibold text-xs py-3.5 pr-5 text-right">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell colSpan={7} className="h-40 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-sm font-medium text-neutral-300">No inquiries found matching your filters.</p>
                    <p className="text-xs text-neutral-500">Try adjusting the joined date, next call, or pipeline filter.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => {
                const assigned =
                  lead.assigned_member ||
                  teamMembers.find((m) => m.id === lead.assigned_to);

                const meetingInfo = lead.next_meeting
                  ? formatMeetingTime(lead.next_meeting.scheduled_at)
                  : null;

                return (
                  <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    {/* School & Contact */}
                    <TableCell className="py-4 pl-5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-white flex items-center gap-2 hover:underline group cursor-pointer"
                        title="View full lead history & communication logs"
                      >
                        <Building2 className="size-4 text-neutral-400 group-hover:text-white shrink-0" />
                        <span className="truncate max-w-[190px]">{lead.organization}</span>
                      </Link>
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                        <span className="font-medium text-neutral-300">{lead.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Phone className="size-3 text-neutral-500" /> {lead.phone}
                        </span>
                      </div>
                      {lead.city && (
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="size-2.5" />
                          <span>{lead.city}</span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-400">{lead.source}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                        <Calendar className="size-3 text-indigo-400 shrink-0" />
                        <span>{formatJoinedDate(lead.created_at)}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
                        {lead.priority} Priority
                      </div>
                    </TableCell>

                    {/* Pipeline Stage */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        {getStatusPill(lead.status)}
                        <select
                          value={lead.status}
                          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                          className="h-5.5 text-[10px] rounded-full border border-white/10 bg-[#18181c] px-2 text-neutral-400 hover:text-white cursor-pointer outline-none"
                          title="Change pipeline stage"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                    </TableCell>

                    {/* Next Scheduled Call / Meeting */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {lead.next_meeting && meetingInfo ? (
                        <div className="space-y-1">
                          <div
                            onClick={() => onScheduleMeeting && onScheduleMeeting(lead)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors border ${
                              meetingInfo.isToday
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                : meetingInfo.isOverdue
                                ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                            }`}
                            title="Click to reschedule or edit meeting"
                          >
                            <Clock className="size-3" />
                            <span>{meetingInfo.badgeText}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-[160px] pl-1">
                            {lead.next_meeting.title}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onScheduleMeeting && onScheduleMeeting(lead)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-400 hover:text-white bg-[#18181c] border border-dashed border-white/10 hover:border-white/20 transition-all cursor-pointer"
                          title="Quick schedule call for this lead"
                        >
                          <CalendarPlus className="size-3 text-neutral-500" />
                          <span>Schedule Call</span>
                        </button>
                      )}
                    </TableCell>

                    {/* Assigned Rep */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {assigned ? (
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold shrink-0">
                            {assigned.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{assigned.name}</div>
                            <button
                              type="button"
                              onClick={() => onAssignLead(lead)}
                              className="text-[10px] text-neutral-400 hover:text-white underline underline-offset-2"
                            >
                              Reassign
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => onAssignLead(lead)}
                          className="rounded-full bg-[#202026] text-amber-400 border border-amber-500/30 hover:bg-[#282830] text-[11px] h-6 px-2.5"
                        >
                          <UserCheck className="size-3 mr-1" />
                          Assign Rep
                        </Button>
                      )}
                    </TableCell>

                    {/* Deal Value */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-white">
                        ₹{(Number(lead.deal_value) || 0).toLocaleString('en-IN')}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-4 pr-5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Call button with auto-log */}
                        <button
                          type="button"
                          onClick={async () => {
                            window.location.href = `tel:${lead.phone}`;
                            await crmService.createActivity({
                              lead_id: lead.id,
                              type: 'call',
                              title: 'Quick Call Initiated',
                              description: `Called ${lead.name} (${lead.phone}) from leads table.`,
                              outcome: 'Call Initiated',
                              performed_by: 'Staff',
                            });
                          }}
                          className="size-7 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors"
                          title="Call Lead (Auto-logs activity)"
                        >
                          <PhoneCall className="size-3" />
                        </button>

                        {/* Quick WhatsApp button with auto-log */}
                        <button
                          type="button"
                          onClick={async () => {
                            let clean = lead.phone.replace(/[^0-9]/g, '');
                            if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;
                            window.open(
                              `https://wa.me/${clean}?text=Hello%20${encodeURIComponent(
                                lead.name
                              )},%20regarding%20${encodeURIComponent(lead.organization)}%20admissions%20solution:`,
                              '_blank'
                            );
                            await crmService.createActivity({
                              lead_id: lead.id,
                              type: 'whatsapp',
                              title: 'Quick WhatsApp Started',
                              description: `Opened WhatsApp conversation with ${lead.name} (${lead.phone}) from leads table.`,
                              outcome: 'Chat Opened',
                              performed_by: 'Staff',
                            });
                          }}
                          className="size-7 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center transition-colors"
                          title="WhatsApp Lead (Auto-logs activity)"
                        >
                          <MessageCircle className="size-3" />
                        </button>

                        {/* Direct Add Log / Activity button */}
                        <button
                          type="button"
                          onClick={() => onLogActivity?.(lead)}
                          className="size-7 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center justify-center transition-colors"
                          title="Directly Log Activity / Notes"
                        >
                          <PlusCircle className="size-3" />
                        </button>

                        {/* Direct View All Logs button */}
                        <button
                          type="button"
                          onClick={() => onViewLogs?.(lead)}
                          className="size-7 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex items-center justify-center transition-colors"
                          title="Quickly View All Activity Logs & History"
                        >
                          <History className="size-3" />
                        </button>

                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEditLead(lead)}
                          className="rounded-full hover:bg-white/10 text-neutral-400 hover:text-white size-7"
                          title="Edit Lead Details"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            if (confirm(`Delete lead "${lead.organization}"?`)) {
                              onDeleteLead(lead.id);
                            }
                          }}
                          className="rounded-full hover:bg-red-500/20 text-neutral-500 hover:text-red-400 size-7"
                          title="Delete Lead"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {leads.length > 0 && (
        <div className="p-4 bg-[#16161a] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-white">
                {pageSize === 0 ? 1 : (safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-white">
                {pageSize === 0 ? leads.length : Math.min(safeCurrentPage * pageSize, leads.length)}
              </strong>{' '}
              of <strong className="text-white">{leads.length.toLocaleString('en-IN')}</strong> leads
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              <span className="text-[11px] text-neutral-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#1c1c22] border border-white/10 rounded-lg px-2 py-1 text-white text-[11px] cursor-pointer outline-none hover:border-white/20"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={0}>All ({leads.length})</option>
              </select>
            </div>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="xs"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border-white/10 bg-[#1e1e24] hover:bg-[#282830] text-neutral-300 disabled:opacity-30 disabled:pointer-events-none h-7 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </Button>

              <div className="px-2 text-xs font-semibold text-neutral-300">
                Page <span className="text-white">{safeCurrentPage}</span> of{' '}
                <span className="text-white">{totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="xs"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border-white/10 bg-[#1e1e24] hover:bg-[#282830] text-neutral-300 disabled:opacity-30 disabled:pointer-events-none h-7 px-2.5 text-xs gap-1"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
