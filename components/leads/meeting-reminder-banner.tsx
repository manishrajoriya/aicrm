'use client';

import { useState, useEffect, useRef } from 'react';
import { crmService } from '@/services/crmService';
import { ScheduledMeetingItem } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { Video, Clock, X, ExternalLink, BellRing, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Soft audio chime using Web Audio API (Zero external mp3 dependencies)
function playGentleChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Pleasant two-tone chime (F#5 to C#6)
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playTone(739.99, 0, 0.4); // F#5
    playTone(1108.73, 0.15, 0.8); // C#6
  } catch (err) {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
}

export function MeetingReminderBanner() {
  const { profile } = useAuth();
  const [activeAlert, setActiveAlert] = useState<{
    meeting: ScheduledMeetingItem;
    minutesLeft: number;
  } | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const playedChimesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const checkUpcoming = async () => {
      try {
        const meetings = await crmService.getUpcomingMeetings(profile?.is_owner ? undefined : profile?.id);
        if (!isMounted || !meetings || meetings.length === 0) {
          if (isMounted) setActiveAlert(null);
          return;
        }

        const now = Date.now();
        let imminentMeeting: { meeting: ScheduledMeetingItem; minutesLeft: number } | null = null;

        for (const m of meetings) {
          if (!m.scheduled_at) continue;
          if (dismissedIds.includes(m.id)) continue;

          const meetingTime = new Date(m.scheduled_at).getTime();
          const diffMs = meetingTime - now;
          const diffMinutes = Math.round(diffMs / (60 * 1000));

          // Alert if meeting is within 15 minutes or started less than 5 minutes ago
          if (diffMinutes <= 15 && diffMinutes >= -5) {
            imminentMeeting = { meeting: m, minutesLeft: diffMinutes };

            // Play chime once when entering notification threshold
            if (!playedChimesRef.current.has(m.id)) {
              playedChimesRef.current.add(m.id);
              playGentleChime();
            }
            break;
          }
        }

        if (isMounted) {
          setActiveAlert(imminentMeeting);
        }
      } catch (err) {
        // Silently catch background polling errors
      }
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 20000); // Check every 20 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [profile?.id, profile?.is_owner, dismissedIds]);

  if (!activeAlert) return null;

  const { meeting, minutesLeft } = activeAlert;
  const leadName = meeting.lead?.organization || meeting.lead?.name || 'School Lead';
  const meetingUrl = meeting.meeting_link || `/leads/${meeting.lead_id}`;

  const isNow = minutesLeft <= 0;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-40px)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-3xl p-4 bg-[#141418]/95 backdrop-blur-xl border border-indigo-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white">
        <div className="flex items-start justify-between gap-3">
          {/* Icon & Details */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
              isNow ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              {isNow ? <BellRing className="size-5" /> : <Clock className="size-5" />}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isNow
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {isNow ? 'Meeting Now' : `In ${minutesLeft} mins`}
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {meeting.performed_by || 'Meeting Reminder'}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white truncate">
                {leadName}
              </h4>
              <p className="text-xs text-zinc-300 truncate">
                {meeting.title || 'Scheduled Demo / Meeting'}
              </p>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissedIds((prev) => [...prev, meeting.id])}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss Alert"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-white/8">
          <Link
            href={meetingUrl}
            target={meeting.meeting_link ? '_blank' : undefined}
            rel="noreferrer"
            className="flex-1 py-2 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Video className="size-3.5" />
            <span>{meeting.meeting_link ? 'Join Meeting Call' : 'Open Lead Details'}</span>
            {meeting.meeting_link && <ExternalLink className="size-3 ml-0.5 text-zinc-600" />}
          </Link>

          <Link
            href={`/leads/${meeting.lead_id}`}
            className="py-2 px-3 rounded-xl bg-[#1c1c22] hover:bg-[#25252c] text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            View Lead
          </Link>
        </div>
      </div>
    </div>
  );
}
