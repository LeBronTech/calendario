/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Save, Bookmark, Instagram, Upload, Trash2, Tag } from 'lucide-react';
import { Mission, CatholicMovement, DailyTimeConfig, RecurrenceConfig } from '../types';
import { getMovementStyle, getSortedMovements, getAllMovements } from '../utils/catholicData';
import ImagePreviewModal from './ImagePreviewModal';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: Partial<Mission>, applyToSeries?: boolean) => void;
  onDelete?: (id: string) => void;
  initialDate?: string;
  editMission?: Mission | null;
  missions?: Mission[];
}

const AVAILABLE_ROLES = [
  { id: 'cantar', label: 'Cantar 🎤' },
  { id: 'tocar', label: 'Tocar Instrumento 🎸' },
  { id: 'pregar', label: 'Pregar 📖' },
  { id: 'interceder', label: 'Interceder 🙏' },
  { id: 'servir', label: 'Servir / Acolher 🤝' },
];

const TIPO_OPTIONS = [
  { value: '', label: 'Selecione o Tipo (Opcional)' },
  { value: 'acampamento', label: '⛺ Acampamento / Fest' },
  { value: 'adoracao', label: '🙏 Adoração' },
  { value: 'encontro', label: '👥 Encontro' },
  { value: 'ensaio', label: '🎵 Ensaio' },
  { value: 'evangelizacao', label: '📢 Evangelização' },
  { value: 'grupo', label: '🔥 Grupo de Oração' },
  { value: 'luau', label: '🪵 Luau' },
  { value: 'missa', label: '⛪ Missa' },
  { value: 'missao', label: '✝️ Missão' },
  { value: 'retiro', label: '⛰️ Retiro' },
  { value: 'reuniao', label: '💼 Reunião' },
  { value: 'seminario', label: '📖 Seminário / Formação' },
  { value: 'terco', label: '📿 Terço' },
  { value: 'vigilia', label: '🌙 Vigília' },
];

const AVAILABLE_COLORS = [
  { class: 'bg-violet-600', label: 'Roxo Paroquial' },
  { class: 'bg-amber-500', label: 'Amarelo RCC' },
  { class: 'bg-orange-500', label: 'Laranja Segue-me' },
  { class: 'bg-blue-500', label: 'Azul EJNS' },
  { class: 'bg-indigo-600', label: 'Índigo JSC' },
  { class: 'bg-emerald-600', label: 'Verde Shalom' },
  { class: 'bg-green-600', label: 'Verde Claro' },
  { class: 'bg-red-500', label: 'Vermelho Vicentinos' },
  { class: 'bg-rose-500', label: 'Rosa EJC' },
  { class: 'bg-pink-600', label: 'Rosa Intenso' },
  { class: 'bg-cyan-500', label: 'Ciano Canção Nova' },
  { class: 'bg-teal-600', label: 'Teal Celestial' },
  { class: 'bg-slate-700', label: 'Cinza Terço dos Homens' },
  { class: 'bg-neutral-800', label: 'Preto / Escuro' },
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

export default function MissionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  editMission,
  missions = [],
}: MissionModalProps) {
  const [title, setTitle] = useState('');
  const [isTitleEditedByUser, setIsTitleEditedByUser] = useState(false);
  const [movement, setMovement] = useState<string>(CatholicMovement.PAROQUIAL);
  const [useCustomMovement, setUseCustomMovement] = useState(false);
  const [customMovementName, setCustomMovementName] = useState('');
  const [movementLogoUrl, setMovementLogoUrl] = useState('');
  
  const [dateStr, setDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramImgUrl, setInstagramImgUrl] = useState('');
  const [tipo, setTipo] = useState('');
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [observation, setObservation] = useState('');
  const [status, setStatus] = useState<Mission['status']>('preparing');
  const [dailySchedules, setDailySchedules] = useState<DailyTimeConfig[]>([]);

  // Preview Image state
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);
  const [previewImgTitle, setPreviewImgTitle] = useState<string | undefined>();

  // Recurrence states
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceConfig['frequency']>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [newCustomDate, setNewCustomDate] = useState('');

  // Color configuration states
  const [movementColors, setMovementColors] = useState<Record<string, string>>({});
  const [selectedColorClass, setSelectedColorClass] = useState<string>('bg-purple-600');

  // Check if editing a series event
  const matchingSeriesEvents = editMission && missions 
    ? missions.filter(m => 
        m.id !== editMission.id &&
        m.title === editMission.title &&
        m.movement === editMission.movement &&
        m.startTime === editMission.startTime
      )
    : [];
  const isSeries = matchingSeriesEvents.length > 0;

  // Load custom movement colors map and listen for real-time changes
  useEffect(() => {
    const handleReload = () => {
      const savedColors = localStorage.getItem('catholic_movement_colors_maria');
      if (savedColors) {
        try {
          setMovementColors(JSON.parse(savedColors));
        } catch (e) {
          console.error('Erro ao ler cores de movimentos:', e);
        }
      }
    };

    if (isOpen) {
      handleReload();
    }

    window.addEventListener('customMovementsChanged', handleReload);
    return () => window.removeEventListener('customMovementsChanged', handleReload);
  }, [isOpen]);

  // Sync selectedColorClass when movement, useCustomMovement, customMovementName or movementColors change
  useEffect(() => {
    const currentMovement = useCustomMovement ? (customMovementName.trim() || 'Customizado') : movement;
    if (currentMovement) {
      const savedColor = movementColors[currentMovement];
      if (savedColor) {
        setSelectedColorClass(savedColor);
      } else {
        const defaultStyle = getMovementStyle(currentMovement);
        setSelectedColorClass(defaultStyle?.colorClass || 'bg-purple-600');
      }
    }
  }, [movement, useCustomMovement, customMovementName, movementColors]);

  // Load editing state or reset
  useEffect(() => {
    setIsTitleEditedByUser(false);
    if (editMission) {
      setTitle(editMission.title || '');
      setDateStr(editMission.dateStr || '');
      setEndDateStr(editMission.endDateStr || '');
      setStartTime(editMission.startTime || '19:00');
      setEndTime(editMission.endTime || '20:30');
      setLocation(editMission.location || '');
      setDescription(editMission.description || '');
      setInstagramUrl(editMission.instagramUrl || '');
      setInstagramImgUrl(editMission.instagramImgUrl || '');
      setSelectedRoles(editMission.roles || []);
      setObservation(editMission.observation || '');
      setStatus(editMission.status || 'preparing');
      setTipo(editMission.tipo || '');
      setMovementLogoUrl(editMission.movementLogoUrl || '');
      setDailySchedules(editMission.dailySchedules || []);

      if (editMission.cardColor) {
        setSelectedColorClass(editMission.cardColor);
      }

      if (editMission.recurrence) {
        setRecurrenceFreq(editMission.recurrence.frequency);
        setRecurrenceDays(editMission.recurrence.daysOfWeek || []);
        setRecurrenceEndDate(editMission.recurrence.endDate || '');
        setCustomDates(editMission.recurrence.customDates || []);
      } else {
        setRecurrenceFreq('none');
        setRecurrenceDays([]);
        setRecurrenceEndDate('');
        setCustomDates([]);
      }
      
      // Check if standard movement or custom
      const isStandard = Object.keys(getAllMovements()).includes(editMission.movement);
      if (isStandard) {
        setMovement(editMission.movement);
        setUseCustomMovement(false);
        setCustomMovementName('');
      } else {
        setMovement('custom');
        setUseCustomMovement(true);
        setCustomMovementName(editMission.movement || '');
      }
    } else {
      setTitle('');
      setMovement(CatholicMovement.PAROQUIAL);
      setUseCustomMovement(false);
      setCustomMovementName('');
      setMovementLogoUrl('');
      setDateStr(initialDate || '');
      setEndDateStr('');
      
      // Check if Sunday date to default Sunday Mass time (17h as 18h30)
      const isSunday = initialDate ? new Date(initialDate + 'T12:00:00').getDay() === 0 : false;
      if (isSunday) {
        setStartTime('17:00');
        setEndTime('18:30');
      } else {
        setStartTime('19:00');
        setEndTime('20:30');
      }
      
      setLocation('');
      setDescription('');
      setInstagramUrl('');
      setInstagramImgUrl('');
      setTipo('');
      setSelectedRoles([]);
      setObservation('');
      
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const dy = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yr}-${mo}-${dy}`;
      const defaultStatus = initialDate && initialDate < todayStr ? 'completed' : 'confirmed';
      setStatus(defaultStatus);
      
      setDailySchedules([]);
      setRecurrenceFreq('none');
      setRecurrenceDays([]);
      setRecurrenceEndDate('');
      setCustomDates([]);
      setSelectedColorClass('bg-purple-600');
    }
  }, [editMission, initialDate, isOpen]);

  // Auto-set status for NEW events based on date: past -> completed, future/today -> confirmed
  useEffect(() => {
    if (!editMission && isOpen) {
      if (!dateStr) {
        setStatus('confirmed');
        return;
      }
      
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const dy = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yr}-${mo}-${dy}`;
      
      const targetDate = endDateStr || dateStr;
      
      if (targetDate < todayStr) {
        setStatus('completed');
      } else {
        setStatus('confirmed');
      }
    }
  }, [dateStr, endDateStr, editMission, isOpen]);

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

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          callback(compressedBase64);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetType: 'logo' | 'instagram') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxWidth = targetType === 'logo' ? 150 : 500;
    const maxHeight = targetType === 'logo' ? 150 : 500;

    resizeImage(file, maxWidth, maxHeight, (compressedBase64) => {
      if (targetType === 'logo') {
        setMovementLogoUrl(compressedBase64);
      } else {
        setInstagramImgUrl(compressedBase64);
      }
    });
  };

  const handleMovementSelectChange = (val: string) => {
    setMovement(val);
    if (val === 'custom') {
      setUseCustomMovement(true);
    } else {
      setUseCustomMovement(false);
      setMovementLogoUrl('');

      if (!editMission && val) {
        // Find last added event with this movement
        const lastEvent = [...missions]
          .filter((m) => m.movement === val)
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;
            return (b.id || '').localeCompare(a.id || '');
          })[0];

        if (lastEvent) {
          if (!isTitleEditedByUser && lastEvent.title) setTitle(lastEvent.title);
          if (lastEvent.location) setLocation(lastEvent.location);
          if (lastEvent.description) setDescription(lastEvent.description);
          if (lastEvent.instagramUrl) setInstagramUrl(lastEvent.instagramUrl);
          if (lastEvent.instagramImgUrl) setInstagramImgUrl(lastEvent.instagramImgUrl);
          if (lastEvent.tipo) setTipo(lastEvent.tipo);
          if (lastEvent.roles) setSelectedRoles(lastEvent.roles);
          if (lastEvent.observation) setObservation(lastEvent.observation);
          if (lastEvent.startTime) setStartTime(lastEvent.startTime);
          if (lastEvent.endTime) setEndTime(lastEvent.endTime);
          if (lastEvent.movementLogoUrl) setMovementLogoUrl(lastEvent.movementLogoUrl);
          if (lastEvent.cardColor) setSelectedColorClass(lastEvent.cardColor);
        }
      }
    }
  };

  const handleTipoSelectChange = (val: string) => {
    setTipo(val);
    if (!editMission && val) {
      // Find last added event with this tipo
      const lastEvent = [...missions]
        .filter((m) => m.tipo === val)
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        })[0];

      if (lastEvent) {
        if (!isTitleEditedByUser && lastEvent.title) setTitle(lastEvent.title);
        if (lastEvent.location) setLocation(lastEvent.location);
        if (lastEvent.description) setDescription(lastEvent.description);
        if (lastEvent.instagramUrl) setInstagramUrl(lastEvent.instagramUrl);
        if (lastEvent.instagramImgUrl) setInstagramImgUrl(lastEvent.instagramImgUrl);
        if (lastEvent.roles) setSelectedRoles(lastEvent.roles);
        if (lastEvent.observation) setObservation(lastEvent.observation);
        if (lastEvent.startTime) setStartTime(lastEvent.startTime);
        if (lastEvent.endTime) setEndTime(lastEvent.endTime);
        if (lastEvent.movementLogoUrl) setMovementLogoUrl(lastEvent.movementLogoUrl);
        if (lastEvent.cardColor) setSelectedColorClass(lastEvent.cardColor);
        if (lastEvent.movement) setMovement(lastEvent.movement);
      }
    }
  };

  const handleSaveCustomMovementDirectly = () => {
    const name = customMovementName.trim();
    if (!name) return;

    try {
      const updatedColors = { ...movementColors, [name]: selectedColorClass };
      setMovementColors(updatedColors);
      localStorage.setItem('catholic_movement_colors_maria', JSON.stringify(updatedColors));

      const savedCustom = localStorage.getItem('saved_custom_catholic_movements');
      const customObj = savedCustom ? JSON.parse(savedCustom) : {};
      customObj[name] = {
        name: name,
        fullName: name,
        iconName: 'Church',
        colorClass: selectedColorClass || 'bg-purple-600',
        borderClass: 'border-purple-400',
        textClass: 'text-purple-600',
        gradientClass: 'from-purple-600 to-indigo-750',
        bannerUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
        shortDesc: 'Movimento personalizado cadastrado pelo missionário.',
        logoUrl: movementLogoUrl || undefined
      };
      localStorage.setItem('saved_custom_catholic_movements', JSON.stringify(customObj));
      
      window.dispatchEvent(new Event('customMovementsChanged'));

      setMovement(name);
      setUseCustomMovement(false);
      setCustomMovementName('');
      setMovementLogoUrl('');
      
      alert(`Movimento "${name}" cadastrado com sucesso e salvo na nuvem!`);
    } catch (err) {
      console.error('Error saving custom movement directly:', err);
    }
  };

  const updateDailySchedule = (date: string, field: 'startTime' | 'endTime' | 'active', value: any) => {
    setDailySchedules((prev) =>
      prev.map((item) => (item.dateStr === date ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (applyToSeries: boolean = false) => {
    const finalMovement = useCustomMovement ? (customMovementName.trim() || 'Customizado') : movement;

    // Save movement to color class mapping persistently
    if (finalMovement) {
      const updatedColors = { ...movementColors, [finalMovement]: selectedColorClass };
      setMovementColors(updatedColors);
      localStorage.setItem('catholic_movement_colors_maria', JSON.stringify(updatedColors));
    }

    if (useCustomMovement && customMovementName.trim()) {
      try {
        const savedCustom = localStorage.getItem('saved_custom_catholic_movements');
        const customObj = savedCustom ? JSON.parse(savedCustom) : {};
        customObj[customMovementName.trim()] = {
          name: customMovementName.trim(),
          fullName: customMovementName.trim(),
          iconName: 'Church',
          colorClass: selectedColorClass || 'bg-purple-600',
          borderClass: 'border-purple-400',
          textClass: 'text-purple-600',
          gradientClass: 'from-purple-600 to-indigo-750',
          bannerUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
          shortDesc: 'Movimento personalizado cadastrado pelo missionário.',
          logoUrl: movementLogoUrl || undefined
        };
        localStorage.setItem('saved_custom_catholic_movements', JSON.stringify(customObj));
      } catch (err) {
        console.error('Error saving custom movement info:', err);
      }
    }

    window.dispatchEvent(new Event('customMovementsChanged'));

    const payload: Partial<Mission> = {
      title: title.trim() || 'Nova Missão',
      movement: finalMovement,
      dateStr,
      endDateStr: endDateStr || undefined,
      startTime,
      endTime,
      location: location.trim(),
      description: description.trim(),
      instagramUrl: instagramUrl.trim(),
      instagramImgUrl: instagramImgUrl || undefined,
      movementLogoUrl: movementLogoUrl || undefined,
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
      cardColor: selectedColorClass
    };

    if (editMission) {
      payload.id = editMission.id;
      payload.googleEventId = editMission.googleEventId;
      payload.synced = editMission.synced;
    }

    onSave(payload, applyToSeries);
  };

  const isTitleDiff = title !== (editMission?.title || '');
  const isDateStrDiff = dateStr !== (editMission?.dateStr || initialDate || '');
  const isEndDateStrDiff = endDateStr !== (editMission?.endDateStr || '');
  const isStartTimeDiff = startTime !== (editMission?.startTime || '19:00');
  const isEndTimeDiff = endTime !== (editMission?.endTime || '20:30');
  const isLocationDiff = location !== (editMission?.location || '');
  const isDescriptionDiff = description !== (editMission?.description || '');
  const isInstagramUrlDiff = instagramUrl !== (editMission?.instagramUrl || '');
  const isTipoDiff = tipo !== (editMission?.tipo || '');
  const isObservationDiff = observation !== (editMission?.observation || '');
  const isStatusDiff = status !== (editMission?.status || (initialDate ? 'preparing' : 'backlog'));
  const isMovementDiff = movement !== (editMission ? (Object.keys(getAllMovements()).includes(editMission.movement) ? editMission.movement : 'custom') : CatholicMovement.PAROQUIAL);
  const isCustomMovementNameDiff = customMovementName !== (editMission && !Object.keys(getAllMovements()).includes(editMission.movement) ? editMission.movement : '');
  const isMovementLogoUrlDiff = movementLogoUrl !== (editMission?.movementLogoUrl || '');

  const hasChanged = isTitleDiff || isDateStrDiff || isEndDateStrDiff || isStartTimeDiff || isEndTimeDiff || isLocationDiff || isDescriptionDiff || isInstagramUrlDiff || isTipoDiff || isObservationDiff || isStatusDiff || isMovementDiff || isCustomMovementNameDiff || isMovementLogoUrlDiff;

  return (
    <div className="fixed inset-0 bg-purple-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      {/* Container with premium purple/lavender theme */}
      <div className="bg-[#FAF8FF] rounded-2xl border-1.5 border-purple-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Head themed in nice bold violet */}
        <div className="p-4 bg-purple-900 text-[#FAF8FF] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-200" />
            <div>
              <h3 className="font-extrabold text-[#FAF8FF] text-xs uppercase tracking-wider">
                Eu Missionário | Ficha do Evento
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-950/60 text-purple-100 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instantly displayed image at the top of the modal body */}
        {instagramImgUrl && (
          <div 
            onClick={() => {
              setPreviewImgUrl(instagramImgUrl);
              setPreviewImgTitle(title || 'Banner do Evento');
            }}
            className="w-full h-32 md:h-44 relative overflow-hidden bg-purple-950 border-b border-purple-150 shrink-0 cursor-pointer group/img"
            title="Clique para ver imagem completa em tela cheia"
          >
            <img 
              src={instagramImgUrl} 
              alt="Mídia do Instagram" 
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-black/10 to-transparent" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setInstagramImgUrl('');
              }}
              className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 hover:bg-red-650 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition z-10"
            >
              <Trash2 className="w-3 h-3" /> Excluir Banner
            </button>
            <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest bg-purple-700 text-white px-2 py-1 rounded-md shadow-xs">
                Card Digital / Mídia do Post
              </span>
              <span className="text-[10px] font-extrabold bg-black/65 text-white px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-md group-hover/img:bg-purple-700 transition">
                🔍 Ampliar Imagem
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-purple-950">
          
          {/* Title - Title of the mission */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-purple-600 block">Título do Evento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsTitleEditedByUser(true);
              }}
              placeholder="Ex: Noite de Avivamento Jovens, Terço Paroquial"
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-900 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Movement organizor / Customizable */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-purple-600 block">Movimento Organizador</label>
              <select
                value={movement}
                onChange={(e) => handleMovementSelectChange(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-800 text-xs"
              >
                {getSortedMovements().map(([key, info]) => (
                  <option key={key} value={key}>
                    ⛪ {info.name} - {info.fullName}
                  </option>
                ))}
                <option value="custom">✨ Outro Movimento (Digitar...)</option>
              </select>
            </div>

            {/* Optional Type Option (Vigília, Adoração, etc.) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tipo de Evento (Opcional)
              </label>
              <select
                value={tipo}
                onChange={(e) => handleTipoSelectChange(e.target.value)}
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

          {/* Condition custom movement details: custom name input and logo upload */}
          {useCustomMovement && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-3 animation-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-700 block">Nome do Movimento</label>
                  <input
                    type="text"
                    value={customMovementName}
                    onChange={(e) => setCustomMovementName(e.target.value)}
                    onBlur={() => {
                      const name = customMovementName.trim();
                      if (name && !editMission) {
                        const lastEvent = [...missions]
                          .filter((m) => m.movement.toLowerCase() === name.toLowerCase())
                          .sort((a, b) => {
                            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                            if (timeA !== timeB) return timeB - timeA;
                            return (b.id || '').localeCompare(a.id || '');
                          })[0];

                        if (lastEvent) {
                          if (!isTitleEditedByUser && lastEvent.title) setTitle(lastEvent.title);
                          if (lastEvent.location) setLocation(lastEvent.location);
                          if (lastEvent.description) setDescription(lastEvent.description);
                          if (lastEvent.instagramUrl) setInstagramUrl(lastEvent.instagramUrl);
                          if (lastEvent.instagramImgUrl) setInstagramImgUrl(lastEvent.instagramImgUrl);
                          if (lastEvent.tipo) setTipo(lastEvent.tipo);
                          if (lastEvent.roles) setSelectedRoles(lastEvent.roles);
                          if (lastEvent.observation) setObservation(lastEvent.observation);
                          if (lastEvent.startTime) setStartTime(lastEvent.startTime);
                          if (lastEvent.endTime) setEndTime(lastEvent.endTime);
                          if (lastEvent.movementLogoUrl) setMovementLogoUrl(lastEvent.movementLogoUrl);
                          if (lastEvent.cardColor) setSelectedColorClass(lastEvent.cardColor);
                        }
                      }
                    }}
                    placeholder="Ex: Grupo de Casais, Terço de Mulheres"
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-700 block">Logo Personalizada (Upload)</label>
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
              
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveCustomMovementDirectly}
                  disabled={!customMovementName.trim()}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-[10px] font-black uppercase text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Cadastrar Movimento na Lista
                </button>
              </div>
            </div>
          )}

          {/* Escolha de Cor do Card / Movimento */}
          <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <div>
                <label className="text-[10px] font-black uppercase text-purple-700 block">🎨 Cor Personalizada do Card / Evento</label>
                <span className="text-[9px] text-purple-600 block">
                  Ao salvar, esta cor será definida como padrão para futuros eventos do movimento <strong className="text-purple-700">"{useCustomMovement ? (customMovementName.trim() || 'Customizado') : (getMovementStyle(movement)?.name || movement)}"</strong>.
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                <span className="text-[9px] font-black text-purple-800">Visualização do card:</span>
                <span className={`text-[9px] text-white uppercase font-black px-2 py-0.5 rounded shadow-xs ${selectedColorClass}`}>
                  {useCustomMovement ? (customMovementName.trim() || 'Customizado') : (getMovementStyle(movement)?.name || movement)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_COLORS.map((color) => {
                const isSelected = selectedColorClass === color.class;
                return (
                  <button
                    key={color.class}
                    type="button"
                    onClick={() => setSelectedColorClass(color.class)}
                    className={`w-7 h-7 rounded-full ${color.class} border-2 transition-all duration-200 transform hover:scale-110 active:scale-95 relative flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "border-purple-900 ring-2 ring-purple-300 scale-105 shadow-md"
                        : "border-transparent hover:border-gray-200 shadow-3xs"
                    }`}
                    title={color.label}
                  >
                    {isSelected && (
                      <span className="text-[10px] text-white">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Data de Início
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none text-purple-850 font-bold text-xs"
              />
            </div>

            {/* Optional End Date for Multi-day Spans */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Data de Término (Opcional)
              </label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none text-purple-850 font-bold text-xs"
              />
            </div>
          </div>

          <div className={endDateStr ? "grid grid-cols-1 gap-3.5" : "grid grid-cols-1 md:grid-cols-3 gap-3.5"}>
            {!endDateStr && (
              <>
                {/* Start Time input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-500" /> Horário Início
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none text-purple-850 font-bold text-xs"
                  />
                </div>

                {/* End Time input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-500" /> Horário Término
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none text-purple-850 font-bold text-xs"
                  />
                </div>
              </>
            )}

            {/* Status of the event */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-purple-600 block">Status da Missão</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Mission['status'])}
                className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-800 text-xs"
              >
                <option value="preparing">⚙️ Em Preparação</option>
                <option value="confirmed">✅ Confirmado (Divulgado)</option>
                <option value="completed">🕊️ Concluído</option>
                <option value="backlog">💡 Ideia / Sem data marcada</option>
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

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
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
                            onChange={(e) => updateDailySchedule(schedule.dateStr, 'active', e.target.checked)}
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
                              onChange={(e) => updateDailySchedule(schedule.dateStr, 'startTime', e.target.value)}
                              className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-bold text-purple-850 outline-none focus:border-purple-500"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-extrabold uppercase text-purple-500">Término</label>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => updateDailySchedule(schedule.dateStr, 'endTime', e.target.value)}
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
              <label className="text-[10px] font-black uppercase text-purple-600 block">Local / Paróquia</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Santuário Diocesano, Capela interna"
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-800 text-xs"
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
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 text-purple-850 text-xs font-semibold"
                />
                
                {/* Image from gallery picker */}
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-[10px] text-purple-700 hover:bg-purple-100 font-bold flex items-center gap-1 transition-all">
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

          {/* Liturgical Role Checks */}
          <div className="space-y-2">
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

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-purple-600 block">Informações e Roteiro Geral</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite mais informações sobre a festividade geral ou avisos..."
              rows={2}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 text-purple-800 text-xs"
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
              <option value="monthly">Mensalmente (Mesmo dia do mês)</option>
              <option value="custom">Datas Específicas (Duplicar para outras datas)</option>
            </select>

            {(recurrenceFreq === 'weekly' || recurrenceFreq === 'monthly') && (
              <div className="space-y-2">
                {recurrenceFreq === 'weekly' && (
                  <>
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
                  </>
                )}
                <div className="space-y-1 mt-2">
                  <label className="text-[9px] font-black uppercase text-purple-600 block">Até quando repetir? (Opcional)</label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
                  />
                  {recurrenceFreq === 'monthly' && !recurrenceEndDate && (
                    <p className="text-[8px] text-purple-500">Se deixado em branco, repetirá pelos próximos 12 meses.</p>
                  )}
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
                    className="flex-1 bg-white border border-purple-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-purple-600 font-semibold"
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

          {/* Observation text area */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-purple-600 block">Observações / Notas Litúrgicas Pessoais</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Deixe observações paroquiais rápidas..."
              rows={2}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 text-purple-800 text-xs"
            />
          </div>

        </form>

        {/* Footer actions with dynamic close/save buttons */}
        <div className="bg-[#F5EEFD] border-t border-purple-150 p-2.5 px-4 flex gap-1.5 justify-end items-center shrink-0">
          {editMission && isSeries ? (
            <>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(editMission.id);
                    onClose();
                  }}
                  className="mr-auto px-4 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 font-extrabold text-[11px] text-rose-700 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  title="Excluir este evento ou a série"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" /> Excluir
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="px-4 py-1.5 rounded-lg border border-purple-250 hover:bg-purple-100 font-extrabold text-[11px] text-purple-850 transition cursor-pointer"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 font-extrabold text-[11px] text-white flex items-center gap-1 shadow-md transition cursor-pointer"
              >
                <Save className="w-3 h-3" /> Salvar em série
              </button>
            </>
          ) : hasChanged ? (
            <>
              {editMission ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-extrabold text-[11px] text-white flex items-center gap-1 shadow-md transition cursor-pointer"
                    title="Aplica edição para a série: mesmo título, horário e movimento"
                  >
                    <Save className="w-3 h-3" /> Editar toda Série
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 font-extrabold text-[11px] text-white flex items-center gap-1 shadow-md transition cursor-pointer"
                  >
                    <Save className="w-3 h-3" /> Salvar SÓ este
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 font-extrabold text-[11px] text-white flex items-center gap-1 shadow-md transition cursor-pointer"
                >
                  <Save className="w-3 h-3" /> Salvar
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-purple-250 hover:bg-purple-100 font-bold text-[11px] text-purple-850 transition cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>

      </div>

      {/* Fullscreen Image Lightbox Preview */}
      <ImagePreviewModal
        src={previewImgUrl}
        title={previewImgTitle}
        onClose={() => setPreviewImgUrl(null)}
      />
    </div>
  );
}
