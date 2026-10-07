import { useEffect, useMemo, useState } from 'react'
import { get, remove } from '../api'
import './Users.css'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await get('/api/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const username = String(user.username || '').toLowerCase()
      const searchText = search.toLowerCase().trim()

      const matchesSearch =
        !searchText ||
        username.includes(searchText) ||
        String(user.id || '').includes(searchText)

      const role = String(user.role || '')
        .replace('ROLE_', '')
        .toUpperCase()

      const matchesRole =
        roleFilter === 'ALL' || role === roleFilter

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && user.enabled === true) ||
        (statusFilter === 'DISABLED' && user.enabled === false)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const stats = useMemo(() => {
    const active = users.filter((user) => user.enabled).length

    const roles = new Set(
      users.map((user) =>
        String(user.role || '')
          .replace('ROLE_', '')
          .toUpperCase()
      )
    )

    return {
      total: users.length,
      active,
      disabled: users.length - active,
      roles: roles.size,
    }
  }, [users])

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.username}"?`
    )

    if (!confirmed) return

    try {
      await remove(`/api/users/${user.id}`)

      setUsers((current) =>
        current.filter((item) => item.id !== user.id)
      )

      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user.')
    }
  }

  const getRoleClass = (role) => {
    return String(role || '')
      .replace('ROLE_', '')
      .toLowerCase()
  }

  const formatRole = (role) => {
    return String(role || '')
      .replace('ROLE_', '')
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return (
    <div className="users-page">

      {/* HEADER */}
      <div className="users-header">
        <div>
          <span className="page-eyebrow">ADMINISTRATION</span>
          <h1>User Management</h1>
          <p>
            Manage hospital system users and monitor account status.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadUsers}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="users-error">
          <span>⚠</span>
          <div>
            <strong>Unable to load users</strong>
            <p>{error}</p>
          </div>
          <button onClick={loadUsers}>Retry</button>
        </div>
      )}

      {/* STATS */}
      <div className="user-stat-grid">

        <div className="user-stat-card">
          <div className="user-stat-icon blue">👥</div>
          <div>
            <span>Total Users</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon green">✓</div>
          <div>
            <span>Active Users</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon orange">!</div>
          <div>
            <span>Disabled Users</span>
            <strong>{stats.disabled}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon purple">◆</div>
          <div>
            <span>Roles Used</span>
            <strong>{stats.roles}</strong>
          </div>
        </div>

      </div>

      {/* MAIN CARD */}
      <div className="users-card">

        <div className="users-toolbar">

          <div className="users-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by username or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-group">

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="PATIENT">Patient</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>

          </div>

        </div>

        {/* TABLE */}
        <div className="users-table-wrapper">

          {loading ? (
            <div className="users-loading">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="users-empty">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
              <p>
                Try changing your search or filter options.
              </p>
            </div>
          ) : (
            <table className="users-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {

                  const role = String(user.role || '')
                    .replace('ROLE_', '')
                    .toUpperCase()

                  return (
                    <tr key={user.id}>

                      <td>
                        <span className="user-id">
                          #{user.id}
                        </span>
                      </td>

                      <td>
                        <div className="user-info">

                          <div className="user-avatar">
                            {String(user.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {user.username}
                            </strong>
                            <span>
                              User ID: {user.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`role-badge ${getRoleClass(
                            role
                          )}`}
                        >
                          {formatRole(role)}
                        </span>
                      </td>

                      <td>
                        {user.enabled ? (
                          <span className="status-badge active">
                            <span className="status-dot"></span>
                            Active
                          </span>
                        ) : (
                          <span className="status-badge disabled">
                            <span className="status-dot"></span>
                            Disabled
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">

                          <button
                            className="action-btn view"
                            title="View user"
                            onClick={() =>
                              setSelectedUser(user)
                            }
                          >
                            👁
                          </button>

                          <button
                            className="action-btn delete"
                            title="Delete user"
                            onClick={() =>
                              handleDelete(user)
                            }
                          >
                            🗑
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>

            </table>
          )}

        </div>

        {!loading && filteredUsers.length > 0 && (
          <div className="users-footer">
            Showing <strong>{filteredUsers.length}</strong> of{' '}
            <strong>{users.length}</strong> users
          </div>
        )}

      </div>

      {/* VIEW MODAL */}
      {selectedUser && (
        <div
          className="user-modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="user-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  USER DETAILS
                </span>
                <h2>User Information</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-user-profile">

              <div className="large-user-avatar">
                {String(selectedUser.username || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>{selectedUser.username}</h3>

                <span
                  className={`role-badge ${getRoleClass(
                    selectedUser.role
                  )}`}
                >
                  {formatRole(selectedUser.role)}
                </span>
              </div>

            </div>

            <div className="user-detail-grid">

              <div className="detail-item">
                <span>User ID</span>
                <strong>#{selectedUser.id}</strong>
              </div>

              <div className="detail-item">
                <span>Username</span>
                <strong>{selectedUser.username}</strong>
              </div>

              <div className="detail-item">
                <span>Role</span>
                <strong>
                  {formatRole(selectedUser.role)}
                </strong>
              </div>

              <div className="detail-item">
                <span>Account Status</span>
                <strong
                  className={
                    selectedUser.enabled
                      ? 'text-active'
                      : 'text-disabled'
                  }
                >
                  {selectedUser.enabled
                    ? 'Active'
                    : 'Disabled'}
                </strong>
              </div>

            </div>

            <div className="modal-footer">

              <button
                className="modal-secondary-btn"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>

              <button
                className="modal-delete-btn"
                onClick={() => {
                  handleDelete(selectedUser)
                }}
              >
                🗑 Delete User
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Users