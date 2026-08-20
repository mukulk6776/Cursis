import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true, color: true },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status = "TODO", priority = "MEDIUM", estimatedHours = 0, dueDate, projectId, assigneeId, order = 0 } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and projectId are required." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status,
        priority,
        estimatedHours: Number(estimatedHours) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        order: Number(order) || 0,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(task, {
      status: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const dataToUpdate: Record<string, unknown> = { ...updates };
    if (dataToUpdate.dueDate !== undefined) {
      dataToUpdate.dueDate = dataToUpdate.dueDate ? new Date(dataToUpdate.dueDate as string) : null;
    }
    if (dataToUpdate.completedAt !== undefined) {
      dataToUpdate.completedAt = dataToUpdate.completedAt ? new Date(dataToUpdate.completedAt as string) : null;
    }
    if (dataToUpdate.estimatedHours !== undefined) {
      dataToUpdate.estimatedHours = Number(dataToUpdate.estimatedHours);
    }

    const task = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(task, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true, id }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete task" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
