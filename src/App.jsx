import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'

import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import Departments from './pages/Departments'
import Admissions from './pages/Admissions'
import Rooms from './pages/Rooms'
import MedicalRecords from './pages/MedicalRecords'
import Pharmacy from './pages/Pharmacy'
import Billing from './pages/Billing'
import Prescriptions from './pages/Prescriptions'
import Settings from './pages/Settings'
import Users from './pages/Users'

function AccessDenied() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f9fc',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: 'min(450px, 100%)',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow:
            '0 10px 30px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div
          style={{
            width: '65px',
            height: '65px',
            margin: '0 auto 18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '28px',
          }}
        >
          !
        </div>

        <h2
          style={{
            margin: '0 0 10px',
            color: '#172033',
          }}
        >
          Access Denied
        </h2>

        <p
          style={{
            margin: '0 0 24px',
            color: '#64748b',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          You do not have permission to access this page.
        </p>

        <button
          onClick={() => {
            window.location.href = '/login'
          }}
          style={{
            border: 0,
            borderRadius: '8px',
            padding: '11px 20px',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/access-denied"
        element={<AccessDenied />}
      />

      {/* ================= PROTECTED ================= */}

      <Route element={<ProtectedRoute />}>

        <Route element={<Layout />}>

          {/* ================= ADMIN + ACCOUNTANT ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'ACCOUNTANT',
                ]}
              />
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/billing"
              element={<Billing />}
            />
          </Route>

          {/* ================= ADMIN ONLY ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={['ADMIN']}
              />
            }
          >
            <Route
              path="/departments"
              element={<Departments />}
            />

            <Route
              path="/users"
              element={<Users />}
            />
          </Route>

          {/* ================= ADMIN + RECEPTIONIST ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'RECEPTIONIST',
                ]}
              />
            }
          >
            <Route
              path="/patients"
              element={<Patients />}
            />

            <Route
              path="/doctors"
              element={<Doctors />}
            />

            <Route
              path="/admissions"
              element={<Admissions />}
            />

            {/* FIXED: Rooms was incorrectly pointing to Admissions */}
            <Route
              path="/rooms"
              element={<Rooms />}
            />
          </Route>

          {/* ================= ADMIN + DOCTOR + RECEPTIONIST ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'DOCTOR',
                  'RECEPTIONIST',
                ]}
              />
            }
          >
            <Route
              path="/appointments"
              element={<Appointments />}
            />
          </Route>

          {/* ================= ADMIN + DOCTOR ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'DOCTOR',
                ]}
              />
            }
          >
            <Route
              path="/medical-records"
              element={<MedicalRecords />}
            />
          </Route>

          {/* ================= ADMIN + DOCTOR + PHARMACIST ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'DOCTOR',
                  'PHARMACIST',
                ]}
              />
            }
          >
            <Route
              path="/prescriptions"
              element={<Prescriptions />}
            />
          </Route>

          {/* ================= ADMIN + PHARMACIST ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'PHARMACIST',
                ]}
              />
            }
          >
            <Route
              path="/pharmacy"
              element={<Pharmacy />}
            />
          </Route>

          {/* ================= ALL ROLES ================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN',
                  'DOCTOR',
                  'RECEPTIONIST',
                  'PHARMACIST',
                  'ACCOUNTANT',
                  'PATIENT',
                ]}
              />
            }
          >
            <Route
              path="/settings"
              element={<Settings />}
            />
          </Route>

          {/* ================= DEFAULT ================= */}

          <Route
            path="/"
            element={<RoleHomeRedirect />}
          />

        </Route>

      </Route>

      {/* ================= FALLBACK ================= */}

      <Route
        path="*"
        element={<RoleHomeRedirect />}
      />

    </Routes>
  )
}

function RoleHomeRedirect() {
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

  if (role === 'ADMIN') {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  if (role === 'DOCTOR') {
    return (
      <Navigate
        to="/appointments"
        replace
      />
    )
  }

  if (role === 'RECEPTIONIST') {
    return (
      <Navigate
        to="/patients"
        replace
      />
    )
  }

  if (role === 'PHARMACIST') {
    return (
      <Navigate
        to="/pharmacy"
        replace
      />
    )
  }

  if (role === 'ACCOUNTANT') {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  if (role === 'PATIENT') {
    return (
      <Navigate
        to="/settings"
        replace
      />
    )
  }

  return (
    <Navigate
      to="/login"
      replace
    />
  )
}

export default App