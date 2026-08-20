"use server";

import { prisma } from "@/lib/prisma";
import type { TaskStatus, Priority, ProjectStatus } from "@/lib/types";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function getInitialData() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const orgId = currentUser.organizationId;

  const [organizations, users, projects, tasks, comments, files] = await Promise.all([
    prisma.organization.findMany({ where: { id: orgId } }),
    prisma.user.findMany({ where: { organizationId: orgId } }),
    prisma.project.findMany({ where: { organizationId: orgId } }),
    prisma.task.findMany({ where: { project: { organizationId: orgId } } }),
    prisma.comment.findMany({ where: { task: { project: { organizationId: orgId } } } }),
    prisma.file.findMany({ where: { task: { project: { organizationId: orgId } } } }),
  ]);

  return {
    currentUser: JSON.parse(JSON.stringify(currentUser)),
    organizations: JSON.parse(JSON.stringify(organizations)),
    users: JSON.parse(JSON.stringify(users)),
    projects: JSON.parse(JSON.stringify(projects)),
    tasks: JSON.parse(JSON.stringify(tasks)),
    comments: JSON.parse(JSON.stringify(comments)),
    files: JSON.parse(JSON.stringify(files)),
  };
}

export async function createTask(data: {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  estimatedHours: number;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  order: number;
}) {
  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
  return JSON.parse(JSON.stringify(task));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateTask(taskId: string, updates: any) {
  const dataToUpdate = { ...updates };
  if (dataToUpdate.dueDate !== undefined) {
    dataToUpdate.dueDate = dataToUpdate.dueDate ? new Date(dataToUpdate.dueDate) : null;
  }
  const task = await prisma.task.update({
    where: { id: taskId },
    data: dataToUpdate,
  });
  return JSON.parse(JSON.stringify(task));
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({
    where: { id: taskId },
  });
  return taskId;
}

export async function moveTaskStatus(taskId: string, newStatus: TaskStatus, completedAt: string | null) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt: completedAt ? new Date(completedAt) : null,
    },
  });
  return JSON.parse(JSON.stringify(task));
}

export async function createComment(taskId: string, content: string, authorId: string) {
  const comment = await prisma.comment.create({
    data: {
      taskId,
      content,
      authorId,
    },
  });
  return JSON.parse(JSON.stringify(comment));
}

export async function updateUserCapacity(userId: string, weeklyCapacityHours: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { weeklyCapacityHours },
  });
  return JSON.parse(JSON.stringify(user));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createTasks(tasksData: any[]) {
  const created = await prisma.$transaction(
    tasksData.map((t) =>
      prisma.task.create({
        data: {
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
        },
      })
    )
  );
  return JSON.parse(JSON.stringify(created));
}

export async function createProject(data: {
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  organizationId: string;
  startDate: string;
  endDate: string | null;
}) {
  const project = await prisma.project.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({
    where: { id: projectId },
  });
  return projectId;
}
