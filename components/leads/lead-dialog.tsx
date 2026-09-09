'use client';

import { useState, useEffect } from 'react';
import { Lead, TeamMember, LeadStatus, LeadPriority, LeadSource } from '@/types/crm';
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
import { FileSpreadsheet } from 'lucide-react';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  teamMembers: TeamMember[];
  onSave: (data: any) => Promise<void>;
  onOpenImportExcel?: () => void;
}

export function LeadDialog({
  open,
  onOpenChange,
  lead,
  teamMembers,
  onSave,
  onOpenImportExcel,
}: LeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    city: '',
    source: 'Website' as LeadSource,
    status: 'New' as LeadStatus,
    priority: 'Medium' as LeadPriority,
    deal_value: 50000,
    assigned_to: '',
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        organization: lead.organization || '',
        phone: lead.phone || '',
        email: lead.email || '',
        city: lead.city || '',
        source: lead.source || 'Website',
        status: lead.status || 'New',
        priority: lead.priority || 'Medium',
        deal_value: lead.deal_value || 0,
        assigned_to: lead.assigned_to || '',
        notes: lead.notes || '',
      });
    } else {
      setFormData({
        name: '',
        organization: '',
        phone: '',
        email: '',
        city: '',
        source: 'Website',
        status: 'New',
        priority: 'Medium',
        deal_value: 50000,
        assigned_to: '',
        notes: '',
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.organization || !formData.phone) {
      alert('Please fill in Contact Person, Organization, and Phone number.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        ...formData,
        deal_value: Number(formData.deal_value) || 0,
        assigned_to: formData.assigned_to ? formData.assigned_to : null,
      });
      onOpenChange(false);
    } catch (err: any) {
      alert('Failed to save lead: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121215] border border-white/10 text-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {lead ? 'Edit Inquiry' : 'New Admissions Lead'}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs">
            {lead
              ? 'Update the parameters or assignment for this school lead.'
              : 'Log an inquiry and allocate to an active admissions specialist.'}
          </DialogDescription>
        </DialogHeader>

        {!lead && onOpenImportExcel && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-emerald-400 shrink-0" />
              <span>Need to add multiple leads at once?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenImportExcel();
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 shrink-0 ml-2 cursor-pointer"
            >
              Upload via Excel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org" className="text-neutral-300 text-xs font-medium">School / Organization *</Label>
              <Input
                id="org"
                placeholder="e.g. St. Mary's High School"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="bg-[#18181c] border-white/8 text-xs text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-neutral-300 text-xs font-medium">Contact Person *</Label>
              <Input
                id="name"
                placeholder="e.g. Principal Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#18181c] border-white/8 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-neutral-300 text-xs font-medium">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-[#18181c] border-white/8 text-xs text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-neutral-300 text-xs font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="principal@school.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#18181c] border-white/8 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-neutral-300 text-xs font-medium">City / Region</Label>
              <Input
                id="city"
                placeholder="e.g. Delhi, Pune"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-[#18181c] border-white/8 text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal_value" className="text-neutral-300 text-xs font-medium">Expected Deal Value (₹)</Label>
              <Input
                id="deal_value"
                type="number"
                min="0"
                step="5000"
                value={formData.deal_value}
                onChange={(e) => setFormData({ ...formData, deal_value: Number(e.target.value) })}
                className="bg-[#18181c] border-white/8 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="source" className="text-neutral-300 text-xs font-medium">Lead Source</Label>
              <select
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Social Media">Social Media</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-neutral-300 text-xs font-medium">Pipeline Stage</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Progress">In Progress</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-neutral-300 text-xs font-medium">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assigned_to" className="flex items-center justify-between text-neutral-300 text-xs font-medium">
              <span>Assign to Team Member</span>
              <span className="text-[10px] text-neutral-500 font-normal">
                {teamMembers.length} staff available
              </span>
            </Label>
            <select
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs font-medium text-white outline-none cursor-pointer"
            >
              <option value="">-- Unassigned --</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role}) {member.status === 'inactive' ? '[Inactive]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-neutral-300 text-xs font-medium">Requirements & Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Inquiry notes, key modules needed, student count..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
