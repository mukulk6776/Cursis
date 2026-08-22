import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, serverTimestamp, withId } from "@/lib/firebase-admin";
import { localStore } from "@/lib/backend-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const status = searchParams.get("status") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;

    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db.collection("tasks").get();
      if (!snapshot.empty) {
        const tasks = snapshot.docs
          .map((doc) => withId(doc.id, doc.data()))
          .filter((task) => !projectId || task.projectId === projectId)
          .filter((task) => !status || task.status === status)
          .filter((task) => !assigneeId || task.assigneeId === assigneeId);
        return NextResponse.json(tasks);
      }
    }

    // Fallback to local store
    const tasks = localStore.getTasks({ projectId, status, assigneeId });
    return NextResponse.json(tasks);
  } catch (error) {
    const tasks = localStore.getTasks();
    return NextResponse.json(tasks);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.projectId) {
      return NextResponse.json({ error: "Title and projectId are required." }, { status: 400 });
    }

    const db = getFirestoreDb();
    if (db) {
      const payload = {
        ...body,
        status: body.status || "TODO",
        priority: body.priority || "MEDIUM",
        estimatedHours: Number(body.estimatedHours) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const doc = await db.collection("tasks").add(payload);
      return NextResponse.json({ id: doc.id, ...body }, { status: 201 });
    }

    // Fallback to local store
    const created = localStore.addTask({
      title: body.title,
      description: body.description || "",
      status: body.status || "TODO",
      priority: body.priority || "MEDIUM",
      estimatedHours: Number(body.estimatedHours) || 4,
      projectId: body.projectId,
      projectName: body.projectName || "General",
      assigneeId: body.assigneeId || null,
      assigneeName: body.assigneeName || "Team Member",
      dueDate: body.dueDate || null,
      order: body.order || 0,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "Task id is required." }, { status: 400 });

    const db = getFirestoreDb();
    if (db) {
      const ref = db.collection("tasks").doc(id);
      await ref.set({ ...updates, updatedAt: serverTimestamp() }, { merge: true });
      return NextResponse.json(withId(id, (await ref.get()).data() || {}));
    }

    // Fallback to local store
    const updated = localStore.updateTask(id, updates);
    if (!updated) {
      return NextResponse.json({ id, ...updates });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Task id is required." }, { status: 400 });

    const db = getFirestoreDb();
    if (db) {
      await db.collection("tasks").doc(id).delete();
    }

    localStore.deleteTask(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete task" }, { status: 500 });
  }
}
