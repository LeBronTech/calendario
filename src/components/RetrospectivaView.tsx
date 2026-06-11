import React from 'react';
import { Mission, CatholicMovement } from '../types';
import { getMovementStyle } from '../utils/catholicData';
import { 
  Check, 
  X, 
  Award, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  CalendarCheck2,
  ChevronRight,
  ListFilter,
  Heart,
  Activity,
  Hourglass
} from 'lucide-react';

interface RetrospectivaViewProps {
  missions: Mission[];
  onUpdateAttendance: (missionId: string, attended: boolean) => void;
}

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export default function RetrospectivaView({ missions, onUpdateAttendance }: RetrospectivaViewProps) {
  const [subTab, setSubTab] = React.useState<'presence' | 'hours'>('presence');
  const [viewMonth, setViewMonth] = React.useState<number>(new Date().getMonth());
  const [viewYear, setViewYear] = React.useState<number>(new Date().getFullYear());
  
  // Helper to identify if an event is in the past
  const isEventPast = (m: Mission | undefined | null) => {
    if (!m || !m.dateStr) return false;
    try {
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const dy = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yr}-${mo}-${dy}`;

      const targetDateStr = m.endDateStr || m.dateStr;

      if (targetDateStr < todayStr) return true;
      if (targetDateStr > todayStr) return false;

      // If it is today, check end time if available, otherwise fallback to 23:59
      const hr = String(today.getHours()).padStart(2, '0');
      const mn = String(today.getMinutes()).padStart(2, '0');
      const currentInt = hr + mn;

      const tEndTime = m.endTime || '23:59';
      const cleanEndTime = tEndTime.replace(':', '');
      return currentInt >= cleanEndTime;
    } catch (e) {
      return false;
    }
  };

  // Helper to calculate duration in hours
  const getMissionDuration = (m: Mission): number => {
    if (m.dailySchedules && m.dailySchedules.length > 0) {
      let total = 0;
      m.dailySchedules.forEach((sched) => {
        if (!sched.active || !sched.startTime || !sched.endTime) return;
        try {
          const [sh, sm] = sched.startTime.split(':').map(Number);
          const [eh, em] = sched.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 1440;
            total += diff / 60;
          }
        } catch (e) {}
      });
      if (total > 0) return Math.round(total * 10) / 10;
    }

    if (!m.startTime || !m.endTime) return 1.5; // default fallback if unset
    try {
      const [sh, sm] = m.startTime.split(':').map(Number);
      const [eh, em] = m.endTime.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 1.5;
      let diffMins = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMins < 0) diffMins += 1440; // spans past midnight
      return Math.max(0.2, Math.round((diffMins / 60) * 10) / 10);
    } catch (e) {
      return 1.5;
    }
  };

  // Current system details
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Get start and end of current week (Monday-indexed)
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Time-frame helpers
  const isDateInCurrentWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d >= startOfWeek && d <= endOfWeek;
    } catch {
      return false;
    }
  };

  const isDateInSelectedMonth = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    } catch {
      return false;
    }
  };

  const isDateInCurrentYear = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.getFullYear() === currentYear;
    } catch {
      return false;
    }
  };

  // 1. Pending confirmation questions (1 minute past end-time, and attended is undefined)
  const pendingAttendanceMissions = missions.filter(m => isEventPast(m) && m.attended === undefined)
    .sort((a, b) => {
      const dateA = new Date(`${a.dateStr}T${a.endTime || '23:59'}`).getTime();
      const dateB = new Date(`${b.dateStr}T${b.endTime || '23:59'}`).getTime();
      return dateA - dateB; // oldest finished events first
    });

  // 2. Filter attended meetings
  const attendedMissions = missions.filter(m => isEventPast(m) && m.attended === true);
  const totalConcluded = missions.filter(isEventPast).length;
  const totalAttended = attendedMissions.length;
  const attendanceRate = totalConcluded > 0 ? Math.round((totalAttended / totalConcluded) * 100) : 0;

  // 3. Dedicated Hours calculations
  let sumWeekHours = 0;
  let sumMonthHours = 0;
  let sumYearHours = 0;

  attendedMissions.forEach(m => {
    if (m.dailySchedules && m.dailySchedules.length > 0) {
      m.dailySchedules.forEach(sched => {
        if (!sched.active || !sched.dateStr || !sched.startTime || !sched.endTime) return;
        try {
          const [sh, sm] = sched.startTime.split(':').map(Number);
          const [eh, em] = sched.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 1440;
            const dur = diff / 60;
            if (isDateInCurrentWeek(sched.dateStr)) {
              sumWeekHours += dur;
            }
            if (isDateInSelectedMonth(sched.dateStr)) {
              sumMonthHours += dur;
            }
            if (isDateInCurrentYear(sched.dateStr)) {
              sumYearHours += dur;
            }
          }
        } catch (e) {}
      });
    } else {
      if (!m.dateStr) return;
      const dur = getMissionDuration(m);
      if (isDateInCurrentWeek(m.dateStr)) {
        sumWeekHours += dur;
      }
      if (isDateInSelectedMonth(m.dateStr)) {
        sumMonthHours += dur;
      }
      if (isDateInCurrentYear(m.dateStr)) {
        sumYearHours += dur;
      }
    }
  });

  const weekHours = Math.round(sumWeekHours * 10) / 10;
  const monthHours = Math.round(sumMonthHours * 10) / 10;
  const yearHours = Math.round(sumYearHours * 10) / 10;

  // 4. Movement Hours Rankings for Year
  const movementHours: Record<string, number> = {};
  attendedMissions.forEach(m => {
    const mov = m.movement || 'paroquial';
    const movKey = typeof mov === 'string' ? mov : (mov as string);

    if (m.dailySchedules && m.dailySchedules.length > 0) {
      m.dailySchedules.forEach(sched => {
        if (!sched.active || !sched.dateStr || !isDateInCurrentYear(sched.dateStr) || !sched.startTime || !sched.endTime) return;
        try {
          const [sh, sm] = sched.startTime.split(':').map(Number);
          const [eh, em] = sched.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 1440;
            const dur = diff / 60;
            movementHours[movKey] = (movementHours[movKey] || 0) + dur;
          }
        } catch (e) {}
      });
    } else {
      if (!m.dateStr || !isDateInCurrentYear(m.dateStr)) return;
      const dur = getMissionDuration(m);
      movementHours[movKey] = (movementHours[movKey] || 0) + dur;
    }
  });

  const movementHoursRank = Object.entries(movementHours)
    .map(([key, hours]) => {
      const style = getMovementStyle(key);
      return {
        key,
        hours: Math.round(hours * 10) / 10,
        name: style?.name || key,
        colorClass: style?.colorClass || 'bg-purple-650',
        logoUrl: style?.logoUrl
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const maxMovementHours = movementHoursRank.length > 0 ? movementHoursRank[0].hours : 1;

  // 5. Movement Count Rankings
  const movementCounts: Record<string, { count: number; name: string; colorClass: string; logoUrl?: string; textClass: string; gradientClass: string }> = {};
  
  attendedMissions.forEach(m => {
    const mov = m.movement || 'paroquial';
    const style = getMovementStyle(mov);
    const movKey = typeof mov === 'string' ? mov : (mov as string);
    
    if (!movementCounts[movKey]) {
      movementCounts[movKey] = {
        count: 0,
        name: style?.name || movKey,
        colorClass: style?.colorClass || 'bg-purple-650',
        logoUrl: style?.logoUrl,
        textClass: style?.textClass || 'text-purple-650',
        gradientClass: style?.gradientClass || 'from-purple-600 to-indigo-600'
      };
    }
    movementCounts[movKey].count += 1;
  });

  const rankings = Object.entries(movementCounts)
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.count - a.count);

  // 6. Tipo de Evento stats
  const typeCounts: Record<string, number> = {};
  attendedMissions.forEach(m => {
    const t = m.tipo ? m.tipo.trim().toLowerCase() : 'outros';
    const displayType = t.charAt(0).toUpperCase() + t.slice(1);
    typeCounts[displayType] = (typeCounts[displayType] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0].count : 1;

  // 7. Timeline month-by-month
  const monthlyData: Record<string, { count: number; label: string; yearNum: number; monthNum: number }> = {};
  
  attendedMissions.forEach(m => {
    if (!m.dateStr) return;
    try {
      const date = new Date(m.dateStr + 'T00:00');
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          count: 0,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          yearNum: year,
          monthNum: month
        };
      }
      monthlyData[key].count += 1;
    } catch (e) {
      // safe fallback
    }
  });

  const timelineData = Object.values(monthlyData)
    .sort((a, b) => {
      if (a.yearNum !== b.yearNum) return a.yearNum - b.yearNum;
      return a.monthNum - b.monthNum;
    });

  const maxMonthlyCount = timelineData.length > 0 ? Math.max(...timelineData.map(d => d.count)) : 1;

  // Render Medal badge
  const renderMedal = (rankIndex: number) => {
    if (rankIndex === 0) {
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-650 border border-amber-300 font-black text-xs shadow-xs" title="Ouro">
          🥇
        </span>
      );
    }
    if (rankIndex === 1) {
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-650 border border-slate-300 font-black text-xs shadow-xs" title="Prata">
          🥈
        </span>
      );
    }
    if (rankIndex === 2) {
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-800 border border-amber-600/30 font-black text-xs shadow-xs" title="Bronze">
          🥉
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200">
        #{rankIndex + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP DYNAMIC QUESTIONS PANEL - ALWAYS DISPLAYED AT THE START */}
      <div id="retrospective-pending-panel" className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="bg-purple-950 px-4 py-3 flex items-center justify-between border-b border-purple-900">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-fuchsia-400 animate-pulse" />
            <h3 className="text-xs uppercase font-black tracking-wider text-purple-100">Presenças Pendentes</h3>
          </div>
          {pendingAttendanceMissions.length > 0 && (
            <span className="bg-fuchsia-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {pendingAttendanceMissions.length} para responder
            </span>
          )}
        </div>

        <div className="p-4">
          {pendingAttendanceMissions.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-3xs">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">Tudo em dia!</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  Você respondeu sobre todos os seus eventos concluídos. Quando novas missões terminarem, as perguntas aparecerão aqui!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {pendingAttendanceMissions.map((m) => {
                const style = getMovementStyle(m.movement);
                return (
                  <div 
                    key={m.id} 
                    className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 hover:border-purple-200 transition"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${style?.colorClass || 'bg-purple-600'} text-white`}>
                          {style?.name || 'Paroquial'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 
                          {new Date(m.dateStr + 'T00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} • {m.startTime}-{m.endTime}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-900 truncate leading-snug select-text">
                        {m.title}
                      </h4>
                      
                      {m.location && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate select-text">
                          <MapPin className="w-2.5 h-2.5 shrink-0" /> {m.location}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end sm:justify-start">
                      <button
                        onClick={() => onUpdateAttendance(m.id, false)}
                        className="px-2.5 py-1.5 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-650 text-[10px] font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Não Fui
                      </button>

                      <button
                        onClick={() => onUpdateAttendance(m.id, true)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-xs border border-purple-850"
                      >
                        <Check className="w-3.5 h-3.5" /> Fui, estive lá!
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SUB-TABS SELECTOR FOR RETROSPECTIVE DETAILS */}
      <div className="flex bg-purple-100/50 p-1 rounded-2xl border border-purple-200/50 max-w-sm">
        <button
          type="button"
          onClick={() => setSubTab('presence')}
          className={`flex-1 py-1.5 px-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'presence'
              ? 'bg-purple-700 text-white shadow-sm border border-purple-800'
              : 'text-purple-600 hover:text-purple-800'
          }`}
        >
          🏆 Presença & Rankings
        </button>
        <button
          type="button"
          onClick={() => setSubTab('hours')}
          className={`flex-1 py-1.5 px-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer relative ${
            subTab === 'hours'
              ? 'bg-purple-700 text-white shadow-sm border border-purple-800'
              : 'text-purple-600 hover:text-purple-800'
          }`}
        >
          ⏳ Horas Dedicadas
          {pendingAttendanceMissions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 absolute top-1.5 right-2 animate-pulse" />
          )}
        </button>
      </div>

      {/* CONTENT FOR SUB-TAB 'presence' */}
      {subTab === 'presence' && (
        <>
          {/* OVERALL STATS BENTO ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Total Presences */}
            <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-3xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total de Presenças</p>
                <h3 className="text-xl font-black text-slate-900 select-all">{totalAttended}</h3>
                <p className="text-[9px] text-slate-500">Eventos confirmados por você</p>
              </div>
            </div>

            {/* Card 2: Frequency Rate */}
            <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-3xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Taxa de Frequência</p>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl font-black text-slate-900 select-all">{attendanceRate}%</h3>
                  <span className="text-[9px] text-slate-400">({totalAttended}/{totalConcluded})</span>
                </div>
                {/* Tiny progress bar */}
                <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Spiritual status */}
            <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-3xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-fuchsia-600 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Status Espiritual</p>
                <h3 className="text-xs font-black text-slate-800 uppercase">
                  {totalAttended >= 10 ? 'Missionário de Ouro 🌟' : totalAttended >= 5 ? 'Servo Fiel 🌱' : 'Caminhante Inicial 🧭'}
                </h3>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {totalAttended >= 10 ? 'Excelente ritmo nas pastorais!' : `Participe de mais ${10 - totalAttended} para nível Ouro`}
                </p>
              </div>
            </div>
          </div>

          {/* RANKING & DETAILS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: MOVEMENTS RANKING */}
            <div className="bg-white rounded-2xl border border-purple-100 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-purple-50">
                <Award className="w-4 h-4 text-purple-700" />
                <div>
                  <h3 className="text-xs uppercase font-black tracking-wider text-slate-800">Ranking por Movimentos</h3>
                  <p className="text-[10px] text-slate-400">Os movimentos paroquiais mais presentes na sua caminhada</p>
                </div>
              </div>

              {rankings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-[11px] font-medium">
                  Ainda não há dados de participação confirmados. Responda às perguntas acima para atualizar o ranking!
                </div>
              ) : (
                <div className="space-y-3">
                  {rankings.map((m, idx) => {
                    return (
                      <div key={m.key} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/70 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          {renderMedal(idx)}
                          
                          {m.logoUrl ? (
                            <img 
                              src={m.logoUrl} 
                              alt={m.name} 
                              className="w-7 h-7 rounded-lg object-cover border border-purple-100 shadow-3xs" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-7 h-7 rounded-lg ${m.colorClass} text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-slate-200 shadow-3xs`}>
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="truncate">
                            <h4 className="text-xs font-extrabold text-slate-900 leading-none truncate">
                              {m.name}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              {m.count} {m.count === 1 ? 'evento' : 'eventos'}
                            </span>
                          </div>
                        </div>

                        <span className="bg-purple-50 border border-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-lg">
                          {m.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: EVENT TYPES SUMMARY */}
            <div className="bg-white rounded-2xl border border-purple-100 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-purple-50">
                <ListFilter className="w-4 h-4 text-purple-700" />
                <div>
                  <h3 className="text-xs uppercase font-black tracking-wider text-slate-800">Tipos de Eventos Participados</h3>
                  <p className="text-[10px] text-slate-400">Classificação conforme o tipo ou formato das atividades</p>
                </div>
              </div>

              {sortedTypes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-[11px] font-medium">
                  Confirme sua presença nos eventos passados para habilitar a estatística por tipo.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedTypes.map(({ type, count }) => {
                    const percentage = Math.round((count / maxTypeCount) * 100);
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span className="select-all">{type}</span>
                          <span className="text-slate-400 font-mono">
                            {count} {count === 1 ? 'part.' : 'part.'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CHRONOLOGICAL TIMELINE PROGRESSION */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-purple-50">
              <Calendar className="w-4 h-4 text-purple-700" />
              <div>
                <h3 className="text-xs uppercase font-black tracking-wider text-slate-800">Evolução do Engajamento Pastoral</h3>
                <p className="text-[10px] text-slate-400">Histórico de participações cronológicas por mês</p>
              </div>
            </div>

            {timelineData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-[11px] font-medium">
                Sua jornada ao longo do tempo aparecerá aqui assim que marcar presenças!
              </div>
            ) : (
              <div className="pt-2">
                <div className="flex flex-col md:flex-row items-end gap-3.5 h-36 border-b border-slate-100 pb-2 overflow-x-auto">
                  {timelineData.map((d) => {
                    const pHeight = Math.max(12, Math.round((d.count / maxMonthlyCount) * 100));
                    return (
                      <div key={d.label} className="flex-1 min-w-[70px] flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-purple-950 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md pointer-events-none -translate-y-2 z-10">
                          {d.count} {d.count === 1 ? 'evento' : 'eventos'}
                        </div>

                        <div className="text-[9px] font-black text-purple-800 mb-1">{d.count}</div>
                        <div 
                          className="w-full max-w-[28px] bg-gradient-to-t from-purple-700 to-fuchsia-400 rounded-t-md hover:from-purple-800 hover:to-fuchsia-500 transition-all duration-300 shadow-2xs"
                          style={{ height: `${pHeight}%` }}
                        />
                        <span className="text-[9px] text-slate-400 font-bold text-center truncate w-full mt-2 select-text">
                          {d.label.split(' de ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pl-4 space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-purple-500">Linha do Tempo das Missões</h4>
                  <div className="relative border-l border-purple-100 pl-4 space-y-4.5 ml-1.5 pb-2">
                    {timelineData.map((d) => {
                      return (
                        <div className="relative group" key={d.label}>
                          <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-600 border border-white shadow-2xs group-hover:bg-fuchsia-500 transition" />
                          <div>
                            <span className="text-[10px] font-black text-purple-900">{d.label}</span>
                            <p className="text-[10px] text-slate-500">
                              Confirmadas <strong className="text-slate-800">{d.count}</strong> presenças ativas neste período.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CONTENT FOR SUB-TAB 'hours' */}
      {subTab === 'hours' && (
        <div id="dedicated-hours-panel" className="space-y-6">
          {/* HEADER SENTENCE */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-indigo-900">Tempo Consagrado ao Senhor</h4>
              <p className="text-[11px] text-indigo-700 font-medium">
                "O tempo é um precioso dom de Deus confiado à nossa liberdade." Cada minuto servindo às pastorais e movimentos é uma semente de amor.
              </p>
            </div>
          </div>

          {/* PERIODIC HOURS BENTO BOXES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Week hours gauge card */}
            <div className="bg-white border border-purple-150 rounded-2xl p-5 shadow-3xs flex flex-col justify-between relative overflow-hidden">
              <span className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center">
                <Clock className="w-7 h-7 text-purple-200/60" />
              </span>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Esta Semana</span>
                <h3 className="text-2xl font-black text-purple-950">{weekHours}h</h3>
              </div>
              <div className="mt-3.5 pt-3.5 border-t border-purple-50 text-[10px] text-slate-500 leading-snug">
                Horas dedicadas a Deus de <strong className="text-purple-900">{startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</strong> até <strong className="text-purple-900">{endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</strong>.
              </div>
            </div>

            {/* Month hours gauge card */}
            <div className="bg-white border border-purple-150 rounded-2xl p-5 shadow-3xs flex flex-col justify-between relative overflow-hidden">
              <span className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                <Hourglass className="w-7 h-7 text-indigo-200/60" />
              </span>
              <div className="space-y-1 z-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por Mês</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <select
                      value={viewMonth}
                      onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                      className="bg-purple-50 text-[10px] font-black text-indigo-950 border border-purple-250 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {MONTHS_PT.map((mName, idx) => (
                        <option key={idx} value={idx}>{mName}</option>
                      ))}
                    </select>
                    <select
                      value={viewYear}
                      onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                      className="bg-purple-50 text-[10px] font-black text-indigo-950 border border-purple-250 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {[2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-indigo-950 pt-1">{monthHours}h</h3>
              </div>
              <div className="mt-3.5 pt-3.5 border-t border-purple-50 text-[10px] text-slate-500 leading-snug">
                Tempo total servido no mês de <strong className="text-indigo-900">{MONTHS_PT[viewMonth]} de {viewYear}</strong>.
              </div>
            </div>

            {/* Annual cumulative hours */}
            <div className="bg-white border border-purple-150 rounded-2xl p-5 shadow-3xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-purple-50/20">
              <span className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-fuchsia-55/70 flex items-center justify-center">
                <Activity className="w-7 h-7 text-fuchsia-200" />
              </span>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ano de {currentYear}</span>
                <h3 className="text-2xl font-black text-slate-900">{yearHours}h</h3>
              </div>
              <div className="mt-3.5 pt-3.5 border-t border-purple-50 text-[10px] text-slate-550 leading-snug">
                Dedicatório acumulado em todas as pastorais ao longo do ano corrente de <strong className="text-purple-900">{currentYear}</strong>.
              </div>
            </div>
          </div>

          {/* HOURS SPENT PER MOVEMENT CURRENT YEAR */}
          <div className="bg-white border border-purple-100 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-purple-50">
              <Award className="w-4 h-4 text-purple-700" />
              <div>
                <h3 className="text-xs uppercase font-black tracking-wider text-slate-800">Horas Dedicadas por Movimento no Ano</h3>
                <p className="text-[10px] text-slate-400">Total acumulado de tempo ativo investido em cada movimento católico em {currentYear}</p>
              </div>
            </div>

            {movementHoursRank.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-[11px] font-medium">
                Nenhum evento com duração cadastrado ou confirmado em {currentYear}. Comece confirmando presenças acima!
              </div>
            ) : (
              <div className="space-y-5 pt-1">
                {movementHoursRank.map((mh, idx) => {
                  const percentage = Math.round((mh.hours / maxMovementHours) * 100);
                  return (
                    <div key={mh.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {mh.logoUrl ? (
                            <img 
                              src={mh.logoUrl} 
                              alt={mh.name} 
                              className="w-6 h-6 rounded-md object-cover border border-purple-100" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-6 h-6 rounded-md ${mh.colorClass} text-white font-extrabold text-[9px] flex items-center justify-center shrink-0`}>
                              {mh.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-extrabold text-slate-800 truncate select-all">{mh.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-purple-800 font-mono bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                          {mh.hours} {mh.hours === 1 ? 'hora' : 'horas'}
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar matching the movement style's color */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-50">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${mh.colorClass}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
