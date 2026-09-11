'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { isFounderEmail } from '@/lib/auth/founder';

export default function MemberModal() {
 const {
 activeModal,
 closeModal,
 addEmployee,
 sendInvitation,
 departments,
 teams,
 employees,
 showToast,
 } = useDashboard();

 const [activeTab, setActiveTab] = useState<'direct' | 'invite'>('direct');

 // Direct Add Form State
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [role, setRole] = useState('');
 const [department, setDepartment] = useState('Engineering');
 const [departmentId, setDepartmentId] = useState('dept_engineering');
 const [selectedTeamId, setSelectedTeamId] = useState('');
 const [workspaceRole, setWorkspaceRole] = useState('member');
 const [presence, setPresence] = useState<'online' | 'busy' | 'offline'>('online');
 const [selectedColor, setSelectedColor] = useState('#0f4cff');
 const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
 const [skillInput, setSkillInput] = useState('');

 // Invite Form State
 const [inviteEmail, setInviteEmail] = useState('');
 const [inviteName, setInviteName] = useState('');
 const [inviteRoleTitle, setInviteRoleTitle] = useState('');
 const [inviteWorkspaceRole, setInviteWorkspaceRole] = useState('member');
 const [inviteDept, setInviteDept] = useState('dept_engineering');
 const [inviteTeam, setInviteTeam] = useState('');
 const [inviteNote, setInviteNote] = useState('Welcome to the workspace! Click to join our team on Cursis.');

 const [errorMsg, setErrorMsg] = useState('');
 const [copiedLink, setCopiedLink] = useState(false);

 // Sync tab with modal type if opened via invite-modal vs member-modal
 useEffect(() => {
 if (activeModal === 'invite-modal') {
 setActiveTab('invite');
 } else if (activeModal === 'member-modal') {
 setActiveTab('direct');
 }
 setErrorMsg('');
 }, [activeModal]);

 if (activeModal !== 'member-modal' && activeModal !== 'invite-modal') return null;

 const colorPalette = [
 '#0f4cff', // Brand Blue
 '#ccff00', // Lime
 '#8b5cf6', // Violet
 '#10b981', // Emerald
 '#f59e0b', // Amber
 '#ef4444', // Rose/Red
 '#06b6d4', // Cyan
 '#ec4899', // Pink
 ];

 const popularSkills = [
 'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Go',
 'UI/UX', 'Figma', 'Product Strategy', 'DevOps', 'PostgreSQL', 'MongoDB',
 'Sales', 'Marketing', 'Customer Success'
 ];

 const handleDeptChange = (deptNameOrId: string) => {
 const found = departments.find((d) => d.id === deptNameOrId || d.name === deptNameOrId);
 if (found) {
 setDepartment(found.name);
 setDepartmentId(found.id);
 } else {
 setDepartment(deptNameOrId);
 setDepartmentId('dept_' + deptNameOrId.toLowerCase());
 }
 };

 const handleAddSkill = (skillToAdd: string) => {
 const trimmed = skillToAdd.trim();
 if (!trimmed || skills.includes(trimmed)) return;
 setSkills([...skills, trimmed]);
 setSkillInput('');
 };

 const handleRemoveSkill = (skillToRemove: string) => {
 setSkills(skills.filter((s) => s !== skillToRemove));
 };

 const handleDirectSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMsg('');

 if (!name.trim()) {
 setErrorMsg('Full Name is required.');
 return;
 }

 const cleanEmail = email.trim().toLowerCase();
 if (cleanEmail) {
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(cleanEmail)) {
 setErrorMsg('Please enter a valid email address.');
 return;
 }
 const duplicate = employees.find((emp) => emp.email?.toLowerCase() === cleanEmail);
 if (duplicate) {
 setErrorMsg(`A team member with email "${cleanEmail}" already exists (${duplicate.name}).`);
 return;
 }
 }

    const isTargetFounder = isFounderEmail(cleanEmail);
    if (!isTargetFounder) {
      if (/founder|ceo/i.test(role)) {
        setErrorMsg('The Founder & CEO title is exclusively reserved for the platform creator (mukulk3962364@gmail.com).');
        return;
      }
      if (workspaceRole === 'owner') {
        setErrorMsg('Workspace ownership is strictly reserved for the platform creator (mukulk3962364@gmail.com).');
        return;
      }
    }

 addEmployee({
 name: name.trim(),
 email: cleanEmail || undefined,
 role: role.trim() || 'Team Member',
 department,
 departmentId,
 teamIds: selectedTeamId ? [selectedTeamId] : ['team_core'],
 workspaceRole,
 status: presence,
 color: selectedColor,
 skills: skills.length > 0 ? skills : ['General'],
 planTier: 'standard',
 });

 // Reset & close
 setName('');
 setEmail('');
 setRole('');
 setSkills(['React', 'TypeScript']);
 closeModal();
 };

 const handleInviteSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMsg('');

 const cleanEmail = inviteEmail.trim().toLowerCase();
 if (!cleanEmail) {
 setErrorMsg('Work Email Address is required.');
 return;
 }

 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(cleanEmail)) {
 setErrorMsg('Please enter a valid email address.');
 return;
 }

    const isTargetFounder = isFounderEmail(cleanEmail);
    if (!isTargetFounder) {
      if (/founder|ceo/i.test(inviteRoleTitle)) {
        setErrorMsg('The Founder & CEO title is exclusively reserved for the platform creator (mukulk3962364@gmail.com).');
        return;
      }
      if (inviteWorkspaceRole === 'owner') {
        setErrorMsg('Workspace ownership is strictly reserved for the platform creator (mukulk3962364@gmail.com).');
        return;
      }
    }

 sendInvitation({
 email: cleanEmail,
 name: inviteName.trim() || undefined,
 roleTitle: inviteRoleTitle.trim() || undefined,
 workspaceRole: inviteWorkspaceRole,
 department: inviteDept,
 team: inviteTeam || null,
 planTier: 'standard',
 });

 setInviteEmail('');
 setInviteName('');
 setInviteRoleTitle('');
 closeModal();
 };

 const handleCopyInviteLink = () => {
 const sampleToken = 'tok_' + Math.random().toString(36).substring(2, 10);
 const link = `${window.location.origin}/invite/${sampleToken}`;
 if (navigator.clipboard) {
 navigator.clipboard.writeText(link);
 }
 setCopiedLink(true);
 showToast('Invitation link copied to clipboard ');
 setTimeout(() => setCopiedLink(false), 2500);
 };

 // Preview initials
 const initialsPreview = name.trim()
 ? name
 .split(' ')
 .filter(Boolean)
 .map((n) => n[0])
 .join('')
 .toUpperCase()
 .substring(0, 2)
 : 'CU';

 return (
 <div
 className="modal-overlay active"
 id="member-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) closeModal();
 }}
 >
 <div className="modal" style={{ maxWidth: '580px', width: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
 {/* Header */}
 <div className="modal-header" style={{ paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border-color)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div
 style={{
 width: '32px',
 height: '32px',
 borderRadius: '8px',
 background: 'var(--c-brand)',
 color: '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 'bold',
 fontSize: '14px',
 }}
 >
 
 </div>
 <div>
 <span className="modal-title" style={{ fontSize: 'var(--fs-base)' }}>Team Member Provisioning</span>
 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
 Add instant collaborators or dispatch secure email invitation links
 </div>
 </div>
 </div>
 <button className="modal-close" onClick={closeModal}>
 
 </button>
 </div>

 {/* Mode Switcher Tabs */}
 <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--c-surface)' }}>
 <button
 type="button"
 onClick={() => { setActiveTab('direct'); setErrorMsg(''); }}
 style={{
 flex: 1,
 padding: '10px 16px',
 fontSize: '12px',
 fontWeight: activeTab === 'direct' ? 700 : 500,
 background: activeTab === 'direct' ? 'var(--c-white)' : 'transparent',
 color: activeTab === 'direct' ? 'var(--c-brand)' : 'var(--text-secondary)',
 border: 'none',
 borderBottom: activeTab === 'direct' ? '2px solid var(--c-brand)' : '2px solid transparent',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '6px',
 transition: 'all 0.15s ease',
 }}
 >
 Direct Provision (Instant Add)
 </button>
 <button
 type="button"
 onClick={() => { setActiveTab('invite'); setErrorMsg(''); }}
 style={{
 flex: 1,
 padding: '10px 16px',
 fontSize: '12px',
 fontWeight: activeTab === 'invite' ? 700 : 500,
 background: activeTab === 'invite' ? 'var(--c-white)' : 'transparent',
 color: activeTab === 'invite' ? 'var(--c-brand)' : 'var(--text-secondary)',
 border: 'none',
 borderBottom: activeTab === 'invite' ? '2px solid var(--c-brand)' : '2px solid transparent',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '6px',
 transition: 'all 0.15s ease',
 }}
 >
 <span></span> Email Invitation Link
 </button>
 </div>

 {/* Modal Scrollable Body */}
 <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-4)' }}>
 {errorMsg && (
 <div
 style={{
 background: 'rgba(239, 68, 68, 0.1)',
 color: '#ef4444',
 border: '1px solid #ef4444',
 borderRadius: '6px',
 padding: '8px 12px',
 fontSize: '12px',
 fontWeight: 600,
 marginBottom: 'var(--sp-3)',
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 }}
 >
 <span></span>
 <span>{errorMsg}</span>
 </div>
 )}

 {/* ========================================================================= */}
 {/* 1. DIRECT PROVISION TAB */}
 {/* ========================================================================= */}
 {activeTab === 'direct' && (
 <form id="direct-member-form" onSubmit={handleDirectSubmit}>
 {/* Member Live Preview Banner */}
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '12px',
 padding: '10px 14px',
 background: 'var(--c-surface)',
 border: '1px solid var(--border-color)',
 borderRadius: '8px',
 marginBottom: 'var(--sp-4)',
 }}
 >
 <div
 style={{
 width: '40px',
 height: '40px',
 borderRadius: '50%',
 background: selectedColor,
 color: selectedColor === '#ccff00' ? '#000' : '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 700,
 fontSize: '14px',
 boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
 flexShrink: 0,
 }}
 >
 {initialsPreview}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span>{name.trim() || 'New Team Member'}</span>
 <span
 className={`badge badge-${presence === 'online' ? 'success' : presence === 'busy' ? 'error' : 'neutral'}`}
 style={{ fontSize: '9px', padding: '1px 5px' }}
 >
 {presence}
 </span>
 </div>
 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
 {role.trim() || 'Role Title'} • {department} • <span style={{ textTransform: 'capitalize' }}>{workspaceRole}</span>
 </div>
 </div>
 </div>

 {/* Full Name & Email */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Full Name <span style={{ color: '#ef4444' }}>*</span>
 </label>
 <input
 className="input"
 placeholder="e.g. Sarah Connor"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 autoFocus
 />
 </div>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Google / Work Email (Optional)
 </label>
 <input
 className="input"
 type="email"
 placeholder="member@gmail.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block', lineHeight: 1.3 }}>
 Tip: Enter their real Google email so they can log in, see this workspace on their dashboard, and receive notifications.
 </span>
 </div>
 </div>

 {/* Role Title & Permission Level */}
 <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Role Title
 </label>
 <input
 className="input"
 placeholder="e.g. Senior Frontend Engineer"
 value={role}
 onChange={(e) => setRole(e.target.value)}
 />
 </div>

 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Permission Role
 </label>
 <select
 className="input select"
 value={workspaceRole}
 onChange={(e) => setWorkspaceRole(e.target.value)}
 >
 <option value="member">Member (Standard)</option>
 <option value="manager">Manager (Team Lead)</option>
 <option value="admin">Admin (Full Access)</option>
 <option value="viewer">Viewer (Read-Only)</option>
 </select>
 </div>
 </div>

 {/* Department & Assigned Team */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Department
 </label>
 <select
 className="input select"
 value={department}
 onChange={(e) => handleDeptChange(e.target.value)}
 >
 {departments.map((d) => (
 <option key={d.id} value={d.name}>
 {d.name}
 </option>
 ))}
 <option value="Executive">Executive</option>
 <option value="Operations">Operations</option>
 </select>
 </div>

 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Assigned Team
 </label>
 <select
 className="input select"
 value={selectedTeamId}
 onChange={(e) => setSelectedTeamId(e.target.value)}
 >
 <option value="">Core Department Team</option>
 {teams.map((t) => (
 <option key={t.id} value={t.id}>
 {t.name}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Presence & Avatar Color */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Initial Presence Status
 </label>
 <select
 className="input select"
 value={presence}
 onChange={(e) => setPresence(e.target.value as any)}
 >
 <option value="online"> Online / Active</option>
 <option value="busy"> Busy (In Focus)</option>
 <option value="offline"> Offline</option>
 </select>
 </div>

 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Avatar Accent Color
 </label>
 <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
 {colorPalette.map((col) => (
 <button
 key={col}
 type="button"
 onClick={() => setSelectedColor(col)}
 style={{
 width: '20px',
 height: '20px',
 borderRadius: '50%',
 background: col,
 border: selectedColor === col ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
 outline: selectedColor === col ? `2px solid ${col}` : 'none',
 cursor: 'pointer',
 padding: 0,
 transition: 'transform 0.15s ease',
 }}
 />
 ))}
 </div>
 </div>
 </div>

 {/* Skills Selector */}
 <div className="input-group" style={{ marginBottom: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
 <span>Expertise & Skills Tags ({skills.length})</span>
 <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Press Enter to add</span>
 </label>
 
 {/* Active Skill Chips */}
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
 {skills.map((s) => (
 <span
 key={s}
 style={{
 fontSize: '11px',
 padding: '2px 8px',
 borderRadius: '4px',
 background: 'rgba(15, 76, 255, 0.12)',
 color: 'var(--c-brand)',
 border: '1px solid rgba(15, 76, 255, 0.25)',
 display: 'flex',
 alignItems: 'center',
 gap: '5px',
 fontWeight: 500,
 }}
 >
 {s}
 <button
 type="button"
 onClick={() => handleRemoveSkill(s)}
 style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '10px' }}
 >
 
 </button>
 </span>
 ))}
 </div>

 {/* Skill Input & Quick Suggestions */}
 <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
 <input
 className="input"
 style={{ fontSize: '12px', padding: '6px 10px' }}
 placeholder="Type a skill (e.g. Next.js, Figma, Python)..."
 value={skillInput}
 onChange={(e) => setSkillInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleAddSkill(skillInput);
 }
 }}
 />
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => handleAddSkill(skillInput)}
 disabled={!skillInput.trim()}
 >
 Add
 </button>
 </div>

 {/* Popular Skill Suggestions */}
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
 {popularSkills
 .filter((ps) => !skills.includes(ps))
 .slice(0, 6)
 .map((ps) => (
 <button
 key={ps}
 type="button"
 onClick={() => handleAddSkill(ps)}
 style={{
 fontSize: '10px',
 padding: '2px 6px',
 borderRadius: '4px',
 background: 'var(--c-surface)',
 color: 'var(--text-tertiary)',
 border: '1px solid var(--border-color)',
 cursor: 'pointer',
 }}
 >
 + {ps}
 </button>
 ))}
 </div>
 </div>
 </form>
 )}

 {/* ========================================================================= */}
 {/* 2. SEND INVITATION LINK TAB */}
 {/* ========================================================================= */}
 {activeTab === 'invite' && (
 <form id="invite-member-form" onSubmit={handleInviteSubmit}>
 {/* Work Email Address */}
 <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Work Email Address <span style={{ color: '#ef4444' }}>*</span>
 </label>
 <input
 className="input"
 type="email"
 placeholder="colleague@company.com"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 required
 autoFocus
 />
 </div>

 {/* Full Name & Role Title */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Recipient Name (Optional)
 </label>
 <input
 className="input"
 placeholder="e.g. John Doe"
 value={inviteName}
 onChange={(e) => setInviteName(e.target.value)}
 />
 </div>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Role Title (Optional)
 </label>
 <input
 className="input"
 placeholder="e.g. AI Engineer"
 value={inviteRoleTitle}
 onChange={(e) => setInviteRoleTitle(e.target.value)}
 />
 </div>
 </div>

 {/* Permission & Department */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Permission Level
 </label>
 <select
 className="input select"
 value={inviteWorkspaceRole}
 onChange={(e) => setInviteWorkspaceRole(e.target.value)}
 >
 <option value="member">Member (Standard Access)</option>
 <option value="manager">Manager (Team Lead)</option>
 <option value="admin">Admin (Workspace Admin)</option>
 <option value="viewer">Viewer (Read-Only)</option>
 </select>
 </div>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Department
 </label>
 <select
 className="input select"
 value={inviteDept}
 onChange={(e) => setInviteDept(e.target.value)}
 >
 {departments.map((d) => (
 <option key={d.id} value={d.name}>
 {d.name}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Assigned Team */}
 <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Assigned Team (Optional)
 </label>
 <select
 className="input select"
 value={inviteTeam}
 onChange={(e) => setInviteTeam(e.target.value)}
 >
 <option value="">All department members / General</option>
 {teams.map((t) => (
 <option key={t.id} value={t.id}>
 {t.name}
 </option>
 ))}
 </select>
 </div>

 {/* Custom Invitation Note */}
 <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
 <label className="input-label" style={{ fontSize: '11px', fontWeight: 600 }}>
 Personal Invitation Note
 </label>
 <textarea
 className="input"
 rows={2}
 style={{ resize: 'none', fontSize: '12px' }}
 value={inviteNote}
 onChange={(e) => setInviteNote(e.target.value)}
 />
 </div>

 {/* Security & Link Generation */}
 <div
 style={{
 background: 'var(--c-surface)',
 border: '1px solid var(--border-color)',
 borderRadius: '6px',
 padding: '10px 12px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: '12px',
 fontSize: '11px',
 color: 'var(--text-secondary)',
 }}
 >
 <div>
 <strong style={{ color: 'var(--text-primary)' }}>Expiring Link Security:</strong> A 7-day single-use token will be generated.
 </div>
 <button
 type="button"
 onClick={handleCopyInviteLink}
 style={{
 padding: '4px 10px',
 fontSize: '11px',
 fontWeight: 600,
 borderRadius: '4px',
 background: copiedLink ? '#10b981' : 'var(--c-brand)',
 color: '#ffffff',
 border: 'none',
 cursor: 'pointer',
 whiteSpace: 'nowrap',
 transition: 'all 0.15s ease',
 }}
 >
 {copiedLink ? 'Copied ' : 'Copy Link'}
 </button>
 </div>
 </form>
 )}
 </div>

 {/* Modal Footer */}
 <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: 'var(--sp-3) var(--sp-4)' }}>
 <button type="button" className="btn btn-secondary" onClick={closeModal}>
 Cancel
 </button>
 {activeTab === 'direct' ? (
 <button type="submit" form="direct-member-form" className="btn btn-primary">
 + Add Member Instantly
 </button>
 ) : (
 <button type="submit" form="invite-member-form" className="btn btn-primary">
 Send Workspace Invitation
 </button>
 )}
 </div>
 </div>
 </div>
 );
}
