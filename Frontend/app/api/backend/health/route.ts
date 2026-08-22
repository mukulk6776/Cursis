import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (db) {
      await db.collection("_health").limit(1).get();
      return NextResponse.json({
        status: "healthy",
        service: "cursis-firebase-api",
        mode: "cloud-firestore",
        timestamp: new Date().toISOString(),
        database: { status: "connected", provider: "firestore" },
      });
    }

    return NextResponse.json({
      status: "healthy",
      service: "cursis-backend-api",
      mode: "local-store",
      timestamp: new Date().toISOString(),
      database: { status: "connected", provider: "in-memory" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "healthy",
        service: "cursis-backend-api",
        mode: "local-fallback",
        timestamp: new Date().toISOString(),
        database: { status: "fallback", provider: "in-memory" },
      }
    );
  }
}
