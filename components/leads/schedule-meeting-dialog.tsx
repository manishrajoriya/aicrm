'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Video, Building2, Bell } from 'lucide-react';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  preselectedLeadId?: string;
  onMeetingScheduled?: () => void;
}

const QUICK_TOPICS = [
  'ERP Live Demo',
  'Follow-up Call',
  'Fee Module Review',
  'Quotation Discussion',
];

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  leads,
  preselectedLeadId,
  onMeetingScheduled,
}: ScheduleMeetingDialogProps) {
  const { profile } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00');
  const [platform, setPlatform] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (preselectedLeadId) {
        setSelectedLeadId(preselectedLeadId);
      } else if (leads.length > 0 && (!selectedLeadId || !leads.some((l) => l.id === selectedLeadId))) {
        setSelectedLeadId(leads[0].id);
      }

      // Default to tomorrow at 11:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime('11:00');
      setTitle('ERP Live Demo');
      setMeetingLink('');
    }
  }, [open, preselectedLeadId, leads]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Quick Time Presets
  const setQuickTime = (type: 'today_afternoon' | 'tomorrow_morning' | 'in_2_days') => {
    const now = new Date();
    if (type === 'today_afternoon') {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime('16:00');
    } else if (type === 'tomorrow_morning') {
      now.setDate(now.getDate() + 1);
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime('11:00');
    } else if (type === 'in_2_days') {
      now.setDate(now.getDate() + 2);
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime('14:30');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !date || !time) return;

    try {
      setSubmitting(true);
      const scheduledDateTime = new Date(`${date}T${time}:00`).toISOString();

      await crmService.scheduleMeeting({
        lead_id: selectedLeadId,
        title: title || 'Quick Meeting Reminder',
        scheduled_at: scheduledDateTime,
        meeting_link: meetingLink.trim() ? meetingLink.trim() : undefined,
        description: `${platform} meeting reminder.`,
        performed_by: profile?.name || 'Staff',
      });

      if (selectedLead && (selectedLead.status === 'New' || selectedLead.status === 'Contacted')) {
        await crmService.updateLeadStatus(selectedLeadId, 'In Progress');
      }

      onOpenChange(false);
      if (onMeetingScheduled) onMeetingScheduled();
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] bg-[#121215] border border-white/10 text-white rounded-3xl p-5 shadow-2xl">
        <DialogHeader className="space-y-1 pb-1">
          <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-semibold tracking-wider uppercase">
            <Bell className="w-3.5 h-3.5" /> Meeting Reminder
          </div>
          <DialogTitle className="text-base font-bold text-white tracking-tight">
            Schedule Quick Reminder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Target School / Lead */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-zinc-400">School / Lead</Label>
            {preselectedLeadId && selectedLead ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#18181c] border border-white/8 text-xs font-semibold text-white">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{selectedLead.organization}</span>
                <span className="text-zinc-400 font-normal text-[11px]">({selectedLead.name})</span>
              </div>
            ) : (
              <Select value={selectedLeadId} onValueChange={(val) => val && setSelectedLeadId(val)} required>
                <SelectTrigger className="bg-[#18181c] border-white/10 rounded-xl h-9 text-white text-xs">
                  <SelectValue placeholder="Select target school">
                    {selectedLead ? `${selectedLead.organization} (${selectedLead.name})` : 'Select target school'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#18181c] border-white/10 text-white rounded-xl max-h-48">
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-xs py-1.5">
                      {l.organization} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Meeting Title / Reminder */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-zinc-400">Topic / Agenda</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ERP Live Demo"
              required
              className="bg-[#18181c] border-white/10 rounded-xl h-9 text-white text-xs"
            />
            {/* Quick Topic Chips */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setTitle(topic)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                    title === topic
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-white/5 border-white/8 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-zinc-400">When</Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickTime('today_afternoon')}
                  className="text-[10px] text-zinc-400 hover:text-indigo-300 underline"
                >
                  Today 4PM
                </button>
                <span className="text-zinc-600 text-[10px]">•</span>
                <button
                  type="button"
                  onClick={() => setQuickTime('tomorrow_morning')}
                  className="text-[10px] text-zinc-400 hover:text-indigo-300 underline"
                >
                  Tomorrow 11AM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-[#18181c] border-white/10 rounded-xl h-9 text-white text-xs"
                />
              </div>
              <div className="relative">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="bg-[#18181c] border-white/10 rounded-xl h-9 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Format & Optional Link */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-zinc-400">Format</Label>
              <Select value={platform} onValueChange={(val) => val && setPlatform(val)}>
                <SelectTrigger className="bg-[#18181c] border-white/10 rounded-xl h-9 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181c] border-white/10 text-white rounded-xl">
                  <SelectItem value="Google Meet" className="text-xs">Google Meet</SelectItem>
                  <SelectItem value="Zoom" className="text-xs">Zoom</SelectItem>
                  <SelectItem value="Phone Call" className="text-xs">Phone Call</SelectItem>
                  <SelectItem value="In-Person" className="text-xs">Campus Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(platform === 'Google Meet' || platform === 'Zoom') && (
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-zinc-400">Link (Optional)</Label>
                <Input
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="Optional meeting link"
                  className="bg-[#18181c] border-white/10 rounded-xl h-9 text-white text-xs truncate"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 flex-row justify-end gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-transparent border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white text-xs h-8 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-xs h-8 px-5 shadow-sm"
            >
              {submitting ? 'Saving...' : 'Set Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
