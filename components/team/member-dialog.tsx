'use client';

import { useState, useEffect } from 'react';
import { TeamMember, TeamRole } from '@/types/crm';
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

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSave: (data: any) => Promise<void>;
}

export function MemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: MemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Executive' as TeamRole,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'Sales Executive',
        status: member.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Sales Executive',
        status: 'active',
      });
    }
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Please fill in Member Name and Email.');
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onOpenChange(false);
    } catch (err: any) {
      alert('Failed to save team member: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-[#121215] border border-white/10 text-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {member ? 'Edit Staff Profile' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs">
            {member
              ? 'Update account designation or active availability.'
              : 'Add an admissions representative to assign incoming school leads.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="mem_name" className="text-neutral-300 text-xs font-medium">Full Name *</Label>
            <Input
              id="mem_name"
              placeholder="e.g. Aarav Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#18181c] border-white/8 text-xs text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mem_email" className="text-neutral-300 text-xs font-medium">Work Email *</Label>
            <Input
              id="mem_email"
              type="email"
              placeholder="name@aischoolapp.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-[#18181c] border-white/8 text-xs text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mem_phone" className="text-neutral-300 text-xs font-medium">Phone / Mobile</Label>
            <Input
              id="mem_phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-[#18181c] border-white/8 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mem_role" className="text-neutral-300 text-xs font-medium">Designation</Label>
              <select
                id="mem_role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamRole })}
                className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value="Sales Executive">Sales Executive</option>
                <option value="Lead Specialist">Lead Specialist</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mem_status" className="text-neutral-300 text-xs font-medium">Status</Label>
              <select
                id="mem_status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full h-10 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              {loading ? 'Saving...' : member ? 'Update Profile' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
