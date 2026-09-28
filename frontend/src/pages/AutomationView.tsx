import React from 'react';
import { Zap, Clock, ShieldCheck, Bell } from 'lucide-react';

export const AutomationView: React.FC = () => {
  return (
    <div className="page-view-container animate-fade-in">
      {/* Page Header */}
      <div className="page-view-header">
        <div className="page-header-title-row">
          <div className="page-header-icon-box">
            <Zap size={20} className="text-brand-purple" />
          </div>
          <div>
            <h1 className="page-main-heading">Automation</h1>
            <p className="page-subheading">
              Support automations, recurring follow-ups, and proactive workflow triggers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Callout Card */}
      <div className="coming-soon-card">
        <div className="coming-soon-icon-wrapper">
          <Zap size={32} className="text-brand-purple" />
        </div>
        <span className="coming-soon-badge">Coming Soon</span>
        <h2 className="coming-soon-title">Automated Support Workflows</h2>
        <p className="coming-soon-desc">
          Automated follow-ups and support workflows will be available here.
        </p>

        <div className="automation-preview-grid">
          <div className="preview-item-card">
            <Clock size={18} className="preview-icon text-ai-sparkle" />
            <h4 className="preview-title">Automated Follow-ups</h4>
            <p className="preview-desc">
              Schedule automated checks with customers 24 hours after a recommended resolution.
            </p>
            <span className="preview-status-pill">Planned</span>
          </div>

          <div className="preview-item-card">
            <Bell size={18} className="preview-icon text-amber" />
            <h4 className="preview-title">Recurrence Alerts</h4>
            <p className="preview-desc">
              Trigger instant supervisor notifications when an issue returns for the second time.
            </p>
            <span className="preview-status-pill">Planned</span>
          </div>

          <div className="preview-item-card">
            <ShieldCheck size={18} className="preview-icon text-emerald" />
            <h4 className="preview-title">Resolution Verification</h4>
            <p className="preview-desc">
              Automatically confirm resolution state before closing active support tickets.
            </p>
            <span className="preview-status-pill">Planned</span>
          </div>
        </div>
      </div>
    </div>
  );
};
