import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const ORG_ID = "org_cursis_001";
const USER_IDS = { sarah: "usr_001", marcus: "usr_002", priya: "usr_003" } as const;
const PROJECT_IDS = { mvp: "prj_001", infra: "prj_002" } as const;

async function main() {
  // Clear existing
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create Organization
  await prisma.organization.create({
    data: {
      id: ORG_ID,
      name: "Cursis Labs",
      slug: "cursis-labs",
      createdAt: new Date("2026-01-15T08:00:00.000Z"),
      updatedAt: new Date("2026-01-15T08:00:00.000Z"),
    },
  });

  // Create Users
  await prisma.user.createMany({
    data: [
      {
        id: USER_IDS.sarah,
        email: "sarah.chen@cursis.io",
        name: "Sarah Chen",
        role: "owner",
        title: "CEO & Co-Founder",
        weeklyCapacityHours: 45,
        isActive: true,
        organizationId: ORG_ID,
        createdAt: new Date("2026-01-15T08:00:00.000Z"),
        updatedAt: new Date("2026-01-15T08:00:00.000Z"),
      },
      {
        id: USER_IDS.marcus,
        email: "marcus.wright@cursis.io",
        name: "Marcus Wright",
        role: "admin",
        title: "Lead Engineer",
        weeklyCapacityHours: 40,
        isActive: true,
        organizationId: ORG_ID,
        createdAt: new Date("2026-02-01T08:00:00.000Z"),
        updatedAt: new Date("2026-02-01T08:00:00.000Z"),
      },
      {
        id: USER_IDS.priya,
        email: "priya.sharma@cursis.io",
        name: "Priya Sharma",
        role: "member",
        title: "Product Designer",
        weeklyCapacityHours: 35,
        isActive: true,
        organizationId: ORG_ID,
        createdAt: new Date("2026-03-10T08:00:00.000Z"),
        updatedAt: new Date("2026-03-10T08:00:00.000Z"),
      },
    ],
  });

  // Create Projects
  await prisma.project.createMany({
    data: [
      {
        id: PROJECT_IDS.mvp,
        name: "MVP Launch",
        description: "Core product build for initial launch — dashboard, auth, billing.",
        status: "ACTIVE",
        priority: "CRITICAL",
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: new Date("2026-09-30T00:00:00.000Z"),
        color: "#6366f1",
        organizationId: ORG_ID,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
      },
      {
        id: PROJECT_IDS.infra,
        name: "Infrastructure & DevOps",
        description: "CI/CD pipelines, monitoring, staging environments, security hardening.",
        status: "ACTIVE",
        priority: "HIGH",
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
        color: "#06b6d4",
        organizationId: ORG_ID,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ],
  });

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        id: "tsk_001",
        title: "Design system & component library",
        description: "Build a comprehensive design system with tokens, primitives, and composite components.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        estimatedHours: 12,
        dueDate: new Date("2026-08-20T00:00:00.000Z"),
        order: 0,
        projectId: PROJECT_IDS.mvp,
        assigneeId: USER_IDS.priya,
        createdAt: new Date("2026-07-10T08:00:00.000Z"),
        updatedAt: new Date("2026-07-10T08:00:00.000Z"),
      },
      {
        id: "tsk_002",
        title: "Auth flow — OAuth + email/password",
        description: "Implement NextAuth.js with Google OAuth and credential providers.",
        status: "TODO",
        priority: "CRITICAL",
        estimatedHours: 16,
        dueDate: new Date("2026-08-25T00:00:00.000Z"),
        order: 1,
        projectId: PROJECT_IDS.mvp,
        assigneeId: USER_IDS.marcus,
        createdAt: new Date("2026-07-10T08:00:00.000Z"),
        updatedAt: new Date("2026-07-10T08:00:00.000Z"),
      },
      {
        id: "tsk_003",
        title: "Setup CI/CD pipeline",
        description: "Configure GitHub Actions for lint, test, build, and deploy stages.",
        status: "REVIEW",
        priority: "HIGH",
        estimatedHours: 8,
        dueDate: new Date("2026-08-18T00:00:00.000Z"),
        order: 0,
        projectId: PROJECT_IDS.infra,
        assigneeId: USER_IDS.marcus,
        createdAt: new Date("2026-07-15T08:00:00.000Z"),
        updatedAt: new Date("2026-07-15T08:00:00.000Z"),
      },
      {
        id: "tsk_004",
        title: "User research interviews",
        description: "Conduct 8 user interviews with early-stage founders.",
        status: "DONE",
        priority: "MEDIUM",
        estimatedHours: 10,
        dueDate: new Date("2026-08-10T00:00:00.000Z"),
        completedAt: new Date("2026-08-09T16:00:00.000Z"),
        order: 0,
        projectId: PROJECT_IDS.mvp,
        assigneeId: USER_IDS.sarah,
        createdAt: new Date("2026-07-05T08:00:00.000Z"),
        updatedAt: new Date("2026-08-09T16:00:00.000Z"),
      },
    ],
  });

  // Create Comments
  await prisma.comment.createMany({
    data: [
      {
        id: "cmt_001",
        content: "I've finished the color palette and typography scale. Moving on to component primitives now.",
        taskId: "tsk_001",
        authorId: USER_IDS.priya,
        createdAt: new Date("2026-07-15T14:30:00.000Z"),
        updatedAt: new Date("2026-07-15T14:30:00.000Z"),
      },
      {
        id: "cmt_002",
        content: "Great progress Priya! Make sure we align on the dark mode tokens before building out the cards.",
        taskId: "tsk_001",
        authorId: USER_IDS.sarah,
        createdAt: new Date("2026-07-15T15:00:00.000Z"),
        updatedAt: new Date("2026-07-15T15:00:00.000Z"),
      },
    ],
  });

  console.log("Database seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
