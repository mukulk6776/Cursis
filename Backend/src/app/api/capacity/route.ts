import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedTasks: {
          where: {
            status: { not: "DONE" },
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            estimatedHours: true,
            dueDate: true,
            project: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    const capacityData = users.map((user) => {
      const currentWorkload = user.assignedTasks.reduce(
        (sum, task) => sum + (task.estimatedHours || 0),
        0
      );
      const capacityUtilization = user.weeklyCapacityHours > 0
        ? Math.round((currentWorkload / user.weeklyCapacityHours) * 100)
        : 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatarUrl: user.avatarUrl,
        weeklyCapacityHours: user.weeklyCapacityHours,
        currentWorkload,
        capacityUtilization,
        activeTasksCount: user.assignedTasks.length,
        assignedTasks: user.assignedTasks,
      };
    });

    return NextResponse.json(capacityData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch capacity data" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, weeklyCapacityHours } = body;

    if (!userId || weeklyCapacityHours === undefined) {
      return NextResponse.json(
        { error: "userId and weeklyCapacityHours are required." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { weeklyCapacityHours: Number(weeklyCapacityHours) },
    });

    return NextResponse.json(updatedUser, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update capacity" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
