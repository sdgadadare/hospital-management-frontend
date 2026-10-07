import { useEffect, useMemo, useState } from 'react'

import './MedicalRecords.css'

import { get, post, put, remove } from '../api'


function MedicalRecords() {

  const emptyForm = {
    patientId: '',
    doctorId: '',
    appointmentId: '',
    recordDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  }

  const [records, setRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState(emptyForm)


  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async () => {

    try {

      setLoading(true)
      setError('')

      const [
        recordsData,
        patientsData,
        doctorsData,
        appointmentsData
      ] = await Promise.all([
        get('/api/medical-records'),
        get('/api/patients'),
        get('/api/doctors'),
        get('/api/appointments')
      ])

      setRecords(Array.isArray(recordsData) ? recordsData : [])
      setPatients(Array.isArray(patientsData) ? patientsData : [])
      setDoctors(Array.isArray(doctorsData) ? doctorsData : [])
      setAppointments(
        Array.isArray(appointmentsData)
          ? appointmentsData
          : []
      )

    } catch (err) {

      console.error('Medical records API error:', err)

      setError(
        err.message ||
        'Unable to load medical record data.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {
    fetchData()
  }, [])


  // =========================================================
  // HELPER FUNCTIONS
  // =========================================================

  const getPatientName = (patient) => {

    if (!patient) {
      return 'Unknown Patient'
    }

    const firstName = patient.firstName ?? ''
    const lastName = patient.lastName ?? ''

    const fullName =
      `${firstName} ${lastName}`.trim()

    return (
      fullName ||
      patient.name ||
      `Patient #${patient.id ?? '—'}`
    )

  }


  const getDoctorName = (doctor) => {

    if (!doctor) {
      return 'Unknown Doctor'
    }

    return (
      doctor.fullName ||
      doctor.name ||
      `Doctor #${doctor.id ?? '—'}`
    )

  }


  const getAppointmentLabel = (appointment) => {

    if (!appointment) {
      return '—'
    }

    const patientName =
      getPatientName(appointment.patient)

    const doctorName =
      getDoctorName(appointment.doctor)

    const date =
      appointment.appointmentDate || ''

    const time =
      appointment.appointmentTime || ''

    return (
      `${patientName} • ${doctorName} • ${date} ${time}`
        .trim()
    )

  }


  const getRecordPatient = (record) => {

    if (record.patient) {
      return getPatientName(record.patient)
    }

    if (record.patientName) {
      return record.patientName
    }

    if (record.patientId) {
      return `Patient #${record.patientId}`
    }

    return 'Unknown Patient'

  }


  const getRecordDoctor = (record) => {

    if (record.doctor) {
      return getDoctorName(record.doctor)
    }

    if (record.doctorName) {
      return record.doctorName
    }

    if (record.doctorId) {
      return `Doctor #${record.doctorId}`
    }

    return 'Unknown Doctor'

  }


  const getRecordAppointmentId = (record) => {

    if (record.appointment?.id) {
      return record.appointment.id
    }

    if (record.appointmentId) {
      return record.appointmentId
    }

    return ''
  }


  const getPatientId = (record) => {

    if (record.patient?.id) {
      return record.patient.id
    }

    if (record.patientId) {
      return record.patientId
    }

    return ''
  }


  const getDoctorId = (record) => {

    if (record.doctor?.id) {
      return record.doctor.id
    }

    if (record.doctorId) {
      return record.doctorId
    }

    return ''
  }


  const formatDate = (date) => {

    if (!date) {
      return '—'
    }

    try {

      return new Date(date).toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      )

    } catch {

      return date

    }

  }


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredRecords = useMemo(() => {

    const value =
      search.toLowerCase().trim()

    if (!value) {
      return records
    }

    return records.filter((record) => {

      const patient =
        getRecordPatient(record)
          .toLowerCase()

      const doctor =
        getRecordDoctor(record)
          .toLowerCase()

      const diagnosis =
        String(
          record.diagnosis ?? ''
        ).toLowerCase()

      const treatment =
        String(
          record.treatment ?? ''
        ).toLowerCase()

      const prescription =
        String(
          record.prescription ?? ''
        ).toLowerCase()

      const notes =
        String(
          record.notes ?? ''
        ).toLowerCase()

      const date =
        String(
          record.recordDate ?? ''
        ).toLowerCase()

      return (
        patient.includes(value) ||
        doctor.includes(value) ||
        diagnosis.includes(value) ||
        treatment.includes(value) ||
        prescription.includes(value) ||
        notes.includes(value) ||
        date.includes(value)
      )

    })

  }, [records, search])


  // =========================================================
  // FORM
  // =========================================================

  const handleInputChange = (event) => {

    const {
      name,
      value
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value
    }))

  }


  const resetForm = () => {

    setFormData({
      ...emptyForm,
      recordDate:
        new Date()
          .toISOString()
          .split('T')[0]
    })

    setEditingId(null)
    setViewMode(false)

  }


  const openAddModal = () => {

    resetForm()

    setModalOpen(true)

  }


  const openEditModal = (record) => {

    setEditingId(record.id)

    setViewMode(false)

    setFormData({

      patientId:
        getPatientId(record),

      doctorId:
        getDoctorId(record),

      appointmentId:
        getRecordAppointmentId(record),

      recordDate:
        record.recordDate ||
        new Date()
          .toISOString()
          .split('T')[0],

      diagnosis:
        record.diagnosis ?? '',

      treatment:
        record.treatment ?? '',

      prescription:
        record.prescription ?? '',

      notes:
        record.notes ?? ''

    })

    setModalOpen(true)

  }


  const openViewModal = (record) => {

    setEditingId(record.id)

    setViewMode(true)

    setFormData({

      patientId:
        getPatientId(record),

      doctorId:
        getDoctorId(record),

      appointmentId:
        getRecordAppointmentId(record),

      recordDate:
        record.recordDate || '',

      diagnosis:
        record.diagnosis ?? '',

      treatment:
        record.treatment ?? '',

      prescription:
        record.prescription ?? '',

      notes:
        record.notes ?? ''

    })

    setModalOpen(true)

  }


  const closeModal = () => {

    setModalOpen(false)

    resetForm()

  }


  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {

    if (!formData.patientId) {

      alert('Please select a patient.')

      return false

    }

    if (!formData.doctorId) {

      alert('Please select a doctor.')

      return false

    }

    if (!formData.recordDate) {

      alert('Please select record date.')

      return false

    }

    if (!formData.diagnosis.trim()) {

      alert('Please enter diagnosis.')

      return false

    }

    return true

  }


  // =========================================================
  // SAVE / UPDATE
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault()

    if (!validateForm()) {
      return
    }

    try {

      setSaving(true)

      const payload = {

        patient: {
          id: Number(formData.patientId)
        },

        doctor: {
          id: Number(formData.doctorId)
        },

        appointment:
          formData.appointmentId
            ? {
                id: Number(
                  formData.appointmentId
                )
              }
            : null,

        recordDate:
          formData.recordDate,

        diagnosis:
          formData.diagnosis.trim(),

        treatment:
          formData.treatment.trim(),

        prescription:
          formData.prescription.trim(),

        notes:
          formData.notes.trim()

      }


      if (editingId) {

        await put(
          `/api/medical-records/${editingId}`,
          payload
        )

      } else {

        await post(
          '/api/medical-records',
          payload
        )

      }


      closeModal()

      await fetchData()

    } catch (err) {

      console.error(
        'Save medical record error:',
        err
      )

      alert(
        err.message ||
        'Unable to save medical record.'
      )

    } finally {

      setSaving(false)

    }

  }


  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        'Are you sure you want to delete this medical record?'
      )

    if (!confirmed) {
      return
    }

    try {

      await remove(
        `/api/medical-records/${id}`
      )

      setRecords((current) =>
        current.filter(
          (record) =>
            record.id !== id
        )
      )

    } catch (err) {

      console.error(
        'Delete medical record error:',
        err
      )

      alert(
        err.message ||
        'Unable to delete medical record.'
      )

    }

  }


  // =========================================================
  // STATS
  // =========================================================

  const totalRecords =
    records.length

  const recordsToday =
    records.filter(
      (record) =>
        record.recordDate ===
        new Date()
          .toISOString()
          .split('T')[0]
    ).length

  const recordsWithPrescription =
    records.filter(
      (record) =>
        String(
          record.prescription ?? ''
        ).trim()
    ).length

  const uniquePatients =
    new Set(
      records
        .map((record) =>
          getPatientId(record)
        )
        .filter(Boolean)
    ).size


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="medical-records-page">

      {/* HEADER */}

      <div className="page-heading">

        <div>

          <span className="page-eyebrow">
            CLINICAL MANAGEMENT
          </span>

          <h1>
            Medical Records
          </h1>

          <p>
            Manage patient diagnoses, treatments,
            prescriptions and clinical notes.
          </p>

        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Medical Record
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="error-banner">
          {error}
        </div>

      )}


      {/* SUMMARY */}

      <div className="record-summary">

        <div className="summary-card">

          <div className="summary-icon blue">
            ▣
          </div>

          <div>
            <span>Total Records</span>
            <strong>{totalRecords}</strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>Today's Records</span>
            <strong>{recordsToday}</strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon purple">
            ♙
          </div>

          <div>
            <span>Patients Covered</span>
            <strong>{uniquePatients}</strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon orange">
            +
          </div>

          <div>
            <span>With Prescription</span>
            <strong>
              {recordsWithPrescription}
            </strong>
          </div>

        </div>

      </div>


      {/* MAIN CARD */}

      <div className="records-card">

        <div className="records-toolbar">

          <div>

            <h2>
              Clinical Records
            </h2>

            <p>
              {filteredRecords.length}
              {' '}
              {filteredRecords.length === 1
                ? 'record'
                : 'records'}
              {' '}
              found
            </p>

          </div>


          <div className="record-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search patient, doctor, diagnosis..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (

              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
              >
                ×
              </button>

            )}

          </div>

        </div>


        {/* TABLE */}

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>Patient</th>

                <th>Doctor</th>

                <th>Record Date</th>

                <th>Diagnosis</th>

                <th>Treatment</th>

                <th>Prescription</th>

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
                    Loading medical records...
                  </td>

                </tr>

              ) : filteredRecords.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="table-message"
                  >

                    <div className="empty-state">

                      <div className="empty-icon">
                        ▣
                      </div>

                      <strong>
                        No medical records found
                      </strong>

                      <span>
                        Add a medical record or
                        change your search.
                      </span>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredRecords.map(
                  (record) => (

                    <tr key={record.id}>

                      {/* PATIENT */}

                      <td>

                        <div className="patient-info">

                          <div className="patient-avatar">

                            {getRecordPatient(record)
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <strong>
                              {getRecordPatient(record)}
                            </strong>

                            <span>
                              ID: #{record.id}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* DOCTOR */}

                      <td>

                        <div className="doctor-cell">

                          <span className="doctor-icon">
                            ⚕
                          </span>

                          <span>
                            {getRecordDoctor(record)}
                          </span>

                        </div>

                      </td>


                      {/* DATE */}

                      <td>

                        <span className="date-badge">
                          {formatDate(
                            record.recordDate
                          )}
                        </span>

                      </td>


                      {/* DIAGNOSIS */}

                      <td>

                        <div className="text-cell diagnosis-cell">

                          {record.diagnosis
                            ? record.diagnosis
                            : '—'}

                        </div>

                      </td>


                      {/* TREATMENT */}

                      <td>

                        <div className="text-cell">

                          {record.treatment
                            ? record.treatment
                            : '—'}

                        </div>

                      </td>


                      {/* PRESCRIPTION */}

                      <td>

                        {record.prescription ? (

                          <span className="prescription-badge">
                            Available
                          </span>

                        ) : (

                          <span className="muted-text">
                            None
                          </span>

                        )}

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="row-actions">

                          <button
                            className="action-btn view"
                            title="View"
                            onClick={() =>
                              openViewModal(record)
                            }
                          >
                            👁
                          </button>

                          <button
                            className="action-btn edit"
                            title="Edit"
                            onClick={() =>
                              openEditModal(record)
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="action-btn delete"
                            title="Delete"
                            onClick={() =>
                              handleDelete(record.id)
                            }
                          >
                            ×
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          MODAL
          ===================================================== */}

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

          <div className="record-modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <span className="modal-eyebrow">
                  {viewMode
                    ? 'RECORD DETAILS'
                    : editingId
                      ? 'UPDATE RECORD'
                      : 'NEW CLINICAL RECORD'}
                </span>

                <h2>

                  {viewMode
                    ? 'Medical Record'
                    : editingId
                      ? 'Edit Medical Record'
                      : 'Add Medical Record'}

                </h2>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="record-form"
            >

              {/* PATIENT / DOCTOR */}

              <div className="form-grid two-columns">

                <div className="form-group">

                  <label>
                    Patient
                    <span>*</span>
                  </label>

                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    required
                  >

                    <option value="">
                      Select Patient
                    </option>

                    {patients.map(
                      (patient) => (

                        <option
                          key={patient.id}
                          value={patient.id}
                        >
                          {getPatientName(patient)}
                          {' '}
                          — #{patient.id}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Doctor
                    <span>*</span>
                  </label>

                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    required
                  >

                    <option value="">
                      Select Doctor
                    </option>

                    {doctors.map(
                      (doctor) => (

                        <option
                          key={doctor.id}
                          value={doctor.id}
                        >
                          {getDoctorName(doctor)}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* APPOINTMENT / DATE */}

              <div className="form-grid two-columns">

                <div className="form-group">

                  <label>
                    Appointment
                  </label>

                  <select
                    name="appointmentId"
                    value={formData.appointmentId}
                    onChange={handleInputChange}
                    disabled={viewMode}
                  >

                    <option value="">
                      No Appointment
                    </option>

                    {appointments.map(
                      (appointment) => (

                        <option
                          key={appointment.id}
                          value={appointment.id}
                        >
                          {getAppointmentLabel(
                            appointment
                          )}
                        </option>

                      )
                    )}

                  </select>

                  <small>
                    Optional
                  </small>

                </div>


                <div className="form-group">

                  <label>
                    Record Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="recordDate"
                    value={formData.recordDate}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    required
                  />

                </div>

              </div>


              {/* DIAGNOSIS */}

              <div className="form-group">

                <label>
                  Diagnosis
                  <span>*</span>
                </label>

                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  disabled={viewMode}
                  placeholder="Enter diagnosis..."
                  rows="3"
                  maxLength="2000"
                  required
                />

                {!viewMode && (

                  <small>
                    {formData.diagnosis.length}
                    /2000 characters
                  </small>

                )}

              </div>


              {/* TREATMENT */}

              <div className="form-group">

                <label>
                  Treatment
                </label>

                <textarea
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleInputChange}
                  disabled={viewMode}
                  placeholder="Enter treatment details..."
                  rows="3"
                  maxLength="3000"
                />

              </div>


              {/* PRESCRIPTION */}

              <div className="form-group">

                <label>
                  Prescription
                </label>

                <textarea
                  name="prescription"
                  value={formData.prescription}
                  onChange={handleInputChange}
                  disabled={viewMode}
                  placeholder="Enter prescription details..."
                  rows="3"
                  maxLength="3000"
                />

              </div>


              {/* NOTES */}

              <div className="form-group">

                <label>
                  Clinical Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={viewMode}
                  placeholder="Add additional clinical notes..."
                  rows="3"
                  maxLength="3000"
                />

              </div>


              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  {viewMode
                    ? 'Close'
                    : 'Cancel'}
                </button>


                {!viewMode && (

                  <button
                    type="submit"
                    className="primary-btn modal-submit"
                    disabled={saving}
                  >

                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Update Record'
                        : 'Save Record'}

                  </button>

                )}

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  )

}


export default MedicalRecords