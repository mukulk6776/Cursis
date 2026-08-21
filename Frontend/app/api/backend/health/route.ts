import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await getFirestoreDb().collection("_health").limit(1).get();
    return NextResponse.json({ status: "healthy", service: "cursis-firebase-api", timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: "error", error: error instanceof Error ? error.message : "Firestore unavailable" }, { status: 500 });
  }
}
