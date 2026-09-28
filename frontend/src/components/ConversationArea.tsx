import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Smile,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import type { ChatMessage, HealthResponse } from '../types';

interface ConversationAreaProps {
  customerId: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  loadingStage: string;
  error: string | null;
  onClearChat: () => void;
  llmInfo?: HealthResponse['llm'];
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
  customerId,
  messages,
  onSendMessage,
  isLoading,
  error,
  onClearChat,
  llmInfo,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedMemoryMsgId, setExpandedMemoryMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRateLimited = llmInfo?.status === 'rate_limited';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickAction = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  const toggleMemoryExpansion = (msgId: string) => {
    setExpandedMemoryMsgId((prev) => (prev === msgId ? null : msgId));
  };

  return (
    <div className="conversation-center-area">
      {/* Conversation Header */}
      <div className="conversation-header-bar">
        <div className="header-left-meta">
          <div className="header-title-row">
            <h2 className="conversation-main-title">Support Conversation</h2>
            <span className="live-status-pill">
              <span className="dot-pulse" />
              Live Session
            </span>
          </div>
          <p className="conversation-subheading">
            Personalized support using customer {customerId}'s history.
          </p>
        </div>

        <div className="header-right-actions">
          <button
            onClick={onClearChat}
            className="action-btn-neutral"
            title="Reset active case and clear chat"
          >
            <RotateCcw size={14} />
            <span>Reset Case</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="conversation-messages-scroll">
        {messages.length === 0 ? (
          <div className="conversation-empty-state">
            <div className="empty-state-icon-box">
              <Bot size={28} className="text-brand-purple" />
            </div>
            <h3 className="empty-state-title">Start a support conversation</h3>
            <p className="empty-state-desc">
              Ask the customer about their issue and MemoryDesk will use relevant previous interactions when available.
            </p>

            <div className="scenario-prompts-tray">
              <span className="prompts-tray-label">Try demo scenario prompts:</span>
              <div className="prompts-chip-list">
                <button
                  className="scenario-prompt-chip"
                  onClick={() => handleQuickAction('My application crashes when I launch it.')}
                >
                  "My application crashes when I launch it."
                </button>
                <button
                  className="scenario-prompt-chip"
                  onClick={() => handleQuickAction('The issue started happening again.')}
                >
                  "The issue started happening again."
                </button>
                <button
                  className="scenario-prompt-chip"
                  onClick={() => handleQuickAction('I reinstalled it and it still crashes.')}
                >
                  "I reinstalled it and it still crashes."
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            const isDegraded = msg.mode === 'degraded';
            const hasRecalledMemories = msg.recalledMemories && msg.recalledMemories.length > 0;
            const isMemoryExpanded = expandedMemoryMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`chat-message-row ${isAgent ? 'row-agent' : 'row-customer'} animate-fade-in`}
              >
                {/* Agent Avatar */}
                {isAgent && (
                  <div className={`message-avatar ${isDegraded ? 'avatar-degraded' : 'avatar-agent'}`}>
                    <Bot size={16} />
                  </div>
                )}

                <div className="message-content-wrapper">
                  {/* Meta info */}
                  <div className="message-meta-line">
                    <span className="message-author-label">
                      {isAgent ? (isDegraded ? 'MemoryDesk (Safe Mode)' : 'MemoryDesk Agent') : `Customer (${customerId})`}
                    </span>
                    <span className="message-time-label">{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div className={`message-bubble ${isAgent ? (isDegraded ? 'bubble-degraded' : 'bubble-agent') : 'bubble-customer'}`}>
                    <p className="message-body-text">{msg.text}</p>
                  </div>

                  {/* Natural Memory Recall Accordion */}
                  {isAgent && hasRecalledMemories && !isDegraded && (
                    <div className="memory-recall-drawer">
                      <button
                        className="memory-drawer-toggle"
                        onClick={() => toggleMemoryExpansion(msg.id)}
                      >
                        <Sparkles size={13} className="text-ai-sparkle" />
                        <span>Using {msg.recalledMemories!.length} relevant memories</span>
                        {isMemoryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isMemoryExpanded && (
                        <div className="memory-drawer-body animate-fade-in">
                          <span className="drawer-body-heading">Relevant memories recalled:</span>
                          <ul className="drawer-memory-list">
                            {msg.recalledMemories!.map((mem, idx) => (
                              <li key={idx} className="drawer-memory-item">
                                <span className="drawer-memory-bullet">&bull;</span>
                                <span className="drawer-memory-text">{mem.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested actions chips inside message */}
                  {isAgent && msg.suggestedActions && msg.suggestedActions.length > 0 && !isDegraded && (
                    <div className="inline-suggested-tray">
                      <span className="inline-tray-label">Suggested next steps:</span>
                      <div className="inline-pills-row">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            className="inline-action-pill"
                            onClick={() => handleQuickAction(action)}
                          >
                            <span>{action}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Avatar */}
                {!isAgent && (
                  <div className="message-avatar avatar-customer">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="chat-message-row row-agent animate-fade-in">
            <div className="message-avatar avatar-agent">
              <Bot size={16} />
            </div>
            <div className="message-content-wrapper">
              <div className="agent-thinking-card">
                <span className="thinking-pulse-dot" />
                <span className="thinking-label">MemoryDesk is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Rate limit warning banner */}
        {isRateLimited && (
          <div className="chat-alert-banner">
            <AlertCircle size={16} className="text-amber" />
            <div className="alert-banner-text">
              <strong>AI support is temporarily rate-limited.</strong>
              <span>Please retry in approximately {llmInfo?.retryAfterSeconds || 60} seconds.</span>
            </div>
          </div>
        )}

        {/* General error message */}
        {error && (
          <div className="chat-error-banner">
            <AlertCircle size={16} className="text-rose" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Section */}
      <div className="conversation-composer-box">
        <form onSubmit={handleSubmit} className="composer-form">
          <div className="composer-input-row">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type a support message for customer ${customerId}...`}
              className="composer-text-input"
              disabled={isLoading}
            />

            <div className="composer-actions-right">
              <button type="button" className="composer-tool-btn" title="Attach file">
                <Paperclip size={16} />
              </button>
              <button type="button" className="composer-tool-btn" title="Add emoji">
                <Smile size={16} />
              </button>
              <button
                type="submit"
                className="composer-send-btn"
                disabled={isLoading || !inputText.trim()}
                title="Send message (Enter)"
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </form>

        {/* Quick Action Chips */}
        <div className="quick-actions-bar">
          <span className="quick-actions-label">Quick Actions:</span>
          <div className="quick-actions-scroll">
            <button
              className="quick-chip"
              onClick={() => handleQuickAction('Could you confirm your device model and OS version?')}
            >
              Request device info
            </button>
            <button
              className="quick-chip"
              onClick={() => handleQuickAction('What is the current status of my previous troubleshooting?')}
            >
              Check account status
            </button>
            <button
              className="quick-chip"
              onClick={() => handleQuickAction('Please try offloading the app and reinstalling it.')}
            >
              Share troubleshooting steps
            </button>
            <button
              className="quick-chip chip-warning"
              onClick={() => handleQuickAction('The issue still persists after trying all recommended steps.')}
            >
              Escalate to Tier 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
