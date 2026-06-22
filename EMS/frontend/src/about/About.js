import React from 'react'
import aboutIllustration from './About us page-pana.svg'
import './About.css'

const steps = [
  {
    number: '01',
    icon: '🏢',
    title: 'Register Your Business',
    desc: 'Create an account as Super Admin or Company Admin and set up your organisation profile in minutes.',
  },
  {
    number: '02',
    icon: '👥',
    title: 'Add Your Team',
    desc: 'Invite employees, assign roles, and configure departments and reporting structures effortlessly.',
  },
  {
    number: '03',
    icon: '🚀',
    title: 'Start Managing',
    desc: 'Track attendance, assign tasks, process payroll, and monitor performance — all from one dashboard.',
  },
]

const About = () => {
  return (
    <section id="about" className="how-it-works">
      {/* Background decorations */}
      <div className="about-grid-pattern" aria-hidden="true"></div>
      <div className="about-orb about-orb--tl" aria-hidden="true"></div>
      <div className="about-orb about-orb--br" aria-hidden="true"></div>

      <div className="about-row">

        {/* ── Left: Illustration ── */}
        <div className="about-image-col">
          <div className="about-image-ring" aria-hidden="true"></div>
          <div className="about-image-glow" aria-hidden="true"></div>
          <img
            src={aboutIllustration}
            alt="About Us Illustration"
            className="about-img"
          />
          {/* Floating badge */}
          <div className="about-float-badge about-float-badge--top">
            <span className="badge-icon">✦</span> Trusted by 0 teams
          </div>
          <div className="about-float-badge about-float-badge--bottom">
            <span className="badge-icon">⚡</span> 99.9% Uptime
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div className="about-content">

          {/* Section Label */}
          <div className="about-label">
            <span className="label-dot"></span>
            HOW IT WORKS
          </div>

          <h2 className="about-heading">
            Three steps to a <span className="about-heading-accent">smarter workplace</span>
          </h2>
          <p className="about-subtext">
            Get your entire workforce up and running on Daily Brief in minutes — no technical expertise required.
          </p>

          {/* Steps */}
          <div className="steps">
            {steps.map((step, i) => (
              <div className="step" key={i}>
                {/* Connector line (hidden on last step) */}
                {i < steps.length - 1 && (
                  <div className="step-connector" aria-hidden="true"></div>
                )}

                <div className="step-left">
                  <div className="step-number-wrap">
                    <span className="step-emoji">{step.icon}</span>
                    <span className="step-num">{step.number}</span>
                  </div>
                </div>

                <div className="step-text">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

export default About
