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

  return null;
}
