'use client';

import { LeadActivity, ActivityType } from '@/types/crm';
import {
  PhoneCall,
  MessageCircle,
  FileText,
  Calendar,
  Layers,
  Clock,
  User,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: LeadActivity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return (
          <div className="size-8 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <PhoneCall className="size-4" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="size-8 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 flex items-center justify-center shrink-0">
            <MessageCircle className="size-4" />
          </div>
        );
      case 'meeting':
        return (
          <div className="size-8 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Calendar className="size-4" />
          </div>
        );
      case 'status_change':
        return (
          <div className="size-8 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Layers className="size-4" />
          </div>
        );
      default:
        return (
          <div className="size-8 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <FileText className="size-4" />
          </div>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl bg-[#121215] space-y-2">
        <Clock className="size-8 text-neutral-500 mx-auto" />
        <div className="text-sm font-semibold text-white">No activity history yet</div>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          Click Call, WhatsApp, or Log Activity above to automatically capture interactions.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-white/10">
      {activities.map((act) => (
        <div key={act.id} className="relative flex items-start gap-4 group">
          {/* Icon */}
          <div className="-ml-6 z-10">{getActivityIcon(act.type)}</div>

          {/* Activity Card */}
          <div className="flex-1 rounded-2xl border border-white/6 bg-[#18181c] p-4 space-y-1.5 hover:border-white/15 transition-all shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-white">
                  {act.title}
                </span>
                {act.outcome && (
                  <span className="rounded-full bg-[#242428] text-neutral-300 border border-white/5 text-[10px] px-2 py-0.5">
                    {act.outcome}
                  </span>
                )}
              </div>

              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Clock className="size-3" />
                {formatDate(act.created_at)}
              </span>
            </div>

            {act.description && (
              <p className="text-xs text-neutral-300 leading-relaxed pt-0.5 whitespace-pre-wrap">
                {act.description}
              </p>
            )}

            {act.scheduled_at && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Calendar className="size-3" /> Scheduled for: {formatDate(act.scheduled_at)}
                </span>
                {act.meeting_link && (
                  <a
                    href={act.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    Open Meeting Link
                  </a>
                )}
              </div>
            )}

            {act.performed_by && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1 border-t border-white/5">
                <User className="size-3" />
                <span>Logged by {act.performed_by}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
