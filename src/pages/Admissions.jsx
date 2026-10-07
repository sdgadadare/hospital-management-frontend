import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './Admissions.css'
import { get, post, put, remove } from '../api'

const emptyForm = {
  patientId: '',
  roomId: '',
  admissionDate: '',
  dischargeDate: '',
  reason: '',
  notes: '',
  status: 'ADMITTED',
}

function Admissions() {
  const navigate = useNavigate()

  const [admissions, setAdmissions] = useState([])
  const [patients, setPatients] = useState([])
  const [rooms, setRooms] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [selectedAdmission, setSelectedAdmission] = useState(null)

  const [formData, setFormData] = useState(emptyForm)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [admissionData, patientData, roomData] = await Promise.all([
        get('/api/admissions'),
        get('/api/patients'),
        get('/api/rooms'),
      ])

      setAdmissions(
        Array.isArray(admissionData) ? admissionData : []
      )

      setPatients(
        Array.isArray(patientData) ? patientData : []
      )

      setRooms(
        Array.isArray(roomData) ? roomData : []
      )
    } catch (err) {
      console.error('Admissions API error:', err)
      setError(
        err.message || 'Unable to load admission data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // FIXED:
  // Backend Patient entity uses "fullName", not firstName/lastName.
  const getPatientName = (patient) => {
    if (!patient) {
      return 'Unknown Patient'
    }

    return (
      patient.fullName ||
      patient.name ||
      `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() ||
      'Unknown Patient'
    )
  }

  const getAdmissionPatient = (admission) => {
    if (admission.patient) {
      return getPatientName(admission.patient)
    }

    if (admission.patientName) {
      return admission.patientName
    }

    const patientId =
      admission.patientId ??
      admission.patient?.id

    const patient = patients.find(
      (item) => Number(item.id) === Number(patientId)
    )

    return patient
      ? getPatientName(patient)
      : 'Unknown Patient'
  }

  const getRoomNumber = (admission) => {
    if (admission.room?.roomNumber) {
      return admission.room.roomNumber
    }

    if (admission.roomNumber) {
      return admission.roomNumber
    }

    const roomId =
      admission.roomId ??
      admission.room?.id

    const room = rooms.find(
      (item) => Number(item.id) === Number(roomId)
    )

    return room?.roomNumber || 'Unknown Room'
  }

  const getPatientId = (admission) => {
    return admission.patient?.id ??
      admission.patientId ??
      ''
  }

  const getRoomId = (admission) => {
    return admission.room?.id ??
      admission.roomId ??
      ''
  }

  const filteredAdmissions = useMemo(() => {
    const value = search.toLowerCase().trim()

    return admissions.filter((admission) => {
      const patientName = getAdmissionPatient(admission)
        .toLowerCase()

      const roomNumber = getRoomNumber(admission)
        .toLowerCase()

      const reason = String(
        admission.reason ?? ''
      ).toLowerCase()

      const status = String(
        admission.status ?? ''
      ).toLowerCase()

      const matchesSearch =
        !value ||
        patientName.includes(value) ||
        roomNumber.includes(value) ||
        reason.includes(value) ||
        status.includes(value)

      const matchesStatus =
        statusFilter === 'ALL' ||
        status === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [
    admissions,
    patients,
    rooms,
    search,
    statusFilter,
  ])

  const statusOptions = useMemo(() => {
    const values = admissions
      .map((item) =>
        String(item.status ?? '').trim()
      )
      .filter(Boolean)

    const uniqueValues = [...new Set(values)]

    if (
      !uniqueValues.some(
        (item) =>
          item.toUpperCase() === 'ADMITTED'
      )
    ) {
      uniqueValues.unshift('ADMITTED')
    }

    return uniqueValues
  }, [admissions])

  const totalAdmissions = admissions.length

  const activeAdmissions = admissions.filter(
    (item) =>
      String(item.status ?? '').toUpperCase() ===
      'ADMITTED'
  ).length

  const dischargedAdmissions = admissions.filter(
    (item) =>
      String(item.status ?? '').toUpperCase() ===
      'DISCHARGED'
  ).length

  const availableRooms = rooms.filter(
    (room) => room.available === true
  ).length

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const openAddModal = () => {
    setEditingId(null)

    setFormData({
      ...emptyForm,
      admissionDate: new Date()
        .toISOString()
        .split('T')[0],
    })

    setModalOpen(true)
  }

  const openEditModal = (admission) => {
    setEditingId(admission.id)

    setFormData({
      patientId: getPatientId(admission),
      roomId: getRoomId(admission),
      admissionDate:
        admission.admissionDate ?? '',
      dischargeDate:
        admission.dischargeDate ?? '',
      reason:
        admission.reason ?? '',
      notes:
        admission.notes ?? '',
      status:
        admission.status ?? 'ADMITTED',
    })

    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const openViewModal = (admission) => {
    setSelectedAdmission(admission)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSelectedAdmission(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.patientId) {
      alert('Please select a patient.')
      return
    }

    if (!formData.roomId) {
      alert('Please select a room.')
      return
    }

    if (!formData.admissionDate) {
      alert('Please select admission date.')
      return
    }

    if (!formData.status.trim()) {
      alert('Please enter admission status.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        patient: {
          id: Number(formData.patientId),
        },

        room: {
          id: Number(formData.roomId),
        },

        admissionDate:
          formData.admissionDate,

        dischargeDate:
          formData.dischargeDate || null,

        reason:
          formData.reason.trim(),

        notes:
          formData.notes.trim(),

        status:
          formData.status.trim(),
      }

      if (editingId) {
        await put(
          `/api/admissions/${editingId}`,
          payload
        )
      } else {
        await post(
          '/api/admissions',
          payload
        )
      }

      await fetchData()
      closeModal()
    } catch (err) {
      console.error(
        'Save admission error:',
        err
      )

      alert(
        err.message ||
        'Unable to save admission record.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this admission record?'
    )

    if (!confirmed) return

    try {
      await remove(
        `/api/admissions/${id}`
      )

      setAdmissions((current) =>
        current.filter(
          (item) => item.id !== id
        )
      )
    } catch (err) {
      console.error(
        'Delete admission error:',
        err
      )

      alert(
        err.message ||
        'Unable to delete admission record.'
      )
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
      return date
    }

    return parsed.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const getStatusClass = (status) => {
    const value = String(status ?? '')
      .toLowerCase()
      .replace(/\s+/g, '-')

    if (value.includes('discharg')) {
      return 'status-discharged'
    }

    if (value.includes('cancel')) {
      return 'status-cancelled'
    }

    if (value.includes('pending')) {
      return 'status-pending'
    }

    return 'status-admitted'
  }

  return (
    <div className="admissions-page">

      <div className="admissions-header">
        <div>
          <h1>Admissions</h1>

          <p>
            Manage patient admissions, rooms and discharge
            information.
          </p>
        </div>

        <div className="header-actions">

          <button
            className="secondary-btn"
            onClick={() => navigate('/rooms')}
          >
            🛏 Manage Rooms
          </button>

          <button
            className="primary-btn"
            onClick={openAddModal}
          >
            + New Admission
          </button>

        </div>
      </div>

      <div className="admission-summary">

        <div className="summary-card">
          <div className="summary-icon blue">
            🏥
          </div>

          <div>
            <span>Total Admissions</span>
            <strong>{totalAdmissions}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>Active Admissions</span>
            <strong>{activeAdmissions}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon purple">
            ↗
          </div>

          <div>
            <span>Discharged</span>
            <strong>{dischargedAdmissions}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">
            🛏
          </div>

          <div>
            <span>Available Rooms</span>
            <strong>{availableRooms}</strong>
          </div>
        </div>

      </div>

      <div className="admissions-toolbar">

        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search patient, room, reason..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Status
          </option>

          {statusOptions.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="admissions-card">

        <div className="table-heading">

          <div>
            <h2>Admission Records</h2>

            <p>
              {filteredAdmissions.length} record
              {filteredAdmissions.length !== 1
                ? 's'
                : ''}{' '}
              found
            </p>
          </div>

        </div>

        <div className="table-wrapper">

          {loading ? (

            <div className="table-state">
              Loading admission records...
            </div>

          ) : filteredAdmissions.length === 0 ? (

            <div className="table-state">

              <div className="empty-icon">
                🏥
              </div>

              <h3>
                No admission records found
              </h3>

              <p>
                Add a new admission to get started.
              </p>

            </div>

          ) : (

            <table>

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Room</th>
                  <th>Admission Date</th>
                  <th>Discharge Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredAdmissions.map(
                  (admission) => (

                    <tr key={admission.id}>

                      <td>
                        <div className="patient-cell">

                          <div className="patient-avatar">
                            {getAdmissionPatient(
                              admission
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {getAdmissionPatient(
                              admission
                            )}
                          </strong>

                        </div>
                      </td>

                      <td>
                        <span className="room-badge">
                          🛏{' '}
                          {getRoomNumber(
                            admission
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          admission.admissionDate
                        )}
                      </td>

                      <td>
                        {formatDate(
                          admission.dischargeDate
                        )}
                      </td>

                      <td>
                        <span className="reason-text">
                          {admission.reason || '—'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            admission.status
                          )}`}
                        >
                          {admission.status || '—'}
                        </span>
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="icon-btn view"
                            title="View"
                            onClick={() =>
                              openViewModal(
                                admission
                              )
                            }
                          >
                            👁
                          </button>

                          <button
                            className="icon-btn edit"
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                admission
                              )
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="icon-btn delete"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                admission.id
                              )
                            }
                          >
                            🗑
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {modalOpen && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal()
            }
          }}
        >

          <div className="modal-card">

            <div className="modal-header">

              <div>
                <h2>
                  {editingId
                    ? 'Edit Admission'
                    : 'New Admission'}
                </h2>

                <p>
                  Enter patient admission details.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              className="admission-form"
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Patient <span>*</span>
                  </label>

                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select Patient
                    </option>

                    {patients.map((patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {getPatientName(patient)}
                      </option>
                    ))}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Room <span>*</span>
                  </label>

                  <select
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select Room
                    </option>

                    {rooms.map((room) => (
                      <option
                        key={room.id}
                        value={room.id}
                        disabled={
                          room.available === false &&
                          Number(room.id) !==
                            Number(
                              formData.roomId
                            )
                        }
                      >
                        {room.roomNumber}

                        {room.roomType
                          ? ` — ${room.roomType}`
                          : ''}

                        {room.available === false
                          ? ' (Occupied)'
                          : ' (Available)'}
                      </option>
                    ))}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Admission Date <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="admissionDate"
                    value={
                      formData.admissionDate
                    }
                    onChange={handleInputChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Discharge Date
                  </label>

                  <input
                    type="date"
                    name="dischargeDate"
                    value={
                      formData.dischargeDate
                    }
                    onChange={handleInputChange}
                  />

                </div>

                <div className="form-group">

                  <label>
                    Status <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    placeholder="e.g. ADMITTED"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Reason
                  </label>

                  <input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Reason for admission"
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                    rows="4"
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Admission'
                      : 'Create Admission'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {viewModalOpen && selectedAdmission && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewModal()
            }
          }}
        >

          <div className="modal-card view-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Admission Details
                </h2>

                <p>
                  Complete admission information.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeViewModal}
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div className="detail-item">

                <span>Patient</span>

                <strong>
                  {getAdmissionPatient(
                    selectedAdmission
                  )}
                </strong>

              </div>

              <div className="detail-item">

                <span>Room</span>

                <strong>
                  {getRoomNumber(
                    selectedAdmission
                  )}
                </strong>

              </div>

              <div className="detail-item">

                <span>Admission Date</span>

                <strong>
                  {formatDate(
                    selectedAdmission.admissionDate
                  )}
                </strong>

              </div>

              <div className="detail-item">

                <span>Discharge Date</span>

                <strong>
                  {formatDate(
                    selectedAdmission.dischargeDate
                  )}
                </strong>

              </div>

              <div className="detail-item">

                <span>Status</span>

                <strong>
                  {selectedAdmission.status || '—'}
                </strong>

              </div>

              <div className="detail-item">

                <span>Reason</span>

                <strong>
                  {selectedAdmission.reason || '—'}
                </strong>

              </div>

              <div className="detail-item full">

                <span>Notes</span>

                <strong>
                  {selectedAdmission.notes || '—'}
                </strong>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="cancel-btn"
                onClick={closeViewModal}
              >
                Close
              </button>

              <button
                className="save-btn"
                onClick={() => {
                  closeViewModal()
                  openEditModal(
                    selectedAdmission
                  )
                }}
              >
                Edit Admission
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Admissions