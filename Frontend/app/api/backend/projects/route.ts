import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, serverTimestamp, withId } from "@/lib/firebase-admin";
import { localStore } from "@/lib/backend-store";

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db.collection("projects").get();
      if (!snapshot.empty) {
        return NextResponse.json(snapshot.docs.map((doc) => withId(doc.id, doc.data())));
      }
    }
    return NextResponse.json(localStore.getProjects());
  } catch {
    return NextResponse.json(localStore.getProjects());
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "Project name is required." }, { status: 400 });

    const db = getFirestoreDb();
    if (db) {
      const doc = await db.collection("projects").add({
        ...body,
        status: body.status || "ACTIVE",
        color: body.color || "#6366f1",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return NextResponse.json({ id: doc.id, ...body }, { status: 201 });
    }

    const created = localStore.addProject({
      name: body.name,
      description: body.description || null,
      status: body.status || "ACTIVE",
      priority: body.priority || "MEDIUM",
      color: body.color || "#6366f1",
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create project" }, { status: 500 });
  }
}
