import React from 'react';
import { ArrowRight, Bot } from 'lucide-react';

interface NavbarProps {
  onNavigateToSupport: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateToSupport,
  onScrollToSection,
}) => {
  return (
    <header className="welcome-navbar">
      <div className="welcome-navbar-inner">
        {/* Left: Brand */}
        <div className="welcome-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="welcome-logo-box">
            <Bot size={22} />
          </div>
          <div className="welcome-brand-text">
            <span className="welcome-brand-title">MemoryDesk</span>
            <span className="welcome-brand-tagline">Support that remembers.</span>
          </div>
        </div>

        {/* Center/Right Nav Links */}
        <nav className="welcome-nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className="welcome-nav-link"
            onClick={() => onScrollToSection('the-problem')}
          >
            How it works
          </button>
          <button
            type="button"
            className="welcome-nav-link"
            onClick={() => onScrollToSection('three-layers')}
          >
            Memory
          </button>
          <button
            type="button"
            className="welcome-nav-link"
            onClick={() => onScrollToSection('memory-loop')}
          >
            Features
          </button>
        </nav>

        {/* Right: Primary CTA */}
        <div className="welcome-nav-actions">
          <button
            type="button"
            className="welcome-nav-cta"
            onClick={onNavigateToSupport}
          >
            <span>Enter Support Console</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
