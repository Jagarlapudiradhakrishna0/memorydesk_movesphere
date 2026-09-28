import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface DemoSectionProps {
  onNavigateToSupport: () => void;
}

export const DemoSection: React.FC<DemoSectionProps> = ({ onNavigateToSupport }) => {
  return (
    <section id="demo" className="welcome-section">
      <div className="welcome-container">
        <div className="demo-scenario-card">
          <span className="section-label-tag">TRY IT YOURSELF</span>
          <h2 className="section-main-heading">See if it remembers.</h2>
          <p className="section-subheading-text" style={{ maxWidth: '620px' }}>
            Experience real persistent memory in action. Follow this simple three-step walkthrough to test customer
            isolation, outcome attribution, and recurrence recall.
          </p>

          {/* 3 Step Interactive Walkthrough Grid */}
          <div className="demo-steps-grid">
            {/* Step 1 */}
            <div className="demo-step-box">
              <span className="demo-step-num">01</span>
              <h4 className="demo-step-heading">Start a Conversation</h4>
              <p className="demo-step-quote">
                &ldquo;My Instagram keeps crashing.&rdquo;
              </p>
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                Open customer C001 (or fresh test customer C900) and describe any technical issue.
              </span>
            </div>

            {/* Step 2 */}
            <div className="demo-step-box">
              <span className="demo-step-num">02</span>
              <h4 className="demo-step-heading">Build the History</h4>
              <p className="demo-step-quote">
                &ldquo;I tried reinstalling but it still crashes. The reset setting fixed it.&rdquo;
              </p>
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                Share your device, OS, what failed, and confirm the working solution to retain memory.
              </span>
            </div>

            {/* Step 3 */}
            <div className="demo-step-box">
              <span className="demo-step-num">03</span>
              <h4 className="demo-step-heading">Come Back Later</h4>
              <p className="demo-step-quote">
                &ldquo;The same Instagram problem is happening again.&rdquo;
              </p>
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                Reset the case or refresh the browser. The agent immediately recalls your history!
              </span>
            </div>
          </div>

          {/* Footer CTA Row */}
          <div className="demo-cta-footer-row">
            <div className="demo-footer-info">
              <Sparkles size={18} className="text-ai-sparkle" />
              <span>Real persistent Hindsight Cloud long-term memory active</span>
            </div>

            <button
              type="button"
              className="hero-btn-primary"
              onClick={onNavigateToSupport}
            >
              <span>Open Live Demo</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
