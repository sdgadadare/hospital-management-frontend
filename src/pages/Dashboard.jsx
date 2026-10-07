import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './Dashboard.css'

import { get } from '../api'

const emptyStats = {
  totalPatients: 0,
  totalDoctors: 0,
  totalAppointments: 0,
  availableBeds: 0,
}

function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState(emptyStats)
  const [appointments, setAppointments] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [rooms, setRooms] = useState([])
  const [bills, setBills] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const results = await Promise.allSettled([
        get('/api/dashboard/stats'),
        get('/api/appointments'),
        get('/api/admissions'),
        get('/api/rooms'),
        get('/api/bills'),
      ])

      const [
        statsResult,
        appointmentsResult,
        admissionsResult,
        roomsResult,
        billsResult,
      ] = results

      if (statsResult.status === 'fulfilled') {
        const data = statsResult.value || {}

        setStats({
          totalPatients: Number(data.totalPatients || 0),
          totalDoctors: Number(data.totalDoctors || 0),
          totalAppointments: Number(
            data.totalAppointments || 0
          ),
          availableBeds: Number(data.availableBeds || 0),
        })
      }

      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(
          Array.isArray(appointmentsResult.value)
            ? appointmentsResult.value
            : []
        )
      }

      if (admissionsResult.status === 'fulfilled') {
        setAdmissions(
          Array.isArray(admissionsResult.value)
            ? admissionsResult.value
            : []
        )
      }

      if (roomsResult.status === 'fulfilled') {
        setRooms(
          Array.isArray(roomsResult.value)
            ? roomsResult.value
            : []
        )
      }

      if (billsResult.status === 'fulfilled') {
        setBills(
          Array.isArray(billsResult.value)
            ? billsResult.value
            : []
        )
      }

      const everythingFailed = results.every(
        (result) => result.status === 'rejected'
      )

      if (everythingFailed) {
        throw new Error(
          'Unable to load dashboard data.'
        )
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(
        err.message || 'Unable to load dashboard data.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getPatientName = (appointment) => {
    const patient = appointment?.patient

    if (!patient) {
      return 'Unknown Patient'
    }

    return (
      [
        patient.firstName,
        patient.lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      patient.name ||
      patient.fullName ||
      `Patient #${patient.id}`
    )
  }

  const getDoctorName = (appointment) => {
    const doctor = appointment?.doctor

    if (!doctor) {
      return 'Unknown Doctor'
    }

    return (
      doctor.fullName ||
      doctor.name ||
      [
        doctor.firstName,
        doctor.lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      `Doctor #${doctor.id}`
    )
  }

  const getAppointmentDate = (appointment) => {
    return (
      appointment?.appointmentDate ||
      appointment?.date ||
      ''
    )
  }

  const getAppointmentTime = (appointment) => {
    return (
      appointment?.appointmentTime ||
      appointment?.time ||
      ''
    )
  }

  const getAppointmentStatus = (appointment) => {
    return (
      appointment?.status ||
      'PENDING'
    ).toString().toUpperCase()
  }

  const getAdmissionStatus = (admission) => {
    return (
      admission?.status ||
      'UNKNOWN'
    ).toString().toUpperCase()
  }

  const getRoomAvailable = (room) => {
    return Boolean(room?.available)
  }

  const formatDate = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (value) => {
    if (!value) return '-'

    const date = new Date(
      `1970-01-01T${value}`
    )

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return value
  }

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    )
  }

  const today = new Date()
    .toISOString()
    .split('T')[0]

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          getAppointmentDate(appointment) === today
      )
      .sort((a, b) =>
        String(
          getAppointmentTime(a)
        ).localeCompare(
          String(getAppointmentTime(b))
        )
      )
  }, [appointments, today])

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          getAppointmentDate(appointment) >= today
      )
      .sort((a, b) => {
        const first = `${getAppointmentDate(
          a
        )} ${getAppointmentTime(a)}`

        const second = `${getAppointmentDate(
          b
        )} ${getAppointmentTime(b)}`

        return first.localeCompare(second)
      })
      .slice(0, 6)
  }, [appointments, today])

  const activeAdmissions = useMemo(() => {
    return admissions.filter((admission) => {
      const status = getAdmissionStatus(admission)

      return ![
        'DISCHARGED',
        'CANCELLED',
        'COMPLETED',
      ].includes(status)
    })
  }, [admissions])

  const occupiedRooms = useMemo(() => {
    return rooms.filter(
      (room) => !getRoomAvailable(room)
    ).length
  }, [rooms])

  const totalRooms = rooms.length

  const calculatedOccupancy = useMemo(() => {
    if (totalRooms === 0) return 0

    return Math.round(
      (occupiedRooms / totalRooms) * 100
    )
  }, [occupiedRooms, totalRooms])

  const paidAmount = useMemo(() => {
    return bills.reduce(
      (sum, bill) =>
        sum + Number(bill.paidAmount || 0),
      0
    )
  }, [bills])

  const pendingAmount = useMemo(() => {
    return bills.reduce(
      (sum, bill) =>
        sum +
        Math.max(
          Number(bill.totalAmount || 0) -
            Number(bill.paidAmount || 0),
          0
        ),
      0
    )
  }, [bills])

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: '♙',
      className: 'blue',
      description: 'Registered patients',
      path: '/patients',
    },
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: '⚕',
      className: 'green',
      description: 'Medical professionals',
      path: '/doctors',
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: '▣',
      className: 'purple',
      description: 'All appointments',
      path: '/appointments',
    },
    {
      title: 'Available Beds',
      value: stats.availableBeds,
      icon: '▥',
      className: 'orange',
      description: 'Currently available',
      path: '/rooms',
    },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()

    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const displayName =
    user?.username ||
    user?.name ||
    'Admin'

  return (
    <div className="dashboard">
      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            HOSPITAL MANAGEMENT
          </span>

          <h1>
            {getGreeting()}, {displayName} 👋
          </h1>

          <p>
            Here's an overview of what's happening
            across the hospital today.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            className="refresh-button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            <span
              className={
                refreshing
                  ? 'refresh-icon spinning'
                  : 'refresh-icon'
              }
            >
              ↻
            </span>

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <button
            className="dashboard-primary-button"
            onClick={() =>
              navigate('/appointments')
            }
          >
            <span>＋</span>
            New Appointment
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="dashboard-error">
          <span>⚠</span>
          <div>
            <strong>Dashboard data issue</strong>
            <p>{error}</p>
          </div>

          <button
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {/* STATS */}

      <div className="dashboard-stats">
        {statCards.map((card) => (
          <button
            className="dashboard-stat-card"
            key={card.title}
            onClick={() => navigate(card.path)}
          >
            <div className="stat-card-top">
              <div
                className={`dashboard-stat-icon ${card.className}`}
              >
                {card.icon}
              </div>

              <span className="stat-arrow">
                →
              </span>
            </div>

            <span className="dashboard-stat-title">
              {card.title}
            </span>

            <strong className="dashboard-stat-value">
              {loading ? (
                <span className="loading-number">
                  —
                </span>
              ) : (
                card.value.toLocaleString('en-IN')
              )}
            </strong>

            <span className="dashboard-stat-description">
              {card.description}
            </span>
          </button>
        ))}
      </div>

      {/* MAIN GRID */}

      <div className="dashboard-main-grid">
        {/* APPOINTMENTS */}

        <div className="dashboard-panel appointments-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                SCHEDULE
              </span>

              <h2>Today's Appointments</h2>

              <p>
                {todayAppointments.length} appointment
                {todayAppointments.length !== 1
                  ? 's'
                  : ''}{' '}
                scheduled today
              </p>
            </div>

            <button
              className="panel-link"
              onClick={() =>
                navigate('/appointments')
              }
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="dashboard-spinner"></div>
              <span>Loading appointments...</span>
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                ✓
              </div>

              <strong>No appointments today</strong>

              <span>
                There are no appointments scheduled
                for today.
              </span>
            </div>
          ) : (
            <div className="appointment-list">
              {todayAppointments
                .slice(0, 6)
                .map((appointment) => {
                  const status =
                    getAppointmentStatus(
                      appointment
                    )

                  return (
                    <div
                      className="appointment-row"
                      key={appointment.id}
                    >
                      <div className="appointment-time">
                        <strong>
                          {formatTime(
                            getAppointmentTime(
                              appointment
                            )
                          )}
                        </strong>

                        <span>
                          {formatDate(
                            getAppointmentDate(
                              appointment
                            )
                          )}
                        </span>
                      </div>

                      <div className="appointment-person">
                        <div className="dashboard-avatar blue-avatar">
                          {getPatientName(
                            appointment
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {getPatientName(
                              appointment
                            )}
                          </strong>

                          <span>
                            {getDoctorName(
                              appointment
                            )}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`appointment-status ${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* HOSPITAL OVERVIEW */}

        <div className="dashboard-panel overview-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                CAPACITY
              </span>

              <h2>Hospital Overview</h2>

              <p>Current hospital capacity</p>
            </div>
          </div>

          <div className="occupancy-section">
            <div className="occupancy-top">
              <div>
                <span>Room Occupancy</span>

                <strong>
                  {totalRooms === 0
                    ? '--'
                    : `${calculatedOccupancy}%`}
                </strong>
              </div>

              <div className="occupancy-total">
                {occupiedRooms} / {totalRooms}
              </div>
            </div>

            <div className="occupancy-bar">
              <div
                className="occupancy-fill"
                style={{
                  width:
                    totalRooms === 0
                      ? '0%'
                      : `${calculatedOccupancy}%`,
                }}
              ></div>
            </div>

            <div className="occupancy-footer">
              <span>
                {stats.availableBeds} beds available
              </span>

              <button
                onClick={() => navigate('/rooms')}
              >
                Manage Rooms →
              </button>
            </div>
          </div>

          <div className="overview-list">
            <button
              className="overview-item"
              onClick={() =>
                navigate('/admissions')
              }
            >
              <div className="overview-icon blue">
                ♙
              </div>

              <div>
                <strong>Active Admissions</strong>
                <span>Currently admitted</span>
              </div>

              <b>{activeAdmissions.length}</b>
            </button>

            <button
              className="overview-item"
              onClick={() =>
                navigate('/appointments')
              }
            >
              <div className="overview-icon green">
                ✓
              </div>

              <div>
                <strong>Today's Visits</strong>
                <span>Scheduled appointments</span>
              </div>

              <b>{todayAppointments.length}</b>
            </button>

            <button
              className="overview-item"
              onClick={() =>
                navigate('/billing')
              }
            >
              <div className="overview-icon orange">
                ₹
              </div>

              <div>
                <strong>Pending Billing</strong>
                <span>Outstanding amount</span>
              </div>

              <b>
                {formatCurrency(pendingAmount)}
              </b>
            </button>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}

      <div className="dashboard-bottom-grid">
        {/* UPCOMING */}

        <div className="dashboard-panel upcoming-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                UPCOMING
              </span>

              <h2>Upcoming Appointments</h2>

              <p>
                Next scheduled patient visits
              </p>
            </div>

            <button
              className="panel-link"
              onClick={() =>
                navigate('/appointments')
              }
            >
              View All →
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="dashboard-empty small">
              <strong>
                No upcoming appointments
              </strong>

              <span>
                Upcoming appointments will appear
                here.
              </span>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingAppointments.map(
                (appointment) => (
                  <div
                    className="upcoming-row"
                    key={appointment.id}
                  >
                    <div className="upcoming-date">
                      <strong>
                        {new Date(
                          getAppointmentDate(
                            appointment
                          )
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            day: '2-digit',
                          }
                        )}
                      </strong>

                      <span>
                        {new Date(
                          getAppointmentDate(
                            appointment
                          )
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            month: 'short',
                          }
                        )}
                      </span>
                    </div>

                    <div className="upcoming-info">
                      <strong>
                        {getPatientName(
                          appointment
                        )}
                      </strong>

                      <span>
                        {getDoctorName(
                          appointment
                        )}{' '}
                        •{' '}
                        {formatTime(
                          getAppointmentTime(
                            appointment
                          )
                        )}
                      </span>
                    </div>

                    <span
                      className={`appointment-status ${getAppointmentStatus(
                        appointment
                      ).toLowerCase()}`}
                    >
                      {getAppointmentStatus(
                        appointment
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* FINANCIAL SUMMARY */}

        <div className="dashboard-panel finance-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                FINANCE
              </span>

              <h2>Billing Summary</h2>

              <p>Current payment overview</p>
            </div>

            <button
              className="panel-link"
              onClick={() => navigate('/billing')}
            >
              Manage →
            </button>
          </div>

          <div className="finance-summary">
            <div className="finance-block received">
              <span>Paid Amount</span>

              <strong>
                {formatCurrency(paidAmount)}
              </strong>

              <small>
                Amount received
              </small>
            </div>

            <div className="finance-block pending">
              <span>Pending Amount</span>

              <strong>
                {formatCurrency(pendingAmount)}
              </strong>

              <small>
                Outstanding balance
              </small>
            </div>
          </div>

          <div className="finance-footer">
            <div>
              <span>Total Bills</span>
              <strong>{bills.length}</strong>
            </div>

            <button
              onClick={() => navigate('/billing')}
            >
              Open Billing →
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}

      <div className="quick-actions-section">
        <div className="quick-heading">
          <div>
            <span className="panel-eyebrow">
              QUICK ACTIONS
            </span>

            <h2>Common Tasks</h2>
          </div>
        </div>

        <div className="quick-actions-grid">
          <button
            className="quick-action"
            onClick={() => navigate('/patients')}
          >
            <div className="quick-action-icon blue">
              ♙
            </div>

            <div>
              <strong>Patients</strong>
              <span>Manage patient records</span>
            </div>

            <b>→</b>
          </button>

          <button
            className="quick-action"
            onClick={() => navigate('/appointments')}
          >
            <div className="quick-action-icon purple">
              ▣
            </div>

            <div>
              <strong>Appointments</strong>
              <span>Schedule and manage visits</span>
            </div>

            <b>→</b>
          </button>

          <button
            className="quick-action"
            onClick={() => navigate('/admissions')}
          >
            <div className="quick-action-icon orange">
              ▥
            </div>

            <div>
              <strong>Admissions</strong>
              <span>Manage hospital admissions</span>
            </div>

            <b>→</b>
          </button>

          <button
            className="quick-action"
            onClick={() => navigate('/billing')}
          >
            <div className="quick-action-icon green">
              ₹
            </div>

            <div>
              <strong>Billing</strong>
              <span>Manage bills and payments</span>
            </div>

            <b>→</b>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard