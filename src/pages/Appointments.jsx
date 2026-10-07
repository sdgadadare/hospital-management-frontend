import { useEffect, useMemo, useState } from 'react'
import './Appointments.css'
import { get, post, put, remove } from '../api'

function Appointments() {
  const emptyForm = {
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    status: 'SCHEDULED',
  }

  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [appointmentData, patientData, doctorData] =
        await Promise.all([
          get('/api/appointments'),
          get('/api/patients'),
          get('/api/doctors'),
        ])

      setAppointments(
        Array.isArray(appointmentData)
          ? appointmentData
          : []
      )

      setPatients(
        Array.isArray(patientData)
          ? patientData
          : []
      )

      setDoctors(
        Array.isArray(doctorData)
          ? doctorData
          : []
      )
    } catch (err) {
      console.error('Appointments API error:', err)
      setError(
        err.message ||
        'Unable to load appointment data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getPatientName = (appointment) => {
    const patient = appointment.patient

    if (!patient) {
      return 'Unknown Patient'
    }

    if (patient.fullName) {
      return patient.fullName
    }

    const fullName =
      `${patient.firstName || ''} ${patient.lastName || ''}`
        .trim()

    return (
      fullName ||
      patient.name ||
      'Unknown Patient'
    )
  }

  const getDoctorName = (appointment) => {
    const doctor = appointment.doctor

    if (!doctor) {
      return 'Unknown Doctor'
    }

    return (
      doctor.fullName ||
      doctor.name ||
      'Unknown Doctor'
    )
  }

  const getPatientId = (appointment) => {
    return appointment.patient?.id || ''
  }

  const getDoctorId = (appointment) => {
    return appointment.doctor?.id || ''
  }

  const formatStatus = (status) => {
    if (!status) return 'Scheduled'

    return String(status)
      .toLowerCase()
      .replace(/\_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const getStatusClass = (status) => {
    const value = String(status || '')
      .toUpperCase()

    if (value === 'SCHEDULED') return 'scheduled'
    if (value === 'CONFIRMED') return 'confirmed'
    if (value === 'COMPLETED') return 'completed'
    if (value === 'CANCELLED') return 'cancelled'

    return 'scheduled'
  }

  const formatDate = (date) => {
    if (!date) return '—'

    const parts = String(date).split('-')

    if (parts.length !== 3) {
      return date
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  const formatTime = (time) => {
    if (!time) return '—'

    const value = String(time).substring(0, 5)
    const [hours, minutes] = value.split(':')

    if (
      hours === undefined ||
      minutes === undefined
    ) {
      return time
    }

    const hour = Number(hours)
    const suffix = hour >= 12 ? 'PM' : 'AM'

    const displayHour =
      hour % 12 === 0 ? 12 : hour % 12

    return `${displayHour}:${minutes} ${suffix}`
  }

  const filteredAppointments = useMemo(() => {
    const value = search.toLowerCase().trim()

    return appointments.filter((appointment) => {
      const patient =
        getPatientName(appointment).toLowerCase()

      const doctor =
        getDoctorName(appointment).toLowerCase()

      const reason =
        String(
          appointment.reason || ''
        ).toLowerCase()

      const status =
        String(
          appointment.status || ''
        ).toLowerCase()

      const matchesSearch =
        !value ||
        patient.includes(value) ||
        doctor.includes(value) ||
        reason.includes(value) ||
        status.includes(value)

      const matchesStatus =
        statusFilter === 'ALL' ||
        String(
          appointment.status || ''
        ).toUpperCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [
    appointments,
    search,
    statusFilter,
  ])

  const scheduledCount = appointments.filter(
    (appointment) =>
      String(
        appointment.status || ''
      ).toUpperCase() === 'SCHEDULED'
  ).length

  const confirmedCount = appointments.filter(
    (appointment) =>
      String(
        appointment.status || ''
      ).toUpperCase() === 'CONFIRMED'
  ).length

  const completedCount = appointments.filter(
    (appointment) =>
      String(
        appointment.status || ''
      ).toUpperCase() === 'COMPLETED'
  ).length

  const openAddModal = () => {
    setModalMode('add')
    setSelectedAppointment(null)
    setFormData({
      ...emptyForm,
      status: 'SCHEDULED',
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (appointment) => {
    setModalMode('edit')
    setSelectedAppointment(appointment)

    const existingStatus =
      String(
        appointment.status || 'SCHEDULED'
      ).toUpperCase()

    const validStatuses = [
      'SCHEDULED',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
    ]

    setFormData({
      patientId: getPatientId(appointment),
      doctorId: getDoctorId(appointment),
      appointmentDate:
        appointment.appointmentDate || '',
      appointmentTime:
        appointment.appointmentTime
          ? String(
              appointment.appointmentTime
            ).substring(0, 5)
          : '',
      reason: appointment.reason || '',
      status: validStatuses.includes(
        existingStatus
      )
        ? existingStatus
        : 'SCHEDULED',
    })

    setError('')
    setShowModal(true)
  }

  const openViewModal = (appointment) => {
    setModalMode('view')
    setSelectedAppointment(appointment)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setSelectedAppointment(null)
    setFormData(emptyForm)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.patientId) {
      alert('Please select a patient.')
      return
    }

    if (!formData.doctorId) {
      alert('Please select a doctor.')
      return
    }

    if (!formData.appointmentDate) {
      alert('Please select appointment date.')
      return
    }

    if (!formData.appointmentTime) {
      alert('Please select appointment time.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const validStatuses = [
        'SCHEDULED',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED',
      ]

      const status = validStatuses.includes(
        String(formData.status).toUpperCase()
      )
        ? String(formData.status).toUpperCase()
        : 'SCHEDULED'

      const payload = {
        patient: {
          id: Number(formData.patientId),
        },

        doctor: {
          id: Number(formData.doctorId),
        },

        appointmentDate:
          formData.appointmentDate,

        appointmentTime:
          formData.appointmentTime,

        reason:
          formData.reason.trim(),

        status,
      }

      if (modalMode === 'add') {
        const created = await post(
          '/api/appointments',
          payload
        )

        setAppointments((current) => [
          ...current,
          created,
        ])

        alert(
          'Appointment created successfully.'
        )
      } else {
        const updated = await put(
          `/api/appointments/${selectedAppointment.id}`,
          payload
        )

        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id ===
            selectedAppointment.id
              ? updated
              : appointment
          )
        )

        alert(
          'Appointment updated successfully.'
        )
      }

      closeModal()
    } catch (err) {
      console.error(
        'Appointment save error:',
        err
      )

      alert(
        err.message ||
        'Unable to save appointment.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this appointment?'
    )

    if (!confirmed) return

    try {
      await remove(
        `/api/appointments/${id}`
      )

      setAppointments((current) =>
        current.filter(
          (appointment) =>
            appointment.id !== id
        )
      )

      alert(
        'Appointment deleted successfully.'
      )
    } catch (err) {
      console.error(
        'Delete appointment error:',
        err
      )

      alert(
        err.message ||
        'Unable to delete appointment.'
      )
    }
  }

  const handleStatusChange = async (
    appointment,
    status
  ) => {
    try {
      const validStatuses = [
        'SCHEDULED',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED',
      ]

      const normalizedStatus =
        validStatuses.includes(
          String(status).toUpperCase()
        )
          ? String(status).toUpperCase()
          : 'SCHEDULED'

      const payload = {
        patient: {
          id: Number(
            getPatientId(appointment)
          ),
        },

        doctor: {
          id: Number(
            getDoctorId(appointment)
          ),
        },

        appointmentDate:
          appointment.appointmentDate,

        appointmentTime:
          String(
            appointment.appointmentTime || ''
          ).substring(0, 5),

        reason:
          appointment.reason || '',

        status: normalizedStatus,
      }

      const updated = await put(
        `/api/appointments/${appointment.id}`,
        payload
      )

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id
            ? updated
            : item
        )
      )
    } catch (err) {
      console.error(
        'Appointment status error:',
        err
      )

      alert(
        err.message ||
        'Unable to update appointment status.'
      )
    }
  }

  return (
    <div className="appointments-page">

      {/* HEADER */}

      <div className="page-heading">

        <div>
          <h1>Appointments</h1>

          <p>
            Manage patient appointments and schedules.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <span>+</span>
          New Appointment
        </button>

      </div>

      {/* SUMMARY */}

      <div className="appointment-summary">

        <div className="summary-card">

          <div className="summary-icon blue">
            ▣
          </div>

          <div>
            <span>Total Appointments</span>
            <strong>
              {appointments.length}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon orange">
            ◷
          </div>

          <div>
            <span>Scheduled</span>
            <strong>
              {scheduledCount}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>Confirmed</span>
            <strong>
              {confirmedCount}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon purple">
            ✓
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {completedCount}
            </strong>
          </div>

        </div>

      </div>

      {/* MAIN CARD */}

      <div className="appointments-card">

        <div className="appointments-toolbar">

          <div>

            <h2>Appointment Schedule</h2>

            <p>
              {filteredAppointments.length}{' '}
              appointments found
            </p>

          </div>

          <div className="appointment-filters">

            <div className="appointment-search">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search patient, doctor..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="status-filter"
            >

              <option value="ALL">
                All Status
              </option>

              <option value="SCHEDULED">
                Scheduled
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>

            </select>

          </div>

        </div>

        {error && (
          <div className="appointments-error">
            {error}
          </div>
        )}

        {/* TABLE */}

        <div className="appointments-table-wrapper">

          <table className="appointments-table">

            <thead>

              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="table-message"
                  >
                    Loading appointments...
                  </td>
                </tr>

              ) : filteredAppointments.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="table-message"
                  >
                    No appointments found.
                  </td>
                </tr>

              ) : (

                filteredAppointments.map(
                  (appointment) => {

                    const patientName =
                      getPatientName(
                        appointment
                      )

                    const doctorName =
                      getDoctorName(
                        appointment
                      )

                    return (

                      <tr
                        key={appointment.id}
                      >

                        {/* PATIENT */}

                        <td>

                          <div className="person-info">

                            <div className="person-avatar patient-avatar">
                              {patientName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {patientName}
                              </strong>

                              <span>
                                ID: #
                                {getPatientId(
                                  appointment
                                )}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* DOCTOR */}

                        <td>

                          <div className="person-info doctor-info">

                            <div className="person-avatar doctor-avatar">
                              ⚕
                            </div>

                            <div>

                              <strong>
                                {doctorName}
                              </strong>

                              <span>
                                ID: #
                                {getDoctorId(
                                  appointment
                                )}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* DATE */}

                        <td>
                          <span className="date-text">
                            {formatDate(
                              appointment.appointmentDate
                            )}
                          </span>
                        </td>

                        {/* TIME */}

                        <td>
                          <span className="time-text">
                            {formatTime(
                              appointment.appointmentTime
                            )}
                          </span>
                        </td>

                        {/* REASON */}

                        <td>
                          <span className="reason-text">
                            {appointment.reason ||
                              'General consultation'}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`appointment-status ${getStatusClass(
                              appointment.status
                            )}`}
                          >
                            {formatStatus(
                              appointment.status
                            )}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="row-actions">

                            <button
                              className="action-btn view"
                              title="View"
                              onClick={() =>
                                openViewModal(
                                  appointment
                                )
                              }
                            >
                              👁
                            </button>

                            <button
                              className="action-btn edit"
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  appointment
                                )
                              }
                            >
                              ✎
                            </button>

                            <button
                              className="action-btn delete"
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  appointment.id
                                )
                              }
                            >
                              ×
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* MODAL */}

      {showModal && (

        <div
          className="appointment-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="appointment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  {modalMode === 'add'
                    ? 'New Appointment'
                    : modalMode === 'edit'
                    ? 'Edit Appointment'
                    : 'Appointment Details'}
                </h2>

                <p>
                  {modalMode === 'view'
                    ? 'View appointment information.'
                    : 'Enter appointment details below.'}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            {/* VIEW */}

            {modalMode === 'view' ? (

              <div className="appointment-view">

                <div className="appointment-view-icon">
                  ▣
                </div>

                <h3>
                  Appointment #
                  {selectedAppointment?.id}
                </h3>

                <span
                  className={`appointment-status ${getStatusClass(
                    selectedAppointment?.status
                  )}`}
                >
                  {formatStatus(
                    selectedAppointment?.status
                  )}
                </span>

                <div className="view-grid">

                  <div className="view-item">

                    <span>Patient</span>

                    <strong>
                      {getPatientName(
                        selectedAppointment
                      )}
                    </strong>

                  </div>

                  <div className="view-item">

                    <span>Doctor</span>

                    <strong>
                      {getDoctorName(
                        selectedAppointment
                      )}
                    </strong>

                  </div>

                  <div className="view-item">

                    <span>Date</span>

                    <strong>
                      {formatDate(
                        selectedAppointment?.appointmentDate
                      )}
                    </strong>

                  </div>

                  <div className="view-item">

                    <span>Time</span>

                    <strong>
                      {formatTime(
                        selectedAppointment?.appointmentTime
                      )}
                    </strong>

                  </div>

                  <div className="view-item full">

                    <span>Reason</span>

                    <strong>
                      {selectedAppointment?.reason ||
                        'General consultation'}
                    </strong>

                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    className="secondary-btn"
                    onClick={closeModal}
                  >
                    Close
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      openEditModal(
                        selectedAppointment
                      )
                    }
                  >
                    ✎ Edit Appointment
                  </button>

                </div>

              </div>

            ) : (

              /* ADD / EDIT */

              <form
                className="appointment-form"
                onSubmit={handleSubmit}
              >

                <div className="form-group">

                  <label>
                    Patient <span>*</span>
                  </label>

                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select Patient
                    </option>

                    {patients.map((patient) => {

                      const name =
                        patient.fullName ||
                        `${patient.firstName || ''} ${patient.lastName || ''}`
                          .trim()

                      return (

                        <option
                          key={patient.id}
                          value={patient.id}
                        >
                          {name ||
                            patient.name ||
                            `Patient #${patient.id}`}
                        </option>

                      )
                    })}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Doctor <span>*</span>
                  </label>

                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select Doctor
                    </option>

                    {doctors.map((doctor) => (

                      <option
                        key={doctor.id}
                        value={doctor.id}
                      >
                        {doctor.fullName ||
                          doctor.name ||
                          `Doctor #${doctor.id}`}
                      </option>

                    ))}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Appointment Date <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Appointment Time <span>*</span>
                  </label>

                  <input
                    type="time"
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Reason
                  </label>

                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Enter reason for appointment..."
                    rows="3"
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Appointment Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >

                    <option value="SCHEDULED">
                      Scheduled
                    </option>

                    <option value="CONFIRMED">
                      Confirmed
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>

                  </select>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : modalMode === 'add'
                      ? 'Create Appointment'
                      : 'Save Changes'}
                  </button>

                </div>

              </form>

            )}

          </div>

        </div>

      )}

    </div>
  )
}

export default Appointments