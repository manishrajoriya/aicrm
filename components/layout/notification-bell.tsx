'use client';

import { useState } from 'react';
import { Bell, BellRing, BellOff, Check, AlertCircle } from 'lucide-react';
import { usePushNotification } from '@/hooks/usePushNotification';

export function NotificationBell() {
  const { isConfigured, isSupported, permission, isSubscribed, loading, requestPermission } =
    usePushNotification();
  const [showTooltip, setShowTooltip] = useState(false);
  const [requesting, setRequesting] = useState(false);

  if (!isSupported) return null;

  const isEnabled = permission === 'granted';

  const handleToggle = async () => {
    if (isEnabled) {
      // Already granted
      return;
    }
    try {
      setRequesting(true);
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative p-2 rounded-xl transition-all border ${
          isEnabled
            ? 'bg-[#18181c] border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-[#1f1f25]'
            : 'bg-[#18181c] border-amber-500/20 text-amber-400 hover:border-amber-500/40 hover:bg-[#1f1f25]'
        }`}
        title="Meeting Push Notifications"
      >
        {isEnabled ? (
          <BellRing className="size-4 animate-pulse text-emerald-400" />
        ) : (
          <Bell className="size-4 text-amber-400" />
        )}

        {/* Pulse Status Dot */}
        <span
          className={`absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-[#09090b] ${
            isEnabled ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
        />
      </button>

      {/* Popover / Status Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#18181c] border border-white/10 rounded-2xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 pointer-events-auto">
          <div className="flex items-center gap-2 font-semibold text-white mb-1">
            {isEnabled ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Meeting Alerts Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="size-3.5 text-amber-400" />
                <span>Meeting Alerts Off</span>
              </>
            )}
          </div>

          <p className="text-zinc-400 text-[11px] leading-relaxed mb-2.5">
            {isEnabled
              ? 'You will receive push reminders 10 minutes before scheduled meetings.'
              : 'Enable browser push notifications to get alerted before scheduled calls and demos.'}
          </p>

          {!isEnabled && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={requesting}
              className="w-full py-1.5 px-3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-[11px] transition-colors"
            >
              {requesting ? 'Requesting...' : 'Turn On Notifications'}
            </button>
          )}

          {!isConfigured && (
            <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-zinc-500 flex items-center gap-1">
              <span>💡 Add OneSignal App ID to .env.local for background mobile push</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
