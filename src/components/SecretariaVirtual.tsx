/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Plus, Calendar, MapPin, Clock, ArrowRight, HelpCircle } from 'lucide-react';
import { ChatMessage, Mission } from '../types';
import { getMovementStyle } from '../utils/catholicData';

interface SecretariaVirtualProps {
  onAddMission: (mission: Partial<Mission>) => void;
}

export default function SecretariaVirtual({ onAddMission }: SecretariaVirtualProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'secretary',
      text: 'Salve Maria! Eu sou a Irmã Maria, sua Secretária Virtual de Missões. Posso te ajudar a organizar seus eventos litúrgicos, criar projetos pastorais, checklists e preencher sua agenda! O que estamos organizando hoje para o Reino?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    if (!textToSend) setInputText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-8), // Send recent context
          userMessage: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do servidor');
      }

      const data = await response.json();

      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'secretary',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedEvent: data.suggestedEvent || undefined,
      };

      setMessages((prev) => [...prev, replyMsg]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'secretary',
          text: 'Mil perdões, missionário. Tive uma falha em minha conexão para raciocinar. Verifique se o segredo do Gemini API Key está devidamente cadastrado no painel.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const quickPrompts = [
    { label: 'Nova Missão', text: 'Crie uma Missa de Avivamento para as Equipes EJNS no dia 18 de Junho às 19:30 na Paróquia Principal' },
    { label: 'Checklist Terço', text: 'Me dê sugestões de cantos carismáticos em uma pregação da RCC com observações?' },
    { label: 'Ideia Shalom', text: 'Tenho uma proposta de evangelização para o movimento Shalom sem data marcada ainda' },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-xs text-xs text-purple-950 select-none">
      
      {/* Header themed with deep violet */}
      <div className="bg-purple-950 text-white p-4 flex items-center gap-3 border-b border-purple-900 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-purple-750 border border-purple-600 flex items-center justify-center font-black text-xs text-white shadow shadow-purple-900/40">
          ✨ IM
        </div>
        <div>
          <h3 className="font-extrabold tracking-tight text-xs text-purple-100 uppercase">Irmã Maria</h3>
          <p className="text-[10px] text-purple-300 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse inline-block" />
            Secretária Virtual Paroquial
          </p>
        </div>
      </div>

      {/* Messages Board */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px] md:max-h-none bg-[#FAF8FF]">
        {messages.map((m) => {
          const isSec = m.sender === 'secretary';
          const style = getMovementStyle(m.suggestedEvent?.movement);

          return (
            <div key={m.id} className={`flex ${isSec ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[85%] flex gap-2">
                {isSec && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xs shrink-0 self-end">
                    ⛪
                  </div>
                )}
                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                      isSec
                        ? 'bg-white text-purple-950 rounded-bl-none border border-purple-100'
                        : 'bg-purple-700 text-white rounded-br-none font-bold'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* Rich Suggested Event Proposal */}
                    {isSec && m.suggestedEvent && (
                      <div className="mt-3 pt-3 border-t border-purple-100">
                        <span className="text-[9px] font-black text-purple-800 uppercase tracking-widest block mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500 fill-purple-100" />
                          Sugestão de Missão Identificada
                        </span>
                        <div className="bg-purple-50/50 border border-purple-200 p-3 rounded-xl">
                          <h4 className="font-extrabold text-purple-950 text-xs">
                            {m.suggestedEvent.title || 'Evento sem título'}
                          </h4>

                          <div className="flex flex-wrap gap-1 my-2">
                            {m.suggestedEvent.movement && style && (
                              <span className={`text-[9px] px-2 py-0.5 rounded text-white font-black ${style.colorClass}`}>
                                {style.name}
                              </span>
                            )}
                            <span className="text-[9px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-black">
                              {m.suggestedEvent.dateStr ? m.suggestedEvent.dateStr : 'Ideias sem data'}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-purple-700 mt-2 font-semibold">
                            {m.suggestedEvent.startTime && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                <span>
                                  {m.suggestedEvent.startTime || '19:00'}
                                  {m.suggestedEvent.endTime ? ` às ${m.suggestedEvent.endTime}` : ''}
                                </span>
                              </div>
                            )}
                            {m.suggestedEvent.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                <span className="truncate">{m.suggestedEvent.location}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => onAddMission(m.suggestedEvent!)}
                            className="w-full mt-3 flex items-center justify-center gap-1 bg-purple-700 hover:bg-purple-600 text-white font-extrabold py-1.5 rounded-lg text-[10px] transition duration-150 shadow cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {m.suggestedEvent.dateStr ? 'Confirmar na Agenda' : 'Salvar Ideia Pastoral'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] text-purple-400 mt-0.5 ${!isSec ? 'text-right' : ''}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs shrink-0 self-end">
                ⛪
              </div>
              <div className="bg-white text-purple-950 rounded-2xl rounded-bl-none p-3 border border-purple-100 shadow-xs">
                <span className="flex items-center gap-2 text-xs text-purple-500">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                  <span className="text-[11px] font-bold">Verificando escritos no santuário...</span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 pt-2 space-y-1 bg-white border-t border-purple-100 select-none">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1 mb-1">
            <HelpCircle className="w-3.5 h-3.5" /> Exemplos de comandos rápidos:
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pb-1">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(p.text)}
                type="button"
                className="w-full text-left text-xs bg-purple-50/50 hover:bg-purple-100/50 hover:border-purple-300 transition border border-purple-100 rounded-lg p-2 flex items-center justify-between text-purple-800 group cursor-pointer"
              >
                <span className="font-extrabold block truncate text-[10px] text-purple-950 group-hover:text-purple-900">
                  ⚡ {p.label}: <span className="font-normal text-purple-500">{p.text}</span>
                </span>
                <ArrowRight className="w-3 h-3 text-purple-400 shrink-0 group-hover:text-purple-700 transition ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls */}
      <div className="p-3 bg-white border-t border-purple-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Perguntar ou ditar missão para Irmã Maria..."
            className="flex-1 bg-purple-50/40 border border-purple-200 text-purple-900 text-xs rounded-xl px-3 outline-none focus:border-purple-600 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-8 h-8 rounded-xl bg-purple-700 active:bg-purple-800 text-white flex items-center justify-center shadow hover:scale-103 active:scale-95 duration-100 disabled:opacity-40 disabled:scale-100 cursor-pointer"
          >
            <Send className="w-3 h-3 fill-current" />
          </button>
        </form>
      </div>
    </div>
  );
}
