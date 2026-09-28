import React from 'react';
import { ArrowRight, ArrowDown, Bot, Sparkles, Cpu } from 'lucide-react';
import { MemoryCore3D } from './MemoryCore3D';

interface HeroProps {
  onNavigateToSupport: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onNavigateToSupport,
  onScrollToSection,
}) => {
  return (
    <section className="welcome-hero-section">
      <div className="welcome-container">
        <div className="welcome-hero-grid">
          {/* Left Column: Typography & Content */}
          <div className="welcome-hero-content animate-fade-in">
            {/* Pill Badge */}
            <div className="hero-pill-badge">
              <span className="hero-pill-dot" />
              <span className="hero-pill-text">AI Customer Support &bull; Powered by Groq + Hindsight</span>
            </div>

            {/* Giant Heading */}
            <h1 className="hero-main-heading">
              <span className="heading-line-white">SUPPORT</span>
              <span className="heading-line-white">THAT </span>
              <span className="heading-line-gradient">REMEMBERS.</span>
            </h1>

            {/* Subhead Description */}
            <p className="hero-description-text">
              MemoryDesk gives AI customer support a persistent memory — so every conversation can build on what came
              before. It understands previous issues, remembers what was tried, learns from outcomes, and provides more
              personalized support.
            </p>

            {/* Buttons Row */}
            <div className="hero-actions-row">
              <button
                type="button"
                className="hero-btn-primary"
                onClick={onNavigateToSupport}
              >
                <span>Enter Live Demo</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => onScrollToSection('the-problem')}
              >
                <span>See How It Works</span>
                <ArrowDown size={15} />
              </button>
            </div>

            {/* Three Capabilities Pill Row */}
            <div className="hero-capabilities-row">
              <div className="capability-badge-item">
                <div className="capability-icon-orb">
                  <Bot size={16} />
                </div>
                <div className="capability-text-wrap">
                  <span className="capability-line-top">Persistent</span>
                  <span className="capability-line-bot">Customer Memory</span>
                </div>
              </div>

              <div className="capability-badge-item">
                <div className="capability-icon-orb">
                  <Cpu size={16} />
                </div>
                <div className="capability-text-wrap">
                  <span className="capability-line-top">Context-Aware</span>
                  <span className="capability-line-bot">AI Support</span>
                </div>
              </div>

              <div className="capability-badge-item">
                <div className="capability-icon-orb">
                  <Sparkles size={16} />
                </div>
                <div className="capability-text-wrap">
                  <span className="capability-line-top">Learns from</span>
                  <span className="capability-line-bot">Outcomes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Memory Core */}
          <div className="welcome-hero-core-col">
            <MemoryCore3D onNavigateToSupport={onNavigateToSupport} />
          </div>
        </div>
      </div>
    </section>
  );
};
