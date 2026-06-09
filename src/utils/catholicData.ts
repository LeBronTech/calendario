/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatholicMovement, Mission } from '../types';

export interface MovementStyle {
  name: string;
  fullName: string;
  iconName: string;
  colorClass: string; // Tailwind bg class
  borderClass: string; // Tailwind border class
  textClass: string; // Tailwind text class
  gradientClass: string; // Tailwind gradient starting and ending
  bannerUrl: string; // Beautiful liturgy image
  shortDesc: string;
  logoUrl?: string; // Optional logo image
}

export const MOVEMENT_DATA: Record<CatholicMovement, MovementStyle> = {
  [CatholicMovement.RCC]: {
    name: 'RCC',
    fullName: 'Renovação Carismática Católica',
    iconName: 'Flame',
    colorClass: 'bg-amber-500',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-600',
    gradientClass: 'from-amber-600 to-red-600',
    bannerUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80', // Candlelight/Fire atmosphere
    shortDesc: 'Cultura de Pentecostes, grupos de oração carismáticos e efusão do Espírito Santo.',
    logoUrl: 'https://iili.io/B5Mh5Tx.jpg',
  },
  [CatholicMovement.EJNS]: {
    name: 'EJNS / ENS',
    fullName: 'Jovens de Nossa Senhora',
    iconName: 'Sparkles',
    colorClass: 'bg-blue-500',
    borderClass: 'border-blue-400',
    textClass: 'text-blue-600',
    gradientClass: 'from-blue-600 to-indigo-600',
    bannerUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=800&q=80', // Marian blue/Celestial stars look
    shortDesc: 'Espiritualidade mariana para jovens, vivência de sacramentos e partilha em equipe.',
  },
  [CatholicMovement.SHALOM]: {
    name: 'Shalom',
    fullName: 'Comunidade Católica Shalom',
    iconName: 'Anchor',
    colorClass: 'bg-emerald-600',
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-600',
    gradientClass: 'from-emerald-600 to-teal-600',
    bannerUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80', // Tau and peace/reconciliated look
    shortDesc: 'Carisma de pacificação, Louvor do Ressuscitado que passou pela Cruz.',
    logoUrl: 'https://iili.io/B51WMLF.jpg',
  },
  [CatholicMovement.VINCENTINOS]: {
    name: 'Vicentinos',
    fullName: 'Sociedade de São Vicente de Paulo',
    iconName: 'Heart',
    colorClass: 'bg-red-500',
    borderClass: 'border-red-400',
    textClass: 'text-red-600',
    gradientClass: 'from-red-600 to-rose-600',
    bannerUrl: 'https://images.unsplash.com/photo-1469571486117-4fd5b1110a78?auto=format&fit=crop&w=800&q=80', // Love/Caridade atmosphere
    shortDesc: 'Evangelização e socorro aos pobres e marginalizados através da caridade material e espiritual.',
  },
  [CatholicMovement.CANCAO_NOVA]: {
    name: 'Canção Nova',
    fullName: 'Comunidade Canção Nova',
    iconName: 'Radio',
    colorClass: 'bg-cyan-500',
    borderClass: 'border-cyan-400',
    textClass: 'text-cyan-600',
    gradientClass: 'from-cyan-600 to-blue-600',
    bannerUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=800&q=80', // Evengelization by media/music
    shortDesc: 'Evangelização através dos meios de comunicação e da música carismática.',
  },
  [CatholicMovement.TERCO_HOMENS]: {
    name: 'Terço dos Homens',
    fullName: 'Terço dos Homens',
    iconName: 'Disc',
    colorClass: 'bg-slate-700',
    borderClass: 'border-slate-500',
    textClass: 'text-slate-700',
    gradientClass: 'from-slate-700 to-neutral-800',
    bannerUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', // Mystical/Stone Rosary look
    shortDesc: 'Movimento de oração mariana exclusivo para homens, resgatando a fé familiar.',
  },
  [CatholicMovement.PAROQUIAL]: {
    name: 'Paroquial',
    fullName: 'Coordenação Paroquial / Missão Geral',
    iconName: 'Church',
    colorClass: 'bg-violet-600',
    borderClass: 'border-violet-400',
    textClass: 'text-violet-600',
    gradientClass: 'from-violet-600 to-fuchsia-600',
    bannerUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80', // Church architecture/Liturgy sanctity
    shortDesc: 'Atividades pastorais paroquiais, sacramentos ordinários e solenidades litúrgicas.',
  },
  [CatholicMovement.EJC]: {
    name: 'EJC',
    fullName: 'Encontro de Jovens com Cristo',
    iconName: 'Compass',
    colorClass: 'bg-rose-550',
    borderClass: 'border-rose-400 border-2',
    textClass: 'text-rose-600',
    gradientClass: 'from-rose-600 to-amber-600',
    bannerUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80',
    shortDesc: 'Evangelização e formação social e familiar de jovens nas paróquias.',
    logoUrl: 'https://iili.io/BtDLOPI.jpg',
  },
  [CatholicMovement.JSC]: {
    name: 'JSC',
    fullName: 'Jovens Seguidores de Cristo',
    iconName: 'Crown',
    colorClass: 'bg-indigo-550',
    borderClass: 'border-indigo-400 border-2',
    textClass: 'text-indigo-600',
    gradientClass: 'from-indigo-600 to-sky-600',
    bannerUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    shortDesc: 'Jovens anunciadores da Palavra, vivendo em profunda comunhão e serviço constante.',
    logoUrl: 'https://iili.io/CfNgHib.png',
  },
  [CatholicMovement.SEGUE_ME]: {
    name: 'Segue-me',
    fullName: 'Movimento Segue-me',
    iconName: 'Heart',
    colorClass: 'bg-orange-500',
    borderClass: 'border-orange-400 border-2',
    textClass: 'text-orange-650',
    gradientClass: 'from-orange-500 to-red-500',
    bannerUrl: 'https://images.unsplash.com/photo-1461532252291-68be3a1a4b81?auto=format&fit=crop&w=800&q=80',
    shortDesc: 'Encontro de Jovens com Cristo com ênfase no seguimento fiel dos passos de Jesus.',
    logoUrl: 'https://imgs.search.brave.com/seZXQDFA8W-o6Ru5HWbTT5yiImiKw8_2Gfxm5V8hekQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zZWd1/ZW1lYnJhc2lsaWEu/Y29tLmJyL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI1LzEyLzEt/TG9nb3RpcG9fT0ZJ/Q0lBTF9TRUdVRS1N/RV9fUG9zaXRpdm8t/RXNwZWNpYWwtc2Nh/bGVkLTEwMjR4MTAy/NC5wbmc',
  },
};

export function getAllMovements(): Record<string, MovementStyle> {
  const base = { ...MOVEMENT_DATA } as Record<string, MovementStyle>;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedCustom = window.localStorage.getItem('saved_custom_catholic_movements');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        Object.entries(parsed).forEach(([key, customInfo]: [string, any]) => {
          base[key] = {
            name: customInfo.name || key,
            fullName: customInfo.fullName || key,
            iconName: customInfo.iconName || 'Church',
            colorClass: customInfo.colorClass || 'bg-purple-600',
            borderClass: customInfo.borderClass || 'border-purple-400',
            textClass: customInfo.textClass || 'text-purple-600',
            gradientClass: customInfo.gradientClass || 'from-purple-600 to-indigo-750',
            bannerUrl: customInfo.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
            shortDesc: customInfo.shortDesc || 'Movimento personalizado cadastrado pelo missionário.',
            logoUrl: customInfo.logoUrl
          };
        });
      }
    }
  } catch (e) {
    console.error('Error loading custom movements', e);
  }
  return base;
}

export function getSortedMovements(): [string, MovementStyle][] {
  const all = getAllMovements();
  return Object.entries(all).sort((a, b) => {
    return a[1].name.localeCompare(b[1].name, 'pt-BR');
  });
}

export function getMovementStyle(movement: string | CatholicMovement | undefined): MovementStyle {
  if (!movement) {
    return MOVEMENT_DATA[CatholicMovement.PAROQUIAL];
  }
  
  const all = getAllMovements();
  let style: MovementStyle;
  if (movement in all) {
    style = { ...all[movement] };
  } else {
    style = {
      name: movement,
      fullName: movement,
      iconName: 'Church',
      colorClass: 'bg-purple-600',
      borderClass: 'border-purple-400',
      textClass: 'text-purple-600',
      gradientClass: 'from-purple-600 to-indigo-700',
      bannerUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
      shortDesc: 'Movimento personalizado cadastrado pelo missionário.'
    };
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedColors = window.localStorage.getItem('catholic_movement_colors_maria');
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        const col = parsed[movement];
        if (col) {
          style.colorClass = col;
        }
      }
    }
  } catch (e) {
    // Fail-safe if parsing fails or localStorage is blocked
  }

  return style;
}

function timeToMins(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

function getNextDayStr(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
}

export function getEffectiveEndDate(mission: Mission): string {
  if (mission.endDateStr) return mission.endDateStr;
  if (mission.startTime && mission.endTime) {
    const start = timeToMins(mission.startTime);
    const end = timeToMins(mission.endTime);
    if (end < start) {
      return getNextDayStr(mission.dateStr);
    }
  }
  return mission.dateStr;
}

export function isMissionOnDate(mission: Mission, dateStr: string): boolean {
  if (!mission.dateStr) return false;
  
  // If we have custom schedules, let's see if there is an explicit override for this date
  if (mission.dailySchedules && mission.dailySchedules.length > 0) {
    const daily = mission.dailySchedules.find(d => d.dateStr === dateStr);
    if (daily) {
      return daily.active; // If verified as inactive, return false so the day is free!
    }
  }

  const effectiveEndDate = getEffectiveEndDate(mission);
  return dateStr >= mission.dateStr && dateStr <= effectiveEndDate;
}


