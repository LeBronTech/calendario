/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mission, CatholicMovement } from '../types';
import { getMovementStyle, isMissionOnDate } from '../utils/catholicData';

interface CalendarViewProps {
  missions: Mission[];
  currentDate: Date;
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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (dayMissions.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % dayMissions.length);
    }, 2800); // Transitions every 2.8s
    return () => clearInterval(interval);
  }, [dayMissions]);

  if (dayMissions.length === 0) return null;

  // Single logo rendering helper
  const renderSingleLogo = (m: Mission) => {
    const style = getMovementStyle(m.movement);
    const label = style?.name?.slice(0, 3) || '⛪';
    const logoImgUrl = m.movementLogoUrl || style?.logoUrl;
    
    if (logoImgUrl) {
      return (
        <div
          className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-purple-150 bg-white flex items-center justify-center shadow-xs select-none overflow-hidden"
          title={m.movement}
        >
          <img src={logoImgUrl} alt={m.movement} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      );
    }

    return (
      <div
        className={`w-6 h-6 md:w-8 md:h-8 rounded-full border ${style?.borderClass || 'border-purple-300'} ${m.cardColor || style?.colorClass || 'bg-purple-500'} text-white flex items-center justify-center font-black text-[9px] md:text-[10px] shadow-xs select-none`}
        title={style?.fullName}
      >
        <span>{label}</span>
      </div>
    );
  };

  if (dayMissions.length === 1) {
    return renderSingleLogo(dayMissions[0]);
  }

  // Multi-logos dynamic swapping layout
  return (
    <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center select-none">
      <AnimatePresence mode="popLayout">
        {dayMissions.map((m, idx) => {
          const style = getMovementStyle(m.movement);
          const logoImgUrl = m.movementLogoUrl || style?.logoUrl;
          // Determine the cycle relative offset position of the logo
          const position = (idx - activeIndex + dayMissions.length) % dayMissions.length;

          // Only draw the front item (position 0) and the back item (position 1) to keep the layout neat
          if (position > 1) return null;

          const isFront = position === 0;
          const label = style?.name?.slice(0, 3) || '⛪';

          return (
            <motion.div
              key={m.id + '-' + idx}
              initial={{ scale: 0.7, x: isFront ? -10 : 4, zIndex: isFront ? 10 : 0, opacity: 0 }}
              animate={{
                scale: isFront ? 1 : 0.75,
                x: isFront ? 0 : 5,
                y: isFront ? 0 : -3,
                zIndex: isFront ? 10 : 5,
                opacity: 1,
              }}
              exit={{ scale: 0.7, x: 10, opacity: 0, zIndex: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="absolute"
              title={style?.fullName}
            >
              {logoImgUrl ? (
                <div className="w-6 h-6 md:w-7.5 md:h-7.5 rounded-full border border-purple-150 bg-white flex items-center justify-center shadow-md overflow-hidden">
                  <img src={logoImgUrl} alt={m.movement} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className={`w-6 h-6 md:w-7.5 md:h-7.5 rounded-full border ${style?.borderClass || 'border-purple-300'} ${m.cardColor || style?.colorClass || 'bg-purple-500'} text-white flex items-center justify-center font-black text-[9px] md:text-[10px] shadow-md`}>
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
  setCurrentDate,
  onSelectDay,
  onSelectMission,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

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
    }, 300); // extremely fast display
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
              initial={{ opacity: 0, scale: 0.55, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.5, y: 5 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none select-none"
            >
              <div className="bg-purple-950/90 text-white font-sans font-black text-xl md:text-3.5xl px-6 py-3.5 rounded-2xl shadow-2xl border border-purple-500/40 backdrop-blur-md flex flex-col items-center gap-1">
                <span className="uppercase tracking-widest text-[8.5px] text-purple-200">Exibindo Mês</span>
                <span className="drop-shadow-sm font-sans text-purple-100">{activeSplashMonth}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: dir * 35,
                opacity: 0
              }),
              center: {
                x: 0,
                opacity: 1
              },
              exit: (dir: number) => ({
                x: dir * -35,
                opacity: 0,
                pointerEvents: 'none'
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 650, damping: 45 },
              opacity: { duration: 0.10 }
            }}
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
              const dayMissions = missions.filter((m) => isMissionOnDate(m, dateStr));
              const dayIsToday = isToday(day);

              const multiDayMissions = dayMissions.filter((m) => m.endDateStr && m.endDateStr !== m.dateStr);
              const singleDayMissions = dayMissions.filter((m) => !m.endDateStr || m.endDateStr === m.dateStr);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => onSelectDay(dateStr)}
                  className={`w-full h-24 md:h-28 pb-7.5 p-2 flex flex-col justify-between rounded-xl border transition cursor-pointer relative group ${
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
