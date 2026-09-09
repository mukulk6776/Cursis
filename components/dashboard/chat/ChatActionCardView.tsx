'use client';

import React, { useState } from 'react';
import { ChatActionCard, DashboardPageType } from '@/lib/dashboard/types';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

interface ChatActionCardViewProps {
 card: ChatActionCard;
}

export default function ChatActionCardView({ card }: ChatActionCardViewProps) {
 const {
 setCurrentPage,
 openModal,
 showToast,
 toggleTaskComplete,
 toggleAutomation,
 } = useDashboard();

 const [copied, setCopied] = useState(false);
 const [taskCompleted, setTaskCompleted] = useState(false);

 const handleCopy = (text: string) => {
 try {
 if (navigator.clipboard) {
 navigator.clipboard.writeText(text);
 }
 setCopied(true);
 showToast('Copied to clipboard ');
 setTimeout(() => setCopied(false), 2000);
 } catch {
 showToast('Copied to clipboard ');
 }
 };

 const handleAction = (action?: { label: string; actionType: string; target?: string }) => {
 if (!action) return;
 switch (action.actionType) {
 case 'navigate':
 if (action.target) {
 setCurrentPage(action.target as DashboardPageType);
 showToast(`Navigating to ${action.target} `);
 }
 break;
 case 'open_modal':
 if (action.target) {
 openModal(action.target);
 }
 break;
 case 'copy':
 if (action.target || card.meta?.key) {
 handleCopy(action.target || card.meta?.key || 'crs_live_production_key');
 }
 break;
 case 'toggle_status':
 if (card.type === 'task' && card.meta?.taskId) {
 toggleTaskComplete(card.meta.taskId);
 setTaskCompleted((prev) => !prev);
 } else if (card.type === 'automation' && card.meta?.automationId) {
 toggleAutomation(card.meta.automationId);
 }
 break;
 case 'link':
 if (action.target) {
 window.open(action.target, '_blank', 'noopener,noreferrer');
 }
 break;
 default:
 if (action.target) {
 setCurrentPage(action.target as DashboardPageType);
 }
 break;
 }
 };

 const getIcon = () => {
 switch (card.type) {
 case 'task':
 return '';
 case 'meeting':
 return '';
 case 'project':
 return '';
 case 'deal':
 return '';
 case 'doc':
 return '';
 case 'automation':
 return '';
 case 'apikey':
 return '';
 case 'theme':
 return '';
 case 'team':
 return '';
 case 'navigation':
 return '';
 default:
 return '';
 }
 };

 return (
 <div
 style={{
 marginTop: '10px',
 padding: '12px 14px',
 background: 'rgba(15, 17, 23, 0.75)',
 border: '1px solid rgba(255, 255, 255, 0.12)',
 borderRadius: '10px',
 display: 'flex',
 flexDirection: 'column',
 gap: '10px',
 boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
 backdropFilter: 'blur(8px)',
 }}
 >
 {/* Header with Title and Badge */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontSize: '15px' }}>{getIcon()}</span>
 <div style={{ display: 'flex', flexDirection: 'column' }}>
 <span style={{ fontWeight: 600, fontSize: '13px', color: '#f3f4f6' }}>{card.title}</span>
 {card.subtitle && (
 <span style={{ fontSize: '11px', color: '#9ca3af' }}>{card.subtitle}</span>
 )}
 </div>
 </div>

 {card.badge && (
 <span
 style={{
 fontSize: '10px',
 fontWeight: 600,
 padding: '2px 7px',
 borderRadius: '6px',
 background: card.badgeColor ? `${card.badgeColor}22` : 'rgba(15, 76, 255, 0.2)',
 color: card.badgeColor || '#60a5fa',
 border: `1px solid ${card.badgeColor ? `${card.badgeColor}44` : 'rgba(15, 76, 255, 0.3)'}`,
 textTransform: 'uppercase',
 letterSpacing: '0.04em',
 whiteSpace: 'nowrap',
 }}
 >
 {card.badge}
 </span>
 )}
 </div>

 {/* Dynamic Metadata Content */}
 {card.meta && (
 <div
 style={{
 fontSize: '11px',
 color: '#d1d5db',
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
 gap: '6px 12px',
 padding: '8px 10px',
 background: 'rgba(0, 0, 0, 0.35)',
 borderRadius: '6px',
 border: '1px solid rgba(255, 255, 255, 0.05)',
 }}
 >
 {card.meta.priority && (
 <div>
 <span style={{ color: '#9ca3af' }}>Priority: </span>
 <strong style={{ color: card.meta.priority === 'urgent' ? '#f87171' : '#60a5fa' }}>
 {card.meta.priority}
 </strong>
 </div>
 )}

 {card.meta.deadline && (
 <div>
 <span style={{ color: '#9ca3af' }}>Due: </span>
 <span>{card.meta.deadline}</span>
 </div>
 )}

 {card.meta.time && (
 <div>
 <span style={{ color: '#9ca3af' }}>Time: </span>
 <span>{card.meta.time}</span>
 </div>
 )}

 {card.meta.value && (
 <div>
 <span style={{ color: '#9ca3af' }}>Value: </span>
 <strong style={{ color: '#34d399' }}>{card.meta.value}</strong>
 </div>
 )}

 {card.meta.client && (
 <div>
 <span style={{ color: '#9ca3af' }}>Client: </span>
 <span>{card.meta.client}</span>
 </div>
 )}

 {card.meta.stage && (
 <div>
 <span style={{ color: '#9ca3af' }}>Stage: </span>
 <span style={{ textTransform: 'capitalize' }}>{card.meta.stage}</span>
 </div>
 )}

 {card.meta.progress !== undefined && (
 <div style={{ gridColumn: '1 / -1' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
 <span style={{ color: '#9ca3af' }}>Milestone Progress</span>
 <span style={{ fontWeight: 600 }}>{card.meta.progress}%</span>
 </div>
 <div style={{ width: '100%', height: '5px', background: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
 <div
 style={{
 width: `${card.meta.progress}%`,
 height: '100%',
 background: 'linear-gradient(90deg, #0f4cff, #38bdf8)',
 }}
 />
 </div>
 </div>
 )}

 {card.meta.themeColor && (
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ color: '#9ca3af' }}>Accent: </span>
 <div
 style={{
 width: '14px',
 height: '14px',
 borderRadius: '3px',
 background: card.meta.themeColor,
 border: '1px solid #fff',
 }}
 />
 <code style={{ fontSize: '10px' }}>{card.meta.themeColor}</code>
 </div>
 )}

 {card.meta.keyPrefix && (
 <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
 <code style={{ background: '#111827', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', color: '#a78bfa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
 {card.meta.keyPrefix}••••••••••••••••
 </code>
 <button
 type="button"
 onClick={() => handleCopy(card.meta?.key || 'crs_live_key')}
 style={{
 padding: '3px 8px',
 fontSize: '10px',
 fontWeight: 600,
 background: copied ? '#059669' : '#374151',
 color: '#fff',
 border: 'none',
 borderRadius: '4px',
 cursor: 'pointer',
 transition: 'background 0.15s ease',
 }}
 >
 {copied ? 'Copied ' : 'Copy'}
 </button>
 </div>
 )}

 {card.meta.when && card.meta.then && (
 <div style={{ gridColumn: '1 / -1' }}>
 <div><span style={{ color: '#9ca3af' }}>When: </span><span style={{ color: '#fbbf24' }}>{card.meta.when}</span></div>
 <div style={{ marginTop: '2px' }}><span style={{ color: '#9ca3af' }}>Then: </span><span style={{ color: '#34d399' }}>{card.meta.then}</span></div>
 </div>
 )}
 </div>
 )}

 {/* Action Buttons */}
 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
 {card.primaryAction && (
 <button
 type="button"
 onClick={() => handleAction(card.primaryAction)}
 style={{
 flex: 1,
 minWidth: '110px',
 padding: '6px 12px',
 fontSize: '11px',
 fontWeight: 600,
 background: '#0f4cff',
 color: '#ffffff',
 border: '1px solid rgba(255, 255, 255, 0.2)',
 borderRadius: '6px',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '5px',
 transition: 'all 0.15s ease',
 }}
 onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
 onMouseLeave={(e) => (e.currentTarget.style.background = '#0f4cff')}
 >
 {card.primaryAction.label}
 </button>
 )}

 {card.secondaryAction && (
 <button
 type="button"
 onClick={() => handleAction(card.secondaryAction)}
 style={{
 padding: '6px 12px',
 fontSize: '11px',
 fontWeight: 500,
 background: taskCompleted ? '#059669' : 'rgba(255, 255, 255, 0.08)',
 color: '#e5e7eb',
 border: '1px solid rgba(255, 255, 255, 0.15)',
 borderRadius: '6px',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '5px',
 transition: 'all 0.15s ease',
 }}
 onMouseEnter={(e) => {
 if (!taskCompleted) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
 }}
 onMouseLeave={(e) => {
 if (!taskCompleted) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
 }}
 >
 {taskCompleted ? 'Completed ' : card.secondaryAction.label}
 </button>
 )}
 </div>
 </div>
 );
}
