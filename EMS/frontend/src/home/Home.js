import React from 'react'
import Navbar from '../components/Navbar'
import Feature from '../feature/Feature'
import About from '../about/About'
import Footer from '../components/Footer'
import heroIllustration from './home.svg'
import './Home.css'
const HomePage = () => {
    return (
        <div className="home">
            <Navbar />

            {/* ── Hero Section ── */}
            <section className="hero">
                {/* Decorative grid pattern */}
                <div className="hero-grid-pattern" aria-hidden="true"></div>

                <div className="hero-row">
                    <div className="hero-content">
                        <p className="AI">
                            <span className="ai-sparkle">✦</span>
                            AI-Powered Platform
                        </p>
                        <h1 className="hero-title">
                            Manage Your<br />
                            Workforce<br />
                            <span>Effortlessly.</span>
                        </h1>
                        <p className="hero-text">
                            Daily Brief streamlines employee management with role-based access,
                            real-time tracking, and actionable insights with AI — all in one place.
                        </p>
                        <div className="hero-actions">
                            <a href="/register" className="btn-primary">
                                Get Started Free
                                <span className="btn-arrow">→</span>
                            </a>
                            <a href="#about" className="btn-secondary">
                                <span className="btn-play-icon">▶</span>
                                See How It Works
                            </a>
                        </div>
                        {/* <div className="hero-trusted">
                            <span className="trusted-label">Trusted by teams at</span>
                            <div className="trusted-logos">
                                <span className="trusted-logo">Google</span>
                                <span className="trusted-logo">Microsoft</span>
                                <span className="trusted-logo">Slack</span>
                                <span className="trusted-logo">Stripe</span>
                            </div>
                        </div> */}
                    </div>
                    <div className="hero-image">
                        <div className="hero-image-glow" aria-hidden="true"></div>
                        <img src={heroIllustration} alt="Employee Management Illustration" />
                    </div>
                </div>
                <div className="hero-stats">
                    <div className="stat-card">
                        <h3>0</h3>
                        <p>Companies Trust Us</p>
                    </div>
                    <div className="stat-card">
                        <h3>0</h3>
                        <p>Active Employees</p>
                    </div>
                    <div className="stat-card">
                        <h3>99.9%</h3>
                        <p>Uptime Guaranteed</p>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <Feature />

            {/* ── About Section ── */}
            <About />

            {/* ── CTA Section ── */}
            <section className="cta">
                <h2>Ready to simplify your workforce management?</h2>
                <p>Join hundreds of companies already using Daily Brief to manage their teams efficiently.</p>
                <a href="/register" className="btn-primary">Create Free Account</a>
            </section>

            {/* ── Footer Section ── */}
            <Footer />
        </div>
    )
}

export default HomePage