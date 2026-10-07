import { useEffect, useMemo, useState } from 'react'
import { get, post, put, remove } from '../api'
import './Doctors.css'

const emptyForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  qualification: '',
  specialization: '',
  consultationFee: '',
  joiningDate: '',
  available: true,
}

function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await get('/api/doctors')

      setDoctors(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Doctors API error:', err)
      setError(err.message || 'Unable to load doctor data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  const filteredDoctors = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) {
      return doctors
    }

    return doctors.filter((doctor) => {
      const name = String(doctor.fullName ?? '').toLowerCase()
      const email = String(doctor.email ?? '').toLowerCase()
      const phone = String(doctor.phoneNumber ?? '').toLowerCase()
      const qualification = String(
        doctor.qualification ?? ''
      ).toLowerCase()
      const specialization = String(
        doctor.specialization ?? ''
      ).toLowerCase()

      return (
        name.includes(value) ||
        email.includes(value) ||
        phone.includes(value) ||
        qualification.includes(value) ||
        specialization.includes(value)
      )
    })
  }, [doctors, search])

  const getDoctorName = (doctor) => {
    return doctor.fullName || 'Unknown Doctor'
  }

  const getInitial = (doctor) => {
    return getDoctorName(doctor)
      .charAt(0)
      .toUpperCase()
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedDoctor(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (doctor) => {
    setModalMode('edit')
    setSelectedDoctor(doctor)

    setForm({
      fullName: doctor.fullName ?? '',
      email: doctor.email ?? '',
      phoneNumber: doctor.phoneNumber ?? '',
      qualification: doctor.qualification ?? '',
      specialization: doctor.specialization ?? '',
      consultationFee: doctor.consultationFee ?? '',
      joiningDate: doctor.joiningDate ?? '',
      available:
        doctor.available !== undefined
          ? doctor.available
          : true,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openViewModal = (doctor) => {
    setModalMode('view')
    setSelectedDoctor(doctor)

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setSelectedDoctor(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateForm = () => {
    if (!form.fullName.trim()) {
      return 'Doctor name is required.'
    }

    if (!form.phoneNumber.trim()) {
      return 'Phone number is required.'
    }

    if (!form.specialization.trim()) {
      return 'Specialization is required.'
    }

    if (!form.consultationFee) {
      return 'Consultation fee is required.'
    }

    if (Number(form.consultationFee) < 0) {
      return 'Consultation fee cannot be negative.'
    }

    return ''
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        qualification: form.qualification.trim() || null,
        specialization: form.specialization.trim(),
        consultationFee: Number(form.consultationFee),
        joiningDate: form.joiningDate || null,
        available: Boolean(form.available),
      }

      if (modalMode === 'edit') {
        const updatedDoctor = await put(
          `/api/doctors/${selectedDoctor.id}`,
          payload
        )

        setDoctors((current) =>
          current.map((doctor) =>
            doctor.id === selectedDoctor.id
              ? updatedDoctor
              : doctor
          )
        )

        setSuccess('Doctor updated successfully.')
      } else {
        const createdDoctor = await post(
          '/api/doctors',
          payload
        )

        setDoctors((current) => [
          ...current,
          createdDoctor,
        ])

        setSuccess('Doctor added successfully.')
      }

      setTimeout(() => {
        closeModal()
      }, 700)
    } catch (err) {
      console.error('Save doctor error:', err)

      setError(
        err.message ||
        'Unable to save doctor. Please check the backend.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this doctor?'
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await remove(`/api/doctors/${id}`)

      setDoctors((current) =>
        current.filter((doctor) => doctor.id !== id)
      )

      setSuccess('Doctor deleted successfully.')

      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Delete doctor error:', err)

      setError(
        err.message ||
        'Unable to delete doctor.'
      )
    }
  }

  return (
    <div className="doctors-page">

      <div className="page-heading">
        <div>
          <h1>Doctors</h1>
          <p>
            Manage doctors, specializations and contact information.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Doctor
        </button>
      </div>

      {success && !showModal && (
        <div className="doctors-success">
          ✓ {success}
        </div>
      )}

      <div className="doctor-summary">

        <div className="summary-card">
          <div className="summary-icon blue">⚕</div>
          <div>
            <span>Total Doctors</span>
            <strong>{doctors.length}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">✓</div>
          <div>
            <span>Available Doctors</span>
            <strong>
              {doctors.filter(
                (doctor) => doctor.available
              ).length}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon purple">✚</div>
          <div>
            <span>Specializations</span>
            <strong>
              {
                new Set(
                  doctors
                    .map((doctor) => doctor.specialization)
                    .filter(Boolean)
                ).size
              }
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">★</div>
          <div>
            <span>Active Staff</span>
            <strong>
              {doctors.filter(
                (doctor) => doctor.available
              ).length}
            </strong>
          </div>
        </div>

      </div>

      <div className="doctors-card">

        <div className="doctors-toolbar">

          <div>
            <h2>Doctor Directory</h2>
            <p>
              {filteredDoctors.length} doctors found
            </p>
          </div>

          <div className="doctor-actions">

            <div className="doctor-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <button
              className="filter-btn"
              onClick={() => setSearch('')}
            >
              Clear
            </button>

          </div>

        </div>

        {error && !showModal && (
          <div className="doctors-error">
            {error}
          </div>
        )}

        <div className="doctors-table-wrapper">

          <table className="doctors-table">

            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="table-message"
                  >
                    Loading doctors...
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="table-message"
                  >
                    No doctors found.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.id}>

                    <td>
                      <div className="doctor-info">

                        <div className="doctor-avatar">
                          {getInitial(doctor)}
                        </div>

                        <div>
                          <strong>
                            {getDoctorName(doctor)}
                          </strong>

                          <span>
                            ID: #{doctor.id}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      {doctor.specialization || '—'}
                    </td>

                    <td>
                      {doctor.qualification || '—'}
                    </td>

                    <td>
                      {doctor.phoneNumber || '—'}
                    </td>

                    <td>
                      {doctor.email || '—'}
                    </td>

                    <td>
                      ₹
                      {doctor.consultationFee != null
                        ? Number(
                            doctor.consultationFee
                          ).toLocaleString('en-IN')
                        : '—'}
                    </td>

                    <td>
                      <span
                        className={
                          doctor.available
                            ? 'doctor-status available'
                            : 'doctor-status unavailable'
                        }
                      >
                        {doctor.available
                          ? 'Available'
                          : 'Unavailable'}
                      </span>
                    </td>

                    <td>

                      <div className="row-actions">

                        <button
                          className="action-btn view"
                          title="View"
                          onClick={() =>
                            openViewModal(doctor)
                          }
                        >
                          👁
                        </button>

                        <button
                          className="action-btn edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(doctor)
                          }
                        >
                          ✎
                        </button>

                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(doctor.id)
                          }
                        >
                          ×
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        <div className="doctors-footer">

          <span>
            Showing {filteredDoctors.length} of{' '}
            {doctors.length} doctors
          </span>

          <div className="pagination">
            <button disabled>←</button>
            <button className="active-page">1</button>
            <button disabled>→</button>
          </div>

        </div>

      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >

          <div className="doctor-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {modalMode === 'add'
                    ? 'Add Doctor'
                    : modalMode === 'edit'
                    ? 'Edit Doctor'
                    : 'Doctor Details'}
                </h2>

                <p>
                  {modalMode === 'view'
                    ? 'View complete doctor information.'
                    : 'Enter doctor information below.'}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}

            {modalMode === 'view' ? (

              <div className="doctor-details">

                <div className="detail-profile">

                  <div className="detail-avatar">
                    {getInitial(selectedDoctor)}
                  </div>

                  <div>
                    <h3>
                      {selectedDoctor?.fullName}
                    </h3>

                    <span>
                      Doctor ID: #{selectedDoctor?.id}
                    </span>
                  </div>

                </div>

                <div className="detail-grid">

                  <div className="detail-item">
                    <span>Specialization</span>
                    <strong>
                      {selectedDoctor?.specialization || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Qualification</span>
                    <strong>
                      {selectedDoctor?.qualification || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Phone</span>
                    <strong>
                      {selectedDoctor?.phoneNumber || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Email</span>
                    <strong>
                      {selectedDoctor?.email || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Consultation Fee</span>
                    <strong>
                      ₹
                      {selectedDoctor?.consultationFee != null
                        ? Number(
                            selectedDoctor.consultationFee
                          ).toLocaleString('en-IN')
                        : '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Joining Date</span>
                    <strong>
                      {selectedDoctor?.joiningDate || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Status</span>
                    <strong>
                      {selectedDoctor?.available
                        ? 'Available'
                        : 'Unavailable'}
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
                      openEditModal(selectedDoctor)
                    }
                  >
                    ✎ Edit Doctor
                  </button>

                </div>

              </div>

            ) : (

              <form
                className="doctor-form"
                onSubmit={handleSave}
              >

                <div className="form-section-title">
                  Doctor Information
                </div>

                <div className="form-row">

                  <div className="form-group">
                    <label>
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Enter doctor's full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Specialization *
                    </label>

                    <input
                      type="text"
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Cardiology"
                    />
                  </div>

                </div>

                <div className="form-row">

                  <div className="form-group">
                    <label>
                      Qualification
                    </label>

                    <input
                      type="text"
                      name="qualification"
                      value={form.qualification}
                      onChange={handleChange}
                      placeholder="e.g. MBBS, MD"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Consultation Fee *
                    </label>

                    <input
                      type="number"
                      name="consultationFee"
                      min="0"
                      step="0.01"
                      value={form.consultationFee}
                      onChange={handleChange}
                      placeholder="Enter fee"
                    />
                  </div>

                </div>

                <div className="form-section-title">
                  Contact Information
                </div>

                <div className="form-row">

                  <div className="form-group">
                    <label>
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  </div>

                </div>

                <div className="form-section-title">
                  Employment Information
                </div>

                <div className="form-row">

                  <div className="form-group">
                    <label>
                      Joining Date
                    </label>

                    <input
                      type="date"
                      name="joiningDate"
                      value={form.joiningDate || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group checkbox-group">

                    <label className="checkbox-label">

                      <input
                        type="checkbox"
                        name="available"
                        checked={form.available}
                        onChange={handleChange}
                      />

                      <span>
                        Doctor currently available
                      </span>

                    </label>

                  </div>

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
                      : modalMode === 'edit'
                      ? 'Save Changes'
                      : 'Save Doctor'}
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

export default Doctors