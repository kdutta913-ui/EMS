import React, { useState } from 'react'
import './Login.css'
import loginImg from './Analysis-bro.svg'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.js'
import { api, saveSession, roleToRoute } from '../utils/api.js'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const roleMap = {
  'company-admin': 'CompanyAdmin',
  'Team Lead':     'TeamLead',
  'Finance':       'Finance',
  'HR':            'HR',
  'Employee':      'Employee',
}

const Login = () => {
  const navigate = useNavigate()
  const [role, setRole]       = useState('')
  const [phoneNum, setPhoneNum] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast]       = useState({ open: false, message: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!role) {
      setError('Please select your role')
      return
    }
    if (!phoneNum || !password) {
      setError('Phone number and password are required')
      return
    }

    setLoading(true)
    try {
      const data = await api.post('/auth/login', { phoneNum, password })

      const expectedRole = roleMap[role]
      if (expectedRole && data.user.role !== expectedRole) {
        setError(`Incorrect role selected. You are registered as ${data.user.role}.`)
        setLoading(false)
        return
      }

      saveSession(data.token, data.user)
      const route = roleToRoute[data.user.role] || '/login'
      setToast({ open: true, message: `Welcome to Daily Brief, ${data.user.name}!` })
      setTimeout(() => navigate(route), 1500)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Navbar />
      {/* Left – illustration */}
      <div className="login-left">
        <img src={loginImg} alt="Login illustration" />
      </div>

      {/* Right – form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2 className="login-title">Welcome Back!</h2>
          <p className="login-subtitle">Sign in to continue to your account</p>

          {error && (
            <div className="login-error" style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="role">Select Role</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="" disabled>Choose your role</option>
                <option value="company-admin">Company Admin</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            <div className="login-field">
              <label htmlFor="phoneNum">Phone Number</label>
              <input
                type="text"
                id="phoneNum"
                placeholder="Enter your 10-digit phone number"
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value)}
                maxLength={10}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'LogIn'}
            </button>
          </form>

          <p className="login-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          onClose={() => setToast({ ...toast, open: false })}
          sx={{ minWidth: '280px', fontWeight: 500 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Login
