import React from 'react'
import './Footer.css'

const Footer = () => {
    return (
        <footer className="home-footer">
            <div className="footer-content">
                <div className="footer-col">
                    <h4>Contact Us</h4>
                    <p>📧 <a href="mailto:support@dailybrief.com">support@dailybrief.com</a></p>
                    <p>📞 <a href="tel:+911234567890">+91 12345 67890</a></p>
                </div>
                <div className="footer-col">
                    <h4>Quick Links</h4>
                    <p><a href="/login">Login</a></p>
                    <p><a href="/register">Register</a></p>
                </div>
                <div className="footer-col">
                    <h4>Daily Brief</h4>
                    <p>Simplifying workforce management for modern businesses.</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 Daily Brief. All rights reserved.</p>
            </div>
        </footer>
    )
}

export default Footer
