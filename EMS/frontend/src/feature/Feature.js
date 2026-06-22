import React from 'react'
import featureIllustration from './Features Overview-pana.svg'
import './Feature.css'

const Feature = () => {
  return (
    <section id="features" className="features">
      {/* Background decorations */}
      <div className="features-grid-pattern" aria-hidden="true"></div>
      <div className="features-orb features-orb--tl" aria-hidden="true"></div>
      <div className="features-orb features-orb--br" aria-hidden="true"></div>

      <div className="features-row">

        {/* ── Left: Illustration ── */}
        <div className="features-image-col">
          <div className="features-image-ring" aria-hidden="true"></div>
          <div className="features-image-glow" aria-hidden="true"></div>
          <img
            src={featureIllustration}
            alt="Features Overview Illustration"
            className="features-img"
          />
          {/* Floating stat badges */}
          <div className="feat-badge feat-badge--top">
            <span className="feat-badge-icon">🚀</span> 6 Powerful Features
          </div>
          <div className="feat-badge feat-badge--bottom">
            <span className="feat-badge-icon">⚡</span> Real-Time Sync
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div className="features-content">

          {/* Label */}
          <div className="features-label">
            <span className="features-label-dot"></span>
            PLATFORM FEATURES
          </div>

          <h2 className="features-heading">
            Why <span className="features-heading-accent">Daily Brief?</span>
          </h2>
          <p className="features-subtext">
            Everything you need to run your workforce smoothly — built for every role, every team.
          </p>

          {/* Cards grid */}
          <div className="features-grid">
            <div className="feature-card" style={{ '--ci': 0 }}>
              <div className="feature-icon">📊</div>
              <h3>Role-Based Access</h3>
              <p>Super Admin, HR, Team Lead, Finance, Staff — each role gets a tailored dashboard.</p>
            </div>
            <div className="feature-card" style={{ '--ci': 1 }}>
              <div className="feature-icon">⏱️</div>
              <h3>Attendance Tracking</h3>
              <p>Real-time monitoring with automated reports, alerts, and clock in/out records.</p>
            </div>
            <div className="feature-card" style={{ '--ci': 2 }}>
              <div className="feature-icon">💰</div>
              <h3>Payroll Management</h3>
              <p>Automated salary, deductions, and payslip generation — zero manual errors.</p>
            </div>
            <div className="feature-card" style={{ '--ci': 3 }}>
              <div className="feature-icon">📋</div>
              <h3>Task Assignment</h3>
              <p>Assign and track tasks across teams with priority levels and deadlines.</p>
            </div>
            <div className="feature-card" style={{ '--ci': 4 }}>
              <div className="feature-icon">📈</div>
              <h3>Performance Analytics</h3>
              <p>Data-driven insights on productivity, individual performance, and project progress.</p>
            </div>
            <div className="feature-card" style={{ '--ci': 5 }}>
              <div className="feature-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>Enterprise-grade security with encrypted data, role permissions, and audit logs.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default Feature
