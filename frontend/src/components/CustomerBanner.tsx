import React from 'react';
import { ShieldCheck, HardDrive } from 'lucide-react';

interface CustomerBannerProps {
  customerId: string;
  totalMemories: number;
  lastRecalledCount?: number;
  isMemoryRetained?: boolean;
}

export const CustomerBanner: React.FC<CustomerBannerProps> = ({
  customerId,
  totalMemories,
  lastRecalledCount,
  isMemoryRetained,
}) => {
  return (
    <div className="customer-banner">
      <div className="banner-left">
        <div className="customer-avatar-box">
          <span className="avatar-text">{customerId.slice(0, 4)}</span>
        </div>
        <div>
          <div className="banner-title-line">
            <span className="banner-name">Customer Session #{customerId}</span>
            <span className="badge-pill badge-primary">Enterprise Support</span>
            {isMemoryRetained && (
              <span className="badge-pill badge-success animate-fade-in">
                ✓ Memory Retained
              </span>
            )}
          </div>
          <div className="banner-subline">
            <span className="banner-meta-item">
              <HardDrive size={13} className="text-indigo" />
              <span>Hindsight Bank: <strong className="mono text-highlight">customer-{customerId}</strong></span>
            </span>
            <span className="banner-meta-item">
              <ShieldCheck size={13} className="text-emerald" />
              <span>Isolated Memory Partition</span>
            </span>
          </div>
        </div>
      </div>

      <div className="banner-stats-row">
        <div className="stat-card">
          <span className="stat-label">Stored Memories</span>
          <span className="stat-value">{totalMemories}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Last Recalled</span>
          <span className={`stat-value ${lastRecalledCount && lastRecalledCount > 0 ? 'text-indigo-light' : 'text-muted'}`}>
            {lastRecalledCount !== undefined ? `${lastRecalledCount} facts` : 'Ready'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Resolution SLA</span>
          <span className="stat-value text-emerald-light">&lt; 15m</span>
        </div>
      </div>
    </div>
  );
};
