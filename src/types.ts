/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CatholicMovement {
  RCC = 'rcc',
  EJNS = 'ejns',
  SHALOM = 'shalom',
  VINCENTINOS = 'vincentinos',
  CANCAO_NOVA = 'cancao_nova',
  TERCO_HOMENS = 'terco_homens',
  PAROQUIAL = 'paroquial',
  EJC = 'ejc',
  JSC = 'jsc',
  SEGUE_ME = 'segue_me'
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyTimeConfig {
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  active: boolean; // If false/inactive, this day is not active (leaving the day's hours free for other events)
}

export interface Mission {
  id: string;
  title: string;
  movement: CatholicMovement | string;
  dateStr: string; // YYYY-MM-DD
  endDateStr?: string; // YYYY-MM-DD (Optional End Date)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  description: string;
  bannerUrl?: string; // Predefined banner image or base64 / custom url
  status: 'backlog' | 'preparing' | 'confirmed' | 'completed';
  checklist: ChecklistItem[]; // For backward compatibility / secretary suggestions
  musicMinister?: string;
  readers?: string;
  materialsNeeded?: string[];
  googleEventId?: string; // Synced with Google Calendar
  synced: boolean;
  offlineSaved?: boolean;
  createdAt: string;

  // New fields requested by user
  instagramUrl?: string;
  instagramImgUrl?: string; // base64 payload uploaded from gallery of the instagram post
  movementLogoUrl?: string; // base64 payload uploaded from gallery of the custom movement logo
  tipo?: 'vigilia' | 'luau' | 'adoracao' | 'retiro' | 'encontro' | 'acampamento' | 'seminario' | 'grupo' | string;
  roles?: string[]; // ['cantar', 'tocar', 'pregar', 'interceder', 'servir']
  observation?: string;
  dailySchedules?: DailyTimeConfig[]; // Custom schedules per day for multi-day events
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'secretary';
  text: string;
  timestamp: string;
  suggestedEvent?: Partial<Mission>; // Suggested event output from parsing text
}
