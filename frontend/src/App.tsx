import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { CustomerContextPanel } from './components/CustomerContextPanel';
import { ConversationArea } from './components/ConversationArea';
import { RightSidebar } from './components/RightSidebar';
import { CustomersView } from './pages/CustomersView';
import { MemoryBankView } from './pages/MemoryBankView';
import { AnalyticsView } from './pages/AnalyticsView';
import { AutomationView } from './pages/AutomationView';
import { SettingsView } from './pages/SettingsView';
import { api } from './services/api';
import type {
  ChatMessage,
  RecalledMemoryItem,
  SupportApiResponse,
  HealthResponse,
} from './types';

// Map URL paths to navigation tab IDs
const pathToTab = (pathname: string): string => {
  const p = pathname.toLowerCase();
  if (p.startsWith('/customers')) return 'customers';
  if (p.startsWith('/memory-bank') || p.startsWith('/memory')) return 'memory';
  if (p.startsWith('/analytics')) return 'analytics';
  if (p.startsWith('/automation')) return 'automation';
  if (p.startsWith('/settings')) return 'settings';
  return 'support';
};

const tabToPath: Record<string, string> = {
  support: '/support',
  customers: '/customers',
  memory: '/memory',
  'memory-bank': '/memory',
  analytics: '/analytics',
  automation: '/automation',
  settings: '/settings',
};

export const App: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<string>(() => pathToTab(window.location.pathname));
  const [customerId, setCustomerId] = useState<string>('C001');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allMemories, setAllMemories] = useState<RecalledMemoryItem[]>([]);
  const [lastRecalledMemories, setLastRecalledMemories] = useState<RecalledMemoryItem[]>([]);
  const [activeInteractionState, setActiveInteractionState] = useState<SupportApiResponse['interactionState']>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [llmInfo, setLlmInfo] = useState<HealthResponse['llm'] | undefined>(undefined);
  const [forcedContextTab, setForcedContextTab] = useState<'timeline' | 'memories' | 'attempts' | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [mobileSupportTab, setMobileSupportTab] = useState<'conversation' | 'context' | 'insights'>('conversation');

  // ── Navigation Router ──
  const navigateTo = useCallback((tabId: string, pathOverride?: string) => {
    setSidebarTab(tabId);
    const targetPath = pathOverride || tabToPath[tabId] || '/support';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: tabId }, '', targetPath);
    }
  }, []);

  // Listen for browser Back and Forward button events
  useEffect(() => {
    const handlePopState = () => {
      const activeTab = pathToTab(window.location.pathname);
      setSidebarTab(activeTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Health check to detect rate limits or backend status
  const checkHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      if (data.llm) {
        setLlmInfo(data.llm);
      }
    } catch {
      // Backend temporarily unreachable
    }
  }, []);

  // Fetch memory bank for current customer
  const fetchCustomerMemories = useCallback(async (id: string) => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      const data = await api.getCustomerMemories(id);
      setAllMemories(data.memories || []);
    } catch (err: any) {
      console.warn('Failed to fetch memories:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchCustomerMemories(customerId);

    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, fetchCustomerMemories, customerId]);

  const handleCustomerIdChange = (newId: string) => {
    const formatted = newId.trim().toUpperCase();
    setCustomerId(formatted);
    setError(null);
    setMessages([]); // Conversation resets clean on customer switch
    setLastRecalledMemories([]);
    setActiveInteractionState(undefined);
    setForcedContextTab('timeline');
    fetchCustomerMemories(formatted);
  };

  const handleSelectCustomerAndOpenSupport = (newId: string) => {
    handleCustomerIdChange(newId);
    navigateTo('support');
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message to conversation
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'customer',
      text,
      timestamp: timeString,
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsLoading(true);
    setLoadingStage('MemoryDesk reasoning...');

    try {
      const data = await api.sendMessage(customerId, text);

      const recalled = data.recalledMemories || [];
      setLastRecalledMemories(recalled);
      setActiveInteractionState(data.interactionState);

      // 2. Add Agent message to conversation
      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recalledMemoriesCount: recalled.length,
        recalledMemories: recalled,
        rawContext: data.rawContext,
        memorySaved: data.memorySaved,
        mode: data.mode,
        reason: data.reason,
        suggestedActions: data.suggestedActions,
        needsMoreInformation: data.needsMoreInformation,
        interactionState: data.interactionState,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Refresh memory list after short delay for Hindsight indexing
      setTimeout(() => {
        fetchCustomerMemories(customerId);
      }, 2000);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err?.message || 'Could not reach backend API.');
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    setActiveInteractionState(undefined);
    setLastRecalledMemories([]);
    try {
      await api.resetCase(customerId);
    } catch (err) {
      console.warn('Failed to reset case state:', err);
    }
  };

  const handleActionSelect = (actionText: string) => {
    setMobileSupportTab('conversation');
    handleSendMessage(actionText);
  };

  const handleViewAllMemories = () => {
    navigateTo('memory');
  };

  return (
    <div className="memorydesk-layout">
      {/* LEFT: Navigation Sidebar */}
      <Sidebar
        activeTab={sidebarTab}
        onTabSelect={(tabId, path) => navigateTo(tabId, path)}
        isOpenOnMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* MAIN CONTAINER */}
      <div className="memorydesk-main-container">
        {/* TOP: Header Bar */}
        <TopNavbar
          llmInfo={llmInfo}
          isProcessing={isLoading}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* WORKSPACE CONTENT ROUTER */}
        {sidebarTab === 'support' && (
          <div className="workspace-support-container">
            {/* Mobile View Switcher Tabs (Only visible on mobile <= 768px) */}
            <div className="mobile-support-tabs-bar" role="tablist" aria-label="Support sections">
              <button
                type="button"
                role="tab"
                aria-selected={mobileSupportTab === 'conversation'}
                className={`mobile-tab-btn ${mobileSupportTab === 'conversation' ? 'mobile-tab-active' : ''}`}
                onClick={() => setMobileSupportTab('conversation')}
              >
                <span>💬 Chat</span>
                {messages.length > 0 && <span className="mobile-tab-badge">{messages.length}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileSupportTab === 'context'}
                className={`mobile-tab-btn ${mobileSupportTab === 'context' ? 'mobile-tab-active' : ''}`}
                onClick={() => setMobileSupportTab('context')}
              >
                <span>👤 Customer</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileSupportTab === 'insights'}
                className={`mobile-tab-btn ${mobileSupportTab === 'insights' ? 'mobile-tab-active' : ''}`}
                onClick={() => setMobileSupportTab('insights')}
              >
                <span>✨ AI Insights</span>
                {lastRecalledMemories.length > 0 && (
                  <span className="mobile-tab-badge badge-sparkle">{lastRecalledMemories.length}</span>
                )}
              </button>
            </div>

            <main className={`memorydesk-workspace-grid mobile-show-${mobileSupportTab}`}>
              {/* COLUMN 1: Customer Context & Timeline (Left) */}
              <section
                className={`workspace-col col-customer-context ${mobileSupportTab === 'context' ? 'mobile-col-active' : ''}`}
                aria-label="Customer Context"
              >
                <CustomerContextPanel
                  customerId={customerId}
                  onCustomerIdChange={handleCustomerIdChange}
                  memories={allMemories}
                  activeInteractionState={activeInteractionState}
                  onRefreshMemories={() => fetchCustomerMemories(customerId)}
                  isRefreshing={isRefreshing}
                  forcedTab={forcedContextTab}
                />
              </section>

              {/* COLUMN 2: Central Support Conversation (Center Focus) */}
              <section
                className={`workspace-col col-conversation ${mobileSupportTab === 'conversation' ? 'mobile-col-active' : ''}`}
                aria-label="Support Conversation"
              >
                <ConversationArea
                  customerId={customerId}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  loadingStage={loadingStage}
                  error={error}
                  onClearChat={handleClearChat}
                  llmInfo={llmInfo}
                />
              </section>

              {/* COLUMN 3: AI Context / Memories / Actions (Right) */}
              <section
                className={`workspace-col col-ai-context ${mobileSupportTab === 'insights' ? 'mobile-col-active' : ''}`}
                aria-label="AI Context and Actions"
              >
                <RightSidebar
                  lastRecalledMemories={lastRecalledMemories}
                  activeInteractionState={activeInteractionState}
                  onActionSelect={handleActionSelect}
                  onViewAllMemories={handleViewAllMemories}
                />
              </section>
            </main>
          </div>
        )}

        {sidebarTab === 'customers' && (
          <main className="memorydesk-page-wrapper">
            <CustomersView
              currentCustomerId={customerId}
              onSelectCustomer={handleSelectCustomerAndOpenSupport}
              activeInteractionState={activeInteractionState}
              allMemories={allMemories}
            />
          </main>
        )}

        {sidebarTab === 'memory' && (
          <main className="memorydesk-page-wrapper">
            <MemoryBankView
              currentCustomerId={customerId}
              onSelectCustomer={handleCustomerIdChange}
              onNavigateToSupport={() => navigateTo('support')}
              memories={allMemories}
              onRefreshMemories={() => fetchCustomerMemories(customerId)}
              isRefreshing={isRefreshing}
            />
          </main>
        )}

        {sidebarTab === 'analytics' && (
          <main className="memorydesk-page-wrapper">
            <AnalyticsView
              currentCustomerId={customerId}
              allMemories={allMemories}
              activeInteractionState={activeInteractionState}
              messages={messages}
            />
          </main>
        )}

        {sidebarTab === 'automation' && (
          <main className="memorydesk-page-wrapper">
            <AutomationView />
          </main>
        )}

        {sidebarTab === 'settings' && (
          <main className="memorydesk-page-wrapper">
            <SettingsView />
          </main>
        )}
      </div>
    </div>
  );
};

export default App;
