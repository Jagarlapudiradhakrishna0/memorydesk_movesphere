import React from 'react';
import { Search, Bell, Sparkles, AlertCircle } from 'lucide-react';
import type { HealthResponse } from '../types';

interface TopNavbarProps {
  llmInfo?: HealthResponse['llm'];
  isProcessing?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  llmInfo,
  isProcessing,
}) => {
  const isRateLimited = llmInfo?.status === 'rate_limited';

  return (
    <header className="top-navbar">
      {/* Search Bar */}
      <div className="top-navbar-search-block">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search customers, issues, or conversations..."
            className="top-search-input"
          />
          <kbd className="search-shortcut-badge">⌘ K</kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="top-navbar-right">
        {/* Status / Rate limit notice (if active) */}
        {isRateLimited ? (
          <div className="nav-alert-banner">
            <AlertCircle size={14} className="text-amber" />
            <span>AI support temporarily unavailable &bull; Retry in ~{llmInfo?.retryAfterSeconds || 60}s</span>
          </div>
        ) : isProcessing ? (
          <div className="nav-processing-pill">
            <Sparkles size={13} className="spin-slow text-purple" />
            <span>MemoryDesk reasoning...</span>
          </div>
        ) : (
          <div className="nav-active-pill">
            <span className="dot-active live-pulse" />
            <span>AI Memory Active</span>
          </div>
        )}

        {/* Notifications */}
        <button className="top-nav-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-badge-dot" />
        </button>

        {/* User Profile Avatar */}
        <div className="top-nav-user" title="Agent Profile">
          <div className="user-avatar-circle">
            <span>SA</span>
          </div>
        </div>
      </div>
    </header>
  );
};
