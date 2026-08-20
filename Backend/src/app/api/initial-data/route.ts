import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [organizations, users, projects, tasks, comments, files] = await Promise.all([
      prisma.organization.findMany({
        include: {
          users: {
            select: { id: true, name: true, email: true, role: true, title: true, weeklyCapacityHours: true, avatarUrl: true },
          },
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          title: true,
          weeklyCapacityHours: true,
          avatarUrl: true,
          organizationId: true,
          assignedTasks: {
            select: { id: true, title: true, status: true, priority: true, estimatedHours: true },
          },
        },
      }),
      prisma.project.findMany({
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.task.findMany({
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          project: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.comment.findMany({
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.file.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json(
      {
        currentUser: users[0] || null,
        organizations,
        users,
        projects,
        tasks,
        comments,
        files,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load initial data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
