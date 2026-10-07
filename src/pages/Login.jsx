import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { post } from '../api'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  const getRole = (user) => {
    return String(user?.role || '')
      .replace('ROLE_', '')
      .toUpperCase()
  }

  const getRoleHome = (role) => {
    switch (role) {
      case 'ADMIN':
        return '/dashboard'

      case 'DOCTOR':
        return '/appointments'

      case 'RECEPTIONIST':
        return '/patients'

      case 'PHARMACIST':
        return '/pharmacy'

      case 'ACCOUNTANT':
        return '/dashboard'

      case 'PATIENT':
        return '/settings'

      default:
        return '/settings'
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    const username = formData.username.trim()
    const password = formData.password

    if (!username) {
      setError('Please enter your username.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)

      const response = await post('/api/auth/login', {
        username,
        password,
      })

      /*
       * Backend LoginResponse normally contains:
       * token
       *
       * Depending on the backend response, user details
       * may or may not be returned directly.
       */

      const token =
        response?.token ||
        response?.accessToken ||
        response?.jwt

      if (!token) {
        throw new Error(
          'Login successful but authentication token was not received.'
        )
      }

      /*
       * Get user information from JWT payload if backend
       * does not return a complete user object.
       */

      let jwtUser = {}

      try {
        const payload = JSON.parse(
          atob(
            token
              .split('.')[1]
              .replace(/-/g, '+')
              .replace(/_/g, '/')
          )
        )

        jwtUser = {
          username:
            payload?.sub ||
            payload?.username ||
            username,

          role:
            payload?.role ||
            payload?.roles?.[0] ||
            payload?.authorities?.[0] ||
            'PATIENT',
        }
      } catch (jwtError) {
        console.warn(
          'Unable to decode JWT user information:',
          jwtError
        )

        jwtUser = {
          username,
          role: 'PATIENT',
        }
      }

      /*
       * If backend sends user information directly,
       * prefer that information.
       */

      const backendUser =
        response?.user ||
        response?.userResponse ||
        response?.data?.user ||
        null

      const finalUser = {
        id:
          backendUser?.id ||
          jwtUser?.id ||
          null,

        username:
          backendUser?.username ||
          jwtUser?.username ||
          username,

        name:
          backendUser?.name ||
          backendUser?.fullName ||
          jwtUser?.username ||
          username,

        email:
          backendUser?.email ||
          '',

        role:
          getRole(backendUser) ||
          getRole(jwtUser) ||
          'PATIENT',

        enabled:
          backendUser?.enabled !== undefined
            ? backendUser.enabled
            : true,
      }

      /*
       * Normalize role.
       */

      finalUser.role = getRole(finalUser)

      /*
       * Save authentication session.
       */

      localStorage.setItem('token', token)

      localStorage.setItem(
        'user',
        JSON.stringify(finalUser)
      )

      /*
       * Keep current user information as well.
       * This is useful for compatibility with older
       * frontend code.
       */

      localStorage.setItem(
        'currentUser',
        JSON.stringify(finalUser)
      )

      /*
       * Clean old frontend-only authentication keys.
       */

      localStorage.removeItem('internxCurrentUser')
      localStorage.removeItem('internxAdminLoggedIn')

      /*
       * Redirect user according to role.
       *
       * If login was triggered from a protected page,
       * we can return there only when the user's role
       * is allowed by the application.
       */

      const role = finalUser.role

      const requestedPath =
        location?.state?.from || ''

      const allowedRequestedPaths = {
        ADMIN: [
          '/dashboard',
          '/patients',
          '/doctors',
          '/appointments',
          '/departments',
          '/admissions',
          '/rooms',
          '/medical-records',
          '/pharmacy',
          '/prescriptions',
          '/billing',
          '/settings',
        ],

        DOCTOR: [
          '/appointments',
          '/medical-records',
          '/prescriptions',
          '/settings',
        ],

        RECEPTIONIST: [
          '/patients',
          '/doctors',
          '/appointments',
          '/admissions',
          '/rooms',
          '/settings',
        ],

        PHARMACIST: [
          '/pharmacy',
          '/prescriptions',
          '/settings',
        ],

        ACCOUNTANT: [
          '/dashboard',
          '/billing',
          '/settings',
        ],

        PATIENT: [
          '/settings',
        ],
      }

      const rolePaths =
        allowedRequestedPaths[role] || []

      if (rolePaths.includes(requestedPath)) {
        navigate(requestedPath, {
          replace: true,
        })
      } else {
        navigate(getRoleHome(role), {
          replace: true,
        })
      }
    } catch (err) {
      console.error('Login error:', err)

      setError(
        err?.message ||
          'Invalid username or password.'
      )

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('currentUser')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-brand">
          <div className="login-logo">
            ✚
          </div>

          <div>
            <h1>MediCare</h1>
            <p>Hospital Management System</p>
          </div>
        </div>

        <div className="login-card">

          <div className="login-header">
            <h2>Welcome Back</h2>

            <p>
              Sign in to access your hospital
              management dashboard.
            </p>
          </div>

          {error && (
            <div className="login-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                disabled={loading}
              />

            </div>

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? '◉' : '○'}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          <div className="login-footer">
            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate('/register')}
              disabled={loading}
            >
              Create an account
            </button>
          </div>

        </div>

        <div className="login-security">
          <span>🔒</span>
          Secure hospital management portal
        </div>

      </div>
    </div>
  )
}

export default Login