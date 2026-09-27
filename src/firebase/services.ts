import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { db } from './config';
import { Task, Priority, TaskStatus, FirestoreSyncMetadata } from '../types';

const TASKS_COLLECTION = 'tasks';

/**
 * Control Firestore network connectivity (online/offline toggle)
 */
export async function setFirestoreNetworkEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await enableNetwork(db);
    } else {
      await disableNetwork(db);
    }
  } catch (err: any) {
    console.warn('Firestore network update error:', err);
  }
}

/**
 * Subscribe in real-time to tasks belonging to a specific user
 */
export function subscribeToTasks(
  userId: string,
  onUpdate: (tasks: Task[], metadata?: FirestoreSyncMetadata) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          tasks.push({
            id: docSnap.id,
            userId: data.userId || userId,
            title: data.title || 'Untitled Task',
            description: data.description || '',
            priority: (data.priority as Priority) || 'medium',
            status: (data.status as TaskStatus) || 'todo',
            order: typeof data.order === 'number' ? data.order : 0,
            dueDate: data.dueDate || new Date().toISOString().split('T')[0],
            progress: typeof data.progress === 'number' ? data.progress : 0,
            discipline: data.discipline || 'General',
            wbsCode: data.wbsCode || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            googleCalendarEventId: data.googleCalendarEventId || '',
          });
        });

        // Sort by order ascending
        tasks.sort((a, b) => a.order - b.order);
        onUpdate(tasks, {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error('Failed to setup Firestore listener:', err);
    onError(err);
    return () => {};
  }
}

/**
 * Create a new task in Firestore
 */
export async function createTask(
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now();
  const docData = {
    ...task,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), docData);
  return docRef.id;
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  const sanitizedUpdates: Record<string, any> = {
    ...updates,
    updatedAt: Date.now(),
  };
  delete sanitizedUpdates.id; // do not store doc ID inside doc fields

  await updateDoc(docRef, sanitizedUpdates);
}

/**
 * Batch update orders and/or statuses when drag-and-drop reordering occurs
 */
export async function batchUpdateTaskOrders(
  updatedTasks: { id: string; order: number; status?: TaskStatus }[]
): Promise<void> {
  if (updatedTasks.length === 0) return;

  const batch = writeBatch(db);
  const now = Date.now();

  for (const item of updatedTasks) {
    const docRef = doc(db, TASKS_COLLECTION, item.id);
    const updatePayload: Record<string, any> = {
      order: item.order,
      updatedAt: now,
    };
    if (item.status) {
      updatePayload.status = item.status;
    }
    batch.update(docRef, updatePayload);
  }

  await batch.commit();
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(docRef);
}

/**
 * Seed sample initial tasks for demonstration and quick productivity
 * Includes Smart India Hackathon / Oil India Limited infrastructure schedule linking activities
 */
export async function seedInitialTasks(userId: string): Promise<void> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const q = query(tasksRef, where('userId', '==', userId));
  const existingDocs = await getDocs(q);

  if (!existingDocs.empty) {
    return; // Already has tasks
  }

  const today = new Date();
  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const sampleTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId,
      title: 'Structural Steel Column Alignment Inspection',
      description: 'Validate verticality and bolt torque specs for Main Compressor House Grid 4-8.',
      priority: 'critical',
      status: 'in_progress',
      order: 0,
      dueDate: addDays(1),
      progress: 65,
      discipline: 'Civil',
      wbsCode: 'L5-CIV-041',
      tags: ['Inspection', 'Structural', 'Milestone L5'],
    },
    {
      userId,
      title: 'Hydro-Testing Line 24-XX Crude Transfer Spool',
      description: 'Complete 24-hour pressure retention hold at 1.5x design pressure with safety clearances.',
      priority: 'high',
      status: 'todo',
      order: 1,
      dueDate: addDays(2),
      progress: 15,
      discipline: 'Piping',
      wbsCode: 'L5-PIP-108',
      tags: ['HydroTest', 'Quality', 'Primavera L5'],
    },
    {
      userId,
      title: 'Substation Transformer Switchgear Cable Laying',
      description: 'Pull and terminate 33kV armored copper cables connecting Substation 2 to MCC-A.',
      priority: 'high',
      status: 'in_progress',
      order: 2,
      dueDate: addDays(3),
      progress: 40,
      discipline: 'Electrical',
      wbsCode: 'L5-ELE-022',
      tags: ['Switchgear', 'Power'],
    },
    {
      userId,
      title: 'HSE Safety Audit & Hot Work Permit Verification',
      description: 'Daily field clearance audit for welding enclosures, gas detectors, and fire suppression stations.',
      priority: 'critical',
      status: 'review',
      order: 3,
      dueDate: addDays(0), // Today!
      progress: 90,
      discipline: 'HSE',
      wbsCode: 'L4-HSE-005',
      tags: ['Safety', 'Mandatory', 'Daily'],
    },
    {
      userId,
      title: 'SCADA Telemetry RTU Loop Calibration',
      description: 'Check 4-20mA signals from crude oil flow transmitters to control room PLC racks.',
      priority: 'medium',
      status: 'todo',
      order: 4,
      dueDate: addDays(5),
      progress: 0,
      discipline: 'Instrumentation',
      wbsCode: 'L5-INS-031',
      tags: ['Calibration', 'SCADA'],
    },
    {
      userId,
      title: 'Daily Progress Report (DPR) to Primavera WBS Reconciliation',
      description: 'Map discipline supervisor site logs to Primavera Baseline schedule activities for executive review.',
      priority: 'medium',
      status: 'done',
      order: 5,
      dueDate: addDays(-1), // Completed yesterday
      progress: 100,
      discipline: 'Planning',
      wbsCode: 'L3-PLN-012',
      tags: ['DPR', 'Schedule-Link'],
    },
  ];

  for (const task of sampleTasks) {
    await createTask(task);
  }
}
