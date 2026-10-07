import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (
      !formData.username ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill in all fields.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        'http://localhost:8080/api/users/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Registration failed.'
        )
      }

      setSuccess(
        'Account created successfully. Redirecting to login...'
      )

      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
      })

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-left">
        <div className="register-brand">
          <div className="register-brand-icon">✚</div>

          <div>
            <h2>MediCare</h2>
            <span>Hospital Management</span>
          </div>
        </div>

        <div className="register-hero">
          <div className="register-hero-icon">+</div>

          <h1>
            Join MediCare.
            <br />
            Manage Healthcare Better.
          </h1>

          <p>
            Create your account and get access to a modern
            hospital management platform built for efficient
            healthcare operations.
          </p>

          <div className="register-features">
            <div>
              <span>✓</span>
              Easy patient management
            </div>

            <div>
              <span>✓</span>
              Appointments and medical records
            </div>

            <div>
              <span>✓</span>
              Pharmacy and billing management
            </div>
          </div>
        </div>

        <div className="register-left-footer">
          © 2026 MediCare Hospital Management
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">
          <div className="mobile-register-brand">
            <div className="register-brand-icon">✚</div>

            <div>
              <h2>MediCare</h2>
              <span>Hospital Management</span>
            </div>
          </div>

          <div className="register-heading">
            <h1>Create an account</h1>
            <p>
              Register as a patient to get started with
              MediCare.
            </p>
          </div>

          {error && (
            <div className="register-message error">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div className="register-message success">
              <span>✓</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="register-form-group">
              <label>Username</label>

              <div className="register-input">
                <span>♙</span>

                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="register-form-group">
              <label>Password</label>

              <div className="register-input">
                <span>●</span>

                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="register-form-group">
              <label>Confirm Password</label>

              <div className="register-input">
                <span>●</span>

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="password-note">
              Password should contain at least 6 characters.
            </div>

            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}

              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="login-link">
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </div>

          <div className="register-security">
            <span>🔒</span>
            Your account information is securely protected.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register