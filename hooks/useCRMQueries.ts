import { useQuery, useQueryClient } from '@tanstack/react-query';
import { crmService } from '@/services/crmService';
import { Lead, TeamMember, ScheduledMeetingItem, CRMStats } from '@/types/crm';

export const CRM_QUERY_KEYS = {
  leads: (ownerId?: string) => ['crm', 'leads', ownerId || 'all'] as const,
  teamMembers: (ownerId?: string) => ['crm', 'team_members', ownerId || 'all'] as const,
  upcomingMeetings: (ownerId?: string) => ['crm', 'upcoming_meetings', ownerId || 'all'] as const,
  stats: (ownerId?: string) => ['crm', 'stats', ownerId || 'all'] as const,
};

/**
 * Hook to fetch and cache all leads for the workspace.
 * Prevents redundant fetches when navigating between pages.
 */
export function useLeads(ownerId?: string) {
  return useQuery<Lead[]>({
    queryKey: CRM_QUERY_KEYS.leads(ownerId),
    queryFn: () => crmService.getLeads(ownerId),
    staleTime: 2 * 60 * 1000, // Data stays fresh for 2 minutes
  });
}

/**
 * Hook to fetch and cache team members.
 */
export function useTeamMembers(ownerId?: string) {
  return useQuery<TeamMember[]>({
    queryKey: CRM_QUERY_KEYS.teamMembers(ownerId),
    queryFn: () => crmService.getTeamMembers(ownerId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch upcoming meetings with optional polling interval (e.g. for reminder banner).
 */
export function useUpcomingMeetings(
  ownerId?: string,
  options?: { refetchInterval?: number }
) {
  return useQuery<ScheduledMeetingItem[]>({
    queryKey: CRM_QUERY_KEYS.upcomingMeetings(ownerId),
    queryFn: () => crmService.getUpcomingMeetings(ownerId),
    staleTime: 30 * 1000, // 30 seconds fresh
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Hook to fetch or derive CRM dashboard stats.
 */
export function useCRMStats(ownerId?: string, cachedLeads?: Lead[]) {
  return useQuery<CRMStats>({
    queryKey: CRM_QUERY_KEYS.stats(ownerId),
    queryFn: () => crmService.getCRMStats(ownerId, cachedLeads),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Invalidation helper to refresh cache when mutations occur.
 */
export function useInvalidateCRM() {
  const queryClient = useQueryClient();

  return {
    invalidateLeads: async (ownerId?: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] }),
        queryClient.invalidateQueries({ queryKey: ['crm', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['crm', 'upcoming_meetings'] }),
      ]);
    },
    invalidateTeamMembers: async () => {
      await queryClient.invalidateQueries({ queryKey: ['crm', 'team_members'] });
    },
    invalidateMeetings: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['crm', 'upcoming_meetings'] }),
        queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] }),
      ]);
    },
    invalidateAll: async () => {
      await queryClient.invalidateQueries({ queryKey: ['crm'] });
    },
  };
}
