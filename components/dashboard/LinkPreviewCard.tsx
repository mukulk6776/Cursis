'use client';

import React, { useState } from 'react';

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string;
  favicon: string | null;
}

interface LinkPreviewCardProps {
  preview: LinkPreviewData;
  loading?: boolean;
  onRemove?: () => void;
}

export default function LinkPreviewCard({ preview, loading, onRemove }: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          marginTop: '10px',
          border: '1px solid var(--c-gray-200)',
          borderRadius: 'var(--border-radius-md)',
          overflow: 'hidden',
          background: 'var(--c-surface)',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '200px',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <div style={{ padding: '12px' }}>
          <div
            style={{
              height: '16px',
              width: '70%',
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          />
          <div
            style={{
              height: '12px',
              width: '90%',
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
            }}
          />
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  const hasImage = preview.image && !imageError;

  return (
    <div
      style={{
        marginTop: '10px',
        border: '1px solid var(--c-gray-200)',
        borderRadius: 'var(--border-radius-md)',
        overflow: 'hidden',
        background: 'var(--c-white)',
        maxWidth: '500px',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-gray-400)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-gray-200)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Remove button (only shown if onRemove is provided) */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            zIndex: 10,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
          }}
          title="Remove preview"
        >
          ×
        </button>
      )}

      {/* Image */}
      {hasImage && (
        <div
          style={{
            width: '100%',
            height: '200px',
            overflow: 'hidden',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={preview.image!}
            alt={preview.title}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {/* Site name with favicon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px',
          }}
        >
          {preview.favicon && !faviconError && (
            <img
              src={preview.favicon}
              alt=""
              onError={() => setFaviconError(true)}
              style={{
                width: '14px',
                height: '14px',
                objectFit: 'contain',
              }}
            />
          )}
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {preview.siteName}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {preview.title}
        </div>

        {/* Description */}
        {preview.description && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {preview.description}
          </div>
        )}
      </div>
    </div>
  );
}
