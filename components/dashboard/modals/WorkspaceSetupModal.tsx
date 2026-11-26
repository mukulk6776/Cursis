'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { Briefcase, User, Building2, Check, ArrowRight, ArrowLeft, Sparkles, X } from 'lucide-react';

type UsageIntent = 'work' | 'personal' | 'agency';

interface UsageOption {
  id: UsageIntent;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const USAGE_OPTIONS: UsageOption[] = [
  {
    id: 'work',
    title: 'For work',
    description: 'Track projects, company goals, meeting notes',
    icon: <Briefcase size={22} className="text-gray-700" />,
  },
  {
    id: 'personal',
    title: 'For personal projects',
    description: 'Write better, think more clearly, stay organized',
    icon: <User size={22} className="text-gray-700" />,
  },
  {
    id: 'agency',
    title: 'For agency & client work',
    description: 'Deliver custom client deliverables, sprints, and managed workflows',
    icon: <Building2 size={22} className="text-gray-700" />,
  },
];

export default function WorkspaceSetupModal() {
  const {
    activeModal,
    closeModal,
    workspaceSettings,
    updateWorkspaceSettings,
    user,
    showToast,
    addProject,
    addTask,
    sendInvitation,
  } = useDashboard();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intent, setIntent] = useState<UsageIntent>('work');
  const [improveAi, setImproveAi] = useState(true);

  // Step 2 Fields
  const [userName, setUserName] = useState('');
  const [wsName, setWsName] = useState('');
  const [userRole, setUserRole] = useState('Founder / Team Lead');

  // Step 3 Fields
  const [projectName, setProjectName] = useState('Core Product Roadmap');
  const [initialTask, setInitialTask] = useState('Kickoff & Sprint Planning');
  const [inviteEmails, setInviteEmails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeModal === 'workspace-setup-modal') {
      const defaultUser = user.name || 'Mukul';
      setUserName(defaultUser);
      setWsName(workspaceSettings.name || (user.name ? `${user.name.split(' ')[0]}'s Workspace` : 'My Workspace'));
    }
  }, [activeModal, workspaceSettings, user.name]);

  if (activeModal !== 'workspace-setup-modal') return null;

  const handleFinish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const cleanWsName = wsName.trim() || `${userName || 'My'}'s Workspace`;
    const cleanProjectName = projectName.trim() || 'Core Roadmap';
    const cleanInitialTask = initialTask.trim();

    // 1. Update workspace settings
    updateWorkspaceSettings({
      name: cleanWsName,
      tagline: intent === 'work' ? 'Empowering modern teams to build unified projects' : (intent === 'agency' ? 'Bespoke client deliverables and agile operations' : 'Personal focus and task execution'),
      accentColor: '#FF5500',
      density: 'comfortable',
    });

    // 2. Create the first project if provided
    if (cleanProjectName) {
      const newProjId = 'proj_' + Date.now();
      addProject({
        id: newProjId,
        name: cleanProjectName,
        desc: `Primary operational project for ${cleanWsName}`,
        color: '#FF5500',
        icon: 'folder',
        status: 'In Progress',
        progress: 0,
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        team: [user.id || 'usr_current'],
        tasks: cleanInitialTask ? 1 : 0,
        completed: 0,
      });

      if (cleanInitialTask) {
        addTask({
          name: cleanInitialTask,
          project: newProjId,
          priority: 'high',
          status: 'todo',
          assignee: user.id || '',
          deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        });
      }
    }

    // 3. Dispatch teammate invites if provided (up to 4 members total)
    if (inviteEmails.trim() && sendInvitation) {
      const rawList = inviteEmails
        .split(/[\n,]/)
        .map((em) => em.trim().toLowerCase())
        .filter((em) => em.includes('@'));

      const capped = rawList.slice(0, 3); // Max 3 additional invites for 4-user limit
      for (const email of capped) {
        try {
          await sendInvitation({
            email,
            workspaceRole: 'member',
            team: null,
          });
        } catch {}
      }
    }

    // 4. Mark onboarding as completed
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cursis_custom_workspace_name', cleanWsName);
        localStorage.setItem('cursis_workspace_setup_completed', 'true');
        localStorage.removeItem('cursis_show_workspace_setup');
        sessionStorage.removeItem('cursis_show_workspace_setup');

        const url = new URL(window.location.href);
        url.searchParams.delete('setup');
        url.searchParams.delete('onboarding');
        window.history.replaceState({}, '', url.pathname);
      } catch {}
    }

    showToast(`Welcome to CURSIS! ${cleanWsName} is ready.`);
    setIsSubmitting(false);
    closeModal();
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cursis_workspace_setup_completed', 'true');
        localStorage.removeItem('cursis_show_workspace_setup');
        sessionStorage.removeItem('cursis_show_workspace_setup');
        const url = new URL(window.location.href);
        url.searchParams.delete('setup');
        url.searchParams.delete('onboarding');
        window.history.replaceState({}, '', url.pathname);
      } catch {}
    }
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSkip();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-step-title"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflowY: 'auto',
          position: 'relative',
          padding: '36px 36px 32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bar (Notion Style) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: '60px',
                height: '4px',
                borderRadius: '999px',
                background: s <= step ? '#FF5500' : '#E5E7EB',
                transition: 'background-color 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* STEP 1: How do you want to use CURSIS? */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1
                id="onboarding-step-title"
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#111827',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                How do you want to use CURSIS?
              </h1>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                This helps customize your workspace experience
              </p>
            </div>

            {/* Selectable Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {USAGE_OPTIONS.map((opt) => {
                const isSelected = intent === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setIntent(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? '#FF5500' : '#E5E7EB'}`,
                      background: isSelected ? 'rgba(255, 85, 0, 0.04)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 1px #FF5500' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isSelected ? '#FFF3EB' : '#F9FAFB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {opt.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        {opt.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ color: '#FF5500', display: 'flex', alignItems: 'center' }}>
                        <Check size={18} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Improve AI Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '28px',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={improveAi}
                onChange={(e) => setImproveAi(e.target.checked)}
                style={{
                  marginTop: '3px',
                  width: '16px',
                  height: '16px',
                  accentColor: '#FF5500',
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: 1.45 }}>
                <strong style={{ color: '#111827' }}>Improve AI for your workspace</strong>
                <p style={{ margin: '2px 0 0 0', color: '#6B7280' }}>
                  Enable Ordis Copilot to learn your team's project rhythms and flag task risks before deadlines.
                </p>
              </div>
            </label>

            {/* Actions */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14.5px',
                fontWeight: 700,
                borderRadius: '8px',
                background: '#FF5500',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Set up profile & workspace */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#111827',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                Set up your workspace &amp; profile
              </h1>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Personalize your workspace identity
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Mukul Kumar"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Workspace Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Acme Corp or Apex Dynamics"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Your Role
                </label>
                <select
                  className="input"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Founder / Team Lead">Founder / Team Lead</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Designer">Designer</option>
                  <option value="Operations & Strategy">Operations &amp; Strategy</option>
                  <option value="Client Partner">Client Partner</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(3)}
                style={{ flex: 2, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: First Project & Team Invites */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#111827',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                Create your first project
              </h1>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Every workspace contains projects with dedicated team members
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  First Project Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Q4 Product Launch or Core Roadmap"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Initial Task
                </label>
                <input
                  type="text"
                  className="input"
                  value={initialTask}
                  onChange={(e) => setInitialTask(e.target.value)}
                  placeholder="e.g. Finalize specs & deliverable deadlines"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                    Invite Teammates (Optional)
                  </label>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>Up to 4 members free</span>
                </div>
                <input
                  type="text"
                  className="input"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="teammate@company.com, colleague@work.com"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                  Separate multiple emails with commas. You can also invite teammates later.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                style={{ flex: 1, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleFinish()}
                disabled={isSubmitting}
                style={{ flex: 2, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isSubmitting ? 'Configuring…' : 'Launch Workspace'} <ArrowRight size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={handleSkip}
                style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '12.5px', cursor: 'pointer', fontWeight: 600 }}
              >
                Skip setup for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
