import React from 'react';
import { Layers, Database, Sparkles } from 'lucide-react';

export const MemoryLayersSection: React.FC = () => {
  return (
    <section id="three-layers" className="welcome-section">
      <div className="welcome-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-label-tag">HOW MEMORYDESK WORKS</span>
          <h2 className="section-main-heading">Three layers of memory.</h2>
          <p className="section-subheading-text">
            MemoryDesk combines current working context, persistent long-term memory, and relevant recall to
            provide more personalized and efficient support.
          </p>
        </div>

        {/* Three Cards Grid */}
        <div className="three-layers-grid">
          {/* Card 1: ACTIVE CASE */}
          <div className="layer-card">
            <div className="layer-card-header">
              <div className="layer-icon-box icon-box-active">
                <Layers size={22} />
              </div>
              <span className="layer-pill-tag tag-indigo">Current Session</span>
            </div>

            <h3 className="layer-card-title">ACTIVE CASE</h3>
            <p className="layer-card-desc">
              Short-term working memory for the current support conversation.
            </p>

            <ul className="layer-bullets-list">
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Current problem</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Device & OS</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Application & version</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Symptoms</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Current actions</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Diagnosis context</span>
              </li>
            </ul>

            {/* Isometric Visual: Stacked Translucent Slabs */}
            <div className="layer-illustration-wrap">
              <svg className="isometric-svg" viewBox="0 0 200 120" fill="none">
                <polygon points="100,20 160,50 100,80 40,50" fill="rgba(99, 102, 241, 0.4)" stroke="#818cf8" strokeWidth="1.5" />
                <polygon points="100,45 160,75 100,105 40,75" fill="rgba(79, 124, 255, 0.3)" stroke="#60a5fa" strokeWidth="1.5" />
                <polygon points="100,70 160,100 100,130 40,100" fill="rgba(34, 211, 238, 0.2)" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="100" y1="20" x2="100" y2="70" stroke="#818cf8" strokeDasharray="3 3" />
              </svg>
            </div>
          </div>

          {/* Card 2: HINDSIGHT MEMORY */}
          <div className="layer-card">
            <div className="layer-card-header">
              <div className="layer-icon-box icon-box-hindsight">
                <Database size={22} />
              </div>
              <span className="layer-pill-tag tag-cyan">Persistent</span>
            </div>

            <h3 className="layer-card-title">HINDSIGHT MEMORY</h3>
            <p className="layer-card-desc">
              Long-term customer history stored in Hindsight Cloud.
            </p>

            <ul className="layer-bullets-list">
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Previous issues</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Successful solutions</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Failed attempts</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Customer environment</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Recurring problems</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Important preferences</span>
              </li>
            </ul>

            {/* Isometric Visual: Glowing Cylinder + Cloud */}
            <div className="layer-illustration-wrap">
              <svg className="isometric-svg" viewBox="0 0 200 120" fill="none">
                {/* Cylinder Top */}
                <ellipse cx="100" cy="40" rx="45" ry="18" fill="rgba(34, 211, 238, 0.35)" stroke="#22d3ee" strokeWidth="1.5" />
                {/* Cylinder Body */}
                <path d="M55,40 v45 c0,10 45,10 90,0 v-45" fill="rgba(14, 28, 70, 0.7)" stroke="#22d3ee" strokeWidth="1.5" />
                {/* Rings */}
                <path d="M55,62 c0,10 45,10 90,0" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M55,85 c0,10 45,10 90,0" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Cloud Glow */}
                <ellipse cx="145" cy="85" rx="26" ry="16" fill="rgba(168, 85, 247, 0.35)" stroke="#c084fc" strokeWidth="1.5" filter="drop-shadow(0 0 10px #c084fc)" />
              </svg>
            </div>
          </div>

          {/* Card 3: RELEVANT MEMORY */}
          <div className="layer-card">
            <div className="layer-card-header">
              <div className="layer-icon-box icon-box-relevant">
                <Sparkles size={22} />
              </div>
              <span className="layer-pill-tag tag-purple">Context-Aware</span>
            </div>

            <h3 className="layer-card-title">RELEVANT MEMORY</h3>
            <p className="layer-card-desc">
              Only the historical information relevant to the current issue is recalled for the AI.
            </p>

            <ul className="layer-bullets-list">
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Relevant previous issue</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Relevant actions</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Relevant outcomes</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Filtered and concise</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>Token efficient</span>
              </li>
              <li className="layer-bullet-item">
                <span className="layer-bullet-dot" />
                <span>More accurate support</span>
              </li>
            </ul>

            {/* Isometric Visual: Document with Search Magnifier */}
            <div className="layer-illustration-wrap">
              <svg className="isometric-svg" viewBox="0 0 200 120" fill="none">
                {/* Document Sheet */}
                <rect x="60" y="25" width="60" height="75" rx="6" fill="rgba(14, 21, 52, 0.85)" stroke="#a855f7" strokeWidth="1.5" />
                {/* Data Lines */}
                <line x1="72" y1="40" x2="108" y2="40" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="72" y1="52" x2="102" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
                <line x1="72" y1="64" x2="95" y2="64" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
                {/* Magnifying Glass */}
                <circle cx="125" cy="75" r="18" fill="rgba(34, 211, 238, 0.25)" stroke="#22d3ee" strokeWidth="2" />
                <line x1="138" y1="88" x2="155" y2="105" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
