/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth } from './firebaseAuth';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: { userId: auth.currentUser?.uid, email: auth.currentUser?.email },
    operationType,
    path
  };
  console.warn('Firestore Notification: ', JSON.stringify(errInfo));
}

// System to recover documents from any previously used potential paths that might have occurred on Vercel
import { getDoc } from 'firebase/firestore';

export async function recoverLostCatholicEvents(userId: string): Promise<CatholicEvent[]> {
  const pathsToTry = [
    `users/${userId}/catholicEvents`,
    `users/${userId}/catholic_events`,
    `users/${userId}/events`,
    `catholicEvents`,
    `catholic_events`,
    `events`
  ];
  const recovered: CatholicEvent[] = [];
  try {
    const userDocRef = doc(db, `users/${userId}`);
    const uDoc = await getDoc(userDocRef).catch(() => null);
    if (uDoc && uDoc.exists()) {
      const data = uDoc.data();
      if (data && Array.isArray(data.catholicEvents)) {
         data.catholicEvents.forEach(e => recovered.push(e as CatholicEvent));
      }
    }
    for (const path of pathsToTry) {
      try {
        const colRef = collection(db, path);
        const snaps = await getDocs(query(colRef));
        snaps.forEach((docSnap) => {
          const data = docSnap.data();
          if (!path.includes('users/') && data.userId && data.userId !== userId) return;
          if (data && (data.title || data.dateStr)) {
            recovered.push({ ...data, id: data.id || docSnap.id } as CatholicEvent);
          }
        });
      } catch (e) {}
    }
  } catch(e) {}
  
  const unique = new Map<string, CatholicEvent>();
  recovered.forEach(e => unique.set(e.id, e));
  return Array.from(unique.values());
}

export async function recoverLostMissions(userId: string): Promise<Mission[]> {
  const pathsToTry = [
    `users/${userId}/missions_db`,
    `users/${userId}/events`,
    `users/${userId}/missions_db_maria`,
    `missions`,
    `events`,
    `missions_db`,
    `catholic_events`
  ];
  const recovered: Mission[] = [];
  try {
    // Check if they were an array in the user document
    const userDocRef = doc(db, `users/${userId}`);
    const uDoc = await getDoc(userDocRef).catch(() => null);
    if (uDoc && uDoc.exists()) {
      const data = uDoc.data();
      if (data && Array.isArray(data.missions)) {
         data.missions.forEach(m => recovered.push(m as Mission));
      }
      if (data && typeof data === 'object') {
         // Maybe keys as ids
         Object.values(data).forEach(val => {
            if (val && typeof val === 'object' && ('title' in val || 'dateStr' in val) && !Array.isArray(val)) {
                recovered.push({ ...val, id: (val as any).id || (Math.random().toString(36).substr(2, 9)) } as Mission);
            }
         });
      }
    }

    for (const path of pathsToTry) {
      try {
        const colRef = collection(db, path);
        
        let q = query(colRef);
        if (!path.includes('users/')) {
          // If global collection but missing userId, we'll just try to fetch all 
          // because rules are currently public `if true;`
        }
        
        const snaps = await getDocs(q);
        snaps.forEach((docSnap) => {
          const data = docSnap.data();
          // Filter out missing userIds if it's a global collection
          if (!path.includes('users/') && data.userId && data.userId !== userId) {
             return;
          }
          if (data && (data.title || data.dateStr)) {
            recovered.push({ ...data, id: data.id || docSnap.id } as Mission);
          }
        });
      } catch (e) {
      }
    }
  } catch(e) {}
  
  // Deduplicate
  const unique = new Map<string, Mission>();
  recovered.forEach(m => unique.set(m.id, m));
  return Array.from(unique.values());
}


// Fetch user's missions from Firestore
export async function downloadMissions(userId: string): Promise<Mission[]> {
  const path = `users/${userId}/missions`;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Mission[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.data().id || docSnap.id } as Mission);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Subscribe to user's missions for real-time updates
export function subscribeToMissions(userId: string, onUpdate: (missions: Mission[]) => void): () => void {
  const path = `users/${userId}/missions`;
  const q = query(collection(db, path));
  
  return onSnapshot(q, (snapshot) => {
    const list: Mission[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.data().id || docSnap.id } as Mission);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

// Save/Update mission in Firestore
export async function uploadMission(userId: string, mission: Mission): Promise<void> {
  const path = `users/${userId}/missions`;
  try {
    // Remove undefined fields to prevent Firestore errors
    const cleanedMission = JSON.parse(JSON.stringify(mission));
    await setDoc(doc(db, path, mission.id), cleanedMission);
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
      list.push({ ...docSnap.data(), id: docSnap.data().id || docSnap.id } as CatholicEvent);
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
