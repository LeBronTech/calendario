/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Sparkles, Bell, X, Instagram } from 'lucide-react';
import { motion } from 'motion/react';
import { Mission } from '../types';
import { getMovementStyle } from '../utils/catholicData';

interface WarningCarouselProps {
  missions: Mission[];
  currentSimulatedDate: Date; // standard is June 6, 2026
  onSelectMission: (mission: Mission) => void;
  isCompact?: boolean;
}

export default function WarningCarousel({
  missions,
  currentSimulatedDate,
  onSelectMission,
  isCompact = false,
}: WarningCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDetailMission, setSelectedDetailMission] = useState<Mission | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const dragOffsetRef = useRef(0);

  const resetInactivity = () => {
    setLastActivity(Date.now());
  };

  const activeYear = currentSimulatedDate.getFullYear();
  const activeMonth = currentSimulatedDate.getMonth() + 1; // 1-indexed

  // Filter and sort events chronologically
  // 1st: Must be in the active calendar month (month and year of currentSimulatedDate)
  // 2nd: Must be upcoming (dateStr >= '2026-06-06', which is simulated today)
  const carouselEvents = missions
    .filter((m) => {
      if (!m.dateStr || m.status === 'completed') return false;

      const [y, mStr] = m.dateStr.split('-').map(Number);
      if (isNaN(y) || isNaN(mStr)) return false;

      const isInDisplayedMonth = y === activeYear && mStr === activeMonth;
      const isUpcoming = m.dateStr >= '2026-06-06';

      return isInDisplayedMonth && isUpcoming;
    })
    .sort((a, b) => {
      const dateCompare = (a.dateStr || '').localeCompare(b.dateStr || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

  // Automatically reset layout index or wrap bounds
  useEffect(() => {
    if (currentIndex >= carouselEvents.length && carouselEvents.length > 0) {
      setCurrentIndex(carouselEvents.length - 1);
    }
  }, [carouselEvents.length, currentIndex]);

  // Automatic slideshow cycle for Personal Agenda carousel
  useEffect(() => {
    if (carouselEvents.length <= 1) return;

    const interval = setInterval(() => {
      // Pause slideshow if user is hovering, modal is open
      if (isHovered || selectedDetailMission !== null) {
        setLastActivity(Date.now());
        return;
      }

      const elapsed = Date.now() - lastActivity;
      // Resume only after 5s of inactivity and scroll every 3s
      if (elapsed >= 5000 && elapsed % 3000 < 1000) {
        setCurrentIndex((prev) => (prev + 1) % carouselEvents.length);
      }
    }, 1000); // Check every second for reactivity

    return () => clearInterval(interval);
  }, [carouselEvents.length, lastActivity, isHovered, selectedDetailMission]);

  if (carouselEvents.length === 0) {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const currentMonthName = monthNames[currentSimulatedDate.getMonth()];
    return (
      <div className="bg-purple-50 p-4.5 rounded-2xl border border-purple-100 flex items-center justify-between text-purple-900 font-bold h-[120px] sm:h-[130px] max-w-sm mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          <span className="text-xs font-sans">
            Nenhuma missão futura cadastrada para <strong>{currentMonthName} de {activeYear}</strong>.
          </span>
        </div>
      </div>
    );
  }

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetInactivity();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : carouselEvents.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetInactivity();
    setCurrentIndex((prev) => (prev < carouselEvents.length - 1 ? prev + 1 : 0));
  };

  const getEventDateSpan = (event: Mission, truncateMonth = false): string => {
    const start = new Date(event.dateStr + 'T00:00');
    const monthFormat = truncateMonth ? 'short' : 'long';
    if (!event.endDateStr || event.endDateStr === event.dateStr) {
      return start.toLocaleDateString('pt-BR', { day: 'numeric', month: monthFormat });
    }
    const end = new Date(event.endDateStr + 'T00:00');
    return `${start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} a ${end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-xs space-y-3 w-full">
      <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
        <h3 className="text-xs font-black uppercase text-purple-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
          Próximas missões deste mês
        </h3>
        <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-lg font-sans">
          {currentIndex + 1} de {carouselEvents.length}
        </span>
      </div>

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          resetInactivity();
        }}
        onTouchStart={() => {
          setIsHovered(true);
          resetInactivity();
        }}
        onTouchEnd={() => {
          setIsHovered(false);
          resetInactivity();
        }}
        className={`relative ${isCompact ? 'h-[120px] sm:h-[130px] max-w-sm mx-auto' : 'h-[240px] sm:h-[280px]'} w-full rounded-2xl overflow-hidden bg-white border border-purple-100 shadow-3xs flex flex-col justify-end group transition-all duration-300`}
      >
        {/* Slide Content rendering */}
        {carouselEvents.map((event, idx) => {
          const isCurrent = idx === currentIndex;
          const mStyle = getMovementStyle(event.movement);
          
          let bgImage = '';
          if (event.instagramImgUrl) {
            bgImage = event.instagramImgUrl;
          } else if (event.bannerUrl) {
            bgImage = event.bannerUrl;
          } else {
            bgImage = mStyle?.logoUrl || mStyle?.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80';
          }

          return (
            <motion.div
              key={event.id}
              /* ... (keep drag/tap logic) ... */
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onTapStart={() => {
                dragOffsetRef.current = 0;
              }}
              onDragStart={() => {
                dragOffsetRef.current = 0;
                resetInactivity();
                setIsHovered(true);
              }}
              onDrag={(e, info) => {
                dragOffsetRef.current = Math.max(dragOffsetRef.current, Math.abs(info.offset.x));
              }}
              onDragEnd={(e, info) => {
                setIsHovered(false);
                resetInactivity();
                const threshold = 50;
                if (info.offset.x < -threshold) {
                  handleNext();
                } else if (info.offset.x > threshold) {
                  handlePrev();
                }
              }}
              onTap={() => {
                resetInactivity();
                if (dragOffsetRef.current < 15) {
                  setSelectedDetailMission(event);
                }
              }}
              className={`absolute inset-0 transition-all duration-700 ease-in-out flex ${isCompact ? 'flex-row items-center p-3' : 'flex-col justify-end p-4 sm:p-5'} select-none ${
                isCurrent ? 'opacity-100 z-10 scale-100 cursor-grab active:cursor-grabbing' : 'opacity-0 z-0 scale-95 pointer-events-none'
              }`}
            >
              {/* Background cover image or Circle image */}
              {isCompact ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-purple-100">
                    <img src={bgImage} alt="Event" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
              ) : (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center select-none bg-no-repeat pointer-events-none"
                    style={{ backgroundImage: `url("${bgImage}")` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-900/75 to-transparent pointer-events-none" />
                </>
              )}

              {/* Overlaid Event Details inside slide */}
              <div className={`relative z-10 space-y-1.5 font-semibold pointer-events-none ${isCompact ? 'pl-3' : ''}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-[9px] ${isCompact ? 'bg-purple-100 text-purple-900' : 'bg-purple-700 text-white'} font-black uppercase px-2 py-0.5 rounded shadow-sm font-sans`}>
                    📅 {getEventDateSpan(event)}
                  </span>
                  {event.startTime && (
                    <span className={`text-[9px] ${isCompact ? 'bg-purple-50 text-purple-700' : 'bg-white/20 text-white'} font-bold ${isCompact ? '' : 'backdrop-blur-xs'} px-2 py-0.5 rounded font-sans`}>
                      ⏱️ {event.startTime}
                    </span>
                  )}
                </div>

                <h4 className={`text-sm ${isCompact ? 'text-purple-950' : 'text-white'} font-black leading-tight drop-shadow-sm font-sans`}>
                  {event.title}
                </h4>

                {!isCompact && (
                  <p className="text-[10px] sm:text-xs text-purple-100/95 leading-snug line-clamp-2 max-w-2xl drop-shadow-xs font-semibold">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Manual Slide Arrows */}
        {carouselEvents.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 backdrop-blur-xs cursor-pointer border border-white/10"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 backdrop-blur-xs cursor-pointer border border-white/10"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Navigation Indicator Dots */}
        {carouselEvents.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
            {carouselEvents.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetInactivity();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 pointer-events-auto cursor-pointer ${
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                }`}
                title={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pop up modal informativo for selected visual slide */}
      {selectedDetailMission && (() => {
        const event = selectedDetailMission;
        const style = getMovementStyle(event.movement);
        let bgImage = '';
        if (event.instagramImgUrl) {
          bgImage = event.instagramImgUrl;
        } else if (event.bannerUrl) {
          bgImage = event.bannerUrl;
        } else {
          bgImage = style?.logoUrl || style?.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80';
        }

        return (
          <div className="fixed inset-0 bg-purple-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in text-slate-800">
            <div className="bg-[#FFFDFD] rounded-3xl border border-purple-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
              
              {/* Header Image with Overlays */}
              <div 
                className="h-[180px] sm:h-[220px] w-full bg-cover bg-center relative shrink-0"
                style={{ backgroundImage: `url("${bgImage}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-900/50 to-transparent" />
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDetailMission(null);
                  }}
                  className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition cursor-pointer z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Overlaid Badges and Title */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1 z-10 font-sans">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-[9px] text-white uppercase font-black px-2 py-0.5 rounded shadow-xs ${style?.colorClass || 'bg-purple-700'}`}>
                      {style?.name || 'Missão'}
                    </span>
                    {event.tipo && (
                      <span className="text-[9px] bg-white/20 text-white font-black uppercase backdrop-blur-xs px-2 py-0.5 rounded">
                        {event.tipo}
                      </span>
                    )}
                    {event.status && (
                      <span className="text-[9px] bg-fuchsia-700 text-white font-black uppercase px-2 py-0.5 rounded shadow-sm">
                        STATUS: {event.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-sm font-sans pt-1">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 select-text">
                {/* Details Section */}
                <div className="grid grid-cols-2 gap-3 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100/60 font-semibold text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-purple-600 font-extrabold uppercase tracking-widest block font-sans">Data e Período</span>
                    <p className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 pt-0.5">
                      <span className="text-sm font-sans">📅</span> {getEventDateSpan(event)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-purple-600 font-extrabold uppercase tracking-widest block font-sans">Horário</span>
                    <p className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 pt-0.5 font-sans">
                      <span className="text-sm">⏱️</span> {event.startTime || '19:30'}h {event.endTime ? `às ${event.endTime}h` : ''}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-0.5 pt-2 border-t border-purple-100/40">
                    <span className="text-[9px] text-purple-600 font-extrabold uppercase tracking-widest block font-sans">Local / Paróquia</span>
                    <p className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" /> {event.location || 'Não especificado'}
                    </p>
                  </div>
                </div>

                {/* My Action / Roles section */}
                {event.roles && event.roles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-purple-600 font-extrabold uppercase tracking-widest block font-sans">Minhas Atuações / Atividades neste Dia</span>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-purple-50/10 border border-purple-100 rounded-xl">
                      {event.roles.map((r) => (
                        <span key={r} className="text-[10px] font-bold bg-purple-100 text-purple-800 rounded-lg px-2.5 py-1 uppercase tracking-wide font-sans">
                          ✨ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description Text Box */}
                {event.description && (
                  <div className="space-y-1.5 font-sans">
                    <span className="text-[9px] text-purple-600 font-extrabold uppercase tracking-widest block">Sobre o Evento</span>
                    <div className="bg-white rounded-xl p-3 border border-purple-100/60 text-xs text-slate-700 leading-relaxed max-h-[160px] overflow-y-auto font-medium select-text">
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
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-850 hover:from-purple-800 hover:to-indigo-950 text-white font-extrabold text-xs rounded-xl transition shadow active:scale-95 cursor-pointer text-center w-full uppercase font-sans"
                  >
                    <Instagram className="w-4 h-4 text-purple-100 animate-pulse" />
                    Ver postagem vinculada no Instagram
                  </a>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-purple-50/40 px-5 py-4 border-t border-purple-100 flex gap-2 justify-end items-center shrink-0 font-sans">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDetailMission(null);
                  }}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                >
                  Fechar Detalhes
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
