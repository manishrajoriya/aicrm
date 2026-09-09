'use client';

import { Lead, TeamMember, LeadStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Phone,
  ArrowLeft,
  ArrowRight,
  Edit2,
  AlertTriangle,
  PhoneCall,
  MessageCircle,
  Calendar,
  Clock,
  CalendarPlus,
  PlusCircle,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { crmService } from '@/services/crmService';
import { formatJoinedDate, formatMeetingTime } from '@/lib/lead-date-utils';

interface LeadKanbanProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  onEditLead: (lead: Lead) => void;
  onAssignLead: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<void>;
  onScheduleMeeting?: (lead: Lead) => void;
  onLogActivity?: (lead: Lead) => void;
  onViewLogs?: (lead: Lead) => void;
}

const STAGES: { id: LeadStatus; label: string }[] = [
  { id: 'New', label: 'New Inquiries' },
  { id: 'Contacted', label: 'Contacted' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Proposal Sent', label: 'Proposal Sent' },
  { id: 'Won', label: 'Won / Signed' },
  { id: 'Lost', label: 'Lost / Closed' },
];

export function LeadKanban({
  leads,
  teamMembers,
  onEditLead,
  onAssignLead,
  onStatusChange,
  onScheduleMeeting,
  onLogActivity,
  onViewLogs,
}: LeadKanbanProps) {
  const getNextStage = (current: LeadStatus): LeadStatus | null => {
    const order: LeadStatus[] = ['New', 'Contacted', 'In Progress', 'Proposal Sent', 'Won'];
    const idx = order.indexOf(current);
    if (idx !== -1 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  const getPrevStage = (current: LeadStatus): LeadStatus | null => {
    const order: LeadStatus[] = ['New', 'Contacted', 'In Progress', 'Proposal Sent', 'Won'];
    const idx = order.indexOf(current);
    if (idx > 0) return order[idx - 1];
    return null;
  };

  return (
    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
      {STAGES.map((stage) => {
        const columnLeads = leads.filter((l) => l.status === stage.id);
        const columnValue = columnLeads.reduce(
          (sum, l) => sum + (Number(l.deal_value) || 0),
          0
        );

        return (
          <div
            key={stage.id}
            className="flex flex-col rounded-3xl border border-white/8 bg-[#121215] min-w-[85vw] sm:min-w-[320px] md:min-w-0 shrink-0 md:shrink snap-center max-h-[calc(100vh-200px)] p-3 space-y-3 shadow-xl"
          >
            {/* Column Header */}
            <div className="p-2 border-b border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-white tracking-tight">
                  {stage.label}
                </span>
                <div className="text-[11px] text-neutral-400 font-medium mt-0.5">
                  ₹{columnValue.toLocaleString('en-IN')}
                </div>
              </div>
              <span className="rounded-full bg-[#18181c] text-neutral-300 text-[10px] font-bold px-2 py-0.5 border border-white/8">
                {columnLeads.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {columnLeads.length === 0 ? (
                <div className="h-28 flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-xs text-neutral-500">
                  Empty stage
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const assigned =
                    lead.assigned_member ||
                    teamMembers.find((m) => m.id === lead.assigned_to);
                  const next = getNextStage(lead.status);
                  const prev = getPrevStage(lead.status);
                  const meetingInfo = lead.next_meeting
                    ? formatMeetingTime(lead.next_meeting.scheduled_at)
                    : null;

                  return (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-2xl border border-white/6 bg-[#18181c] space-y-2.5 hover:border-white/20 transition-all shadow-md"
                    >
                      {/* Title & Actions */}
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-semibold text-xs text-white line-clamp-1 flex items-center gap-1.5 hover:underline group cursor-pointer"
                          title="View lead history & communication logs"
                        >
                          <Building2 className="size-3.5 text-neutral-400 group-hover:text-white shrink-0" />
                          <span className="truncate">{lead.organization}</span>
                        </Link>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Quick Call */}
                          <button
                            type="button"
                            onClick={async () => {
                              window.location.href = `tel:${lead.phone}`;
                              await crmService.createActivity({
                                lead_id: lead.id,
                                type: 'call',
                                title: 'Quick Call Initiated',
                                description: `Called ${lead.name} (${lead.phone}) from Kanban board.`,
                                outcome: 'Call Initiated',
                                performed_by: 'Staff',
                              });
                            }}
                            className="size-6 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors"
                            title="Call Lead"
                          >
                            <PhoneCall className="size-2.5" />
                          </button>

                          {/* Quick WhatsApp */}
                          <button
                            type="button"
                            onClick={async () => {
                              let clean = lead.phone.replace(/[^0-9]/g, '');
                              if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;
                              window.open(
                                `https://wa.me/${clean}?text=Hello%20${encodeURIComponent(
                                  lead.name
                                )},%20regarding%20${encodeURIComponent(lead.organization)}%20ERP:`,
                                '_blank'
                              );
                              await crmService.createActivity({
                                lead_id: lead.id,
                                type: 'whatsapp',
                                title: 'Quick WhatsApp Started',
                                description: `Started WhatsApp conversation with ${lead.name} (${lead.phone}) from Kanban board.`,
                                outcome: 'Chat Opened',
                                performed_by: 'Staff',
                              });
                            }}
                            className="size-6 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center transition-colors"
                            title="WhatsApp Lead"
                          >
                            <MessageCircle className="size-2.5" />
                          </button>

                          {/* Quick Add Log */}
                          <button
                            type="button"
                            onClick={() => onLogActivity?.(lead)}
                            className="size-6 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center justify-center transition-colors"
                            title="Directly Log Activity"
                          >
                            <PlusCircle className="size-2.5" />
                          </button>

                          {/* Quick View All Logs */}
                          <button
                            type="button"
                            onClick={() => onViewLogs?.(lead)}
                            className="size-6 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex items-center justify-center transition-colors"
                            title="Quickly View All Logs"
                          >
                            <History className="size-2.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditLead(lead)}
                            className="text-neutral-500 hover:text-white p-0.5"
                            title="Edit"
                          >
                            <Edit2 className="size-3" />
                          </button>
                        </div>
                      </div>

                      {/* Contact Info & Joined Date */}
                      <div className="text-xs text-neutral-400 space-y-1">
                        <div className="font-medium text-neutral-200">{lead.name}</div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Phone className="size-2.5" />
                            {lead.phone}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                            <Calendar className="size-2.5 text-indigo-400" />
                            {formatJoinedDate(lead.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Scheduled Next Call Banner */}
                      {lead.next_meeting && meetingInfo ? (
                        <div
                          onClick={() => onScheduleMeeting && onScheduleMeeting(lead)}
                          className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium cursor-pointer transition-colors ${
                            meetingInfo.isToday
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                              : meetingInfo.isOverdue
                              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                          }`}
                          title="Click to view/reschedule meeting"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock className="size-3 shrink-0" />
                            <span className="font-semibold">{meetingInfo.badgeText}:</span>
                            <span className="truncate text-neutral-300">{lead.next_meeting.title}</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onScheduleMeeting && onScheduleMeeting(lead)}
                          className="w-full flex items-center justify-center gap-1.5 py-1 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-neutral-500 hover:text-neutral-300 text-[10px] font-medium transition-colors"
                          title="Schedule Next Call"
                        >
                          <CalendarPlus className="size-3" />
                          <span>+ Schedule Next Call</span>
                        </button>
                      )}

                      {/* Deal Value & Priority */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="font-bold text-white">
                          ₹{(Number(lead.deal_value) || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="rounded-full bg-[#242428] text-neutral-300 text-[10px] px-2 py-0.5 border border-white/5">
                          {lead.priority}
                        </span>
                      </div>

                      {/* Assignee Footer */}
                      <div className="pt-1 flex items-center justify-between gap-1 text-xs">
                        {assigned ? (
                          <button
                            type="button"
                            onClick={() => onAssignLead(lead)}
                            className="flex items-center gap-1.5 text-left text-neutral-400 hover:text-white group"
                            title="Click to reassign"
                          >
                            <div className="size-5 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold">
                              {assigned.name.charAt(0)}
                            </div>
                            <span className="text-[11px] truncate max-w-[85px] group-hover:underline">
                              {assigned.name}
                            </span>
                          </button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onAssignLead(lead)}
                            className="rounded-full h-5 text-[10px] bg-[#222226] text-amber-400 border border-amber-500/20 px-2"
                          >
                            <AlertTriangle className="size-2.5 mr-1" />
                            Unassigned
                          </Button>
                        )}

                        {/* Stage Transition Controls */}
                        <div className="flex items-center gap-0.5 ml-auto">
                          {prev && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(lead.id, prev)}
                              className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                              title={`Move back to ${prev}`}
                            >
                              <ArrowLeft className="size-3" />
                            </button>
                          )}
                          {next && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(lead.id, next)}
                              className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                              title={`Move forward to ${next}`}
                            >
                              <ArrowRight className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
