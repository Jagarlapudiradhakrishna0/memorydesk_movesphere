import React from 'react';
import { Database, Bot, Brain } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="welcome-section">
      <div className="welcome-container">
        <div className="architecture-split-grid">
          {/* Left Column: HINDSIGHT + GROQ */}
          <div className="arch-card-left">
            <span className="section-label-tag">HINDSIGHT + GROQ</span>
            <h2 className="section-main-heading" style={{ fontSize: '2.4rem' }}>
              Powered by long-term memory.
            </h2>
            <p className="section-subheading-text" style={{ marginBottom: '24px' }}>
              MemoryDesk uses Hindsight for persistent memory and Groq for reasoning. MemoryDesk orchestrates
              the entire support workflow.
            </p>

            {/* Partner Connection Row */}
            <div className="arch-partner-cards-row">
              {/* Hindsight */}
              <div className="partner-box">
                <div className="partner-box-icon">
                  <Database size={18} />
                </div>
                <span className="partner-box-title">Hindsight</span>
                <span className="partner-box-sub">Persistent Memory</span>
                <p className="partner-box-desc">Stores and retrieves useful customer history.</p>
              </div>

              {/* MemoryDesk */}
              <div className="partner-box">
                <div className="partner-box-icon" style={{ background: 'rgba(139, 92, 255, 0.2)', color: '#c084fc' }}>
                  <Bot size={18} />
                </div>
                <span className="partner-box-title">MemoryDesk</span>
                <span className="partner-box-sub" style={{ color: '#c084fc' }}>Support Orchestration</span>
                <p className="partner-box-desc">Combines memory, case context and reasoning.</p>
              </div>

              {/* Groq */}
              <div className="partner-box">
                <div className="partner-box-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                  <Brain size={18} />
                </div>
                <span className="partner-box-title">Groq</span>
                <span className="partner-box-sub" style={{ color: '#f87171' }}>AI Reasoning</span>
                <p className="partner-box-desc">Understands, diagnoses and suggests actions.</p>
              </div>
            </div>
          </div>

          {/* Right Column: IT DOESN'T RETRAIN. IT REMEMBERS. */}
          <div className="arch-card-right">
            <h2 className="section-main-heading" style={{ fontSize: '2.4rem' }}>
              It doesn't retrain.
              <br />
              <span className="heading-line-gradient">It remembers.</span>
            </h2>
            <p className="section-subheading-text" style={{ marginBottom: '24px' }}>
              MemoryDesk does not retrain the underlying LLM after every conversation. Instead, it adapts future
              support by recalling relevant customer history, previous outcomes, and the current case context.
            </p>

            {/* 3D Stacked Isometric Server Architecture */}
            <div className="stacked-3d-arch-container">
              {/* Layer 1: Groq Reasoning */}
              <div className="stacked-3d-layer">
                <div className="stacked-layer-left">
                  <div className="stacked-layer-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                    <Brain size={18} />
                  </div>
                  <div>
                    <h4 className="stacked-layer-title">Groq Reasoning (LLM)</h4>
                    <span className="stacked-layer-role">Ultra-fast inference & case analysis</span>
                  </div>
                </div>
                <span className="stacked-layer-badge">Reasoning Layer</span>
              </div>

              {/* Layer 2: MemoryDesk Orchestration */}
              <div className="stacked-3d-layer" style={{ borderColor: 'rgba(139, 92, 255, 0.45)' }}>
                <div className="stacked-layer-left">
                  <div className="stacked-layer-icon" style={{ background: 'rgba(139, 92, 255, 0.2)', color: '#c084fc' }}>
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4 className="stacked-layer-title">MemoryDesk Orchestration</h4>
                    <span className="stacked-layer-role">Working context, outcome tracking & recall</span>
                  </div>
                </div>
                <span className="stacked-layer-badge">Orchestration Layer</span>
              </div>

              {/* Layer 3: Hindsight Long-term Memory */}
              <div className="stacked-3d-layer" style={{ borderColor: 'rgba(34, 211, 238, 0.45)' }}>
                <div className="stacked-layer-left">
                  <div className="stacked-layer-icon" style={{ background: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee' }}>
                    <Database size={18} />
                  </div>
                  <div>
                    <h4 className="stacked-layer-title">Hindsight Long-term Memory</h4>
                    <span className="stacked-layer-role">Persistent cross-session customer banks</span>
                  </div>
                </div>
                <span className="stacked-layer-badge">Storage Layer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
