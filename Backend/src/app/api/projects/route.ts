import { NextRequest, NextResponse } from "next/server";
import { documentData, firestore, serverTimestamp } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

export async function GET() {
  try {
    const [projectsSnapshot, tasksSnapshot] = await Promise.all([firestore.collection("projects").get(), firestore.collection("tasks").get()]);
    const taskCount = new Map<string, number>();
    tasksSnapshot.docs.forEach((task) => { const projectId = task.data().projectId; if (projectId) taskCount.set(projectId, (taskCount.get(projectId) || 0) + 1); });
    const projects = projectsSnapshot.docs.map((project) => ({ ...documentData(project.id, project.data()), _count: { tasks: taskCount.get(project.id) || 0 } }));
    return NextResponse.json(projects, { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch projects" }, { status: 500, headers }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "Project name is required." }, { status: 400, headers });
    const payload = { name: body.name, description: body.description || "", status: body.status || "ACTIVE", priority: body.priority || "MEDIUM", color: body.color || "#6366f1", startDate: body.startDate || new Date().toISOString(), endDate: body.endDate || null, userId: body.userId || null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const ref = await firestore.collection("projects").add(payload);
    return NextResponse.json({ id: ref.id, ...body, status: body.status || "ACTIVE", priority: body.priority || "MEDIUM", color: body.color || "#6366f1", createdAt: new Date().toISOString() }, { status: 201, headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create project" }, { status: 500, headers }); }
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers }); }
