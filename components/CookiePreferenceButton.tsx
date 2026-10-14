'use client';

import React from 'react';

export default function CookiePreferenceButton() {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cursis_open_cookie_preferences'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#0F4CFF',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Customize Cookie Preferences
    </button>
  );
}
