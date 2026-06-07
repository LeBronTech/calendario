/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth } from './firebaseAuth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Mission } from '../types';
import { CatholicEvent } from './seededCatholicEvents';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fetch user's missions from Firestore
export async function downloadMissions(userId: string): Promise<Mission[]> {
  const path = `users/${userId}/missions`;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Mission[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Mission);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save/Update mission in Firestore
export async function uploadMission(userId: string, mission: Mission): Promise<void> {
  const path = `users/${userId}/missions`;
  try {
    await setDoc(doc(db, path, mission.id), mission);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${mission.id}`);
  }
}

// Delete mission from Firestore
export async function removeMission(userId: string, missionId: string): Promise<void> {
  const path = `users/${userId}/missions`;
  try {
    await deleteDoc(doc(db, path, missionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${missionId}`);
  }
}

// Fetch user's customized catholic events from Firestore
export async function downloadCatholicEvents(userId: string): Promise<CatholicEvent[]> {
  const path = `users/${userId}/catholicEvents`;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: CatholicEvent[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CatholicEvent);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save/Update custom catholic event in Firestore
export async function uploadCatholicEvent(userId: string, event: CatholicEvent): Promise<void> {
  const path = `users/${userId}/catholicEvents`;
  try {
    await setDoc(doc(db, path, event.id), event);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${event.id}`);
  }
}

// Delete customized catholic event from Firestore
export async function removeCatholicEvent(userId: string, eventId: string): Promise<void> {
  const path = `users/${userId}/catholicEvents`;
  try {
    await deleteDoc(doc(db, path, eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${eventId}`);
  }
}
