'use client';

import { useState } from 'react';

export default function HowManetWorks() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="how-manet-section" aria-labelledby="how-manet-heading">
      <h2 id="how-manet-heading" className="section-heading">
        How MANET works
      </h2>
      <p className="section-desc">
        A <strong>Mobile Ad-hoc Network (MANET)</strong> has no fixed infrastructure. Each device acts as both an endpoint and a router. Messages from Device A to Device B can go directly if in range, or via other nodes (multi-hop) when they are not.
      </p>
      <div className="manet-diagram" role="img" aria-label="Device A sends to relay, relay forwards to Device B. Direct path shown as dashed when in range.">
        <svg viewBox="0 0 320 100" className="manet-diagram-svg">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="var(--signal-on)" />
            </marker>
          </defs>
          <g className="node" aria-hidden="true">
            <circle cx="50" cy="50" r="22" fill="var(--bg-panel)" stroke="var(--signal-on)" strokeWidth="2" />
            <text x="50" y="55" textAnchor="middle" fill="var(--text)" fontSize="12" fontWeight="600">A</text>
            <text x="50" y="88" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Device A</text>
          </g>
          <g className="node" aria-hidden="true">
            <circle cx="160" cy="50" r="22" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="2" />
            <text x="160" y="55" textAnchor="middle" fill="var(--text)" fontSize="12" fontWeight="600">R</text>
            <text x="160" y="88" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Relay</text>
          </g>
          <g className="node" aria-hidden="true">
            <circle cx="270" cy="50" r="22" fill="var(--bg-panel)" stroke="var(--signal-on)" strokeWidth="2" />
            <text x="270" y="55" textAnchor="middle" fill="var(--text)" fontSize="12" fontWeight="600">B</text>
            <text x="270" y="88" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Device B</text>
          </g>
          <path className="manet-diagram-arrow" d="M 72 50 H 138" stroke="var(--signal-on)" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="105" y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="9">message</text>
          <path className="manet-diagram-arrow" d="M 182 50 H 248" stroke="var(--signal-on)" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="215" y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="9">forward</text>
          <path d="M 50 28 Q 160 0 270 28" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
          <text x="160" y="-2" textAnchor="middle" fill="var(--text-muted)" fontSize="9">direct if in range</text>
        </svg>
      </div>
      <div className="how-manet-learn">
        <button
          type="button"
          className="how-manet-learn-trigger"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls="how-manet-more"
          id="how-manet-trigger"
        >
          {expanded ? 'Less' : 'Learn more'}
        </button>
        <div id="how-manet-more" className="how-manet-more" hidden={!expanded} role="region" aria-labelledby="how-manet-trigger">
          <ul className="how-manet-list">
            <li>No base stations or access points — nodes form the network on the fly.</li>
            <li>Multi-hop: if the destination is out of range, neighbors relay the message.</li>
            <li>Used in disaster relief, military, and sensor networks where infrastructure is missing.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
