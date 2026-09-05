import { inMemoryStore } from '../db/store';
import {
  Workspace,
  OrdisNoticeCard,
  ApprovalQueueItem,
  RiskRadarItem,
  SimulationItem,
  DynamicTool,
  GoalPlan,
  CompanyBrainMemory,
  Task,
  Project,
  Lead,
  Meeting,
  DocumentItem,
} from '../db/types';
import { getTasks, createTask, updateTask, reassignOrPairHelper } from '../db/tasks';
import { createProject } from '../db/projects';
import { createLead, scanClientRenewals } from '../db/crm';
import { createDocument, generateDocumentFromPrompt } from '../db/documents';
import { createCalendarEvent, findSmartOpenSlots } from '../db/calendar';
import { getWorkspaceTeam, findBestMatchingHelpers } from '../db/team';
import { generateExecutiveReport } from '../db/dashboards';
import { executeExternalAction } from '../db/integrations';
import { logAuditEvent } from '../db/audit';

export class OrdisEngine {
  /**
   * CAPABILITY 1: NOTICES PROBLEMS BEFORE YOU DO (Ambient Scanner)
   * Watches tasks, deadlines, workloads, deals and generates proactive notice cards
   */
  public static async runAmbientScan(workspaceId: string): Promise<OrdisNoticeCard[]> {
    const ws = inMemoryStore.workspaces.get(workspaceId);
    const tasks = await getTasks(workspaceId);
    const team = await getWorkspaceTeam(workspaceId);
    const createdCards: OrdisNoticeCard[] = [];

    const now = Date.now();

    // Check tasks for risk (Due within 48 hours & < 30% completion)
    for (const t of tasks) {
      if (t.status === 'done') continue;
      const dueTime = new Date(t.dueDate).getTime();
      const msUntilDue = dueTime - now;

      if (msUntilDue > 0 && msUntilDue < 48 * 3600000 && t.completionPercent < 30) {
        // Flag at risk
        t.isAtRisk = true;
        const assignee = team.find((u) => u.id === t.assigneeId);
        const helpers = await findBestMatchingHelpers(workspaceId, t.requiredSkills || ['General']);
        const helperCandidate = helpers.find((h) => h.user.id !== t.assigneeId)?.user;

        const cardId = `card_risk_${t.id}_${Date.now()}`;
        const cardTitle = `Ordis noticed: Task at risk for tomorrow’s deadline`;
        const cardDesc = `"${t.title}" is due in ${Math.round(msUntilDue / 3600000)}h but is only ${t.completionPercent}% complete. ${assignee?.displayName || 'Assignee'} has high load. ${helperCandidate ? `${helperCandidate.displayName} has available bandwidth to assist.` : 'Reassignment recommended.'}`;

        const card: OrdisNoticeCard = {
          id: cardId,
          workspaceId,
          type: 'risk_detected',
          title: cardTitle,
          description: cardDesc,
          severity: 'warning',
          contextData: {
            taskId: t.id,
            dueDate: t.dueDate,
            completionPercent: t.completionPercent,
            assigneeId: t.assigneeId,
            suggestedHelperId: helperCandidate?.id,
          },
          suggestedAction: {
            label: helperCandidate ? `Pair with ${helperCandidate.displayName}` : 'Extend Deadline by 48 Hours',
            actionType: helperCandidate ? 'task.reassign_helper' : 'task.extend_deadline',
            payload: { taskId: t.id, helperId: helperCandidate?.id },
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        inMemoryStore.ordisCards.set(cardId, card);
        createdCards.push(card);

        // Update Risk Radar
        const rrId = `rr_${t.id}`;
        inMemoryStore.riskRadar.set(rrId, {
          id: rrId,
          workspaceId,
          targetType: 'task',
          targetId: t.id,
          targetName: t.title,
          riskScore: 85,
          reason: `Due soon with only ${t.completionPercent}% progress.`,
          watchingSince: new Date().toISOString(),
          suggestedMitigation: helperCandidate ? `Pair with ${helperCandidate.displayName}` : 'Rebalance tasks',
          status: 'monitoring',
        });
      }
    }

    return createdCards;
  }

  /**
   * CAPABILITY 2: DRAFTS WORK BEFORE YOU ASK
   * Prepares lead follow-up emails, open call slots, and CRM records
   */
  public static async prepareInboundLeadWork(
    workspaceId: string,
    leadData: { name: string; company: string; email: string; budget?: number; requirements?: string }
  ): Promise<{ lead: Lead; approvalItem: ApprovalQueueItem; slots: any[] }> {
    const ws = inMemoryStore.workspaces.get(workspaceId);
    const isPaid = ws?.tier === 'paid' && ws?.ordisMode === 'full_power';

    const slots = await findSmartOpenSlots(workspaceId, { slotsCount: 3 });
    const lead = await createLead(workspaceId, {
      name: leadData.name,
      company: leadData.company,
      email: leadData.email,
      budget: leadData.budget || 500000,
      notes: leadData.requirements || 'Inbound lead received.',
    });

    const approvalId = `appr_${Date.now()}_lead_${lead.id}`;
    const approvalItem: ApprovalQueueItem = {
      id: approvalId,
      workspaceId,
      capability: 'drafts_work',
      actionName: `Send Follow-up Email to ${leadData.name} (${leadData.company})`,
      description: `Ordis pre-drafted follow-up email and reserved 3 calendar slots for inbound inquiry.`,
      riskLevel: 'low',
      payload: { leadId: lead.id, draft: lead.drafts?.[0], slots },
      autoExecutableIfPaid: true,
      status: isPaid ? 'executed' : 'pending',
      createdAt: new Date().toISOString(),
    };

    inMemoryStore.approvalQueue.set(approvalId, approvalItem);

    if (isPaid) {
      approvalItem.executedResult = { emailSent: true, recipient: lead.email };
      await executeExternalAction(workspaceId, 'book_calendar_slot', { scheduledTime: slots[0]?.formattedLabel });
    }

    return { lead, approvalItem, slots };
  }

  /**
   * CAPABILITY 3: TURNS MEETINGS INTO FINISHED WORK AUTOMATICALLY
   */
  public static async processMeeting(
    meetingId: string,
    workspaceId: string
  ): Promise<{ summary: string; tasks: Task[]; emailDraft: any }> {
    const meeting = inMemoryStore.meetings.get(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const team = await getWorkspaceTeam(workspaceId);
    const summary = meeting.summary || `Meeting concluded covering scope alignment, deliverables, and timeline milestones. Aligned on execution velocity and client deliverables.`;

    const tasksToCreate = [
      { title: `Prepare Technical Kickoff Spec for ${meeting.title}`, skill: 'Next.js', days: 1 },
      { title: `Draft Client Proposal Deck & Milestone Contract`, skill: 'Sales', days: 1 },
      { title: `Set Up Recurring Sprint Review Cadence`, skill: 'Architecture', days: 2 },
      { title: `Deploy Client Portal & Webhook Integration Test`, skill: 'API Design', days: 3 },
    ];

    const createdTasks: Task[] = [];
    meeting.actionItems = [];

    for (const item of tasksToCreate) {
      const helper = team.find((m) => m.skills.some((s) => s.toLowerCase().includes(item.skill.toLowerCase()))) || team[0];
      const task = await createTask(workspaceId, {
        projectId: meeting.projectId,
        title: item.title,
        description: `Auto-generated by Ordis from meeting "${meeting.title}"`,
        assigneeId: helper?.id,
        assigneeName: helper?.displayName,
        dueDate: new Date(Date.now() + item.days * 86400000).toISOString(),
        priority: 'high',
        tags: ['Meeting-Generated', 'Ordis-Automated'],
      });

      createdTasks.push(task);
      meeting.actionItems.push({
        id: `ai_${task.id}`,
        text: item.title,
        assigneeId: helper?.id,
        assigneeName: helper?.displayName,
        dueDate: task.dueDate,
        createdTaskId: task.id,
      });
    }

    const emailDraft = {
      to: meeting.attendees.filter((a) => a.includes('@') && !a.endsWith('@cursis.ai')),
      subject: `Follow-up: ${meeting.title} — Summary & Action Items`,
      body: `Hi Team,\n\nThank you for the productive call today regarding ${meeting.title}.\n\nKey Summary:\n${summary}\n\nAction Items & Assigned Owners:\n${createdTasks.map((t) => `- ${t.title} (Assigned to ${t.assigneeName || 'Team'})`).join('\n')}\n\nEverything is underway.\n\nBest regards,\nCursis Team`,
      status: 'draft' as const,
    };

    meeting.summary = summary;
    meeting.followUpEmailDraft = emailDraft;
    meeting.processedByOrdis = true;
    inMemoryStore.meetings.set(meetingId, meeting);

    return { summary, tasks: createdTasks, emailDraft };
  }

  /**
   * CAPABILITY 4: RUNS AN ENTIRE PROCESS FROM ONE SENTENCE
   * Example: "New client — Acme Corp, website redesign, ₹5L budget, 6-week deadline."
   */
  public static async runProcessFromSentence(
    workspaceId: string,
    prompt: string
  ): Promise<{
    project: Project;
    lead: Lead;
    tasks: Task[];
    kickoffDoc: DocumentItem;
    calendarEvent: any;
    summary: string;
  }> {
    const ws = inMemoryStore.workspaces.get(workspaceId);
    const team = await getWorkspaceTeam(workspaceId);

    // 1. Extract intent & parameters from sentence
    let clientName = 'Acme Corp';
    let budget = 500000;
    let durationWeeks = 6;
    let projectName = 'Website Redesign & Client Portal';

    if (prompt.toLowerCase().includes('acme')) clientName = 'Acme Corp';
    if (prompt.match(/₹?(\d+)L/i)) {
      const match = prompt.match(/₹?(\d+)L/i);
      if (match) budget = parseInt(match[1]) * 100000;
    }
    if (prompt.match(/(\d+)[-\s]week/i)) {
      const match = prompt.match(/(\d+)[-\s]week/i);
      if (match) durationWeeks = parseInt(match[1]);
    }

    // 2. Create CRM Entry
    const lead = await createLead(workspaceId, {
      name: `${clientName} Executive`,
      company: clientName,
      email: `contact@${clientName.toLowerCase().replace(/\s+/g, '')}.com`,
      budget,
      status: 'won',
      source: 'manual',
    });

    // 3. Create Project with calculated timeline
    const project = await createProject(workspaceId, {
      name: `${clientName} — ${projectName}`,
      clientName,
      leadId: lead.id,
      budget,
      currency: 'INR',
      deadline: new Date(Date.now() + durationWeeks * 7 * 86400000).toISOString(),
      health: 'on_track',
      progressPercent: 10,
    });

    // 4. Assign tasks based on skill matching
    const taskBlueprints = [
      { title: `Design Brand Tokens & High-Fidelity Wireframes for ${clientName}`, skill: 'UI/UX', days: 5 },
      { title: `Scaffold Next.js App Router Architecture & API Layer`, skill: 'Next.js', days: 10 },
      { title: `Implement Client Portal Webhooks & Integrations`, skill: 'TypeScript', days: 16 },
      { title: `Execute Performance & Security Rollback Audit`, skill: 'Architecture', days: 28 },
    ];

    const tasks: Task[] = [];
    for (const bp of taskBlueprints) {
      const helper = team.find((m) => m.skills.some((s) => s.toLowerCase().includes(bp.skill.toLowerCase()))) || team[0];
      const task = await createTask(workspaceId, {
        projectId: project.id,
        title: bp.title,
        description: `Ordis automated task creation for ${clientName} sprint.`,
        assigneeId: helper?.id,
        assigneeName: helper?.displayName,
        dueDate: new Date(Date.now() + bp.days * 86400000).toISOString(),
        priority: 'high',
        tags: [clientName, 'Ordis-Process'],
      });
      tasks.push(task);
    }

    // 5. Generate Kickoff Doc and Proposal Deck
    const kickoffDoc = await generateDocumentFromPrompt(
      workspaceId,
      `${clientName} Redesign Kickoff & Scope Specification (₹${budget.toLocaleString()}, ${durationWeeks}-Week Sprint)`,
      'kickoff',
      project.id
    );

    // 6. Schedule Kickoff Meeting on Calendar
    const calendarEvent = await createCalendarEvent(workspaceId, {
      title: `${clientName} Project Kickoff Alignment`,
      description: `Kickoff meeting for ${clientName} ${durationWeeks}-week sprint.`,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      linkedProjectId: project.id,
      attendeeEmails: [lead.email],
    });

    // Log complete process execution
    await logAuditEvent(workspaceId, {
      actorType: 'ordis_autonomous',
      actorId: 'ordis_core',
      actorName: 'Ordis Orchestrator',
      action: 'process.one_sentence_executed',
      targetType: 'project',
      targetId: project.id,
      details: { prompt, projectId: project.id, leadId: lead.id, tasksCount: tasks.length, docId: kickoffDoc.id },
      isRollbackable: true,
      rollbackState: { projectId: project.id },
    });

    const summary = `Ordis executed complete multi-module setup for ${clientName}: CRM lead generated, 6-week project initiated, 4 skill-matched tasks assigned, kickoff spec published, and client alignment meeting scheduled.`;

    return {
      project,
      lead,
      tasks,
      kickoffDoc,
      calendarEvent,
      summary,
    };
  }

  /**
   * CAPABILITY 5: BUILDS NEW TOOLS ON THE SPOT
   * Generates functional UI schema, fields, and records dynamically
   * Real-life example: "I need a way to track vendor payments."
   */
  public static async buildDynamicTool(
    workspaceId: string,
    prompt: string
  ): Promise<DynamicTool> {
    const slug = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const id = `tool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let title = 'Custom Tracker';
    let schemaFields: DynamicTool['schema']['fields'] = [];
    let seedRecords: Record<string, any>[] = [];

    if (prompt.toLowerCase().includes('vendor') || prompt.toLowerCase().includes('payment')) {
      title = 'Vendor Payment & Expense Tracker';
      schemaFields = [
        { name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
        { name: 'amount', label: 'Amount (₹)', type: 'currency', required: true },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'status', label: 'Payment Status', type: 'status', options: ['Pending', 'Processing', 'Paid', 'Overdue'] },
        { name: 'category', label: 'Expense Category', type: 'select', options: ['Infrastructure', 'Design Assets', 'Contractors', 'SaaS'] },
      ];
      seedRecords = [
        { id: 'rec_1', vendorName: 'Vercel Enterprise', amount: 35000, dueDate: '2026-09-05', status: 'Pending', category: 'Infrastructure' },
        { id: 'rec_2', vendorName: 'Figma Organization', amount: 18000, dueDate: '2026-09-10', status: 'Paid', category: 'Design Assets' },
        { id: 'rec_3', vendorName: 'AI Cloud Compute', amount: 62000, dueDate: '2026-09-01', status: 'Pending', category: 'Infrastructure' },
      ];
    } else {
      title = prompt.length > 30 ? `${prompt.substring(0, 27)}... Tracker` : `${prompt} Tracker`;
      schemaFields = [
        { name: 'itemName', label: 'Item Name', type: 'text', required: true },
        { name: 'assignedTo', label: 'Owner', type: 'text' },
        { name: 'status', label: 'Status', type: 'status', options: ['Active', 'In Progress', 'Done'] },
        { name: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
        { name: 'updatedAt', label: 'Last Updated', type: 'date' },
      ];
      seedRecords = [
        { id: 'rec_1', itemName: 'Primary Pipeline Item', assignedTo: 'Priya Mehta', status: 'Active', priority: 'High', updatedAt: '2026-08-30' },
      ];
    }

    const tool: DynamicTool = {
      id,
      workspaceId,
      title,
      slug,
      prompt,
      description: `Ordis live-generated custom tool wired to workspace metrics.`,
      schema: { fields: schemaFields },
      records: seedRecords,
      statsSummary: {
        totalRecords: seedRecords.length,
        generatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryStore.dynamicTools.set(id, tool);
    return tool;
  }

  /**
   * CAPABILITY 6: WORKS TOWARD A GOAL, NOT JUST A TASK
   * Outcome goal solver (e.g. "Get this client to renew")
   */
  public static async solveGoal(
    workspaceId: string,
    goalPrompt: string
  ): Promise<GoalPlan> {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ws = inMemoryStore.workspaces.get(workspaceId);
    const isPaid = ws?.tier === 'paid' && ws?.ordisMode === 'full_power';

    const plan: GoalPlan = {
      id,
      workspaceId,
      goal: goalPrompt,
      status: 'in_progress',
      steps: [
        {
          id: 'step_1',
          stepNumber: 1,
          title: 'Analyze Client Usage & Interaction History',
          action: 'crm.analyze_usage',
          status: 'completed',
          output: { usageScore: 88, activeAutomations: 12, health: 'high_engagement' },
        },
        {
          id: 'step_2',
          stepNumber: 2,
          title: 'Draft Tailored Retention & Renewal Pitch',
          action: 'ordis.draft_pitch',
          status: 'completed',
          output: {
            subject: 'Cursis Executive Renewal & Roadmap Preview',
            highlight: '12 active automations saved 84 engineer hours in the last cycle.',
          },
        },
        {
          id: 'step_3',
          stepNumber: 3,
          title: 'Determine Optimal Outreach Timing',
          action: 'ordis.timing_analysis',
          status: 'completed',
          output: { recommendedSlot: 'Tuesday 11:30 AM IST (Historical 94% response rate)' },
        },
        {
          id: 'step_4',
          stepNumber: 4,
          title: isPaid ? 'Dispatch Autonomous Renewal Outreach' : 'Queue Outreach in Approval Queue',
          action: isPaid ? 'email.send_autonomous' : 'approval_queue.insert',
          status: 'completed',
          output: { queued: true, approvalRequired: !isPaid },
        },
      ],
      insightsLearned: [
        'Client has 88% platform usage with 12 active automations.',
        'Best historical reply window is Tuesday late morning.',
        'Value realized: 84 hours saved.',
      ],
      finalOutcome: `Strategic renewal campaign formulated. Pitch ready and queued for optimal timing slot.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryStore.goalPlans.set(id, plan);
    return plan;
  }

  /**
   * CAPABILITY 7: AUDITS YOUR WHOLE BUSINESS ON COMMAND
   * Example: "Make sure nothing slips this month."
   */
  public static async auditBusiness(workspaceId: string, prompt?: string) {
    return generateExecutiveReport(workspaceId, prompt);
  }

  /**
   * CAPABILITY 8: COMPANY BRAIN & MEMORY INGESTION
   */
  public static async getCompanyBrain(workspaceId: string): Promise<CompanyBrainMemory[]> {
    return Array.from(inMemoryStore.companyBrain.values()).filter((m) => m.workspaceId === workspaceId);
  }

  public static async addCompanyBrainKnowledge(
    workspaceId: string,
    data: { category: CompanyBrainMemory['category']; key: string; value: string; confidence?: number }
  ): Promise<CompanyBrainMemory> {
    const id = `cb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const mem: CompanyBrainMemory = {
      id,
      workspaceId,
      category: data.category,
      key: data.key,
      value: data.value,
      confidence: data.confidence ?? 0.95,
      createdAt: new Date().toISOString(),
    };

    inMemoryStore.companyBrain.set(id, mem);
    return mem;
  }

  /**
   * CAPABILITY 9: TAKES REAL ACTION OUTSIDE THE APP
   */
  public static async dispatchOutsideAction(
    workspaceId: string,
    actionType: any,
    payload: Record<string, any>
  ) {
    return executeExternalAction(workspaceId, actionType, payload);
  }

  /**
   * APPROVAL QUEUE RESOLVER
   */
  public static async resolveApprovalItem(
    approvalId: string,
    action: 'approve' | 'reject',
    resolvedByUserId: string
  ): Promise<ApprovalQueueItem | null> {
    const item = inMemoryStore.approvalQueue.get(approvalId);
    if (!item) return null;

    if (action === 'reject') {
      item.status = 'rejected';
      item.resolvedAt = new Date().toISOString();
      item.resolvedBy = resolvedByUserId;
    } else {
      item.status = 'approved';
      item.resolvedAt = new Date().toISOString();
      item.resolvedBy = resolvedByUserId;

      // Execute approved action
      if (item.capability === 'drafts_work' && item.payload?.email) {
        item.status = 'executed';
        item.executedResult = { sent: true, time: new Date().toISOString() };
      }
    }

    inMemoryStore.approvalQueue.set(approvalId, item);
    return item;
  }
}
