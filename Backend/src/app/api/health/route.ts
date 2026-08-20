import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await firestore.collection("_health").limit(1).get();
    return NextResponse.json({ status: "healthy", service: "cursis-firebase-backend", version: "1.0.0", timestamp: new Date().toISOString(), database: { status: "connected", provider: "firestore" } });
  } catch (error) { return NextResponse.json({ status: "error", service: "cursis-firebase-backend", error: error instanceof Error ? error.message : "Firestore unavailable", timestamp: new Date().toISOString() }, { status: 500 }); }
}
