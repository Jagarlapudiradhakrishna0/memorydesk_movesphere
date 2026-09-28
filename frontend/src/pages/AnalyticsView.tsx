import React from 'react';
import {
  BarChart3,
  Users,
  Database,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { SupportApiResponse, RecalledMemoryItem, ChatMessage } from '../types';

interface AnalyticsViewProps {
  currentCustomerId: string;
  allMemories: RecalledMemoryItem[];
  activeInteractionState?: SupportApiResponse['interactionState'];
  messages: ChatMessage[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentCustomerId,
  allMemories,
  activeInteractionState,
  messages,
}) => {
  const currentCase = activeInteractionState?.currentCase;
  const actionHistory =
    activeInteractionState?.actionHistory ||
    currentCase?.actionHistory ||
    [];

  const isEscalated = Boolean(
    activeInteractionState?.escalationRecommended ||
    currentCase?.escalationRecommended ||
    activeInteractionState?.mode === 'escalate' ||
    currentCase?.mode === 'escalate'
  );

  // Derived real metrics
  const totalCustomersTracked = 3;
  const totalMemories = allMemories.length;
  const totalTurns = currentCase?.turnCount || (messages.length > 0 ? Math.ceil(messages.length / 2) : 0);
  const successCount = actionHistory.filter((a) => a.status === 'success').length;
  const failureCount = actionHistory.filter((a) => a.status === 'failure').length;
  const recurrenceCount = actionHistory.filter((a) => a.recurrence).length;

  const hasActivity = totalTurns > 0 || actionHistory.length > 0 || totalMemories > 0;

  return (
    <div className="page-view-container animate-fade-in">
      {/* Page Header */}
      <div className="page-view-header">
        <div className="page-header-title-row">
          <div className="page-header-icon-box">
            <BarChart3 size={20} className="text-brand-purple" />
          </div>
          <div>
            <h1 className="page-main-heading">Analytics</h1>
            <p className="page-subheading">
              Operational metrics directly derived from active customer support sessions and memory state.
            </p>
          </div>
        </div>
      </div>

      {/* Real Metrics Grid */}
      <div className="analytics-metrics-grid">
        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Tracked Customers</span>
            <Users size={16} className="text-brand-purple" />
          </div>
          <div className="metric-card-value">{totalCustomersTracked}</div>
          <span className="metric-card-caption">Available profiles (C001, C002, C003)</span>
        </div>

        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Retained Memories</span>
            <Database size={16} className="text-ai-sparkle" />
          </div>
          <div className="metric-card-value">{totalMemories}</div>
          <span className="metric-card-caption">Active profile ({currentCustomerId})</span>
        </div>

        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Session Interactions</span>
            <span className="count-pill">{totalTurns}</span>
          </div>
          <div className="metric-card-value">{totalTurns}</div>
          <span className="metric-card-caption">Dialogue turns this session</span>
        </div>

        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Successful Actions</span>
            <CheckCircle2 size={16} className="text-emerald" />
          </div>
          <div className="metric-card-value text-emerald">{successCount}</div>
          <span className="metric-card-caption">Confirmed customer resolutions</span>
        </div>

        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Unresolved Attempts</span>
            <XCircle size={16} className="text-rose" />
          </div>
          <div className="metric-card-value text-rose">{failureCount}</div>
          <span className="metric-card-caption">Recorded troubleshooting failures</span>
        </div>

        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Recurrences Detected</span>
            <RotateCcw size={16} className="text-amber" />
          </div>
          <div className="metric-card-value text-amber">{recurrenceCount}</div>
          <span className="metric-card-caption">Issues recurred after prior fix</span>
        </div>

        <div className="analytics-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Escalation Status</span>
            <AlertTriangle size={16} className={isEscalated ? 'text-amber' : 'text-secondary'} />
          </div>
          <div className={`metric-card-value ${isEscalated ? 'text-amber' : 'text-emerald'}`}>
            {isEscalated ? 'Tier 2 Required' : 'Standard'}
          </div>
          <span className="metric-card-caption">
            {isEscalated ? 'Escalation triggered by case state' : 'Managed in frontline support'}
          </span>
        </div>
      </div>

      {/* Action History or Notice */}
      {!hasActivity ? (
        <div className="analytics-empty-notice">
          <Info size={24} className="text-muted" />
          <h3>Analytics will appear as more customer interactions are recorded</h3>
          <p>
            Start a support conversation to record diagnostic steps, outcome attributions, and recurrence patterns.
          </p>
        </div>
      ) : actionHistory.length > 0 ? (
        <div className="analytics-history-section">
          <h3 className="section-title">Session Outcome Attribution Record</h3>
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Troubleshooting Action</th>
                  <th>Outcome Status</th>
                  <th>Customer Evidence Quote</th>
                  <th>Recurrence</th>
                </tr>
              </thead>
              <tbody>
                {actionHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{item.action}</td>
                    <td>
                      <span className={`status-pill-badge status-${item.status}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="italic-text">
                      {item.evidence ? `"${item.evidence}"` : '—'}
                    </td>
                    <td>
                      {item.recurrence ? (
                        <span className="text-amber font-semibold">Yes (Recurred)</span>
                      ) : (
                        <span className="text-muted">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
