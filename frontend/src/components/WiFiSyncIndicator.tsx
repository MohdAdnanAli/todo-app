import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface SyncStatus {
  isOnline?: boolean;
  syncInProgress?: boolean;
  pendingCount?: number;
  lastError?: string | null;
  lastSyncAt?: string;
}

interface WiFiSyncIndicatorProps {
  syncStatus?: SyncStatus | null;
  className?: string;
}

const WiFiSyncIndicator: React.FC<WiFiSyncIndicatorProps> = ({
  syncStatus,
  className = 'w-3 h-3 flex-shrink-0'
}) => {
  let icon: React.ReactNode;
  let animation = '';
  let color = '';
  let tooltipText = 'Sync status';

  const isOnline = syncStatus?.isOnline ?? true;
  const syncing = syncStatus?.syncInProgress ?? false;
  const pending = (syncStatus?.pendingCount ?? 0) > 0;
  const hasError = !!(syncStatus?.lastError || !isOnline);

  if (!syncStatus) {
    // Idle/unknown
    icon = <Wifi className={`${className} opacity-40`} strokeWidth={1.5} />;
    color = 'text-gray-400';
    tooltipText = 'Initializing...';
  } else if (syncing) {
    // Syncing: fast pulse, yellow-green
    icon = <Wifi className={`${className} animate-pulse`} strokeWidth={2} />;
    animation = 'animate-pulse [animation-duration:0.8s]';
    color = 'text-amber-400';
    tooltipText = 'Syncing...';
  } else if (pending) {
    // Pending: slow pulse, yellow
    icon = (
      <div className="relative">
        <Wifi className={`${className} animate-ping [animation-duration:2s]`} strokeWidth={1.8} />
        <Wifi className={`${className} opacity-60`} strokeWidth={1.8} />
      </div>
    );
    color = 'text-yellow-400';
    tooltipText = `${syncStatus.pendingCount} pending...`;
  } else if (hasError) {
    // Error/offline: shake, red with X
    icon = (
      <>
        <WifiOff className={`${className} animate-shake [animation-duration:1.5s] stroke-red-500`} strokeWidth={2.5} size={20} />
        <AlertTriangle className="absolute -top-0.5 -right-0.5 w-3 h-3 text-red-400 fill-red-500/20" />
      </>
    );
    animation = 'animate-shake';
    color = 'text-red-400';
    tooltipText = syncStatus?.lastError ? 'Sync error' : 'Offline';
  } else {
    // Success/online: static glow, green
    icon = <Wifi className={`${className} drop-shadow-[0_0_8px_theme(colors.emerald.400/0.6)]`} strokeWidth={2.2} />;
    color = 'text-emerald-400';
    tooltipText = `Synced ${syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'now'}`;
  }

  const handleClick = () => {
    // Gesture: click to retry if error/offline (noop if no offlineStorage.retrySync)
    console.log('WiFi click - retry sync (if available)');
  };

  return (
    <div
      className={`cursor-default ${animation} ${color} ${className}`}
      title={tooltipText}
      onClick={handleClick}
      aria-label={tooltipText}
    >
      {icon}
    </div>
  );
};

export default WiFiSyncIndicator;

