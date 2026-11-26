export interface ChangelogEntry {
  date: string;
  title: string;
  changes: string[];
}

// Add verified, released changes here, newest first. Dates use YYYY-MM-DD.
export const changelogEntries: ChangelogEntry[] = [
  {
    date: '2026-11-26',
    title: 'Grouped Tasks Stream, Drag-and-Drop Board & AEO Architecture',
    changes: [
      'Redesigned the Tasks workspace with collapsible Grouped Streams (In Progress, To Do, In Review, Completed) plus a drag-and-drop Kanban Board, Calendar, and Timeline views.',
      'Integrated CSV task import directly into the Tasks toolbar with row-level email, due date, and status validation.',
      'Published structured /llms.txt documentation, expanded FAQ/comparison guides, and enabled full AI search crawler access via robots.ts.',
    ],
  },
  {
    date: '2026-11-25',
    title: 'Starter ($9), Pro ($20) & Custom Business Plans + Admin Console',
    changes: [
      'Launched Starter Plan ($9/mo launch price; 6 members, 10 projects, 5 tasks per project), Pro Plan ($20/mo Recommended; 10 members, unlimited projects & tasks, Ordis AI, My Day), and Custom Business solutions.',
      'Enabled Razorpay USD checkout with automatic plan activation and strict feature/quota enforcement across workspaces.',
      'Shipped server-verified Admin Console with platform telemetry, user profile inspection, plan management, account controls, and audit logging.',
    ],
  },
  {
    date: '2026-10-31',
    title: 'Ordis AI Copilot, My Day Focus Planner & Task Approvals',
    changes: [
      'Introduced My Day daily 3–5 task focus planning, live session timer, and 8-hour Team Pulse capacity visibility.',
      'Added explicit reviewer approval cards inside task threads with completion guards for pending sign-offs.',
      'Released Ordis AI workspace triage for spotting delayed tasks, blocked dependencies, and available team bandwidth.',
    ],
  },
];
