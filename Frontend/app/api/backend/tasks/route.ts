import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, serverTimestamp, withId } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tasks = (await getFirestoreDb().collection("tasks").get()).docs.map((doc) => withId(doc.id, doc.data())).filter((task) => !searchParams.get("projectId") || task.projectId === searchParams.get("projectId")).filter((task) => !searchParams.get("status") || task.status === searchParams.get("status"));
    return NextResponse.json(tasks);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch tasks" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.projectId) return NextResponse.json({ error: "Title and projectId are required." }, { status: 400 });
    const payload = { ...body, status: body.status || "TODO", priority: body.priority || "MEDIUM", estimatedHours: Number(body.estimatedHours) || 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const doc = await getFirestoreDb().collection("tasks").add(payload);
    return NextResponse.json({ id: doc.id, ...body }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create task" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    const ref = getFirestoreDb().collection("tasks").doc(id);
    await ref.set({ ...updates, updatedAt: serverTimestamp() }, { merge: true });
    return NextResponse.json(withId(id, (await ref.get()).data() || {}));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update task" }, { status: 500 }); }
}
