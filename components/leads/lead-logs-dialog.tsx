'use client';

import { useState, useEffect } from 'react';
import { Lead, LeadActivity, ActivityType } from '@/types/crm';
import { crmService } from '@/services/crmService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/leads/activity-timeline';
import {
  History,
  Building2,
  Phone,
  MessageCircle,
  PhoneCall,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface LeadLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onAddLog?: (lead: Lead) => void;
}

export function LeadLogsDialog({
  open,
  onOpenChange,
  lead,
  onAddLog,
}: LeadLogsDialogProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all');

  const fetchActivities = async () => {
    if (!lead?.id) return;
    try {
      setLoading(true);
      const data = await crmService.getLeadActivities(lead.id);
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activities for lead:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && lead?.id) {
      fetchActivities();
      setFilterType('all');
    } else {
      setActivities([]);
    }
  }, [open, lead?.id]);

  if (!lead) return null;

  const filteredActivities =
    filterType === 'all'
      ? activities
      : activities.filter((a) => a.type === filterType);

  const callCount = activities.filter((a) => a.type === 'call').length;
  const whatsappCount = activities.filter((a) => a.type === 'whatsapp').length;
  const meetingCount = activities.filter((a) => a.type === 'meeting').length;
  const noteCount = activities.filter((a) => a.type === 'note').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[#121215] border border-white/10 text-white p-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/8 space-y-3 bg-[#16161a]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-10 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <History className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Activity History ({activities.length})
                  </span>
                  <span className="text-xs text-neutral-400">
                    Stage: <strong className="text-neutral-200">{lead.status}</strong>
                  </span>
                </div>

                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2 truncate">
                  <Building2 className="size-4 text-neutral-400 shrink-0" />
                  <span className="truncate">{lead.organization}</span>
                </DialogTitle>

                <DialogDescription className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
                  <span className="text-neutral-300">{lead.name}</span>
                  {lead.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Phone className="size-3" />
                        {lead.phone}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActivities}
                title="Refresh Logs"
                className="rounded-full size-8 p-0 border-white/10 hover:bg-white/10"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {onAddLog && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAddLog(lead);
                  }}
                  className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 text-xs px-3.5 h-8 gap-1.5 shadow-sm"
                >
                  <PlusCircle className="size-3.5" />
                  <span>Add Log</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            {[
              { id: 'all', label: `All (${activities.length})` },
              { id: 'call', label: `Calls (${callCount})` },
              { id: 'whatsapp', label: `WhatsApp (${whatsappCount})` },
              { id: 'meeting', label: `Meetings (${meetingCount})` },
              { id: 'note', label: `Notes (${noteCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-white text-black shadow-xs'
                    : 'bg-[#1e1e24] text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Timeline Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {loading ? (
            <div className="p-12 text-center space-y-2">
              <RefreshCw className="size-6 text-neutral-500 animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Loading interaction logs...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-[#18181c] space-y-3">
              <History className="size-8 text-neutral-500 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No logs found for this filter</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No interaction logs recorded yet. Use the "Add Log" button to record calls, WhatsApp chats, meetings, or discussion notes.
              </p>
              {onAddLog && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAddLog(lead);
                  }}
                  className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 text-xs px-4"
                >
                  <PlusCircle className="size-3.5 mr-1" />
                  Add First Activity Log
                </Button>
              )}
            </div>
          ) : (
            <ActivityTimeline activities={filteredActivities} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/8 bg-[#16161a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                title={`Call ${lead.phone}`}
              >
                <PhoneCall className="size-3 text-emerald-400" />
                <span>Call</span>
              </a>
            )}
            {lead.phone && (
              <button
                type="button"
                onClick={() => {
                  let clean = lead.phone.replace(/[^0-9]/g, '');
                  if (!clean.startsWith('91') && clean.length === 10) clean = '91' + clean;
                  window.open(
                    `https://wa.me/${clean}?text=Hello%20${encodeURIComponent(
                      lead.name
                    )},%20regarding%20${encodeURIComponent(lead.organization)}:`,
                    '_blank'
                  );
                }}
                className="py-1.5 px-3 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                title={`WhatsApp ${lead.phone}`}
              >
                <MessageCircle className="size-3 text-green-400" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/leads/${lead.id}`}
              onClick={() => onOpenChange(false)}
              className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center gap-1 transition-all"
            >
              <span>Full Lead Details</span>
              <ExternalLink className="size-3 text-neutral-600" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-white/10 text-neutral-400 hover:text-white text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
