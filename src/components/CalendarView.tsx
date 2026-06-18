/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Copy, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mission, CatholicMovement } from '../types';
import { getMovementStyle, isMissionOnDate } from '../utils/catholicData';

interface CalendarViewProps {
  missions: Mission[];
  currentDate: Date;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  setCurrentDate: (date: Date) => void;
  onSelectDay: (dateStr: string) => void;
  onSelectMission: (mission: Mission) => void;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Isolated component to render and animate the movement's logos
 * If a card has multiple events, it rotates the logos continuously inside the day block.
 * Supports custom movement style & uploaded custom logo images from gallery.
 */
function LogoStack({ dayMissions }: { dayMissions: Mission[] }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (dayMissions.length <= 2) return;
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % dayMissions.length);
    }, 2000); // cycle through missions every 2s
    return () => clearInterval(interval);
  }, [dayMissions.length]);

  if (dayMissions.length === 0) return null;

  // Statically stacked vertically if <= 2 missions to keep things neat and fast
  if (dayMissions.length <= 2) {
    return (
      <div className="flex flex-col -space-y-1.5 md:-space-y-2 justify-center items-center select-none py-0.5">
        {dayMissions.map((m, idx) => {
          const style = getMovementStyle(m.movement);
          const label = style?.name?.slice(0, 3) || '⛪';
          const logoImgUrl = m.movementLogoUrl || style?.logoUrl;

          if (logoImgUrl) {
            return (
              <div
                key={m.id || idx}
                className="w-5.5 h-5.5 md:w-7 md:h-7 rounded-full border border-purple-200/80 bg-white flex items-center justify-center shadow-xs overflow-hidden relative transition transform hover:scale-110"
                title={m.title || m.movement}
                style={{ zIndex: 10 - idx }}
              >
                <img
                  src={logoImgUrl}
                  alt={m.movement}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            );
          }

          return (
            <div
              key={m.id || idx}
              className={`w-5.5 h-5.5 md:w-7 md:h-7 rounded-full border ${style?.borderClass || 'border-purple-300'} ${m.cardColor || style?.colorClass || 'bg-purple-500'} text-white flex items-center justify-center font-black text-[7.5px] md:text-[9px] shadow-xs relative transition transform hover:scale-110`}
              title={m.title || style?.fullName}
              style={{ zIndex: 10 - idx }}
            >
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // If 3 or 4 (or more) missions, show first 2, then cycle sequentially with a beautiful vertical sliding transition
  const firstIndex = offset % dayMissions.length;
  const secondIndex = (offset + 1) % dayMissions.length;
  const itemsToShow = [dayMissions[firstIndex], dayMissions[secondIndex]];

  return (
    <div className="flex flex-col -space-y-1.5 md:-space-y-2 justify-center items-center select-none py-0.5 h-11 md:h-14 overflow-hidden relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {itemsToShow.map((m, idx) => {
          const style = getMovementStyle(m.movement);
          const label = style?.name?.slice(0, 3) || '⛪';
          const logoImgUrl = m.movementLogoUrl || style?.logoUrl;

          return (
            <motion.div
              key={`${m.id || m.title}-${idx}`}
              initial={{ scale: 0.7, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-5.5 h-5.5 md:w-7 md:h-7 shrink-0"
              style={{ zIndex: 10 - idx }}
            >
              {logoImgUrl ? (
                <div className="w-full h-full rounded-full border border-purple-200/80 bg-white flex items-center justify-center shadow-xs overflow-hidden">
                  <img
                    src={logoImgUrl}
                    alt={m.movement}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className={`w-full h-full rounded-full border ${style?.borderClass || 'border-purple-300'} ${m.cardColor || style?.colorClass || 'bg-purple-500'} text-white flex items-center justify-center font-black text-[7.5px] md:text-[9px] shadow-xs`}
                >
                  <span>{label}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function CalendarView({
  missions,
  currentDate,
  searchTerm = '',
  setSearchTerm,
  setCurrentDate,
  onSelectDay,
  onSelectMission,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Filter all missions across ALL months when search is term >= 3 characters
  const allMatchingMissions = (searchTerm && searchTerm.trim().length >= 3)
    ? missions.filter((m) => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const sortedMatchingMissions = [...allMatchingMissions].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const getDayOfWeekPT = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const day = d.getDay();
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return days[day];
    } catch {
      return '';
    }
  };

  const formatDatePT = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const MONTHS_SHORT = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const dStr = parts[2];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${dStr} de ${MONTHS_SHORT[mIdx]}, ${parts[0]}`;
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  const [isSearchActive, setIsSearchActive] = useState(!!searchTerm);
  const [activeSplashMonth, setActiveSplashMonth] = useState<string | null>(null);
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setActiveSplashMonth(MONTHS_PT[currentDate.getMonth()]);
    const timer = setTimeout(() => {
      setActiveSplashMonth(null);
    }, 150); // extremely rapid active splash (150ms instead of 300ms)
    return () => clearTimeout(timer);
  }, [currentDate]);

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

  const handleCopyMonth = async () => {
    try {
      const targetMonthStr = String(month + 1).padStart(2, '0');
      const targetYearStr = String(year);
      
      const monthMissions = missions.filter(m => {
        if (!m.dateStr) return false;
        const [y, M] = m.dateStr.split('-');
        return y === targetYearStr && M === targetMonthStr;
      }).sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

      let text = `Resumo de Eventos de ${MONTHS_PT[month]} de ${year} (${monthMissions.length} eventos):\n\n`;
      
      monthMissions.forEach(m => {
        const parts = m.dateStr.split('-');
        const theDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        
        let timeStr = '';
        if (m.startTime && m.endTime) timeStr = ` ${m.startTime} às ${m.endTime}`;
        else if (m.startTime) timeStr = ` ${m.startTime}`;
        
        text += `- [${theDate}${timeStr}] ${m.title}\n`;
        if (m.location) text += `  📍 Local: ${m.location}\n`;
        if (m.movement) text += `  ⛪ Movimento/Grupo: ${m.movement}\n`;
        if (m.status) text += `  📊 Status do preparo: ${m.status === 'confirmed' ? 'Confirmado' : m.status === 'preparing' ? 'Em Preparação' : m.status === 'completed' ? 'Concluído' : 'Sem previsão'}\n`;
        if (m.description) text += `  📝 Descrição: ${m.description}\n`;
        if (m.roles && m.roles.length > 0) text += `  🙋 Serviços: ${m.roles.join(', ')}\n`;
        if (m.observation) text += `  ⚠️ Observações: ${m.observation}\n`;
        if (m.instagramUrl) text += `  📱 Instagram: ${m.instagramUrl}\n`;
        if (m.checklist && m.checklist.length > 0) {
          text += `  ✅ Checklist:\n`;
          m.checklist.forEach(c => {
            text += `     ${c.completed ? '[x]' : '[ ]'} ${c.text}\n`;
          });
        }
        text += '\n';
      });

      await navigator.clipboard.writeText(text);
      alert(`Os eventos de ${MONTHS_PT[month]} foram copiados com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao tentar copiar os dados do mês.');
    }
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

  // Days calculations
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const dayCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    dayCells.push(d);
  }

  const formatDateString = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="bg-white rounded-2xl border border-purple-100 shadow-xs p-4 md:p-6 select-none touch-pan-y"
    >
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-black text-purple-950 tracking-tight">
            {MONTHS_PT[month]} <span className="text-purple-400 font-light">{year}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isSearchActive ? (
            <div className="flex flex-col relative w-full sm:w-72">
              <div className="flex items-center w-full animate-in fade-in slide-in-from-top-1 bg-white border border-purple-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-purple-100 p-1">
                <Search className="w-4 h-4 text-purple-400 ml-1.5" />
                <input
                  type="text"
                  placeholder="Pesquisar em todos os meses..."
                  autoFocus
                  className="w-full text-xs bg-transparent px-2 py-1.5 outline-none text-purple-900 placeholder:text-purple-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm?.(e.target.value)}
                />
                <button
                  onClick={() => {
                    setIsSearchActive(false);
                    setSearchTerm?.('');
                  }}
                  className="p-1.5 rounded-full hover:bg-purple-100 text-purple-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-purple-50 text-purple-800 text-[10px] py-1 px-2.5 rounded-lg border border-purple-150 shadow-md animate-in fade-in slide-in-from-top-1 text-center font-medium">
                  Digite pelo menos 3 algarismos/letras...
                </div>
              )}
              {searchTerm && searchTerm.trim().length >= 3 && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-white rounded-xl border border-purple-100 shadow-xl max-h-72 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 w-full sm:w-80 -right-2 sm:right-0">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-purple-400 border-b border-purple-50 pb-1 mb-1 uppercase tracking-wider flex justify-between items-center">
                    <span>Resultados ({sortedMatchingMissions.length})</span>
                    <span className="text-[9px] text-purple-300 normal-case font-normal">Todos os meses</span>
                  </div>
                  {sortedMatchingMissions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-purple-400 font-medium">
                      Nenhuma missão encontrada
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {sortedMatchingMissions.map((m) => {
                        const style = getMovementStyle(m.movement);
                        const weekday = getDayOfWeekPT(m.dateStr);
                        const formattedDateStr = formatDatePT(m.dateStr);

                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              const parts = m.dateStr.split('-');
                              if (parts.length === 3) {
                                const y = parseInt(parts[0], 10);
                                const mIdx = parseInt(parts[1], 10) - 1;
                                // Navigate to the correct month and year
                                setCurrentDate(new Date(y, mIdx, 1));
                                // Highlight cell & Open detail modals
                                onSelectDay(m.dateStr);
                                if (onSelectMission) {
                                  onSelectMission(m);
                                }
                              }
                            }}
                            className="flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-purple-50/70 hover:text-purple-950 transition outline-none group border border-transparent hover:border-purple-100"
                          >
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center mt-0.5">
                              {m.movementLogoUrl || style?.logoUrl ? (
                                <img
                                  src={m.movementLogoUrl || style?.logoUrl}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-2.5 h-2.5 rounded-full ${m.cardColor || style?.colorClass || 'bg-purple-500'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-purple-900 group-hover:text-purple-950 line-clamp-1">
                                {m.title}
                              </div>
                              <div className="text-[10px] text-purple-400 font-medium flex justify-between items-center mt-0.5">
                                <span>{formattedDateStr}</span>
                                <span className="bg-purple-50 text-purple-600 px-1 py-0.2 rounded text-[9px] group-hover:bg-purple-100">
                                  {weekday}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleToday}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition"
              >
                Mês de Hoje
              </button>
              
              <button
                onClick={handleCopyMonth}
                className="p-1.5 ml-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 transition"
                title="Copiar texto puro dos eventos deste mês"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSearchActive(true)}
                className="p-1.5 ml-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 transition"
                title="Pesquisar datas"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          )} 
          
          <div className="flex bg-[#F5EEFD] p-0.5 rounded-lg border border-purple-150 ml-auto sm:ml-2">
            <button
              onClick={handlePrevMonth}
              id="prev-month-btn"
              className="p-1 rounded-md hover:bg-white text-purple-800 transition"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              id="next-month-btn"
              className="p-1 rounded-md hover:bg-white text-purple-800 transition"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of week columns */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 shadow-2xs py-1 bg-purple-50/50 rounded-lg">
        {DAYS_SHORT_PT.map((d, index) => (
          <div key={index} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Cells Grid */}
      <div className="overflow-hidden relative">
        <AnimatePresence>
          {activeSplashMonth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none select-none"
            >
              <div className="bg-purple-950/95 text-white font-sans font-black text-xl md:text-2xl px-5 py-3 rounded-xl shadow-lg border border-purple-500/30 backdrop-blur-md flex flex-col items-center gap-0.5">
                <span className="uppercase tracking-widest text-[8px] text-purple-200 font-bold">Exibindo Mês</span>
                <span className="drop-shadow-sm font-sans text-purple-100">{activeSplashMonth}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="grid grid-cols-7 gap-1 md:gap-1.5 w-full"
          >
            {dayCells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="w-full h-24 md:h-28 rounded-xl border border-transparent bg-purple-50/10"
                  />
                );
              }

              const dateStr = formatDateString(day);
              const filteredMissions = (searchTerm && searchTerm.trim().length >= 3)
                ? missions.filter((m) => 
                    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : missions;
              const dayMissions = filteredMissions.filter((m) => isMissionOnDate(m, dateStr));
              const dayIsToday = isToday(day);

              const multiDayMissions = dayMissions.filter((m) => m.endDateStr && m.endDateStr !== m.dateStr);
              const singleDayMissions = dayMissions.filter((m) => !m.endDateStr || m.endDateStr === m.dateStr);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => onSelectDay(dateStr)}
                  className={`w-full h-20 md:h-24 pb-7 p-2 flex flex-col justify-between rounded-xl border transition cursor-pointer relative group ${
                    dayIsToday
                      ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-150 ring-offset-1'
                      : 'bg-white hover:bg-purple-50/30 border-purple-105'
                  }`}
                >
                  {/* Day Cell Header */}
                  <div className="flex items-center justify-between w-full h-5 relative z-10">
                    <span
                      className={`text-xs md:text-sm font-black flex items-center justify-center rounded-full w-5 h-5 md:w-6.5 md:h-6.5 ${
                        dayIsToday
                          ? 'bg-purple-600 text-white shadow shadow-purple-600/30'
                          : 'text-purple-900'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Desktop hover create badge */}
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] text-purple-600 font-bold hidden md:flex items-center gap-0.5 transition-opacity">
                      <Plus className="w-2.5 h-2.5" /> add
                    </span>
                  </div>

                  {/* Day Logo representation */}
                  <div className="flex-1 flex items-center justify-center pt-1 md:pt-1.5 relative z-10">
                    {dayMissions.length > 0 ? (
                      <LogoStack dayMissions={dayMissions} />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-purple-100 group-hover:bg-purple-300 transition" />
                    )}
                  </div>

                  {/* Filled Connecting Strip for Multi-day events at the bottom */}
                  {multiDayMissions.slice(0, 1).map((m) => {
                    const style = getMovementStyle(m.movement);
                    const isStart = dateStr === m.dateStr;
                    const isEnd = dateStr === m.endDateStr;
                    const isShalomEvent = m.movement === CatholicMovement.SHALOM || m.movement.toLowerCase().includes('shalom');

                    // Compute horizontal extensions to bridge grid gap
                    let roundedClass = 'rounded-none';
                    let marginClass = '-mx-1 md:-mx-1.5';

                    if (isStart) {
                      roundedClass = 'rounded-l-lg';
                      marginClass = 'ml-1 md:ml-1.5 -mr-1 md:-mr-1.5';
                    } else if (isEnd) {
                      roundedClass = 'rounded-r-lg';
                      marginClass = '-ml-1 md:-ml-1.5 mr-1 md:mr-1.5';
                    }

                    return (
                      <div
                        key={m.id}
                        className={`absolute bottom-1 left-0 right-0 ${marginClass} h-4.5 md:h-5 z-20 select-none overflow-hidden pointer-events-auto`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMission(m);
                        }}
                        title={`${m.title} (${m.dateStr} a ${m.endDateStr})`}
                      >
                        <div
                          className={`w-full h-full ${m.cardColor || style?.colorClass || 'bg-purple-600'} ${roundedClass} flex items-center justify-between px-1.5 text-[8px] md:text-[9.5px] font-black text-white hover:opacity-95 active:scale-95 transition relative overflow-hidden`}
                          style={{
                            backgroundColor: isShalomEvent ? '#047857' : undefined
                          }}
                        >
                          {/* Blurred Shalom logo backgound underlay */}
                          {isShalomEvent && (
                            <div
                              className="absolute inset-0 z-0 bg-center bg-cover opacity-35 filter blur-[1px]"
                              style={{ backgroundImage: 'url("https://iili.io/B51WMLF.jpg")' }}
                            />
                          )}

                          <span className="relative z-10 truncate max-w-[85%] leading-none drop-shadow-sm">
                            {isStart ? m.title : (isEnd ? '🏁 Fim' : '✨ ' + style.name)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bottom text dots on desktop screen only to indicate other single-day events */}
                  {singleDayMissions.length > 0 && (
                    <div className="hidden md:flex justify-center gap-0.5 mt-1 overflow-hidden relative z-10">
                      {singleDayMissions.map((m) => {
                        const style = getMovementStyle(m.movement);
                        return (
                          <span
                            key={m.id}
                            className={`w-1.5 h-1.5 rounded-full ${m.cardColor || style?.colorClass || 'bg-purple-400'}`}
                            title={m.title}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
