import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import './Layout.css'

function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  }, [])

  const role = String(user?.role || 'PATIENT')
    .replace('ROLE_', '')
    .toUpperCase()

  const username = user?.username || 'User'

  const navigation = [
    {
      label: 'MAIN',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: '▦',
          roles: ['ADMIN', 'ACCOUNTANT'],
        },
        {
          label: 'Patients',
          path: '/patients',
          icon: '♙',
          roles: ['ADMIN', 'RECEPTIONIST'],
        },
        {
          label: 'Doctors',
          path: '/doctors',
          icon: '⚕',
          roles: ['ADMIN', 'RECEPTIONIST'],
        },
        {
          label: 'Appointments',
          path: '/appointments',
          icon: '▣',
          roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
        },
      ],
    },
    {
      label: 'HOSPITAL',
      items: [
        {
          label: 'Departments',
          path: '/departments',
          icon: '⌘',
          roles: ['ADMIN'],
        },
        {
          label: 'Admissions',
          path: '/admissions',
          icon: '▤',
          roles: ['ADMIN', 'RECEPTIONIST'],
        },
        {
          label: 'Rooms',
          path: '/rooms',
          icon: '▥',
          roles: ['ADMIN', 'RECEPTIONIST'],
        },
        {
          label: 'Medical Records',
          path: '/medical-records',
          icon: '▤',
          roles: ['ADMIN', 'DOCTOR'],
        },
      ],
    },
    {
      label: 'PHARMACY & BILLING',
      items: [
        {
          label: 'Pharmacy',
          path: '/pharmacy',
          icon: '✚',
          roles: ['ADMIN', 'PHARMACIST'],
        },
        {
          label: 'Prescriptions',
          path: '/prescriptions',
          icon: '▧',
          roles: ['ADMIN', 'DOCTOR', 'PHARMACIST'],
        },
        {
          label: 'Billing',
          path: '/billing',
          icon: '₹',
          roles: ['ADMIN', 'ACCOUNTANT'],
        },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        {
          label: 'Settings',
          path: '/settings',
          icon: '⚙',
          roles: [
            'ADMIN',
            'DOCTOR',
            'RECEPTIONIST',
            'PHARMACIST',
            'ACCOUNTANT',
            'PATIENT',
          ],
        },
      ],
    },
  ]

  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0)

  const getRoleLabel = () => {
    const labels = {
      ADMIN: 'Administrator',
      DOCTOR: 'Doctor',
      RECEPTIONIST: 'Receptionist',
      PHARMACIST: 'Pharmacist',
      ACCOUNTANT: 'Accountant',
      PATIENT: 'Patient',
    }

    return labels[role] || 'User'
  }

  const getInitial = () => {
    return username
      .trim()
      .charAt(0)
      .toUpperCase() || 'U'
  }

  const handleLogout = () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout?'
    )

    if (!confirmed) {
      return
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    navigate('/login', { replace: true })
  }

  const handleNavigation = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      <button
        className={`sidebar-overlay ${
          sidebarOpen ? 'show' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close menu"
      />

      <aside
        className={`sidebar ${
          sidebarOpen ? 'sidebar-open' : ''
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-logo">✚</div>

          <div className="brand-text">
            <strong>MediCare</strong>
            <span>Hospital Management</span>
          </div>

          <button
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {getInitial()}
          </div>

          <div className="user-details">
            <strong>{username}</strong>
            <span>{getRoleLabel()}</span>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {visibleGroups.map((group) => (
            <div
              className="nav-group"
              key={group.label}
            >
              <div className="nav-group-title">
                {group.label}
              </div>

              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    `nav-link ${
                      isActive ? 'active' : ''
                    }`
                  }
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span className="nav-label">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span className="logout-icon">↪</span>
            <span>Logout</span>
          </button>

          <div className="sidebar-version">
            MediCare HMS
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="topbar-title">
            <span>Hospital Management System</span>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">
              {getInitial()}
            </div>

            <div className="topbar-user-info">
              <strong>{username}</strong>
              <span>{getRoleLabel()}</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout