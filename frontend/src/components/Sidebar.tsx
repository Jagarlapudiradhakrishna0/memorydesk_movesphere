import React from 'react';
import {
  MessageSquare,
  Users,
  Database,
  BarChart3,
  Zap,
  Settings,
  Sparkles,
  Bot
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
}

interface SidebarProps {
  activeTab?: string;
  onTabSelect?: (tabId: string, path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'support',
  onTabSelect,
}) => {
  const navItems: NavItem[] = [
    { id: 'support', label: 'Support', icon: MessageSquare, path: '/support' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'memory', label: 'Memory Bank', icon: Database, path: '/memory' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'automation', label: 'Automation', icon: Zap, path: '/automation' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="app-sidebar" aria-label="Sidebar Navigation">
      {/* Brand Header */}
      <div className="sidebar-brand-section">
        <div className="sidebar-brand-row">
          <div className="sidebar-logo-glow">
            <Bot size={22} className="text-brand-purple" />
          </div>
          <div className="sidebar-brand-text">
            <h1 className="sidebar-brand-name">MemoryDesk</h1>
            <p className="sidebar-brand-tagline">Support that remembers.</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav" aria-label="Primary Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => onTabSelect && onTabSelect(item.id, item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} className="nav-item-icon" />
              <span className="nav-item-label">{item.label}</span>
              {isActive && <span className="nav-item-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* AI Memory Callout Card */}
      <div className="sidebar-ai-card">
        <div className="ai-card-glow" />
        <div className="ai-card-header">
          <div className="ai-card-icon-wrap">
            <Sparkles size={16} className="text-ai-sparkle" />
          </div>
          <span className="ai-card-badge">AI Native</span>
        </div>
        <h4 className="ai-card-title">AI-Powered Support</h4>
        <p className="ai-card-description">
          Cross-session memory automatically recalls customer history and outcomes.
        </p>
      </div>

      {/* User / Agent Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-agent-avatar">
          <span>SA</span>
          <span className="agent-online-dot" />
        </div>
        <div className="sidebar-agent-info">
          <span className="agent-name">Support Agent</span>
          <span className="agent-status-label">Online</span>
        </div>
      </div>
    </aside>
  );
};
