'use client';

import { useState, useEffect } from 'react';
import { crmService } from '@/services/crmService';
import { TeamMember } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { MemberCard } from '@/components/team/member-card';
import { MemberDialog } from '@/components/team/member-dialog';
import { UserPlus, Users2, ShieldCheck, Briefcase, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamPage() {
  const { profile, isOwner } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const members = await crmService.getTeamMembers(profile?.owner_id);
      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadTeam();
    }
  }, [profile?.owner_id]);

  const handleSaveMember = async (formData: any) => {
    if (!isOwner) return;
    const ownerId = profile?.owner_id;
    if (selectedMember) {
      await crmService.updateTeamMember(selectedMember.id, formData, ownerId);
    } else {
      await crmService.createTeamMember(
        { ...formData, organization_name: profile?.organization },
        ownerId
      );
    }
    await loadTeam();
  };

  const handleToggleStatus = async (member: TeamMember) => {
    if (!isOwner) return;
    const nextStatus = member.status === 'active' ? 'inactive' : 'active';
    await crmService.updateTeamMember(member.id, { status: nextStatus }, profile?.owner_id);
    await loadTeam();
  };

  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter((m) => m.status === 'active').length;
  const totalLeadsAllocated = teamMembers.reduce(
    (sum, m) => sum + (m.assigned_leads_count || 0),
    0
  );
  const avgLeadsPerRep = activeMembers > 0 ? Math.round(totalLeadsAllocated / activeMembers) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="size-3 text-neutral-300" />
            Admissions Staff & Roles
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Team Members
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {profile?.organization ? `${profile.organization} • ` : ''}
            {isOwner
              ? 'Manage your staff representatives, roles, and lead capacities.'
              : 'Viewing workspace team directory and active workload.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isOwner && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#18181c] border border-white/8 px-3.5 py-1.5 text-xs text-neutral-400">
              <ShieldAlert className="size-3.5 text-neutral-400" />
              <span>View-only (Owner control)</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadTeam}
            title="Refresh Team"
            className="rounded-full size-9 p-0 border-white/10"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {isOwner && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedMember(null);
                setDialogOpen(true);
              }}
              className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-5 shadow-sm"
            >
              <UserPlus className="size-3.5 mr-1.5" />
              Add Team Member
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-1">
          <div className="text-xs text-neutral-400">Total Staff</div>
          <div className="text-2xl font-bold text-white">{totalMembers}</div>
          <div className="text-[11px] text-neutral-500">Registered agents</div>
        </div>

        <div className="p-5 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-1">
          <div className="text-xs text-neutral-400">Active Reps</div>
          <div className="text-2xl font-bold text-emerald-400">{activeMembers}</div>
          <div className="text-[11px] text-neutral-500">Handling inquiries</div>
        </div>

        <div className="p-5 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-1">
          <div className="text-xs text-neutral-400">Assigned Leads</div>
          <div className="text-2xl font-bold text-white">{totalLeadsAllocated}</div>
          <div className="text-[11px] text-neutral-500">In active workflows</div>
        </div>

        <div className="p-5 rounded-3xl border border-white/8 bg-[#121215] shadow-xl space-y-1">
          <div className="text-xs text-neutral-400">Avg Inquiries / Rep</div>
          <div className="text-2xl font-bold text-white">{avgLeadsPerRep}</div>
          <div className="text-[11px] text-neutral-500">Workload density</div>
        </div>
      </div>

      {/* Team Grid */}
      {teamMembers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center space-y-3 bg-[#121215]">
          <Users2 className="size-10 text-neutral-500 mx-auto" />
          <div className="text-base font-semibold text-white">No team members added yet</div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Add sales representatives so you can distribute inquiries and monitor conversions.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSelectedMember(null);
              setDialogOpen(true);
            }}
            className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-5"
          >
            <UserPlus className="size-3.5 mr-1" />
            Add First Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teamMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={(mem) => {
                setSelectedMember(mem);
                setDialogOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Member Form Modal */}
      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={selectedMember}
        onSave={handleSaveMember}
      />
    </div>
  );
}
