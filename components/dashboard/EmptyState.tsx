'use client';

import React from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  /** Main heading describing the empty state */
  title: string;
  /** Explanatory text guiding the user on what to do next */
  description: string;
  /** Icon element or custom visual node */
  icon?: React.ReactNode;
  /** Primary button label */
  actionLabel?: string;
  /** Primary button click handler */
  onAction?: () => void;
  /** Primary button href for link navigation */
  actionHref?: string;
  /** Optional secondary button label */
  secondaryActionLabel?: string;
  /** Optional secondary button click handler */
  onSecondaryAction?: () => void;
  /** Optional secondary button href */
  secondaryActionHref?: string;
  /** Custom class name */
  className?: string;
  /** Custom inline style overrides */
  style?: React.CSSProperties;
  /** Compact density mode for sidebars/widgets */
  compact?: boolean;
}

/**
 * Standard Cursis Neo-Brutalist Empty State Component.
 * Enforces warm architectural cream / paper surface, 3px solid #0A0A0A border,
 * 6px 6px 0px #0A0A0A ink shadow, and actionable Electric Orange CTAs.
 */
export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  className = '',
  style = {},
  compact = false,
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      width={compact ? "24" : "32"}
      height={compact ? "24" : "32"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF5500"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );

  return (
    <div
      className={`card cursis-empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '24px 16px' : '48px 24px',
        background: '#FFFFFF',
        border: '3px solid #0A0A0A',
        borderRadius: compact ? '14px' : '18px',
        boxShadow: compact ? '4px 4px 0px #0A0A0A' : '6px 6px 0px #0A0A0A',
        width: '100%',
        margin: '0 auto',
        ...style,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: compact ? '44px' : '56px',
          height: compact ? '44px' : '56px',
          border: '2px solid #0A0A0A',
          borderRadius: compact ? '10px' : '14px',
          background: '#FAF6EE',
          boxShadow: '3px 3px 0px #0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: compact ? '12px' : '16px',
          color: '#FF5500',
        }}
      >
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: compact ? '15px' : '18px',
          fontWeight: 800,
          color: '#0A0A0A',
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: compact ? '12px' : '13px',
          color: '#4A4A4A',
          maxWidth: compact ? '320px' : '440px',
          margin: compact ? '0 0 16px 0' : '0 0 20px 0',
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {description}
      </p>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {secondaryActionLabel && (
            secondaryActionHref ? (
              <Link
                href={secondaryActionHref}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                {secondaryActionLabel}
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onSecondaryAction}
                style={{ fontWeight: 700 }}
              >
                {secondaryActionLabel}
              </button>
            )
          )}

          {actionLabel && (
            actionHref ? (
              <Link
                href={actionHref}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onAction}
                style={{ fontWeight: 700 }}
              >
                {actionLabel}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
