import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation()

  const token = localStorage.getItem('token')

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (allowedRoles.length === 0) {
    return <Outlet />
  }

  let user = {}

  try {
    user = JSON.parse(
      localStorage.getItem('user') || '{}'
    )
  } catch {
    user = {}
  }

  const role = String(user?.role || '')
    .replace('ROLE_', '')
    .toUpperCase()

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to="/access-denied"
        replace
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute