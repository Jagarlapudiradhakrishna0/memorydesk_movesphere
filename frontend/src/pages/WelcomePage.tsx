import React, { useEffect } from 'react';
import '../styles/welcome.css';
import { Navbar } from '../components/welcome/Navbar';
import { Hero } from '../components/welcome/Hero';
import { ProblemSection } from '../components/welcome/ProblemSection';
import { MemoryLayersSection } from '../components/welcome/MemoryLayersSection';
import { MemoryLoopSection } from '../components/welcome/MemoryLoopSection';
import { ArchitectureSection } from '../components/welcome/ArchitectureSection';
import { RecurrenceSection } from '../components/welcome/RecurrenceSection';
import { DemoSection } from '../components/welcome/DemoSection';
import { FinalCTA } from '../components/welcome/FinalCTA';

interface WelcomePageProps {
  onNavigateToSupport: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigateToSupport }) => {
  // Smooth scroll helper for navbar links
  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    document.title = 'MemoryDesk — Support that remembers.';
  }, []);

  return (
    <div className="welcome-viewport">
      {/* Ambient Atmospheric Glow & Grid Overlays */}
      <div className="welcome-ambient-bg">
        <div className="ambient-glow-cyan" />
        <div className="ambient-glow-purple" />
        <div className="ambient-glow-blue-bottom" />
        <div className="ambient-grid-overlay" />
      </div>

      {/* Top Fixed Glass Navigation */}
      <Navbar
        onNavigateToSupport={onNavigateToSupport}
        onScrollToSection={handleScrollToSection}
      />

      {/* Hero Section with 3D Memory Core */}
      <Hero
        onNavigateToSupport={onNavigateToSupport}
        onScrollToSection={handleScrollToSection}
      />

      {/* Section 2: The Problem (Without vs With Memory) */}
      <ProblemSection />

      {/* Section 3: Three Layers of Memory */}
      <MemoryLayersSection />

      {/* Section 4: The Memory Loop */}
      <MemoryLoopSection />

      {/* Section 5 & 6: Hindsight + Groq & It Doesn't Retrain */}
      <ArchitectureSection />

      {/* Section 7: Recurrence (When the problem comes back) */}
      <RecurrenceSection />

      {/* Section 8: Judge Demo Walkthrough */}
      <DemoSection onNavigateToSupport={onNavigateToSupport} />

      {/* Final Section & Footer */}
      <FinalCTA onNavigateToSupport={onNavigateToSupport} />
    </div>
  );
};
