import React from 'react';
import { ArrowRight, Bot } from 'lucide-react';

interface FinalCTAProps {
  onNavigateToSupport: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onNavigateToSupport }) => {
  return (
    <section className="final-cta-section">
      <div className="welcome-container">
        <div className="final-cta-content">
          <div className="welcome-logo-box" style={{ width: '48px', height: '48px', marginBottom: '20px' }}>
            <Bot size={26} />
          </div>

          <h2 className="final-heading">
            SUPPORT
            <br />
            THAT
            <br />
            <span className="heading-line-gradient">REMEMBERS.</span>
          </h2>

          <p className="final-desc">
            MemoryDesk &bull; AI customer support with persistent customer memory.
          </p>

          <button
            type="button"
            className="hero-btn-primary"
            onClick={onNavigateToSupport}
            style={{ padding: '16px 36px', fontSize: '1.05rem', marginBottom: '16px' }}
          >
            <span>Enter MemoryDesk</span>
            <ArrowRight size={18} />
          </button>

          <span className="welcome-brand-tagline" style={{ fontSize: '0.85rem' }}>
            Support that remembers.
          </span>
        </div>

        {/* Bottom Footer */}
        <footer className="welcome-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>MemoryDesk</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>&bull; Powered by Groq &amp; Hindsight Cloud</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>It doesn&apos;t retrain. It remembers.</span>
          </div>
        </footer>
      </div>
    </section>
  );
};
