'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScheduledMeetingItem } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Video,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Building2,
  Sparkles,
  Plus,
  User,
} from 'lucide-react';

interface UpcomingMeetingsProps {
  meetings: ScheduledMeetingItem[];
  onRefresh: () => void;
  onOpenSchedule: () => void;
}

export function UpcomingMeetings({ meetings, onRefresh, onOpenSchedule }: UpcomingMeetingsProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const formatMeetingDate = (dateStr?: string | null) => {
    if (!dateStr) return { label: 'Upcoming', badge: 'Soon', isToday: false };
    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return {
        label: `Today at ${timeStr}`,
        badge: 'Today',
        isToday: true,
      };
    }
    if (isTomorrow) {
      return {
        label: `Tomorrow at ${timeStr}`,
        badge: 'Tomorrow',
        isToday: false,
      };
    }
    const dayStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
    return {
      label: `${dayStr} • ${timeStr}`,
      badge: dayStr,
      isToday: false,
    };
  };

  const handleMarkComplete = async (meetingId: string) => {
    try {
      setCompletingId(meetingId);
      await crmService.updateActivity(meetingId, {
        outcome: 'Completed',
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to complete meeting:', err);
    } finally {
      setCompletingId(null);
    }
  };

  // Filter out meetings already marked 'Completed' or 'Cancelled'
  const activeMeetings = meetings.filter(
    (m) => m.outcome !== 'Completed' && m.outcome !== 'Cancelled'
  );

  return (
    <div className="bg-[#121215] border border-white/8 rounded-3xl p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-semibold text-white tracking-tight">
                Upcoming Meetings & Demos
              </h3>
              {activeMeetings.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeMeetings.length} Scheduled
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Live demos, commercial walkthroughs, and principal meetings
            </p>
          </div>
        </div>

        <Button
          onClick={onOpenSchedule}
          size="sm"
          className="rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-xs h-8 px-3.5 gap-1.5 shadow-md shadow-white/5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Schedule</span> Meeting
        </Button>
      </div>

      {activeMeetings.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#18181c]/60 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-zinc-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">No upcoming meetings scheduled</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Book live product demos or commercial reviews with prospective schools.
            </p>
          </div>
          <Button
            onClick={onOpenSchedule}
            variant="outline"
            size="sm"
            className="rounded-full bg-[#1e1e24] border-white/10 text-white hover:bg-white/10 text-xs h-8 px-4"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Schedule First Meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeMeetings.map((item) => {
            const timeInfo = formatMeetingDate(item.scheduled_at);
            const isGoogleMeet = item.meeting_link?.includes('meet.google') || item.description?.includes('Google Meet');

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-white/6 bg-[#18181c] hover:border-white/12 hover:bg-[#1a1a1f] p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Meeting Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        timeInfo.isToday
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-zinc-800 text-zinc-300 border border-white/10'
                      }`}
                    >
                      {timeInfo.label}
                    </span>

                    {item.meeting_link ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video Call
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Campus / Phone
                      </span>
                    )}

                    {item.performed_by && (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-500" /> Host: {item.performed_by}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    {item.lead ? (
                      <Link
                        href={`/leads/${item.lead.id}`}
                        className="font-semibold text-white hover:text-indigo-300 transition-colors text-sm truncate flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{item.lead.organization}</span>
                        <span className="text-zinc-400 font-normal text-xs">({item.lead.name})</span>
                      </Link>
                    ) : (
                      <span className="font-semibold text-white text-sm">Target Lead Meeting</span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 font-medium line-clamp-1">
                    {item.title}
                  </p>

                  {item.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto">
                  {item.meeting_link && (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 transition-all shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}

                  {item.lead?.phone && (
                    <div className="flex items-center gap-1.5">
                      {/* Quick Call */}
                      <button
                        type="button"
                        onClick={async () => {
                          window.location.href = `tel:${item.lead?.phone}`;
                          if (item.lead) {
                            await crmService.createActivity({
                              lead_id: item.lead.id,
                              type: 'call',
                              title: 'Meeting Call Initiated',
                              description: `Placed phone call to ${item.lead.name} (${item.lead.phone}) for upcoming meeting.`,
                              outcome: 'Call Initiated',
                              performed_by: 'Staff',
                            });
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors"
                        title={`Call ${item.lead.phone} (Auto-logs)`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick WhatsApp */}
                      <button
                        type="button"
                        onClick={async () => {
                          let clean = (item.lead?.phone || '').replace(/[^0-9]/g, '');
                          if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;
                          window.open(
                            `https://wa.me/${clean}?text=Hello%20${encodeURIComponent(item.lead?.name || '')},%20regarding%20our%20upcoming%20meeting%20for%20${encodeURIComponent(item.lead?.organization || '')}:`,
                            '_blank'
                          );
                          if (item.lead) {
                            await crmService.createActivity({
                              lead_id: item.lead.id,
                              type: 'whatsapp',
                              title: 'Meeting WhatsApp Sent',
                              description: `Sent WhatsApp reminder to ${item.lead.name} (${item.lead.phone}) for upcoming meeting.`,
                              outcome: 'Chat Opened',
                              performed_by: 'Staff',
                            });
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/20 flex items-center justify-center transition-colors"
                        title={`WhatsApp ${item.lead.phone} (Auto-logs)`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <Button
                    onClick={() => handleMarkComplete(item.id)}
                    disabled={completingId === item.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-transparent border-white/10 text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-xs h-8 px-3 gap-1"
                    title="Mark meeting as completed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Done</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
