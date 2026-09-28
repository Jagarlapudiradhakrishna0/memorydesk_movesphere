import React from 'react';
import { ArrowRight, User, Bot, AlertCircle, CheckCircle2, History } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section id="the-problem" className="welcome-section">
      <div className="welcome-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-label-tag">THE PROBLEM</span>
          <h2 className="section-main-heading">Support shouldn't start from zero.</h2>
          <p className="section-subheading-text">
            Traditional support forces customers to repeat themselves. MemoryDesk remembers, so you can continue
            from where you left off.
          </p>
        </div>

        {/* Comparison Grid: Without vs With Memory + History demo */}
        <div className="comparison-container-grid">
          {/* Card 1: WITHOUT MEMORY */}
          <div className="comparison-card card-without-memory">
            <div className="comparison-card-badge badge-without">
              <AlertCircle size={13} />
              <span>WITHOUT MEMORY</span>
            </div>

            <div className="dialog-bubbles-stream">
              {/* Customer Msg */}
              <div className="dialog-bubble">
                <div className="dialog-avatar">
                  <User size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">Customer</span>
                  <div className="dialog-bubble-pill bubble-customer">
                    My app is crashing again.
                  </div>
                </div>
              </div>

              {/* Repeating Agent Questions */}
              <div className="dialog-bubble">
                <div className="dialog-avatar">
                  <Bot size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">Support Agent</span>
                  <div className="dialog-bubble-pill bubble-agent-repeat">
                    Which device are you using?
                  </div>
                </div>
              </div>

              <div className="dialog-bubble">
                <div className="dialog-avatar">
                  <Bot size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">Support Agent</span>
                  <div className="dialog-bubble-pill bubble-agent-repeat">
                    What OS version?
                  </div>
                </div>
              </div>

              <div className="dialog-bubble">
                <div className="dialog-avatar">
                  <Bot size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">Support Agent</span>
                  <div className="dialog-bubble-pill bubble-agent-repeat">
                    Which app version?
                  </div>
                </div>
              </div>

              <div className="dialog-bubble">
                <div className="dialog-avatar">
                  <Bot size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">Support Agent</span>
                  <div className="dialog-bubble-pill bubble-agent-repeat">
                    What have you already tried?
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Transition Glowing Arrow */}
          <div className="comparison-middle-divider">
            <div className="glowing-flow-arrow">
              <ArrowRight size={20} />
            </div>
          </div>

          {/* Card 2: WITH MEMORY */}
          <div className="comparison-card card-with-memory">
            <div className="comparison-card-badge badge-with">
              <CheckCircle2 size={13} />
              <span>WITH MEMORY</span>
            </div>

            <div className="dialog-bubbles-stream">
              {/* Customer Msg */}
              <div className="dialog-bubble">
                <div className="dialog-avatar">
                  <User size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">Customer</span>
                  <div className="dialog-bubble-pill bubble-customer">
                    The app is crashing again.
                  </div>
                </div>
              </div>

              {/* MemoryDesk Intelligent Response */}
              <div className="dialog-bubble">
                <div className="dialog-avatar avatar-agent">
                  <Bot size={14} />
                </div>
                <div className="dialog-content-box">
                  <span className="dialog-speaker-label">MemoryDesk</span>
                  <div className="dialog-bubble-pill bubble-agent-memory">
                    I remember this issue. Last time you were using an iPhone 15 with iOS 26 and reinstalling didn't fix it. Let's try the next step that previously worked.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Demo Memory History Cards */}
          <div className="comparison-demo-column">
            <span className="demo-column-header">Example interaction (conceptual demo)</span>

            {/* Previous Issue */}
            <div className="demo-floating-card">
              <div className="demo-card-top-row">
                <span className="demo-card-label">Previous Issue</span>
                <History size={13} className="text-secondary" />
              </div>
              <span className="demo-card-title">Instagram crashes on launch</span>
            </div>

            {/* Attempted */}
            <div className="demo-floating-card">
              <div className="demo-card-top-row">
                <span className="demo-card-label">Attempted</span>
                <span className="demo-badge-failed">Failed</span>
              </div>
              <span className="demo-card-title">Reinstall app</span>
            </div>

            {/* Resolved */}
            <div className="demo-floating-card">
              <div className="demo-card-top-row">
                <span className="demo-card-label">Resolved</span>
                <span className="demo-badge-success">Successful</span>
              </div>
              <span className="demo-card-title">Reset settings</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
