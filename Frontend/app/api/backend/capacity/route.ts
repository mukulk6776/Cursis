import { NextResponse } from "next/server";
import { getFirestoreDb, withId } from "@/lib/firebase-admin";
import { localStore } from "@/lib/backend-store";

export async function GET() {
  try {
    const database = getFirestoreDb();
    if (database) {
      const [usersSnap, tasksSnap] = await Promise.all([
        database.collection("users").get(),
        database.collection("tasks").get(),
      ]);

      if (!usersSnap.empty) {
        const taskData = tasksSnap.docs.map((doc) => withId(doc.id, doc.data()));
        return NextResponse.json(
          usersSnap.docs.map((doc) => {
            const user = withId(doc.id, doc.data());
            const assigned = taskData.filter((task) => task.assigneeId === doc.id && task.status !== "DONE");
            const currentWorkload = assigned.reduce((total, task) => total + (Number(task.estimatedHours) || 0), 0);
            const weeklyCapacityHours = Number(user.weeklyCapacityHours) || 40;
            return {
              ...user,
              weeklyCapacityHours,
              currentWorkload,
              capacityUtilization: Math.round((currentWorkload / weeklyCapacityHours) * 100),
              activeTasksCount: assigned.length,
            };
          })
        );
      }
    }

    // Fallback to local store
    const users = localStore.getUsers();
    const tasks = localStore.getTasks();

    return NextResponse.json(
      users.map((user) => {
        const assigned = tasks.filter((task) => task.assigneeId === user.id && task.status !== "DONE");
        const currentWorkload = assigned.reduce((total, task) => total + (Number(task.estimatedHours) || 0), 0);
        const weeklyCapacityHours = Number(user.weeklyCapacityHours) || 40;
        return {
          ...user,
          weeklyCapacityHours,
          currentWorkload,
          capacityUtilization: Math.round((currentWorkload / weeklyCapacityHours) * 100),
          activeTasksCount: assigned.length,
        };
      })
    );
  } catch {
    const users = localStore.getUsers();
    const tasks = localStore.getTasks();
    return NextResponse.json(
      users.map((user) => {
        const assigned = tasks.filter((task) => task.assigneeId === user.id && task.status !== "DONE");
        const currentWorkload = assigned.reduce((total, task) => total + (Number(task.estimatedHours) || 0), 0);
        const weeklyCapacityHours = Number(user.weeklyCapacityHours) || 40;
        return {
          ...user,
          weeklyCapacityHours,
          currentWorkload,
          capacityUtilization: Math.round((currentWorkload / weeklyCapacityHours) * 100),
          activeTasksCount: assigned.length,
        };
      })
    );
  }
}
