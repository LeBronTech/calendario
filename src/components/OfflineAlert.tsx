/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Layers, Database, AlertTriangle } from 'lucide-react';
import { isFirestoreQuotaExceeded } from '../utils/firebaseDb';

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
  const [quotaExceeded, setQuotaExceeded] = useState(isFirestoreQuotaExceeded());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleQuotaChange = () => {
      setQuotaExceeded(isFirestoreQuotaExceeded());
    };
    window.addEventListener('firestoreQuotaStateChanged', handleQuotaChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('firestoreQuotaStateChanged', handleQuotaChange);
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Informative Tooltip on Quota Exceeded */}
      {quotaExceeded && showTooltip && (
        <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl max-w-xs mb-1 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="font-semibold mb-1 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Cota Diária de Nuvem Excedida
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            O limite diário gratuito da nuvem foi temporariamente atingido. Suas edições e eventos estão sendo <strong>salvos localmente com segurança</strong> e ainda serão integrados ao seu Google Agenda!
          </p>
        </div>
      )}

      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(prev => !prev)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
          quotaExceeded 
            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
            : currentOnlineStatus 
              ? 'bg-green-100 text-green-800' 
              : 'bg-amber-100 text-amber-800'
        }`}
      >
        {quotaExceeded ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
        ) : currentOnlineStatus ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <span className="text-xs font-semibold">
          {quotaExceeded 
            ? 'Modo Local Ativo' 
            : currentOnlineStatus 
              ? 'Online' 
              : 'Offline'
          }
        </span>
        
        {!currentOnlineStatus && !quotaExceeded && pendingCount > 0 && (
          <span className="text-[10px] ml-1">({pendingCount} pendentes)</span>
        )}
        
        {currentOnlineStatus && !quotaExceeded && pendingCount > 0 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleSyncClick();
            }} 
            className="ml-2 hover:text-green-900" 
            disabled={syncing}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
