/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatholicMovement } from '../types';

export interface CatholicEvent {
  id: string;
  title: string;
  movement: CatholicMovement | string;
  dateStr: string; // YYYY-MM-DD
  endDateStr?: string; // YYYY-MM-DD (Optional for multi-day events)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  description: string;
  tipo: string;
  city: string;
  instagramUrl?: string;
  instagramImgUrl?: string;
  cardColor?: string;
}

export const SEEDED_CATHOLIC_EVENTS: CatholicEvent[] = [
  ...Array.from({ length: 24 }).map((_, i) => {
    const d = new Date(2026, i, 1);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const y = d.getFullYear();
    return {
      id: `missa-rosas-${y}-${m}`,
      title: "Missa das Rosas",
      movement: "Paróquia Santa Mãe de Deus",
      dateStr: `${y}-${m}-01`,
      startTime: "19:00",
      endTime: "20:30",
      location: "Paróquia Santa Mãe de Deus",
      description: "Missa das Rosas",
      tipo: "missa",
      city: "Local",
      cardColor: "bg-rose-600"
    };
  })
];
