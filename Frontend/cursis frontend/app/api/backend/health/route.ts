import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await firestore.collection("_health").limit(1).get();
    return NextResponse.json({ status: "healthy", service: "cursis-firebase-api", timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: "error", error: error instanceof Error ? error.message : "Firestore unavailable" }, { status: 500 });
  }
}
