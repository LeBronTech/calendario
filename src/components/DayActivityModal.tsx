/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Instagram,
  Trash2,
  Save,
  Calendar,
  Sparkles,
  Link,
  Upload,
  Tag,
  AlertTriangle,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';
import { Mission, CatholicMovement, DailyTimeConfig, RecurrenceConfig } from '../types';
import { MOVEMENT_DATA, getMovementStyle, isMissionOnDate } from '../utils/catholicData';

interface DayActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: string;
  missions: Mission[];
  onSaveMission: (mission: Partial<Mission>) => void;
  onDeleteMission: (id: string) => void;
}

const AVAILABLE_ROLES = [
  { id: 'cantar', label: 'Cantar 🎤' },
  { id: 'tocar', label: 'Tocar Instrumento 🎸' },
  { id: 'pregar', label: 'Pregar 📖' },
  { id: 'interceder', label: 'Interceder 🙏' },
  { id: 'servir', label: 'Servir / Acolher 🤝' },
];

const TIPO_OPTIONS = [
  { value: '', label: 'Sem tipo específico' },
  { value: 'vigilia', label: '🌙 Vigília' },
  { value: 'luau', label: '🪵 Luau' },
  { value: 'adoracao', label: '🙏 Adoração' },
  { value: 'retiro', label: '⛰️ Retiro' },
  { value: 'encontro', label: '👥 Encontro' },
  { value: 'acampamento', label: '⛺ Acampamento' },
  { value: 'seminario', label: '📖 Seminário' },
  { value: 'grupo', label: '🔥 Grupo de Oração' },
];

const getDatesInRange = (start: string, end?: string): string[] => {
  if (!start) return [];
  if (!end || start === end) return [start];
  
  const dates: string[] = [];
  try {
    const current = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    if (isNaN(current.getTime()) || isNaN(last.getTime())) return [start];
    if (last < current) return [start];
    
    while (current <= last) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } catch (e) {
    return [start];
  }
  return dates;
};

const getPortugueseDayLabel = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'numeric' };
    const label = d.toLocaleDateString('pt-BR', options);
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch (e) {
    return dateStr;
  }
};

export default function DayActivityModal({
  isOpen,
  onClose,
  selectedDay,
  missions,
  onSaveMission,
  onDeleteMission,
}: DayActivityModalProps) {
  // Get all missions scheduled on the selected day (including multi-day spans)
  // Overlay custom start/end times if they were configured specifically for this date
  const dayMissions = missions
    .filter((m) => isMissionOnDate(m, selectedDay))
    .map((m) => {
      if (m.dailySchedules && m.dailySchedules.length > 0) {
        const daily = m.dailySchedules.find((d) => d.dateStr === selectedDay);
        if (daily) {
          return {
            ...m,
            startTime: daily.startTime,
            endTime: daily.endTime,
          };
        }
      }
      return m;
    });

  // Convert time HH:MM to numerical minutes of the day (0 to 1440)
  const timeToMins = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
  };

  // Heuristic to check if locations are in different cities
  const areDifferentCities = (loc1: string, loc2: string): boolean => {
    if (!loc1 || !loc2) return false;

    const getCityPart = (str: string): string => {
      if (str.includes(',')) {
        return str.split(',').pop()?.trim() || '';
      }
      if (str.includes('-')) {
        return str.split('-').pop()?.trim() || '';
      }
      return str.trim();
    };

    const city1 = getCityPart(loc1).toLowerCase();
    const city2 = getCityPart(loc2).toLowerCase();

    if (city1 && city2 && city1 !== city2) {
      const generic = ['sala', 'paroquia', 'capela', 'igreja', 'altar', 'lateral', 'centro', 'comunidade', 'salao'];
      const isGeneric1 = generic.some(g => city1.includes(g));
      const isGeneric2 = generic.some(g => city2.includes(g));
      if (!isGeneric1 && !isGeneric2) {
        return true;
      }
    }

    const cities = [
      'são paulo', 'rio de janeiro', 'belo horizonte', 'cachoeira paulista', 'lorena', 'aparecida', 'guaratinguetá', 
      'curitiba', 'porto alegre', 'fortaleza', 'recife', 'salvador', 'brasília', 'campinas', 'são josé dos campos'
    ];
    
    const found1 = cities.find(c => loc1.toLowerCase().includes(c));
    const found2 = cities.find(c => loc2.toLowerCase().includes(c));

    if (found1 && found2 && found1 !== found2) {
      return true;
    }

    return false;
  };

  // Sort missions of today by startTime for the Summary list
  const sortedDayMissions = [...dayMissions].sort((a, b) => {
    const tA = a.startTime || '99:99';
    const tB = b.startTime || '99:99';
    return tA.localeCompare(tB);
  });

  const getDailyTimeStats = () => {
    const intervals = dayMissions
      .map(m => {
        if (!m.startTime) return null;
        const start = timeToMins(m.startTime);
        const end = m.endTime ? timeToMins(m.endTime) : Math.min(start + 60, 1440);
        return { start, end };
      })
      .filter(Boolean) as { start: number; end: number }[];

    if (intervals.length === 0) {
      return { occupiedMins: 0, freeMins: 1440, occupiedPct: 0, freePct: 100 };
    }

    intervals.sort((a, b) => a.start - b.start);

    const merged: { start: number; end: number }[] = [];
    let current = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next.start <= current.end) {
        current.end = Math.max(current.end, next.end);
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);

    const occupiedMins = merged.reduce((acc, interval) => acc + (interval.end - interval.start), 0);
    const freeMins = 1440 - occupiedMins;

    return {
      occupiedMins,
      freeMins,
      occupiedPct: (occupiedMins / 1440) * 100,
      freePct: (freeMins / 1440) * 100
    };
  };

  const { occupiedMins, freeMins } = getDailyTimeStats();
  const occHours = Math.floor(occupiedMins / 60);
  const occMins = occupiedMins % 60;
  const freeHours = Math.floor(freeMins / 60);
  const freeMinsRem = freeMins % 60;

  // Get all conflicts
  const getConflicts = () => {
    const conflicts: { m1: Mission; m2: Mission; sameCity: boolean }[] = [];
    const eventsWithTimes = dayMissions
      .map(m => {
        if (!m.startTime) return null;
        const start = timeToMins(m.startTime);
        const end = m.endTime ? timeToMins(m.endTime) : Math.min(start + 60, 1440);
        return { mission: m, start, end };
      })
      .filter(Boolean) as { mission: Mission; start: number; end: number }[];

    for (let i = 0; i < eventsWithTimes.length; i++) {
      for (let j = i + 1; j < eventsWithTimes.length; j++) {
        const e1 = eventsWithTimes[i];
        const e2 = eventsWithTimes[j];
        
        if (e1.start < e2.end && e2.start < e1.end) {
          const m1 = e1.mission;
          const m2 = e2.mission;
          const diffCity = areDifferentCities(m1.location || '', m2.location || '');
          conflicts.push({ m1, m2, sameCity: !diffCity });
        }
      }
    }
    return conflicts;
  };

  const conflictsList = getConflicts();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [movement, setMovement] = useState<string>(CatholicMovement.PAROQUIAL);
  const [useCustomMovement, setUseCustomMovement] = useState(false);
  const [customMovementName, setCustomMovementName] = useState('');
  const [movementLogoUrl, setMovementLogoUrl] = useState('');
  
  const [dateStr, setDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramImgUrl, setInstagramImgUrl] = useState('');
  const [tipo, setTipo] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [observation, setObservation] = useState('');
  const [status, setStatus] = useState<Mission['status']>('preparing');
  const [dailySchedules, setDailySchedules] = useState<DailyTimeConfig[]>([]);

  // Recurrence states
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceConfig['frequency']>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [newCustomDate, setNewCustomDate] = useState('');

  // Reset active card index when selectedDay changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsEditing(false);
    setIsCreatingNew(false);
  }, [selectedDay, isOpen]);

  // Sync Form fields with currently viewed mission card
  useEffect(() => {
    if (dayMissions.length > 0 && !isCreatingNew) {
      const activeMission = dayMissions[currentIndex];
      const realMission = missions.find(m => m.id === activeMission?.id) || activeMission;
      if (activeMission && realMission) {
        setTitle(realMission.title || '');
        setDateStr(realMission.dateStr || selectedDay);
        setEndDateStr(realMission.endDateStr || '');
        setStartTime(realMission.startTime || '');
        setEndTime(realMission.endTime || '');
        setLocation(realMission.location || '');
        setInstagramUrl(realMission.instagramUrl || '');
        setInstagramImgUrl(realMission.instagramImgUrl || '');
        setSelectedRoles(realMission.roles || []);
        setObservation(realMission.observation || '');
        setStatus(realMission.status || 'preparing');
        setTipo(realMission.tipo || '');
        setMovementLogoUrl(realMission.movementLogoUrl || '');
        setDailySchedules(realMission.dailySchedules || []);

        if (realMission.recurrence) {
          setRecurrenceFreq(realMission.recurrence.frequency);
          setRecurrenceDays(realMission.recurrence.daysOfWeek || []);
          setRecurrenceEndDate(realMission.recurrence.endDate || '');
          setCustomDates(realMission.recurrence.customDates || []);
        } else {
          setRecurrenceFreq('none');
          setRecurrenceDays([]);
          setRecurrenceEndDate('');
          setCustomDates([]);
        }

        const isStandard = Object.values(CatholicMovement).includes(realMission.movement as CatholicMovement);
        if (isStandard) {
          setMovement(realMission.movement);
          setUseCustomMovement(false);
          setCustomMovementName('');
        } else {
          setMovement('custom');
          setUseCustomMovement(true);
          setCustomMovementName(realMission.movement || '');
        }
      }
    } else if (isCreatingNew) {
      // Clean form for brand new event slot
      setTitle('');
      setMovement(CatholicMovement.PAROQUIAL);
      setUseCustomMovement(false);
      setCustomMovementName('');
      setMovementLogoUrl('');
      setDateStr(selectedDay);
      setEndDateStr('');
      setStartTime('19:00');
      setEndTime('20:30');
      setLocation('');
      setInstagramUrl('');
      setInstagramImgUrl('');
      setTipo('');
      setSelectedRoles([]);
      setObservation('');
      setStatus('preparing');
      setDailySchedules([]);
      setRecurrenceFreq('none');
      setRecurrenceDays([]);
      setRecurrenceEndDate('');
      setCustomDates([]);
    }
  }, [currentIndex, selectedDay, isCreatingNew, missions, isOpen]);

  // Sync dailySchedules whenever dates or standard times change
  useEffect(() => {
    if (!dateStr) {
      setDailySchedules([]);
      return;
    }

    const dates = getDatesInRange(dateStr, endDateStr);

    if (dates.length > 1) {
      setDailySchedules((prev) => {
        return dates.map((d) => {
          const existing = prev.find((item) => item.dateStr === d);
          if (existing) return existing;
          return {
            dateStr: d,
            startTime: startTime || '19:00',
            endTime: endTime || '20:30',
            active: true
          };
        });
      });
    } else {
      setDailySchedules([]);
    }
  }, [dateStr, endDateStr, startTime, endTime]);

  if (!isOpen) return null;

  const toggleDayOfWeek = (day: number) => {
    setRecurrenceDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addCustomDate = () => {
    if (newCustomDate && !customDates.includes(newCustomDate)) {
      setCustomDates(prev => [...prev, newCustomDate].sort());
      setNewCustomDate('');
    }
  };

  const removeCustomDate = (date: string) => {
    setCustomDates(prev => prev.filter(d => d !== date));
  };

  const handleNext = () => {
    if (currentIndex < dayMissions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsEditing(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsEditing(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetType: 'logo' | 'instagram') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (targetType === 'logo') {
        setMovementLogoUrl(base64);
      } else {
        setInstagramImgUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMovementSelectChange = (val: string) => {
    setMovement(val);
    if (val === 'custom') {
      setUseCustomMovement(true);
    } else {
      setUseCustomMovement(false);
      setMovementLogoUrl('');
    }
  };

  const handleSave = () => {
    const finalMovement = useCustomMovement ? (customMovementName.trim() || 'Customizado') : movement;

    const payload: Partial<Mission> = {
      title: title.trim() || 'Nova Missão',
      movement: finalMovement,
      dateStr,
      endDateStr: endDateStr || undefined,
      startTime,
      endTime,
      location: location.trim(),
      instagramUrl: instagramUrl.trim(),
      instagramImgUrl: instagramImgUrl || undefined,
      movementLogoUrl: useCustomMovement && movementLogoUrl ? movementLogoUrl : undefined,
      tipo: tipo || undefined,
      roles: selectedRoles,
      observation: observation.trim(),
      status,
      checklist: [],
      dailySchedules: endDateStr && endDateStr !== dateStr ? dailySchedules : undefined,
      recurrence: recurrenceFreq !== 'none' ? {
        frequency: recurrenceFreq,
        daysOfWeek: recurrenceDays.length > 0 ? recurrenceDays : undefined,
        customDates: customDates.length > 0 ? customDates : undefined,
        endDate: recurrenceEndDate || undefined,
      } : undefined,
    };

    if (isCreatingNew) {
      onSaveMission(payload);
      setIsCreatingNew(false);
      setTimeout(() => {
        setCurrentIndex(0);
      }, 100);
    } else {
      const currentId = dayMissions[currentIndex]?.id;
      if (currentId) {
        payload.id = currentId;
        onSaveMission(payload);
        setIsEditing(false);
      }
    }
  };

  const handleDelete = () => {
    console.log('DayActivityModal handleDelete clicked');
    const currentId = dayMissions[currentIndex]?.id;
    console.log('Current ID to delete:', currentId);
    console.log('Available dayMissions:', dayMissions);
    console.log('Current Index:', currentIndex);
    if (currentId) {
      console.log('Calling onDeleteMission with ID:', currentId);
      onDeleteMission(currentId);
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else {
        setCurrentIndex(0);
      }
      setIsEditing(false);
    } else {
      console.log('No current ID found to delete.');
    }
  };

  const formattedDayText = new Date(selectedDay + 'T00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  const activeMission = dayMissions[currentIndex];
  const activeStyle = activeMission ? getMovementStyle(activeMission.movement) : getMovementStyle(movement);

  return (
    <div className="fixed inset-0 bg-purple-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs text-purple-950">
      {/* Modal Container in Purple Styling */}
      <div className="bg-[#FAF8FF] rounded-2xl border-1.5 border-purple-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-purple-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Eu Missionário &bull; Agenda Diária
              </h3>
              <p className="text-[10px] text-purple-100 font-bold capitalize mt-0.5">{formattedDayText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-950/60 text-purple-100 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {dayMissions.length === 0 && !isCreatingNew ? (
            /* Placeholder for Empty Day */
            <div className="text-center py-10 px-4 border border-dashed border-purple-200 rounded-xl bg-purple-50/50 space-y-4">
              <Sparkles className="w-8 h-8 text-purple-500 mx-auto" />
              <div>
                <p className="text-xs text-purple-900 font-bold">Nenhum evento agendado para este dia.</p>
                <p className="text-[10px] text-purple-600 mt-1">Deseja cadastrar uma missão com data rápida no Instagram, tarefas de música, pregação ou intercessão?</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="mx-auto bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Evento
              </button>
            </div>
          ) : isCreatingNew || isEditing ? (
            /* Editing or Creating Form view (All fields optional!) */
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <h4 className="font-extrabold text-purple-950 text-xs flex items-center gap-1">
                  {isCreatingNew ? '💡 Nova Missão Opcional' : '🛠️ Ajustando detalhes pastorais'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreatingNew(false);
                  }}
                  className="text-[10px] text-purple-600 hover:text-purple-800 font-bold underline"
                >
                  Voltar para Visualização
                </button>
              </div>

              {/* Title option */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-purple-600 block">Título do Evento</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treinamento de Canto ou Missa Festiva"
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-950 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Movement Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Movimento Organizador</label>
                  <select
                    value={movement}
                    onChange={(e) => handleMovementSelectChange(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-800 text-xs"
                  >
                    {Object.entries(MOVEMENT_DATA).map(([key, info]) => (
                      <option key={key} value={key}>
                        ⛪ {info.name}
                      </option>
                    ))}
                    <option value="custom">✨ Outro Movimento (Digitar...)</option>
                  </select>
                </div>

                {/* Optional Tipo Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tipo de Evento (Opcional)
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-800 text-xs"
                  >
                    {TIPO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom movement details */}
              {useCustomMovement && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-purple-700 block">Nome do Movimento</label>
                      <input
                        type="text"
                        value={customMovementName}
                        onChange={(e) => setCustomMovementName(e.target.value)}
                        placeholder="Ex: Grupo de Casais"
                        className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-purple-700 block">Logo (Upload)</label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-[11px] text-purple-700 hover:bg-purple-100 font-bold flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Enviar Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'logo')}
                            className="hidden"
                          />
                        </label>
                        {movementLogoUrl && (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-purple-300 bg-white">
                            <img src={movementLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Dates */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Data de Início</label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none font-bold text-purple-850 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Data de Término (Opcional)</label>
                  <input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none font-bold text-purple-850 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Time pickers */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Horário Início</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none font-bold text-purple-850 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Horário Término</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none font-bold text-purple-850 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Status da Ação</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Mission['status'])}
                    className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-800 text-xs"
                  >
                    <option value="preparing">⚙️ Em Preparação</option>
                    <option value="confirmed">✅ Confirmado (Divulgado)</option>
                    <option value="completed">🕊️ Concluído</option>
                    <option value="backlog">💡 Ideia / Sem data</option>
                  </select>
                </div>
              </div>

              {/* Horários e Atividade por Dia (Multi-Day Events) */}
              {endDateStr && endDateStr !== dateStr && dailySchedules.length > 0 && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-150 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
                      📅 Horários e Atividade por Dia do Evento
                    </span>
                    <span className="text-[9px] bg-purple-200 text-purple-800 font-extrabold px-1.5 py-0.5 rounded">
                      {dailySchedules.length} Dias
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-500 leading-normal">
                    Determine horários de início e término específicos para cada dia. Desative os dias em que não houver atividade (deixando-os livres/vagos).
                  </p>

                  <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                    {dailySchedules.map((schedule) => {
                      const dayLabel = getPortugueseDayLabel(schedule.dateStr);
                      return (
                        <div
                          key={schedule.dateStr}
                          className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                            schedule.active
                              ? 'bg-white border-purple-200 shadow-2xs'
                              : 'bg-purple-100/40 border-purple-150/40 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${schedule.active ? 'bg-purple-600' : 'bg-purple-300'}`} />
                              {dayLabel}
                            </span>
                            
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={schedule.active}
                                onChange={(e) => {
                                  setDailySchedules((prev) =>
                                    prev.map((item) => (item.dateStr === schedule.dateStr ? { ...item, active: e.target.checked } : item))
                                  );
                                }}
                                className="w-3.5 h-3.5 accent-purple-600 rounded"
                              />
                              <span className="text-[9px] font-black uppercase text-purple-600 select-none">
                                Ativo neste dia
                              </span>
                            </label>
                          </div>

                          {schedule.active ? (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-extrabold uppercase text-purple-500">Início</label>
                                <input
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(e) => {
                                    setDailySchedules((prev) =>
                                      prev.map((item) => (item.dateStr === schedule.dateStr ? { ...item, startTime: e.target.value } : item))
                                    );
                                  }}
                                  className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-bold text-purple-850 outline-none focus:border-purple-500"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-extrabold uppercase text-purple-500">Término</label>
                                <input
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(e) => {
                                    setDailySchedules((prev) =>
                                      prev.map((item) => (item.dateStr === schedule.dateStr ? { ...item, endTime: e.target.value } : item))
                                    );
                                  }}
                                  className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-bold text-purple-850 outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="py-1 px-2.5 bg-slate-100 rounded-lg text-[9.5px] italic text-slate-500 font-bold">
                              ✨ Horário livre neste dia — Outras missões podem ser agendadas!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Location & Instagram Link Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block">Localização / Paróquia</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Altar principal, Ginásio"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 font-semibold text-purple-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-purple-500" /> Post do Instagram (Link ou Imagem)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="Ex: https://instagram.com/p/..."
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 text-purple-800 text-xs font-semibold"
                    />

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-white border border-purple-250 rounded-lg px-2.5 py-1 text-[10px] text-purple-700 hover:bg-purple-100 font-bold flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Fazer Upload do Card
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'instagram')}
                          className="hidden"
                        />
                      </label>
                      {instagramImgUrl && (
                        <span className="text-[10px] text-purple-600 font-bold">✓ Imagem Selecionada</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase text-purple-600 block">
                  O que eu vou fazer neste evento? (Checklist de Atuação)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const checked = selectedRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                          checked
                            ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-2xs'
                            : 'bg-white border-purple-100 text-purple-700 hover:bg-purple-50/50'
                        }`}
                      >
                        <span className="truncate">{role.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="w-3.5 h-3.5 accent-purple-600 rounded select-none pointer-events-none"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observation Box */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-purple-600 block">Observações / Notas Pessoais</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Escreva anotações de liturgia, músicas..."
                  rows={3}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-xs text-purple-800 leading-relaxed"
                />
              </div>

              {/* Recurrence Options */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                <label className="text-[10px] font-black uppercase text-purple-700 block">Repetir Evento (Recorrência)</label>
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                  className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
                >
                  <option value="none">Não repetir</option>
                  <option value="weekly">Semanalmente (Escolha os dias)</option>
                  <option value="custom">Datas Específicas (Duplicar para outras datas)</option>
                </select>

                {recurrenceFreq === 'weekly' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-purple-600 block">Dias da Semana</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDayOfWeek(idx)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            recurrenceDays.includes(idx)
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1 mt-2">
                      <label className="text-[9px] font-black uppercase text-purple-600 block">Até quando repetir? (Opcional)</label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
                      />
                    </div>
                  </div>
                )}

                {recurrenceFreq === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-purple-600 block">Adicionar Outras Datas</label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={newCustomDate}
                        onChange={(e) => setNewCustomDate(e.target.value)}
                        className="flex-1 bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={addCustomDate}
                        className="px-2.5 py-1 bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {customDates.map(date => (
                        <div key={date} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-[10px] font-bold border border-purple-200">
                          <span>{date}</span>
                          <button type="button" onClick={() => removeCustomDate(date)} className="text-purple-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Mode Save Buttons (Compact size!) */}
              <div className="flex gap-1.5 justify-end pt-2">
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="mr-auto px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreatingNew(false);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-purple-250 hover:bg-purple-150 font-bold text-[11px] text-purple-850 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow transition"
                >
                  <Save className="w-3 h-3" /> Gravar
                </button>
              </div>
            </div>
          ) : (
            /* Visualizing Mode Card Gallery with Lateral Navigation (Carrossel) */
            <div className="space-y-4">
              
              {/* Chronological Summary & 24h Timeline Track Block */}
              <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                    📊 Linha do Tempo e Resumo do Dia
                  </h4>
                  <span className="text-[10px] text-purple-600 font-bold">
                    ⏱️ {occHours}h {occMins}m Ocupado | 🍃 {freeHours}h {freeMinsRem}m Livre
                  </span>
                </div>

                {/* The 24h Timeline Bar */}
                <div className="space-y-1.5">
                  <div className="relative h-7 bg-purple-100/70 border border-purple-200/60 rounded-xl flex items-center select-none overflow-hidden min-w-[200px]">
                    {/* Blurred Shalom logo background underlay (to avoid interfering with readability) */}
                    <div
                      className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-[0.25] pointer-events-none"
                      style={{
                        backgroundImage: 'url("https://iili.io/B51WMLF.jpg")',
                        filter: 'blur(0.5px)'
                      }}
                    />

                    {/* Hourly vertical guide marks */}
                    {[0, 4, 8, 12, 16, 20, 24].map((h) => {
                      const leftPct = (h / 24) * 100;
                      return (
                        <div
                          key={h}
                          className="absolute h-full border-l border-purple-200/40 z-10"
                          style={{ left: `${leftPct}%` }}
                        />
                      );
                    })}

                    {/* Mission blocks plotted */}
                    {dayMissions.map((m) => {
                      if (!m.startTime) return null;
                      const startM = timeToMins(m.startTime);
                      const endM = m.endTime ? timeToMins(m.endTime) : Math.min(startM + 60, 1440);
                      const leftPct = (startM / 1440) * 100;
                      const widthPct = Math.max(((endM - startM) / 1440) * 100, 4); // min 4% width so short events are selectable
                      const style = getMovementStyle(m.movement);
                      const isCurrentM = m.id === dayMissions[currentIndex]?.id;

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            const foundIdx = dayMissions.findIndex((dm) => dm.id === m.id);
                            if (foundIdx !== -1) setCurrentIndex(foundIdx);
                          }}
                          className={`absolute top-0 bottom-0 rounded-lg text-[8px] font-black font-mono text-white flex items-center justify-center p-0.5 border cursor-pointer select-none transition ${
                            style?.colorClass || 'bg-purple-600'
                          } ${
                            isCurrentM
                              ? 'ring-2 ring-purple-900 border-white z-20 scale-y-105 shadow-md'
                              : 'opacity-80 hover:opacity-100 hover:z-10'
                          }`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`${m.title} (${m.startTime} - ${m.endTime})`}
                        >
                          {m.startTime}
                        </div>
                      );
                    })}
                  </div>

                  {/* 24h text layout indicators */}
                  <div className="flex justify-between text-[8px] font-mono font-bold text-purple-400 select-none px-1">
                    <span>00h</span>
                    <span>04h</span>
                    <span>08h</span>
                    <span>12h</span>
                    <span>16h</span>
                    <span>20h</span>
                    <span>24h</span>
                  </div>
                </div>

                {/* Orderly chronological summary and selection clicks */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-500 block">
                    Eventos Cronológicos (clique para expandir abaixo):
                  </span>
                  <div className="divide-y divide-purple-150/40 max-h-32 overflow-y-auto space-y-1">
                    {sortedDayMissions.map((m) => {
                      const style = getMovementStyle(m.movement);
                      const isCurrent = m.id === dayMissions[currentIndex]?.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            const idx = dayMissions.findIndex((dm) => dm.id === m.id);
                            if (idx !== -1) setCurrentIndex(idx);
                          }}
                          className={`py-2 px-3 text-xs flex items-center justify-between gap-3 cursor-pointer transition rounded-xl ${
                            isCurrent
                              ? 'bg-purple-100 text-purple-950 font-black border border-purple-200/50 shadow-xs'
                              : 'hover:bg-purple-50/70 text-purple-955'
                          }`}
                        >
                          {/* Logo e nome do Movimento (Logotipo) */}
                          <div className="flex items-center gap-2">
                            {style?.logoUrl ? (
                              <img
                                src={style.logoUrl}
                                alt={style.name}
                                className="w-5.5 h-5.5 rounded-full object-cover border border-purple-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-5.5 h-5.5 rounded-full bg-purple-100 flex items-center justify-center text-xs border border-purple-200">
                                ⛪
                              </div>
                            )}
                            <span className="text-[10px] uppercase font-black text-purple-900 tracking-wider">
                              {style?.name || 'Paroquial'}
                            </span>
                          </div>
                          
                          {/* Horário (Time) do Evento do Dia */}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-mono text-xs font-bold text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-100 shadow-3xs">
                              {m.startTime || '--:--'} {m.endTime ? `às ${m.endTime}` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transport & Conflict Warning alerts list */}
                {conflictsList.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-purple-100/40">
                    {conflictsList.map((conflict, idx) => (
                      <div
                        key={idx}
                        className="bg-red-50/75 border border-red-200/60 rounded-xl p-3 text-xs text-red-950 space-y-1 block select-text"
                      >
                        <div className="flex items-center gap-2 text-red-800 font-extrabold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>Conflito de Horário!</span>
                        </div>

                        <p className="text-[10px] text-red-900 leading-relaxed font-semibold">
                          Múltiplos compromissos se chocam neste dia: <strong className="text-red-950">"{conflict.m1.title}"</strong> e <strong className="text-red-950">"{conflict.m2.title}"</strong>.
                        </p>

                        {conflict.sameCity ? (
                          <div className="p-1 px-2 bg-emerald-50 border border-emerald-100 rounded text-[9px] text-emerald-990 font-black inline-block">
                            📍 Mesma cidade: você consegue se dividir entre ambos!
                          </div>
                        ) : (
                          <div className="p-2 bg-red-100/80 border border-red-200 rounded text-[9px] text-red-950 font-black block leading-relaxed">
                            ⚠️ Locais em cidades distintas! '{conflict.m1.location}' e '{conflict.m2.location}'. O tempo de deslocamento tornará inviável participar de ambos, escolha apenas um!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lateral Carousel Swiper index tracker bar */}
              {dayMissions.length > 1 && (
                <div className="flex items-center justify-between bg-purple-100/50 rounded-xl px-3 py-1 select-none text-purple-950 font-bold">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1 hover:bg-purple-200 disabled:opacity-40 rounded-lg text-purple-800 transition disabled:cursor-not-allowed"
                    title="Evento Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black uppercase text-purple-800">
                    Evento {currentIndex + 1} de {dayMissions.length} do dia
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === dayMissions.length - 1}
                    className="p-1 hover:bg-purple-200 disabled:opacity-40 rounded-lg text-purple-800 transition disabled:cursor-not-allowed"
                    title="Próximo Evento"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Banner of dynamic Instagram Image first if uploaded */}
              {activeMission?.instagramImgUrl ? (
                <div className="w-full h-32 md:h-40 relative rounded-xl overflow-hidden bg-purple-955 border border-purple-150 shrink-0">
                  <img src={activeMission.instagramImgUrl} alt="Mídia do Post" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-[9px] uppercase font-black tracking-widest bg-purple-700 text-white px-2 py-0.5 rounded">
                      Imagem Associada
                    </span>
                  </div>
                </div>
              ) : activeMission?.instagramUrl ? (
                (() => {
                  const getEmbedUrl = (url: string) => {
                    if (!url) return null;
                    const match = url.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([A-Za-z0-9_-]+)/);
                    if (match && match[1]) {
                      return `https://www.instagram.com/p/${match[1]}/embed`;
                    }
                    if (url.includes('instagram.com')) {
                      const cleanUrl = url.split('?')[0];
                      const withSlash = cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/';
                      return `${withSlash}embed`;
                    }
                    return null;
                  };

                  const embedUrl = getEmbedUrl(activeMission.instagramUrl);

                  if (embedUrl) {
                    return (
                      <div className="w-full bg-white rounded-2xl overflow-hidden border border-purple-150 shadow-sm shrink-0 flex flex-col items-center">
                        <iframe
                          src={embedUrl}
                          className="w-full min-h-[440px] md:min-h-[480px]"
                          frameBorder="0"
                          scrolling="no"
                          allowtransparency="true"
                          allow="encrypted-media"
                          title="Preview do Post"
                        />
                      </div>
                    );
                  }
                  return null;
                })()
              ) : (
                <div className="w-full h-32 md:h-40 relative rounded-xl overflow-hidden bg-gradient-to-r from-rose-900 to-purple-950 border border-purple-200 shrink-0 flex items-center justify-center p-4">
                  {getMovementStyle(activeMission?.movement)?.logoUrl ? (
                    <img
                      src={getMovementStyle(activeMission?.movement).logoUrl}
                      alt="Logo do Movimento"
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md z-10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-2xl z-10 text-white">
                      ⛪
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute bottom-2 left-3 z-10">
                    <span className="text-[9px] uppercase font-black tracking-widest bg-rose-700 text-white px-2 py-0.5 rounded">
                      Movimento: {getMovementStyle(activeMission?.movement)?.name || 'Paroquial'}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Card View */}
              <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-4">
                
                {/* Event header and banner */}
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-purple-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      
                      {/* Logo image representation in title row if customized */}
                      {activeMission?.movementLogoUrl && (
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-purple-300 bg-white inline-block">
                          <img src={activeMission.movementLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${activeStyle?.colorClass}`}>
                        ⛪ {activeStyle?.name}
                      </span>

                      {/* Display Tipo badge option */}
                      {activeMission?.tipo && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-black uppercase py-0.5">
                          {TIPO_OPTIONS.find(o => o.value === activeMission.tipo)?.label || activeMission.tipo}
                        </span>
                      )}

                      {/* Multiday span text indicator */}
                      {activeMission?.endDateStr && activeMission.endDateStr !== activeMission.dateStr && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                          Multi-Dias ({new Date(activeMission.dateStr + 'T00:00').toLocaleDateString('pt-BR', {day:'numeric', month:'numeric'})} a {new Date(activeMission.endDateStr + 'T00:00').toLocaleDateString('pt-BR', {day:'numeric', month:'numeric'})})
                        </span>
                      )}

                      {activeMission?.startTime && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {activeMission.startTime} {activeMission.endTime ? `às ${activeMission.endTime}` : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-purple-950 leading-tight text-base mt-1.5">
                      {activeMission?.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Synchronized indicator */}
                    {activeMission?.googleEventId ? (
                      <span className="text-[8px] tracking-wide font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded">
                        Google
                      </span>
                    ) : (
                      <span className="text-[8px] tracking-wide font-bold bg-purple-50 border border-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Info block cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-purple-950">
                  
                  {/* Location block */}
                  {activeMission?.location && (
                    <div className="bg-purple-50/55 p-2.5 rounded-xl border border-purple-100 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-black text-purple-400 block">Local</span>
                        <span className="font-bold text-purple-950 leading-tight block">{activeMission.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Instagram post integration layout */}
                  {activeMission?.instagramUrl && (
                    <div className="bg-purple-50/55 p-2.5 rounded-xl border border-purple-100 flex items-start gap-2">
                      <Instagram className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <div className="overflow-hidden w-full">
                        <span className="text-[10px] uppercase font-black text-purple-400 block">Post de Instagram</span>
                        <a
                          href={activeMission.instagramUrl}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="font-bold text-purple-700 hover:underline leading-tight block truncate flex items-center gap-0.5"
                        >
                          Ir para o Post <Link className="w-3 h-3 truncate inline ml-0.5" />
                        </a>
                      </div>
                    </div>
                  )}

                </div>

                {/* "O que eu vou fazer" Checklist selection view (Display mode) */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-black text-purple-400 block tracking-wider font-extrabold">
                    Minha Atuação no Evento
                  </span>
                  {activeMission?.roles && activeMission.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeMission.roles.map((roleId) => {
                        const findRole = AVAILABLE_ROLES.find((r) => r.id === roleId);
                        return (
                          <span
                            key={roleId}
                            className="bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-3xs"
                          >
                            {findRole?.label || roleId}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-purple-400 italic">
                      Nenhuma atuação selecionada para você nesta missão. Toque em Editar para configurar.
                    </p>
                  )}
                </div>

                {/* Core description/details block */}
                {activeMission?.description && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-purple-400 block tracking-wider font-extrabold">
                      Descrição do Evento
                    </span>
                    <p className="text-xs text-purple-950 leading-relaxed bg-[#FAF8FF] p-2.5 rounded-xl border border-purple-100">
                      {activeMission.description}
                    </p>
                  </div>
                )}

                {/* Observations diary section */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-black text-purple-400 block tracking-wider font-extrabold">
                    Observações & Anotações Litúrgicas
                  </span>
                  {activeMission?.observation ? (
                    <p className="text-xs text-purple-950 bg-purple-50/50 p-3 rounded-xl border border-purple-150 italic leading-relaxed whitespace-pre-wrap">
                      📝 {activeMission.observation}
                    </p>
                  ) : (
                    <p className="text-[11px] text-purple-400 italic">
                      Nenhuma observação ou anotação pessoal guardada nesta missão.
                    </p>
                  )}
                </div>

              </div>

              {/* View mode footer actions wrapper with shrunken compact buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-650 transition"
                  title="Remover evento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 font-bold text-[11px] text-purple-800 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Outro Evento
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 font-extrabold text-[11px] text-white flex items-center gap-1 shadow transition"
                  >
                    Editar Detalhes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footers */}
        <div className="bg-[#F5EEFD] border-t border-purple-150 p-2.5 px-4 flex justify-between items-center text-[9px] text-purple-600 font-bold shrink-0">
          <span>«O Espírito do Senhor está sobre mim, porque ele me consagrou...» Lc 4,18</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-purple-200 hover:bg-purple-300 font-black rounded-lg text-purple-900 transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
