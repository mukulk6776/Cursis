import { NextResponse } from "next/server";
import { firestore, withId } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const [users, tasks] = await Promise.all([firestore.collection("users").get(), firestore.collection("tasks").get()]);
    const taskData = tasks.docs.map((doc) => withId(doc.id, doc.data()));
    return NextResponse.json(users.docs.map((doc) => {
      const user = withId(doc.id, doc.data());
      const assigned = taskData.filter((task) => task.assigneeId === doc.id && task.status !== "DONE");
      const currentWorkload = assigned.reduce((total, task) => total + (Number(task.estimatedHours) || 0), 0);
      const weeklyCapacityHours = Number(user.weeklyCapacityHours) || 40;
      return { ...user, weeklyCapacityHours, currentWorkload, capacityUtilization: Math.round((currentWorkload / weeklyCapacityHours) * 100), activeTasksCount: assigned.length };
    }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch capacity" }, { status: 500 }); }
}
