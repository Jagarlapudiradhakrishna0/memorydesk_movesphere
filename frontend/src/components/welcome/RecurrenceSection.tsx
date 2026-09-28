import React from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, RotateCcw, Database, Sparkles } from 'lucide-react';

export const RecurrenceSection: React.FC = () => {
  return (
    <section id="recurrence" className="welcome-section">
      <div className="welcome-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-label-tag">WHEN THE PROBLEM COMES BACK</span>
          <h2 className="section-main-heading">The support doesn't start over.</h2>
          <p className="section-subheading-text">
            When an issue recurs after a previous resolution, MemoryDesk identifies the recurrence, preserves past
            successes and failures, and picks up right where you left off.
          </p>
        </div>

        {/* Horizontal Recurrence Timeline */}
        <div className="recurrence-timeline-wrapper">
          <div className="recurrence-timeline-track">
            {/* Step 1: First Occurrence */}
            <div className="timeline-step-card">
              <span className="timeline-step-label">Initial Session</span>
              <h4 className="timeline-step-title">Problem Reported</h4>
              <p className="timeline-step-action">Instagram crashes on launch</p>
              <div className="timeline-status-badge text-secondary">
                <span>Working Case Created</span>
              </div>
            </div>

            <div className="timeline-arrow-sep">
              <ArrowRight size={16} />
            </div>

            {/* Step 2: Attempt 1 */}
            <div className="timeline-step-card">
              <span className="timeline-step-label">Attempt #1</span>
              <h4 className="timeline-step-title">Reinstall Application</h4>
              <p className="timeline-step-action">Customer: "Still crashes after reinstall"</p>
              <div className="timeline-status-badge status-badge-failed">
                <AlertCircle size={13} />
                <span>Failed</span>
              </div>
            </div>

            <div className="timeline-arrow-sep">
              <ArrowRight size={16} />
            </div>

            {/* Step 3: Attempt 2 */}
            <div className="timeline-step-card">
              <span className="timeline-step-label">Attempt #2</span>
              <h4 className="timeline-step-title">Reset Settings</h4>
              <p className="timeline-step-action">Customer: "That fixed it!"</p>
              <div className="timeline-status-badge status-badge-success">
                <CheckCircle2 size={13} />
                <span>Successful</span>
              </div>
            </div>

            <div className="timeline-arrow-sep">
              <ArrowRight size={16} />
            </div>

            {/* Step 4: Later Recurrence */}
            <div className="timeline-step-card" style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}>
              <span className="timeline-step-label">Days Later</span>
              <h4 className="timeline-step-title">Problem Returns</h4>
              <p className="timeline-step-action">"It started crashing again."</p>
              <div className="timeline-status-badge status-badge-recurrence">
                <RotateCcw size={13} />
                <span>Recurrence Detected</span>
              </div>
            </div>

            <div className="timeline-arrow-sep">
              <ArrowRight size={16} />
            </div>

            {/* Step 5: MemoryDesk Context Recalled */}
            <div className="timeline-step-card" style={{ borderColor: 'rgba(139, 92, 255, 0.4)' }}>
              <span className="timeline-step-label">MemoryDesk AI</span>
              <h4 className="timeline-step-title">History Recalled</h4>
              <p className="timeline-step-action">iPhone 15, iOS 26, reinstall failed</p>
              <div className="timeline-status-badge" style={{ color: '#c084fc' }}>
                <Database size={13} />
                <span>Hindsight Recalled</span>
              </div>
            </div>

            <div className="timeline-arrow-sep">
              <ArrowRight size={16} />
            </div>

            {/* Step 6: Current Support */}
            <div className="timeline-step-card" style={{ borderColor: 'rgba(34, 197, 94, 0.4)' }}>
              <span className="timeline-step-label">Current Support</span>
              <h4 className="timeline-step-title">Immediate Resolution</h4>
              <p className="timeline-step-action">Skips known questions; applies reset</p>
              <div className="timeline-status-badge status-badge-success">
                <Sparkles size={13} />
                <span>Zero Repeated Questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
