import React, { useState } from 'react';
import {
  Clock,
  Database,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Sparkles,
  Smartphone
} from 'lucide-react';
import type { RecalledMemoryItem, SupportApiResponse } from '../types';

interface CustomerContextPanelProps {
  customerId: string;
  onCustomerIdChange: (id: string) => void;
  memories: RecalledMemoryItem[];
  totalMemoriesCount?: number;
  memoryStatus?: 'available' | 'unavailable';
  activeInteractionState?: SupportApiResponse['interactionState'];
  onRefreshMemories: () => void;
  isRefreshing: boolean;
  forcedTab?: 'timeline' | 'memories' | 'attempts';
}

export const CustomerContextPanel: React.FC<CustomerContextPanelProps> = ({
  customerId,
  onCustomerIdChange,
  memories,
  totalMemoriesCount,
  memoryStatus = 'available',
  activeInteractionState,
  onRefreshMemories,
  isRefreshing,
  forcedTab,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'memories' | 'attempts'>('timeline');

  React.useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab]);

  const quickCustomers = ['C001', 'C002', 'C003'];

  // Current issue & environment extracted strictly from active case state (no fabricated fallbacks)
  const currentCase = activeInteractionState?.currentCase;
  const problemText = activeInteractionState?.problem || currentCase?.problem || null;
  const appName = activeInteractionState?.application || currentCase?.application || null;
  const osName = activeInteractionState?.operatingSystem || currentCase?.operatingSystem || null;
  const deviceName = activeInteractionState?.device || currentCase?.device || null;
  const appVersion = activeInteractionState?.applicationVersion || currentCase?.applicationVersion || null;
  const trigger = activeInteractionState?.trigger || currentCase?.trigger || null;
  const hasActiveCase = Boolean(problemText || appName || deviceName || osName);

  // Action history for timeline & attempts
  const actionHistory = activeInteractionState?.actionHistory || currentCase?.actionHistory || [];

  return (
    <div className="customer-context-panel">
      {/* Customer Header Card */}
      <div className="customer-profile-card">
        <div className="profile-top-row">
          <div className="profile-avatar">
            <span>{customerId.charAt(0)}</span>
          </div>
          <div className="profile-meta">
            <div className="profile-name-row">
              <h2 className="profile-name">Customer {customerId}</h2>
              <span className="profile-active-tag">
                <span className="active-dot" />
                Active
              </span>
            </div>
            <p className="profile-email">{customerId.toLowerCase()}@example.com</p>
          </div>
        </div>

        {/* Quick Customer Switcher */}
        <div className="customer-switcher-pills">
          <span className="switcher-label">Profiles:</span>
          {quickCustomers.map((id) => (
            <button
              key={id}
              onClick={() => onCustomerIdChange(id)}
              className={`switcher-pill ${customerId === id ? 'switcher-pill-active' : ''}`}
            >
              {id}
            </button>
          ))}
        </div>

        {/* Mini stats row */}
        <div className="profile-stats-tiles">
          <div className="stat-tile">
            <span className="stat-label">Memories available</span>
            <span className="stat-val">
              {memoryStatus === 'unavailable'
                ? 'Unavailable'
                : totalMemoriesCount !== undefined
                ? totalMemoriesCount
                : memories.length}
            </span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Interactions</span>
            <span className="stat-val">{currentCase?.turnCount || (activeInteractionState ? 1 : 0)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">AI Memory</span>
            <span className={`stat-val ${memoryStatus === 'unavailable' ? 'text-rose' : 'text-emerald'}`}>
              {memoryStatus === 'unavailable' ? 'Offline' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Case Card (Short-term working memory layer) */}
      <div className="current-issue-card">
        <div className="card-section-label-row">
          <span className="card-section-label">ACTIVE CASE CONTEXT</span>
          <span className={`issue-status-badge ${!hasActiveCase ? 'badge-idle' : activeInteractionState?.outcome === 'success' ? 'badge-resolved' : 'badge-progress'}`}>
            {!hasActiveCase
              ? 'No Active Issue'
              : activeInteractionState?.outcome === 'success'
              ? 'Resolved'
              : activeInteractionState?.recurrenceDetected
              ? 'Recurrence'
              : 'In Progress'}
          </span>
        </div>

        {hasActiveCase ? (
          <>
            <h3 className="current-issue-title">{problemText || `${appName || 'Application'} issue`}</h3>

            {/* Environment details */}
            <div className="env-tiles-row">
              {deviceName && (
                <span className="env-tile" title="Device">
                  <Smartphone size={12} className="text-secondary" />
                  {deviceName}
                </span>
              )}
              {osName && (
                <span className="env-tile" title="Operating System">
                  {osName}
                </span>
              )}
              {appName && (
                <span className="env-tile" title="Application">
                  {appName} {appVersion && `v${appVersion}`}
                </span>
              )}
            </div>

            {trigger && (
              <div className="trigger-row">
                <span className="trigger-bullet">&bull;</span>
                <span className="trigger-text">{trigger}</span>
              </div>
            )}
          </>
        ) : (
          <div className="no-active-issue-block">
            <h4 className="no-issue-heading">No active issue in current session</h4>
            <p className="no-issue-desc">Send a message to start troubleshooting or diagnose an issue.</p>
          </div>
        )}

        <div className="working-context-footer">
          <span>Working context for this support session</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="context-tabs-bar">
        <button
          className={`context-tab-btn ${activeTab === 'timeline' ? 'context-tab-active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={14} />
          <span>Timeline</span>
        </button>
        <button
          className={`context-tab-btn ${activeTab === 'memories' ? 'context-tab-active' : ''}`}
          onClick={() => setActiveTab('memories')}
        >
          <Database size={14} />
          <span>Memories ({memories.length})</span>
        </button>
        <button
          className={`context-tab-btn ${activeTab === 'attempts' ? 'context-tab-active' : ''}`}
          onClick={() => setActiveTab('attempts')}
        >
          <History size={14} />
          <span>Attempts ({actionHistory.length})</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="context-tab-content">
        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="timeline-view">
            <div className="timeline-header-row">
              <span className="timeline-subheading">Interaction Timeline</span>
              <button
                onClick={onRefreshMemories}
                className="icon-refresh-btn"
                title="Refresh customer memories"
                disabled={isRefreshing}
              >
                <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
              </button>
            </div>

            <div className="vertical-timeline-stream">
              {/* Event 1: Initial problem */}
              <div className="timeline-item">
                <div className="timeline-marker marker-info">
                  <div className="marker-dot-inner" />
                </div>
                <div className="timeline-card">
                  <div className="timeline-card-header">
                    <span className="timeline-event-title">Issue Reported</span>
                    <span className="timeline-timestamp">Today</span>
                  </div>
                  <p className="timeline-desc">{problemText}</p>
                </div>
              </div>

              {/* Action History Items */}
              {actionHistory.map((item, idx) => {
                const isFail = item.status === 'failure';
                const isSuccess = item.status === 'success';
                const isRecurred = Boolean(item.recurrence);

                return (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-marker ${isFail ? 'marker-failure' : isSuccess ? 'marker-success' : 'marker-suggested'}`}>
                      {isRecurred ? (
                        <RotateCcw size={12} className="text-amber" />
                      ) : isFail ? (
                        <XCircle size={12} className="text-rose" />
                      ) : isSuccess ? (
                        <CheckCircle2 size={12} className="text-emerald" />
                      ) : (
                        <Clock size={12} className="text-blue" />
                      )}
                    </div>
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <span className="timeline-event-title">{item.action}</span>
                        <span className="timeline-timestamp">
                          {isRecurred ? 'Recurred' : isFail ? 'Unresolved' : isSuccess ? 'Resolved' : 'Attempted'}
                        </span>
                      </div>
                      <p className="timeline-desc">
                        {isRecurred
                          ? 'Issue returned after initial temporary success'
                          : isFail
                          ? 'Did not resolve the issue'
                          : isSuccess
                          ? 'Resolved the reported problem'
                          : 'Suggested troubleshooting step'}
                      </p>
                      {item.evidence && (
                        <span className="timeline-evidence">"{item.evidence}"</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Recalled Memory Summary in Timeline */}
              {memories.length > 0 && actionHistory.length === 0 && (
                memories.slice(0, 3).map((mem, idx) => (
                  <div key={`mem-${idx}`} className="timeline-item">
                    <div className="timeline-marker marker-memory">
                      <Sparkles size={11} className="text-ai-sparkle" />
                    </div>
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <span className="timeline-event-title">Previous Interaction</span>
                        <span className="timeline-tag">{mem.type}</span>
                      </div>
                      <p className="timeline-desc">{mem.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MEMORIES TAB */}
        {activeTab === 'memories' && (
          <div className="memories-view">
            <div className="memories-header-row">
              <span className="timeline-subheading">Persistent Memories ({memories.length})</span>
              <button
                onClick={onRefreshMemories}
                className="icon-refresh-btn"
                title="Refresh memories from Hindsight"
                disabled={isRefreshing}
              >
                <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
              </button>
            </div>

            {memories.length === 0 ? (
              <div className="empty-tab-notice">
                <Database size={24} className="text-muted" />
                <p>No prior memories stored for {customerId}. As you troubleshoot, MemoryDesk retains key solutions.</p>
              </div>
            ) : (
              <div className="memory-cards-stream">
                {memories.map((mem, idx) => (
                  <div key={idx} className="memory-entry-card">
                    <div className="memory-card-top">
                      <span className="memory-badge-type">{mem.type.toUpperCase()}</span>
                      {mem.occurred_start && (
                        <span className="memory-date">{mem.occurred_start.split('T')[0]}</span>
                      )}
                    </div>
                    <p className="memory-text-content">{mem.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ATTEMPTS TAB */}
        {activeTab === 'attempts' && (
          <div className="attempts-view">
            <div className="attempts-header-row">
              <span className="timeline-subheading">Chronological Attempts</span>
            </div>

            {actionHistory.length === 0 ? (
              <div className="empty-tab-notice">
                <History size={24} className="text-muted" />
                <p>No troubleshooting attempts recorded yet for this session.</p>
              </div>
            ) : (
              <div className="attempts-list-stream">
                {actionHistory.map((att, idx) => {
                  const isFail = att.status === 'failure';
                  const isSuccess = att.status === 'success';
                  const isRecurred = Boolean(att.recurrence);

                  return (
                    <div key={idx} className="attempt-card-row">
                      <div className="attempt-status-icon">
                        {isRecurred ? (
                          <RotateCcw size={15} className="text-amber" />
                        ) : isFail ? (
                          <XCircle size={15} className="text-rose" />
                        ) : isSuccess ? (
                          <CheckCircle2 size={15} className="text-emerald" />
                        ) : (
                          <Clock size={15} className="text-blue" />
                        )}
                      </div>
                      <div className="attempt-info-body">
                        <div className="attempt-name-row">
                          <span className="attempt-name">{att.action}</span>
                          <span className={`attempt-badge-status status-${att.status}`}>
                            {isRecurred ? 'RECURRED' : att.status.toUpperCase()}
                          </span>
                        </div>
                        {att.evidence && (
                          <span className="attempt-evidence-quote">"{att.evidence}"</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
