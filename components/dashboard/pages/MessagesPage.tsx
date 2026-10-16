'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { MsgChannel, DirectMessage, TeamMessage } from '@/lib/dashboard/types';
import LinkPreviewCard from '@/components/dashboard/LinkPreviewCard';
import { detectFirstUrl, isUrlSafeForPreview } from '@/lib/link-preview/url-detector';

export default function MessagesPage() {
 const {
 user,
 employees,
 projects,
 addTask,
 showToast,
 addAuditEntry,
 } = useDashboard();

 // Channels and DMs initial state
 const [channels] = useState<MsgChannel[]>([
 { id: 'c_general', name: 'general', desc: 'Company-wide updates & general team discussions', unread: 0, linkedProject: null },
 { id: 'c_engineering', name: 'engineering', desc: 'Architecture, sprints, and code reviews', unread: 2, linkedProject: 'p1' },
 { id: 'c_product', name: 'product-design', desc: 'UI/UX specs, user feedback, and roadmaps', unread: 0, linkedProject: null },
 { id: 'c_announcements', name: 'announcements', desc: 'Major company milestones & executive briefs', unread: 0, linkedProject: null },
 ]);

 const [dms] = useState<DirectMessage[]>(
 employees
 .filter((e) => e.id !== user.id)
 .map((e) => ({
 id: `dm_${e.id}`,
 name: e.name,
 user: e.id,
 status: e.status,
 unread: 0,
 }))
 );

 const [activeChannelId, setActiveChannelId] = useState<string>('c_general');
 const [threadOpenMessageId, setThreadOpenMessageId] = useState<string | null>(null);
 const [composeText, setComposeText] = useState<string>('');
 const [threadReplyText, setThreadReplyText] = useState<string>('');
 const [searchQuery, setSearchQuery] = useState<string>('');
 const [isSearching, setIsSearching] = useState<boolean>(false);

 // Messages dictionary
 const [channelMessages, setChannelMessages] = useState<Record<string, TeamMessage[]>>({
 c_general: [
 {
 id: 'msg_1',
 user: user.id || 'u1',
 text: 'Welcome to the Cursis workspace communication hub! All team discussions, sprint planning, and actionable initiatives can be coordinated directly from here.',
 time: 'Just now',
 threads: [],
 attachments: [],
 },
 ],
 c_engineering: [],
 c_product: [],
 c_announcements: [
 {
 id: 'msg_ann_1',
 user: user.id || 'u1',
 text: ' Cursis Workplace is active. Multi-workspace collaboration, AI actions, and live integrations are ready.',
 time: 'Just now',
 threads: [],
 },
 ],
 });

 const activeChannel =
 channels.find((c) => c.id === activeChannelId) ||
 dms.find((d) => d.id === activeChannelId);

 const activeProject = activeChannel && 'linkedProject' in activeChannel && activeChannel.linkedProject
 ? projects.find((p) => p.id === activeChannel.linkedProject)
 : null;

 const currentMessages = channelMessages[activeChannelId] || [];

 const filteredMessages = searchQuery.trim()
 ? currentMessages.filter((m) =>
 m.text.toLowerCase().includes(searchQuery.toLowerCase())
 )
 : currentMessages;

 const getSender = (userId: string) => {
 if (userId === user.id || userId === 'u1') {
 return {
 name: user.name,
 initials: user.initials,
 color: user.color || '#0f4cff',
 role: user.role,
 };
 }
 const emp = employees.find((e) => e.id === userId);
 if (emp) {
 return {
 name: emp.name,
 initials: emp.initials,
 color: emp.color,
 role: emp.role,
 };
 }
 return {
 name: 'Team Member',
 initials: 'TM',
 color: '#64748b',
 role: 'Member',
 };
 };

 const fetchLinkPreview = async (url: string, messageId: string) => {
 try {
 const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
 const data = await response.json();

 if (response.ok && data.success) {
 // Update the message with the preview data
 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: (prev[activeChannelId] || []).map((m) =>
 m.id === messageId
 ? { ...m, linkPreview: data.data, linkPreviewLoading: false }
 : m
 ),
 }));
 } else {
 // Remove loading state on error
 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: (prev[activeChannelId] || []).map((m) =>
 m.id === messageId
 ? { ...m, linkPreview: null, linkPreviewLoading: false }
 : m
 ),
 }));
 }
 } catch (error) {
 console.error('Failed to fetch link preview:', error);
 // Remove loading state on error
 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: (prev[activeChannelId] || []).map((m) =>
 m.id === messageId
 ? { ...m, linkPreview: null, linkPreviewLoading: false }
 : m
 ),
 }));
 }
 };

 const handleSendMessage = () => {
 if (!composeText.trim()) return;

 const messageText = composeText.trim();
 const detectedUrl = detectFirstUrl(messageText);

 const newMsg: TeamMessage = {
 id: 'msg_' + Date.now(),
 user: user.id || 'u1',
 text: messageText,
 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 threads: [],
 attachments: [],
 linkPreview: null,
 linkPreviewLoading: detectedUrl && isUrlSafeForPreview(detectedUrl) ? true : false,
 };

 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
 }));

 setComposeText('');
 showToast('Message sent');

 // Fetch link preview if URL detected
 if (detectedUrl && isUrlSafeForPreview(detectedUrl)) {
 fetchLinkPreview(detectedUrl, newMsg.id);
 }
 };

 const handleSendThreadReply = (parentMsgId: string) => {
 if (!threadReplyText.trim()) return;

 const reply = {
 id: 'th_' + Date.now(),
 user: user.id || 'u1',
 text: threadReplyText.trim(),
 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 };

 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: (prev[activeChannelId] || []).map((m) =>
 m.id === parentMsgId
 ? { ...m, threads: [...(m.threads || []), reply] }
 : m
 ),
 }));

 setThreadReplyText('');
 showToast('Reply added to thread');
 };

 const handleCreateTaskFromMessage = (msg: TeamMessage) => {
 const taskName = msg.proposedTask?.name || msg.text.substring(0, 60);
 const deadline = msg.proposedTask?.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

 addTask({
 name: taskName,
 priority: 'high',
 status: 'todo',
 deadline,
 description: `Created from message by ${getSender(msg.user).name}: "${msg.text}"`,
 tags: ['from-chat'],
 });

 // Mark task as created
 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: (prev[activeChannelId] || []).map((m) =>
 m.id === msg.id ? { ...m, isTaskCandidate: false } : m
 ),
 }));

 addAuditEntry?.('task.created_from_chat', taskName, `Created from message in #${activeChannel?.name}`);
 showToast(`Task "${taskName}" created successfully`);
 };

 const handleSimulateVoiceNote = () => {
 const newMsg: TeamMessage = {
 id: 'msg_' + Date.now(),
 user: user.id || 'u1',
 text: ' [Voice Note — 0:14] "Let\'s align on the project deliverables during today\'s sprint sync. I have posted the updated action items."',
 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 threads: [],
 attachments: [],
 isVoiceNote: true,
 };

 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
 }));

 showToast('Voice note recorded and transcribed');
 };

 const parentThreadMsg = threadOpenMessageId
 ? currentMessages.find((m) => m.id === threadOpenMessageId)
 : null;

 return (
 <div className="page active" id="page-messages" style={{ padding: 0, height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
 <div
 style={{
 display: 'flex',
 flex: 1,
 border: 'var(--border-width) solid var(--border-color)',
 background: 'var(--surface-card)',
 overflow: 'hidden',
 }}
 >
 {/* Channel & DM Sidebar */}
 <div
 style={{
 width: '260px',
 flexShrink: 0,
 borderRight: 'var(--border-width) solid var(--border-color)',
 display: 'flex',
 flexDirection: 'column',
 background: 'var(--c-surface)',
 }}
 >
 {/* Header */}
 <div
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 borderBottom: '1px solid var(--c-gray-200)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 }}
 >
 <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
 CHANNELS & DMS
 </span>
 <button
 className="btn btn-ghost btn-xs"
 title="New Channel"
 onClick={() => showToast('Channel creation dialog ready')}
 style={{ fontSize: '13px', padding: '2px 6px' }}
 >
 +
 </button>
 </div>

 <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-2) 0' }}>
 {/* Channels Group */}
 <div style={{ padding: '0 var(--sp-2) var(--sp-3)' }}>
 <div
 style={{
 fontSize: '10px',
 fontWeight: 800,
 color: 'var(--text-tertiary)',
 padding: '4px 8px',
 textTransform: 'uppercase',
 }}
 >
 Public Channels
 </div>
 {channels.map((c) => {
 const isActive = activeChannelId === c.id;
 return (
 <div
 key={c.id}
 onClick={() => {
 setActiveChannelId(c.id);
 setThreadOpenMessageId(null);
 }}
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: '7px 10px',
 borderRadius: 'var(--border-radius-sm)',
 cursor: 'pointer',
 background: isActive ? 'var(--surface-hover)' : 'transparent',
 color: isActive ? 'var(--c-brand)' : 'var(--text-primary)',
 borderLeft: isActive ? '3px solid var(--c-brand)' : '3px solid transparent',
 fontWeight: isActive ? 700 : 500,
 fontSize: '13px',
 marginBottom: '2px',
 transition: 'background 0.15s ease',
 }}
 >
 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 # {c.name}
 </span>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 {c.linkedProject && (
 <span
 style={{
 width: '7px',
 height: '7px',
 borderRadius: '50%',
 background: '#3b82f6',
 }}
 title="Linked to Active Project"
 />
 )}
 {c.unread > 0 && (
 <span
 style={{
 background: '#ff5710',
 color: '#fff',
 fontSize: '9px',
 fontWeight: 800,
 padding: '1px 5px',
 borderRadius: '10px',
 }}
 >
 {c.unread}
 </span>
 )}
 </div>
 </div>
 );
 })}
 </div>

 {/* Direct Messages Group */}
 <div style={{ padding: '0 var(--sp-2)' }}>
 <div
 style={{
 fontSize: '10px',
 fontWeight: 800,
 color: 'var(--text-tertiary)',
 padding: '4px 8px',
 textTransform: 'uppercase',
 }}
 >
 Direct Messages
 </div>
 {dms.map((dm) => {
 const isActive = activeChannelId === dm.id;
 return (
 <div
 key={dm.id}
 onClick={() => {
 setActiveChannelId(dm.id);
 setThreadOpenMessageId(null);
 }}
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: '7px 10px',
 borderRadius: 'var(--border-radius-sm)',
 cursor: 'pointer',
 background: isActive ? 'var(--surface-hover)' : 'transparent',
 color: isActive ? 'var(--c-brand)' : 'var(--text-primary)',
 borderLeft: isActive ? '3px solid var(--c-brand)' : '3px solid transparent',
 fontWeight: isActive ? 700 : 500,
 fontSize: '13px',
 marginBottom: '2px',
 transition: 'background 0.15s ease',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
 <span
 style={{
 width: '8px',
 height: '8px',
 borderRadius: '50%',
 background:
 dm.status === 'online'
 ? '#22c55e'
 : dm.status === 'busy'
 ? '#f59e0b'
 : '#94a3b8',
 flexShrink: 0,
 }}
 />
 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {dm.name}
 </span>
 </div>
 {dm.unread > 0 && (
 <span
 style={{
 background: '#ff5710',
 color: '#fff',
 fontSize: '9px',
 fontWeight: 800,
 padding: '1px 5px',
 borderRadius: '10px',
 }}
 >
 {dm.unread}
 </span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Message Area */}
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--surface-card)' }}>
 {/* Header */}
 <div
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 borderBottom: 'var(--border-width) solid var(--border-color)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 background: 'var(--surface-card)',
 }}
 >
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontWeight: 800, fontSize: '15px' }}>
 {activeChannel?.name.startsWith('#') ? activeChannel.name : `# ${activeChannel?.name || 'Channel'}`}
 </span>
 {activeProject && (
 <span
 className="badge badge-brand"
 style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}
 >
 Project: {activeProject.name}
 </span>
 )}
 </div>
 <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 {'desc' in (activeChannel || {}) ? (activeChannel as any).desc : 'Direct conversation'}
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 {isSearching ? (
 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
 <input
 type="text"
 className="input"
 placeholder="Search in channel..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 style={{ height: '30px', fontSize: '12px', width: '180px' }}
 autoFocus
 />
 <button
 className="btn btn-ghost btn-xs"
 onClick={() => {
 setSearchQuery('');
 setIsSearching(false);
 }}
 >
 
 </button>
 </div>
 ) : (
 <button
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '12px', height: '30px' }}
 onClick={() => setIsSearching(true)}
 >
 Search
 </button>
 )}
 </div>
 </div>

 {/* Messages Feed */}
 <div
 style={{
 flex: 1,
 overflowY: 'auto',
 padding: 'var(--sp-4)',
 display: 'flex',
 flexDirection: 'column',
 gap: 'var(--sp-3)',
 }}
 >
 {filteredMessages.length === 0 ? (
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 height: '100%',
 color: 'var(--text-tertiary)',
 gap: '8px',
 }}
 >
 <span style={{ fontSize: '24px' }}></span>
 <span style={{ fontSize: '14px', fontWeight: 600 }}>No messages yet</span>
 <span style={{ fontSize: '12px' }}>Start the conversation by typing below</span>
 </div>
 ) : (
 filteredMessages.map((msg) => {
 const sender = getSender(msg.user);
 const hasThreads = msg.threads && msg.threads.length > 0;
 const hasAttachments = msg.attachments && msg.attachments.length > 0;

 return (
 <div
 key={msg.id}
 style={{
 display: 'flex',
 gap: '12px',
 padding: '10px 12px',
 borderRadius: 'var(--border-radius-md)',
 background: 'var(--c-surface)',
 border: '1px solid var(--c-gray-200)',
 position: 'relative',
 }}
 >
 {/* Avatar */}
 <div
 style={{
 width: '34px',
 height: '34px',
 borderRadius: '8px',
 background: sender.color,
 color: '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 800,
 fontSize: '12px',
 flexShrink: 0,
 }}
 >
 {sender.initials}
 </div>

 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontWeight: 800, fontSize: '13px' }}>{sender.name}</span>
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{msg.time}</span>
 </div>

 <div
 style={{
 fontSize: '13px',
 color: 'var(--text-primary)',
 marginTop: '4px',
 lineHeight: 1.45,
 wordBreak: 'break-word',
 }}
 >
 {msg.text}
 </div>

 {/* Link Preview */}
 {msg.linkPreviewLoading && (
 <LinkPreviewCard
 preview={{
 url: '',
 title: '',
 description: '',
 image: null,
 siteName: '',
 favicon: null,
 }}
 loading={true}
 />
 )}
 {msg.linkPreview && !msg.linkPreviewLoading && (
 <LinkPreviewCard preview={msg.linkPreview} />
 )}

 {/* Actionable Task Candidate Banner */}
 {msg.isTaskCandidate && msg.proposedTask && (
 <div
 style={{
 marginTop: '10px',
 padding: '10px 14px',
 background: 'rgba(255, 85, 0, 0.1)',
 borderLeft: '3px solid var(--c-brand)',
 borderRadius: '4px',
 border: '1px solid rgba(255, 85, 0, 0.25)',
 }}
 >
 <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--c-brand)' }}>
 Actionable Task Detected by Ordis
 </div>
 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
 "{msg.proposedTask.name}" · Due {msg.proposedTask.deadline}
 </div>
 <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
 <button
 className="btn btn-primary btn-xs"
 style={{ fontSize: '11px', background: '#f97316', borderColor: '#ea580c' }}
 onClick={() => handleCreateTaskFromMessage(msg)}
 >
 Create Workspace Task
 </button>
 <button
 className="btn btn-ghost btn-xs"
 style={{ fontSize: '11px' }}
 onClick={() => {
 setChannelMessages((prev) => ({
 ...prev,
 [activeChannelId]: (prev[activeChannelId] || []).map((m) =>
 m.id === msg.id ? { ...m, isTaskCandidate: false } : m
 ),
 }));
 }}
 >
 Dismiss
 </button>
 </div>
 </div>
 )}

 {/* Attachments */}
 {hasAttachments && (
 <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
 {msg.attachments!.map((att, i) => (
 <div
 key={i}
 onClick={() => showToast(`Opening attachment: ${att}`)}
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '5px',
 padding: '3px 8px',
 background: 'var(--surface-secondary)',
 border: '1px solid var(--border-color)',
 borderRadius: '4px',
 fontSize: '11px',
 fontWeight: 600,
 color: 'var(--text-primary)',
 cursor: 'pointer',
 }}
 >
 <span></span>
 <span>{att}</span>
 </div>
 ))}
 </div>
 )}

 {/* Thread Replies Button */}
 {hasThreads && (
 <button
 className="btn btn-ghost btn-xs"
 style={{
 fontSize: '11px',
 marginTop: '8px',
 color: '#ff5710',
 fontWeight: 700,
 padding: '2px 6px',
 }}
 onClick={() => setThreadOpenMessageId(msg.id)}
 >
 {msg.threads!.length} {msg.threads!.length === 1 ? 'reply' : 'replies'} — View thread
 </button>
 )}
 </div>

 {/* Quick Hover Actions */}
 <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
 <button
 className="btn btn-ghost btn-xs"
 style={{ fontSize: '11px', padding: '3px 6px' }}
 title="Reply in thread"
 onClick={() => setThreadOpenMessageId(msg.id)}
 >
 
 </button>
 <button
 className="btn btn-ghost btn-xs"
 style={{ fontSize: '11px', padding: '3px 6px' }}
 title="Convert to Task"
 onClick={() => handleCreateTaskFromMessage(msg)}
 >
 
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Compose Bar */}
 <div
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 borderTop: 'var(--border-width) solid var(--border-color)',
 background: 'var(--surface-card)',
 }}
 >
 <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
 <button
 className="btn btn-ghost btn-xs"
 style={{ fontSize: '11px' }}
 onClick={() => showToast('File attachment picker opened')}
 >
 Attach
 </button>
 <button
 className="btn btn-ghost btn-xs"
 style={{ fontSize: '11px' }}
 onClick={handleSimulateVoiceNote}
 >
 Voice Note
 </button>
 <button
 className="btn btn-ghost btn-xs"
 style={{ fontSize: '11px' }}
 onClick={() => setComposeText((prev) => prev + ' @')}
 >
 @ Mention
 </button>
 </div>

 <div style={{ display: 'flex', gap: '8px' }}>
 <input
 type="text"
 className="input"
 placeholder={`Message #${activeChannel?.name || 'channel'}...`}
 value={composeText}
 onChange={(e) => setComposeText(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleSendMessage();
 }}
 style={{ flex: 1, fontSize: '13px' }}
 />
 <button className="btn btn-primary" onClick={handleSendMessage} style={{ padding: '0 16px' }}>
 Send
 </button>
 </div>
 </div>
 </div>

 {/* Slide-over Thread Panel */}
 {parentThreadMsg && (
 <div
 style={{
 width: '320px',
 flexShrink: 0,
 borderLeft: 'var(--border-width) solid var(--border-color)',
 display: 'flex',
 flexDirection: 'column',
 background: 'var(--c-surface)',
 }}
 >
 <div
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 borderBottom: 'var(--border-width) solid var(--border-color)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 background: 'var(--surface-card)',
 }}
 >
 <span style={{ fontWeight: 800, fontSize: '13px' }}>Thread Discussion</span>
 <button
 className="btn btn-ghost btn-xs"
 onClick={() => setThreadOpenMessageId(null)}
 style={{ fontSize: '14px' }}
 >
 
 </button>
 </div>

 {/* Parent Original Message */}
 <div
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 borderBottom: '1px solid var(--c-gray-200)',
 background: 'var(--surface-card)',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
 <span style={{ fontWeight: 800, fontSize: '12px' }}>{getSender(parentThreadMsg.user).name}</span>
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{parentThreadMsg.time}</span>
 </div>
 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
 {parentThreadMsg.text}
 </div>
 </div>

 <div
 style={{
 padding: '6px 16px',
 fontSize: '11px',
 fontWeight: 800,
 color: 'var(--text-tertiary)',
 borderBottom: '1px solid var(--border-color)',
 }}
 >
 {parentThreadMsg.threads?.length || 0} REPLIES
 </div>

 {/* Replies List */}
 <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-3)' }}>
 {parentThreadMsg.threads && parentThreadMsg.threads.length > 0 ? (
 parentThreadMsg.threads.map((rep) => {
 const repSender = getSender(rep.user);
 return (
 <div
 key={rep.id}
 style={{
 display: 'flex',
 gap: '8px',
 marginBottom: '10px',
 padding: '6px 8px',
 borderRadius: '6px',
 background: 'var(--surface-secondary)',
 border: '1px solid var(--border-color)',
 }}
 >
 <div
 style={{
 width: '24px',
 height: '24px',
 borderRadius: '6px',
 background: repSender.color,
 color: '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 800,
 fontSize: '10px',
 flexShrink: 0,
 }}
 >
 {repSender.initials}
 </div>
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ fontWeight: 800, fontSize: '11px' }}>{repSender.name}</span>
 <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{rep.time}</span>
 </div>
 <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
 {rep.text}
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', padding: '20px 0' }}>
 No replies yet. Start the thread!
 </div>
 )}
 </div>

 {/* Thread Reply Input */}
 <div style={{ padding: 'var(--sp-3)', borderTop: '1px solid var(--border-color)', background: 'var(--surface-card)' }}>
 <div style={{ display: 'flex', gap: '6px' }}>
 <input
 type="text"
 className="input"
 placeholder="Reply in thread..."
 value={threadReplyText}
 onChange={(e) => setThreadReplyText(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleSendThreadReply(parentThreadMsg.id);
 }}
 style={{ flex: 1, fontSize: '12px', height: '32px' }}
 />
 <button
 className="btn btn-primary btn-sm"
 style={{ fontSize: '11px', height: '32px', padding: '0 10px' }}
 onClick={() => handleSendThreadReply(parentThreadMsg.id)}
 >
 Reply
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
