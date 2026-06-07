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
    <div className="bg-purple-950 border-b border-purple-900 py-1.5 px-4 sticky top-0 z-50 shadow-sm text-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          {currentOnlineStatus ? (
            <span className="flex items-center gap-1 text-fuchsia-300 font-bold bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              <span>Internet Conectada</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-purple-200 font-bold bg-purple-900/30 px-2 py-0.5 rounded border border-purple-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Modo Offline</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-end">
          {pendingCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={syncing || !currentOnlineStatus}
              id="sync-pending-btn"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold shadow transition-all ${
                currentOnlineStatus
                  ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white cursor-pointer'
                  : 'bg-purple-900 text-purple-400 cursor-not-allowed border border-purple-800'
               }`}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar {pendingCount} Pendentes
            </button>
          )}

          {/* Pill Toggle Switch Button */}
          <div className="flex items-center gap-2 bg-purple-900/50 px-2.5 py-1 rounded-full border border-purple-800">
            <button
              type="button"
              onClick={() => setSimulatedOffline(!isSimulatedOffline)}
              id="toggle-offline-simulation"
              className={`relative inline-flex h-4 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
                !isSimulatedOffline ? 'bg-fuchsia-500' : 'bg-purple-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  !isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-wider ${!isSimulatedOffline ? 'text-fuchsia-300' : 'text-purple-300'}`}>
              {!isSimulatedOffline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
