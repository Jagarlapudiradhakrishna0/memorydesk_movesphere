import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  MessageSquare,
  Bell,
  Palette,
  ShieldCheck,
  Check
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandMemoriesByDefault, setExpandMemoriesByDefault] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="page-view-container animate-fade-in">
      {/* Page Header */}
      <div className="page-view-header">
        <div className="page-header-title-row">
          <div className="page-header-icon-box">
            <Settings size={20} className="text-brand-purple" />
          </div>
          <div>
            <h1 className="page-main-heading">Settings</h1>
            <p className="page-subheading">
              Manage workspace display, interaction preferences, and notification options.
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="settings-saved-pill animate-fade-in">
            <Check size={14} className="text-emerald" />
            <span>Preferences saved</span>
          </div>
        )}
      </div>

      <div className="settings-sections-scroll">
        {/* SECTION 1: Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Palette size={16} className="text-brand-purple" />
            <h3 className="settings-card-title">Appearance</h3>
          </div>
          <div className="settings-card-body">
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Theme Mode</span>
                <span className="settings-item-desc">
                  Workspace uses the standard SaaS dual-tone palette: Dark Indigo navigation with clean Light workspace.
                </span>
              </div>
              <span className="settings-static-badge">Standard (Active)</span>
            </div>

            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Typography</span>
                <span className="settings-item-desc">
                  System UI font stack (Inter / San Francisco / Segoe UI) optimized for high legibility.
                </span>
              </div>
              <span className="settings-static-badge">System Default</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Conversation Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <MessageSquare size={16} className="text-brand-purple" />
            <h3 className="settings-card-title">Conversation Preferences</h3>
          </div>
          <div className="settings-card-body">
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Send on Enter</span>
                <span className="settings-item-desc">
                  Pressing the Enter key in the message composer immediately sends the message to the customer.
                </span>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={sendOnEnter}
                  onChange={(e) => {
                    setSendOnEnter(e.target.checked);
                    handleSave();
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Auto-scroll to Latest Message</span>
                <span className="settings-item-desc">
                  Automatically smoothly scroll the conversation viewport when new customer or agent turns arrive.
                </span>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => {
                    setAutoScroll(e.target.checked);
                    handleSave();
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Auto-Expand Recalled Memories</span>
                <span className="settings-item-desc">
                  Keep the "Using X relevant memories" drawer open by default when a new agent message is rendered.
                </span>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={expandMemoriesByDefault}
                  onChange={(e) => {
                    setExpandMemoriesByDefault(e.target.checked);
                    handleSave();
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: Notifications */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Bell size={16} className="text-brand-purple" />
            <h3 className="settings-card-title">Notifications</h3>
          </div>
          <div className="settings-card-body">
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Sound Alerts</span>
                <span className="settings-item-desc">
                  Play a subtle tone when the AI completes reasoning and renders a customer response.
                </span>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => {
                    setSoundEnabled(e.target.checked);
                    handleSave();
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-item-label">Desktop Notifications</span>
                <span className="settings-item-desc">
                  Receive browser desktop notifications when a background interaction is updated.
                </span>
              </div>
              <span className="settings-static-badge badge-planned">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: Architecture & Deployment Configuration */}
        <div className="settings-card">
          <div className="settings-card-header">
            <ShieldCheck size={16} className="text-emerald" />
            <h3 className="settings-card-title">System Architecture</h3>
          </div>
          <div className="settings-card-body">
            <div className="settings-note-box">
              <Sliders size={16} className="text-brand-purple" />
              <div className="note-text">
                <strong>Backend Environment Isolation</strong>
                <p>
                  API configurations, LLM reasoning parameters, and Hindsight cloud connection keys are isolated and
                  maintained securely via server environment variables. Technical credentials are never exposed in the
                  frontend workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
