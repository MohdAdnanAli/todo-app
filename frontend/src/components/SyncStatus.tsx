import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { offlineStorage, addSyncListener } from '../services/offlineStorage';
import type { SyncStatus as SyncStatusType } from '../services/offlineStorage';
import type { MessageType } from '../types';

interface SyncStatusProps {
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = React.useState<SyncStatusType | null>(null);

  React.useEffect(() => {
    // Initial status
    offlineStorage.getSyncStatus().then(setStatus);
    
    // Subscribe to updates
    const cleanup = addSyncListener(setStatus);
    return cleanup;
  }, []);

  if (!status) return null;

  const getIcon = () => {
    if (!status.isOnline) return <WifiOff className="w-4 h-4 text-red-400" />;
    if (status.syncInProgress) return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    if (status.pendingCount > 0) return <Clock className="w-4 h-4 text-yellow-400" />;
    if (status.lastError) return <AlertCircle className="w-4 h-4 text-orange-400" />;
    return <Wifi className="w-4 h-4 text-green-400" />;
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-secondary)] ${className}`}>
      {getIcon()}
      <span className="truncate">
        {status.syncInProgress && 'Syncing...'}
        {!status.isOnline && 'Offline'}
        {status.pendingCount > 0 && `${status.pendingCount} pending`}
        {status.lastError && status.lastError.substring(0, 25) + '...'}
        {status.lastSyncAt && !status.syncInProgress && status.pendingCount === 0 && !status.lastError && 'Synced'}
      </span>
    </div>
  );
};

