'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  Folder,
  KeyRound,
  Palette,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
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
        return <CheckCircle2 size={16} aria-hidden="true" />;
      case 'meeting':
        return <Calendar size={16} aria-hidden="true" />;
      case 'project':
        return <Folder size={16} aria-hidden="true" />;
      case 'deal':
        return <Briefcase size={16} aria-hidden="true" />;
      case 'doc':
        return <FileText size={16} aria-hidden="true" />;
      case 'automation':
        return <Zap size={16} aria-hidden="true" />;
      case 'apikey':
        return <KeyRound size={16} aria-hidden="true" />;
      case 'theme':
        return <Palette size={16} aria-hidden="true" />;
      case 'team':
        return <Users size={16} aria-hidden="true" />;
      case 'navigation':
        return <Compass size={16} aria-hidden="true" />;
      default:
        return <Sparkles size={16} aria-hidden="true" />;
    }
  };

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '14px 16px',
        background: 'var(--c-bg-subtle)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'none',
      }}
    >
      {/* Header with Title and Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>{getIcon()}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #0A0A0A)' }}>{card.title}</span>
            {card.subtitle && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary, #4A4A4A)' }}>{card.subtitle}</span>
            )}
          </div>
        </div>

        {card.badge && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
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
            color: 'var(--text-primary, #1A1A1A)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px 12px',
            padding: '10px 12px',
            background: 'var(--surface-card)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
        >
          {card.meta.priority && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Priority: </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {card.meta.priority}
              </strong>
            </div>
          )}

          {card.meta.deadline && (
            <div>
              <span style={{ color: 'var(--text-secondary, #4A4A4A)' }}>Due: </span>
              <span style={{ fontWeight: 600 }}>{card.meta.deadline}</span>
            </div>
          )}

          {card.meta.time && (
            <div>
              <span style={{ color: 'var(--text-secondary, #4A4A4A)' }}>Time: </span>
              <span style={{ fontWeight: 600 }}>{card.meta.time}</span>
            </div>
          )}

          {card.meta.value && (
            <div>
              <span style={{ color: 'var(--text-secondary, #4A4A4A)' }}>Value: </span>
              <strong style={{ color: '#10B981' }}>{card.meta.value}</strong>
            </div>
          )}

          {card.meta.client && (
            <div>
              <span style={{ color: 'var(--text-secondary, #4A4A4A)' }}>Client: </span>
              <span style={{ fontWeight: 600 }}>{card.meta.client}</span>
            </div>
          )}

          {card.meta.stage && (
            <div>
              <span style={{ color: 'var(--text-secondary, #4A4A4A)' }}>Stage: </span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{card.meta.stage}</span>
            </div>
          )}

          {card.meta.progress !== undefined && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary, #4A4A4A)', fontWeight: 600 }}>Milestone Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #0A0A0A)' }}>{card.meta.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color, #E5E7EB)', borderRadius: '4px', border: '1.5px solid var(--border-dark, #0A0A0A)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${card.meta.progress}%`,
                    height: '100%',
                    background: 'var(--c-brand)',
                  }}
                />
              </div>
            </div>
          )}

          {card.meta.themeColor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Accent: </span>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: card.meta.themeColor,
                  border: '1px solid var(--border-color)',
                }}
              />
              <code style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>{card.meta.themeColor}</code>
            </div>
          )}

          {card.meta.keyPrefix && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ background: 'var(--c-bg-subtle)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                {card.meta.keyPrefix}••••••••••••••••
              </code>
              <button
                type="button"
                onClick={() => handleCopy(card.meta?.key || 'crs_live_key')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'var(--c-brand)',
                  color: 'var(--c-on-brand)',
                  border: '1px solid var(--c-brand)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          )}

          {card.meta.when && card.meta.then && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>When: </span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{card.meta.when}</span></div>
              <div style={{ marginTop: '2px' }}><span style={{ color: 'var(--text-secondary)' }}>Then: </span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{card.meta.then}</span></div>
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
              fontWeight: 600,
              background: 'var(--c-brand)',
              color: 'var(--c-on-brand)',
              border: '1px solid var(--c-brand)',
              borderRadius: '6px',
              boxShadow: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
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
              fontWeight: 600,
              background: taskCompleted ? 'var(--c-brand)' : 'var(--surface-card)',
              color: taskCompleted ? 'var(--c-on-brand)' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {taskCompleted ? 'Completed ✓' : card.secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
