import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();

    return NextResponse.json(
      {
        status: "healthy",
        service: "cursis-backend",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: {
          status: "connected",
          counts: {
            users: userCount,
            projects: projectCount,
            tasks: taskCount,
          },
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        service: "cursis-backend",
        error: error instanceof Error ? error.message : "Database check failed",
        timestamp: new Date().toISOString(),
      },
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
