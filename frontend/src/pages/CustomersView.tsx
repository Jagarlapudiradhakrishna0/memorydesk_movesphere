import React from 'react';
import { Users, ArrowRight, Smartphone, Clock, Database, CheckCircle2 } from 'lucide-react';
import type { SupportApiResponse, RecalledMemoryItem } from '../types';

interface CustomersViewProps {
  currentCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  activeInteractionState?: SupportApiResponse['interactionState'];
  allMemories: RecalledMemoryItem[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  currentCustomerId,
  onSelectCustomer,
  activeInteractionState,
  allMemories,
}) => {
  const currentCase = activeInteractionState?.currentCase;
  const currentProblem = activeInteractionState?.problem || currentCase?.problem || null;
  const device = activeInteractionState?.device || currentCase?.device || null;
  const os = activeInteractionState?.operatingSystem || currentCase?.operatingSystem || null;
  const envInfo = [device, os].filter(Boolean).join(' • ') || 'Environment not detected';

  // Customer profiles available in MemoryDesk
  const customerList = [
    {
      id: 'C001',
      email: 'c001@example.com',
      status: currentCustomerId === 'C001' ? 'Active' : 'Available',
      currentIssue: currentCustomerId === 'C001' && currentProblem ? currentProblem : 'Session available',
      deviceInfo: currentCustomerId === 'C001' && envInfo !== 'Environment not detected' ? envInfo : 'Customer profile',
      memoryCount: currentCustomerId === 'C001' ? allMemories.length : undefined,
      lastActive: currentCustomerId === 'C001' ? 'Active now' : 'Persistent bank',
      isCurrent: currentCustomerId === 'C001',
    },
    {
      id: 'C002',
      email: 'c002@example.com',
      status: currentCustomerId === 'C002' ? 'Active' : 'Available',
      currentIssue: currentCustomerId === 'C002' && currentProblem ? currentProblem : 'No active issue reported',
      deviceInfo: currentCustomerId === 'C002' && envInfo !== 'Environment not detected' ? envInfo : 'Customer profile',
      memoryCount: currentCustomerId === 'C002' ? allMemories.length : undefined,
      lastActive: currentCustomerId === 'C002' ? 'Active now' : 'Persistent bank',
      isCurrent: currentCustomerId === 'C002',
    },
    {
      id: 'C003',
      email: 'c003@example.com',
      status: currentCustomerId === 'C003' ? 'Active' : 'Available',
      currentIssue: currentCustomerId === 'C003' && currentProblem ? currentProblem : 'No active issue reported',
      deviceInfo: currentCustomerId === 'C003' && envInfo !== 'Environment not detected' ? envInfo : 'Customer profile',
      memoryCount: currentCustomerId === 'C003' ? allMemories.length : undefined,
      lastActive: currentCustomerId === 'C003' ? 'Active now' : 'Persistent bank',
      isCurrent: currentCustomerId === 'C003',
    },
  ];

  return (
    <div className="page-view-container animate-fade-in">
      {/* Page Header */}
      <div className="page-view-header">
        <div className="page-header-title-row">
          <div className="page-header-icon-box">
            <Users size={20} className="text-brand-purple" />
          </div>
          <div>
            <h1 className="page-main-heading">Customers</h1>
            <p className="page-subheading">
              Select a customer profile to open their dedicated support session and long-term memory history.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="customers-list-grid">
        {customerList.map((customer) => (
          <div
            key={customer.id}
            className={`customer-card ${customer.isCurrent ? 'customer-card-current' : ''}`}
          >
            <div className="customer-card-header">
              <div className="customer-avatar-large">
                <span>{customer.id.charAt(0)}</span>
              </div>
              <div className="customer-meta-block">
                <div className="customer-title-row">
                  <h3 className="customer-name-heading">Customer {customer.id}</h3>
                  <span className={`status-pill-badge ${customer.isCurrent ? 'badge-active' : 'badge-available'}`}>
                    <span className="dot-mini" />
                    {customer.status}
                  </span>
                </div>
                <span className="customer-email-sub">{customer.email}</span>
              </div>
            </div>

            <div className="customer-card-body">
              <div className="customer-info-row">
                <span className="info-row-label">Current Issue:</span>
                <span className="info-row-value">{customer.currentIssue}</span>
              </div>

              <div className="customer-info-chips">
                <span className="info-chip">
                  <Smartphone size={12} className="text-secondary" />
                  {customer.deviceInfo}
                </span>
                <span className="info-chip">
                  <Database size={12} className="text-ai-sparkle" />
                  {customer.memoryCount !== undefined ? `${customer.memoryCount} Memories` : 'Hindsight Bank'}
                </span>
                <span className="info-chip">
                  <Clock size={12} className="text-secondary" />
                  {customer.lastActive}
                </span>
              </div>
            </div>

            <div className="customer-card-footer">
              <button
                type="button"
                className={`customer-select-btn ${customer.isCurrent ? 'btn-primary-action' : 'btn-secondary-action'}`}
                onClick={() => onSelectCustomer(customer.id)}
                aria-label={`Open support workspace for Customer ${customer.id}`}
              >
                {customer.isCurrent ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Active Session (Open Workspace)</span>
                  </>
                ) : (
                  <>
                    <span>Switch to Customer {customer.id}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
