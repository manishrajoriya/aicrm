'use client';

import { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PhoneCall,
  MessageCircle,
  CheckCircle2,
  PhoneOff,
  Clock,
  AlertCircle,
  Send,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface QuickContactLoggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'call' | 'whatsapp';
  lead: Lead;
  performedBy: string;
  onSave: (data: {
    type: 'call' | 'whatsapp';
    title: string;
    outcome: string;
    description: string;
    newStatus?: LeadStatus;
  }) => Promise<void>;
}

export function QuickContactLoggerDialog({
  open,
  onOpenChange,
  type,
  lead,
  performedBy,
  onSave,
}: QuickContactLoggerDialogProps) {
  const [outcome, setOutcome] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'same'>('same');
  const [loading, setLoading] = useState(false);

  // Call outcome options
  const callOutcomes = [
    {
      id: 'Connected - Spoke with Decision Maker',
      label: 'Connected / Spoke',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
      icon: CheckCircle2,
    },
    {
      id: 'Connected - Callback Requested',
      label: 'Callback Requested',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
      icon: Clock,
    },
    {
      id: 'Ringing / No Answer',
      label: 'Ringing / No Answer',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
      icon: PhoneOff,
    },
    {
      id: 'Busy / Line Engaged',
      label: 'Busy / Engaged',
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30',
      icon: AlertCircle,
    },
    {
      id: 'Wrong Number / Switched Off',
      label: 'Wrong / Off',
      color: 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30',
      icon: XCircle,
    },
    {
      id: 'Not Interested',
      label: 'Not Interested',
      color: 'bg-neutral-700/40 text-neutral-300 border-white/10 hover:bg-neutral-700/60',
      icon: HelpCircle,
    },
  ];

  // WhatsApp outcome options
  const whatsappOutcomes = [
    {
      id: 'Replied - In Discussion',
      label: 'Replied / In Discussion',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
      icon: CheckCircle2,
    },
    {
      id: 'Message Sent - Awaiting Reply',
      label: 'Sent (Awaiting Reply)',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
      icon: Send,
    },
    {
      id: 'Brochure / Proposal Sent',
      label: 'Proposal / Brochure Sent',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30',
      icon: Sparkles,
    },
    {
      id: 'No WhatsApp / Invalid Number',
      label: 'Invalid / No WhatsApp',
      color: 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30',
      icon: XCircle,
    },
  ];

  const outcomes = type === 'call' ? callOutcomes : whatsappOutcomes;

  // Reset defaults when modal opens
  useEffect(() => {
    if (open) {
      if (type === 'call') {
        setOutcome('Connected - Spoke with Decision Maker');
      } else {
        setOutcome('Message Sent - Awaiting Reply');
      }
      setDescription('');
      setSelectedStatus('same');
    }
  }, [open, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) {
      alert('Please select an outcome.');
      return;
    }

    try {
      setLoading(true);
      const title =
        type === 'call'
          ? `Call: ${outcome}`
          : `WhatsApp: ${outcome}`;

      await onSave({
        type,
        title,
        outcome,
        description: description.trim() || `Recorded outcome: ${outcome}`,
        newStatus: selectedStatus !== 'same' ? selectedStatus : undefined,
      });

      onOpenChange(false);
    } catch (err: any) {
      alert('Failed to save log: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const isCall = type === 'call';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-[#121215] border border-white/10 text-white p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className={`size-9 rounded-2xl flex items-center justify-center ${
                isCall
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-green-600/15 text-green-400 border border-green-600/20'
              }`}
            >
              {isCall ? <PhoneCall className="size-4.5" /> : <MessageCircle className="size-4.5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                {isCall ? 'Log Call Outcome' : 'Log WhatsApp Outcome'}
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs mt-0.5">
                {lead.name} ({lead.organization}) • <span className="text-neutral-300">{lead.phone}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 1-Click Outcome Selector */}
          <div className="space-y-2">
            <Label className="text-neutral-300 text-xs font-semibold">
              {isCall ? 'Did the call connect?' : 'WhatsApp Status / Outcome'}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((item) => {
                const Icon = item.icon;
                const isSelected = outcome === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOutcome(item.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? `${item.color} shadow-sm ring-1 ring-white/25 scale-[1.01]`
                        : 'bg-[#18181c] border-white/6 text-neutral-400 hover:text-neutral-200 hover:bg-[#202026]'
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discussion Notes / What Happened After */}
          <div className="space-y-1.5">
            <Label htmlFor="call-notes" className="text-neutral-300 text-xs font-semibold">
              What happened after it? (Notes / Discussion Points)
            </Label>
            <Textarea
              id="call-notes"
              rows={3}
              autoFocus
              placeholder={
                isCall
                  ? 'e.g. Spoke with Principal Mr. Sharma. Interested in student attendance & fee collection module. Wants quotation by tomorrow.'
                  : 'e.g. Sent ERP presentation video and PDF brochure. Principal acknowledged receipt.'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#18181c] border-white/8 text-xs text-white placeholder:text-neutral-500 resize-none rounded-2xl focus:border-white/20"
            />
          </div>

          {/* Optional: Quick Stage Update */}
          <div className="space-y-1.5 pt-1 border-t border-white/6">
            <div className="flex items-center justify-between">
              <Label htmlFor="stage-update" className="text-neutral-400 text-[11px]">
                Update Lead Stage
              </Label>
              <span className="text-[11px] text-neutral-500">
                Current: <strong className="text-neutral-300">{lead.status}</strong>
              </span>
            </div>
            <select
              id="stage-update"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
            >
              <option value="same">Keep Current Stage ({lead.status})</option>
              <option value="New">Move to "New"</option>
              <option value="Contacted">Move to "Contacted"</option>
              <option value="In Progress">Move to "In Progress"</option>
              <option value="Proposal Sent">Move to "Proposal Sent"</option>
              <option value="Won">Move to "Won"</option>
              <option value="Lost">Move to "Lost"</option>
            </select>
          </div>

          <DialogFooter className="pt-2 border-t border-white/5 flex items-center justify-between sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-full border-white/10 text-neutral-400 hover:text-white"
            >
              Skip
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className={`rounded-full font-bold px-5 text-xs shadow-md ${
                isCall
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
