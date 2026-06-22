import React, { useState } from 'react'
import './Register.css'
import { Link, useNavigate } from 'react-router-dom'
import registerImg from './Data extraction-bro.svg'
import Navbar from '../components/Navbar.js'
import { api, saveSession } from '../utils/api.js'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const Register = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phoneNum: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast]   = useState({ open: false })
  const [showPassword, setShowPassword]           = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { name, businessName, email, phoneNum, password, confirmPassword } = form

    if (!name || !businessName || !email || !phoneNum || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (!/^[0-9]{10}$/.test(phoneNum)) {
      setError('Phone number must be exactly 10 digits')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const data = await api.post('/auth/register', {
        name,
        businessName,
        email,
        phoneNum,
        password,
      })
      saveSession(data.token, data.user)
      setToast({ open: true })
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <Navbar />
      {/* Left – illustration */}
      <div className="register-left">
        <img src={registerImg} alt="Register illustration" />
      </div>

      {/* Right – form */}
      <div className="register-right">
        <div className="register-wrapper">
          <h2 className="register-title">Create Account</h2>
          <p className="register-subtitle">Register your business to get started</p>

          {error && (
            <div className="register-error" style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="role">Register As</label>
              <select id="role" defaultValue="company-admin" disabled>
                <option value="company-admin">Company Admin</option>
              </select>
            </div>

            <div className="register-field">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="register-field">
              <label htmlFor="businessName">Business Name</label>
              <input
                type="text"
                id="businessName"
                placeholder="Enter your business name"
                value={form.businessName}
                onChange={handleChange}
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="register-field">
              <label htmlFor="phoneNum">Phone Number</label>
              <input
                type="tel"
                id="phoneNum"
                placeholder="Enter your 10-digit phone number"
                value={form.phoneNum}
                onChange={handleChange}
                maxLength={10}
              />
            </div>

            <div className="register-field">
              <label htmlFor="password">New Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Create a password (min 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                />
                <IconButton
                  className="password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  size="small"
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <IconButton
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  tabIndex={-1}
                  size="small"
                >
                  {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </div>
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="register-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          onClose={() => setToast({ open: false })}
          sx={{ minWidth: '280px', fontWeight: 500 }}
        >
          Registration Successful!
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Register
