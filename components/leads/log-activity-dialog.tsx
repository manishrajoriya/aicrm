'use client';

import { useState } from 'react';
import { ActivityType } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneCall, MessageCircle, FileText, Calendar, PlusCircle } from 'lucide-react';

interface LogActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  performedBy: string;
  onSave: (activity: {
    lead_id: string;
    type: ActivityType;
    title: string;
    description: string;
    outcome?: string;
    performed_by: string;
  }) => Promise<void>;
}

export function LogActivityDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  performedBy,
  onSave,
}: LogActivityDialogProps) {
  const [type, setType] = useState<ActivityType>('call');
  const [title, setTitle] = useState('');
  const [outcome, setOutcome] = useState('Connected');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter an activity title or summary.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        lead_id: leadId,
        type,
        title,
        outcome: type === 'call' || type === 'meeting' ? outcome : undefined,
        description,
        performed_by: performedBy,
      });
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      alert('Failed to record activity log: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = [
    { id: 'call' as ActivityType, label: 'Call Log', icon: PhoneCall },
    { id: 'whatsapp' as ActivityType, label: 'WhatsApp', icon: MessageCircle },
    { id: 'note' as ActivityType, label: 'Note / Update', icon: FileText },
    { id: 'meeting' as ActivityType, label: 'Meeting / Demo', icon: Calendar },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-[#121215] border border-white/10 text-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <PlusCircle className="size-5 text-white" />
            Log Activity
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs">
            Record interaction details or follow-up notes for <strong className="text-white">{leadName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Type Selector Pills */}
          <div className="space-y-1.5">
            <Label className="text-neutral-300 text-xs font-medium">Activity Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activityTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setType(t.id);
                      if (!title) {
                        if (t.id === 'call') setTitle('Phone Call Discussion');
                        if (t.id === 'whatsapp') setTitle('WhatsApp Message Sent');
                        if (t.id === 'meeting') setTitle('Product Demonstration');
                        if (t.id === 'note') setTitle('Requirements Note');
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-white bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                        : 'border-white/5 bg-[#18181c] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className="size-4 mb-1" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-neutral-300 text-xs font-medium">Summary / Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Discussed ERP pricing with Principal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#18181c] border-white/8 text-xs text-white"
              required
            />
          </div>

          {/* Outcome dropdown if call or meeting */}
          {(type === 'call' || type === 'meeting') && (
            <div className="space-y-1.5">
              <Label htmlFor="outcome" className="text-neutral-300 text-xs font-medium">Interaction Outcome</Label>
              <select
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value="Connected - Follow up needed">Connected - Follow up needed</option>
                <option value="Connected - Demo Scheduled">Connected - Demo Scheduled</option>
                <option value="Connected - Quotation Requested">Connected - Quotation Requested</option>
                <option value="Busy - Call back later">Busy - Call back later</option>
                <option value="No Answer / Ringing">No Answer / Ringing</option>
                <option value="Meeting Completed Successfully">Meeting Completed Successfully</option>
                <option value="Decision Pending">Decision Pending</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-neutral-300 text-xs font-medium">Details & Discussion Points</Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="Summary of student capacity, budget objections, next steps, follow-up date..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#18181c] border-white/8 text-xs text-white resize-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-white/5 bg-transparent">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-full border-white/10 text-neutral-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-5 shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Activity Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
