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

export const SEEDED_CATHOLIC_EVENTS: CatholicEvent[] = [];
