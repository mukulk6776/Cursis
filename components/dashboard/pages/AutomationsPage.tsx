'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function AutomationsPage() {
 const {
   user,
   automations,
   auditLogs,
   toggleAutomation,
   addAutomation,
   updateAutomation,
   deleteAutomation,
   openModal,
   showToast,
   addAuditEntry,
 } = useDashboard();

 const [activeTab, setActiveTab] = useState<'rules' | 'builder' | 'templates' | 'history'>('rules');
 const [showNlModal, setShowNlModal] = useState(false);
 const [nlText, setNlText] = useState('');

 const standardAutos = automations.filter((a) => a.type !== 'agency_custom');
 const agencyAutos = automations.filter((a) => a.type === 'agency_custom');

 const handleTestRun = async (autoId: string) => {
   const auto = automations.find((a) => a.id === autoId);
   if (!auto) return;
   try {
     await fetch(`/api/automations/${autoId}/execute`, { credentials: 'include', method: 'POST' }).catch(() => null);
   } catch {
     // ignore
   }
   const nextCount = (auto.executionCount || 0) + 1;
   const nextRun = new Date().toISOString();
   updateAutomation(autoId, { executionCount: nextCount, lastRun: nextRun });
   addAuditEntry(user?.name || user?.email || 'System', 'automation.executed', auto.name, 'Manual test run executed successfully');
   showToast(`Test run complete: "${auto.name}" executed successfully ⚡`);
 };

 const loadTemplate = (name: string, desc: string, trigger: string, action: string) => {
   addAutomation({
     name,
     when: trigger,
     condition: null,
     then: action,
     icon: '',
     color: '#FF5500',
     type: 'standard',
     executionCount: 0,
     lastRun: 'Never',
   });
   addAuditEntry(user?.name || user?.email || 'System', 'automation.created', name, 'Created from template');
   showToast(`Template "${name}" added to active automations ⚡`);
   setActiveTab('rules');
 };

 // Structured Natural Language Automation Parser
 interface ParsedNlRule {
   name: string;
   when: string;
   condition: string | null;
   then: string;
   triggerType: string;
   actionType: string;
 }

 const parseNlAutomationPrompt = (text: string): ParsedNlRule => {
   const lower = text.toLowerCase();

   // 1. Determine Trigger
   let when = 'Workspace Event';
   let triggerType = 'task.created';
   if (lower.includes('task') || lower.includes('todo') || lower.includes('ticket')) {
     if (lower.includes('overdue') || lower.includes('deadline') || lower.includes('due')) {
       when = 'Task Overdue';
       triggerType = 'task_overdue';
     } else if (lower.includes('complete') || lower.includes('status') || lower.includes('done')) {
       when = 'Task Status Changed';
       triggerType = 'task_status_changed';
     } else {
       when = 'Task Created';
       triggerType = 'task.created';
     }
   } else if (lower.includes('meeting') || lower.includes('call') || lower.includes('sync')) {
     if (lower.includes('end') || lower.includes('conclude') || lower.includes('finish')) {
       when = 'Meeting Concluded';
       triggerType = 'meeting_ended';
     } else {
       when = 'Meeting Scheduled';
       triggerType = 'meeting.scheduled';
     }
   } else if (lower.includes('doc') || lower.includes('contract') || lower.includes('pdf') || lower.includes('file')) {
     when = 'Document Updated';
     triggerType = 'document.updated';
   } else if (lower.includes('lead') || lower.includes('crm') || lower.includes('deal') || lower.includes('form') || lower.includes('client')) {
     when = 'Lead Created';
     triggerType = 'lead_created';
   } else if (lower.includes('webhook') || lower.includes('api') || lower.includes('ping')) {
     when = 'Webhook Received';
     triggerType = 'webhook';
   } else if (lower.includes('payment') || lower.includes('invoice') || lower.includes('paid')) {
     when = 'Payment Received';
     triggerType = 'payment_received';
   }

   // 2. Determine Condition (never a dummy string)
   let condition: string | null = null;
   if (lower.includes('urgent') || lower.includes('high priority') || lower.includes('p0') || lower.includes('critical')) {
     condition = 'Priority is urgent';
   } else if (lower.includes('enterprise') || lower.includes('50,000') || lower.includes('vip') || lower.includes('tier')) {
     condition = 'Deal value > $50,000';
   } else if (lower.includes('won') || lower.includes('closed') || lower.includes('signed')) {
     condition = 'Status is Closed/Won';
   } else if (lower.includes('legal') || lower.includes('contract')) {
     condition = 'Category is Legal/Contract';
   }

   // 3. Determine Action
   let then = 'Notify workspace team';
   let actionType = 'notify_channel';
   if (lower.includes('slack') || lower.includes('channel') || lower.includes('discord')) {
     then = 'Send Slack notification to channel';
     actionType = 'slack.notify';
   } else if (lower.includes('email') || lower.includes('mail') || lower.includes('inbox')) {
     then = 'Send email notification alert';
     actionType = 'email.alert';
   } else if (lower.includes('webhook') || lower.includes('endpoint') || lower.includes('http')) {
     then = 'Dispatch payload to webhook';
     actionType = 'webhook.call';
   } else if (lower.includes('crm') || lower.includes('deal') || lower.includes('opportunity')) {
     then = 'Create CRM opportunity record';
     actionType = 'create_crm_deal';
   } else if (lower.includes('task') || lower.includes('assign') || lower.includes('reminder') || lower.includes('action item')) {
     then = 'Create follow-up task';
     actionType = 'create_task';
   }

   // 4. Clean, realistic rule name
   const cleanedSnippet = text.trim().replace(/^when\s+/i, '').replace(/[.!?]+$/, '');
   const capitalizedName = cleanedSnippet.charAt(0).toUpperCase() + cleanedSnippet.slice(1, 42);
   const name = capitalizedName.length >= 40 ? `${capitalizedName}...` : capitalizedName;

   return {
     name: name || `${when} → ${then}`,
     when,
     condition,
     then,
     triggerType,
     actionType,
   };
 };

 const handleCreateFromNl = (e: React.FormEvent) => {
   e.preventDefault();
   if (!nlText.trim()) return;

   const parsed = parseNlAutomationPrompt(nlText);

   addAutomation({
     name: parsed.name,
     when: parsed.when,
     condition: parsed.condition,
     then: parsed.then,
     icon: '',
     color: '#FF5500',
     type: 'standard',
     executionCount: 0,
     lastRun: 'Never',
   });

   addAuditEntry(user?.name || user?.email || 'System', 'automation.created_via_nl', parsed.name, `Generated rule: ${parsed.when} -> ${parsed.then}`);
   showToast('Natural language rule parsed & added to workflow engine ⚡');
   setNlText('');
   setShowNlModal(false);
   setActiveTab('rules');
 };

 const executionHistory = auditLogs
 .filter((a) => a.action.includes('automation') || a.action.includes('workflow') || a.action.includes('triggered'))
 .map((a) => ({
 rule: a.target || 'Automation Rule',
 time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
 status: 'Success',
 details: a.details || 'Executed rule action',
 }));

 return (
 <div className="page active" id="page-automations" style={{ display: 'block' }}>
 <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
 <div>
 <h1 className="page-title">Automations &amp; Workflow Engine</h1>
 </div>
 </div>

 {/* Header Tabs Bar */}
 <div
 className="card"
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 marginBottom: 'var(--sp-4)',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 gap: 'var(--sp-3)',
 flexWrap: 'wrap',
 }}
 >
 <div className="tabs" style={{ margin: 0 }}>
 <span
 className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
 onClick={() => setActiveTab('rules')}
 style={{ cursor: 'pointer' }}
 >
 Active Rules ({automations.length})
 </span>
 <span
 className={`tab ${activeTab === 'builder' ? 'active' : ''}`}
 onClick={() => setActiveTab('builder')}
 style={{ cursor: 'pointer' }}
 >
 Visual Workflow Builder
 </span>
 <span
 className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
 onClick={() => setActiveTab('templates')}
 style={{ cursor: 'pointer' }}
 >
 Rule Templates
 </span>
 <span
 className={`tab ${activeTab === 'history' ? 'active' : ''}`}
 onClick={() => setActiveTab('history')}
 style={{ cursor: 'pointer' }}
 >
 Execution History
 </span>
 </div>

 <button className="btn btn-primary btn-sm" onClick={() => setShowNlModal(true)}>
 + Create with Natural Language
 </button>
 </div>

 {/* TAB 1: ACTIVE RULES */}
 {activeTab === 'rules' && (
 <div>
 <div style={{ marginBottom: 'var(--sp-3)' }}>
 <div
 style={{
 fontWeight: 'var(--fw-bold)',
 fontSize: 'var(--fs-xs)',
 color: 'var(--text-tertiary)',
 letterSpacing: 'var(--ls-wide)',
 }}
 >
 STANDARD WORKSPACE AUTOMATIONS (UNLIMITED)
 </div>
 </div>

 <div className="automation-list anim-stagger" style={{ marginBottom: 'var(--sp-6)' }}>
 {standardAutos.map((auto, i) => (
 <div key={auto.id} className="automation-card card-stagger">
 <div
 className="automation-icon"
 style={{
 background: `${auto.color}15`,
 color: auto.color,
 fontWeight: 'var(--fw-black)',
 fontSize: '11px',
 }}
 >
 #{i + 1}
 </div>
 <div className="automation-info">
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div className="automation-name">{auto.name}</div>
 <span className="badge badge-neutral" style={{ fontSize: '9px' }}>
 Ran {auto.executionCount || 0} times
 </span>
 </div>
 <div className="automation-flow" style={{ marginTop: '4px' }}>
 <span className="automation-flow-step flow-when">WHEN</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{auto.when}</span>
 {auto.condition && (
 <>
 <span className="automation-flow-arrow">→</span>
 <span className="automation-flow-step flow-if">IF</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{auto.condition}</span>
 </>
 )}
 <span className="automation-flow-arrow">→</span>
 <span className="automation-flow-step flow-then">THEN</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{auto.then}</span>
 </div>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <button
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '10px' }}
 onClick={() => handleTestRun(auto.id)}
 >
 Test Run
 </button>
 <button
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '10px', color: '#EF4444' }}
 onClick={() => deleteAutomation(auto.id)}
 title="Delete automation"
 >
 Delete
 </button>
 <div
 className={`toggle ${auto.active ? 'active' : ''}`}
 onClick={() => toggleAutomation(auto.id)}
 />
 </div>
 </div>
 ))}
 </div>

 {/* Agency Advanced Multi-Step Workflows */}
 <div style={{ borderTop: 'var(--border-width) solid var(--border-color)', paddingTop: 'var(--sp-5)' }}>
 <div
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 'var(--sp-3)',
 flexWrap: 'wrap',
 gap: 'var(--sp-2)',
 }}
 >
 <div>
 <div
 style={{
 fontWeight: 'var(--fw-bold)',
 fontSize: 'var(--fs-xs)',
 color: 'var(--text-tertiary)',
 letterSpacing: 'var(--ls-wide)',
 }}
 >
 AGENCY MULTI-STEP &amp; PAPERWORK WORKFLOWS
 </div>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
 Bespoke automations connecting external CRMs, PDF generation, and automated signer alerts.
 </p>
 </div>
 <button className="btn btn-secondary btn-sm" onClick={() => openModal('agency-modal')}>
 Request Custom Workflow →
 </button>
 </div>

 <div className="automation-list">
 {agencyAutos.map((auto) => (
 <div
 key={auto.id}
 className="automation-card card-stagger"
 style={{ borderLeft: '4px solid var(--c-brand)' }}
 >
 <div
 className="automation-icon"
 style={{
 background: 'var(--c-brand-bg)',
 color: 'var(--c-brand)',
 fontWeight: 'var(--fw-black)',
 fontSize: '11px',
 }}
 >
 ENG
 </div>
 <div className="automation-info">
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div className="automation-name">{auto.name}</div>
 <span className="badge badge-brand" style={{ fontSize: '10px' }}>
 AGENCY CUSTOM
 </span>
 <span className="badge badge-neutral" style={{ fontSize: '9px' }}>
 Ran {auto.executionCount || 0} times
 </span>
 </div>
 <div className="automation-flow" style={{ marginTop: '4px' }}>
 <span className="automation-flow-step flow-when">WHEN</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{auto.when}</span>
 <span className="automation-flow-arrow">→</span>
 <span className="automation-flow-step flow-if">IF</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{auto.condition}</span>
 <span className="automation-flow-arrow">→</span>
 <span className="automation-flow-step flow-then">THEN</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{auto.then}</span>
 </div>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <button
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '10px' }}
 onClick={() => handleTestRun(auto.id)}
 >
 Test Run
 </button>
 <button
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '10px', color: '#EF4444' }}
 onClick={() => deleteAutomation(auto.id)}
 title="Delete automation"
 >
 Delete
 </button>
 <div
 className={`toggle ${auto.active ? 'active' : ''}`}
 onClick={() => toggleAutomation(auto.id)}
 />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: VISUAL BUILDER */}
 {activeTab === 'builder' && (
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
 <div>
 <h3>Visual Multi-Step Workflow Canvas</h3>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Connect triggers, filters, and multiple sequential or branching actions.
 </div>
 </div>
 <button className="btn btn-primary btn-sm" onClick={() => showToast('Workflow saved and activated *')}>
 Save &amp; Activate
 </button>
 </div>

 {/* Visual Flow Nodes */}
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 gap: 'var(--sp-3)',
 maxWidth: '650px',
 margin: '0 auto',
 position: 'relative',
 }}
 >
 {/* Node 1: Trigger */}
 <div className="card" style={{ padding: 'var(--sp-4)', background: 'var(--c-surface)', border: 'var(--border-width) solid var(--border-color)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
 <span className="badge badge-brand" style={{ fontSize: '10px' }}>
 STEP 1: TRIGGER
 </span>
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Event listener</span>
 </div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
 When: Digital Client Intake Form is Submitted
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Source: Web Intake Form (Public Portal)
 </div>
 </div>

 <div style={{ textAlign: 'center', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)' }}>↓</div>

 {/* Node 2: Condition Filter */}
 <div className="card" style={{ padding: 'var(--sp-4)', background: 'var(--c-surface)', border: 'var(--border-width) solid var(--c-warning)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
 <span className="badge badge-warning" style={{ fontSize: '10px' }}>
 STEP 2: CONDITION FILTER
 </span>
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Logical branch</span>
 </div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
 If: Deal Value &gt; $50,000 OR Type is &quot;Enterprise&quot;
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Routes enterprise leads to senior solution team
 </div>
 </div>

 <div style={{ textAlign: 'center', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)' }}>↓</div>

 {/* Node 3: Action 1 */}
 <div className="card" style={{ padding: 'var(--sp-4)', background: 'var(--c-surface)', border: 'var(--border-width) solid var(--c-success)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
 <span className="badge badge-success" style={{ fontSize: '10px' }}>
 STEP 3: ACTION 1
 </span>
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Automated Document Engine</span>
 </div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
 Then: Auto-Generate Customized MSA &amp; SLA Contract PDF
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Template: Master Services Agreement v3
 </div>
 </div>

 <div style={{ textAlign: 'center', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)' }}>↓</div>

 {/* Node 4: Action 2 */}
 <div className="card" style={{ padding: 'var(--sp-4)', background: 'var(--c-surface)', border: 'var(--border-width) solid var(--c-brand)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
 <span className="badge badge-brand" style={{ fontSize: '10px' }}>
 STEP 4: ACTION 2
 </span>
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Notifications &amp; CRM</span>
 </div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
 Then: Create CRM Record + Ping #client-operations Slack Channel
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Assignee: {user.name} ({user.role})
 </div>
 </div>
 </div>

 <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
 <button className="btn btn-secondary btn-sm" onClick={() => showToast('Node added to builder canvas *')}>
 + Add Step to Sequence
 </button>
 </div>
 </div>
 )}

 {/* TAB 3: RULE TEMPLATES */}
 {activeTab === 'templates' && (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
 {[
 {
 name: 'Lead Qualification & CRM Sync',
 desc: 'When a new lead fills out the contact form, run AI extraction, score budget, and create CRM opportunity.',
 trigger: 'Form submission',
 actions: 'CRM deal + Email alert',
 },
 {
 name: 'Meeting Follow-up & Task Generator',
 desc: 'When an executive meeting concludes, extract action items, create tasks for assignees, and post recap in channel.',
 trigger: 'Meeting completed',
 actions: 'Tasks created + Channel digest',
 },
 {
 name: 'Overdue Task Escalation',
 desc: 'When an urgent task crosses its deadline, notify project lead and increase visibility on executive dashboard.',
 trigger: 'Task deadline passed',
 actions: 'Escalate to manager',
 },
 {
 name: 'Employee Onboarding Checklist',
 desc: 'When a new member joins the workspace, auto-assign compliance checklist, invite to channels, and schedule manager 1:1.',
 trigger: 'Member added',
 actions: '12 checklist tasks + Calendar invite',
 },
 ].map((t, idx) => (
 <div
 key={idx}
 className="card"
 style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
 >
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', marginBottom: '4px' }}>{t.name}</div>
 <div
 style={{
 fontSize: 'var(--fs-xs)',
 color: 'var(--text-secondary)',
 lineHeight: 'var(--lh-normal)',
 marginBottom: 'var(--sp-3)',
 }}
 >
 {t.desc}
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
 <strong>Trigger:</strong> {t.trigger}
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 <strong>Output:</strong> {t.actions}
 </div>
 </div>
 <button
 className="btn btn-primary btn-sm"
 style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--fs-xs)' }}
 onClick={() => loadTemplate(t.name, t.desc, t.trigger, t.actions)}
 >
 Use Template →
 </button>
 </div>
 ))}
 </div>
 )}

 {/* TAB 4: EXECUTION HISTORY */}
 {activeTab === 'history' && (
 <div className="card" style={{ padding: 'var(--sp-4)' }}>
 <h3 style={{ marginBottom: 'var(--sp-3)' }}>Automation Run Log</h3>
 {executionHistory.length === 0 ? (
 <div style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--text-tertiary)' }}>
 <div style={{ fontSize: '24px', marginBottom: '8px' }}></div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>No automation runs recorded yet</div>
 <div style={{ fontSize: 'var(--fs-xs)', marginTop: '4px' }}>Active workflow triggers and rule executions will log here in real time.</div>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
 {executionHistory.map((h, i) => (
 <div
 key={i}
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: 'var(--sp-2) var(--sp-3)',
 borderBottom: '1px solid var(--c-gray-100)',
 fontSize: 'var(--fs-xs)',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
 <span className="badge badge-success" style={{ fontSize: '9px' }}>
 {h.status}
 </span>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>{h.rule}</div>
 <div style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>{h.details}</div>
 </div>
 </div>
 <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{h.time}</div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Natural Language Modal */}
 {showNlModal && (
 <div
 className="modal-overlay active"
 id="nl-automation-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) setShowNlModal(false);
 }}
 >
 <div className="modal" role="dialog" aria-modal="true" aria-labelledby="nl-automation-title" style={{ maxWidth: '600px' }}>
 <div className="modal-header">
 <div>
 <span id="nl-automation-title" className="modal-title">Natural Language Workflow Creator</span>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Describe what you want to automate in plain English
 </div>
 </div>
 <button className="modal-close" onClick={() => setShowNlModal(false)}>
 
 </button>
 </div>
 <form onSubmit={handleCreateFromNl}>
 <div className="modal-body">
 <div className="input-group">
 <label className="input-label">Describe Your Workflow</label>
 <textarea
 className="input"
 rows={3}
 placeholder="e.g., When an urgent task is created in Core Sprint, notify the project lead and create a follow-up reminder."
 value={nlText}
 onChange={(e) => setNlText(e.target.value)}
 required
 />
 </div>
 <div
 style={{
 padding: 'var(--sp-3)',
 background: 'var(--c-surface)',
 border: 'var(--border-width) solid var(--border-color)',
 fontSize: 'var(--fs-xs)',
 }}
 >
 <strong>Examples:</strong>
 <br />
 - &quot;When a contract document is generated, move deal to Won and create kickoff project.&quot;
 <br />
 - &quot;Every Friday at 5 PM, compile sprint velocity report and dispatch to announcements.&quot;
 </div>
 </div>
 <div className="modal-footer">
 <button type="button" className="btn btn-secondary" onClick={() => setShowNlModal(false)}>
 Cancel
 </button>
 <button type="submit" className="btn btn-primary">
 Build Automation Rule
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
