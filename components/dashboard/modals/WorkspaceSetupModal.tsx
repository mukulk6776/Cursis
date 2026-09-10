'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

const ACCENT_COLORS = [
  { color: '#0f4cff', label: 'Somba Blue' },
  { color: '#10b981', label: 'Emerald' },
  { color: '#8b5cf6', label: 'Royal Purple' },
  { color: '#f59e0b', label: 'Sunset Amber' },
  { color: '#334155', label: 'Midnight Slate' },
  { color: '#f43f5e', label: 'Crimson Rose' },
  { color: '#ff5500', label: 'Cursis Orange' },
];

const INDUSTRIES = [
  'Software & Technology',
  'Artificial Intelligence & Data',
  'Design & Creative Agency',
  'Fintech & Financial Services',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'Media & Publishing',
  'Education & EdTech',
  'Management Consulting',
  'Other / Custom',
];

const DENSITY_OPTIONS: { id: 'comfortable' | 'compact' | 'spacious'; label: string; desc: string }[] = [
  { id: 'comfortable', label: 'Balanced', desc: 'Optimal spacing (Recommended)' },
  { id: 'compact', label: 'Compact', desc: 'High density for data teams' },
  { id: 'spacious', label: 'Spacious', desc: 'Relaxed modern breathing room' },
];

export default function WorkspaceSetupModal() {
  const {
    activeModal,
    closeModal,
    workspaceSettings,
    updateWorkspaceSettings,
    user,
    showToast,
  } = useDashboard();

  const [wsName, setWsName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState('Software & Technology');
  const [accentColor, setAccentColor] = useState('#0f4cff');
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
  const [language, setLanguage] = useState('English');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or prefill fields with existing workspace settings or user default
  useEffect(() => {
    if (activeModal === 'workspace-setup-modal') {
      const currentName = workspaceSettings.name || (user.name ? `${user.name}'s Workspace` : 'Acme Workspace');
      setWsName(currentName);
      setTagline(workspaceSettings.tagline || 'Empowering modern teams to operate with unified intelligence');
      setIndustry(workspaceSettings.industry || 'Software & Technology');
      setAccentColor(workspaceSettings.accentColor || '#0f4cff');
      setDensity(workspaceSettings.density || 'comfortable');
      setLanguage(workspaceSettings.language || 'English');
    }
  }, [activeModal, workspaceSettings, user.name]);

  if (activeModal !== 'workspace-setup-modal') return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const cleanName = wsName.trim() || `${user.name || 'My'}'s Workspace`;
    const cleanTagline = tagline.trim();
    const cleanIndustry = industry.trim() || 'Software & Technology';

    // Persist to dashboard context
    updateWorkspaceSettings({
      name: cleanName,
      tagline: cleanTagline,
      industry: cleanIndustry,
      accentColor,
      density,
      language,
    });

    // Save custom workspace name and mark onboarding completed
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cursis_custom_workspace_name', cleanName);
        localStorage.setItem('cursis_workspace_setup_completed', 'true');
        localStorage.removeItem('cursis_show_workspace_setup');
        sessionStorage.removeItem('cursis_show_workspace_setup');

        // Clean up URL query parameters without full reload
        const url = new URL(window.location.href);
        url.searchParams.delete('setup');
        url.searchParams.delete('onboarding');
        window.history.replaceState({}, '', url.pathname);
      } catch {}
    }

    showToast(`🎉 Workspace configured: ${cleanName}`);
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 15, 29, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          background: 'var(--c-white, #ffffff)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflowY: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '28px 32px 24px',
            background: 'linear-gradient(135deg, rgba(15, 76, 255, 0.07) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(255, 85, 0, 0.04) 100%)',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: `0 4px 10px ${accentColor}40`,
                  transition: 'background-color 0.2s ease',
                }}
              >
                ⚡
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  background: `${accentColor}15`,
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                Workspace Onboarding &amp; Setup
              </span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'var(--text-tertiary, #94a3b8)',
              }}
              title="Skip for now"
            >
              ✕
            </button>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary, #0f172a)',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Configure Your Workspace
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #64748b)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Welcome to Cursis! Set your workspace identity, mission, and primary preferences to personalize your team environment.
          </p>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Workspace Identity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #475569)' }}>
                1. Workspace Identity
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Workspace Name */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏢</span>
                  <span>Workspace Name</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Acme Corp or Apex Dynamics"
                  required
                  style={{
                    height: '42px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    borderColor: 'var(--border-color, #cbd5e1)',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary, #94a3b8)', marginTop: '4px' }}>
                  The organization name displayed in topbars, exports, invoices, and invitation emails.
                </span>
              </div>

              {/* Tagline / Mission */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯</span>
                  <span>Mission / Tagline</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Accelerating global engineering with autonomous AI workflows"
                  style={{
                    height: '42px',
                    fontSize: '13px',
                    borderRadius: '10px',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary, #94a3b8)', marginTop: '4px' }}>
                  The core purpose that aligns your team members and shapes autonomous Ordis suggestions.
                </span>
              </div>

              {/* Industry */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌐</span>
                  <span>Industry</span>
                </label>
                <select
                  className="input select"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={{
                    height: '42px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    marginBottom: '8px',
                  }}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>

                {/* Popular industry quick-select pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Software', 'AI & Data', 'Creative Agency', 'Fintech', 'Healthcare', 'E-Commerce'].map((tag) => {
                    const fullInd = INDUSTRIES.find((i) => i.toLowerCase().includes(tag.toLowerCase())) || tag;
                    const isSelected = industry === fullInd;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setIndustry(fullInd)}
                        style={{
                          background: isSelected ? `${accentColor}18` : 'var(--bg-secondary, #f1f5f9)',
                          color: isSelected ? accentColor : 'var(--text-secondary, #475569)',
                          border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Primary Settings */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #475569)' }}>
                2. Primary Settings
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Brand Accent Color */}
              <div>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span>🎨</span>
                  <span>Primary Brand Accent Color</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {ACCENT_COLORS.map(({ color, label }) => {
                    const isSelected = accentColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAccentColor(color)}
                        title={label}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                          outline: isSelected ? `2.5px solid ${color}` : 'none',
                          boxShadow: isSelected ? `0 4px 12px ${color}66` : '0 2px 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '14px',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                        }}
                      >
                        {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interface Density */}
              <div>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span>📐</span>
                  <span>Interface Density</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {DENSITY_OPTIONS.map((opt) => {
                    const isSelected = density === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setDensity(opt.id)}
                        style={{
                          border: isSelected ? `2px solid ${accentColor}` : '1px solid var(--border-color, #e2e8f0)',
                          background: isSelected ? `${accentColor}08` : 'var(--bg-secondary, #f8fafc)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? accentColor : 'var(--text-primary, #0f172a)' }}>
                            {opt.label}
                          </span>
                          {isSelected && <span style={{ color: accentColor, fontWeight: 800, fontSize: '12px' }}>●</span>}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary, #94a3b8)', lineHeight: 1.3 }}>
                          {opt.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Language */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🗣️</span>
                  <span>Primary Language</span>
                </label>
                <select
                  className="input select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    height: '40px',
                    fontSize: '13px',
                    borderRadius: '10px',
                  }}
                >
                  <option value="English">English (United States &amp; International)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 20px -5px rgba(15, 23, 42, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: accentColor,
                opacity: 0.25,
                filter: 'blur(30px)',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Live Workspace Preview
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: `${accentColor}33`,
                  color: '#ffffff',
                  border: `1px solid ${accentColor}`,
                }}
              >
                {industry}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                  color: '#ffffff',
                  boxShadow: `0 4px 10px ${accentColor}40`,
                }}
              >
                {wsName ? wsName.slice(0, 2).toUpperCase() : 'CU'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  {wsName || 'Your Workspace Name'}
                </h4>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, fontStyle: 'italic' }}>
              "{tagline || 'Building the future of collaborative operations.'}"
            </p>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <button
              type="button"
              onClick={handleSkip}
              className="btn btn-ghost"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}
            >
              Skip for Now
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                background: accentColor,
                borderColor: accentColor,
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '12px',
                boxShadow: `0 6px 16px ${accentColor}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Save &amp; Launch Workspace</span>
              <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
