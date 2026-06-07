/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Church,
  Plus,
  Globe,
  LogOut,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { CatholicMovement, Mission } from './types';
import { MOVEMENT_DATA, getMovementStyle } from './utils/catholicData';

// Component Imports
import OfflineAlert from './components/OfflineAlert';
import SecretariaVirtual from './components/SecretariaVirtual';
import CalendarView from './components/CalendarView';
import BacklogView from './components/BacklogView';
import DayActivityModal from './components/DayActivityModal';
import WarningCarousel from './components/WarningCarousel';
import MissionModal from './components/MissionModal';
import CatholicEventsCalendar from './components/CatholicEventsCalendar';

// Auth Imports
import { googleSignIn, logout, initAuth } from './utils/firebaseAuth';
import { downloadMissions, uploadMission, removeMission } from './utils/firebaseDb';
import { User } from 'firebase/auth';

const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'seed-1',
    title: 'Adoração ao Santíssimo - Jovens EJNS',
    movement: CatholicMovement.EJNS,
    dateStr: '2026-06-08',
    startTime: '19:30',
    endTime: '21:00',
    location: 'Igreja Santa Rita de Cássia',
    description: 'Momento forte de adoração para os Jovens de Nossa Senhora. Trazer folhetos de cantos eucarísticos.',
    status: 'preparing',
    checklist: [],
    instagramUrl: '',
    roles: ['cantar', 'tocar'],
    observation: 'A Irmã Maria sugeriu ensaiar os cantos do Hinário Mariano na sala paroquial 30min antes.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-2',
    title: 'Pregação do Avivamento Carismático',
    movement: CatholicMovement.RCC,
    dateStr: '2026-06-06', // Today (Reference June 6, 2026)
    startTime: '20:00',
    endTime: '21:40',
    location: 'Salão Paroquial São Francisco',
    description: 'Grande grupo de oração da RCC com o tema: "O Espírito sopra onde quer". Teremos pregação especial sobre Pentecostes.',
    status: 'confirmed',
    checklist: [],
    instagramUrl: 'https://instagram.com/p/reino_rcc',
    roles: ['pregar', 'interceder'],
    observation: 'Levar aparelhagem de som e testar os microfones dinâmicos sem fio cedo.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-3',
    title: 'Sopa Solidária e Assistência às Famílias',
    movement: CatholicMovement.VINCENTINOS,
    dateStr: '2026-06-07', // Tomorrow (Reference June 7, 2026)
    startTime: '18:00',
    endTime: '21:00',
    location: 'Comunidade Rural São Vicente',
    description: 'Entrega semanal de mantimentos e sopa para as famílias em situação de vulnerabilidade.',
    status: 'preparing',
    checklist: [],
    instagramUrl: '',
    roles: ['servir'],
    observation: 'Encontrar com os vicentinos no barracão às 16h para picar verduras e organizar as cestas.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-4',
    title: 'Grupo de Oração e Louvor Ressuscitado',
    movement: CatholicMovement.SHALOM,
    dateStr: '2026-06-20',
    startTime: '19:00',
    endTime: '21:10',
    location: 'Centro de Evangelização Shalom',
    description: 'Sábado de Louvor do Ressuscitado que passou pela Cruz. Confraternização pós-grupo.',
    status: 'confirmed',
    checklist: [],
    instagramUrl: 'https://instagram.com/p/shalom_ressuscitado',
    roles: ['cantar', 'servir'],
    observation: 'Reunião de núcleo rápido após as orações.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-5',
    title: 'Missão Jovem em Praça Pública',
    movement: CatholicMovement.CANCAO_NOVA,
    dateStr: '',
    startTime: '',
    endTime: '',
    status: 'backlog',
    checklist: [],
    instagramUrl: '',
    roles: [],
    observation: 'Levar caixas de som pequenas e banners com datas de grupo de oração.',
    location: 'Praça das Nações do Rosário',
    description: 'Levar música, pregação e oração à juventude nas praças centrais.',
    synced: false,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 6)); // Default June 2026
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Mobile and view optimization states
  const [activeTab, setActiveTab] = useState<'calendar' | 'secretary' | 'backlog'>('calendar');
  const [selectedDay, setSelectedDay] = useState<string>('2026-06-06');
  const [currentMainSection, setCurrentMainSection] = useState<'personal' | 'catalog'>('personal');
  
  // Modals Visibility
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editMission, setEditMission] = useState<Mission | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [isSimulatedOffline, setSimulatedOffline] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Logs stream representing virtual secretary historical activity
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Secretaria virtual inicializada.',
    'Modelos de missões gravados no cache de persistência local.'
  ]);

  // Load initial data and bind Auth listeners
  useEffect(() => {
    const localDb = localStorage.getItem('missions_db_maria');
    if (localDb) {
      try {
        setMissions(JSON.parse(localDb));
      } catch (e) {
        setMissions(DEFAULT_MISSIONS);
      }
    } else {
      setMissions(DEFAULT_MISSIONS);
      localStorage.setItem('missions_db_maria', JSON.stringify(DEFAULT_MISSIONS));
    }

    // Initialize Auth listener
    initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        addLog(`Conectado no Google como: ${currentUser.displayName}`);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        const wasConnected = sessionStorage.getItem('_g_connected');
        setNeedsAuth(wasConnected === 'true');
      }
    );

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Sync with Firestore whenever user logs in or is established
  useEffect(() => {
    if (user) {
      addLog('Buscando seus dados salvos em nuvem...');
      downloadMissions(user.uid).then(async (cloudMissions) => {
        if (cloudMissions.length === 0) {
          addLog('Fazendo backup seguro da sua agenda local na nuvem...');
          for (const m of missions) {
            await uploadMission(user.uid, m);
          }
          addLog('Seus dados locais foram salvos em segurança na nuvem!');
        } else {
          setMissions(cloudMissions);
          localStorage.setItem('missions_db_maria', JSON.stringify(cloudMissions));
          addLog(`Sincronizado! Carregadas ${cloudMissions.length} missões seguras de sua conta.`);
        }
      }).catch((err) => {
        console.error('Erro ao sincronizar com Firestore:', err);
        addLog('Erro de conexão ao sincronizar agenda com a nuvem.');
      });
    }
  }, [user]);

  // Save cache with local Storage of the browser
  const saveMissionsState = (updated: Mission[]) => {
    console.log('Saving missions state:', updated);
    setMissions(updated);
    localStorage.setItem('missions_db_maria', JSON.stringify(updated));
  };

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 14)]);
  };

  // Push notifications controller
  const sendAlert = (title: string, body: string) => {
    addLog(`NOTIFICAÇÃO: ${title} - ${body}`);
    if ('Notification' in window && Notification.permission === 'granted' && !isSimulatedOffline) {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleRequestNotifyPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        sendAlert('Lembretes Ativados', 'Você receberá avisos sobre as próximas missões liturgicas no desktop!');
      }
    } else {
      alert('Seu navegador não oferece suporte para notificações push.');
    }
  };

  // Google Calendar Integration - API Call to Create/Update Event
  const pushEventToGoogleCalendar = async (mission: Mission, token: string): Promise<string | null> => {
    if (!mission.dateStr || isSimulatedOffline) return null;

    try {
      const style = getMovementStyle(mission.movement);
      const eventPayload = {
        summary: `⛪ [${style?.name || 'Missão'}] ${mission.title}`,
        location: mission.location || '',
        description: `${mission.description || ''}\n\n---\nMinhas Atividades / Atuação no dia: ${mission.roles?.join(', ') || 'Nenhuma selecionada'}\nObservações adicionais: ${mission.observation || 'Sem observações'}\n\nOrganizado via Agenda Eu Missionário`,
        start: {
          dateTime: `${mission.dateStr}T${mission.startTime || '19:00'}:00`,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: `${mission.dateStr}T${mission.endTime || '20:30'}:00`,
          timeZone: 'America/Sao_Paulo',
        },
      };

      const endpoint = mission.googleEventId 
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${mission.googleEventId}`
        : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      
      const method = mission.googleEventId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventPayload)
      });

      if (!res.ok) {
        throw new Error(`Google API: ${res.statusText}`);
      }

      const data = await res.json();
      return data.id || null;
    } catch (e) {
      console.error('Erro ao empurrar evento ao Google Agenda:', e);
      return null;
    }
  };

  // Google Calendar Sync loop
  const syncPendingMissions = async (): Promise<number> => {
    let token = accessToken;
    if (!token && user) {
      try {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
          setAccessToken(token);
          setUser(result.user);
        }
      } catch (err) {
        throw new Error('Autenticação cancelada ou indisponível.');
      }
    }

    if (!token) {
      alert('Conecte sua conta do Google Agenda clicando no botão de sincronia.');
      return 0;
    }

    addLog('Sincronizando com Google Calendar...');
    const unsyncedMissions = missions.filter((m) => !m.synced && m.dateStr);
    let count = 0;

    const updatedMissions = [...missions];

    for (const unsynced of unsyncedMissions) {
      const gId = await pushEventToGoogleCalendar(unsynced, token);
      if (gId) {
        const idx = updatedMissions.findIndex((item) => item.id === unsynced.id);
        if (idx !== -1) {
          updatedMissions[idx] = {
            ...updatedMissions[idx],
            googleEventId: gId,
            synced: true,
          };
          count++;
        }
      }
    }

    if (count > 0) {
      saveMissionsState(updatedMissions);
      addLog(`Sincronizados ${count} eventos com o Google Agenda.`);
    } else {
      addLog('Nenhum evento pendente para sincronia.');
    }

    return count;
  };

  // Automatically sync when restoring network connection
  useEffect(() => {
    const handleAutoSyncOnline = () => {
      const unsynced = missions.some((m) => !m.synced && m.dateStr);
      if (unsynced && accessToken && !isSimulatedOffline) {
        addLog('Conexão restabelecida! Iniciando sincronia automática...');
        syncPendingMissions();
      }
    };

    window.addEventListener('online', handleAutoSyncOnline);
    return () => window.removeEventListener('online', handleAutoSyncOnline);
  }, [missions, accessToken, isSimulatedOffline]);

  // Auth logins handler
  const handleGoogleLogin = async () => {
    try {
      addLog('Iniciando Google Auth login...');
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        addLog(`Sincronizado: ${result.user.displayName}`);
        
        setTimeout(() => {
          syncPendingMissions();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      addLog('Google auth cancelado ou falhou.');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    addLog('Sessão encerrada.');
  };

  // Initiate Modal with preset date/trigger
  const handleAddMission = (suggested: Partial<Mission>) => {
    setEditMission(null);
    setSelectedDay(suggested.dateStr || '2026-06-06');
    setEditMission({
      id: '',
      title: suggested.title || '',
      movement: suggested.movement || CatholicMovement.PAROQUIAL,
      dateStr: suggested.dateStr || '',
      startTime: suggested.startTime || '19:00',
      endTime: suggested.endTime || '20:30',
      location: suggested.location || '',
      description: suggested.description || '',
      status: suggested.status || (suggested.dateStr ? 'preparing' : 'backlog'),
      checklist: [],
      instagramUrl: suggested.instagramUrl || '',
      roles: suggested.roles || [],
      observation: suggested.observation || '',
      synced: false,
      createdAt: new Date().toISOString()
    });
    setIsFormModalOpen(true);
  };

  const handleEditMissionTrigger = (mission: Mission) => {
    setEditMission(mission);
    setIsFormModalOpen(true);
  };

  // Save changes of a mission (Create or Update)
  const handleSaveMission = async (payload: Partial<Mission>) => {
    setIsFormModalOpen(false);
    
    if (payload.id) {
      // Update
      const updated = missions.map(async (m) => {
        if (m.id === payload.id) {
          const merged: Mission = {
            ...m,
            ...payload,
            synced: false,
          } as Mission;

          if (accessToken && merged.dateStr && !isSimulatedOffline) {
            const gId = await pushEventToGoogleCalendar(merged, accessToken);
            if (gId) {
              merged.googleEventId = gId;
              merged.synced = true;
            }
          }
          addLog(`Ajustadas informações da missão "${merged.title}".`);
          return merged;
        }
        return m;
      });

      Promise.all(updated).then((res) => {
        saveMissionsState(res);
        if (user) {
          const updatedItem = res.find((m) => m.id === payload.id);
          if (updatedItem) {
            uploadMission(user.uid, updatedItem).catch(console.error);
          }
        }
      });

    } else {
      // Creation
      const newMission: Mission = {
        id: 'mission-' + Date.now(),
        title: payload.title || 'Sem título',
        movement: payload.movement || CatholicMovement.PAROQUIAL,
        dateStr: payload.dateStr || '',
        startTime: payload.startTime || '19:00',
        endTime: payload.endTime || '20:30',
        location: payload.location || '',
        description: payload.description || '',
        status: payload.status || (payload.dateStr ? 'preparing' : 'backlog'),
        checklist: [],
        instagramUrl: payload.instagramUrl || '',
        roles: payload.roles || [],
        observation: payload.observation || '',
        synced: false,
        createdAt: new Date().toISOString()
      };

      if (accessToken && newMission.dateStr && !isSimulatedOffline) {
        const gId = await pushEventToGoogleCalendar(newMission, accessToken);
        if (gId) {
          newMission.googleEventId = gId;
          newMission.synced = true;
        }
      }

      saveMissionsState([newMission, ...missions]);
      if (user) {
        uploadMission(user.uid, newMission).catch(console.error);
      }
      addLog(`Cadastrada nova missão: "${newMission.title}".`);
      sendAlert('Missão Agendada ⛪', `"${newMission.title}" foi salva nos registros paroquiais.`);
    }

    setEditMission(null);
  };

  // Deletion logic
  const handleDeleteMission = (id: string) => {
    console.log('Attempting to delete mission:', id);
    const target = missions.find((m) => m.id === id);
    console.log('Target mission found:', target);
    if (!target) {
      console.log('Mission not found, aborting.');
      return;
    }
    setMissionToDelete(target);
  };

  const executeDeleteMission = (id: string) => {
    console.log('Executing delete for mission:', id);
    const target = missions.find((m) => m.id === id);
    if (!target) return;

    const runAsyncDelete = async () => {
      if (accessToken && target.googleEventId && !isSimulatedOffline) {
        try {
          addLog('Excluindo evento sincronizado no Google Agenda...');
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${target.googleEventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          addLog('Exclusão sincronizada com o Google Calendar.');
        } catch (error) {
          console.error(error);
        }
      }
    };

    runAsyncDelete();

    const nextList = missions.filter((m) => m.id !== id);
    console.log('New list of missions:', nextList);
    saveMissionsState(nextList);
    if (user) {
      removeMission(user.uid, id).catch(console.error);
    }
    addLog(`Missão "${target.title}" arquivada com sucesso.`);
    setMissionToDelete(null);
  };

  // Silent removal for quick toggling calendar state in Catalog
  const handleRemoveCatalogFromPersonal = (id: string) => {
    console.log('handleRemoveCatalogFromPersonal called for id:', id);
    const target = missions.find((m) => m.id === id);
    console.log('Target mission found:', target);
    if (!target) {
      console.log('Mission not found, aborting.');
      return;
    }
    const nextList = missions.filter((m) => m.id !== id);
    console.log('New list of missions:', nextList);
    saveMissionsState(nextList);
    if (user) {
      removeMission(user.uid, id).catch(console.error);
    }
    addLog(`Destaque de presença removido: "${target.title}"`);
  };

  // Add Backlog Item
  const handleAddBacklog = (title: string, movement: CatholicMovement) => {
    const newB: Mission = {
      id: 'backlog-' + Date.now(),
      title: title,
      movement: movement,
      dateStr: '',
      startTime: '',
      endTime: '',
      location: '',
      description: 'Idéia para evangelização pendente de agendamento.',
      status: 'backlog',
      checklist: [],
      instagramUrl: '',
      roles: [],
      observation: '',
      synced: false,
      createdAt: new Date().toISOString()
    };
    saveMissionsState([newB, ...missions]);
    if (user) {
      uploadMission(user.uid, newB).catch(console.error);
    }
    addLog(`Ideia cadastrada: "${title}" na gaveta pastoral.`);
  };

  // Convert Backlog item to scheduled date
  const handleScheduleBacklog = (backlog: Mission) => {
    setEditMission(backlog);
    setIsFormModalOpen(true);
  };

  const pendingCount = missions.filter((m) => !m.synced && m.dateStr).length;

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-slate-800 flex flex-col font-sans selection:bg-purple-200">
      
      {/* Thinner Synchronization Banner */}
      <OfflineAlert
        isSimulatedOffline={isSimulatedOffline}
        setSimulatedOffline={setSimulatedOffline}
        syncPendingMissions={syncPendingMissions}
        pendingCount={pendingCount}
      />

      {/* Styled Top Workspace Header bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 py-3.5 px-6 shadow-xs sticky top-0 md:relative z-45">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-purple-100 flex items-center justify-center shadow-md shadow-purple-900/10 border border-purple-800 select-none">
              <Church className="w-5.5 h-5.5 fill-white/10" />
            </div>
            <div>
              <h1 id="app-title-header" className="text-lg font-black tracking-tighter text-slate-900 flex items-center gap-1.5 uppercase">
                Eu Missionário
              </h1>
              <p className="text-xs text-purple-700 font-extrabold tracking-tight uppercase">Agenda LeBron</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* Quick scheduling button */}
            <button
              onClick={() => handleAddMission({ dateStr: '2026-06-06' })}
              className="bg-purple-700 hover:bg-purple-600 text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition hover:scale-102 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Missão
            </button>

            {/* Google Sync and Login button widgets */}
            {user ? (
              <div className="flex items-center bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-1.5 pr-3 text-xs gap-2 transition max-w-sm">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-6.5 h-6.5 rounded-full object-cover" />
                ) : (
                  <div className="w-6.5 h-6.5 bg-purple-100 text-purple-800 font-bold rounded-full flex items-center justify-center">
                    {user.displayName?.[0]}
                  </div>
                )}
                <div className="truncate shrink max-w-[120px]">
                  <p className="font-extrabold text-purple-900 leading-none truncate">{user.displayName}</p>
                  <span className="text-[9px] text-purple-400 font-bold">agenda synced</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 hover:bg-purple-200 text-purple-400 hover:text-red-600 rounded transition shrink-0 ml-1"
                  title="Desconectar conta Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="text-xs py-1.5 px-3 border border-purple-250 hover:bg-purple-50 cursor-pointer flex items-center gap-2 rounded-xl bg-white text-purple-800 font-bold"
                id="google-calendar-signin-btn"
              >
                <Globe className="w-4 h-4 text-purple-400 mr-0.5" />
                Sincronizar com Google Agenda
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Premium Main Section Switcher */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 mt-4">
        <div className="flex bg-purple-100/50 p-1.5 rounded-2xl border border-purple-200/50 shadow-2xs max-w-sm sm:max-w-md">
          <button
            onClick={() => setCurrentMainSection('personal')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMainSection === 'personal'
                ? 'bg-purple-750 text-white shadow-md font-black'
                : 'text-purple-600 hover:text-purple-950 font-bold'
            }`}
          >
            <Church className="w-4 h-4" /> Agenda Pessoal
          </button>
          
          <button
            onClick={() => setCurrentMainSection('catalog')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMainSection === 'catalog'
                ? 'bg-[#5B1E31] text-white shadow-md font-black'
                : 'text-rose-800 hover:text-rose-950 font-bold'
            }`}
          >
            <Globe className="w-4 h-4" /> Eventos Católicos
          </button>
        </div>
      </div>

      {currentMainSection === 'personal' ? (
        <>
          {/* Styled Event Carrossel Warn Banner */}
          <div className="max-w-7xl w-full mx-auto px-4 md:px-6 mt-4">
            <WarningCarousel
              missions={missions}
              currentSimulatedDate={currentDate}
              onSelectMission={(m) => {
                setSelectedDay(m.dateStr);
                setIsDayModalOpen(true);
                addLog(`Ficha selecionada via carrossel: ${m.title}`);
              }}
            />
          </div>

          {/* Primary Workspace Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Mobile quick tabs swiper */}
            <div className="lg:hidden col-span-1 grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-purple-100 shadow-xs mb-2">
              {(['calendar', 'secretary', 'backlog'] as const).map((tab) => {
                let activeColor = 'bg-purple-750 text-white shadow-xs font-black';
                if (tab === 'calendar') activeColor = 'bg-gradient-to-r from-indigo-700 to-indigo-650 text-white shadow-md font-black';
                if (tab === 'secretary') activeColor = 'bg-gradient-to-r from-fuchsia-700 to-fuchsia-650 text-white shadow-md font-black';
                if (tab === 'backlog') activeColor = 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md font-black';

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 text-[11px] font-black uppercase rounded-xl transition cursor-pointer ${
                      activeTab === tab
                        ? activeColor
                        : 'text-purple-500 hover:text-purple-800'
                    }`}
                  >
                    {tab === 'calendar' ? '📅 Agenda' : tab === 'secretary' ? '⛪ Secretária' : '💡 Ideias'}
                  </button>
                );
              })}
            </div>

            {/* Sidebar/Collapsible Panel: Conversations with virtual sister (Irmã Maria) */}
            <div className={`col-span-1 lg:col-span-3 h-[570px] flex flex-col ${activeTab !== 'secretary' ? 'hidden lg:flex' : ''}`}>
              <div className="flex-1">
                <SecretariaVirtual onAddMission={(suggested) => {
                  handleAddMission(suggested);
                  addLog(`Suporte de dotação pela secretária.`);
                }} />
              </div>

              {/* Operation registers card */}
              <div className="mt-4 bg-white rounded-2xl border border-purple-100 p-4 shrink-0 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-50">
                  <Bell className="w-4 h-4 text-purple-400 animate-bounce" />
                  <h4 className="text-[9px] uppercase font-black tracking-widest text-purple-500">Histórico de Atividades</h4>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[9px] text-purple-400">
                  {systemLogs.map((log, idx) => (
                    <p key={idx} className="truncate select-text">
                      {log}
                    </p>
                  ))}
                </div>
                
                <button
                  onClick={handleRequestNotifyPermission}
                  className="w-full mt-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg py-1 px-2 text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-700" /> Ativar Notificações Push
                </button>
              </div>
            </div>

            {/* Calendar View central cell */}
            <div className={`col-span-1 lg:col-span-6 space-y-6 ${activeTab !== 'calendar' ? 'hidden lg:block' : ''}`}>
              <CalendarView
                missions={missions}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                onSelectDay={(day) => {
                  setSelectedDay(day);
                  setIsDayModalOpen(true);
                  addLog(`Dia selecionado na agenda: ${day}`);
                }}
                onSelectMission={(m) => {
                  setSelectedDay(m.dateStr);
                  setIsDayModalOpen(true);
                  addLog(`Missão expandida: ${m.title}`);
                }}
              />
            </div>

            {/* Backlog View cell (ideas box) */}
            <div className={`col-span-1 lg:col-span-3 h-full ${activeTab !== 'backlog' ? 'hidden lg:block' : ''}`}>
              <BacklogView
                missions={missions}
                onAddBacklog={handleAddBacklog}
                onSchedule={handleScheduleBacklog}
                onDelete={handleDeleteMission}
              />
            </div>
          </main>
        </>
      ) : (
        <div className="max-w-7xl w-full mx-auto p-4 md:p-6">
          <CatholicEventsCalendar
            personalMissions={missions}
            onAddMission={handleSaveMission}
            onRemoveMission={handleRemoveCatalogFromPersonal}
            addLog={addLog}
            currentUser={user}
          />
        </div>
      )}

      {/* Pop-up Interactive DayActivityModal (Lateral carousel, acting checklists, optional forms) */}
      <DayActivityModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        selectedDay={selectedDay}
        missions={missions}
        onSaveMission={handleSaveMission}
        onDeleteMission={handleDeleteMission}
      />

      {/* Creation and General Edit Event Dialog */}
      <MissionModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveMission}
        initialDate={selectedDay}
        editMission={editMission}
      />

      {/* Custom Deletion Confirmation Dialog */}
      {missionToDelete && (
        <div className="fixed inset-0 bg-purple-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-55" id="delete-confirmation-dialog">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-50 text-red-650 shrink-0 border border-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 select-text">
                <h3 className="font-extrabold text-xs text-red-950 uppercase tracking-wider">Confirmar Exclusão</h3>
                <p className="text-xs text-slate-650 leading-relaxed">
                  Tem certeza de que deseja arquivar ou excluir a missão <strong className="text-slate-900">"{missionToDelete.title}"</strong>?<br />
                  Esta ação removerá permanentemente os registros do cache e da nuvem.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMissionToDelete(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-600 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDeleteMission(missionToDelete.id);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Footer */}
      <footer className="bg-purple-950 border-t border-purple-900 mt-12 py-6 px-6 text-center text-purple-200 text-xs text-purple-300">
        <div className="max-w-7xl mx-auto space-y-1 font-medium select-text">
          <p>«Ide por todo o mundo e pregai o Evangelho a toda criatura.» &mdash; Mc 16,15</p>
          <p className="text-purple-400 text-[10px] font-mono">
            Eu Missionário &mdash; Agenda e Secretaria do lebron. Licença em Code Studio. No Cookies Tracking.
          </p>
        </div>
      </footer>

    </div>
  );
}
