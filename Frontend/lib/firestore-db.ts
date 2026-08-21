"use client";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./auth/firebase";

export interface FirestoreTask {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedHours: number;
  projectId?: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface FirestoreProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status?: string;
  createdAt?: string;
  userId?: string;
}

// ---------------- TASKS ---------------- //

/**
 * Fetch all tasks from Firebase Firestore
 */
export async function getTasksFromFirestore(userId?: string): Promise<FirestoreTask[]> {
  try {
    const tasksRef = collection(db, "tasks");
    const q = userId
      ? query(tasksRef, where("userId", "==", userId))
      : query(tasksRef);

    const snapshot = await getDocs(q);
    const tasks: FirestoreTask[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      tasks.push({
        id: docSnap.id,
        title: data.title || "Untitled Task",
        description: data.description || "",
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        estimatedHours: Number(data.estimatedHours) || 4,
        projectId: data.projectId || "prj_default",
        projectName: data.projectName || "General",
        assigneeId: data.assigneeId || "",
        assigneeName: data.assigneeName || "Unassigned",
        dueDate: data.dueDate || null,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        userId: data.userId || "",
      });
    });

    return tasks;
  } catch (error) {
    console.warn("Firestore getTasks warning:", error);
    return [];
  }
}

/**
 * Create a new task in Firebase Firestore
 */
export async function createTaskInFirestore(task: Partial<FirestoreTask>): Promise<FirestoreTask | null> {
  try {
    const tasksRef = collection(db, "tasks");
    const payload = {
      title: task.title || "Untitled Task",
      description: task.description || "",
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      estimatedHours: Number(task.estimatedHours) || 4,
      projectId: task.projectId || "prj_default",
      projectName: task.projectName || "General",
      assigneeName: task.assigneeName || "Team Member",
      dueDate: task.dueDate || null,
      userId: task.userId || "usr_guest",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(tasksRef, payload);
    return {
      id: docRef.id,
      ...task,
      title: payload.title,
      status: payload.status,
      priority: payload.priority,
      estimatedHours: payload.estimatedHours,
      createdAt: new Date().toISOString(),
    } as FirestoreTask;
  } catch (error) {
    console.warn("Firestore createTask warning:", error);
    return null;
  }
}

/**
 * Update task in Firebase Firestore
 */
export async function updateTaskInFirestore(id: string, updates: Partial<FirestoreTask>): Promise<boolean> {
  try {
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.warn("Firestore updateTask warning:", error);
    return false;
  }
}

/**
 * Delete task from Firebase Firestore
 */
export async function deleteTaskFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "tasks", id));
    return true;
  } catch (error) {
    console.warn("Firestore deleteTask warning:", error);
    return false;
  }
}

/**
 * Real-time listener for tasks
 */
export function subscribeToFirestoreTasks(callback: (tasks: FirestoreTask[]) => void, userId?: string) {
  const tasksRef = collection(db, "tasks");
  const q = userId ? query(tasksRef, where("userId", "==", userId)) : query(tasksRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: FirestoreTask[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tasks.push({
          id: docSnap.id,
          title: data.title || "Untitled Task",
          description: data.description || "",
          status: data.status || "TODO",
          priority: data.priority || "MEDIUM",
          estimatedHours: Number(data.estimatedHours) || 4,
          projectId: data.projectId || "prj_default",
          projectName: data.projectName || "General",
          assigneeName: data.assigneeName || "Unassigned",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          userId: data.userId || "",
        });
      });
      callback(tasks);
    },
    (err) => {
      console.warn("Firestore subscription warning:", err);
    }
  );
}

// ---------------- PROJECTS ---------------- //

/**
 * Fetch projects from Firebase Firestore
 */
export async function getProjectsFromFirestore(): Promise<FirestoreProject[]> {
  try {
    const projectsRef = collection(db, "projects");
    const snapshot = await getDocs(projectsRef);
    const projects: FirestoreProject[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      projects.push({
        id: docSnap.id,
        name: data.name || "Project",
        description: data.description || "",
        color: data.color || "#6366f1",
        status: data.status || "ACTIVE",
      });
    });

    if (projects.length === 0) {
      return [
        { id: "prj_001", name: "Core Operations", color: "#6366f1", status: "ACTIVE" },
        { id: "prj_002", name: "Growth & Marketing", color: "#06b6d4", status: "ACTIVE" },
      ];
    }

    return projects;
  } catch {
    return [
      { id: "prj_001", name: "Core Operations", color: "#6366f1", status: "ACTIVE" },
      { id: "prj_002", name: "Growth & Marketing", color: "#06b6d4", status: "ACTIVE" },
    ];
  }
}
