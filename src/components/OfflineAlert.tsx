/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Layers } from 'lucide-react';

interface OfflineAlertProps {
  isSimulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  syncPendingMissions: () => Promise<number>;
  pendingCount: number;
}

export default function OfflineAlert({
  isSimulatedOffline,
  setSimulatedOffline,
  syncPendingMissions,
  pendingCount,
}: OfflineAlertProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncClick = async () => {
    setSyncing(true);
    try {
      const count = await syncPendingMissions();
      if (count > 0) {
        alert(`${count} missões foram sincronizadas com sucesso com o Google Agenda!`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar. Verifique sua conexão com a conta Google.');
    } finally {
      setSyncing(false);
    }
  };

  const currentOnlineStatus = isOnline && !isSimulatedOffline;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${currentOnlineStatus ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
      {currentOnlineStatus ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span className="text-xs font-semibold">
        {currentOnlineStatus ? 'Online' : 'Offline'}
      </span>
      {!currentOnlineStatus && pendingCount > 0 && (
        <span className="text-[10px] ml-1">({pendingCount} pendentes)</span>
      )}
      {currentOnlineStatus && pendingCount > 0 && (
        <button onClick={handleSyncClick} className="ml-2 hover:text-green-900" disabled={syncing}>
           <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
