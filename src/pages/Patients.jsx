import { useEffect, useMemo, useState } from 'react'
import { get, post, put, remove } from '../api'
import './Patients.css'

const emptyForm = {
  firstName: '',
  lastName: '',
  gender: '',
  age: '',
  phone: '',
  email: '',
  address: '',
  bloodGroup: '',
}

function Patients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await get('/api/patients')

      setPatients(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Patients API error:', err)
      setError(err.message || 'Unable to load patient data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const getPatientName = (patient) => {
    if (patient.fullName) {
      return patient.fullName
    }

    const firstName = patient.firstName ?? ''
    const lastName = patient.lastName ?? ''

    const fullName = `${firstName} ${lastName}`.trim()

    return fullName || patient.name || 'Unknown Patient'
  }

  const getPatientPhone = (patient) => {
    return patient.phoneNumber ?? patient.phone ?? ''
  }

  const getInitial = (patient) => {
    return getPatientName(patient)
      .charAt(0)
      .toUpperCase()
  }

  const filteredPatients = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) {
      return patients
    }

    return patients.filter((patient) => {
      const name = getPatientName(patient).toLowerCase()

      const phone = String(
        getPatientPhone(patient)
      ).toLowerCase()

      const email = String(
        patient.email ?? ''
      ).toLowerCase()

      const bloodGroup = String(
        patient.bloodGroup ?? ''
      ).toLowerCase()

      return (
        name.includes(value) ||
        phone.includes(value) ||
        email.includes(value) ||
        bloodGroup.includes(value)
      )
    })
  }, [patients, search])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedPatient(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (patient) => {
    const fullName =
      patient.fullName ||
      `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()

    const nameParts = fullName.split(' ')

    const firstName = nameParts.shift() || ''
    const lastName = nameParts.join(' ')

    setModalMode('edit')
    setSelectedPatient(patient)

    setForm({
      firstName,
      lastName,
      gender: patient.gender ?? '',
      age: patient.age ?? '',
      phone: getPatientPhone(patient),
      email: patient.email ?? '',
      address: patient.address ?? '',
      bloodGroup: patient.bloodGroup ?? '',
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openViewModal = (patient) => {
    const fullName =
      patient.fullName ||
      `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()

    const nameParts = fullName.split(' ')

    const firstName = nameParts.shift() || ''
    const lastName = nameParts.join(' ')

    setModalMode('view')
    setSelectedPatient(patient)

    setForm({
      firstName,
      lastName,
      gender: patient.gender ?? '',
      age: patient.age ?? '',
      phone: getPatientPhone(patient),
      email: patient.email ?? '',
      address: patient.address ?? '',
      bloodGroup: patient.bloodGroup ?? '',
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    setShowModal(false)
    setSelectedPatient(null)
    setForm(emptyForm)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!form.firstName.trim()) {
      return 'First name is required.'
    }

    if (!form.lastName.trim()) {
      return 'Last name is required.'
    }

    if (!form.gender) {
      return 'Please select gender.'
    }

    if (!form.age) {
      return 'Age is required.'
    }

    if (Number(form.age) < 0 || Number(form.age) > 120) {
      return 'Please enter a valid age.'
    }

    if (!form.phone.trim()) {
      return 'Phone number is required.'
    }

    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      return 'Please enter a valid 10-digit phone number.'
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Please enter a valid email address.'
    }

    if (!form.bloodGroup) {
      return 'Please select blood group.'
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

      /*
       * IMPORTANT:
       * Backend Patient entity expects:
       * fullName
       * age
       * gender
       * phoneNumber
       * email
       * address
       * bloodGroup
       */
      const payload = {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        age: Number(form.age),
        gender: form.gender,
        phoneNumber: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        bloodGroup: form.bloodGroup,
      }

      if (modalMode === 'edit') {
        const updatedPatient = await put(
          `/api/patients/${selectedPatient.id}`,
          payload
        )

        setPatients((current) =>
          current.map((patient) =>
            patient.id === selectedPatient.id
              ? updatedPatient
              : patient
          )
        )

        setSuccess('Patient updated successfully.')
      } else {
        const createdPatient = await post(
          '/api/patients',
          payload
        )

        setPatients((current) => [
          ...current,
          createdPatient,
        ])

        setSuccess('Patient added successfully.')
      }

      setTimeout(() => {
        setShowModal(false)
        setSelectedPatient(null)
        setForm(emptyForm)
        setSuccess('')
      }, 700)
    } catch (err) {
      console.error('Save patient error:', err)

      setError(
        err.message ||
        'Unable to save patient. Please check the backend.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this patient?'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await remove(`/api/patients/${id}`)

      setPatients((current) =>
        current.filter((patient) => patient.id !== id)
      )

      setSuccess('Patient deleted successfully.')

      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Delete patient error:', err)

      setError(
        err.message ||
        'Unable to delete patient.'
      )
    }
  }

  return (
    <div className="patients-page">

      {/* HEADER */}

      <div className="page-heading">
        <div>
          <h1>Patients</h1>
          <p>
            Manage patient information and medical details.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Patient
        </button>
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="patients-success">
          ✓ {success}
        </div>
      )}

      {/* SUMMARY */}

      <div className="patient-summary">

        <div className="summary-card">
          <div className="summary-icon blue">
            ♙
          </div>

          <div>
            <span>Total Patients</span>
            <strong>{patients.length}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>Active Patients</span>
            <strong>{patients.length}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon purple">
            +
          </div>

          <div>
            <span>New This Month</span>
            <strong>0</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">
            !
          </div>

          <div>
            <span>Requires Attention</span>
            <strong>0</strong>
          </div>
        </div>

      </div>

      {/* TABLE */}

      <div className="patients-card">

        <div className="patients-toolbar">

          <div>
            <h2>Patient Directory</h2>

            <p>
              {filteredPatients.length} patients found
            </p>
          </div>

          <div className="patient-actions">

            <div className="patient-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search patients..."
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
          <div className="patients-error">
            {error}
          </div>
        )}

        <div className="patients-table-wrapper">

          <table className="patients-table">

            <thead>
              <tr>
                <th>Patient</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Blood Group</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="table-message"
                  >
                    Loading patients...
                  </td>
                </tr>

              ) : filteredPatients.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="table-message"
                  >
                    No patients found.
                  </td>
                </tr>

              ) : (

                filteredPatients.map((patient) => (

                  <tr key={patient.id}>

                    <td>
                      <div className="patient-info">

                        <div className="patient-avatar">
                          {getInitial(patient)}
                        </div>

                        <div>
                          <strong>
                            {getPatientName(patient)}
                          </strong>

                          <span>
                            ID: #{patient.id}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      {patient.gender || '—'}
                    </td>

                    <td>
                      {patient.age ?? '—'}
                    </td>

                    <td>
                      {getPatientPhone(patient) || '—'}
                    </td>

                    <td>
                      {patient.email || '—'}
                    </td>

                    <td>
                      {patient.bloodGroup ? (
                        <span className="blood-group">
                          {patient.bloodGroup}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td>
                      <div className="row-actions">

                        <button
                          className="action-btn view"
                          title="View"
                          onClick={() =>
                            openViewModal(patient)
                          }
                        >
                          👁
                        </button>

                        <button
                          className="action-btn edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(patient)
                          }
                        >
                          ✎
                        </button>

                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(patient.id)
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

        <div className="patients-footer">

          <span>
            Showing {filteredPatients.length} of{' '}
            {patients.length} patients
          </span>

          <div className="pagination">

            <button disabled>
              ←
            </button>

            <button className="active-page">
              1
            </button>

            <button disabled>
              →
            </button>

          </div>

        </div>

      </div>

      {/* PATIENT MODAL */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >

          <div className="patient-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {modalMode === 'add'
                    ? 'Add Patient'
                    : modalMode === 'edit'
                    ? 'Edit Patient'
                    : 'Patient Details'}
                </h2>

                <p>
                  {modalMode === 'view'
                    ? 'View patient information.'
                    : 'Enter patient information below.'}
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

              <div className="patient-details">

                <div className="detail-profile">

                  <div className="detail-avatar">
                    {getInitial(selectedPatient)}
                  </div>

                  <div>
                    <h3>
                      {getPatientName(selectedPatient)}
                    </h3>

                    <span>
                      Patient ID: #{selectedPatient?.id}
                    </span>
                  </div>

                </div>

                <div className="detail-grid">

                  <div className="detail-item">
                    <span>Gender</span>
                    <strong>
                      {selectedPatient?.gender || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Age</span>
                    <strong>
                      {selectedPatient?.age ?? '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Phone</span>
                    <strong>
                      {getPatientPhone(selectedPatient) || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Email</span>
                    <strong>
                      {selectedPatient?.email || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Address</span>
                    <strong>
                      {selectedPatient?.address || '—'}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Blood Group</span>
                    <strong>
                      {selectedPatient?.bloodGroup || '—'}
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
                      openEditModal(selectedPatient)
                    }
                  >
                    ✎ Edit Patient
                  </button>

                </div>

              </div>

            ) : (

              <form
                className="patient-form"
                onSubmit={handleSave}
              >

                <div className="form-section-title">
                  Personal Information
                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      First Name *
                    </label>

                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Last Name *
                    </label>

                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />

                  </div>

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Gender *
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Age *
                    </label>

                    <input
                      type="number"
                      name="age"
                      min="0"
                      max="120"
                      value={form.age}
                      onChange={handleChange}
                      placeholder="Enter age"
                    />

                  </div>

                </div>

                <div className="form-section-title">
                  Contact Information
                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Phone *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
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

                <div className="form-row single">

                  <div className="form-group">

                    <label>
                      Address
                    </label>

                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter address"
                    />

                  </div>

                </div>

                <div className="form-section-title">
                  Medical Information
                </div>

                <div className="form-row single">

                  <div className="form-group">

                    <label>
                      Blood Group *
                    </label>

                    <select
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleChange}
                    >

                      <option value="">
                        Select blood group
                      </option>

                      <option value="A+">
                        A+
                      </option>

                      <option value="A-">
                        A-
                      </option>

                      <option value="B+">
                        B+
                      </option>

                      <option value="B-">
                        B-
                      </option>

                      <option value="AB+">
                        AB+
                      </option>

                      <option value="AB-">
                        AB-
                      </option>

                      <option value="O+">
                        O+
                      </option>

                      <option value="O-">
                        O-
                      </option>

                    </select>

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
                      : 'Save Patient'}
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

export default Patients