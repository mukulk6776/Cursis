'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { getFirebaseAuth } from '@/lib/auth/firebase';
import { updateProfile } from 'firebase/auth';

const processAndCompressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        reject(new Error('Invalid image file'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        try {
          const maxDim = 400;
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          const targetSize = Math.min(minSide, maxDim);
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetSize, targetSize);

          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressed);
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
};

export default function ProfilePanel() {
 const {
 profilePanelEmployeeId,
 closeProfilePanel,
 getEmployee,
 getTasksForEmployee,
 projects,
 user,
 signOut,
 removeEmployee,
 openModal,
 showToast,
 updateUserPhoto,
 } = useDashboard();

 const [uploadingPhoto, setUploadingPhoto] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 // Validate file type
 if (!file.type.startsWith('image/')) {
 showToast('Please select an image file (PNG, JPG, WebP, GIF)');
 return;
 }

 // Validate file size (max 5MB)
 if (file.size > 5 * 1024 * 1024) {
 showToast('Image size must be less than 5MB');
 return;
 }

 try {
 setUploadingPhoto(true);

 // Process and compress image to crisp 400x400 avatar data URL
 const compressedDataUrl = await processAndCompressImage(file);

 // Save via Cursis authenticated API & update context state immediately
 await updateUserPhoto(compressedDataUrl);

 // Best-effort sync with client Firebase Auth if active session exists
 try {
 const activeAuth = getFirebaseAuth();
 if (activeAuth && activeAuth.currentUser) {
 updateProfile(activeAuth.currentUser, { photoURL: compressedDataUrl }).catch(() => {});
 }
 } catch {}

 showToast('Profile photo updated successfully');
 } catch (error: any) {
 console.error('Error uploading photo:', error);
 showToast(error?.message || 'Failed to upload photo. Please try again.');
 } finally {
 setUploadingPhoto(false);
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 }
 };

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 closeProfilePanel();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [closeProfilePanel]);

 if (!profilePanelEmployeeId) return null;

 const emp = getEmployee(profilePanelEmployeeId);
 if (!emp) return null;

 const empTasks = getTasksForEmployee(emp.id);
 const activeTasks = empTasks.filter((t) => t.status !== 'completed');
 const doneTasks = empTasks.filter((t) => t.status === 'completed');
 const empProjects = projects.filter((p) => p.team.includes(emp.id));
 const isCurrentUser = emp.id === user.id || (Boolean(emp.email && user.email) && emp.email?.toLowerCase() === user.email?.toLowerCase());
 const displayPhoto = isCurrentUser ? (user.photoURL || emp.photoURL || emp.avatar) : (emp.photoURL || emp.avatar);

 return (
 <>
 <div
 className="profile-backdrop"
 onClick={closeProfilePanel}
 aria-label="Close profile panel"
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0, 0, 0, 0.4)',
 backdropFilter: 'blur(2px)',
 zIndex: 998,
 }}
 />
 <div className="profile-panel open" id="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profile-panel-title" style={{ zIndex: 999 }}>
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: 'var(--sp-4) var(--sp-5)',
 borderBottom: '1px solid var(--border-light)',
 }}
 >
 <h3 id="profile-panel-title" style={{ margin: 0 }}>Profile Details</h3>
 <button
 className="btn btn-ghost btn-sm"
 onClick={closeProfilePanel}
 title="Close profile panel"
 aria-label="Close profile panel"
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 width: '32px',
 height: '32px',
 borderRadius: '8px',
 border: '1px solid var(--border-color)',
 background: 'var(--c-surface)',
 color: 'var(--text-primary)',
 cursor: 'pointer',
 padding: 0,
 transition: 'all 0.15s ease',
 }}
 >
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <line x1="18" y1="6" x2="6" y2="18" />
 <line x1="6" y1="6" x2="18" y2="18" />
 </svg>
 </button>
 </div>

 <div className="profile-panel-body">
 {/* Header Avatar & Info */}
 <div style={{ textAlign: 'center', marginBottom: 'var(--sp-5)' }}>
 <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--sp-3)' }}>
 {displayPhoto ? (
 <img
 src={displayPhoto}
 alt={emp.name}
 style={{
 width: '80px',
 height: '80px',
 borderRadius: '50%',
 objectFit: 'cover',
 border: '3px solid var(--c-white)',
 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
 }}
 />
 ) : (
 <div
 className="avatar avatar-2xl"
 style={{ background: emp.color }}
 >
 {emp.initials}
 </div>
 )}

 {/* Upload button overlay (only for current user) */}
 {isCurrentUser && (
 <>
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 onChange={handleProfilePhotoUpload}
 style={{ display: 'none' }}
 />
 <button
 onClick={() => fileInputRef.current?.click()}
 disabled={uploadingPhoto}
 style={{
 position: 'absolute',
 bottom: '0',
 right: '0',
 width: '32px',
 height: '32px',
 borderRadius: '50%',
 background: 'var(--c-primary)',
 color: 'white',
 border: '2px solid var(--c-white)',
 cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
 transition: 'transform 0.2s ease',
 }}
 onMouseEnter={(e) => {
 if (!uploadingPhoto) {
 e.currentTarget.style.transform = 'scale(1.1)';
 }
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.transform = 'scale(1)';
 }}
 title="Upload profile photo"
 >
 {uploadingPhoto ? (
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
 <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
 <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
 </svg>
 ) : (
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
 <circle cx="12" cy="13" r="4" />
 </svg>
 )}
 </button>
 <style>{`
 @keyframes spin {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
 }
 `}</style>
 </>
 )}
 </div>
 <h3 style={{ margin: 0 }}>{emp.name}</h3>
 <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>
 {emp.role} · {emp.department}
 </p>

 <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
 <span
 style={{
 background: 'var(--c-surface)',
 color: 'var(--text-secondary)',
 fontSize: '10px',
 fontWeight: 700,
 padding: '2px 8px',
 borderRadius: '12px',
 border: '1px solid var(--border-color)',
 textTransform: 'uppercase',
 }}
 >
 {emp.workspaceRole || 'Member'}
 </span>
 <span
 className={`badge badge-${
 emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'error' : 'neutral'
 }`}
 >
 ● {emp.status}
 </span>
 </div>
 </div>

 {/* Quick Stats Grid */}
 <div
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(3,1fr)',
 gap: 'var(--sp-3)',
 marginBottom: 'var(--sp-5)',
 }}
 >
 <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--sp-3)' }}>
 <div className="stat-card-value" style={{ fontSize: 'var(--fs-xl)' }}>
 {empTasks.length}
 </div>
 <div className="stat-card-label">Tasks</div>
 </div>
 <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--sp-3)' }}>
 <div className="stat-card-value" style={{ fontSize: 'var(--fs-xl)' }}>
 {empProjects.length}
 </div>
 <div className="stat-card-label">Projects</div>
 </div>
 <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--sp-3)' }}>
 <div className="stat-card-value" style={{ fontSize: 'var(--fs-xl)', color: 'var(--c-success)' }}>
 {doneTasks.length}
 </div>
 <div className="stat-card-label">Done</div>
 </div>
 </div>

 {/* Active Tasks List */}
 <h4 style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--fs-md)' }}>Active Tasks</h4>
 {activeTasks.length > 0 ? (
 activeTasks.map((t) => (
 <div
 key={t.id}
 className="task-row"
 style={{
 border: '1px solid var(--border-light)',
 borderRadius: 'var(--border-radius-md)',
 marginBottom: 'var(--sp-2)',
 padding: '8px 12px',
 }}
 >
 <span className={`badge priority-${t.priority}`} style={{ fontSize: '10px' }}>
 {t.priority}
 </span>
 <span className="task-name" style={{ fontSize: 'var(--fs-sm)' }}>
 {t.name}
 </span>
 </div>
 ))
 ) : (
 <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>No active tasks</p>
 )}

 {/* Projects List */}
 <h4 style={{ margin: 'var(--sp-5) 0 var(--sp-3)', fontSize: 'var(--fs-md)' }}>Assigned Projects</h4>
 {empProjects.length > 0 ? (
 empProjects.map((p) => (
 <div
 key={p.id}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 'var(--sp-2)',
 marginBottom: 'var(--sp-2)',
 padding: 'var(--sp-2) var(--sp-3)',
 borderRadius: 'var(--border-radius-md)',
 background: 'var(--c-gray-100)',
 }}
 >
 <span style={{ fontSize: '18px' }}>{p.icon}</span>
 <span style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-sm)' }}>{p.name}</span>
 <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
 {p.progress}%
 </span>
 </div>
 ))
 ) : (
 <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>No projects</p>
 )}

 {/* Account Session Actions (If Current User or Workspace Owner) */}
 {(emp.id === user.id || emp.email === user.email) && (
 <div
 style={{
 marginTop: 'var(--sp-6)',
 paddingTop: 'var(--sp-5)',
 borderTop: '1px solid var(--border-light)',
 }}
 >
 <h4 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-sm)', fontWeight: 800 }}>Account &amp; Session</h4>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-3)' }}>
 Logged in as <strong>{user.email}</strong>
 </p>
 <button
 type="button"
 id="profile-panel-sign-out-btn"
 className="btn btn-secondary"
 style={{
 width: '100%',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '8px',
 color: 'var(--c-error)',
 borderColor: '#fca5a5',
 background: '#fff5f5',
 fontWeight: 700,
 fontSize: 'var(--fs-sm)',
 }}
 onClick={() => {
 closeProfilePanel();
 signOut();
 }}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
 <polyline points="16 17 21 12 16 7" />
 <line x1="21" y1="12" x2="9" y2="12" />
 </svg>
 Sign Out of Cursis
 </button>
 </div>
 )}

 {/* Member Management Actions (for Admins / other members) */}
 {(user.workspaceRole === 'owner' || user.role === 'owner') && emp.id !== user.id && emp.id !== 'u1' && emp.id !== 'u_owner' && emp.workspaceRole !== 'owner' && (
 <div
 style={{
 marginTop: 'var(--sp-6)',
 paddingTop: 'var(--sp-5)',
 borderTop: '1px solid var(--border-light)',
 }}
 >
 <h4 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-sm)', fontWeight: 800 }}>Workspace Membership</h4>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-3)' }}>
 Remove this member from the organization workspace and revoke their active seats.
 </p>
 <button
 type="button"
 className="btn btn-secondary"
 style={{
 width: '100%',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '8px',
 color: 'var(--c-error)',
 borderColor: '#fca5a5',
 background: '#fff5f5',
 fontWeight: 700,
 fontSize: 'var(--fs-sm)',
 }}
 onClick={async () => {
 if (window.confirm(`Are you sure you want to remove ${emp.name} from the workspace?`)) {
 await removeEmployee(emp.id);
 closeProfilePanel();
 }
 }}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M3 6h18" />
 <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
 </svg>
 Remove {emp.name} from Workspace
 </button>
 </div>
 )}
      </div>
    </div>
    </>
  );
}
