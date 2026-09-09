'use client';

import { useState, useEffect, useRef } from 'react';
import { crmService } from '@/services/crmService';
import { ScheduledMeetingItem } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { Video, Clock, X, ExternalLink, BellRing, Sparkles, Phone, MessageCircle } from 'lucide-react';
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
  const leadPhone = meeting.lead?.phone || '';
  const isNow = minutesLeft <= 0;

  const handleCall = async (e: React.MouseEvent) => {
    if (!leadPhone) {
      e.preventDefault();
      alert('No phone number available for this lead.');
      return;
    }
    try {
      await crmService.createActivity(
        {
          lead_id: meeting.lead_id,
          type: 'call',
          title: 'Meeting Follow-up Call',
          description: `Initiated call to ${meeting.lead?.name || 'lead'} (${leadPhone}) for meeting: ${meeting.title || 'ERP Demo'}`,
          outcome: 'Call Initiated',
          performed_by: profile?.name || 'Staff',
        },
        profile?.owner_id
      );
    } catch (err) {
      console.error('Failed to log call activity:', err);
    }
  };

  const handleWhatsApp = async () => {
    if (!leadPhone) {
      alert('No phone number available for this lead.');
      return;
    }

    let clean = leadPhone.replace(/[^0-9]/g, '');
    if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;

    const schoolName = meeting.lead?.organization || 'your school';
    const contactName = meeting.lead?.name || '';
    const text = `Hello ${contactName ? contactName + ', ' : ''}regarding our scheduled meeting for ${schoolName}: ${meeting.title || 'ERP Live Demo'}`;

    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');

    try {
      await crmService.createActivity(
        {
          lead_id: meeting.lead_id,
          type: 'whatsapp',
          title: 'Meeting WhatsApp Sent',
          description: `Sent WhatsApp to ${contactName || 'lead'} (${leadPhone}) for meeting: ${meeting.title || 'ERP Demo'}`,
          outcome: 'Chat Opened',
          performed_by: profile?.name || 'Staff',
        },
        profile?.owner_id
      );
    } catch (err) {
      console.error('Failed to log whatsapp activity:', err);
    }
  };

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
                {leadPhone ? ` • ${leadPhone}` : ''}
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

        {/* Action Buttons: Call, WhatsApp, Join Video (if link exists), View Lead */}
        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-white/8">
          {/* Call Button */}
          <a
            href={leadPhone ? `tel:${leadPhone}` : '#'}
            onClick={handleCall}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title={leadPhone ? `Call ${leadPhone}` : 'No phone number available'}
          >
            <Phone className="size-3.5 text-emerald-400" />
            <span>Call</span>
          </a>

          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 py-2 px-3 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title={leadPhone ? `WhatsApp ${leadPhone}` : 'No phone number available'}
          >
            <MessageCircle className="size-3.5 text-green-400" />
            <span>WhatsApp</span>
          </button>

          {/* Optional Direct Video Meeting Link */}
          {meeting.meeting_link && (
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Join Video Meeting"
            >
              <Video className="size-3.5" />
              <span>Join</span>
            </a>
          )}

          {/* View Lead Details */}
          <Link
            href={`/leads/${meeting.lead_id}`}
            className="py-2 px-3 rounded-xl bg-[#1c1c22] hover:bg-[#25252c] text-zinc-300 hover:text-white text-xs font-medium transition-colors shrink-0"
          >
            View Lead
          </Link>
        </div>
      </div>
    </div>
  );
}
