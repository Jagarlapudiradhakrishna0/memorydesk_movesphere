import React, { useState } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Tag,
  Clock
} from 'lucide-react';
import type { RecalledMemoryItem } from '../types';

interface MemoryBankViewProps {
  currentCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onNavigateToSupport: () => void;
  memories: RecalledMemoryItem[];
  onRefreshMemories: () => void;
  isRefreshing: boolean;
}

export const MemoryBankView: React.FC<MemoryBankViewProps> = ({
  currentCustomerId,
  onSelectCustomer,
  onNavigateToSupport,
  memories,
  onRefreshMemories,
  isRefreshing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const customerOptions = ['C001', 'C002', 'C003'];

  // Filter memories by search term and type
  const filteredMemories = memories.filter((mem) => {
    const matchesSearch =
      searchTerm === '' ||
      mem.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mem.context && mem.context.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedType === 'all' ||
      mem.type.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const experienceCount = memories.filter((m) => m.type === 'experience').length;
  const worldCount = memories.filter((m) => m.type === 'world').length;
  const observationCount = memories.filter((m) => m.type === 'observation').length;

  return (
    <div className="page-view-container animate-fade-in">
      {/* Page Header */}
      <div className="page-view-header">
        <div className="page-header-title-row">
          <div className="page-header-icon-box">
            <Database size={20} className="text-brand-purple" />
          </div>
          <div>
            <h1 className="page-main-heading">Memory Bank</h1>
            <p className="page-subheading">
              Persistent cross-session memories remembered for customer {currentCustomerId}.
            </p>
          </div>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="action-btn-neutral"
            onClick={onRefreshMemories}
            disabled={isRefreshing}
            title="Refresh memories from Hindsight"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Memories'}</span>
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={onNavigateToSupport}
          >
            <MessageSquare size={14} />
            <span>Open Support Conversation</span>
          </button>
        </div>
      </div>

      {/* Customer Switcher and Stats Bar */}
      <div className="memory-bank-toolbar">
        <div className="customer-select-group">
          <span className="toolbar-label">Customer Profile:</span>
          <div className="customer-pills-row">
            {customerOptions.map((id) => (
              <button
                key={id}
                type="button"
                className={`customer-pill-btn ${currentCustomerId === id ? 'pill-btn-active' : ''}`}
                onClick={() => onSelectCustomer(id)}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <div className="memory-type-filters">
          <button
            type="button"
            className={`filter-chip ${selectedType === 'all' ? 'filter-chip-active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All ({memories.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${selectedType === 'experience' ? 'filter-chip-active' : ''}`}
            onClick={() => setSelectedType('experience')}
          >
            Experience ({experienceCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${selectedType === 'world' ? 'filter-chip-active' : ''}`}
            onClick={() => setSelectedType('world')}
          >
            World ({worldCount})
          </button>
          {observationCount > 0 && (
            <button
              type="button"
              className={`filter-chip ${selectedType === 'observation' ? 'filter-chip-active' : ''}`}
              onClick={() => setSelectedType('observation')}
            >
              Observation ({observationCount})
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="memory-search-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${memories.length} memories for customer ${currentCustomerId}...`}
          className="memory-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Memories Cards Stream */}
      <div className="memory-bank-content-scroll">
        {filteredMemories.length === 0 ? (
          <div className="empty-memory-state">
            <Sparkles size={28} className="text-ai-sparkle" />
            <h3 className="empty-memory-title">
              {memories.length === 0
                ? `No memories stored yet for customer ${currentCustomerId}`
                : 'No matching memories found'}
            </h3>
            <p className="empty-memory-desc">
              {memories.length === 0
                ? 'As you converse with this customer, MemoryDesk automatically extracts and retains key solutions and facts.'
                : 'Try adjusting your search keywords or clearing filters.'}
            </p>
          </div>
        ) : (
          <div className="memories-grid-layout">
            {filteredMemories.map((mem, idx) => {
              const formattedDate = mem.occurred_start
                ? mem.occurred_start.split('T')[0]
                : mem.mentioned_at
                ? mem.mentioned_at.split('T')[0]
                : 'Recorded interaction';

              return (
                <div key={idx} className="memory-detail-card">
                  <div className="memory-detail-header">
                    <div className="memory-detail-tags">
                      <span className={`memory-type-pill type-${mem.type}`}>
                        {mem.type.toUpperCase()}
                      </span>
                      {mem.context && (
                        <span className="memory-context-pill">
                          <Tag size={10} />
                          {mem.context}
                        </span>
                      )}
                    </div>
                    <span className="memory-timestamp-label">
                      <Clock size={11} />
                      {formattedDate}
                    </span>
                  </div>

                  <p className="memory-detail-text">{mem.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
