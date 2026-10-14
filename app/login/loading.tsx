export default function LoginLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg, #FAF6EE)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(10, 10, 10, 0.1)',
            borderTopColor: '#FF5500',
            animation: 'cursis-spin 0.8s linear infinite',
            margin: '0 auto',
          }}
        />
        <p style={{ marginTop: '16px', color: 'var(--text-tertiary, #737373)', fontSize: '14px', fontFamily: 'var(--font-family)' }}>
          Loading workspace...
        </p>
      </div>
      <style>{`
        @keyframes cursis-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
