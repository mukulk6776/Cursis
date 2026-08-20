import { NextRequest, NextResponse } from "next/server";
import { firestore, serverTimestamp, withId } from "@/lib/firebase-admin";

export async function GET() {
  try { return NextResponse.json((await firestore.collection("projects").get()).docs.map((doc) => withId(doc.id, doc.data()))); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch projects" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    const doc = await firestore.collection("projects").add({ ...body, status: body.status || "ACTIVE", color: body.color || "#6366f1", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return NextResponse.json({ id: doc.id, ...body }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create project" }, { status: 500 }); }
}
