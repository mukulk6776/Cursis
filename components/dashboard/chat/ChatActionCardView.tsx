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

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        showToast('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } else {
        showToast('Clipboard not supported in this browser');
      }
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  const handleAction = (action?: { label: string; actionType: string; target?: string }) => {
    if (!action) return;
    switch (action.actionType) {
      case 'navigate':
        if (action.target) {
          setCurrentPage(action.target as DashboardPageType);
          showToast(`Navigating to ${action.target}`);
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
        return '✓';
      case 'meeting':
        return '📅';
      case 'project':
        return '📁';
      case 'deal':
        return '💼';
      case 'doc':
        return '📄';
      case 'automation':
        return '⚡';
      case 'apikey':
        return '🔑';
      case 'theme':
        return '🎨';
      case 'team':
        return '👥';
      case 'navigation':
        return '🧭';
      default:
        return '✦';
    }
  };

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '14px 16px',
        background: '#FAF6EE',
        border: '3px solid #0A0A0A',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '4px 4px 0px #0A0A0A',
      }}
    >
      {/* Header with Title and Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>{getIcon()}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{card.title}</span>
            {card.subtitle && (
              <span style={{ fontSize: '11px', color: '#4A4A4A' }}>{card.subtitle}</span>
            )}
          </div>
        </div>

        {card.badge && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: card.badgeColor ? `${card.badgeColor}22` : 'rgba(255, 85, 0, 0.12)',
              color: card.badgeColor || '#FF5500',
              border: `1.5px solid ${card.badgeColor ? `${card.badgeColor}66` : '#0A0A0A'}`,
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
            fontSize: '11.5px',
            color: '#1A1A1A',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px 12px',
            padding: '10px 12px',
            background: '#FFFFFF',
            borderRadius: '10px',
            border: '2px solid #0A0A0A',
          }}
        >
          {card.meta.priority && (
            <div>
              <span style={{ color: '#4A4A4A' }}>Priority: </span>
              <strong style={{ color: card.meta.priority === 'urgent' ? '#EF4444' : '#FF5500' }}>
                {card.meta.priority}
              </strong>
            </div>
          )}

          {card.meta.deadline && (
            <div>
              <span style={{ color: '#4A4A4A' }}>Due: </span>
              <span style={{ fontWeight: 600 }}>{card.meta.deadline}</span>
            </div>
          )}

          {card.meta.time && (
            <div>
              <span style={{ color: '#4A4A4A' }}>Time: </span>
              <span style={{ fontWeight: 600 }}>{card.meta.time}</span>
            </div>
          )}

          {card.meta.value && (
            <div>
              <span style={{ color: '#4A4A4A' }}>Value: </span>
              <strong style={{ color: '#10B981' }}>{card.meta.value}</strong>
            </div>
          )}

          {card.meta.client && (
            <div>
              <span style={{ color: '#4A4A4A' }}>Client: </span>
              <span style={{ fontWeight: 600 }}>{card.meta.client}</span>
            </div>
          )}

          {card.meta.stage && (
            <div>
              <span style={{ color: '#4A4A4A' }}>Stage: </span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{card.meta.stage}</span>
            </div>
          )}

          {card.meta.progress !== undefined && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#4A4A4A', fontWeight: 600 }}>Milestone Progress</span>
                <span style={{ fontWeight: 700, color: '#0A0A0A' }}>{card.meta.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', border: '1.5px solid #0A0A0A', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${card.meta.progress}%`,
                    height: '100%',
                    background: '#FF5500',
                  }}
                />
              </div>
            </div>
          )}

          {card.meta.themeColor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#4A4A4A' }}>Accent: </span>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: card.meta.themeColor,
                  border: '1.5px solid #0A0A0A',
                }}
              />
              <code style={{ fontSize: '10px', color: '#0A0A0A', fontWeight: 600 }}>{card.meta.themeColor}</code>
            </div>
          )}

          {card.meta.keyPrefix && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ background: '#F3EFE4', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#B53B00', border: '1.5px solid #0A0A0A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>
                {card.meta.keyPrefix}••••••••••••••••
              </code>
              <button
                type="button"
                onClick={() => handleCopy(card.meta?.key || 'crs_live_key')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: copied ? '#10B981' : '#0A0A0A',
                  color: '#FFFFFF',
                  border: '2px solid #0A0A0A',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px #0A0A0A',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          )}

          {card.meta.when && card.meta.then && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div><span style={{ color: '#4A4A4A' }}>When: </span><span style={{ color: '#B53B00', fontWeight: 600 }}>{card.meta.when}</span></div>
              <div style={{ marginTop: '2px' }}><span style={{ color: '#4A4A4A' }}>Then: </span><span style={{ color: '#10B981', fontWeight: 600 }}>{card.meta.then}</span></div>
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
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#FF5500',
              color: '#FFFFFF',
              border: '3px solid #0A0A0A',
              borderRadius: '10px',
              boxShadow: '3px 3px 0px #0A0A0A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FF722B';
              e.currentTarget.style.transform = 'translate(-1px, -1px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #0A0A0A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FF5500';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '3px 3px 0px #0A0A0A';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(1px, 1px)';
              e.currentTarget.style.boxShadow = '1px 1px 0px #0A0A0A';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #0A0A0A';
            }}
          >
            {card.primaryAction.label}
          </button>
        )}

        {card.secondaryAction && (
          <button
            type="button"
            onClick={() => handleAction(card.secondaryAction)}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: taskCompleted ? '#10B981' : '#FFFFFF',
              color: taskCompleted ? '#FFFFFF' : '#0A0A0A',
              border: '3px solid #0A0A0A',
              borderRadius: '10px',
              boxShadow: '3px 3px 0px #0A0A0A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!taskCompleted) e.currentTarget.style.background = '#FAF6EE';
              e.currentTarget.style.transform = 'translate(-1px, -1px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #0A0A0A';
            }}
            onMouseLeave={(e) => {
              if (!taskCompleted) e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '3px 3px 0px #0A0A0A';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(1px, 1px)';
              e.currentTarget.style.boxShadow = '1px 1px 0px #0A0A0A';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #0A0A0A';
            }}
          >
            {taskCompleted ? 'Completed ✓' : card.secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
