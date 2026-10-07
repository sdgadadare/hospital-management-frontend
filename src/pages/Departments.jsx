import { useEffect, useMemo, useState } from 'react'
import './Departments.css'
import { get, post, put, remove } from '../api'

function Departments() {
  const emptyForm = {
    name: '',
    description: '',
    location: '',
    active: true
  }

  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await get('/api/departments')

      setDepartments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Departments API error:', err)
      setError(err.message || 'Unable to load department data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const getDepartmentName = (department) => {
    return department.name || 'Unnamed Department'
  }

  const getDescription = (department) => {
    return department.description || 'Hospital medical department'
  }

  const getLocation = (department) => {
    return department.location || 'Not specified'
  }

  const getActiveStatus = (department) => {
    return department.active !== false
  }

  const getDoctorCount = (department) => {
    if (Array.isArray(department.doctors)) {
      return department.doctors.length
    }

    return department.doctorCount ?? 0
  }

  const filteredDepartments = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) return departments

    return departments.filter((department) => {
      const name = getDepartmentName(department).toLowerCase()
      const description = getDescription(department).toLowerCase()
      const location = getLocation(department).toLowerCase()

      return (
        name.includes(value) ||
        description.includes(value) ||
        location.includes(value)
      )
    })
  }, [departments, search])

  const activeDepartments = departments.filter(
    (department) => getActiveStatus(department)
  ).length

  const totalDoctors = departments.reduce(
    (total, department) => total + getDoctorCount(department),
    0
  )

  const openAddModal = () => {
    setModalMode('add')
    setSelectedDepartment(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (department) => {
    setModalMode('edit')
    setSelectedDepartment(department)

    setFormData({
      name: department.name || '',
      description: department.description || '',
      location: department.location || '',
      active: department.active !== false
    })

    setShowModal(true)
  }

  const openViewModal = (department) => {
    setModalMode('view')
    setSelectedDepartment(department)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setSelectedDepartment(null)
    setFormData(emptyForm)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      alert('Department name is required.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        active: formData.active
      }

      if (modalMode === 'add') {
        const created = await post('/api/departments', payload)

        setDepartments((current) => [
          ...current,
          created
        ])

        alert('Department added successfully.')
      } else {
        const updated = await put(
          `/api/departments/${selectedDepartment.id}`,
          payload
        )

        setDepartments((current) =>
          current.map((department) =>
            department.id === selectedDepartment.id
              ? updated
              : department
          )
        )

        alert('Department updated successfully.')
      }

      closeModal()
    } catch (err) {
      console.error('Department save error:', err)
      alert(err.message || 'Unable to save department.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this department?'
    )

    if (!confirmed) return

    try {
      await remove(`/api/departments/${id}`)

      setDepartments((current) =>
        current.filter((department) => department.id !== id)
      )
    } catch (err) {
      console.error('Delete department error:', err)
      alert(err.message || 'Unable to delete department.')
    }
  }

  const departmentIcons = [
    '⚕',
    '♡',
    '♧',
    '✚',
    '▣',
    '♢'
  ]

  return (
    <div className="departments-page">

      {/* HEADER */}

      <div className="page-heading">
        <div>
          <h1>Departments</h1>

          <p>
            Manage hospital departments and their services.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Department
        </button>
      </div>


      {/* SUMMARY */}

      <div className="department-summary">

        <div className="summary-card">
          <div className="summary-icon blue">
            ▤
          </div>

          <div>
            <span>Total Departments</span>
            <strong>{departments.length}</strong>
          </div>
        </div>


        <div className="summary-card">
          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>Active Departments</span>
            <strong>{activeDepartments}</strong>
          </div>
        </div>


        <div className="summary-card">
          <div className="summary-icon purple">
            ⚕
          </div>

          <div>
            <span>Total Doctors</span>

            <strong>
              {totalDoctors}
            </strong>
          </div>
        </div>


        <div className="summary-card">
          <div className="summary-icon orange">
            ♡
          </div>

          <div>
            <span>Hospital Services</span>
            <strong>{departments.length}</strong>
          </div>
        </div>

      </div>


      {/* DEPARTMENT CARD */}

      <div className="departments-card">

        <div className="departments-toolbar">

          <div>
            <h2>Department Directory</h2>

            <p>
              {filteredDepartments.length} departments found
            </p>
          </div>


          <div className="department-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

        </div>


        {error && (
          <div className="departments-error">
            {error}
          </div>
        )}


        {/* DEPARTMENT GRID */}

        <div className="department-grid">

          {loading ? (

            <div className="department-message">
              Loading departments...
            </div>

          ) : filteredDepartments.length === 0 ? (

            <div className="department-message">
              No departments found.
            </div>

          ) : (

            filteredDepartments.map(
              (department, index) => {

                const name =
                  getDepartmentName(department)

                const description =
                  getDescription(department)

                const doctorCount =
                  getDoctorCount(department)

                const isActive =
                  getActiveStatus(department)

                return (

                  <div
                    className="department-item"
                    key={department.id}
                  >

                    {/* CARD TOP */}

                    <div className="department-top">

                      <div
                        className={`department-icon icon-${index % 6}`}
                      >
                        {
                          departmentIcons[
                            index % departmentIcons.length
                          ]
                        }
                      </div>

                      <div className="department-actions">

                        <button
                          className="small-action view"
                          title="View"
                          onClick={() =>
                            openViewModal(department)
                          }
                        >
                          👁
                        </button>

                        <button
                          className="small-action edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(department)
                          }
                        >
                          ✎
                        </button>

                        <button
                          className="small-action delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(department.id)
                          }
                        >
                          ×
                        </button>

                      </div>

                    </div>


                    {/* NAME */}

                    <h3>
                      {name}
                    </h3>


                    {/* DESCRIPTION */}

                    <p>
                      {description}
                    </p>


                    {/* LOCATION */}

                    <div className="department-location">
                      <span>⌖</span>
                      {getLocation(department)}
                    </div>


                    {/* FOOTER */}

                    <div className="department-footer">

                      <div className="doctor-count">

                        <span className="doctor-mini-icon">
                          ⚕
                        </span>

                        <span>
                          {doctorCount} Doctors
                        </span>

                      </div>

                      <span
                        className={
                          isActive
                            ? 'active-label'
                            : 'inactive-label'
                        }
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>

                    </div>

                  </div>
                )
              }
            )
          )}

        </div>

      </div>


      {/* ADD / EDIT / VIEW MODAL */}

      {showModal && (
        <div
          className="department-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="department-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {modalMode === 'add'
                    ? 'Add Department'
                    : modalMode === 'edit'
                      ? 'Edit Department'
                      : 'Department Details'}
                </h2>

                <p>
                  {modalMode === 'view'
                    ? 'View department information.'
                    : 'Enter department information below.'}
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


            {modalMode === 'view' ? (

              <div className="department-view">

                <div className="view-icon">
                  ⚕
                </div>

                <h3>
                  {getDepartmentName(selectedDepartment)}
                </h3>

                <p className="view-description">
                  {getDescription(selectedDepartment)}
                </p>

                <div className="view-grid">

                  <div className="view-item">
                    <span>Location</span>
                    <strong>
                      {getLocation(selectedDepartment)}
                    </strong>
                  </div>

                  <div className="view-item">
                    <span>Status</span>
                    <strong>
                      {getActiveStatus(selectedDepartment)
                        ? 'Active'
                        : 'Inactive'}
                    </strong>
                  </div>

                  <div className="view-item">
                    <span>Doctors</span>
                    <strong>
                      {getDoctorCount(selectedDepartment)}
                    </strong>
                  </div>

                  <div className="view-item">
                    <span>Department ID</span>
                    <strong>
                      #{selectedDepartment?.id}
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
                      openEditModal(selectedDepartment)
                    }
                  >
                    ✎ Edit Department
                  </button>
                </div>

              </div>

            ) : (

              <form
                className="department-form"
                onSubmit={handleSubmit}
              >

                <div className="form-group full-width">

                  <label>
                    Department Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology"
                    required
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter department description..."
                    rows="4"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. First Floor"
                  />

                </div>


                <div className="form-group status-group">

                  <label>
                    Department Status
                  </label>

                  <label className="toggle-container">

                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                    />

                    <span className="toggle-slider"></span>

                    <span className="toggle-text">
                      {formData.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>

                  </label>

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
                        ? 'Add Department'
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

export default Departments