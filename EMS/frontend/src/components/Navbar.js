import React from 'react'
import './Navbar.css'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="navbar-brand">Daily Brief</h2>
      <ul className="navbar-links">
        <li><a href="/">Home</a></li>
        <li><a href="/#about">About</a></li>
        <li><a href="/#features">Feature</a></li>
        <li><Link to="/login" className="nav-login">Login</Link></li>
        <li><Link to="/register" className="nav-register">Register</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar
