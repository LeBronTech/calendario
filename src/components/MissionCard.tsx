/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  CheckSquare,
  Sparkles,
  Edit,
  Trash2,
  Globe,
  Share2,
} from 'lucide-react';
import { Mission, CatholicMovement, ChecklistItem } from '../types';
import { MOVEMENT_DATA, getMovementStyle } from '../utils/catholicData';
import ImagePreviewModal from './ImagePreviewModal';

interface MissionCardProps {
  key?: string | number;
  mission: Mission;
  onUpdateMission: (mission: Mission) => void;
  onEditMission: (mission: Mission) => void;
  onDeleteMission: (id: string) => void;
}

export default function MissionCard({
  mission,
  onUpdateMission,
  onEditMission,
  onDeleteMission,
}: MissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

  const style = getMovementStyle(mission.movement);

  // Countdown timer calculations
  useEffect(() => {
    if (!mission.dateStr) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const startDateTimeStr = `${mission.dateStr}T${mission.startTime || '00:00'}`;
      const difference = +new Date(startDateTimeStr) - +new Date();
      
      let newTimeLeft = null;

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [mission.dateStr, mission.startTime]);

  const toggleChecklist = (itemId: string) => {
    const updatedChecklist = mission.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateMission({ ...mission, checklist: updatedChecklist });
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newCheckItem.trim(),
      completed: false,
    };

    onUpdateMission({
      ...mission,
      checklist: [...mission.checklist, newItem],
    });
    setNewCheckItem('');
  };

  const handleRemoveCheckItem = (itemId: string) => {
    onUpdateMission({
      ...mission,
      checklist: mission.checklist.filter((item) => item.id !== itemId),
    });
  };

  const handleStatusChange = (status: Mission['status']) => {
    onUpdateMission({ ...mission, status });
  };

  const formattedDate = mission.dateStr
    ? new Date(mission.dateStr + 'T00:00').toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : 'Sem data';

  const completedCount = mission.checklist.filter((i) => i.completed).length;
  const progressPercent = mission.checklist.length
    ? Math.round((completedCount / mission.checklist.length) * 100)
    : 0;

  // Render countdown banner
  const renderCountdown = () => {
    if (!timeLeft) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-amber-900 shadow-sm animate-pulse">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
            Próxima Missão em:
          </span>
        </div>
        <div className="flex gap-2 font-mono text-xs font-extrabold bg-white border border-amber-100 rounded-lg py-1 px-2.5 shadow-sm text-slate-800">
          <div className="text-center">
            <span>{timeLeft.days}</span>
            <span className="text-[10px] text-amber-500 font-bold uppercase block -mt-1 scale-90">d</span>
          </div>
          <span className="text-amber-300">:</span>
          <div className="text-center">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[10px] text-amber-500 font-bold uppercase block -mt-1 scale-90">h</span>
          </div>
          <span className="text-amber-300">:</span>
          <div className="text-center">
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[10px] text-amber-500 font-bold uppercase block -mt-1 scale-90">m</span>
          </div>
          <span className="text-amber-300">:</span>
          <div className="text-center text-amber-700">
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[10px] text-amber-500 font-bold uppercase block -mt-1 scale-90">s</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${
        isExpanded ? 'ring-1 ring-slate-300 scale-[1.01]' : 'hover:border-slate-300'
      }`}
    >
      {/* Expanded Banner */}
      {isExpanded && style && (
        <div 
          onClick={() => setPreviewImgUrl(mission.bannerUrl || style.bannerUrl || null)}
          className="relative h-44 w-full bg-slate-900 text-white overflow-hidden cursor-pointer group/banner"
          title="Clique para expandir a imagem em tela cheia"
        >
          <img
            src={mission.bannerUrl || style.bannerUrl}
            alt={mission.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 filter saturate-[0.8] group-hover/banner:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded text-white ${mission.cardColor || style?.colorClass || 'bg-purple-600'} shadow-md`}>
                {style.fullName}
              </span>
              <h3 className="text-xl font-black mt-2 tracking-tight text-white drop-shadow-md">
                {mission.title}
              </h3>
            </div>
            <span className="text-[10px] font-extrabold bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-xs opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center gap-1 shadow-md">
              🔍 Ampliar Imagem
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 md:p-5 space-y-4">
        {/* Core Header (Not Expanded Layout) */}
        {!isExpanded && (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-sm ${mission.cardColor || style?.colorClass || 'bg-purple-600'}`}>
                  {style?.name || 'Missão'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formattedDate} - {mission.startTime || 'Sem horário'}
                </span>
                {mission.googleEventId ? (
                  <span className="text-[9px] bg-sky-50 border border-sky-200 text-sky-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" title="Sincronizado via Google Calendar">
                    <Globe className="w-2.5 h-2.5 animate-spin-slow" /> Google
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" title="Salvo localmente no navegador">
                    <Layers className="w-2.5 h-2.5" /> Local Only
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-slate-900 text-base tracking-tight leading-snug mt-1 flex items-center gap-1">
                {mission.title}
              </h4>
              {mission.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{mission.location}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onEditMission(mission)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-violet-700 rounded-lg transition"
                title="Editar evento"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteMission(mission.id)}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                title="Excluir evento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Controls for Expanded Header */}
        {isExpanded && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status da Missão:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['preparing', 'confirmed', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold uppercase tracking-wider transition ${
                      mission.status === st
                        ? 'bg-white text-violet-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st === 'preparing' ? 'Preparando' : st === 'confirmed' ? 'Confirmado' : 'Concluído'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditMission(mission)}
                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl text-xs font-bold text-violet-700 flex items-center gap-1.5 transition"
              >
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={() => onDeleteMission(mission.id)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>
        )}

        {/* Close Events Counter (shows nearest ticking info in header if expanded) */}
        {isExpanded && renderCountdown()}

        {/* Detailed Properties when Expanded */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Data e Horários</span>
                  <span>{formattedDate} • das {mission.startTime || '--:--'} às {mission.endTime || '--:--'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Localização / Paróquia</span>
                  <span>{mission.location || 'Não especificado'}</span>
                </div>
              </div>

              {mission.description && (
                <div className="bg-white border border-slate-200/60 rounded-lg p-2.5 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-0.5">Descrição da Missão:</span>
                  {mission.description}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Liturgia & Organização</span>
                  <div className="space-y-1 mt-1 font-medium text-slate-600">
                    <p>🎶 <span className="text-slate-400">Música:</span> {mission.musicMinister || 'Pendente de definição'}</p>
                    <p>📖 <span className="text-slate-400">Leitor/Equipe:</span> {mission.readers || 'Pendente de definição'}</p>
                  </div>
                </div>
              </div>

              {mission.materialsNeeded && mission.materialsNeeded.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Materiais Litúrgicos Necessários:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mission.materialsNeeded.map((mat, idx) => (
                      <span key={idx} className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-slate-300">
                        📦 {mat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checklist Preparation Section */}
        {isExpanded && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4.5 h-4.5 text-violet-700 shrink-0" />
                <span className="font-bold text-slate-900 text-xs">Ações Preparatórias da Secretaria ({progressPercent}%)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {completedCount} de {mission.checklist.length} tarefas
              </span>
            </div>

            {/* Preparation Progress Bar */}
            <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Checklist Items list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {mission.checklist.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Nenhum afazer cadastrado. Peça à Irmã Maria para sugerir uma lista de preparação pastoral.</p>
              ) : (
                mission.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg p-2 border border-slate-150 group/item transition"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklist(item.id)}
                        className="w-4 h-4 accent-violet-700 rounded border-slate-300 pointer-events-none"
                      />
                      <span
                        className={`text-xs ${
                          item.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-semibold'
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>

                    <button
                      onClick={() => handleRemoveCheckItem(item.id)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-red-600 rounded transition opacity-0 group-hover/item:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Action checklist insert input */}
            <form onSubmit={handleAddCheckItem} className="flex gap-2.5">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Insira um novo afazer (ex: Encomendar velas benta)"
                className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 outline-none focus:border-violet-500 focus:bg-white text-slate-800 py-1.5"
              />
              <button
                type="submit"
                disabled={!newCheckItem.trim()}
                className="bg-slate-800 text-white font-bold text-xs px-3.5 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition cursor-pointer"
              >
                + Adicionar
              </button>
            </form>
          </div>
        )}

        {/* Collapsible Action Footer of individual card */}
        <div className="flex border-t border-slate-100 pt-3 justify-center items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            id={`expand-mission-${mission.id}`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span>Recolher Detalhes</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Expandir Missão e Ver Checklist ({mission.checklist.length} tarefas)</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <ImagePreviewModal
        src={previewImgUrl}
        title={mission.title}
        onClose={() => setPreviewImgUrl(null)}
      />
    </div>
  );
}
