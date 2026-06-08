/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Check,
  MapPin,
  Clock,
  Sparkles,
  Filter,
  Tag,
  AlertTriangle,
  FolderPlus,
  UserCheck,
  CalendarDays,
  X,
  FileSpreadsheet,
  Instagram,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mission, CatholicMovement } from '../types';
import { getMovementStyle } from '../utils/catholicData';
import { SEEDED_CATHOLIC_EVENTS, CatholicEvent } from '../utils/seededCatholicEvents';
import { downloadCatholicEvents, uploadCatholicEvent } from '../utils/firebaseDb';
import { User } from 'firebase/auth';

interface CatholicEventsCalendarProps {
  personalMissions: Mission[];
  onAddMission: (mission: Partial<Mission>) => void;
  onRemoveMission: (id: string) => void;
  addLog: (text: string) => void;
  currentUser?: User | null;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIPO_OPTIONS = [
  { value: 'vigilia', label: '🌙 Vigília' },
  { value: 'luau', label: '🔥 Luau' },
  { value: 'adoracao', label: '⛪ Adoração' },
  { value: 'retiro', label: '🍃 Retiro' },
  { value: 'encontro', label: '👥 Encontro Jovem' },
  { value: 'acampamento', label: '⛺ Acampamento / Fest' },
  { value: 'seminario', label: '📖 Seminário / Formação' },
  { value: 'grupo', label: '🗣️ Grupo de Oração' },
  { value: 'missa', label: '🍞 Missa Solene' }
];

const isEventOnDate = (event: CatholicEvent, dateStr: string): boolean => {
  if (!event.dateStr) return false;
  if (!event.endDateStr || event.endDateStr === event.dateStr) {
    return event.dateStr === dateStr;
  }
  return dateStr >= event.dateStr && dateStr <= event.endDateStr;
};

const isEventInMonth = (event: CatholicEvent, year: number, month: number): boolean => {
  if (!event.dateStr) return false;
  const startYear = parseInt(event.dateStr.slice(0, 4));
  const startMonth = parseInt(event.dateStr.slice(5, 7)) - 1;
  const startDate = new Date(startYear, startMonth, 1);
  
  const endYear = event.endDateStr ? parseInt(event.endDateStr.slice(0, 4)) : startYear;
  const endMonth = event.endDateStr ? parseInt(event.endDateStr.slice(5, 7)) - 1 : startMonth;
  const endDate = new Date(endYear, endMonth, 1);
  
  const currentMonthDate = new Date(year, month, 1);
  return currentMonthDate >= startDate && currentMonthDate <= endDate;
};

const datesOverlap = (
  startA: string,
  endA: string | undefined,
  startB: string,
  endB: string | undefined
): boolean => {
  const actualEndA = endA || startA;
  const actualEndB = endB || startB;
  return startA <= actualEndB && startB <= actualEndA;
};

const getEventDateSpan = (event: CatholicEvent, truncateMonth = false): string => {
  if (!event.dateStr) return 'A Confirmar (Evento Futuro)';
  const start = new Date(event.dateStr + 'T00:00');
  const monthFormat = truncateMonth ? 'short' : 'long';
  if (!event.endDateStr || event.endDateStr === event.dateStr) {
    return start.toLocaleDateString('pt-BR', { day: 'numeric', month: monthFormat });
  }
  const end = new Date(event.endDateStr + 'T00:00');
  return `${start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} a ${end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
};

export default function CatholicEventsCalendar({
  personalMissions,
  onAddMission,
  onRemoveMission,
  addLog,
  currentUser
}: CatholicEventsCalendarProps) {
  // Catalog database of all Catholic events
  const [catholicEvents, setCatholicEvents] = useState<CatholicEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 6)); // Default June 2026 to align with personal calendar
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Tabs for Catholic Events: 'month' (with calendar grid) and 'future' (unconfirmed dates)
  const [eventTab, setEventTab] = useState<'month' | 'future'>('month');
  
  // New state to allow cataloging an event with unconfirmed/future date
  const [formIsFutureUnconfirmed, setFormIsFutureUnconfirmed] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [showOnlySelectedDay, setShowOnlySelectedDay] = useState(false);

  // Form toggles
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Create event form state
  const [formTitle, setFormTitle] = useState('');
  const [formMovement, setFormMovement] = useState<string>(CatholicMovement.PAROQUIAL);
  const [formDate, setFormDate] = useState('2026-06-06');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('19:00');
  const [formEndTime, setFormEndTime] = useState('21:00');
  const [formLocation, setFormLocation] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTipo, setFormTipo] = useState('encontro');
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [formInstagramImgUrl, setFormInstagramImgUrl] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<CatholicEvent | null>(null);

  // Conflict management states (In-app visual prompt modal)
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingAddEvent, setPendingAddEvent] = useState<CatholicEvent | null>(null);
  const [conflictingEvent, setConflictingEvent] = useState<Mission | null>(null);

  // Load database
  useEffect(() => {
    const localDb = localStorage.getItem('catholic_events_db_maria');
    if (localDb) {
      try {
        setCatholicEvents(JSON.parse(localDb));
      } catch (e) {
        setCatholicEvents(SEEDED_CATHOLIC_EVENTS);
      }
    } else {
      setCatholicEvents(SEEDED_CATHOLIC_EVENTS);
      localStorage.setItem('catholic_events_db_maria', JSON.stringify(SEEDED_CATHOLIC_EVENTS));
    }
  }, []);

  // Sync with Firestore whenever currentUser is logged in
  useEffect(() => {
    if (currentUser) {
      addLog('Sincronizando calendário geral de eventos com a nuvem...');
      downloadCatholicEvents(currentUser.uid).then(async (cloudEvents) => {
        if (cloudEvents.length === 0) {
          // Cloud empty, let's backup
          for (const ev of catholicEvents) {
            await uploadCatholicEvent(currentUser.uid, ev);
          }
          addLog('Eventos locais sincronizados e salvos na nuvem!');
        } else {
          setCatholicEvents(cloudEvents);
          localStorage.setItem('catholic_events_db_maria', JSON.stringify(cloudEvents));
          addLog('Catálogo de eventos atualizado da nuvem!');
        }
      }).catch((err) => {
        console.error('Erro ao sincronizar eventos:', err);
      });
    }
  }, [currentUser]);

  // Sync back to localstorage on additions
  const saveEventsToStorage = (eventsList: CatholicEvent[]) => {
    setCatholicEvents(eventsList);
    localStorage.setItem('catholic_events_db_maria', JSON.stringify(eventsList));
  };

  const handleCreateCatholicEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    const newEvent: CatholicEvent = {
      id: 'cat-manual-' + Date.now(),
      title: formTitle,
      movement: formMovement,
      dateStr: formIsFutureUnconfirmed ? '' : formDate,
      endDateStr: (formIsFutureUnconfirmed || !formEndDate) ? undefined : formEndDate,
      startTime: formStartTime,
      endTime: formEndTime,
      location: formLocation || 'Igreja',
      description: formDescription || 'Nenhuma descrição adicionada.',
      tipo: formTipo,
      city: formCity || 'Geral',
      instagramUrl: formInstagramUrl.trim() || undefined,
      instagramImgUrl: formInstagramImgUrl.trim() || undefined
    };

    const updatedList = [newEvent, ...catholicEvents];
    saveEventsToStorage(updatedList);
    if (currentUser) {
      uploadCatholicEvent(currentUser.uid, newEvent).catch(console.error);
    }
    addLog(`Novo evento católico catalogado: ${newEvent.title}`);
    
    // Reset Form
    setFormTitle('');
    setFormEndDate('');
    setFormLocation('');
    setFormCity('');
    setFormDescription('');
    setFormInstagramUrl('');
    setFormInstagramImgUrl('');
    setFormIsFutureUnconfirmed(false);
    setIsAddFormOpen(false);
  };

  // Check if a catholic event is already in our personal missions list
  const isEventInPersonalAgenda = (event: CatholicEvent): boolean => {
    return personalMissions.some(
      (pm) =>
        pm.title === event.title &&
        (pm.dateStr || '') === (event.dateStr || '') &&
        (pm.endDateStr || '') === (event.endDateStr || '') &&
        pm.startTime === event.startTime
    );
  };

  // Find linked mission ID in personal list if exists
  const getLinkedPersonalMissionId = (event: CatholicEvent): string | undefined => {
    return personalMissions.find(
      (pm) =>
        pm.title === event.title &&
        (pm.dateStr || '') === (event.dateStr || '') &&
        (pm.endDateStr || '') === (event.endDateStr || '') &&
        pm.startTime === event.startTime
    )?.id;
  };

  // Convert time HH:MM to numerical minutes
  const timeToMinutes = (t: string): number => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Handle click on Catholic Event "Vou participar!" check button
  const handleToggleParticipation = (event: CatholicEvent) => {
    const isAttending = isEventInPersonalAgenda(event);

    if (isAttending) {
      // Remove from personal agenda
      const personalId = getLinkedPersonalMissionId(event);
      if (personalId) {
        onRemoveMission(personalId);
        addLog(`Removido da agenda pessoal: ${event.title}`);
      }
    } else {
      // If event has no dateStr, it's a future unconfirmed event. No overlap conflicts can happen.
      if (!event.dateStr) {
        copyToPersonalAgenda(event);
        return;
      }

      // Check for overlap conflicts in Personal Agenda on overlapping days
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime || '23:59');

      const conflict = personalMissions.find((pm) => {
        if (!pm.dateStr || !pm.startTime) return false;

        const hasDateOverlap = datesOverlap(event.dateStr, event.endDateStr, pm.dateStr, pm.endDateStr);
        if (!hasDateOverlap) return false;

        const pmStart = timeToMinutes(pm.startTime);
        const pmEnd = timeToMinutes(pm.endTime || '23:59');
        // Overlap condition
        return eventStart < pmEnd && pmStart < eventEnd;
      });

      if (conflict) {
        // Trigger dialog warning
        setConflictingEvent(conflict);
        setPendingAddEvent(event);
        setShowConflictModal(true);
      } else {
        // Add immediately
        copyToPersonalAgenda(event);
      }
    }
  };

  const copyToPersonalAgenda = (event: CatholicEvent) => {
    const newMission: Partial<Mission> = {
      title: event.title,
      movement: event.movement,
      dateStr: event.dateStr || '',
      endDateStr: event.endDateStr || '',
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.city ? `${event.location}, ${event.city}` : event.location,
      description: event.description,
      tipo: event.tipo,
      status: event.dateStr ? 'confirmed' : 'backlog',
      roles: ['servir'], // Default role
      observation: event.dateStr
        ? 'Copiado automaticamente do Calendário Geral de Eventos Católicos.'
        : 'Copiado automaticamente do Calendário Geral (Sem data confirmada ainda). Salvado em rascunhos.',
    };
    onAddMission(newMission);
    addLog(`Copiado para agenda pessoal: ${event.title}`);
  };

  const handleConfirmConflictOverride = () => {
    if (pendingAddEvent) {
      copyToPersonalAgenda(pendingAddEvent);
    }
    setShowConflictModal(false);
    setPendingAddEvent(null);
    setConflictingEvent(null);
  };

  // Calendar render helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setDirection(1);
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setDirection(0);
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchEnd(null);
    setTouchEndY(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null || touchStartY === null || touchEndY === null) return;
    const diffX = touchStart - touchEnd;
    const diffY = touchStartY - touchEndY;
    
    // Thresholds: Mostly horizontal, X movement > 50px, Y movement < 60px
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 60) {
      if (diffX > 0) {
        handleNextMonth();
      } else {
        handlePrevMonth();
      }
    }
  };

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const dayCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) dayCells.push(null);
  for (let d = 1; d <= totalDays; d++) dayCells.push(d);

  const formatDateString = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Unique list of cities for filter dropdown
  const citiesList = Array.from(new Set(catholicEvents.map((e) => e.city).filter(Boolean)));

  // Filtered Events for listing (Calendar monthly events plus user selection)
  const filteredEvents = catholicEvents.filter((e) => {
    // Basic search keyword match
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Movement filter
    const matchesMovement = selectedMovement === 'all' || e.movement === selectedMovement;

    // City filter
    const matchesCity = selectedCity === 'all' || e.city === selectedCity;

    // Tipo filter
    const matchesTipo = selectedTipo === 'all' || e.tipo === selectedTipo;

    if (eventTab === 'future') {
      // Must NOT have a date
      const isFutureUnconfirmed = !e.dateStr;
      return matchesSearch && matchesMovement && matchesCity && matchesTipo && isFutureUnconfirmed;
    } else {
      // Must HAVE a date
      if (!e.dateStr) return false;

      // Calendar selection filter
      let matchesSelectedDay = true;
      if (showOnlySelectedDay && selectedDay) {
        matchesSelectedDay = isEventOnDate(e, selectedDay);
      } else {
        // Default to matching selected month
        matchesSelectedDay = isEventInMonth(e, year, month);
      }

      return matchesSearch && matchesMovement && matchesCity && matchesTipo && matchesSelectedDay;
    }
  });

  // Sort events chronologically: from closest to furthest date to satisfy "data mais perto pra mais distante"
  const sortedEventsForSlides = [...catholicEvents]
    .filter((e) => e.dateStr)
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  // Automatic slideshow cycle useEffect
  useEffect(() => {
    if (sortedEventsForSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % sortedEventsForSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sortedEventsForSlides.length]);

  return (
    <div className="space-y-6 select-none text-rose-950 pb-8">
      
      {/* Unified action bar containing only the Catalog button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <FolderPlus className="w-4 h-4" />
          {isAddFormOpen ? 'Fechar Cadastro' : 'Catalogar Eventos'}
        </button>
      </div>

      {/* Catalog Adder Form (AnimatePresence) */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreateCatholicEvent}
              className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-rose-200">
                <Sparkles className="w-4.5 h-4.5 text-rose-700" />
                <h3 className="font-extrabold text-xs text-rose-900 uppercase">
                  Registar no Eventos Católicos
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                {/* Title */}
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Título do Evento Católico</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Luau Regional da Juventude, Noite de Aviva..."
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>

                {/* Movement selector */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Movimento Organizador</label>
                  <select
                    value={formMovement}
                    onChange={(e) => setFormMovement(e.target.value)}
                    className="w-full bg-white border border-rose-200 px-2.5 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  >
                    <option value={CatholicMovement.PAROQUIAL}>⛪ Coordenação Paroquial</option>
                    <option value={CatholicMovement.RCC}>🔥 Renovação Carismática (RCC)</option>
                    <option value={CatholicMovement.EJNS}>💙 Jovens de Nossa Senhora (EJNS)</option>
                    <option value={CatholicMovement.SHALOM}>💚 Comunidade Shalom</option>
                    <option value={CatholicMovement.VINCENTINOS}>❤️ Vicentinos (SSVP)</option>
                    <option value={CatholicMovement.CANCAO_NOVA}>🩵 Comunidade Canção Nova</option>
                    <option value={CatholicMovement.TERCO_HOMENS}>🖤 Terço dos Homens</option>
                    <option value="Eventos Gerais">✨ Eventos Gerais / Diocesanos</option>
                  </select>
                </div>

                {/* Event Tipo option */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Tipo Litúrgico / Ação</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full bg-white border border-rose-200 px-2.5 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  >
                    {TIPO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Future Unconfirmed Date Toggle */}
              <div className="flex items-center gap-2 bg-rose-100/30 p-2.5 rounded-xl border border-rose-200/50">
                <input
                  type="checkbox"
                  id="formIsFutureUnconfirmed"
                  checked={formIsFutureUnconfirmed}
                  onChange={(e) => setFormIsFutureUnconfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-rose-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="formIsFutureUnconfirmed" className="text-xs font-black text-rose-900 cursor-pointer select-none flex items-center gap-1">
                  ⏳ Este evento ainda não possui data confirmada (Catalogar como Evento Futuro / Sem data)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                {/* Start Date */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">
                    Data de Início {formIsFutureUnconfirmed && ' (A Confirmar)'}
                  </label>
                  <input
                    type="date"
                    required={!formIsFutureUnconfirmed}
                    disabled={formIsFutureUnconfirmed}
                    value={formIsFutureUnconfirmed ? '' : formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold disabled:bg-rose-50/50 disabled:text-rose-400"
                  />
                </div>

                {/* End Date */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Data de Término (Opcional)</label>
                  <input
                    type="date"
                    disabled={formIsFutureUnconfirmed}
                    value={formIsFutureUnconfirmed ? '' : formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    min={formDate}
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold disabled:bg-rose-50/50 disabled:text-rose-400"
                  />
                </div>

                {/* Start Time */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Horário de Início</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>

                {/* End Time */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Horário Término</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                {/* Location */}
                <div className="md:col-span-8 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Localização / Paróquia</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ex: Altar, Auditório principal, Ginásio"
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>

                {/* City */}
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Cidade</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Ex: Lorena, Campinas"
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>
              </div>

              {/* Instagram Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">Link de Post do Instagram (Opcional)</label>
                  <input
                    type="url"
                    value={formInstagramUrl}
                    onChange={(e) => setFormInstagramUrl(e.target.value)}
                    placeholder="Ex: https://www.instagram.com/p/..."
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-rose-800 block">URL de Imagem do Post/Preview (Opcional)</label>
                  <input
                    type="url"
                    value={formInstagramImgUrl}
                    onChange={(e) => setFormInstagramImgUrl(e.target.value)}
                    placeholder="Ex: https://images.unsplash.com/photo-..."
                    className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-800 block">Detalhes Pastorais / Requisitos</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Escreva breve resumo, orientações de liturgia ou vestimentas específicas para o evento..."
                  rows={2}
                  className="w-full bg-white border border-rose-200 px-3 py-1.5 rounded-xl outline-none focus:border-rose-700 text-xs text-rose-950 leading-relaxed font-medium"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-4 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100/50 text-xs text-rose-800 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                >
                  ✔️ Gravar nos Eventos Católicos
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEÇÃO INICIAL: Slide Automático de Destaques dos Eventos Católicos */}
      {sortedEventsForSlides.length > 0 && (
        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
            <h3 className="text-xs font-black uppercase text-rose-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600 animate-pulse" />
              ✨ Próximos eventos
            </h3>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-lg">
              {activeSlideIndex + 1} de {sortedEventsForSlides.length}
            </span>
          </div>

          <div
            onClick={() => setSelectedDetailEvent(sortedEventsForSlides[activeSlideIndex])}
            className="relative h-[240px] sm:h-[280px] w-full rounded-2xl overflow-hidden bg-rose-950 border border-rose-200 shadow-3xs flex flex-col justify-end group cursor-pointer hover:border-rose-400 hover:shadow-sm transition-all duration-300"
          >
            {/* Slide Content rendering */}
            {sortedEventsForSlides.map((event, idx) => {
              const isCurrent = idx === activeSlideIndex;
              const mStyle = getMovementStyle(event.movement);
              
              // Determine the image according to instruction: "quando nao tiver img nem link do istagram usar a logo com img"
              let bgImage = '';
              if (event.instagramImgUrl) {
                bgImage = event.instagramImgUrl;
              } else {
                bgImage = mStyle?.logoUrl || mStyle?.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80';
              }

              return (
                <div
                  key={event.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col justify-end p-4 sm:p-5 ${
                    isCurrent ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95 pointer-events-none'
                  }`}
                >
                  {/* Background cover image with gradient overlay */}
                  <div
                    className="absolute inset-0 bg-cover bg-center select-none bg-no-repeat"
                    style={{ backgroundImage: `url("${bgImage}")` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rose-955 via-rose-950/70 to-transparent" />

                  {/* Top-right movement logo overlay / indicator */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl shadow border border-rose-100">
                    {mStyle?.logoUrl ? (
                      <img
                        src={mStyle.logoUrl}
                        alt="Logo"
                        className="w-4 h-4 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xs">⛪</span>
                    )}
                    <span className="text-[10px] font-black uppercase text-rose-955">
                      {mStyle?.name}
                    </span>
                  </div>

                  {/* Overlaid Event Details inside slide */}
                  <div className="relative z-10 space-y-1.5 select-text font-semibold">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] bg-rose-700 text-white font-black uppercase px-2 py-0.5 rounded shadow-sm">
                        📅 {getEventDateSpan(event)}
                      </span>
                      <span className="text-[9px] bg-white/20 text-white font-bold backdrop-blur-xs px-2 py-0.5 rounded">
                        ⏱️ {event.startTime} {event.endTime ? `às ${event.endTime}` : ''}
                      </span>
                      <span className="text-[9px] bg-white/25 text-white font-black uppercase backdrop-blur-xs px-2 py-0.5 rounded">
                        📍 {event.city}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow-sm font-sans">
                      {event.title}
                    </h4>

                    <p className="text-[10px] sm:text-xs text-rose-100/90 leading-snug line-clamp-2 max-w-2xl drop-shadow-xs font-semibold">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(event.dateStr);
                          setShowOnlySelectedDay(true);
                          addLog(`Visualizando data do slide: ${event.title}`);
                        }}
                        className="text-[9px] font-black bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm transition active:scale-95 cursor-pointer max-w-max uppercase"
                      >
                        🔍 Ver no Calendário
                      </button>

                      {event.instagramUrl && (
                        <a
                          href={event.instagramUrl}
                          target="_blank; noreferrer"
                          rel="noreferrer"
                          referrerPolicy="no-referrer"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="text-[9px] font-black bg-white/10 hover:bg-white/25 border border-white/20 text-white px-2.5 py-1 rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1 max-w-max uppercase"
                        >
                          <Instagram className="w-3.5 h-3.5 text-rose-300" /> Ir para o Post
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Manual Slide Arrows */}
            {sortedEventsForSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlideIndex((prev) => (prev - 1 + sortedEventsForSlides.length) % sortedEventsForSlides.length);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white transition active:scale-90 opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlideIndex((prev) => (prev + 1) % sortedEventsForSlides.length);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white transition active:scale-90 opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Indicator Dot pills at the bottom */}
            {sortedEventsForSlides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/25 px-1.5 py-1 rounded-full backdrop-blur-xs">
                {sortedEventsForSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlideIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition ${
                      idx === activeSlideIndex ? 'bg-white w-3' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Left is Wine Calendar, Right is Searched Event Feed List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Area: Wine Calendar Grid (col-span-5) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="col-span-1 lg:col-span-5 bg-white border border-rose-100 rounded-2xl p-4 md:p-5 shadow-xs space-y-4 touch-pan-y"
        >
          
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-rose-700" />
              <h2 className="text-base font-black text-rose-950">
                {MONTHS_PT[month]} <span className="font-light text-rose-400">{year}</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToday}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-black rounded-lg transition"
              >
                Atuais
              </button>
              <div className="flex bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-md hover:bg-white text-rose-800 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-md hover:bg-white text-rose-800 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Days short names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-rose-400 uppercase tracking-wider py-1 bg-rose-50/50 rounded-lg">
            {DAYS_SHORT_PT.map((d, index) => (
              <div key={index}>{d}</div>
            ))}
          </div>

          {/* Monthly grid */}
          <div className="overflow-hidden relative">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={`${year}-${month}`}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: dir * 40,
                    opacity: 0
                  }),
                  center: {
                    x: 0,
                    opacity: 1
                  },
                  exit: (dir: number) => ({
                    x: dir * -40,
                    opacity: 0
                  })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 350, damping: 28 },
                  opacity: { duration: 0.12 }
                }}
                className="grid grid-cols-7 gap-1.5"
              >
                {dayCells.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-win-${idx}`}
                        className="aspect-square bg-rose-50/10 rounded-lg border border-transparent"
                      />
                    );
                  }

                  const dateStr = formatDateString(day);
                  const dayEvents = catholicEvents.filter((e) => isEventOnDate(e, dateStr));
                  const isSelected = selectedDay === dateStr && showOnlySelectedDay;
                  const dayIsToday = isToday(day);

                  return (
                    <div
                      key={`day-win-${day}`}
                      onClick={() => {
                        setSelectedDay(dateStr);
                        setShowOnlySelectedDay(true);
                        setTimeout(() => {
                          const target = document.getElementById('filtered-events-section');
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 80);
                      }}
                      className={`aspect-square p-1 flex flex-col justify-between rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-rose-955 text-white border-rose-955 shadow-md ring-2 ring-rose-200 ring-offset-1'
                          : dayIsToday
                          ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-150 ring-offset-1 text-rose-950'
                          : 'bg-white hover:bg-rose-50/40 border-rose-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-black flex items-center justify-center rounded-full ${
                          isSelected 
                            ? 'text-white' 
                            : dayIsToday 
                            ? 'bg-rose-600 text-white w-5 h-5 text-[10px] shadow shadow-rose-600/30' 
                            : 'text-rose-950'
                        }`}>
                          {day}
                        </span>
                      </div>

                      {/* Indicator for Events count */}
                      <div className="flex justify-center flex-wrap gap-0.5 max-h-4 overflow-hidden pt-1">
                        {dayEvents.slice(0, 3).map((e, eidx) => {
                          const style = getMovementStyle(e.movement);
                          return (
                            <span
                              key={e.id}
                              className={`w-[5px] h-[5px] rounded-full shrink-0 ${
                                isSelected ? 'bg-rose-300' : style?.colorClass || 'bg-rose-400'
                              }`}
                              title={e.title}
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[7px] font-extrabold text-rose-500 leading-none">+</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-rose-500 font-bold">
              * Toque em uma data para ver os eventos correspondentes abaixo
            </span>
            {showOnlySelectedDay && (
              <button
                onClick={() => {
                  setShowOnlySelectedDay(false);
                  setSelectedDay(null);
                }}
                className="text-[10px] decoration-double text-rose-800 hover:text-rose-600 font-black flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Ver Mês Inteiro
              </button>
            )}
          </div>
        </div>

        {/* Right Area: Catalog of events and filters listing (col-span-7) */}
        <div id="filtered-events-section" className="col-span-1 lg:col-span-7 space-y-4">

          {/* Selector de Abas do Catálogo */}
          <div className="flex bg-rose-50/40 p-1.5 rounded-2xl border border-rose-100 gap-2">
            <button
              type="button"
              id="tab-monthly-events"
              onClick={() => setEventTab('month')}
              className={`flex-1 py-2.5 text-center text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                eventTab === 'month'
                  ? 'bg-rose-950 text-white shadow-md'
                  : 'text-rose-800 hover:bg-rose-100/50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Eventos com Data</span>
            </button>
            <button
              type="button"
              id="tab-future-events"
              onClick={() => setEventTab('future')}
              className={`flex-1 py-2.5 text-center text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                eventTab === 'future'
                  ? 'bg-rose-950 text-white shadow-md'
                  : 'text-rose-800 hover:bg-rose-100/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Eventos Futuros (Sem Data)</span>
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-[8px] text-yellow-950 font-black px-2 py-0.5 rounded-full border border-white shadow-xs animate-bounce">
                NOVO
              </span>
            </button>
          </div>
          
          {/* Filter & Search Bar widgets */}
          <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search input */}
              <div className="flex-1 bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Search className="w-4 h-4 text-rose-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar evento por nome, local ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-medium text-xs text-rose-950 placeholder-rose-400"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-rose-400 hover:text-rose-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick selectivity combos */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={selectedMovement}
                onChange={(e) => setSelectedMovement(e.target.value)}
                className="bg-rose-50/50 text-rose-900 border border-rose-150 rounded-xl px-2 py-1.5 outline-none font-bold text-[10px]"
              >
                <option value="all">🛡️ Movimentos (Todos)</option>
                <option value={CatholicMovement.PAROQUIAL}>⛪ Paroquial</option>
                <option value={CatholicMovement.RCC}>🔥 RCC</option>
                <option value={CatholicMovement.EJNS}>💙 EJNS</option>
                <option value={CatholicMovement.SHALOM}>💚 Shalom</option>
                <option value={CatholicMovement.VINCENTINOS}>❤️ Vicentinos</option>
                <option value={CatholicMovement.CANCAO_NOVA}>🩵 Canção Nova</option>
                <option value={CatholicMovement.TERCO_HOMENS}>🖤 Terço dos Homens</option>
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-rose-50/50 text-rose-900 border border-rose-150 rounded-xl px-2 py-1.5 outline-none font-bold text-[10px]"
              >
                <option value="all">📍 Cidade (Todas)</option>
                {citiesList.map((city) => (
                  <option key={city} value={city}>
                    📍 {city}
                  </option>
                ))}
              </select>

              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="bg-rose-50/50 text-rose-900 border border-rose-150 rounded-xl px-2 py-1.5 outline-none font-bold text-[10px]"
              >
                <option value="all">🏷️ Tipo (Todos)</option>
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Event List Container */}
          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-rose-500 tracking-wider">
              <span>
                {eventTab === 'future'
                  ? `${filteredEvents.length} Eventos Futuros (Sem data confirmada)`
                  : `${filteredEvents.length} Eventos encontrados ${showOnlySelectedDay ? 'para a data selecionada' : 'para este mês'}`
                }
              </span>
              {eventTab === 'month' && showOnlySelectedDay && selectedDay && (
                <span className="bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md">
                  Data: {new Date(selectedDay + 'T00:00').toLocaleDateString('pt-BR', {day:'numeric', month:'short'})}
                </span>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-16 bg-white border border-rose-100 rounded-2xl space-y-4">
                <Sparkles className="w-10 h-10 text-rose-400 mx-auto" />
                <div>
                  <p className="font-extrabold text-[#5B1E31] text-xs">
                    {eventTab === 'future'
                      ? 'Nenhum outro evento de data a confirmar cadastrado com os filtros ativos.'
                      : `Nenhum evento neste filtro para ${showOnlySelectedDay ? 'esta data' : 'este mês'}.`
                    }
                  </p>
                  <p className="text-[10px] text-rose-500">Que tal ser o primeiro a catalogar um evento no botão do topo?</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const style = getMovementStyle(event.movement);
                  const isAttending = isEventInPersonalAgenda(event);

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedDetailEvent(event)}
                      className={`bg-white rounded-2xl border transition p-4 relative flex flex-col md:flex-row justify-between gap-4 items-start md:items-center cursor-pointer hover:border-rose-400 hover:shadow-2xs ${
                        isAttending
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-rose-100 hover:border-rose-200'
                      }`}
                    >
                      {/* Left: Event Core Data Info */}
                      <div className="space-y-1.5 flex-1 select-text">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] text-white uppercase font-black px-1.5 py-0.5 rounded ${style?.colorClass || 'bg-rose-700'}`}>
                            {style?.name || 'Missão'}
                          </span>
                          <span className="text-[9px] bg-rose-100 text-rose-800 font-black uppercase px-2 py-0.5 rounded-full">
                            {TIPO_OPTIONS.find((t) => t.value === event.tipo)?.label || event.tipo}
                          </span>
                          <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.startTime}h às {event.endTime}h
                          </span>
                        </div>

                        <h3 className="font-black text-rose-955 text-sm leading-tight">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-3 text-[10px] text-rose-600 font-bold">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {event.location}
                          </span>
                          <span className="bg-rose-50 px-1.5 py-0.5 rounded text-rose-750">
                            📍 {event.city}
                          </span>
                          <span className="text-rose-450">
                            📅 {getEventDateSpan(event, true)}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-[10px] text-rose-900 leading-relaxed max-w-xl font-medium pt-1">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Checkbox Attendance Switch (Sync with personal agenda) */}
                      <div className="shrink-0 w-full md:w-auto flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleParticipation(event);
                          }}
                          className={`w-full md:w-auto px-4 py-2 border rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                            isAttending
                              ? 'bg-rose-800 text-rose-100 border-rose-900 shadow-xs'
                              : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          {isAttending ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3px]" />
                              Vou Participar! (Na Agenda)
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Marcar Presença
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Validation Confirm Dialog Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fade-in text-rose-950">
          <div className="bg-[#FFFDFD] rounded-2xl border-2 border-rose-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Header Dialog */}
            <div className="bg-gradient-to-r from-red-800 to-rose-900 p-4 text-white flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-200 shrink-0" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-100">
                  Aviso de Conflito de Horário!
                </h3>
                <span className="text-[9px] text-rose-200 font-bold block">
                  Colisão detectada na sua agenda pessoal
                </span>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-5 space-y-4">
              <div className="space-y-1 bg-red-50/50 p-4 rounded-xl border border-red-100 text-xs">
                <p className="font-semibold text-rose-950 leading-relaxed">
                  Olha, você já possui uma missão ou compromisso agendado para este dia e horário na sua Agenda Pessoal:
                </p>
                <div className="py-2.5 px-3 bg-white rounded-lg border border-red-200/50 mt-2 space-y-1 block select-text">
                  <p className="font-extrabold text-rose-900">{conflictingEvent?.title}</p>
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {conflictingEvent?.startTime}h às {conflictingEvent?.endTime}h
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-rose-900 leading-relaxed font-semibold">
                <p>
                  Deseja adicionar o novo evento <strong className="text-rose-900">"{pendingAddEvent?.title}"</strong> mesmo assim?
                </p>
                <p className="text-[10px] text-rose-500 italic mt-1 font-medium">
                  * Você precisará se dividir entre os dois ou optar por um deles na hora da ação.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-rose-50 px-4 py-3 flex gap-2 justify-end border-t border-rose-100">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingAddEvent(null);
                  setConflictingEvent(null);
                }}
                className="px-3.5 py-1.5 border border-rose-300 rounded-lg text-xs font-black text-rose-800 hover:bg-rose-100 transition"
              >
                Não Adicionar
              </button>
              <button
                onClick={handleConfirmConflictOverride}
                className="px-4 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg shadow transition"
              >
                Sim, Adicionar mesmo assim!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Informative Detail Modal */}
      {selectedDetailEvent && (() => {
        const event = selectedDetailEvent;
        const style = getMovementStyle(event.movement);
        const isAttending = isEventInPersonalAgenda(event);
        let bgImage = '';
        if (event.instagramImgUrl) {
          bgImage = event.instagramImgUrl;
        } else {
          bgImage = style?.logoUrl || style?.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80';
        }

        return (
          <div className="fixed inset-0 bg-rose-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in text-rose-950">
            <div className="bg-[#FFFDFD] rounded-3xl border border-rose-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
              
              {/* Header Image with Overlays */}
              <div 
                className="h-[180px] sm:h-[220px] w-full bg-cover bg-center relative shrink-0"
                style={{ backgroundImage: `url("${bgImage}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-rose-955 via-rose-950/50 to-transparent" />
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition cursor-pointer z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Overlaid Badges and Title */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1 z-10">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-[9px] text-white uppercase font-black px-2 py-0.5 rounded shadow-xs ${style?.colorClass || 'bg-rose-700'}`}>
                      {style?.name || 'Missão'}
                    </span>
                    <span className="text-[9px] bg-white/20 text-white font-black uppercase backdrop-blur-xs px-2 py-0.5 rounded">
                      {TIPO_OPTIONS.find((t) => t.value === event.tipo)?.label || event.tipo}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-sm font-sans">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 select-text">
                {/* Details Section */}
                <div className="grid grid-cols-2 gap-3.5 bg-rose-50/30 p-3 rounded-2xl border border-rose-100/60 font-semibold">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest block font-sans">Data e Período</span>
                    <p className="text-[11px] font-black text-rose-955 flex items-center gap-1.5 pt-0.5">
                      <span className="text-sm">📅</span> {getEventDateSpan(event, true)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest block font-sans">Horário</span>
                    <p className="text-[11px] font-black text-rose-955 flex items-center gap-1.5 pt-0.5">
                      <span className="text-sm">⏱️</span> {event.startTime}h às {event.endTime}h
                    </p>
                  </div>
                  <div className="col-span-2 space-y-0.5 pt-1.5 border-t border-rose-100/50">
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest block font-sans">Localização Geral</span>
                    <p className="text-[11px] font-black text-rose-900 flex items-center gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" /> {event.location}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-0.5 pt-1 border-t border-rose-100/50">
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest block font-sans">Cidade e Região</span>
                    <p className="text-[11px] font-black text-rose-900 flex items-center gap-1.5 pt-0.5">
                      <span className="text-rose-500 text-xs">📍</span> {event.city} - Próxima de você
                    </p>
                  </div>
                </div>

                {/* Description Text Box */}
                {event.description && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest block font-sans">Sobre o Evento</span>
                    <div className="bg-white rounded-xl p-3 border border-rose-100/60 text-xs text-rose-900/90 leading-relaxed max-h-[160px] overflow-y-auto font-medium select-text">
                      {event.description}
                    </div>
                  </div>
                )}

                {/* Social Instagram Post Link if exists */}
                {event.instagramUrl && (
                  <a
                    href={event.instagramUrl}
                    target="_blank; noreferrer"
                    rel="noreferrer"
                    referrerPolicy="no-referrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl transition shadow active:scale-95 cursor-pointer text-center w-full uppercase"
                  >
                    <Instagram className="w-4 h-4 text-rose-100 animate-pulse" />
                    Ver postagem oficial no Instagram
                  </a>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-rose-50/60 px-5 py-4 border-t border-rose-100 flex gap-2 justify-between items-center sm:gap-4 shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="px-4 py-2 border border-rose-300 rounded-xl text-xs font-black text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                >
                  Fechar Detalhes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleParticipation(event);
                    // Automatically update detail modal attendee state visually
                    setTimeout(() => {
                      setSelectedDetailEvent(null);
                    }, 400);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                    isAttending
                      ? 'bg-rose-200 border border-rose-300 text-rose-900 hover:bg-rose-300'
                      : 'bg-rose-450 hover:bg-rose-500 text-white'
                  }`}
                >
                  {isAttending ? '✓ Na minha Agenda (Sair)' : '➕ Adicionar à minha Agenda'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
