import { NextRequest, NextResponse } from "next/server";
import { documentData, firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS" };

export async function GET() {
  try {
    const [usersSnapshot, tasksSnapshot] = await Promise.all([firestore.collection("users").get(), firestore.collection("tasks").get()]);
    const tasks = tasksSnapshot.docs.map((task) => documentData(task.id, task.data()));
    const users = usersSnapshot.docs.map((user) => {
      const data = documentData(user.id, user.data());
      const assignedTasks = tasks.filter((task) => task.assigneeId === user.id && task.status !== "DONE");
      const currentWorkload = assignedTasks.reduce((sum, task) => sum + (Number(task.estimatedHours) || 0), 0);
      const weeklyCapacityHours = Number(data.weeklyCapacityHours) || 40;
      return { ...data, weeklyCapacityHours, currentWorkload, capacityUtilization: Math.round((currentWorkload / weeklyCapacityHours) * 100), activeTasksCount: assignedTasks.length, assignedTasks };
    });
    return NextResponse.json(users, { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch capacity data" }, { status: 500, headers }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, weeklyCapacityHours } = await request.json();
    if (!userId || weeklyCapacityHours === undefined) return NextResponse.json({ error: "userId and weeklyCapacityHours are required." }, { status: 400, headers });
    await firestore.collection("users").doc(userId).set({ weeklyCapacityHours: Number(weeklyCapacityHours) }, { merge: true });
    return NextResponse.json(documentData(userId, (await firestore.collection("users").doc(userId).get()).data() || {}), { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update capacity" }, { status: 500, headers }); }
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers }); }
