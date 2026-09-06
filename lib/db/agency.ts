import { inMemoryStore } from './store';
import { AgencyServiceItem, CustomBuildRequest } from './types';
import { createDocument } from './documents';

export async function getAgencyServiceCatalog(): Promise<AgencyServiceItem[]> {
  return Array.from(inMemoryStore.agencyCatalog.values());
}

export async function getCustomBuildRequests(workspaceId: string): Promise<CustomBuildRequest[]> {
  return Array.from(inMemoryStore.agencyRequests.values())
    .filter((r) => r.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createCustomBuildRequest(
  workspaceId: string,
  data: {
    companyName: string;
    contactEmail: string;
    requestedService: string;
    budgetRange: string;
    requirements: string;
  }
): Promise<CustomBuildRequest> {
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Automatically generate custom build proposal document in knowledge base
  const proposalDoc = await createDocument(workspaceId, {
    title: `Agency Build Proposal: ${data.requestedService} for ${data.companyName}`,
    category: 'proposal',
    content: `# Custom Build Proposal for ${data.companyName}\n\n- **Requested Service:** ${data.requestedService}\n- **Budget Range:** ${data.budgetRange}\n- **Scope & Requirements:** ${data.requirements}\n- **Estimated Timeline:** 3-5 Weeks\n- **Architecture Lead:** Cursis Senior AI Engineer\n\n## Delivery Phases\n1. Technical Spec & Data Flow Alignment\n2. Bespoke Autonomous Agent Swarm Implementation\n3. External Tool Security & Sandbox Testing\n4. Deployment & Handover Training`,
    tags: ['Agency-Proposal', 'Custom-Build'],
  });

  const request: CustomBuildRequest = {
    id,
    workspaceId,
    companyName: data.companyName,
    contactEmail: data.contactEmail,
    requestedService: data.requestedService,
    budgetRange: data.budgetRange,
    requirements: data.requirements,
    status: 'proposal_generated',
    timelineEstimate: '3-5 Weeks',
    assignedEngineer: 'Principal AI Solutions Architect',
    proposalDocId: proposalDoc.id,
    milestones: [
      { title: 'Requirements & Architecture Call', completed: true, targetDate: new Date(Date.now() + 2 * 86400000).toISOString() },
      { title: 'Custom Agent Engine Sandbox Build', completed: false, targetDate: new Date(Date.now() + 14 * 86400000).toISOString() },
      { title: 'Integration Test & Client Deployment', completed: false, targetDate: new Date(Date.now() + 28 * 86400000).toISOString() },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.agencyRequests.set(id, request);
  return request;
}
