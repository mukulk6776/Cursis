import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status = "ACTIVE", priority = "MEDIUM", color = "#6366f1", organizationId, startDate, endDate } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    let targetOrgId = organizationId;
    if (!targetOrgId) {
      const firstOrg = await prisma.organization.findFirst();
      if (!firstOrg) {
        return NextResponse.json(
          { error: "No organization found to attach project to." },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }
      targetOrgId = firstOrg.id;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status,
        priority,
        color,
        organizationId: targetOrgId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(project, {
      status: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
