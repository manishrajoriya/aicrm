'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeamMember, LeadStatus } from '@/types/crm';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Layers,
  User,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type DateJoinedFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH';
export type NextMeetingFilterType = 'ALL' | 'HAS_UPCOMING' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'NONE' | 'OVERDUE';
export type SortByType = 'CREATED_DESC' | 'CREATED_ASC' | 'MEETING_ASC' | 'VALUE_DESC';

export interface LeadFiltersState {
  search: string;
  status: string;
  dateJoined: DateJoinedFilterType;
  nextMeeting: NextMeetingFilterType;
  assignee: string;
  sortBy: SortByType;
}

interface LeadFiltersProps {
  filters: LeadFiltersState;
  onFilterChange: (filters: LeadFiltersState) => void;
  teamMembers: TeamMember[];
  totalCount: number;
  filteredCount: number;
}

export function LeadFilters({
  filters,
  onFilterChange,
  teamMembers,
  totalCount,
  filteredCount,
}: LeadFiltersProps) {
  const isFiltered =
    Boolean(filters.search) ||
    filters.status !== 'ALL' ||
    filters.dateJoined !== 'ALL' ||
    filters.nextMeeting !== 'ALL' ||
    filters.assignee !== 'ALL' ||
    filters.sortBy !== 'CREATED_DESC';

  const handleReset = () => {
    onFilterChange({
      search: '',
      status: 'ALL',
      dateJoined: 'ALL',
      nextMeeting: 'ALL',
      assignee: 'ALL',
      sortBy: 'CREATED_DESC',
    });
  };

  return (
    <div className="bg-[#121215] border border-white/8 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
      {/* Top row: Search input + Results Count + Reset */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search school name, contact, phone, city..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="bg-[#18181c] border-white/8 rounded-full pl-9 pr-4 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
          />
          <Search className="absolute left-3.5 top-3 size-4 text-neutral-500 pointer-events-none" />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <div className="text-xs text-neutral-400">
            Showing <strong className="text-white">{filteredCount}</strong> of {totalCount} inquiries
          </div>

          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border-white/10 text-xs h-8 px-3 gap-1"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {/* 1. Date Joined Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Calendar className="size-3 text-indigo-400" /> Joined Date
          </label>
          <select
            value={filters.dateJoined}
            onChange={(e) => onFilterChange({ ...filters, dateJoined: e.target.value as DateJoinedFilterType })}
            className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-2.5 text-xs font-medium text-neutral-200 outline-none cursor-pointer hover:border-white/15 transition-colors"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Joined Today</option>
            <option value="YESTERDAY">Joined Yesterday</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="THIS_MONTH">This Month (30d)</option>
          </select>
        </div>

        {/* 2. Pipeline Stage Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Layers className="size-3 text-emerald-400" /> Pipeline Stage
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-2.5 text-xs font-medium text-neutral-200 outline-none cursor-pointer hover:border-white/15 transition-colors"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Progress">In Progress</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Won">Won / Signed</option>
            <option value="Lost">Lost / Closed</option>
          </select>
        </div>

        {/* 3. Next Scheduled Call / Meeting Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Clock className="size-3 text-amber-400" /> Next Call / Meeting
          </label>
          <select
            value={filters.nextMeeting}
            onChange={(e) => onFilterChange({ ...filters, nextMeeting: e.target.value as NextMeetingFilterType })}
            className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-2.5 text-xs font-medium text-neutral-200 outline-none cursor-pointer hover:border-white/15 transition-colors"
          >
            <option value="ALL">All Schedules</option>
            <option value="TODAY">Call Today</option>
            <option value="TOMORROW">Call Tomorrow</option>
            <option value="THIS_WEEK">Call This Week</option>
            <option value="HAS_UPCOMING">Any Scheduled Call</option>
            <option value="NONE">No Call Scheduled</option>
            <option value="OVERDUE">Overdue Call</option>
          </select>
        </div>

        {/* 4. Assignee Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <User className="size-3 text-purple-400" /> Assigned Rep
          </label>
          <select
            value={filters.assignee}
            onChange={(e) => onFilterChange({ ...filters, assignee: e.target.value })}
            className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-2.5 text-xs font-medium text-neutral-200 outline-none cursor-pointer hover:border-white/15 transition-colors"
          >
            <option value="ALL">All Team Members</option>
            <option value="UNASSIGNED">Unassigned Only</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Sort By */}
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <ArrowUpDown className="size-3 text-sky-400" /> Sort Order
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as SortByType })}
            className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-2.5 text-xs font-medium text-neutral-200 outline-none cursor-pointer hover:border-white/15 transition-colors"
          >
            <option value="CREATED_DESC">Joined: Newest First</option>
            <option value="CREATED_ASC">Joined: Oldest First</option>
            <option value="MEETING_ASC">Next Call: Earliest</option>
            <option value="VALUE_DESC">Value: Highest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
