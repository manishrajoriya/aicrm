'use client';

import { TeamMember } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Edit2, Briefcase, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface MemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onToggleStatus: (member: TeamMember) => void;
  onDelete?: (member: TeamMember) => void;
}

export function MemberCard({ member, onEdit, onToggleStatus, onDelete }: MemberCardProps) {
  const { isOwner } = useAuth();

  return (
    <div className="rounded-3xl border border-white/8 bg-[#121215] p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/15 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center shadow-sm">
            {member.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white leading-snug">
              {member.name}
            </h3>
            <span className="inline-block mt-1 rounded-full bg-[#18181c] text-neutral-300 text-[10px] px-2.5 py-0.5 border border-white/8">
              {member.role}
            </span>
          </div>
        </div>

        {isOwner ? (
          <button
            type="button"
            onClick={() => onToggleStatus(member)}
            className={`rounded-full text-[10px] font-medium px-2.5 py-0.5 transition-colors border ${
              member.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-[#18181c] text-neutral-500 border-white/5 hover:bg-[#202026]'
            }`}
            title="Click to toggle status"
          >
            {member.status === 'active' ? '● Active' : '○ Inactive'}
          </button>
        ) : (
          <span
            className={`rounded-full text-[10px] font-medium px-2.5 py-0.5 border ${
              member.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-[#18181c] text-neutral-500 border-white/5'
            }`}
          >
            {member.status === 'active' ? '● Active' : '○ Inactive'}
          </span>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 text-xs text-neutral-400 pt-1">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 text-neutral-500" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-neutral-500" />
            <span>{member.phone}</span>
          </div>
        )}
      </div>

      {/* Workload Metric */}
      <div className="p-3.5 rounded-2xl bg-[#18181c] border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Briefcase className="size-3.5 text-neutral-400" />
          <span>Active Leads Allocated</span>
        </div>
        <span className="text-sm font-bold text-white">
          {member.assigned_leads_count ?? 0}
        </span>
      </div>

      {/* Action Footer */}
      <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/5">
        <Link
          href={`/leads`}
          className="text-xs text-neutral-300 hover:text-white font-medium underline underline-offset-2"
        >
          View Leads Pipeline &rarr;
        </Link>

        {isOwner && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onEdit(member)}
              className="rounded-full border border-white/10 text-neutral-300 hover:text-white"
            >
              <Edit2 className="size-3 mr-1" />
              Edit
            </Button>
            {!member.is_owner && onDelete && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onDelete(member)}
                className="rounded-full border border-white/10 text-neutral-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                title="Remove team member"
              >
                <Trash2 className="size-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
