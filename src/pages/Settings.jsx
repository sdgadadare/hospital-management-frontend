import { useState } from 'react'
import './Settings.css'

function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)

  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@medicare.com',
    phone: '+91 98765 43210',
    role: 'Administrator',
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target

    setProfile((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    alert('Profile settings saved successfully.')
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">SYSTEM CONFIGURATION</p>
          <h1>Settings</h1>
          <p className="page-subtitle">
            Manage your profile, notifications and system preferences.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-menu">
          <button
            className={activeTab === 'profile' ? 'settings-menu-item active' : 'settings-menu-item'}
            onClick={() => setActiveTab('profile')}
          >
            <span className="settings-menu-icon">♙</span>
            <div>
              <strong>My Profile</strong>
              <small>Personal information</small>
            </div>
          </button>

          <button
            className={activeTab === 'notifications' ? 'settings-menu-item active' : 'settings-menu-item'}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="settings-menu-icon">♢</span>
            <div>
              <strong>Notifications</strong>
              <small>Alert preferences</small>
            </div>
          </button>

          <button
            className={activeTab === 'system' ? 'settings-menu-item active' : 'settings-menu-item'}
            onClick={() => setActiveTab('system')}
          >
            <span className="settings-menu-icon">⚙</span>
            <div>
              <strong>System</strong>
              <small>Application information</small>
            </div>
          </button>
        </aside>

        <section className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>My Profile</h2>
                  <p>Update your account information.</p>
                </div>
              </div>

              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="profile-top">
                  <div className="large-avatar">P</div>

                  <div>
                    <h3>{profile.name}</h3>
                    <p>{profile.role}</p>
                    <button
                      type="button"
                      className="secondary-btn"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Notification Preferences</h2>
                  <p>
                    Choose how you want to receive hospital system alerts.
                  </p>
                </div>
              </div>

              <div className="notification-list">
                <div className="notification-item">
                  <div>
                    <strong>System Notifications</strong>
                    <p>
                      Receive important notifications from the hospital system.
                    </p>
                  </div>

                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) =>
                        setNotifications(e.target.checked)
                      }
                    />
                    <span></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div>
                    <strong>Email Alerts</strong>
                    <p>
                      Receive appointment and billing alerts through email.
                    </p>
                  </div>

                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) =>
                        setEmailAlerts(e.target.checked)
                      }
                    />
                    <span></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div>
                    <strong>SMS Alerts</strong>
                    <p>
                      Receive important patient and appointment alerts by SMS.
                    </p>
                  </div>

                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) =>
                        setSmsAlerts(e.target.checked)
                      }
                    />
                    <span></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>System Information</h2>
                  <p>Information about the MediCare application.</p>
                </div>
              </div>

              <div className="system-info">
                <div className="system-info-row">
                  <span>Application</span>
                  <strong>MediCare Hospital Management</strong>
                </div>

                <div className="system-info-row">
                  <span>Frontend</span>
                  <strong>React + Vite</strong>
                </div>

                <div className="system-info-row">
                  <span>Backend</span>
                  <strong>Spring Boot</strong>
                </div>

                <div className="system-info-row">
                  <span>Database</span>
                  <strong>PostgreSQL</strong>
                </div>

                <div className="system-info-row">
                  <span>Authentication</span>
                  <strong>JWT</strong>
                </div>

                <div className="system-info-row">
                  <span>Version</span>
                  <strong>1.0.0</strong>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Settings