'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { IntegrationItem, WebhookItem, ApiKeyItem } from '@/lib/dashboard/types';

export default function IntegrationsPage() {
  const {
    integrations,
    toggleIntegration,
    webhooks,
    addWebhook,
    apiKeys,
    addApiKey,
    revokeApiKey,
    showToast,
    addAuditEntry,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'api-keys'>('integrations');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [configuredIntId, setConfiguredIntId] = useState<string | null>(null);

  // Webhook form
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['task.completed']);

  // Api key form
  const [keyName, setKeyName] = useState('');
  const [keyScopes, setKeyScopes] = useState<string[]>(['read:tasks', 'write:tasks']);

  const connectedCount = integrations.filter((i: IntegrationItem) => i.status === 'connected').length;
  const categories: string[] = ['all', ...Array.from(new Set(integrations.map((i: IntegrationItem) => i.category)))];

  const filteredIntegrations =
    filterCategory === 'all'
      ? integrations
      : integrations.filter((i: IntegrationItem) => i.category === filterCategory);

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whUrl.trim()) return;
    addWebhook({
      name: whName.trim(),
      url: whUrl.trim(),
      events: whEvents,
      status: 'active',
      secret: 'whsec_' + Math.random().toString(36).substr(2, 9),
    });
    setWhName('');
    setWhUrl('');
    setShowWebhookModal(false);
    showToast('New webhook registered successfully *');
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    addApiKey(keyName.trim(), keyScopes);
    setKeyName('');
    setShowApiKeyModal(false);
    showToast('New API key generated & copied to clipboard *');
  };

  const handleConnect = (id: string, name: string) => {
    toggleIntegration(id);
    addAuditEntry('u1', 'integration.connected', name, 'Integration connected');
    showToast(`${name} connected successfully *`);
  };

  const handleDisconnect = (id: string, name: string) => {
    toggleIntegration(id);
    addAuditEntry('u1', 'integration.disconnected', name, 'Integration disconnected');
    showToast(`${name} disconnected *`);
  };

  const configuredInt = integrations.find((i) => i.id === configuredIntId);

  return (
    <div className="page active" id="page-integrations" style={{ display: 'block' }}>
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <h1 className="page-title">Integrations &amp; Developer Hub</h1>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {activeTab === 'webhooks' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowWebhookModal(true)}>
              + New Webhook
            </button>
          )}
          {activeTab === 'api-keys' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowApiKeyModal(true)}>
              + Generate Key
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div className="tabs" style={{ margin: 0 }}>
          <span
            className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
            style={{ cursor: 'pointer' }}
          >
            Integrations ({connectedCount}/{integrations.length})
          </span>
          <span
            className={`tab ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
            style={{ cursor: 'pointer' }}
          >
            Webhooks ({webhooks.length})
          </span>
          <span
            className={`tab ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
            style={{ cursor: 'pointer' }}
          >
            API Keys ({apiKeys.length})
          </span>
        </div>
      </div>

      {/* TAB 1: NATIVE INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div>
          {/* Category Filters */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c}
                className={`btn btn-sm ${filterCategory === c ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterCategory(c)}
                style={{ textTransform: 'capitalize' }}
              >
                {c === 'all' ? 'All Categories' : c}
              </button>
            ))}
          </div>

          {/* Status Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--sp-3)',
              marginBottom: 'var(--sp-5)',
            }}
          >
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', color: 'var(--c-brand)' }}>
                {connectedCount}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 'var(--fw-bold)' }}>CONNECTED</div>
            </div>
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)' }}>
                {integrations.length - connectedCount}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 'var(--fw-bold)' }}>AVAILABLE</div>
            </div>
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)' }}>{categories.length - 1}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 'var(--fw-bold)' }}>CATEGORIES</div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--sp-3)',
            }}
          >
            {filteredIntegrations.map((int: IntegrationItem) => {
              const isConnected = int.status === 'connected';
              return (
                <div
                  key={int.id}
                  className="card"
                  style={{
                    padding: 'var(--sp-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--sp-3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          border: 'var(--border-width) solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--fw-black)',
                          fontSize: 'var(--fs-sm)',
                          background: 'var(--c-surface)',
                        }}
                      >
                        {int.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{int.name}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{int.category}</div>
                      </div>
                    </div>
                    <span
                      className={`badge ${isConnected ? 'badge-success' : 'badge-neutral'}`}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      {isConnected ? 'Connected' : 'Available'}
                    </span>
                  </div>

                  {int.connectedAt && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                      Connected since {int.connectedAt}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 'var(--sp-2)' }}>
                    {isConnected ? (
                      <>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, fontSize: 'var(--fs-xs)' }}
                          onClick={() => setConfiguredIntId(int.id)}
                        >
                          Configure
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-error)' }}
                          onClick={() => handleDisconnect(int.id, int.name)}
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: 'var(--fs-xs)' }}
                        onClick={() => handleConnect(int.id, int.name)}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>WEBHOOK NAME &amp; ENDPOINT</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>EVENTS</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>SECRET</th>
                <th style={{ textAlign: 'right', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh: WebhookItem) => (
                <tr key={wh.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <div style={{ fontWeight: 'var(--fw-bold)' }}>{wh.name}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {wh.url}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {wh.events.map((ev: string, i: number) => (
                        <span key={i} className="badge badge-brand" style={{ fontSize: '9px' }}>
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <span className={`badge ${wh.status === 'active' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                      {wh.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--sp-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
                    {wh.secret ? `${wh.secret.substring(0, 8)}••••••` : '••••••••'}
                  </td>
                  <td style={{ padding: 'var(--sp-3)', textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '10px' }}
                      onClick={() => showToast(`Test event pinged to ${wh.url} (200 OK) *`)}
                    >
                      Test Ping
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: API KEYS */}
      {activeTab === 'api-keys' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>KEY NAME &amp; PREFIX</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>PERMISSIONS</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>CREATED</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>LAST USED</th>
                <th style={{ textAlign: 'right', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key: ApiKeyItem) => (
                <tr key={key.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <div style={{ fontWeight: 'var(--fw-bold)' }}>{key.name}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {key.prefix}••••••••••••••••
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(key.permissions || key.scopes || []).map((p: string, i: number) => (
                        <span key={i} className="badge badge-neutral" style={{ fontSize: '9px' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>{key.created}</td>
                  <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                    {key.lastUsed || 'Never'}
                  </td>
                  <td style={{ padding: 'var(--sp-3)', textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '10px', color: 'var(--c-error)' }}
                      onClick={() => {
                        revokeApiKey(key.id);
                        showToast(`Revoked API key: ${key.name}`);
                      }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWebhookModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">Register New Webhook</span>
              <button className="modal-close" onClick={() => setShowWebhookModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateWebhook}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Webhook Label</label>
                  <input
                    className="input"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="e.g. ERP Ingestion Service"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Payload Destination URL</label>
                  <input
                    className="input"
                    type="url"
                    value={whUrl}
                    onChange={(e) => setWhUrl(e.target.value)}
                    placeholder="https://api.domain.com/hooks/cursis"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Subscription Events</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {['task.completed', 'document.signed', 'meeting.transcribed', 'crm.deal.won'].map((ev) => (
                      <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-xs)' }}>
                        <input
                          type="checkbox"
                          checked={whEvents.includes(ev)}
                          onChange={(e) => {
                            if (e.target.checked) setWhEvents([...whEvents, ev]);
                            else setWhEvents(whEvents.filter((x) => x !== ev));
                          }}
                        />
                        <span>{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWebhookModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowApiKeyModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">Generate Service API Key</span>
              <button className="modal-close" onClick={() => setShowApiKeyModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateApiKey}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Key Name / Description</label>
                  <input
                    className="input"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD Deployment Token"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Granted Permissions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {['read:tasks', 'write:tasks', 'read:documents', 'write:documents', 'read:crm'].map((sc) => (
                      <label key={sc} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-xs)' }}>
                        <input
                          type="checkbox"
                          checked={keyScopes.includes(sc)}
                          onChange={(e) => {
                            if (e.target.checked) setKeyScopes([...keyScopes, sc]);
                            else setKeyScopes(keyScopes.filter((x) => x !== sc));
                          }}
                        />
                        <span>{sc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApiKeyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Integration Configure Modal */}
      {configuredInt && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfiguredIntId(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span className="modal-title">Configure {configuredInt.name}</span>
              <button className="modal-close" onClick={() => setConfiguredIntId(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Sync Frequency</label>
                <select className="input select" defaultValue="Real-time Webhook Stream">
                  <option>Real-time Webhook Stream</option>
                  <option>Every 15 Minutes</option>
                  <option>Hourly Batch</option>
                  <option>Manual Trigger Only</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Target Organization Workspace</label>
                <input className="input" defaultValue="Production Workspace" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfiguredIntId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  showToast(`${configuredInt.name} configuration updated *`);
                  setConfiguredIntId(null);
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
