// Helper date formatting utilities for CRM Leads and Scheduled Meetings

export function formatJoinedDate(isoString?: string | null): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Joined Today';
  if (diffDays === 1) return 'Joined Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;

  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatMeetingTime(isoString?: string | null): {
  badgeText: string;
  isToday: boolean;
  isTomorrow: boolean;
  isOverdue: boolean;
} {
  if (!isoString) {
    return { badgeText: 'No Call', isToday: false, isTomorrow: false, isOverdue: false };
  }

  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return { badgeText: 'No Call', isToday: false, isTomorrow: false, isOverdue: false };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = d.getTime() < now.getTime();

  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (diffDays === 0) {
    return {
      badgeText: `Today ${timeStr}`,
      isToday: true,
      isTomorrow: false,
      isOverdue,
    };
  }

  if (diffDays === 1) {
    return {
      badgeText: `Tomorrow ${timeStr}`,
      isToday: false,
      isTomorrow: true,
      isOverdue: false,
    };
  }

  if (diffDays === -1) {
    return {
      badgeText: `Yesterday ${timeStr}`,
      isToday: false,
      isTomorrow: false,
      isOverdue: true,
    };
  }

  const dateStr = d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });

  return {
    badgeText: `${dateStr} ${timeStr}`,
    isToday: false,
    isTomorrow: false,
    isOverdue,
  };
}
