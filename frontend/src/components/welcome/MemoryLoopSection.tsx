import React from 'react';
import {
  MessageSquare,
  FileText,
  Database,
  Search,
  Brain,
  Lightbulb,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const MemoryLoopSection: React.FC = () => {
  const steps = [
    {
      icon: <MessageSquare size={20} />,
      title: 'Conversation',
      sub: 'Customer message',
    },
    {
      icon: <FileText size={20} />,
      title: 'Understand',
      sub: 'Current case',
    },
    {
      icon: <Database size={20} />,
      title: 'Retain',
      sub: 'Useful information',
    },
    {
      icon: <Search size={20} />,
      title: 'Recall',
      sub: 'Relevant history',
    },
    {
      icon: <Brain size={20} />,
      title: 'Reason',
      sub: 'with Groq',
    },
    {
      icon: <Lightbulb size={20} />,
      title: 'Act',
      sub: 'Suggest next step',
    },
    {
      icon: <CheckCircle2 size={20} />,
      title: 'Outcome',
      sub: 'Learn from result',
    },
  ];

  return (
    <section id="memory-loop" className="welcome-section">
      <div className="welcome-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-label-tag">HOW THE AI ADAPTS</span>
          <h2 className="section-main-heading">The memory loop.</h2>
          <p className="section-subheading-text">
            Every interaction makes future support more informed.
          </p>
        </div>

        {/* Memory Loop Process Box */}
        <div className="memory-loop-wrapper">
          <div className="loop-nodes-horizontal-flow">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="loop-node-box">
                  <div className="loop-node-orb">
                    {step.icon}
                  </div>
                  <span className="loop-node-title">{step.title}</span>
                  <span className="loop-node-sub">{step.sub}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div className="loop-connector-arrow">
                    <ArrowRight size={18} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Looping Circuit Return Track */}
          <div className="loop-return-circuit-bar">
            <div className="loop-return-line" />
            <div className="loop-return-pill">
              <span>Future conversations become more informed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
