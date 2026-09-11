import { getDb, isMongoConnected } from '@/lib/mongodb';
import {
  Workspace,
  UserProfile,
  Task,
  Project,
  CalendarEvent,
  Meeting,
  DocumentItem,
  Department,
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

// In-Memory Fast Cache Store with MongoDB Persistence Synchronization
class InMemoryDataStore {
  public workspaces: Map<string, Workspace> = new Map();
  public users: Map<string, UserProfile> = new Map();
  public tasks: Map<string, Task> = new Map();
  public projects: Map<string, Project> = new Map();
  public calendarEvents: Map<string, CalendarEvent> = new Map();
  public meetings: Map<string, Meeting> = new Map();
  public documents: Map<string, DocumentItem> = new Map();
  public departments: Map<string, Department> = new Map();
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

    // Agency Storefront Catalog
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
  getDb,
  isMongoActive: isMongoConnected,
};

