'use client';

import { useState, useEffect, useMemo } from 'react';
import { crmService } from '@/services/crmService';
import { ScheduledMeetingItem, Lead } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePushNotification } from '@/hooks/usePushNotification';
import {
  BellRing,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageCircle,
  Video,
  ExternalLink,
  Calendar,
  Building2,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Check,
  X,
  Bell,
  CheckCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsHistoryPage() {
  const { profile } = useAuth();
  const { isSupported, permission, requestPermission } = usePushNotification();

  const [notifications, setNotifications] = useState<ScheduledMeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_action' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const ownerId = profile?.is_owner ? undefined : profile?.id;
      const data = await crmService.getUpcomingMeetings(ownerId);
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notification history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadNotifications();
    }
  }, [profile?.id, profile?.is_owner]);

  // Mark a meeting notification as completed
  const handleMarkComplete = async (meetingId: string) => {
    try {
      setActionLoadingId(meetingId);
      await crmService.updateActivity(meetingId, {
        outcome: 'Completed',
      }, profile?.owner_id);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification as completed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick call helper
  const handleCall = async (item: ScheduledMeetingItem) => {
    const phone = item.lead?.phone;
    if (!phone) return;
    window.location.href = `tel:${phone}`;
    try {
      await crmService.createActivity(
        {
          lead_id: item.lead_id,
          type: 'call',
          title: 'Notification Follow-up Call',
          description: `Called ${item.lead?.name || 'lead'} (${phone}) from Notification History for meeting: ${item.title}`,
          outcome: 'Call Initiated',
          performed_by: profile?.name || 'Representative',
        },
        profile?.owner_id
      );
    } catch (err) {
      console.error('Error logging call from notifications:', err);
    }
  };

  // Quick WhatsApp helper
  const handleWhatsApp = async (item: ScheduledMeetingItem) => {
    const phone = item.lead?.phone;
    if (!phone) return;

    let clean = phone.replace(/[^0-9]/g, '');
    if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;

    const schoolName = item.lead?.organization || 'your school';
    const contactName = item.lead?.name || '';
    const text = `Hello ${contactName ? contactName + ', ' : ''}regarding our scheduled meeting for ${schoolName}: ${item.title || 'ERP Live Demo'}`;

    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');

    try {
      await crmService.createActivity(
        {
          lead_id: item.lead_id,
          type: 'whatsapp',
          title: 'Notification WhatsApp Follow-up',
          description: `Sent WhatsApp to ${contactName || 'lead'} (${phone}) from Notification History for meeting: ${item.title}`,
          outcome: 'Chat Opened',
          performed_by: profile?.name || 'Representative',
        },
        profile?.owner_id
      );
    } catch (err) {
      console.error('Error logging whatsapp from notifications:', err);
    }
  };

  // Categorize notifications
  const now = Date.now();

  const categorizedItems = useMemo(() => {
    return notifications.map((item) => {
      const scheduledTime = item.scheduled_at ? new Date(item.scheduled_at).getTime() : 0;
      const diffMs = scheduledTime - now;
      const diffMinutes = Math.round(diffMs / (60 * 1000));

      const isCompleted = item.outcome === 'Completed';
      const isCancelled = item.outcome === 'Cancelled';
      const isImminent = diffMinutes <= 15 && diffMinutes >= -15 && !isCompleted && !isCancelled;
      const isOverdue = diffMinutes < -15 && !isCompleted && !isCancelled;
      const isUpcoming = diffMinutes > 15 && !isCompleted && !isCancelled;

      return {
        ...item,
        diffMinutes,
        isCompleted,
        isCancelled,
        isImminent,
        isOverdue,
        isUpcoming,
      };
    });
  }, [notifications, now]);

  // Summary counts
  const totalCount = categorizedItems.length;
  const needsActionCount = categorizedItems.filter((i) => i.isImminent || i.isOverdue).length;
  const upcomingCount = categorizedItems.filter((i) => i.isUpcoming).length;
  const completedCount = categorizedItems.filter((i) => i.isCompleted).length;

  // Filtered and searched list
  const filteredList = useMemo(() => {
    return categorizedItems.filter((item) => {
      // Tab filter
      if (activeFilter === 'needs_action' && !item.isImminent && !item.isOverdue) return false;
      if (activeFilter === 'upcoming' && !item.isUpcoming) return false;
      if (activeFilter === 'completed' && !item.isCompleted) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchOrg = item.lead?.organization?.toLowerCase().includes(q);
        const matchName = item.lead?.name?.toLowerCase().includes(q);
        const matchPhone = item.lead?.phone?.includes(q);
        if (!matchTitle && !matchOrg && !matchName && !matchPhone) return false;
      }

      return true;
    });
  }, [categorizedItems, activeFilter, searchQuery]);

  // Format date helper
  const formatNotificationTime = (iso?: string | null) => {
    if (!iso) return { dateStr: 'Date TBD', timeStr: '' };
    try {
      const d = new Date(iso);
      const isToday = d.toDateString() === new Date().toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isToday) {
        return {
          dateStr: 'Today',
          timeStr,
        };
      }
      return {
        dateStr: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' }),
        timeStr,
      };
    } catch {
      return { dateStr: iso, timeStr: '' };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-neutral-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="size-3 text-indigo-400" />
            Reminders & Alerts Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BellRing className="size-6 text-indigo-400" />
            Notification History
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            All push alerts, scheduled meeting reminders, and pending demo follow-ups in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            title="Refresh"
            className="rounded-full size-9 p-0 border-white/10 hover:bg-white/10"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Link href="/leads">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white px-4 border border-white/5 text-xs"
            >
              Back to Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* Push Notification Permission Banner (if not granted) */}
      {isSupported && permission !== 'granted' && (
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
              <Bell className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Browser Push Notifications Are Disabled
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                Enable notifications to receive instant audio alerts and lockscreen push reminders 10 minutes before your scheduled school demos.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={requestPermission}
            className="rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4 shrink-0"
          >
            Enable Push Notifications
          </Button>
        </div>
      )}

      {/* Metric Counters / Summary Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-white/10 border-white/30 shadow-md ring-1 ring-white/20'
              : 'bg-[#121215] border-white/8 hover:bg-[#18181c] text-neutral-400'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
            Total Alerts
          </div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('needs_action')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'needs_action'
              ? 'bg-red-500/15 border-red-500/30 shadow-md ring-1 ring-red-500/30'
              : 'bg-[#121215] border-white/8 hover:bg-[#18181c] text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-red-400">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            Needs Action
          </div>
          <div className="text-2xl font-bold text-white mt-1">{needsActionCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('upcoming')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'upcoming'
              ? 'bg-indigo-500/15 border-indigo-500/30 shadow-md ring-1 ring-indigo-500/30'
              : 'bg-[#121215] border-white/8 hover:bg-[#18181c] text-neutral-400'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-semibold text-indigo-400">
            Upcoming
          </div>
          <div className="text-2xl font-bold text-white mt-1">{upcomingCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('completed')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'completed'
              ? 'bg-emerald-500/15 border-emerald-500/30 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-[#121215] border-white/8 hover:bg-[#18181c] text-neutral-400'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">
            Actioned / Done
          </div>
          <div className="text-2xl font-bold text-white mt-1">{completedCount}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-[#121215] border border-white/8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
          <Input
            placeholder="Search school name, contact, phone, or demo title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-[#18181c] border-white/8 text-xs text-white placeholder:text-neutral-500 rounded-full"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'needs_action', label: `Action Needed (${needsActionCount})` },
            { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-black shadow-xs'
                  : 'bg-[#18181c] text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center rounded-3xl border border-white/8 bg-[#121215] space-y-2">
            <RefreshCw className="size-6 text-neutral-500 animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Loading notifications history...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-[#121215] space-y-2">
            <BellRing className="size-8 text-neutral-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No notifications match this filter</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Schedule demos or meetings for your leads to automatically generate notifications, push alerts, and audio chimes.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const { dateStr, timeStr } = formatNotificationTime(item.scheduled_at);
            const leadOrg = item.lead?.organization || 'School Lead';
            const contactName = item.lead?.name || '';
            const phone = item.lead?.phone || '';

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-4 sm:p-5 transition-all shadow-lg ${
                  item.isImminent
                    ? 'bg-[#181418] border-red-500/30 ring-1 ring-red-500/20'
                    : item.isOverdue
                    ? 'bg-[#181615] border-amber-500/25'
                    : item.isCompleted
                    ? 'bg-[#121215]/80 border-white/6 opacity-75'
                    : 'bg-[#121215] border-white/8 hover:border-white/15'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Indicator & Main Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${
                        item.isImminent
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : item.isOverdue
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : item.isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 className="size-5" />
                      ) : item.isImminent ? (
                        <BellRing className="size-5" />
                      ) : item.isOverdue ? (
                        <AlertTriangle className="size-5" />
                      ) : (
                        <Clock className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        {item.isCompleted ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Completed / Action Taken
                          </span>
                        ) : item.isImminent ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                            Meeting Now
                          </span>
                        ) : item.isOverdue ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Missed / Action Pending
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Scheduled
                          </span>
                        )}

                        {/* Scheduled Date & Time */}
                        <span className="text-xs text-neutral-300 font-medium flex items-center gap-1">
                          <Calendar className="size-3 text-neutral-400" />
                          {dateStr} {timeStr ? `at ${timeStr}` : ''}
                        </span>

                        {item.performed_by && (
                          <span className="text-[11px] text-neutral-500">
                            • Assigned to: <strong className="text-neutral-400">{item.performed_by}</strong>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white flex items-center gap-2 truncate">
                        <Building2 className="size-4 text-neutral-400 shrink-0" />
                        <span>{leadOrg}</span>
                        {contactName && (
                          <span className="text-xs font-normal text-neutral-400">
                            ({contactName})
                          </span>
                        )}
                      </h3>

                      <p className="text-xs text-neutral-300 flex items-center gap-2 flex-wrap">
                        <span className="text-indigo-400 font-medium">{item.title || 'Scheduled Demo'}</span>
                        {phone && (
                          <>
                            <span className="text-neutral-600">•</span>
                            <span className="text-neutral-400 flex items-center gap-1">
                              <Phone className="size-3 text-neutral-500" />
                              {phone}
                            </span>
                          </>
                        )}
                      </p>

                      {item.description && (
                        <p className="text-[11px] text-neutral-400 pt-0.5 line-clamp-1 italic">
                          "{item.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Direct Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap lg:shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/6">
                    {/* Call Button */}
                    {phone && (
                      <button
                        type="button"
                        onClick={() => handleCall(item)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title={`Call ${phone}`}
                      >
                        <Phone className="size-3.5 text-emerald-400" />
                        <span>Call</span>
                      </button>
                    )}

                    {/* WhatsApp Button */}
                    {phone && (
                      <button
                        type="button"
                        onClick={() => handleWhatsApp(item)}
                        className="py-1.5 px-3 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title={`WhatsApp ${phone}`}
                      >
                        <MessageCircle className="size-3.5 text-green-400" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {/* Join Meeting Link (if provided) */}
                    {item.meeting_link && (
                      <a
                        href={item.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="Join video conference"
                      >
                        <Video className="size-3.5" />
                        <span>Join</span>
                        <ExternalLink className="size-3 text-neutral-600" />
                      </a>
                    )}

                    {/* View Lead Button */}
                    <Link
                      href={`/leads/${item.lead_id}`}
                      className="py-1.5 px-3 rounded-xl bg-[#1c1c22] hover:bg-[#25252c] text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                    >
                      View Lead
                    </Link>

                    {/* Mark Completed Button */}
                    {!item.isCompleted && (
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleMarkComplete(item.id)}
                        className="rounded-xl border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-neutral-400 hover:text-emerald-400 text-xs px-2.5 h-8 gap-1"
                        title="Mark as Actioned / Completed"
                      >
                        <Check className="size-3.5" />
                        <span>Done</span>
                      </Button>
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
}
