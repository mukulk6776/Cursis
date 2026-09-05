'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function MemberModal() {
  const { activeModal, closeModal, addEmployee } = useDashboard();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engineering');

  if (activeModal !== 'member-modal') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addEmployee({
      name: name.trim(),
      email: email.trim() || undefined,
      role: role.trim() || 'Team Member',
      department,
    });

    setName('');
    setEmail('');
    setRole('');
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="member-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <span className="modal-title">Add Team Member</span>
          <button className="modal-close" onClick={closeModal}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Full Name */}
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                className="input"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              {/* Role */}
              <div className="input-group">
                <label className="input-label">Role</label>
                <input
                  className="input"
                  placeholder="e.g. Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>

              {/* Department */}
              <div className="input-group">
                <label className="input-label">Department</label>
                <select
                  className="input select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Product">Product</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Analytics">Analytics</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
