import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import type { RecalledMemoryItem, SupportApiResponse } from '../types';

interface RightSidebarProps {
  lastRecalledMemories: RecalledMemoryItem[];
  activeInteractionState?: SupportApiResponse['interactionState'];
  onActionSelect?: (actionText: string) => void;
  onViewAllMemories?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  lastRecalledMemories,
  activeInteractionState,
  onActionSelect,
  onViewAllMemories,
}) => {
  const currentCase = activeInteractionState?.currentCase;

  // Next recommended action (Hero Card)
  const suggestedActions =
    activeInteractionState?.suggestedActions ||
    currentCase?.suggestedActions ||
    [];

  const nextActionTitle = suggestedActions.length > 0 ? suggestedActions[0] : null;

  // Escalation detection
  const isEscalation = Boolean(
    activeInteractionState?.escalationRecommended ||
    currentCase?.escalationRecommended ||
    activeInteractionState?.mode === 'escalate' ||
    currentCase?.mode === 'escalate'
  );

  const escalationReason =
    activeInteractionState?.escalationReason ||
    currentCase?.escalationReason ||
    'Issue persists after multiple troubleshooting attempts.';

  // Action history
  const actionHistory =
    activeInteractionState?.actionHistory ||
    currentCase?.actionHistory ||
    [];

  // Translated AI Insights
  const confidence = activeInteractionState?.diagnosisConfidence || 'medium';
  const confidenceLabel =
    confidence === 'high'
      ? 'Likely cause identified'
      : confidence === 'medium'
      ? 'Cause narrowed down'
      : 'Gathering information';

  const mode = activeInteractionState?.mode || currentCase?.mode || 'clarify';
  const modeLabel =
    mode === 'solve'
      ? 'Ready to troubleshoot'
      : mode === 'diagnose'
      ? 'Diagnosing issue'
      : mode === 'follow_up'
      ? 'Verifying resolution'
      : mode === 'escalate'
      ? 'Escalation required'
      : 'Information gathering';

  const symptoms = activeInteractionState?.symptoms || currentCase?.symptoms || [];

  return (
    <aside className="ai-context-sidebar">
      {/* ── SECTION 1: AI INSIGHTS ── */}
      <div className="sidebar-card ai-insights-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Sparkles size={15} className="text-ai-sparkle" />
            <h3 className="card-title">AI Insights</h3>
          </div>
          <span className="badge-ai-live">Active</span>
        </div>

        <div className="insights-metrics-grid">
          <div className="insight-metric-block">
            <span className="metric-label">Diagnosis State</span>
            <span className="metric-value text-emerald">{confidenceLabel}</span>
          </div>

          <div className="insight-metric-block">
            <span className="metric-label">Support Stage</span>
            <span className="metric-value text-purple">{modeLabel}</span>
          </div>
        </div>

        {symptoms.length > 0 && (
          <div className="insights-topics-section">
            <span className="topics-label">Confirmed Symptoms:</span>
            <div className="topics-pill-wrap">
              {symptoms.map((sym, idx) => (
                <span key={idx} className="topic-pill">
                  {sym}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: NEXT RECOMMENDED ACTION (HERO CARD) ── */}
      {nextActionTitle && (
        <div className="sidebar-card next-action-hero-card">
          <div className="card-header-row">
            <span className="hero-section-badge">NEXT RECOMMENDED ACTION</span>
          </div>

          <h4 className="next-action-hero-title">{nextActionTitle}</h4>
          <p className="next-action-hero-desc">
            Recommended step based on customer environment and previously attempted solutions.
          </p>

          <button
            className="hero-action-btn"
            onClick={() => onActionSelect && onActionSelect(nextActionTitle)}
          >
            <Send size={14} />
            <span>Send steps to customer</span>
          </button>
        </div>
      )}

      {/* ── SECTION 3: ESCALATION (ONLY IF RECOMMENDED) ── */}
      {isEscalation && (
        <div className="sidebar-card escalation-card animate-fade-in">
          <div className="escalation-header-row">
            <AlertTriangle size={16} className="text-amber" />
            <span className="escalation-badge">ESCALATION RECOMMENDED</span>
          </div>

          <h4 className="escalation-title">Escalate to Tier 2 Engineering</h4>
          <p className="escalation-reason-text">{escalationReason}</p>

          <button
            className="escalate-action-btn"
            onClick={() => onActionSelect && onActionSelect('Escalating case to Tier 2 technical engineering team.')}
          >
            <span>Escalate Case</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── SECTION 4: PREVIOUS ATTEMPTS ── */}
      <div className="sidebar-card previous-attempts-card">
        <div className="card-header-row">
          <h3 className="card-title">Previous Attempts</h3>
          <span className="count-pill">{actionHistory.length}</span>
        </div>

        {actionHistory.length === 0 ? (
          <p className="sidebar-empty-text">No actions attempted yet in this session.</p>
        ) : (
          <div className="attempts-mini-list">
            {actionHistory.map((att, idx) => {
              const isFail = att.status === 'failure';
              const isSuccess = att.status === 'success';
              const isRecurred = Boolean(att.recurrence);

              return (
                <div key={idx} className="attempt-mini-row">
                  <div className={`mini-status-dot ${isFail ? 'dot-fail' : isSuccess ? 'dot-success' : 'dot-pending'}`}>
                    {isRecurred ? (
                      <RotateCcw size={11} className="text-amber" />
                    ) : isFail ? (
                      <XCircle size={11} className="text-rose" />
                    ) : isSuccess ? (
                      <Check size={11} className="text-emerald" />
                    ) : (
                      <Clock size={11} className="text-blue" />
                    )}
                  </div>
                  <div className="mini-attempt-meta">
                    <span className="mini-attempt-title">{att.action}</span>
                    <span className="mini-attempt-desc">
                      {isRecurred
                        ? 'Worked temporarily; later recurred'
                        : isFail
                        ? 'Did not resolve the issue'
                        : isSuccess
                        ? 'Resolved issue'
                        : 'Suggested step'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 5: RELEVANT MEMORIES ── */}
      <div className="sidebar-card relevant-memories-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <h3 className="card-title">Relevant Memories</h3>
            <span className="count-pill">{lastRecalledMemories.length}</span>
          </div>
          {onViewAllMemories && (
            <button onClick={onViewAllMemories} className="card-link-btn">
              <span>View all</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {lastRecalledMemories.length === 0 ? (
          <p className="sidebar-empty-text">
            No memories recalled for this specific turn. Memories are automatically recalled when relevant to the issue.
          </p>
        ) : (
          <div className="memories-mini-stream">
            {lastRecalledMemories.slice(0, 4).map((mem, idx) => (
              <div key={idx} className="memory-mini-item">
                <div className="memory-mini-top">
                  <span className="memory-mini-tag">{mem.type}</span>
                  {mem.score && (
                    <span className="memory-score-tag">
                      <CheckCircle2 size={10} className="text-emerald" />
                      Relevant
                    </span>
                  )}
                </div>
                <p className="memory-mini-text">{mem.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
