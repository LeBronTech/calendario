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
  AlertTriangle,
  Award,
  Layers,
  RefreshCw,
  Upload
} from 'lucide-react';
import { CatholicMovement, Mission } from './types';
import { MOVEMENT_DATA, getMovementStyle } from './utils/catholicData';

// Component Imports
import OfflineAlert from './components/OfflineAlert';
import CalendarView from './components/CalendarView';
import DayActivityModal from './components/DayActivityModal';
import WarningCarousel from './components/WarningCarousel';
import MissionModal from './components/MissionModal';
import CatholicEventsCalendar from './components/CatholicEventsCalendar';
import RetrospectivaView from './components/RetrospectivaView';

// Auth Imports
import { googleSignIn, logout, initAuth } from './utils/firebaseAuth';
import { downloadMissions, uploadMission, removeMission, subscribeToMissions, recoverLostMissions, uploadSettings, subscribeToSettings } from './utils/firebaseDb';
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

const SEGUE_ME_EVENTS_TO_ADD: Mission[] = [
  {
    id: 'segue-me-pre-ensaio-2026',
    title: 'Pré-Ensaio - Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-06-21',
    startTime: '14:00',
    endTime: '18:00',
    location: 'Salão Paroquial',
    description: 'Pré-ensaio preparativo para as equipes de música, teatro e liturgia do Segue-me.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Garantir que as apostilas de cantos e roteiros estejam prontas.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-hora-santa-2026',
    title: 'Hora Santa - Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-07-11',
    startTime: '19:30',
    endTime: '21:00',
    location: 'Capela do Santíssimo / Igreja Matriz',
    description: 'Momento espiritual de adoração e intercessão pelo Encontro VII Segue-me.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Convidar as equipes e o diretor espiritual do movimento.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-galinhada-2026',
    title: 'Galinhada do Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-07-12',
    startTime: '11:30',
    endTime: '14:30',
    location: 'Salão Paroquial',
    description: 'Almoço beneficente - Galinhada do Segue-me para arrecadação de fundos.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Venda de ingressos antecipados nas missas anteriores.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-ensaio-geral-2026',
    title: 'Ensaio Geral - Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-07-19',
    startTime: '13:30',
    endTime: '17:30',
    location: 'Igreja Matriz / Salão',
    description: 'Ensaio geral com todas as equipes de apoio, liturgia, teatro e canto.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Organizar crachás e revisar o cronograma.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-gincana-2026',
    title: 'Gincana - Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-02',
    startTime: '08:30',
    endTime: '12:30',
    location: 'Quadra da Paróquia / Área externa',
    description: 'Gincana de integração dos jovens e equipes de trabalho do Segue-me.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Levar água e lanches para partilha.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-tarde-formacao-2026',
    title: 'Tarde de Formação - Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-08',
    startTime: '14:00',
    endTime: '18:00',
    location: 'Auditório Paroquial',
    description: 'Tarde de formação espiritual, técnica e doutrinária para todos os seguidores e tios.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Levar caderno e caneta para anotações.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-encontro-d1-2026',
    title: 'Encontro VII Segue-me - Dia 1',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-14',
    startTime: '18:00',
    endTime: '22:00',
    location: 'Centro de Formação / Paróquia',
    description: 'Início oficial do Encontro VII Segue-me - Acolhida e primeira parte das palestras.',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Check-in dos encontristas na entrada principal.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-encontro-d2-2026',
    title: 'Encontro VII Segue-me - Dia 2',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-15',
    startTime: '07:30',
    endTime: '22:00',
    location: 'Centro de Formação / Paróquia',
    description: 'Segundo dia do VII Segue-me - Atividades reflexivas, pregações, confissões e vigília.',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Alimentação organizada pelas equipes de cozinha.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-encontro-d3-2026',
    title: 'Encontro VII Segue-me - Dia 3',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-16',
    startTime: '07:30',
    endTime: '19:00',
    location: 'Centro de Formação / Paróquia',
    description: 'Último dia do VII Segue-me - Encerramento das atividades e missa festiva de entrega.',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Preparação do salão para recepção dos pais à noite.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-avaliacao-2026',
    title: 'Avaliação VII Segue-me',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-19',
    startTime: '19:30',
    endTime: '21:30',
    location: 'Salão Paroquial',
    description: 'Reunião de avaliação geral sobre a organização do VII Segue-me.',
    status: 'preparing',
    checklist: [],
    roles: [],
    observation: 'Cada coordenador de equipe deve trazer seus pontos fortes e fracos anotados.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-06-2026',
    title: 'Missa do Segue-me (Junho)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-06-28',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-07-2026',
    title: 'Missa do Segue-me (Julho)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-07-26',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-08-2026',
    title: 'Missa do Segue-me (Agosto)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-08-30',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-09-2026',
    title: 'Missa do Segue-me (Setembro)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-09-27',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-10-2026',
    title: 'Missa do Segue-me (Outubro)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-10-25',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-11-2026',
    title: 'Missa do Segue-me (Novembro)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-11-29',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'segue-me-missa-12-2026',
    title: 'Missa do Segue-me (Dezembro)',
    movement: CatholicMovement.SEGUE_ME,
    dateStr: '2026-12-27',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Igreja Matriz',
    description: 'Missa mensal do Movimento Segue-me com a participação de todos os jovens e tios (Último domingo do mês).',
    status: 'confirmed',
    checklist: [],
    roles: [],
    observation: 'Uso da camiseta oficial do Segue-me.',
    synced: false,
    createdAt: new Date().toISOString()
  }
];

export const generatePreceitoEvents2026 = (): Mission[] => {
  const events: Mission[] = [];
  
  // 1. Sunday Masses
  const start = new Date('2026-01-01T12:00:00');
  const end = new Date('2026-12-31T12:00:00');
  const current = new Date(start);
  
  while (current <= end) {
    if (current.getDay() === 0) { // Sunday
      const dStr = current.toISOString().split('T')[0];
      const isPast = dStr <= '2026-06-06';
      
      events.push({
        id: `preceito-domingo-${dStr}`,
        title: 'Missa Dominical (Preceito)',
        movement: CatholicMovement.PAROQUIAL,
        dateStr: dStr,
        startTime: '19:00',
        endTime: '20:30',
        location: 'Igreja Matriz',
        description: 'Celebração da Santa Missa de preceito dominical. "Lembra-te de santificar o dia do Senhor".',
        status: isPast ? 'completed' : 'preparing',
        attended: isPast ? true : undefined,
        checklist: [],
        roles: [],
        observation: 'Preceito dominical cumprido com alegria e fidelidade católica.',
        synced: false,
        createdAt: new Date().toISOString()
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  // 2. Weekday Preceito days in Brazil
  const weekdayPreceitos = [
    {
      dateStr: '2026-01-01',
      title: 'Sol. de Santa Maria, Mãe de Deus',
      startTime: '19:00',
      endTime: '20:30',
      location: 'Igreja Matriz',
      description: 'Solenidade de Santa Maria, Mãe de Deus. Dia de Preceito e Confraternização Universal.',
      observation: 'Presença em comunhão e ação de graças no início do ano.'
    },
    {
      dateStr: '2026-06-04',
      title: 'Solenidade de Corpus Christi',
      startTime: '14:00',
      endTime: '20:00',
      location: 'Esplanada dos Ministérios',
      description: 'Solenidade do Santíssimo Sacramento do Corpo e Sangue de Cristo (Corpus Christi).',
      observation: 'Corpus Christi: estive das 14h às 20h ajudando na confecção dos tapetes e participando da procissão na Esplanada.'
    },
    {
      dateStr: '2026-10-12',
      title: 'Solenidade de N. Sra. Aparecida (Padroeira do Brasil)',
      startTime: '19:00',
      endTime: '20:30',
      location: 'Igreja Matriz',
      description: 'Solenidade de Nossa Senhora da Conceição Aparecida, Rainha e Padroeira do Brasil.',
      observation: 'Festa da Padroeira, dia de graça e intercessão pela nossa nação.'
    },
    {
      dateStr: '2026-12-08',
      title: 'Solenidade da Imaculada Conceição',
      startTime: '19:00',
      endTime: '20:30',
      location: 'Igreja Matriz',
      description: 'Solenidade da Imaculada Conceição da Bem-aventurada Virgem Maria.',
      observation: 'Solenidade da Imaculada Conceição, dia de preceito com amor mariano.'
    },
    {
      dateStr: '2026-12-25',
      title: 'Solenidade do Natal de Nosso Senhor',
      startTime: '19:00',
      endTime: '20:30',
      location: 'Igreja Matriz',
      description: 'Solenidade do Nascimento de Nosso Senhor Jesus Cristo (Natal).',
      observation: 'Celebração e ação de graças em família pelo Verbo Divino que se fez carne.'
    }
  ];
  
  weekdayPreceitos.forEach((p) => {
    const isPast = p.dateStr <= '2026-06-06';
    events.push({
      id: `preceito-solenidade-${p.dateStr}`,
      title: p.title,
      movement: CatholicMovement.PAROQUIAL,
      dateStr: p.dateStr,
      startTime: p.startTime,
      endTime: p.endTime,
      location: p.location,
      description: p.description,
      status: isPast ? 'completed' : 'preparing',
      attended: isPast ? true : undefined,
      checklist: [],
      roles: [],
      observation: p.observation,
      synced: false,
      createdAt: new Date().toISOString()
    });
  });
  
  return events;
};

export default function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [syncPromptData, setSyncPromptData] = useState<{ cloudMissions: Mission[], cloudSettings?: any } | null>(null);
  const [cloudUploadPrompt, setCloudUploadPrompt] = useState<{ active: boolean, localCount: number, gCount: number } | null>(null);
  const [cloudUploadProgress, setCloudUploadProgress] = useState<{ current: number, total: number } | null>(null);
  const [isSyncingUser, setIsSyncingUser] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 6)); // Default June 2026
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Mobile and view optimization states
  const [selectedDay, setSelectedDay] = useState<string>('2026-06-06');
  const [currentMainSection, setCurrentMainSection] = useState<'personal' | 'retrospective' | 'catalog'>('personal');
  
  // Modals Visibility
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editMission, setEditMission] = useState<Mission | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [missionToDeleteSeries, setMissionToDeleteSeries] = useState(false);
  const [isSimulatedOffline, setSimulatedOffline] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Logs stream representing virtual secretary historical activity
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Secretaria virtual inicializada.',
    'Modelos de missões gravados no cache de persistência local.'
  ]);

  // Load initial data and bind Auth listeners
  useEffect(() => {
    let loadedMissions = DEFAULT_MISSIONS;
    const localDb = localStorage.getItem('missions_db_maria');
    const legacyDb = localStorage.getItem('missions_db');
    const veryLegacyDb = localStorage.getItem('events');

    let allLoaded: any[] = [];
    
    // Aggregate from all possible local stores to prevent data loss
    [veryLegacyDb, legacyDb, localDb].forEach(dbStr => {
      if (dbStr && dbStr !== '[]') {
        try {
          const parsed = JSON.parse(dbStr);
          if (Array.isArray(parsed)) {
            allLoaded = [...allLoaded, ...parsed];
          }
        } catch (e) {}
      }
    });

    if (allLoaded.length > 0) {
      // deduplicate by id
      const uniqueMissions = new Map();
      allLoaded.forEach(m => {
        if (m && m.id && !uniqueMissions.has(m.id)) {
          uniqueMissions.set(m.id, m);
        }
      });
      loadedMissions = Array.from(uniqueMissions.values());
    }

    localStorage.setItem('missions_db_maria', JSON.stringify(loadedMissions));
    setMissions(loadedMissions);

    // Initialize Auth listener
    initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        setAuthResolved(true);
        addLog(`Conectado no Google como: ${currentUser.displayName}`);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        const wasConnected = sessionStorage.getItem('_g_connected');
        setNeedsAuth(wasConnected === 'true');
        setAuthResolved(true);
      }
    );

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Sync with Firestore whenever user logs in or is established
  useEffect(() => {
    if (user) {
      addLog('Conectando à nuvem para sincronia em tempo real...');
      
      // Proactively recover from old schemas right after login
      recoverLostMissions(user.uid).then((recovered) => {
        if (recovered.length > 0) {
          addLog(`Buscando ${recovered.length} eventos antigos encontrados...`);
          recovered.forEach(m => uploadMission(user.uid, m));
        }
      }).catch(() => {});
      
      let initialSyncDone = false;
      let cloudCachedSettings: any = null;
      const unsubSettings = subscribeToSettings(user.uid, (settings) => {
        cloudCachedSettings = settings;
        if (settings) {
           let updated = false;
           if (settings.saved_custom_catholic_movements) {
             localStorage.setItem('saved_custom_catholic_movements', settings.saved_custom_catholic_movements);
             updated = true;
           }
           if (settings.catholic_movement_colors_maria) {
             localStorage.setItem('catholic_movement_colors_maria', settings.catholic_movement_colors_maria);
             updated = true;
           }
           if (updated) {
             window.dispatchEvent(new Event('customMovementsChanged'));
           }
        }
      });

      const unsubscribe = subscribeToMissions(user.uid, (cloudMissions) => {
        if (!initialSyncDone) {
          initialSyncDone = true;
          let currentLocal: Mission[] = [];
          const localDb = localStorage.getItem('missions_db_maria');
          const legacyDb = localStorage.getItem('missions_db');
          const veryLegacyDb = localStorage.getItem('events');

          [veryLegacyDb, legacyDb, localDb].forEach(dbStr => {
            if (dbStr && dbStr !== '[]') {
              try {
                const parsed = JSON.parse(dbStr);
                if (Array.isArray(parsed)) {
                  parsed.forEach(p => {
                    if (!currentLocal.find(c => c.id === p.id)) {
                      currentLocal.push(p);
                    }
                  });
                }
              } catch (e) {}
            }
          });
          
          const hasMeaningfulLocal = currentLocal.some(m => !m.id.startsWith('seed-') && !m.id.startsWith('preceito-') && !m.id.startsWith('segueme-'));
          
          // Se tiver dados na nuvem E dados locais (além das amostras), perguntar qual usar
          if (cloudMissions.length > 0 && hasMeaningfulLocal) {
             const localIds = new Set(currentLocal.map(m => m.id));
             const missingInCloud = currentLocal.filter(m => !cloudMissions.find(cm => cm.id === m.id));
             const missingInLocal = cloudMissions.filter(cm => !localIds.has(cm.id));
             
             if (missingInCloud.length > 0 || missingInLocal.length > 0) {
               setSyncPromptData({ cloudMissions, cloudSettings: cloudCachedSettings });
               return; // Skip auto resolving
             }
          }
          
          const cloudIds = new Set(cloudMissions.map((m) => m.id));
          const merged = [...cloudMissions];
          const toUpload: Mission[] = [];
          
          currentLocal.forEach((lm) => {
            if (!cloudIds.has(lm.id)) {
              merged.push(lm);
              toUpload.push(lm);
            }
          });
          
          setMissions(merged);
          localStorage.setItem('missions_db_maria', JSON.stringify(merged));
          
          toUpload.forEach(m => {
            uploadMission(user.uid, m).catch(console.error);
          });

          addLog(`Sincronizado inicial! Dados atualizados com a nuvem.`);
        } else {
          setSyncPromptData((prev) => {
             if (prev !== null) {
                return { ...prev, cloudMissions };
             } else {
                setMissions(cloudMissions);
                localStorage.setItem('missions_db_maria', JSON.stringify(cloudMissions));
                return null;
             }
          });
        }
      });

      return () => {
        unsubscribe();
        unsubSettings();
      };
    }
  }, [user]);

  // Automatically inject important Segue-me events requested by the user
  useEffect(() => {
    if (!localStorage.getItem('added_segue_me_events_2026_fixed_v4') && missions.length > 0) {
      const existingIds = new Set(missions.map((m) => m.id));
      const filteredNew = SEGUE_ME_EVENTS_TO_ADD.filter((m) => !existingIds.has(m.id));
      
      if (filteredNew.length > 0) {
        const merged = [...missions, ...filteredNew];
        saveMissionsState(merged);
        addLog(`Integrados ${filteredNew.length} novos eventos e missas do Segue-me!`);
        
        if (user) {
          filteredNew.forEach((m) => {
            uploadMission(user.uid, m).catch(console.error);
          });
        }
      }
      localStorage.setItem('added_segue_me_events_2026_fixed_v4', 'true');
    }
  }, [missions, user]);

  // Automatically inject important Preceito and Sunday Mass events requested by the user
  useEffect(() => {
    if (!localStorage.getItem('added_preceito_events_2026_v9') && missions.length > 0) {
      const existingIds = new Set(missions.map((m) => m.id));
      const preceitoEvents = generatePreceitoEvents2026();
      const filteredNew = preceitoEvents.filter((m) => !existingIds.has(m.id));
      
      if (filteredNew.length > 0) {
        const merged = [...missions, ...filteredNew];
        saveMissionsState(merged);
        addLog(`Integradas ${filteredNew.length} missas dominicais e solenidades de preceito de 2026!`);
        
        if (user) {
          filteredNew.forEach((m) => {
            uploadMission(user.uid, m).catch(console.error);
          });
        }
      }
      localStorage.setItem('added_preceito_events_256_v9', 'true'); // Let's also set v9 to ensure fresh run if they had previous versions
      localStorage.setItem('added_preceito_events_2026_v9', 'true');
    }
  }, [missions, user]);

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

      // Parse date parts safely
      const dateParts = mission.dateStr.split('-');
      const year = parseInt(dateParts[0], 10) || 2026;
      const month = (parseInt(dateParts[1], 10) || 6) - 1; // 0-based month
      const day = parseInt(dateParts[2], 10) || 1;

      let startHr = 19, startMn = 0;
      if (mission.startTime) {
        const parts = mission.startTime.split(':');
        if (parts.length >= 2) {
          startHr = parseInt(parts[0], 10) ?? 19;
          startMn = parseInt(parts[1], 10) ?? 0;
        }
      }

      let endHr = 20, endMn = 30;
      if (mission.endTime) {
        const parts = mission.endTime.split(':');
        if (parts.length >= 2) {
          endHr = parseInt(parts[0], 10) ?? 20;
          endMn = parseInt(parts[1], 10) ?? 30;
        }
      }

      let startDate = new Date(year, month, day, startHr, startMn, 0);
      let endDate = new Date(year, month, day, endHr, endMn, 0);

      // Auto-correct empty or invalid negative time range
      if (isNaN(startDate.getTime())) {
        startDate = new Date(year, month, day, 19, 0, 0);
      }
      if (isNaN(endDate.getTime()) || endDate.getTime() <= startDate.getTime()) {
        // Fallback to start + 1 hour to prevent empty time range on Google Calendar
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }

      // Helper to output direct timezone-unaware ISO formatted matching local time
      const formatToLocalISO = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
      };

      const eventPayload = {
        summary: `⛪ [${style?.name || 'Missão'}] ${mission.title}`,
        location: mission.location || '',
        description: `${mission.description || ''}\n\n---\nMinhas Atividades / Atuação no dia: ${mission.roles?.join(', ') || 'Nenhuma selecionada'}\nObservações adicionais: ${mission.observation || 'Sem observações'}\n\nOrganizado via Agenda Eu Missionário`,
        start: {
          dateTime: formatToLocalISO(startDate),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: formatToLocalISO(endDate),
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
        if (res.status === 401) {
          // Clear cached local storage token so next login will trigger a fresh signInWithPopup flow
          localStorage.removeItem('_cached_google_token');
          sessionStorage.removeItem('_g_connected');
          throw new Error('401_UNAUTHORIZED');
        }
        let details = '';
        try {
          const errData = await res.json();
          details = errData?.error?.message || JSON.stringify(errData);
        } catch (_) {
          try {
            details = await res.text();
          } catch (__) {
            details = res.statusText || `Status ${res.status}`;
          }
        }
        throw new Error(`Google API (Status ${res.status}): ${details}`);
      }

      const data = await res.json();
      return data.id || null;
    } catch (e: any) {
      console.error('Erro ao empurrar evento ao Google Agenda:', e);
      if (e instanceof Error && e.message === '401_UNAUTHORIZED') {
        throw e;
      }
      return null;
    }
  };

  const handleForceSyncAllToCloud = async () => {
    if (!user) return;
    
    // Count events
    const localOnly = missions.filter(m => !m.googleEventId).length;
    const gConnected = missions.filter(m => m.googleEventId).length;
    
    setCloudUploadPrompt({
      active: true,
      localCount: localOnly,
      gCount: gConnected
    });
  };

  const executeCloudUpload = async () => {
    if (!user) return;
    setCloudUploadPrompt(null);
    setIsSyncingUser(true);
    addLog('Iniciando envio para nuvem...');
    
    try {
      setCloudUploadProgress({ current: 0, total: missions.length });
      for (let i = 0; i < missions.length; i++) {
        await uploadMission(user.uid, missions[i]);
        setCloudUploadProgress({ current: i + 1, total: missions.length });
      }
      
      // settings
      const savedCustom = localStorage.getItem('saved_custom_catholic_movements');
      const colorsObj = localStorage.getItem('catholic_movement_colors_maria');
      const settingsPayload: any = {};
      if (savedCustom) settingsPayload.saved_custom_catholic_movements = savedCustom;
      if (colorsObj) settingsPayload.catholic_movement_colors_maria = colorsObj;
      await uploadSettings(user.uid, settingsPayload);
      
      addLog('Sincronização completa. Dados na nuvem e locais estão idênticos.');
      alert('Todos os eventos subiram para a nuvem com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao tentar processar o upload das missões. Verifique sua conexão.');
    } finally {
      setIsSyncingUser(false);
      setCloudUploadProgress(null);
    }
  };

  const handleSyncResolution = async (choice: 'cloud' | 'local' | 'merge') => {
    if (!syncPromptData || !user) return;
    setIsSyncingUser(true);
    
    const { cloudMissions, cloudSettings } = syncPromptData;
    
    try {
      if (choice === 'cloud') {
        setSyncPromptData(null);
        setMissions(cloudMissions);
        localStorage.setItem('missions_db_maria', JSON.stringify(cloudMissions));
        
        if (cloudSettings?.saved_custom_catholic_movements) {
          localStorage.setItem('saved_custom_catholic_movements', cloudSettings.saved_custom_catholic_movements);
        }
        if (cloudSettings?.catholic_movement_colors_maria) {
          localStorage.setItem('catholic_movement_colors_maria', cloudSettings.catholic_movement_colors_maria);
        }
        window.dispatchEvent(new Event('customMovementsChanged'));
        addLog('Sincronização: Dados da nuvem substituíram os locais.');
        alert('Dados atualizados a partir da Nuvem!');
        
      } else if (choice === 'local') {
        setSyncPromptData(null);
        await handleForceSyncAllToCloud(); // Shows its own alert
        
      } else if (choice === 'merge') {
        setSyncPromptData(null);
        let currentLocal = [...missions]; 
        const cloudIds = new Set(cloudMissions.map((m) => m.id));
        const merged = [...cloudMissions];
        const toUpload: Mission[] = [];
        
        currentLocal.forEach((lm) => {
          if (!cloudIds.has(lm.id)) {
            merged.push(lm);
            toUpload.push(lm);
          }
        });
        
        setMissions(merged);
        localStorage.setItem('missions_db_maria', JSON.stringify(merged));
        
        // Wait for all uploads to complete to guarantee safety
        await Promise.all(toUpload.map(m => uploadMission(user.uid, m)));
        
        addLog('Sincronização: Mesclagem concluída.');
        alert('Dados Locais e em Nuvem Combinados com sucesso!');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao tentar recuperar ou misturar os dados.');
    } finally {
      setIsSyncingUser(false);
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

    addLog('Sincronizando com Google Calendar e Nuvem...');
    const unsyncedMissions = missions.filter((m) => !m.synced && m.dateStr);
    let count = 0;

    const updatedMissions = [...missions];

    for (const unsynced of unsyncedMissions) {
      try {
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
      } catch (err: any) {
        if (err?.message === '401_UNAUTHORIZED') {
          addLog('Token do Google expirado ou inválido. Solicitando autorização...');
          try {
            const reauth = await googleSignIn();
            if (reauth) {
              setAccessToken(reauth.accessToken);
              setUser(reauth.user);
              token = reauth.accessToken;
              // Retry pushing with updated token
              const gId = await pushEventToGoogleCalendar(unsynced, reauth.accessToken);
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
            } else {
              setAccessToken(null);
              break;
            }
          } catch (reauthErr) {
            setAccessToken(null);
            addLog('A renovação do login do Google foi cancelada ou falhou.');
            alert('Sua sessão do Google Agenda expirou. Por favor, conecte novamente clicando no botão "Sincronizar com Google Agenda".');
            break;
          }
        } else {
          console.error(err);
        }
      }
    }

    // Always ensure Firestore has local data
    if (user) {
      for (const m of updatedMissions) {
        uploadMission(user.uid, m).catch(console.error);
      }
      addLog('Backup de toda agenda local salvo na nuvem.');
    }

    if (count > 0) {
      saveMissionsState(updatedMissions);
      addLog(`Sincronizados ${count} eventos com o Google Agenda.`);
    } else {
      addLog('Nenhum evento pendente para sincronia com Google Agenda.');
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
    if (isAuthenticating) return;
    try {
      setIsAuthenticating(true);
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
    } finally {
      setIsAuthenticating(false);
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
  const handleSaveMission = async (payload: Partial<Mission>, applyToSeries?: boolean) => {
    setIsFormModalOpen(false);
    
    const isEditing = !!payload.id;
    const rc = payload.recurrence;
    const isRecurrent = rc && rc.frequency !== 'none';
    const missionsToCreate: Mission[] = [];

    const baseMission = {
      title: payload.title || 'Sem título',
      movement: payload.movement || CatholicMovement.PAROQUIAL,
      startTime: payload.startTime || '19:00',
      endTime: payload.endTime || '20:30',
      location: payload.location || '',
      description: payload.description || '',
      status: payload.status || (payload.dateStr ? 'preparing' : 'backlog'),
      checklist: payload.checklist || [],
      instagramUrl: payload.instagramUrl || '',
      instagramImgUrl: payload.instagramImgUrl,
      movementLogoUrl: payload.movementLogoUrl,
      tipo: payload.tipo,
      roles: payload.roles || [],
      observation: payload.observation || '',
      dailySchedules: payload.dailySchedules,
      endDateStr: payload.endDateStr,
      recurrence: payload.recurrence ? { ...payload.recurrence, frequency: 'none' as const } : undefined,
      cardColor: payload.cardColor,
      synced: false,
      createdAt: new Date().toISOString()
    };

    if (isEditing) {
      // Update
      const originalM = editMission;

      const updated = missions.map(async (m) => {
        const isSelf = m.id === payload.id;
        const isSeriesMatch = applyToSeries && originalM && m.id !== payload.id &&
                              m.title === originalM.title &&
                              m.movement === originalM.movement &&
                              m.startTime === originalM.startTime;

        if (isSelf || isSeriesMatch) {
          const merged: Mission = isSelf ? {
            ...m,
            ...payload,
            synced: false,
          } as Mission : {
            ...m,
            title: payload.title || m.title,
            movement: payload.movement || m.movement,
            startTime: payload.startTime || m.startTime,
            endTime: payload.endTime || m.endTime,
            location: payload.location || m.location,
            description: payload.description || m.description,
            instagramUrl: payload.instagramUrl || m.instagramUrl,
            instagramImgUrl: payload.instagramImgUrl,
            movementLogoUrl: payload.movementLogoUrl,
            tipo: payload.tipo,
            roles: payload.roles || m.roles,
            observation: payload.observation || m.observation,
            cardColor: payload.cardColor,
            synced: false,
          } as Mission;

          if (accessToken && merged.dateStr && !isSimulatedOffline) {
            try {
              const gId = await pushEventToGoogleCalendar(merged, accessToken);
              if (gId) {
                merged.googleEventId = gId;
                merged.synced = true;
              }
            } catch (err: any) {
              if (err?.message === '401_UNAUTHORIZED') {
                addLog('Token expirado ao atualizar. Renovando...');
                try {
                  const reauth = await googleSignIn();
                  if (reauth) {
                    setAccessToken(reauth.accessToken);
                    setUser(reauth.user);
                    const gId = await pushEventToGoogleCalendar(merged, reauth.accessToken);
                    if (gId) {
                      merged.googleEventId = gId;
                      merged.synced = true;
                    }
                  } else {
                    setAccessToken(null);
                  }
                } catch (reauthErr) {
                  setAccessToken(null);
                  addLog('A renovação do login falhou.');
                  alert('Sua sessão expirou. Conecte-se novamente ao Google Agenda.');
                }
              }
            }
          }
          addLog(`Ajustadas informações da missão "${merged.title}".`);
          if (user) {
            uploadMission(user.uid, merged).catch(console.error);
          }
          return merged;
        }
        return m;
      });

      const updatedMissionsResolved = await Promise.all(updated);

      if (isRecurrent && rc) {
        if (rc.frequency === 'weekly' && rc.daysOfWeek && rc.daysOfWeek.length > 0) {
          const start = new Date((payload.dateStr || '2026-06-06') + 'T12:00:00');
          const end = rc.endDate ? new Date(rc.endDate + 'T12:00:00') : new Date(start);
          if (!rc.endDate) end.setMonth(end.getMonth() + 3);

          const current = new Date(start);
          while (current <= end) {
            const dStr = current.toISOString().split('T')[0];
            if (rc.daysOfWeek.includes(current.getDay()) && dStr !== payload.dateStr) {
              missionsToCreate.push({
                id: `mission-${Date.now()}-${dStr}-${Math.random().toString(36).substring(2, 9)}`,
                dateStr: dStr,
                ...baseMission,
                recurrence: { ...rc, frequency: 'none' as const }
              });
            }
            current.setDate(current.getDate() + 1);
          }
        } else if (rc.frequency === 'monthly' && payload.dateStr) {
          const start = new Date(payload.dateStr + 'T12:00:00');
          const end = rc.endDate ? new Date(rc.endDate + 'T12:00:00') : new Date(start);
          if (!rc.endDate) end.setFullYear(end.getFullYear() + 1);

          const current = new Date(start);
          const dayOfM = current.getDate();
          while (current <= end) {
            const dStr = current.toISOString().split('T')[0];
            if (dStr !== payload.dateStr) {
              missionsToCreate.push({
                id: `mission-${Date.now()}-${dStr}-${Math.random().toString(36).substring(2, 9)}`,
                dateStr: dStr,
                ...baseMission,
                recurrence: { ...rc, frequency: 'none' as const }
              });
            }
            const expectedMonth = (current.getMonth() + 1) % 12;
            current.setMonth(current.getMonth() + 1);
            if (current.getMonth() !== expectedMonth) {
              current.setDate(0); 
            }
          }
        } else if (rc.frequency === 'custom' && rc.customDates) {
          rc.customDates.forEach((dStr, idx) => {
            if (dStr !== payload.dateStr) {
              missionsToCreate.push({
                id: `mission-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
                dateStr: dStr,
                ...baseMission,
                recurrence: { ...rc, frequency: 'none' }
              });
            }
          });
        }
      }

      if (missionsToCreate.length > 0) {
        let currentToken = accessToken;
        const finalExtraMissions: Mission[] = [];
        for (const nm of missionsToCreate) {
          const mission = { ...nm };
          if (currentToken && mission.dateStr && !isSimulatedOffline) {
            try {
              const gId = await pushEventToGoogleCalendar(mission, currentToken);
              if (gId) {
                mission.googleEventId = gId;
                mission.synced = true;
              }
            } catch (err: any) {
              if (err?.message === '401_UNAUTHORIZED') {
                addLog('Token expirado ao agendar. Renovando...');
                try {
                  const reauth = await googleSignIn();
                  if (reauth) {
                    setAccessToken(reauth.accessToken);
                    setUser(reauth.user);
                    currentToken = reauth.accessToken;
                    const gId = await pushEventToGoogleCalendar(mission, reauth.accessToken);
                    if (gId) {
                      mission.googleEventId = gId;
                      mission.synced = true;
                    }
                  } else {
                    setAccessToken(null);
                    currentToken = null;
                  }
                } catch (reauthErr) {
                  setAccessToken(null);
                  currentToken = null;
                  addLog('A renovação do login falhou.');
                  alert('Sua sessão expirou. Conecte-se novamente ao Google Agenda.');
                }
              }
            }
          }
          finalExtraMissions.push(mission);
          if (user) {
            uploadMission(user.uid, mission).catch(console.error);
          }
        }

        saveMissionsState([...finalExtraMissions, ...updatedMissionsResolved]);
        if (user) {
          const updatedItem = updatedMissionsResolved.find((m) => m.id === payload.id);
          if (updatedItem) {
            uploadMission(user.uid, updatedItem).catch(console.error);
          }
        }
        addLog(`Atualizada missão master e integrada(s) ${finalExtraMissions.length} nova(s) ocorrência(s).`);
      } else {
        saveMissionsState(updatedMissionsResolved);
        if (user) {
          const updatedItem = updatedMissionsResolved.find((m) => m.id === payload.id);
          if (updatedItem) {
            uploadMission(user.uid, updatedItem).catch(console.error);
          }
        }
      }

    } else {
      // Creation
      if (!isRecurrent) {
        missionsToCreate.push({
          id: 'mission-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
          dateStr: payload.dateStr || '',
          ...baseMission
        });
      } else {
        const rc = payload.recurrence!;
        // Ensure the main event is created first for custom recurrences/duplications
        if (rc.frequency === 'custom' && payload.dateStr) {
          missionsToCreate.push({
            id: 'mission-' + Date.now() + '-main-' + Math.random().toString(36).substring(2, 9),
            dateStr: payload.dateStr,
            ...baseMission,
            recurrence: { ...rc, frequency: 'none' as const }
          });
        }

        if (rc.frequency === 'weekly' && rc.daysOfWeek && rc.daysOfWeek.length > 0) {
          // Generate weekly occurrences for 3 months (or until end date)
          const start = new Date((payload.dateStr || '2026-06-06') + 'T12:00:00');
          const end = rc.endDate ? new Date(rc.endDate + 'T12:00:00') : new Date(start);
          if (!rc.endDate) end.setMonth(end.getMonth() + 3);

          const current = new Date(start);
          while (current <= end) {
            if (rc.daysOfWeek.includes(current.getDay())) {
              const dStr = current.toISOString().split('T')[0];
              missionsToCreate.push({
                id: `mission-${Date.now()}-${dStr}-${Math.random().toString(36).substring(2, 9)}`,
                dateStr: dStr,
                ...baseMission,
                recurrence: { ...rc, frequency: 'none' as const } // Mark individual as non-recurrent to avoid confusion
              });
            }
            current.setDate(current.getDate() + 1);
          }
        } else if (rc.frequency === 'monthly' && payload.dateStr) {
          const start = new Date(payload.dateStr + 'T12:00:00');
          const end = rc.endDate ? new Date(rc.endDate + 'T12:00:00') : new Date(start);
          if (!rc.endDate) end.setFullYear(end.getFullYear() + 1);

          const current = new Date(start);
          const dayOfM = current.getDate();
          while (current <= end) {
            const dStr = current.toISOString().split('T')[0];
            if (dStr !== payload.dateStr) {
              missionsToCreate.push({
                id: `mission-${Date.now()}-${dStr}-${Math.random().toString(36).substring(2, 9)}`,
                dateStr: dStr,
                ...baseMission,
                recurrence: { ...rc, frequency: 'none' as const } // Mark individual as non-recurrent to avoid confusion
              });
            }
            const expectedMonth = (current.getMonth() + 1) % 12;
            current.setMonth(current.getMonth() + 1);
            if (current.getMonth() !== expectedMonth) {
              current.setDate(0); 
            }
          }
        } else if (rc.frequency === 'custom' && rc.customDates) {
          rc.customDates.forEach((dStr, idx) => {
            if (dStr !== payload.dateStr) {
              missionsToCreate.push({
                id: `mission-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
                dateStr: dStr,
                ...baseMission,
                recurrence: { ...rc, frequency: 'none' }
              });
            }
          });
        } else {
          // Fallback to single
          missionsToCreate.push({
            id: 'mission-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
            dateStr: payload.dateStr || '',
            ...baseMission
          });
        }
      }

      // Sync and save all created missions
      const syncAndSave = async () => {
        let currentToken = accessToken;
        const finalMissions: Mission[] = [];
        for (const nm of missionsToCreate) {
          const mission = { ...nm };
          if (currentToken && mission.dateStr && !isSimulatedOffline) {
            try {
              const gId = await pushEventToGoogleCalendar(mission, currentToken);
              if (gId) {
                mission.googleEventId = gId;
                mission.synced = true;
              }
            } catch (err: any) {
              if (err?.message === '401_UNAUTHORIZED') {
                addLog('Token expirado ao agendar. Renovando...');
                try {
                  const reauth = await googleSignIn();
                  if (reauth) {
                    setAccessToken(reauth.accessToken);
                    setUser(reauth.user);
                    currentToken = reauth.accessToken;
                    const gId = await pushEventToGoogleCalendar(mission, reauth.accessToken);
                    if (gId) {
                      mission.googleEventId = gId;
                      mission.synced = true;
                    }
                  } else {
                    setAccessToken(null);
                    currentToken = null;
                  }
                } catch (reauthErr) {
                  setAccessToken(null);
                  currentToken = null;
                  addLog('A renovação do login falhou.');
                  alert('Sua sessão expirou. Conecte-se novamente ao Google Agenda.');
                }
              }
            }
          }
          finalMissions.push(mission);
          if (user) {
            uploadMission(user.uid, mission).catch(console.error);
          }
        }
        saveMissionsState([...finalMissions, ...missions]);
        addLog(`Cadastrada(s) ${finalMissions.length} nova(s) missão(ões): "${baseMission.title}".`);
        sendAlert('Missão Agendada ⛪', `"${baseMission.title}" foi salva nos registros paroquiais.`);
      };

      syncAndSave();
    }

    setEditMission(null);
  };

  // Deletion logic
  const handleDeleteMission = (id: string, applyToSeries?: boolean) => {
    console.log('Attempting to delete mission:', id);
    const target = missions.find((m) => m.id === id);
    console.log('Target mission found:', target);
    if (!target) {
      console.log('Mission not found, aborting.');
      return;
    }
    setMissionToDelete(target);
    setMissionToDeleteSeries(!!applyToSeries);
  };

  const executeDeleteMission = (id: string, applyToSeries?: boolean) => {
    console.log('Executing delete for mission:', id, 'series:', applyToSeries);
    const target = missions.find((m) => m.id === id);
    if (!target) return;

    let targetIds = [id];
    if (applyToSeries) {
      targetIds = missions
        .filter(m => m.id === id || (m.title === target.title && m.movement === target.movement && m.startTime === target.startTime))
        .map(m => m.id);
    }

    const runAsyncDelete = async () => {
      for (const tId of targetIds) {
        const mTarget = missions.find(m => m.id === tId);
        if (accessToken && mTarget?.googleEventId && !isSimulatedOffline) {
          try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${mTarget.googleEventId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            });
          } catch (error) {
            console.error(error);
          }
        }
      }
    };

    runAsyncDelete();

    const nextList = missions.filter((m) => !targetIds.includes(m.id));
    saveMissionsState(nextList);
    if (user) {
      for (const tId of targetIds) {
        removeMission(user.uid, tId).catch(console.error);
      }
    }
    
    if (applyToSeries) {
      addLog(`Série de eventos "${target.title}" excluída com sucesso.`);
    } else {
      addLog(`Missão "${target.title}" arquivada com sucesso.`);
    }
    setMissionToDelete(null);
    setMissionToDeleteSeries(false);
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

  // Update attendance of a completed event (Save to database & state)
  const handleUpdateAttendance = (missionId: string, attended: boolean) => {
    const updated = missions.map((m) => {
      if (m.id === missionId) {
        const updatedMission = {
          ...m,
          attended,
          status: attended ? 'completed' as const : m.status,
          synced: false
        };
        if (user) {
          uploadMission(user.uid, updatedMission).catch(console.error);
        }
        return updatedMission;
      }
      return m;
    });
    saveMissionsState(updated);
    addLog(`Presença atualizada: ${attended ? 'Compareceu ⛪' : 'Não pôde comparecer ❌'}`);
  };

  const isEventPast = (m: Mission) => {
    if (m.status === 'backlog' || !m.dateStr || !m.endTime) return false;
    try {
      const eventEnd = new Date(`${m.dateStr}T${m.endTime}`);
      return new Date() >= eventEnd;
    } catch (e) {
      return false;
    }
  };

  const hasPendingAttendance = missions.some(m => isEventPast(m) && m.attended === undefined);

  const pendingCount = missions.filter((m) => !m.synced && m.dateStr).length;

  if (!authResolved) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl" />
        
        <div className="bg-white/80 backdrop-blur-xl border border-purple-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 mb-2">
            <Church className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Eu Agenda Missionária</h1>
            <p className="text-sm text-slate-600">
              Faça login para criar, acessar e sincronizar seus eventos e missões católicas em todos os seus dispositivos.
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            )}
            {isAuthenticating ? 'Carregando...' : 'Continuar com Google'}
          </button>
        </div>
      </div>
    );
  }

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
      <header className="bg-white/80 backdrop-blur-md border border-b border-purple-100 py-3.5 px-6 shadow-xs z-45">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-purple-100 flex items-center justify-center shadow-md shadow-purple-900/10 border border-purple-800 select-none">
              <Church className="w-5.5 h-5.5 fill-white/10" />
            </div>
            <div>
              <h1 id="app-title-header" className="text-lg font-black tracking-tighter text-slate-900 flex items-center gap-1.5 uppercase">
                Eu Agenda Missionária
              </h1>
              <p className="text-xs text-purple-700 font-extrabold tracking-tight uppercase">Eu Missionário</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* Google Sync and Login button widgets */}
            {user && (
              <button
                onClick={handleForceSyncAllToCloud}
                disabled={isSyncingUser}
                className="text-[10px] py-1.5 px-3 border border-indigo-200 hover:bg-indigo-50 cursor-pointer flex items-center gap-1.5 rounded-lg bg-white text-indigo-800 font-black shadow-3xs hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncingUser ? (
                   <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                ) : (
                   <Globe className="w-3.5 h-3.5 text-indigo-500" />
                )}
                {isSyncingUser ? 'Enviando...' : 'Forçar Sincronização'}
              </button>
            )}

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
          </div>
        </div>
      </header>
      
      {/* Sync Prompt Modal */}
      {syncPromptData && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-scale-up">
            <h2 className="text-lg font-black text-indigo-950 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              Sincronização Necessária
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Encontramos dados diferentes salvos na Nuvem (outro dispositivo) e no seu Navegador atual. Qual versão você deseja usar?
            </p>
            <div className="space-y-2 mt-4">
              <button
                onClick={() => handleSyncResolution('cloud')}
                disabled={isSyncingUser}
                className="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 flex items-start gap-3 transition cursor-pointer group disabled:opacity-50"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 text-blue-700">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-blue-900">Usar Dados da Nuvem</span>
                  <span className="block text-[10px] text-blue-700">Puxa os dados do outro dispositivo e substitui os dados deste navegador.</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSyncResolution('local')}
                disabled={isSyncingUser}
                className="w-full text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 flex items-start gap-3 transition cursor-pointer group disabled:opacity-50"
              >
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 text-emerald-700">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-emerald-900">Usar Dados do Navegador Atual</span>
                  <span className="block text-[10px] text-emerald-700">Envia os dados atuais deste navegador para a nuvem (sobrescrevendo o outro).</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSyncResolution('merge')}
                disabled={isSyncingUser}
                className="w-full text-left p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 flex items-start gap-3 transition cursor-pointer group disabled:opacity-50"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 text-purple-700">
                  {isSyncingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-purple-900">{isSyncingUser ? 'Combinando...' : 'Mesclar Tudo (Recomendado)'}</span>
                  <span className="block text-[10px] text-purple-700">Mantém todos os eventos juntando os dois.</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Upload Prompt Modal */}
      {cloudUploadPrompt && cloudUploadPrompt.active && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-2xl w-full max-w-md p-5 animate-scale-up flex flex-col">
            <h2 className="text-lg font-black text-indigo-950 flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-indigo-600" />
              Subir Eventos
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Identificamos <strong>{missions.length} eventos</strong> no seu dispositivo atual.<br/>
              Sendo <strong>{cloudUploadPrompt.gCount} conectados ao Google</strong> e <strong>{cloudUploadPrompt.localCount} Offline</strong>.<br/><br/>
              Deseja subir todos para a nuvem substituindo a versão de lá? Eles ficarão disponíveis ao vivo nos outros dispositivos conectados nesta conta.
            </p>
            
            {cloudUploadProgress ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                  <span>Enviando para Nuvem...</span>
                  <span>{cloudUploadProgress.current} / {cloudUploadProgress.total}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 relative">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${Math.round((cloudUploadProgress.current / cloudUploadProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setCloudUploadPrompt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeCloudUpload}
                  className="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition flex items-center gap-2 hover:shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  Sim, Subir Todos
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Main Section Switcher */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 mt-4">
        <div className="flex bg-purple-100/50 p-1.5 rounded-2xl border border-purple-200/50 shadow-2xs max-w-sm sm:max-w-xl transition-all">
          <button
            type="button"
            onClick={() => setCurrentMainSection('personal')}
            className={`flex-1 py-2 px-3 rounded-xl text-[11px] sm:text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMainSection === 'personal'
                ? 'bg-purple-900 text-white shadow-md font-black border border-purple-950/10'
                : 'text-purple-600 hover:text-purple-950 font-bold'
            }`}
          >
            <Church className={`w-4 h-4 ${currentMainSection === 'personal' ? 'text-purple-200' : 'text-purple-500'}`} /> Agenda Pessoal
          </button>

          <button
            type="button"
            onClick={() => setCurrentMainSection('retrospective')}
            className={`flex-1 py-2 px-3 rounded-xl text-[11px] sm:text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
              currentMainSection === 'retrospective'
                ? 'bg-[#1E1B4B] text-indigo-100 shadow-md font-black border border-indigo-950/10'
                : 'text-indigo-600 hover:text-indigo-950 font-bold'
            }`}
          >
            <Award className={`w-4 h-4 ${currentMainSection === 'retrospective' ? 'text-indigo-300' : 'text-indigo-600'}`} /> 
            <span>Retrospectiva</span>
            {hasPendingAttendance && (
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 border-2 border-white animate-pulse" />
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentMainSection('catalog')}
            className={`flex-1 py-2 px-3 rounded-xl text-[11px] sm:text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMainSection === 'catalog'
                ? 'bg-[#5B1E31] text-rose-100 shadow-md font-black border border-rose-500/10'
                : 'text-rose-800 hover:text-rose-950 font-bold'
            }`}
          >
            <Globe className={`w-4 h-4 ${currentMainSection === 'catalog' ? 'text-rose-300' : 'text-rose-700'}`} /> Eventos Católicos
          </button>
        </div>
      </div>

      {currentMainSection === 'personal' && (
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
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
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
          </main>
        </>
      )}

      {currentMainSection === 'retrospective' && (
        <div className="max-w-7xl w-full mx-auto p-4 md:p-6">
          <RetrospectivaView 
            missions={missions}
            onUpdateAttendance={handleUpdateAttendance}
          />
        </div>
      )}

      {currentMainSection === 'catalog' && (
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
        <div className="fixed inset-0 bg-purple-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]" id="delete-confirmation-dialog">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-50 text-red-650 shrink-0 border border-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 select-text">
                <h3 className="font-extrabold text-xs text-red-950 uppercase tracking-wider">Confirmar Exclusão</h3>
                <p className="text-xs text-slate-650 leading-relaxed">
                  Tem certeza de que deseja arquivar ou excluir a missão {missionToDeleteSeries ? 'EM SÉRIE' : ''} <strong className="text-slate-900">"{missionToDelete.title}"</strong>?<br />
                  Esta ação removerá permanentemente os registros do cache e da nuvem.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setMissionToDelete(null); setMissionToDeleteSeries(false); }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-600 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDeleteMission(missionToDelete.id, missionToDeleteSeries);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                Confirmar Exclusão {missionToDeleteSeries ? 'da Série' : ''}
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
