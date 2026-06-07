/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lightbulb, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Mission, CatholicMovement } from '../types';
import { MOVEMENT_DATA, getMovementStyle } from '../utils/catholicData';

interface BacklogViewProps {
  missions: Mission[];
  onAddBacklog: (title: string, movement: CatholicMovement) => void;
  onSchedule: (mission: Mission) => void;
  onDelete: (id: string) => void;
}

export default function BacklogView({
  missions,
  onAddBacklog,
  onSchedule,
  onDelete,
}: BacklogViewProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newMove, setNewMove] = useState<CatholicMovement>(CatholicMovement.PAROQUIAL);

  const backlogMissions = missions.filter((m) => m.status === 'backlog' && !m.dateStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddBacklog(newTitle, newMove);
    setNewTitle('');
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-xs p-4 flex flex-col h-full text-purple-950 font-sans select-none">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-purple-600 fill-purple-100" />
        <h3 className="font-bold text-purple-950 text-sm">Projetos & Ideias sem Data</h3>
      </div>

      {/* Idea Quick Insertion Form */}
      <form onSubmit={handleSubmit} className="mb-4 bg-purple-50/50 p-3 rounded-xl border border-purple-100/80">
        <p className="text-[10px] uppercase font-black text-purple-600 mb-2">Inserir nova ideia rápida</p>
        <div className="space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Cerco de Jericó de Casais"
            className="w-full bg-white border border-purple-200 text-purple-900 text-xs rounded-lg px-2.5 py-1.5 focus:border-purple-600 outline-none font-semibold"
          />
          <div className="flex gap-2">
            <select
              value={newMove}
              onChange={(e) => setNewMove(e.target.value as CatholicMovement)}
              className="flex-1 bg-white border border-purple-200 text-purple-800 text-[11px] rounded-lg px-2 py-1 focus:border-purple-600 outline-none font-bold"
            >
              {Object.entries(MOVEMENT_DATA).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="bg-purple-750 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
        </div>
      </form>
 
      {/* Backlog List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] md:max-h-none">
        {backlogMissions.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-purple-100 rounded-xl bg-purple-50/20">
            <p className="text-xs text-purple-800 font-bold">Nenhuma ideia pendente na gaveta.</p>
            <p className="text-[10px] text-purple-500 mt-1.5 leading-relaxed">Converse com a assistente ou use o formulário acima para registrar insights missionários sem dia marcado.</p>
          </div>
        ) : (
          backlogMissions.map((m) => {
            const style = getMovementStyle(m.movement);
            return (
              <div
                key={m.id}
                className="p-3 bg-white hover:bg-purple-50/20 border border-purple-100 rounded-xl transition shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-purple-950 text-xs leading-snug">{m.title}</h4>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="p-1 text-purple-400 hover:text-red-500 rounded hover:bg-purple-50 transition"
                      title="Remover ideia"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {m.description && (
                    <p className="text-[10px] text-purple-500 mt-1.5 line-clamp-2 leading-relaxed">{m.description}</p>
                  )}
                </div>
 
                <div className="flex items-center justify-between pt-2 border-t border-purple-50">
                  <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded ${style?.colorClass || 'bg-purple-400'}`}>
                    {style?.name || m.movement}
                  </span>
 
                  <button
                    onClick={() => onSchedule(m)}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-purple-700 hover:text-purple-600 transition"
                  >
                    <span>Agendar agora</span>
                    <ArrowRight className="w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
