import { NextRequest, NextResponse } from "next/server";
import { documentData, firestore, serverTimestamp } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS" };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tasks = (await firestore.collection("tasks").get()).docs.map((task) => documentData(task.id, task.data())).filter((task) => !searchParams.get("projectId") || task.projectId === searchParams.get("projectId")).filter((task) => !searchParams.get("status") || task.status === searchParams.get("status")).filter((task) => !searchParams.get("assigneeId") || task.assigneeId === searchParams.get("assigneeId"));
    return NextResponse.json(tasks, { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch tasks" }, { status: 500, headers }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.projectId) return NextResponse.json({ error: "Title and projectId are required." }, { status: 400, headers });
    const payload = { title: body.title, description: body.description || "", status: body.status || "TODO", priority: body.priority || "MEDIUM", estimatedHours: Number(body.estimatedHours) || 0, dueDate: body.dueDate || null, projectId: body.projectId, projectName: body.projectName || "General", assigneeId: body.assigneeId || null, assigneeName: body.assigneeName || "Unassigned", order: Number(body.order) || 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const ref = await firestore.collection("tasks").add(payload);
    return NextResponse.json({ id: ref.id, ...body, estimatedHours: Number(body.estimatedHours) || 0, status: body.status || "TODO", priority: body.priority || "MEDIUM", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { status: 201, headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create task" }, { status: 500, headers }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "Task id is required." }, { status: 400, headers });
    const ref = firestore.collection("tasks").doc(id);
    await ref.set({ ...updates, updatedAt: serverTimestamp() }, { merge: true });
    const updated = await ref.get();
    return NextResponse.json(documentData(updated.id, updated.data() || {}), { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update task" }, { status: 500, headers }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Task id is required." }, { status: 400, headers });
    await firestore.collection("tasks").doc(id).delete();
    return NextResponse.json({ success: true, id }, { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete task" }, { status: 500, headers }); }
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers }); }
