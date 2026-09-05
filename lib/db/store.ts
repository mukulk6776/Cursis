import { adminDb } from '@/lib/auth/firebase-admin';
import {
  Workspace,
  UserProfile,
  Task,
  Project,
  CalendarEvent,
  Meeting,
  DocumentItem,
  AutomationRule,
  Lead,
  Deal,
  AuditLogEntry,
  OrdisNoticeCard,
  ApprovalQueueItem,
  RiskRadarItem,
  SimulationItem,
  DynamicTool,
  GoalPlan,
  CompanyBrainMemory,
  ExternalIntegration,
  CustomBuildRequest,
  AgencyServiceItem,
} from './types';

// In-Memory Persistent Store Seeded with High-Fidelity Workspace Data
class InMemoryDataStore {
  public workspaces: Map<string, Workspace> = new Map();
  public users: Map<string, UserProfile> = new Map();
  public tasks: Map<string, Task> = new Map();
  public projects: Map<string, Project> = new Map();
  public calendarEvents: Map<string, CalendarEvent> = new Map();
  public meetings: Map<string, Meeting> = new Map();
  public documents: Map<string, DocumentItem> = new Map();
  public automations: Map<string, AutomationRule> = new Map();
  public leads: Map<string, Lead> = new Map();
  public deals: Map<string, Deal> = new Map();
  public auditLogs: Map<string, AuditLogEntry> = new Map();
  public ordisCards: Map<string, OrdisNoticeCard> = new Map();
  public approvalQueue: Map<string, ApprovalQueueItem> = new Map();
  public riskRadar: Map<string, RiskRadarItem> = new Map();
  public simulations: Map<string, SimulationItem> = new Map();
  public dynamicTools: Map<string, DynamicTool> = new Map();
  public goalPlans: Map<string, GoalPlan> = new Map();
  public companyBrain: Map<string, CompanyBrainMemory> = new Map();
  public integrations: Map<string, ExternalIntegration> = new Map();
  public agencyRequests: Map<string, CustomBuildRequest> = new Map();
  public agencyCatalog: Map<string, AgencyServiceItem> = new Map();

  private isSeeded = false;

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    if (this.isSeeded) return;
    this.isSeeded = true;

    const defaultWorkspaceId = 'ws_cursis_demo';
    const defaultOwnerId = 'usr_owner_demo';

    // 1. Default Workspace
    this.workspaces.set(defaultWorkspaceId, {
      id: defaultWorkspaceId,
      name: 'Cursis Foundry HQ',
      slug: 'cursis-foundry',
      tier: 'free', // Defaults to Free Chill Mode, can be toggled to paid
      ordisMode: 'chill',
      industry: 'AI & Software Agency',
      teamSize: '11-50',
      features: [
        'workspace_core',
        'communication',
        'tasks',
        'projects',
        'calendar',
        'meetings',
        'documents',
        'automations',
        'crm',
        'team',
        'dashboards',
        'search',
        'security',
        'ordis_ai',
        'integrations',
        'agency_storefront',
      ],
      settings: {
        ambientMonitoring: true,
        approvalRequiredForActions: true,
        simulationMode: true,
        riskTolerance: 'medium',
        companyTone: 'Direct, premium, deeply competent, proactive, zero fluff.',
        pricingFormula: 'Base: ₹5,00,000 for 6-week sprint. Standard milestone: 40% advance, 30% alpha, 30% handover.',
      },
      ownerId: defaultOwnerId,
      memberCount: 5,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Team Members
    const members: UserProfile[] = [
      {
        id: defaultOwnerId,
        uid: defaultOwnerId,
        email: 'founder@cursis.ai',
        displayName: 'Aarav Sharma',
        role: 'owner',
        department: 'Executive',
        title: 'Founder & CEO',
        skills: ['Architecture', 'Product Strategy', 'Client Relations', 'AI Systems'],
        workspaceIds: [defaultWorkspaceId],
        activeWorkspaceId: defaultWorkspaceId,
        onboardingStatus: 'completed',
        onboardingChecklist: [
          { id: 'ob_1', title: 'Connect primary calendar', completed: true },
          { id: 'ob_2', title: 'Configure team channels', completed: true },
          { id: 'ob_3', title: 'Set up Ordis company brain tone', completed: true },
        ],
        presence: 'online',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'usr_dev_1',
        uid: 'usr_dev_1',
        email: 'priya@cursis.ai',
        displayName: 'Priya Mehta',
        role: 'admin',
        department: 'Engineering',
        title: 'Lead Full-Stack Engineer',
        skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'API Design'],
        workspaceIds: [defaultWorkspaceId],
        activeWorkspaceId: defaultWorkspaceId,
        onboardingStatus: 'completed',
        onboardingChecklist: [{ id: 'ob_1', title: 'Repository access setup', completed: true }],
        presence: 'online',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'usr_des_1',
        uid: 'usr_des_1',
        email: 'rohit@cursis.ai',
        displayName: 'Rohit Verma',
        role: 'member',
        department: 'Design',
        title: 'Principal UI/UX Designer',
        skills: ['UI/UX', 'Figma', 'Design Systems', 'Motion Design', 'Prototyping'],
        workspaceIds: [defaultWorkspaceId],
        activeWorkspaceId: defaultWorkspaceId,
        onboardingStatus: 'completed',
        onboardingChecklist: [{ id: 'ob_1', title: 'Design token alignment', completed: true }],
        presence: 'busy',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'usr_sales_1',
        uid: 'usr_sales_1',
        email: 'neha@cursis.ai',
        displayName: 'Neha Kapoor',
        role: 'member',
        department: 'Growth',
        title: 'Client Partner & Deals Lead',
        skills: ['Sales', 'CRM', 'Copywriting', 'Pitch Decks', 'Contract Negotiation'],
        workspaceIds: [defaultWorkspaceId],
        activeWorkspaceId: defaultWorkspaceId,
        onboardingStatus: 'completed',
        onboardingChecklist: [{ id: 'ob_1', title: 'CRM pipeline setup', completed: true }],
        presence: 'online',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];

    members.forEach((m) => this.users.set(m.id, m));


    // 4. Projects
    const acmeProjectId = 'prj_acme_redesign';
    this.projects.set(acmeProjectId, {
      id: acmeProjectId,
      workspaceId: defaultWorkspaceId,
      name: 'Acme Corp — Full Website & Portal Redesign',
      description: 'Complete brand overhaul, Next.js architecture, and interactive client portal.',
      clientName: 'Acme Corp',
      budget: 500000,
      spent: 120000,
      currency: 'INR',
      startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 35 * 86400000).toISOString(),
      health: 'on_track',
      progressPercent: 35,
      ownerId: defaultOwnerId,
      teamMemberIds: [defaultOwnerId, 'usr_dev_1', 'usr_des_1', 'usr_sales_1'],
      milestones: [
        { id: 'ms_1', title: 'Kickoff & Discovery', dueDate: new Date(Date.now() - 2 * 86400000).toISOString(), completed: true },
        { id: 'ms_2', title: 'Design System & Wireframes', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), completed: false },
        { id: 'ms_3', title: 'Next.js Frontend Build', dueDate: new Date(Date.now() + 18 * 86400000).toISOString(), completed: false },
        { id: 'ms_4', title: 'Testing & Handover', dueDate: new Date(Date.now() + 35 * 86400000).toISOString(), completed: false },
      ],
      linkedDocIds: ['doc_acme_kickoff', 'doc_acme_proposal'],
      linkedMeetingIds: ['mtg_acme_kickoff'],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 5. Tasks (Including the Real-Life Example: Due tomorrow, 20% done, flagged as at-risk)
    const taskAtRiskId = 'tsk_brand_guidelines';
    this.tasks.set(taskAtRiskId, {
      id: taskAtRiskId,
      workspaceId: defaultWorkspaceId,
      projectId: acmeProjectId,
      title: 'Finalize Acme Brand & Typography Guidelines',
      description: 'Export brand tokens, define font pairing hierarchy and color scales.',
      status: 'in_progress',
      priority: 'urgent',
      assigneeId: 'usr_des_1',
      assigneeName: 'Rohit Verma',
      creatorId: defaultOwnerId,
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Due tomorrow!
      estimatedHours: 12,
      actualHours: 3,
      completionPercent: 20, // Only 20% done!
      requiredSkills: ['UI/UX', 'Design Systems', 'Motion Design'],
      subtasks: [
        { id: 'st_1', title: 'Color palette specification', completed: true },
        { id: 'st_2', title: 'Type scale and responsive rules', completed: false },
        { id: 'st_3', title: 'Component token export', completed: false },
      ],
      tags: ['Design', 'Acme', 'Urgent'],
      isAtRisk: true,
      riskReason: 'Due date is tomorrow but only 20% is completed. Assignee workload is currently 92%.',
      suggestedHelperId: 'usr_dev_1',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.tasks.set('tsk_backend_auth', {
      id: 'tsk_backend_auth',
      workspaceId: defaultWorkspaceId,
      projectId: acmeProjectId,
      title: 'Implement Session Cookie Auth & RBAC',
      description: 'Wire Next.js App router cookies with token verification and fallback.',
      status: 'done',
      priority: 'high',
      assigneeId: 'usr_dev_1',
      assigneeName: 'Priya Mehta',
      creatorId: defaultOwnerId,
      dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      completionPercent: 100,
      subtasks: [{ id: 'st_auth_1', title: 'Cookie handler', completed: true }],
      tags: ['Engineering', 'Security'],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Proactive Notice Card ("Ordis noticed...")
    this.ordisCards.set('card_notice_1', {
      id: 'card_notice_1',
      workspaceId: defaultWorkspaceId,
      type: 'risk_detected',
      title: 'Ordis noticed: Task at risk for tomorrow’s deadline',
      description: '“Finalize Acme Brand Guidelines” is due tomorrow but is only 20% complete. Rohit Verma is at 92% bandwidth. Priya Mehta has available bandwidth (35%) to assist with asset integration.',
      severity: 'warning',
      contextData: {
        taskId: taskAtRiskId,
        assigneeId: 'usr_des_1',
        suggestedHelperId: 'usr_dev_1',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        completionPercent: 20,
      },
      suggestedAction: {
        label: 'Rebalance & Pair Priya with Rohit',
        actionType: 'task.reassign_helper',
        payload: { taskId: taskAtRiskId, helperId: 'usr_dev_1' },
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // 7. CRM Lead (The 11pm inbound lead example)
    const inboundLeadId = 'lead_apex_tech';
    this.leads.set(inboundLeadId, {
      id: inboundLeadId,
      workspaceId: defaultWorkspaceId,
      name: 'Vikram Singhania',
      company: 'Apex Robotics',
      email: 'vikram@apexrobotics.io',
      phone: '+91 98765 43210',
      budget: 800000,
      currency: 'INR',
      status: 'new',
      source: 'website_form',
      notes: 'Submitted contact form at 11:15 PM requesting custom autonomous agent orchestration.',
      renewalDate: undefined,
      usageScore: undefined,
      drafts: [
        {
          id: 'drf_lead_1',
          type: 'email',
          content: `Hi Vikram,\n\nThanks for reaching out to Cursis regarding Apex Robotics' autonomous AI workspace.\n\nWe reviewed your requirements for custom agent orchestration. We have 3 open slots for a strategy call with our architecture team:\n1. Tomorrow at 3:00 PM IST\n2. Tomorrow at 5:30 PM IST\n3. Thursday at 11:00 AM IST\n\nLooking forward to speaking!\n\nBest regards,\nAarav Sharma\nCursis Foundry`,
          status: 'pending_approval',
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 8. CRM Deal & Client Renewal Tracking (Goal: "Get this client to renew")
    this.leads.set('lead_renew_zenith', {
      id: 'lead_renew_zenith',
      workspaceId: defaultWorkspaceId,
      name: 'Kavita Rao',
      company: 'Zenith Logistics',
      email: 'kavita@zenithlogistics.com',
      budget: 650000,
      currency: 'INR',
      status: 'won',
      source: 'manual',
      renewalDate: new Date(Date.now() + 14 * 86400000).toISOString(), // 14 days from now
      usageScore: 88, // High usage score: ideal candidate for renewal
      notes: 'Current subscription ends in 2 weeks. High daily activity on task automations.',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 9. Meeting (The 30-minute client meeting example)
    const meetingId = 'mtg_acme_kickoff';
    this.meetings.set(meetingId, {
      id: meetingId,
      workspaceId: defaultWorkspaceId,
      projectId: acmeProjectId,
      title: 'Acme Corp — Architecture & Scope Alignment Call',
      platform: 'google_meet',
      meetingUrl: 'https://meet.google.com/acm-scope-call',
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      durationMinutes: 30,
      hostId: defaultOwnerId,
      attendees: ['founder@cursis.ai', 'priya@cursis.ai', 'contact@acmecorp.com'],
      notes: 'Discussed portal security, timeline compression to 6 weeks, and custom webhook feeds.',
      summary: 'Acme approved the ₹5L scope and 6-week timeline. Requested webhook support for Salesforce deal syncing and signed agreement by Friday.',
      transcript:
        '[00:01] Aarav: Welcome everyone. We will cover the 6-week delivery roadmap.\n[05:12] Client: We need real-time Salesforce contact sync.\n[14:40] Priya: Next.js backend will handle the webhook listeners effortlessly.\n[28:00] Client: Send over the proposal deck and kickoff doc today.',
      actionItems: [
        { id: 'ai_1', text: 'Generate Kickoff Specification Doc', assigneeName: 'Priya Mehta', assigneeId: 'usr_dev_1', dueDate: new Date(Date.now() + 86400000).toISOString() },
        { id: 'ai_2', text: 'Send formal proposal deck & contract to Acme', assigneeName: 'Neha Kapoor', assigneeId: 'usr_sales_1', dueDate: new Date(Date.now() + 86400000).toISOString() },
        { id: 'ai_3', text: 'Schedule weekly sprint review call', assigneeName: 'Aarav Sharma', assigneeId: defaultOwnerId, dueDate: new Date(Date.now() + 2 * 86400000).toISOString() },
      ],
      followUpEmailDraft: {
        to: ['contact@acmecorp.com'],
        subject: 'Acme Corp x Cursis — Kickoff Summary & Action Items',
        body: 'Hi Acme Team,\n\nGreat speaking with you today. Attached is our aligned kickoff document and milestones for the 6-week sprint.\n\nNext steps:\n1. Priya is configuring the webhook architecture.\n2. Neha has queued the formal proposal deck.\n\nBest,\nAarav',
        status: 'draft',
      },
      processedByOrdis: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });

    // 10. Documents & Knowledge Base (Company Brain)
    this.documents.set('doc_acme_kickoff', {
      id: 'doc_acme_kickoff',
      workspaceId: defaultWorkspaceId,
      projectId: acmeProjectId,
      title: 'Acme Corp — Project Kickoff Specification',
      category: 'kickoff',
      content: `# Acme Corp Kickoff Specification\n\n- **Budget:** ₹5,00,000\n- **Timeline:** 6 Weeks\n- **Deliverables:** Next.js Platform, Client Portal, Salesforce Integration\n- **Sprint Cadence:** Bi-weekly demos every Thursday at 4 PM IST.`,
      tags: ['Acme', 'Kickoff', 'Spec'],
      authorId: defaultOwnerId,
      authorName: 'Aarav Sharma',
      version: 1,
      isCompanyBrainResource: true,
      summary: 'Scope and architecture agreement for Acme Corp 6-week sprint.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 11. Company Brain Knowledge Items (Tone, Pricing, Rules)
    this.companyBrain.set('cb_tone', {
      id: 'cb_tone',
      workspaceId: defaultWorkspaceId,
      category: 'tone_of_voice',
      key: 'executive_communication_tone',
      value: 'Assertive, clean, deeply technical, polished, without buzzwords or excessive exclamation marks.',
      confidence: 0.98,
      createdAt: new Date().toISOString(),
    });

    this.companyBrain.set('cb_pricing', {
      id: 'cb_pricing',
      workspaceId: defaultWorkspaceId,
      category: 'pricing_formula',
      key: 'standard_agency_retainer',
      value: 'Standard sprint ₹5L ($6,000 USD) for 6 weeks. 40% initial, 30% alpha milestone, 30% handover.',
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    });

    this.companyBrain.set('cb_vip', {
      id: 'cb_vip',
      workspaceId: defaultWorkspaceId,
      category: 'vip_client_rule',
      key: 'acme_special_care',
      value: 'Acme Corp executive contacts receive direct Slack channel escalation and <2 hour SLA.',
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    });

    // 12. Dynamic Tool Example (Vendor Payment Tracker built on the spot)
    this.dynamicTools.set('tool_vendor_payments', {
      id: 'tool_vendor_payments',
      workspaceId: defaultWorkspaceId,
      title: 'Vendor Payment & Expense Tracker',
      slug: 'vendor-payments',
      prompt: 'I need a way to track vendor payments',
      description: 'Ordis generated live tool connected to workspace numbers and expense categories.',
      schema: {
        fields: [
          { name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
          { name: 'amount', label: 'Amount (₹)', type: 'currency', required: true },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'status', label: 'Payment Status', type: 'status', options: ['Pending', 'Processing', 'Paid', 'Overdue'] },
          { name: 'category', label: 'Expense Category', type: 'select', options: ['Cloud Infrastructure', 'Design Assets', 'Contractors', 'SaaS'] },
        ],
      },
      records: [
        { id: 'rec_1', vendorName: 'Vercel Enterprise', amount: 35000, dueDate: '2026-09-05', status: 'Pending', category: 'Cloud Infrastructure' },
        { id: 'rec_2', vendorName: 'Figma Organization', amount: 18000, dueDate: '2026-09-10', status: 'Paid', category: 'Design Assets' },
        { id: 'rec_3', vendorName: 'Anthropic & OpenAI Compute', amount: 62000, dueDate: '2026-09-01', status: 'Pending', category: 'Cloud Infrastructure' },
      ],
      statsSummary: {
        totalCommitted: 115000,
        pendingAmount: 97000,
        paidThisMonth: 18000,
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 13. Risk Radar Items
    this.riskRadar.set('rr_1', {
      id: 'rr_1',
      workspaceId: defaultWorkspaceId,
      targetType: 'task',
      targetId: taskAtRiskId,
      targetName: 'Finalize Acme Brand & Typography Guidelines',
      riskScore: 85,
      reason: '20% complete with deadline in 24 hours. Owner overloaded.',
      watchingSince: new Date(Date.now() - 12 * 3600000).toISOString(),
      suggestedMitigation: 'Reassign subtask to Priya Mehta or extend deadline by 2 days.',
      status: 'monitoring',
    });

    // 14. Approval Queue Items
    this.approvalQueue.set('appr_1', {
      id: 'appr_1',
      workspaceId: defaultWorkspaceId,
      capability: 'drafts_work',
      actionName: 'Send Outbound Follow-up Email to Vikram Singhania',
      description: 'Ordis pre-drafted follow-up email with 3 open calendar slots for inbound lead.',
      riskLevel: 'low',
      payload: { leadId: inboundLeadId, email: 'vikram@apexrobotics.io' },
      autoExecutableIfPaid: true,
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    });

    // 15. Automations (No-Code If This Then That)
    this.automations.set('auto_1', {
      id: 'auto_1',
      workspaceId: defaultWorkspaceId,
      name: 'Auto-Notify on Urgent Task Risk',
      description: 'When Ordis flags a task as isAtRisk, send alert card to general channel.',
      isActive: true,
      trigger: { type: 'task_overdue' },
      conditions: [{ field: 'isAtRisk', operator: 'equals', value: true }],
      actions: [{ type: 'notify_channel', config: { target: 'dashboard_feed' } }],
      runCount: 4,
      lastRunAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    });

    // 16. Agency Storefront Catalog
    const catalog: AgencyServiceItem[] = [
      {
        id: 'svc_ai_agents',
        title: 'Custom Autonomous AI Agents',
        category: 'custom_ai_agent',
        description: 'Bespoke multi-agent swarms with direct database hooks, external tool authorization, and custom reasoning pipelines.',
        estimatedTimeline: '2-4 Weeks',
        startingPrice: '₹3,50,000 ($4,200)',
        deliverables: ['Custom LLM Prompt Pipelines', 'Tool Execution Sandbox', 'Granular Rollback Logs', 'Full Test Suite'],
        badge: 'Most Popular',
      },
      {
        id: 'svc_custom_workspace',
        title: 'Bespoke Workspace OS & Design System',
        category: 'bespoke_workspace',
        description: 'White-label tailored workspace configured for your exact enterprise workflows, team hierarchy, and custom dashboards.',
        estimatedTimeline: '4-6 Weeks',
        startingPrice: '₹5,00,000 ($6,000)',
        deliverables: ['Custom Dynamic UI Views', 'Role-Based Access Hierarchy', 'Domain White-labeling', 'Mobile Companion App'],
        badge: 'Enterprise',
      },
      {
        id: 'svc_integrations',
        title: 'Deep Multi-Tool Integrations & ERP Sync',
        category: 'deep_integration',
        description: 'Two-way synchronization with Salesforce, SAP, QuickBooks, Stripe, DocuSign, and legacy SQL backends.',
        estimatedTimeline: '1-3 Weeks',
        startingPrice: '₹2,50,000 ($3,000)',
        deliverables: ['Two-Way Webhook Queues', 'Conflict Resolution Engine', 'Audit Trail & Rollback', 'High-Throughput Sync'],
      },
      {
        id: 'svc_enterprise_brain',
        title: 'Fine-Tuned Company Brain & Vector Memory',
        category: 'enterprise_brain',
        description: 'Private, secure company intelligence model trained on your historic client contracts, pricing patterns, and organizational IP.',
        estimatedTimeline: '3-5 Weeks',
        startingPrice: '₹4,50,000 ($5,400)',
        deliverables: ['Vector Embeddings Store', 'Tone of Voice Engine', 'Automated Knowledge Ingestion', 'Zero-Leakage Security'],
      },
    ];

    catalog.forEach((item) => this.agencyCatalog.set(item.id, item));

    // 17. External Integrations
    this.integrations.set('int_salesforce', {
      id: 'int_salesforce',
      workspaceId: defaultWorkspaceId,
      provider: 'salesforce',
      name: 'Salesforce CRM Connector',
      status: 'connected',
      config: {
        apiKeyMasked: 'sf_live_***89a2',
        syncEnabled: true,
        preApprovedActions: ['sync_contact', 'update_deal_stage'],
      },
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    });

    this.integrations.set('int_quickbooks', {
      id: 'int_quickbooks',
      workspaceId: defaultWorkspaceId,
      provider: 'quickbooks',
      name: 'QuickBooks Invoicing & Accounting',
      status: 'connected',
      config: {
        apiKeyMasked: 'qb_live_***54f1',
        syncEnabled: true,
        preApprovedActions: ['draft_invoice', 'send_invoice'],
      },
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    });

    this.integrations.set('int_docusign', {
      id: 'int_docusign',
      workspaceId: defaultWorkspaceId,
      provider: 'docusign',
      name: 'DocuSign E-Signature Portal',
      status: 'connected',
      config: {
        apiKeyMasked: 'ds_live_***32c9',
        syncEnabled: true,
        preApprovedActions: ['send_contract_for_esign'],
      },
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    });
  }
}

// Global Singleton Instance
declare global {
  var __cursisStoreInstance: InMemoryDataStore | undefined;
}

export const inMemoryStore = globalThis.__cursisStoreInstance || new InMemoryDataStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__cursisStoreInstance = inMemoryStore;
}

// Unified Store Helpers
export const store = {
  get: inMemoryStore,
  // Helper to check if Firestore is operational
  isFirestoreActive: () => {
    return Boolean(adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID);
  },
};
