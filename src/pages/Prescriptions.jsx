import { useEffect, useMemo, useState } from 'react'

import './Prescriptions.css'

import {
  get,
  post,
  put,
  remove
} from '../api'


function Prescriptions() {

  // =========================================================
  // EMPTY FORM
  // =========================================================

  const emptyForm = {
    patientId: '',
    doctorId: '',
    appointmentId: '',
    prescribedDate:
      new Date().toISOString().split('T')[0],
    diagnosis: '',
    status: 'ACTIVE',
    instructions: '',
    items: []
  }


  const emptyItem = {
    medicineId: '',
    dosage: '',
    frequency: '',
    durationDays: '',
    quantity: '',
    instructions: ''
  }


  // =========================================================
  // STATE
  // =========================================================

  const [prescriptions, setPrescriptions] =
    useState([])

  const [patients, setPatients] =
    useState([])

  const [doctors, setDoctors] =
    useState([])

  const [appointments, setAppointments] =
    useState([])

  const [medicines, setMedicines] =
    useState([])

  const [prescriptionItems, setPrescriptionItems] =
    useState([])


  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('ALL')


  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')


  const [modalOpen, setModalOpen] =
    useState(false)

  const [viewMode, setViewMode] =
    useState(false)

  const [editingId, setEditingId] =
    useState(null)


  const [formData, setFormData] =
    useState(emptyForm)


  const [currentItems, setCurrentItems] =
    useState([])


  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async () => {

    try {

      setLoading(true)
      setError('')


      const [
        prescriptionData,
        patientData,
        doctorData,
        appointmentData,
        medicineData,
        itemData
      ] = await Promise.all([

        get('/api/prescriptions'),

        get('/api/patients'),

        get('/api/doctors'),

        get('/api/appointments'),

        get('/api/medicines'),

        get('/api/prescription-items')

      ])


      setPrescriptions(
        Array.isArray(prescriptionData)
          ? prescriptionData
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


      setAppointments(
        Array.isArray(appointmentData)
          ? appointmentData
          : []
      )


      setMedicines(
        Array.isArray(medicineData)
          ? medicineData
          : []
      )


      setPrescriptionItems(
        Array.isArray(itemData)
          ? itemData
          : []
      )

    } catch (err) {

      console.error(
        'Prescription data error:',
        err
      )

      setError(
        err.message ||
        'Unable to load prescription data.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    fetchData()

  }, [])


  // =========================================================
  // RELATIONSHIP HELPERS
  // =========================================================

  const getPatientId = (prescription) => {

    return (
      prescription?.patient?.id ??
      prescription?.patientId ??
      ''
    )

  }


  const getDoctorId = (prescription) => {

    return (
      prescription?.doctor?.id ??
      prescription?.doctorId ??
      ''
    )

  }


  const getAppointmentId = (prescription) => {

    return (
      prescription?.appointment?.id ??
      prescription?.appointmentId ??
      ''
    )

  }


  const getItemPrescriptionId = (item) => {

    return (
      item?.prescription?.id ??
      item?.prescriptionId ??
      ''
    )

  }


  const getItemMedicineId = (item) => {

    return (
      item?.medicine?.id ??
      item?.medicineId ??
      ''
    )

  }


  const getPatientName = (patientId) => {

    const patient =
      patients.find(
        (item) =>
          Number(item.id) ===
          Number(patientId)
      )

    if (!patient) {
      return 'Unknown Patient'
    }

    return (
      patient.fullName ||
      [
        patient.firstName,
        patient.lastName
      ]
        .filter(Boolean)
        .join(' ') ||
      patient.name ||
      `Patient #${patient.id}`
    )

  }


  const getDoctorName = (doctorId) => {

    const doctor =
      doctors.find(
        (item) =>
          Number(item.id) ===
          Number(doctorId)
      )

    if (!doctor) {
      return 'Unknown Doctor'
    }

    return (
      doctor.fullName ||
      doctor.name ||
      `Doctor #${doctor.id}`
    )

  }


  const getMedicineName = (medicineId) => {

    const medicine =
      medicines.find(
        (item) =>
          Number(item.id) ===
          Number(medicineId)
      )

    if (!medicine) {
      return 'Unknown Medicine'
    }

    return (
      medicine.name ||
      `Medicine #${medicine.id}`
    )

  }


  const getAppointmentLabel = (appointmentId) => {

    if (!appointmentId) {
      return 'No appointment'
    }

    const appointment =
      appointments.find(
        (item) =>
          Number(item.id) ===
          Number(appointmentId)
      )

    if (!appointment) {
      return `Appointment #${appointmentId}`
    }


    const patientId =
      appointment?.patient?.id ??
      appointment?.patientId

    const doctorId =
      appointment?.doctor?.id ??
      appointment?.doctorId

    const date =
      appointment.appointmentDate ||
      ''


    return `#${appointment.id} • ${
      date
    } • ${
      getPatientName(patientId)
    }`

  }


  const formatDate = (date) => {

    if (!date) {
      return '—'
    }

    try {

      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString(
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
  // ITEMS BELONGING TO PRESCRIPTION
  // =========================================================

  const getItemsForPrescription = (prescriptionId) => {

    return prescriptionItems.filter(
      (item) =>
        Number(
          getItemPrescriptionId(item)
        ) === Number(prescriptionId)
    )

  }


  // =========================================================
  // FILTER
  // =========================================================

  const filteredPrescriptions = useMemo(() => {

    const value =
      search
        .toLowerCase()
        .trim()


    return prescriptions.filter(
      (prescription) => {

        const patientName =
          getPatientName(
            getPatientId(prescription)
          ).toLowerCase()


        const doctorName =
          getDoctorName(
            getDoctorId(prescription)
          ).toLowerCase()


        const diagnosis =
          String(
            prescription.diagnosis ?? ''
          ).toLowerCase()


        const instructions =
          String(
            prescription.instructions ?? ''
          ).toLowerCase()


        const status =
          String(
            prescription.status ?? ''
          ).toLowerCase()


        const matchesSearch =
          !value ||
          patientName.includes(value) ||
          doctorName.includes(value) ||
          diagnosis.includes(value) ||
          instructions.includes(value) ||
          status.includes(value)


        const matchesStatus =
          statusFilter === 'ALL' ||
          String(
            prescription.status ?? ''
          ).toUpperCase() ===
          statusFilter


        return (
          matchesSearch &&
          matchesStatus
        )

      }
    )

  }, [
    prescriptions,
    patients,
    doctors,
    search,
    statusFilter
  ])


  // =========================================================
  // FORM HANDLERS
  // =========================================================

  const handleInputChange = (event) => {

    const {
      name,
      value
    } = event.target


    setFormData(
      (current) => ({
        ...current,
        [name]: value
      })
    )

  }


  const handleItemChange = (
    index,
    event
  ) => {

    const {
      name,
      value
    } = event.target


    setCurrentItems(
      (current) =>
        current.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [name]: value
                }
              : item
        )
    )

  }


  const addMedicineRow = () => {

    setCurrentItems(
      (current) => [
        ...current,
        {
          ...emptyItem
        }
      ]
    )

  }


  const removeMedicineRow = (index) => {

    setCurrentItems(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    )

  }


  // =========================================================
  // OPEN ADD
  // =========================================================

  const openAddModal = () => {

    setFormData({
      ...emptyForm
    })

    setCurrentItems([
      {
        ...emptyItem
      }
    ])

    setEditingId(null)
    setViewMode(false)

    setModalOpen(true)

  }


  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEditModal = (prescription) => {

    const prescriptionId =
      prescription.id


    setEditingId(
      prescriptionId
    )

    setViewMode(false)


    setFormData({

      patientId:
        getPatientId(
          prescription
        ),

      doctorId:
        getDoctorId(
          prescription
        ),

      appointmentId:
        getAppointmentId(
          prescription
        ),

      prescribedDate:
        prescription.prescribedDate ||
        new Date()
          .toISOString()
          .split('T')[0],

      diagnosis:
        prescription.diagnosis ||
        '',

      status:
        prescription.status ||
        'ACTIVE',

      instructions:
        prescription.instructions ||
        '',

      items: []

    })


    const existingItems =
      getItemsForPrescription(
        prescriptionId
      )


    setCurrentItems(

      existingItems.length > 0

        ? existingItems.map(
            (item) => ({

              medicineId:
                getItemMedicineId(item),

              dosage:
                item.dosage ||
                '',

              frequency:
                item.frequency ||
                '',

              durationDays:
                item.durationDays ??
                '',

              quantity:
                item.quantity ??
                '',

              instructions:
                item.instructions ||
                ''

            })
          )

        : [
            {
              ...emptyItem
            }
          ]

    )


    setModalOpen(true)

  }


  // =========================================================
  // OPEN VIEW
  // =========================================================

  const openViewModal = (prescription) => {

    setEditingId(
      prescription.id
    )

    setViewMode(true)


    setFormData({

      patientId:
        getPatientId(
          prescription
        ),

      doctorId:
        getDoctorId(
          prescription
        ),

      appointmentId:
        getAppointmentId(
          prescription
        ),

      prescribedDate:
        prescription.prescribedDate ||
        '',

      diagnosis:
        prescription.diagnosis ||
        '',

      status:
        prescription.status ||
        '',

      instructions:
        prescription.instructions ||
        '',

      items: []

    })


    const existingItems =
      getItemsForPrescription(
        prescription.id
      )


    setCurrentItems(

      existingItems.map(
        (item) => ({

          id:
            item.id,

          medicineId:
            getItemMedicineId(item),

          dosage:
            item.dosage ||
            '',

          frequency:
            item.frequency ||
            '',

          durationDays:
            item.durationDays ??
            '',

          quantity:
            item.quantity ??
            '',

          instructions:
            item.instructions ||
            ''

        })
      )

    )


    setModalOpen(true)

  }


  // =========================================================
  // CLOSE
  // =========================================================

  const closeModal = () => {

    setModalOpen(false)

    setEditingId(null)
    setViewMode(false)

    setFormData({
      ...emptyForm
    })

    setCurrentItems([])

  }


  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {

    if (!formData.patientId) {

      alert(
        'Please select a patient.'
      )

      return false

    }


    if (!formData.doctorId) {

      alert(
        'Please select a doctor.'
      )

      return false

    }


    if (!formData.prescribedDate) {

      alert(
        'Please select prescription date.'
      )

      return false

    }


    if (!formData.status.trim()) {

      alert(
        'Please enter prescription status.'
      )

      return false

    }


    for (
      let index = 0;
      index < currentItems.length;
      index++
    ) {

      const item =
        currentItems[index]


      const hasAnything =
        item.medicineId ||
        item.dosage ||
        item.frequency ||
        item.durationDays ||
        item.quantity ||
        item.instructions


      if (!hasAnything) {
        continue
      }


      if (!item.medicineId) {

        alert(
          `Please select medicine for item ${
            index + 1
          }.`
        )

        return false

      }


      if (!item.dosage.trim()) {

        alert(
          `Please enter dosage for item ${
            index + 1
          }.`
        )

        return false

      }


      if (!item.frequency.trim()) {

        alert(
          `Please enter frequency for item ${
            index + 1
          }.`
        )

        return false

      }


      if (
        !item.durationDays ||
        Number(item.durationDays) < 1
      ) {

        alert(
          `Please enter a valid duration for item ${
            index + 1
          }.`
        )

        return false

      }


      if (
        !item.quantity ||
        Number(item.quantity) < 1
      ) {

        alert(
          `Please enter a valid quantity for item ${
            index + 1
          }.`
        )

        return false

      }

    }


    return true

  }


  // =========================================================
  // SAVE PRESCRIPTION + ITEMS
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault()


    if (!validateForm()) {
      return
    }


    try {

      setSaving(true)


      // -----------------------------------------------------
      // PRESCRIPTION PAYLOAD
      // -----------------------------------------------------

      const prescriptionPayload = {

        patient: {
          id:
            Number(
              formData.patientId
            )
        },

        doctor: {
          id:
            Number(
              formData.doctorId
            )
        },

        appointment:
          formData.appointmentId
            ? {
                id:
                  Number(
                    formData.appointmentId
                  )
              }
            : null,

        prescribedDate:
          formData.prescribedDate,

        diagnosis:
          formData.diagnosis.trim() ||
          null,

        status:
          formData.status.trim(),

        instructions:
          formData.instructions.trim() ||
          null

      }


      let prescriptionId =
        editingId


      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      if (!editingId) {

        const created =
          await post(
            '/api/prescriptions',
            prescriptionPayload
          )


        prescriptionId =
          created?.id

      }

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      else {

        await put(
          `/api/prescriptions/${editingId}`,
          prescriptionPayload
        )

      }


      if (!prescriptionId) {

        throw new Error(
          'Prescription was saved but its ID was not returned.'
        )

      }


      // -----------------------------------------------------
      // UPDATE MODE:
      // DELETE EXISTING ITEMS
      // THEN CREATE CURRENT ITEMS AGAIN
      // -----------------------------------------------------

      if (editingId) {

        const existingItems =
          getItemsForPrescription(
            editingId
          )


        for (
          const item
          of existingItems
        ) {

          await remove(
            `/api/prescription-items/${item.id}`
          )

        }

      }


      // -----------------------------------------------------
      // CREATE ITEMS
      // -----------------------------------------------------

      const validItems =
        currentItems.filter(
          (item) =>
            item.medicineId
        )


      for (
        const item
        of validItems
      ) {

        const itemPayload = {

          prescription: {
            id:
              Number(
                prescriptionId
              )
          },

          medicine: {
            id:
              Number(
                item.medicineId
              )
          },

          dosage:
            item.dosage.trim(),

          frequency:
            item.frequency.trim(),

          durationDays:
            Number(
              item.durationDays
            ),

          quantity:
            Number(
              item.quantity
            ),

          instructions:
            item.instructions.trim() ||
            null

        }


        await post(
          '/api/prescription-items',
          itemPayload
        )

      }


      closeModal()

      await fetchData()

    } catch (err) {

      console.error(
        'Save prescription error:',
        err
      )

      alert(
        err.message ||
        'Unable to save prescription.'
      )

    } finally {

      setSaving(false)

    }

  }


  // =========================================================
  // DELETE PRESCRIPTION
  // =========================================================

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        'Delete this prescription? All its medicine items will also be deleted.'
      )


    if (!confirmed) {
      return
    }


    try {

      const items =
        getItemsForPrescription(
          id
        )


      // Delete child items first

      for (
        const item
        of items
      ) {

        await remove(
          `/api/prescription-items/${item.id}`
        )

      }


      // Delete prescription

      await remove(
        `/api/prescriptions/${id}`
      )


      setPrescriptions(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      )


      setPrescriptionItems(
        (current) =>
          current.filter(
            (item) =>
              Number(
                getItemPrescriptionId(item)
              ) !== Number(id)
          )
      )


    } catch (err) {

      console.error(
        'Delete prescription error:',
        err
      )

      alert(
        err.message ||
        'Unable to delete prescription.'
      )

    }

  }


  // =========================================================
  // STATISTICS
  // =========================================================

  const totalPrescriptions =
    prescriptions.length


  const activePrescriptions =
    prescriptions.filter(
      (item) =>
        String(
          item.status ?? ''
        ).toUpperCase() ===
        'ACTIVE'
    ).length


  const completedPrescriptions =
    prescriptions.filter(
      (item) =>
        String(
          item.status ?? ''
        ).toUpperCase() ===
        'COMPLETED'
    ).length


  const totalItems =
    prescriptionItems.length


  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {

    const value =
      String(
        status ?? ''
      ).toLowerCase()


    if (
      value.includes('complete')
    ) {
      return 'completed'
    }

    if (
      value.includes('cancel')
    ) {
      return 'cancelled'
    }

    if (
      value.includes('expire')
    ) {
      return 'expired'
    }

    return 'active'

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="prescriptions-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="prescriptions-heading">

        <div>

          <span className="prescriptions-eyebrow">
            CLINICAL MANAGEMENT
          </span>

          <h1>
            Prescriptions
          </h1>

          <p>
            Create and manage patient
            prescriptions and medicines.
          </p>

        </div>


        <button
          className="prescription-primary-btn"
          onClick={openAddModal}
        >

          <span>
            +
          </span>

          New Prescription

        </button>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <div className="prescription-error">
          {error}
        </div>

      )}


      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="prescription-summary">


        <div className="prescription-summary-card">

          <div className="prescription-summary-icon blue">
            Rx
          </div>

          <div>

            <span>
              Total Prescriptions
            </span>

            <strong>
              {totalPrescriptions}
            </strong>

          </div>

        </div>


        <div className="prescription-summary-card">

          <div className="prescription-summary-icon green">
            ✓
          </div>

          <div>

            <span>
              Active
            </span>

            <strong>
              {activePrescriptions}
            </strong>

          </div>

        </div>


        <div className="prescription-summary-card">

          <div className="prescription-summary-icon purple">
            ✓
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {completedPrescriptions}
            </strong>

          </div>

        </div>


        <div className="prescription-summary-card">

          <div className="prescription-summary-icon orange">
            +
          </div>

          <div>

            <span>
              Medicine Items
            </span>

            <strong>
              {totalItems}
            </strong>

          </div>

        </div>


      </div>


      {/* =====================================================
          MAIN CARD
          ===================================================== */}

      <div className="prescriptions-card">


        {/* TOOLBAR */}

        <div className="prescriptions-toolbar">

          <div>

            <h2>
              Prescription Records
            </h2>

            <p>
              {filteredPrescriptions.length}
              {' '}
              record
              {filteredPrescriptions.length !== 1
                ? 's'
                : ''}
              {' '}
              found
            </p>

          </div>


          <div className="prescription-toolbar-controls">


            <div className="prescription-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search patient, doctor..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (

                <button
                  type="button"
                  onClick={() =>
                    setSearch('')
                  }
                >
                  ×
                </button>

              )}

            </div>


            <select
              className="prescription-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
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


        {/* ===================================================
            TABLE
            =================================================== */}

        <div className="prescriptions-table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  Patient
                </th>

                <th>
                  Doctor
                </th>

                <th>
                  Diagnosis
                </th>

                <th>
                  Date
                </th>

                <th>
                  Medicines
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>


              {loading ? (

                <tr>

                  <td
                    colSpan="7"
                    className="prescription-table-message"
                  >
                    Loading prescriptions...
                  </td>

                </tr>

              ) : filteredPrescriptions.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="prescription-table-message"
                  >

                    <div className="prescription-empty">

                      <div className="prescription-empty-icon">
                        Rx
                      </div>

                      <strong>
                        No prescriptions found
                      </strong>

                      <span>
                        Create a new prescription
                        or change your filters.
                      </span>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredPrescriptions.map(
                  (prescription) => {

                    const patientId =
                      getPatientId(
                        prescription
                      )

                    const doctorId =
                      getDoctorId(
                        prescription
                      )

                    const items =
                      getItemsForPrescription(
                        prescription.id
                      )


                    return (

                      <tr
                        key={
                          prescription.id
                        }
                      >


                        {/* PATIENT */}

                        <td>

                          <div className="prescription-person">

                            <div className="person-avatar patient">
                              {getPatientName(
                                patientId
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {getPatientName(
                                  patientId
                                )}
                              </strong>

                              <span>
                                Patient #
                                {patientId || '—'}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* DOCTOR */}

                        <td>

                          <div className="prescription-doctor">

                            <strong>
                              {getDoctorName(
                                doctorId
                              )}
                            </strong>

                            <span>
                              Doctor #
                              {doctorId || '—'}
                            </span>

                          </div>

                        </td>


                        {/* DIAGNOSIS */}

                        <td>

                          <span className="diagnosis-text">

                            {prescription.diagnosis ||
                              'No diagnosis'}

                          </span>

                        </td>


                        {/* DATE */}

                        <td>

                          <span className="prescription-date">
                            {formatDate(
                              prescription.prescribedDate
                            )}
                          </span>

                        </td>


                        {/* MEDICINES */}

                        <td>

                          <div className="medicine-count">

                            <span>
                              {items.length}
                            </span>

                            {items.length === 1
                              ? 'Medicine'
                              : 'Medicines'}

                          </div>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              `prescription-status ${
                                getStatusClass(
                                  prescription.status
                                )
                              }`
                            }
                          >

                            <span className="status-dot">
                            </span>

                            {prescription.status ||
                              'Unknown'}

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="prescription-actions">


                            <button
                              className="prescription-action view"
                              title="View"
                              onClick={() =>
                                openViewModal(
                                  prescription
                                )
                              }
                            >
                              👁
                            </button>


                            <button
                              className="prescription-action edit"
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  prescription
                                )
                              }
                            >
                              ✎
                            </button>


                            <button
                              className="prescription-action delete"
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  prescription.id
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


      {/* =====================================================
          MODAL
          ===================================================== */}

      {modalOpen && (

        <div
          className="prescription-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeModal()

            }

          }}
        >

          <div className="prescription-modal">


            {/* HEADER */}

            <div className="prescription-modal-header">

              <div>

                <span className="prescription-modal-eyebrow">

                  {viewMode
                    ? 'PRESCRIPTION DETAILS'
                    : editingId
                      ? 'UPDATE PRESCRIPTION'
                      : 'NEW PRESCRIPTION'}

                </span>

                <h2>

                  {viewMode
                    ? 'Prescription Details'
                    : editingId
                      ? 'Edit Prescription'
                      : 'Create Prescription'}

                </h2>

              </div>


              <button
                type="button"
                className="prescription-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              className="prescription-form"
              onSubmit={handleSubmit}
            >


              {/* PATIENT / DOCTOR */}

              <div className="prescription-form-grid">


                <div className="prescription-form-group">

                  <label>
                    Patient
                    <span>*</span>
                  </label>

                  <select
                    name="patientId"
                    value={
                      formData.patientId
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    required
                  >

                    <option value="">
                      Select patient
                    </option>

                    {patients.map(
                      (patient) => (

                        <option
                          key={patient.id}
                          value={patient.id}
                        >
                          {getPatientName(
                            patient.id
                          )}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="prescription-form-group">

                  <label>
                    Doctor
                    <span>*</span>
                  </label>

                  <select
                    name="doctorId"
                    value={
                      formData.doctorId
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    required
                  >

                    <option value="">
                      Select doctor
                    </option>

                    {doctors.map(
                      (doctor) => (

                        <option
                          key={doctor.id}
                          value={doctor.id}
                        >
                          {getDoctorName(
                            doctor.id
                          )}
                        </option>

                      )
                    )}

                  </select>

                </div>


              </div>


              {/* APPOINTMENT / DATE */}

              <div className="prescription-form-grid">


                <div className="prescription-form-group">

                  <label>
                    Appointment
                  </label>

                  <select
                    name="appointmentId"
                    value={
                      formData.appointmentId
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                  >

                    <option value="">
                      No appointment
                    </option>

                    {appointments.map(
                      (appointment) => {

                        const patientId =
                          appointment?.patient?.id ??
                          appointment?.patientId

                        return (

                          <option
                            key={
                              appointment.id
                            }
                            value={
                              appointment.id
                            }
                          >
                            {getAppointmentLabel(
                              appointment.id
                            )}
                          </option>

                        )

                      }
                    )}

                  </select>

                </div>


                <div className="prescription-form-group">

                  <label>
                    Prescription Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="prescribedDate"
                    value={
                      formData.prescribedDate
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    required
                  />

                </div>


              </div>


              {/* STATUS / DIAGNOSIS */}

              <div className="prescription-form-grid">


                <div className="prescription-form-group">

                  <label>
                    Status
                    <span>*</span>
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    required
                  >

                    <option value="ACTIVE">
                      ACTIVE
                    </option>

                    <option value="COMPLETED">
                      COMPLETED
                    </option>

                    <option value="CANCELLED">
                      CANCELLED
                    </option>

                  </select>

                </div>


                <div className="prescription-form-group">

                  <label>
                    Diagnosis
                  </label>

                  <input
                    type="text"
                    name="diagnosis"
                    value={
                      formData.diagnosis
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    placeholder="Enter diagnosis"
                    maxLength="255"
                  />

                </div>


              </div>


              {/* INSTRUCTIONS */}

              <div className="prescription-form-group">

                <label>
                  Prescription Instructions
                </label>

                <textarea
                  name="instructions"
                  value={
                    formData.instructions
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={viewMode}
                  rows="3"
                  maxLength="2000"
                  placeholder="Enter general instructions for the patient..."
                />

              </div>


              {/* MEDICINES */}

              <div className="medicine-section">


                <div className="medicine-section-header">

                  <div>

                    <h3>
                      Prescribed Medicines
                    </h3>

                    <p>
                      Add medicines with dosage,
                      frequency and duration.
                    </p>

                  </div>


                  {!viewMode && (

                    <button
                      type="button"
                      className="add-medicine-btn"
                      onClick={
                        addMedicineRow
                      }
                    >
                      + Add Medicine
                    </button>

                  )}

                </div>


                {currentItems.length === 0 ? (

                  <div className="no-medicine-items">

                    <span>
                      No medicines added.
                    </span>

                    {!viewMode && (

                      <button
                        type="button"
                        onClick={
                          addMedicineRow
                        }
                      >
                        Add Medicine
                      </button>

                    )}

                  </div>

                ) : (

                  <div className="medicine-items-list">


                    {currentItems.map(
                      (item, index) => (

                        <div
                          className="medicine-item-card"
                          key={index}
                        >


                          <div className="medicine-item-number">
                            {index + 1}
                          </div>


                          <div className="medicine-item-fields">


                            {/* MEDICINE */}

                            <div className="prescription-form-group">

                              <label>
                                Medicine
                                <span>*</span>
                              </label>

                              <select
                                name="medicineId"
                                value={
                                  item.medicineId
                                }
                                onChange={
                                  (event) =>
                                    handleItemChange(
                                      index,
                                      event
                                    )
                                }
                                disabled={
                                  viewMode
                                }
                              >

                                <option value="">
                                  Select medicine
                                </option>

                                {medicines.map(
                                  (medicine) => (

                                    <option
                                      key={
                                        medicine.id
                                      }
                                      value={
                                        medicine.id
                                      }
                                    >

                                      {medicine.name}

                                      {' '}
                                      —

                                      {' '}
                                      Stock:
                                      {' '}
                                      {medicine.stockQuantity ??
                                        0}

                                    </option>

                                  )
                                )}

                              </select>

                            </div>


                            {/* DOSAGE */}

                            <div className="prescription-form-group">

                              <label>
                                Dosage
                                <span>*</span>
                              </label>

                              <input
                                type="text"
                                name="dosage"
                                value={
                                  item.dosage
                                }
                                onChange={
                                  (event) =>
                                    handleItemChange(
                                      index,
                                      event
                                    )
                                }
                                disabled={
                                  viewMode
                                }
                                placeholder="e.g. 500 mg"
                                maxLength="255"
                              />

                            </div>


                            {/* FREQUENCY */}

                            <div className="prescription-form-group">

                              <label>
                                Frequency
                                <span>*</span>
                              </label>

                              <input
                                type="text"
                                name="frequency"
                                value={
                                  item.frequency
                                }
                                onChange={
                                  (event) =>
                                    handleItemChange(
                                      index,
                                      event
                                    )
                                }
                                disabled={
                                  viewMode
                                }
                                placeholder="e.g. Twice daily"
                                maxLength="255"
                              />

                            </div>


                            {/* DURATION */}

                            <div className="prescription-form-group">

                              <label>
                                Duration
                                <span>*</span>
                              </label>

                              <input
                                type="number"
                                name="durationDays"
                                value={
                                  item.durationDays
                                }
                                onChange={
                                  (event) =>
                                    handleItemChange(
                                      index,
                                      event
                                    )
                                }
                                disabled={
                                  viewMode
                                }
                                min="1"
                                step="1"
                                placeholder="Days"
                              />

                            </div>


                            {/* QUANTITY */}

                            <div className="prescription-form-group">

                              <label>
                                Quantity
                                <span>*</span>
                              </label>

                              <input
                                type="number"
                                name="quantity"
                                value={
                                  item.quantity
                                }
                                onChange={
                                  (event) =>
                                    handleItemChange(
                                      index,
                                      event
                                    )
                                }
                                disabled={
                                  viewMode
                                }
                                min="1"
                                step="1"
                                placeholder="Qty"
                              />

                            </div>


                            {/* INSTRUCTIONS */}

                            <div className="prescription-form-group medicine-instruction-field">

                              <label>
                                Instructions
                              </label>

                              <input
                                type="text"
                                name="instructions"
                                value={
                                  item.instructions
                                }
                                onChange={
                                  (event) =>
                                    handleItemChange(
                                      index,
                                      event
                                    )
                                }
                                disabled={
                                  viewMode
                                }
                                placeholder="e.g. After food"
                                maxLength="255"
                              />

                            </div>


                          </div>


                          {!viewMode && (

                            <button
                              type="button"
                              className="remove-medicine-btn"
                              onClick={() =>
                                removeMedicineRow(
                                  index
                                )
                              }
                              title="Remove medicine"
                            >
                              ×
                            </button>

                          )}


                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* FOOTER */}

              <div className="prescription-modal-footer">


                <button
                  type="button"
                  className="prescription-secondary-btn"
                  onClick={closeModal}
                >
                  {viewMode
                    ? 'Close'
                    : 'Cancel'}
                </button>


                {!viewMode && (

                  <button
                    type="submit"
                    className="prescription-primary-btn"
                    disabled={saving}
                  >

                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Update Prescription'
                        : 'Create Prescription'}

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


export default Prescriptions