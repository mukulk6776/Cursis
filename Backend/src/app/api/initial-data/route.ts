import { NextResponse } from "next/server";
import { documentData, firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [organizations, users, projects, tasks, comments, files] = await Promise.all(["organizations", "users", "projects", "tasks", "comments", "files"].map(async (name) => (await firestore.collection(name).get()).docs.map((doc) => documentData(doc.id, doc.data()))));
    return NextResponse.json({ currentUser: users[0] || null, organizations, users, projects, tasks, comments, files });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load initial data" }, { status: 500 }); }
}
