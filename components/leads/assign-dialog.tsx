'use client';

import { useState } from 'react';
import { Lead, TeamMember } from '@/types/crm';
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
import { UserCheck, UserX } from 'lucide-react';

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  teamMembers: TeamMember[];
  onAssign: (leadId: string, memberId: string | null) => Promise<void>;
}

export function AssignDialog({
  open,
  onOpenChange,
  lead,
  teamMembers,
  onAssign,
}: AssignDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(lead?.assigned_to || '');
  const [loading, setLoading] = useState(false);

  if (!lead) return null;

  const handleAssign = async (memberId: string | null) => {
    try {
      setLoading(true);
      await onAssign(lead.id, memberId);
      onOpenChange(false);
    } catch (err: any) {
      alert('Failed to assign lead: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-[#121215] border border-white/10 text-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserCheck className="size-5 text-white" />
            Assign Lead
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Assign <strong className="text-white">{lead.organization}</strong> ({lead.name}) to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <div className="rounded-2xl bg-[#18181c] p-3.5 border border-white/6 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-400">Current Assignee:</span>
              <span className="font-semibold text-white">
                {lead.assigned_member?.name || (lead.assigned_to ? 'Assigned' : 'Unassigned')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Pipeline Stage:</span>
              <span className="font-medium text-white">{lead.status}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-xs">Select Team Member</Label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {teamMembers.map((member) => {
                const isSelected = selectedMemberId === member.id;
                const isCurrent = lead.assigned_to === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-sm transition-all ${
                      isSelected
                        ? 'border-white bg-white/10 text-white ring-1 ring-white/20'
                        : 'border-white/5 bg-[#18181c] hover:bg-[#202026] text-neutral-400'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {member.name}
                        {isCurrent && (
                          <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {member.role} • {member.email}
                      </div>
                    </div>
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#242428] text-neutral-300 border border-white/5">
                      {member.assigned_leads_count || 0} leads
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-white/5 bg-transparent">
          {lead.assigned_to && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-red-400 border-red-500/20 hover:bg-red-500/10"
              disabled={loading}
              onClick={() => handleAssign(null)}
            >
              <UserX className="size-3.5 mr-1" />
              Unassign
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-full border-white/10 text-neutral-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading || !selectedMemberId || selectedMemberId === lead.assigned_to}
              onClick={() => handleAssign(selectedMemberId)}
              className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-4"
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
