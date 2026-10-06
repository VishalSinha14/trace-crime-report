import React from 'react';
import {
  Shield, ArrowRight, Radio, Users, Activity,
  Send, Cpu, CheckCircle2, Map as MapIcon,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="landing-shell min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950">
      <div className="landing-grid" />

      {/* ═══════════════════════ NAV ═══════════════════════ */}
      <header className="landing-nav">
        <div className="landing-width h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="landing-logo"><Shield className="w-4 h-4" /></div>
            <span className="text-base font-bold tracking-[-0.04em] text-white">TRACE</span>
            <div className="live-label"><span /> Pune Grid</div>
          </div>
          <div className="flex items-center gap-3">
            <button id="landing-login-btn" onClick={onLogin} className="landing-signin">Sign In</button>
            <button id="landing-register-btn" onClick={onRegister} className="landing-cta-small">
              Get Started <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="landing-width landing-hero">
        {/* Copy */}
        <div className="landing-hero-copy">
          <div className="landing-kicker">
            <Radio className="w-3.5 h-3.5" />
            Real-Time Safety Intelligence
          </div>
          <h1>
            See crime.<br /><span>Report it.</span><br />Strengthen Pune.
          </h1>
          <p className="landing-lead">
            TRACE is an AI-powered geospatial safety platform for Pune. Citizens report, the system classifies, moderators verify — the map stays true.
          </p>
          <div className="flex flex-wrap gap-3">
            <button id="hero-register-btn" onClick={onRegister} className="landing-button-primary">
              <Users className="w-4 h-4" /> Create Account
            </button>
            <button id="hero-login-btn" onClick={onLogin} className="landing-button-secondary">
              <Shield className="w-4 h-4" /> Sign In
            </button>
          </div>
          <p className="landing-access-note">Citizens • Moderators • Admins — role-based access enforced server-side</p>
        </div>

        {/* Map preview */}
        <div className="landing-map-frame">
          <div className="map-preview-toolbar">
            <div>
              <span className="map-preview-tag">TRACE · LIVE</span>
              <p>Pune Safety Map</p>
            </div>
            <div className="live-label"><span /> Active</div>
          </div>

          <div className="map-preview-canvas">
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <div className="map-road road-three" />
            <div className="map-risk-zone zone-one" />
            <div className="map-risk-zone zone-two" />
            <span className="preview-marker low" style={{ left: '22%', top: '38%' }} />
            <span className="preview-marker medium" style={{ left: '42%', top: '55%' }} />
            <span className="preview-marker high" style={{ left: '65%', top: '28%' }} />
            <span className="preview-marker critical critical-marker" style={{ left: '78%', top: '62%' }} />
            <span className="preview-marker low" style={{ left: '35%', top: '72%' }} />
            <div className="map-location-label label-one">KOTHRUD</div>
            <div className="map-location-label label-two">HADAPSAR</div>
          </div>

          <div className="map-preview-bottom">
            <div>
              <span>VERIFIED</span>
              <strong>1,247</strong>
              <small>Active incidents · Pune metro</small>
            </div>
            <div className="preview-feed">
              <div className="preview-feed-dot" />
              <p><b>THEFT · SHIVAJI NAGAR</b><br />AI confidence 94% · just now</p>
            </div>
            <div className="map-preview-count">
              <span style={{ color: '#64748b', fontSize: '9px' }}>24H REPORTS</span>
              <strong>+38</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ METRICS ═══════════════════════ */}
      <section className="landing-width">
        <div className="landing-metrics-row rounded-lg overflow-hidden">
          {[
            { value: '10,000+', label: 'geotagged incidents' },
            { value: '98%',     label: 'AI-classified reports' },
            { value: '3-tier',  label: 'verification workflow' },
            { value: '24/7',    label: 'spatial updates' },
          ].map((m) => (
            <div key={m.label} className="landing-metric">
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ WORKFLOW ═══════════════════════ */}
      <section className="landing-width landing-workflow">
        <div className="landing-section-heading">
          <div className="eyebrow">A Single Verified Workflow</div>
          <h2>From first report to informed action.</h2>
          <p>Every incident follows the same path — report, classify, verify, publish. No shortcuts, no unverified data on the map.</p>
        </div>

        <ol>
          {[
            { step: '01', Icon: Send,          title: 'Report',              desc: 'A citizen records an incident with a location and narrative.' },
            { step: '02', Icon: Cpu,            title: 'AI classification',   desc: 'TRACE assigns a category and severity confidence score.' },
            { step: '03', Icon: CheckCircle2,   title: 'Verification',        desc: 'Moderators review the report before it is made public.' },
            { step: '04', Icon: MapIcon,        title: 'Live map',            desc: 'Verified information strengthens the city-wide safety picture.' },
          ].map((w) => {
            const Icon = w.Icon;
            return (
              <li key={w.step}>
                <span className="workflow-number">{w.step}</span>
                <Icon className="w-5 h-5" />
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ═══════════════════════ ROLES ═══════════════════════ */}
      <section className="landing-width landing-roles">
        <div className="landing-section-heading">
          <div className="eyebrow">One Connected Platform</div>
          <h2>Three focused roles. One trusted map.</h2>
          <p>Every user has a purpose-defined scope. No role can bypass verification — each layer feeds into a single source of truth.</p>
        </div>

        <div className="role-flow">
          {/* Citizen */}
          <article className="rounded-xl">
            <span className="role-index citizen">01</span>
            <Users className="w-5 h-5 text-[#6ee7b7]" />
            <h3>Citizen</h3>
            <p>Report, pin, and follow the status of submitted incidents.</p>
          </article>

          <div className="role-connector" />

          {/* Moderator */}
          <article className="rounded-xl">
            <span className="role-index moderator">02</span>
            <CheckCircle2 className="w-5 h-5 text-[#fcd34d]" />
            <h3>Moderator</h3>
            <p>Review narratives and AI signals to validate what reaches the map.</p>
          </article>

          <div className="role-connector" />

          {/* Admin */}
          <article className="rounded-xl">
            <span className="role-index admin">03</span>
            <Shield className="w-5 h-5 text-[#c4b5fd]" />
            <h3>Admin</h3>
            <p>Oversee analytics, access controls, audit history, and system health.</p>
          </article>
        </div>
      </section>

      {/* ═══════════════════ PRODUCT PREVIEW ═══════════════════ */}
      <section className="landing-width landing-product-section">
        <div className="landing-section-heading">
          <div className="eyebrow">Live Product Preview</div>
          <h2>One map. A clearer operational picture.</h2>
          <p>The same spatial intelligence workspace used across TRACE, designed to keep signal ahead of noise.</p>
        </div>

        <div className="product-preview-grid">
          {/* Density map panel */}
          <div className="product-map-panel rounded-xl overflow-hidden">
            <div className="product-panel-head">
              <span><Activity className="w-3.5 h-3.5 text-[#7dd3fc]" /> Incident density</span>
              <small>REFRESHING · LIVE</small>
            </div>
            <div className="density-map">
              <div className="density-core" />
              <div className="density-ring" />
              <div className="density-ring ring-b" />
              <span className="preview-marker low" style={{ left: '22%', top: '52%' }} />
              <span className="preview-marker medium" style={{ left: '37%', top: '60%' }} />
              <span className="preview-marker critical" style={{ left: '62%', top: '30%' }} />
              <span className="preview-marker high" style={{ left: '72%', top: '65%' }} />
            </div>
          </div>

          {/* Feed panel */}
          <div className="product-feed-panel rounded-xl overflow-hidden">
            <div className="product-panel-head">
              <span><Radio className="w-3.5 h-3.5 text-[#7dd3fc]" /> Verified incident stream</span>
              <small>00:42 IST</small>
            </div>
            {[
              { title: 'ROBBERY · Camp',             sub: 'Critical risk signal',    signal: 0 },
              { title: 'HARASSMENT · FC Road',        sub: 'Verified by moderation',  signal: 1 },
              { title: 'VEHICLE RELATED · Aundh',     sub: 'Verified by moderation',  signal: 2 },
            ].map((item) => (
              <div key={item.title} className="preview-list-item">
                <div className={`list-signal signal-${item.signal}`} />
                <div>
                  <b>{item.title}</b>
                  <small>{item.sub}</small>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ SHOWCASE ═══════════════════ */}
      <section className="landing-width landing-showcase">
        <div className="landing-section-heading">
          <div className="eyebrow">Designed for the Work</div>
          <h2>Purpose-built workspaces, not generic dashboards.</h2>
          <p>Each role gets an interface optimised for their specific workflow — from pin-drop reporting to audit trail analysis.</p>
        </div>

        <div className="showcase-strip">
          {/* Citizen Portal */}
          <div className="showcase-screen rounded-xl">
            <span>Citizen Portal</span>
            <div className="mini-map rounded-lg">
              <i /><i /><i />
            </div>
            <p>My submissions & alerts</p>
          </div>

          {/* Verification Center */}
          <div className="showcase-screen rounded-xl">
            <span>Verification Center</span>
            <div className="mini-lines rounded-lg">
              <i /><i /><i /><i />
            </div>
            <p>AI insight · status review</p>
          </div>

          {/* Command & Oversight */}
          <div className="showcase-screen rounded-xl">
            <span>Command & Oversight</span>
            <div className="mini-bars rounded-lg">
              <i /><i /><i /><i />
            </div>
            <p>Analytics · RBAC · audit trail</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="landing-width">
        <div className="landing-final-cta">
          <div>
            <div className="eyebrow">Build a Clearer Safety Picture</div>
            <h2>Start with a report. Strengthen the map.</h2>
          </div>
          <button id="bottom-cta-btn" onClick={onRegister} className="landing-button-primary shrink-0">
            Get started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="landing-width landing-footer">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" style={{ color: '#7dd3fc' }} />
          <span>TRACE — Technology for Reporting, Analysis & Crime Evaluation</span>
        </div>
        <div className="flex items-center gap-4">
          <span>B.Tech CSE Final Year</span>
          <span>·</span>
          <span>Pune, Maharashtra · 2026</span>
        </div>
      </footer>
    </div>
  );
};
