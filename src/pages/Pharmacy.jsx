import { useEffect, useMemo, useState } from 'react'

import './Pharmacy.css'

import { get, post, put, remove } from '../api'


function Pharmacy() {

  const emptyForm = {
    name: '',
    category: '',
    price: '',
    stockQuantity: '',
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
    manufacturingDate: '',
    available: true,
    description: ''
  }

  const [medicines, setMedicines] = useState([])

  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] =
    useState('ALL')
  const [categoryFilter, setCategoryFilter] =
    useState('ALL')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] =
    useState(emptyForm)


  // =========================================================
  // FETCH MEDICINES
  // =========================================================

  const fetchMedicines = async () => {

    try {

      setLoading(true)
      setError('')

      const data =
        await get('/api/medicines')

      setMedicines(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(
        'Medicines API error:',
        err
      )

      setError(
        err.message ||
        'Unable to load medicine data.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    fetchMedicines()

  }, [])


  // =========================================================
  // HELPERS
  // =========================================================

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


  const isExpired = (date) => {

    if (!date) {
      return false
    }

    const expiry =
      new Date(date)

    const today =
      new Date()

    today.setHours(0, 0, 0, 0)

    expiry.setHours(0, 0, 0, 0)

    return expiry < today

  }


  const isExpiringSoon = (date) => {

    if (!date) {
      return false
    }

    const expiry =
      new Date(date)

    const today =
      new Date()

    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    const difference =
      expiry.getTime() -
      today.getTime()

    const days =
      difference /
      (1000 * 60 * 60 * 24)

    return days >= 0 && days <= 30

  }


  const getStockStatus = (quantity) => {

    const stock =
      Number(quantity ?? 0)

    if (stock === 0) {
      return 'OUT'
    }

    if (stock <= 10) {
      return 'LOW'
    }

    return 'GOOD'

  }


  // =========================================================
  // CATEGORIES
  // =========================================================

  const categories = useMemo(() => {

    return [
      ...new Set(
        medicines
          .map(
            (medicine) =>
              medicine.category
          )
          .filter(Boolean)
      )
    ].sort()

  }, [medicines])


  // =========================================================
  // FILTER
  // =========================================================

  const filteredMedicines = useMemo(() => {

    const value =
      search
        .toLowerCase()
        .trim()

    return medicines.filter(
      (medicine) => {

        const name =
          String(
            medicine.name ?? ''
          ).toLowerCase()

        const category =
          String(
            medicine.category ?? ''
          ).toLowerCase()

        const manufacturer =
          String(
            medicine.manufacturer ?? ''
          ).toLowerCase()

        const batch =
          String(
            medicine.batchNumber ?? ''
          ).toLowerCase()

        const description =
          String(
            medicine.description ?? ''
          ).toLowerCase()


        const matchesSearch =
          !value ||
          name.includes(value) ||
          category.includes(value) ||
          manufacturer.includes(value) ||
          batch.includes(value) ||
          description.includes(value)


        const matchesAvailability =
          availabilityFilter === 'ALL' ||
          (
            availabilityFilter === 'AVAILABLE' &&
            medicine.available === true
          ) ||
          (
            availabilityFilter === 'UNAVAILABLE' &&
            medicine.available === false
          )


        const matchesCategory =
          categoryFilter === 'ALL' ||
          medicine.category === categoryFilter


        return (
          matchesSearch &&
          matchesAvailability &&
          matchesCategory
        )

      }
    )

  }, [
    medicines,
    search,
    availabilityFilter,
    categoryFilter
  ])


  // =========================================================
  // FORM
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


  const handleAvailabilityChange =
    (event) => {

      setFormData(
        (current) => ({
          ...current,
          available:
            event.target.checked
        })
      )

    }


  const resetForm = () => {

    setFormData({
      ...emptyForm
    })

    setEditingId(null)
    setViewMode(false)

  }


  const openAddModal = () => {

    resetForm()

    setModalOpen(true)

  }


  const openEditModal = (medicine) => {

    setEditingId(
      medicine.id
    )

    setViewMode(false)

    setFormData({

      name:
        medicine.name ?? '',

      category:
        medicine.category ?? '',

      price:
        medicine.price ?? '',

      stockQuantity:
        medicine.stockQuantity ?? '',

      expiryDate:
        medicine.expiryDate ?? '',

      batchNumber:
        medicine.batchNumber ?? '',

      manufacturer:
        medicine.manufacturer ?? '',

      manufacturingDate:
        medicine.manufacturingDate ?? '',

      available:
        medicine.available ?? false,

      description:
        medicine.description ?? ''

    })

    setModalOpen(true)

  }


  const openViewModal = (medicine) => {

    setEditingId(
      medicine.id
    )

    setViewMode(true)

    setFormData({

      name:
        medicine.name ?? '',

      category:
        medicine.category ?? '',

      price:
        medicine.price ?? '',

      stockQuantity:
        medicine.stockQuantity ?? '',

      expiryDate:
        medicine.expiryDate ?? '',

      batchNumber:
        medicine.batchNumber ?? '',

      manufacturer:
        medicine.manufacturer ?? '',

      manufacturingDate:
        medicine.manufacturingDate ?? '',

      available:
        medicine.available ?? false,

      description:
        medicine.description ?? ''

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

    if (!formData.name.trim()) {

      alert(
        'Please enter medicine name.'
      )

      return false

    }


    if (!formData.category.trim()) {

      alert(
        'Please enter medicine category.'
      )

      return false

    }


    if (
      formData.price === '' ||
      Number(formData.price) < 0
    ) {

      alert(
        'Please enter a valid price.'
      )

      return false

    }


    if (
      formData.stockQuantity === '' ||
      Number(formData.stockQuantity) < 0 ||
      !Number.isInteger(
        Number(formData.stockQuantity)
      )
    ) {

      alert(
        'Please enter a valid stock quantity.'
      )

      return false

    }


    if (!formData.expiryDate) {

      alert(
        'Please select expiry date.'
      )

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

        name:
          formData.name.trim(),

        category:
          formData.category.trim(),

        price:
          Number(formData.price),

        stockQuantity:
          Number(formData.stockQuantity),

        expiryDate:
          formData.expiryDate,

        batchNumber:
          formData.batchNumber.trim() ||
          null,

        manufacturer:
          formData.manufacturer.trim() ||
          null,

        manufacturingDate:
          formData.manufacturingDate ||
          null,

        available:
          Boolean(formData.available),

        description:
          formData.description.trim() ||
          null

      }


      if (editingId) {

        await put(
          `/api/medicines/${editingId}`,
          payload
        )

      } else {

        await post(
          '/api/medicines',
          payload
        )

      }


      closeModal()

      await fetchMedicines()

    } catch (err) {

      console.error(
        'Save medicine error:',
        err
      )

      alert(
        err.message ||
        'Unable to save medicine.'
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
        'Are you sure you want to delete this medicine?'
      )

    if (!confirmed) {
      return
    }


    try {

      await remove(
        `/api/medicines/${id}`
      )

      setMedicines(
        (current) =>
          current.filter(
            (medicine) =>
              medicine.id !== id
          )
      )

    } catch (err) {

      console.error(
        'Delete medicine error:',
        err
      )

      alert(
        err.message ||
        'Unable to delete medicine.'
      )

    }

  }


  // =========================================================
  // STATISTICS
  // =========================================================

  const totalMedicines =
    medicines.length


  const availableMedicines =
    medicines.filter(
      (medicine) =>
        medicine.available === true
    ).length


  const lowStockMedicines =
    medicines.filter(
      (medicine) =>
        getStockStatus(
          medicine.stockQuantity
        ) === 'LOW'
    ).length


  const outOfStockMedicines =
    medicines.filter(
      (medicine) =>
        getStockStatus(
          medicine.stockQuantity
        ) === 'OUT'
    ).length


  const expiringMedicines =
    medicines.filter(
      (medicine) =>
        isExpiringSoon(
          medicine.expiryDate
        )
    ).length


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="pharmacy-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-heading">

        <div>

          <span className="page-eyebrow">
            PHARMACY MANAGEMENT
          </span>

          <h1>
            Pharmacy
          </h1>

          <p>
            Manage medicines, inventory,
            stock levels and expiry information.
          </p>

        </div>


        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Medicine
        </button>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <div className="error-banner">
          {error}
        </div>

      )}


      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="pharmacy-summary">


        <div className="summary-card">

          <div className="summary-icon blue">
            ▣
          </div>

          <div>

            <span>
              Total Medicines
            </span>

            <strong>
              {totalMedicines}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon green">
            ✓
          </div>

          <div>

            <span>
              Available
            </span>

            <strong>
              {availableMedicines}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon orange">
            !
          </div>

          <div>

            <span>
              Low Stock
            </span>

            <strong>
              {lowStockMedicines}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon red">
            ×
          </div>

          <div>

            <span>
              Out of Stock
            </span>

            <strong>
              {outOfStockMedicines}
            </strong>

          </div>

        </div>


      </div>


      {/* =====================================================
          ALERT
          ===================================================== */}

      {expiringMedicines > 0 && (

        <div className="expiry-alert">

          <div className="expiry-alert-icon">
            !
          </div>

          <div>

            <strong>
              Expiry Alert
            </strong>

            <p>
              {expiringMedicines}
              {' '}
              medicine
              {expiringMedicines !== 1
                ? 's are'
                : ' is'}
              {' '}
              expiring within 30 days.
            </p>

          </div>

        </div>

      )}


      {/* =====================================================
          MAIN CARD
          ===================================================== */}

      <div className="pharmacy-card">


        {/* TOOLBAR */}

        <div className="pharmacy-toolbar">


          <div>

            <h2>
              Medicine Inventory
            </h2>

            <p>
              {filteredMedicines.length}
              {' '}
              {filteredMedicines.length === 1
                ? 'medicine'
                : 'medicines'}
              {' '}
              found
            </p>

          </div>


          <div className="toolbar-controls">


            {/* SEARCH */}

            <div className="medicine-search">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search medicine..."
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
                  className="clear-search"
                  onClick={() =>
                    setSearch('')
                  }
                >
                  ×
                </button>

              )}

            </div>


            {/* AVAILABILITY */}

            <select
              className="filter-select"
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Status
              </option>

              <option value="AVAILABLE">
                Available
              </option>

              <option value="UNAVAILABLE">
                Unavailable
              </option>

            </select>


            {/* CATEGORY */}

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Categories
              </option>

              {categories.map(
                (category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>

                )
              )}

            </select>


          </div>

        </div>


        {/* ===================================================
            TABLE
            =================================================== */}

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  Medicine
                </th>

                <th>
                  Category
                </th>

                <th>
                  Price
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Expiry
                </th>

                <th>
                  Batch
                </th>

                <th>
                  Manufacturer
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
                    colSpan="9"
                    className="table-message"
                  >
                    Loading medicines...
                  </td>

                </tr>

              ) : filteredMedicines.length === 0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="table-message"
                  >

                    <div className="empty-state">

                      <div className="empty-icon">
                        ▣
                      </div>

                      <strong>
                        No medicines found
                      </strong>

                      <span>
                        Add a medicine or
                        change your filters.
                      </span>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredMedicines.map(
                  (medicine) => {

                    const stockStatus =
                      getStockStatus(
                        medicine.stockQuantity
                      )

                    const expired =
                      isExpired(
                        medicine.expiryDate
                      )

                    const expiringSoon =
                      isExpiringSoon(
                        medicine.expiryDate
                      )


                    return (

                      <tr
                        key={medicine.id}
                      >


                        {/* MEDICINE */}

                        <td>

                          <div className="medicine-info">

                            <div className="medicine-avatar">
                              {medicine.name
                                ?.charAt(0)
                                .toUpperCase() ||
                                'M'}
                            </div>

                            <div>

                              <strong>
                                {medicine.name}
                              </strong>

                              <span>
                                ID: #{medicine.id}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* CATEGORY */}

                        <td>

                          <span className="category-badge">
                            {medicine.category ||
                              '—'}
                          </span>

                        </td>


                        {/* PRICE */}

                        <td>

                          <strong className="price">
                            ₹
                            {Number(
                              medicine.price ?? 0
                            ).toFixed(2)}
                          </strong>

                        </td>


                        {/* STOCK */}

                        <td>

                          <div className="stock-cell">

                            <strong>
                              {medicine.stockQuantity ??
                                0}
                            </strong>

                            <span
                              className={
                                `stock-status ${stockStatus.toLowerCase()}`
                              }
                            >

                              {stockStatus === 'GOOD'
                                ? 'In Stock'
                                : stockStatus === 'LOW'
                                  ? 'Low Stock'
                                  : 'Out of Stock'}

                            </span>

                          </div>

                        </td>


                        {/* EXPIRY */}

                        <td>

                          <div className="expiry-cell">

                            <span
                              className={
                                expired
                                  ? 'expiry-danger'
                                  : expiringSoon
                                    ? 'expiry-warning'
                                    : ''
                              }
                            >
                              {formatDate(
                                medicine.expiryDate
                              )}
                            </span>

                            {expired && (

                              <small>
                                Expired
                              </small>

                            )}

                            {!expired &&
                              expiringSoon && (

                                <small>
                                  Expiring soon
                                </small>

                              )}

                          </div>

                        </td>


                        {/* BATCH */}

                        <td>

                          <span className="batch-number">
                            {medicine.batchNumber ||
                              '—'}
                          </span>

                        </td>


                        {/* MANUFACTURER */}

                        <td>

                          <span className="manufacturer">
                            {medicine.manufacturer ||
                              '—'}
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              medicine.available
                                ? 'status-badge available'
                                : 'status-badge unavailable'
                            }
                          >

                            <span className="status-dot">
                            </span>

                            {medicine.available
                              ? 'Available'
                              : 'Unavailable'}

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
                                  medicine
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
                                  medicine
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
                                  medicine.id
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

          <div className="medicine-modal">


            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <span className="modal-eyebrow">

                  {viewMode
                    ? 'MEDICINE DETAILS'
                    : editingId
                      ? 'UPDATE MEDICINE'
                      : 'NEW MEDICINE'}

                </span>

                <h2>

                  {viewMode
                    ? 'Medicine Details'
                    : editingId
                      ? 'Edit Medicine'
                      : 'Add Medicine'}

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
              className="medicine-form"
              onSubmit={handleSubmit}
            >


              {/* NAME / CATEGORY */}

              <div className="form-grid two-columns">


                <div className="form-group">

                  <label>
                    Medicine Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    placeholder="e.g. Paracetamol"
                    maxLength="255"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Category
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    placeholder="e.g. Pain Relief"
                    maxLength="255"
                    required
                  />

                </div>


              </div>


              {/* PRICE / STOCK */}

              <div className="form-grid two-columns">


                <div className="form-group">

                  <label>
                    Price
                    <span>*</span>
                  </label>

                  <div className="input-with-prefix">

                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={
                        handleInputChange
                      }
                      disabled={viewMode}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />

                  </div>

                </div>


                <div className="form-group">

                  <label>
                    Stock Quantity
                    <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="stockQuantity"
                    value={
                      formData.stockQuantity
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />

                </div>


              </div>


              {/* MANUFACTURING / EXPIRY */}

              <div className="form-grid two-columns">


                <div className="form-group">

                  <label>
                    Manufacturing Date
                  </label>

                  <input
                    type="date"
                    name="manufacturingDate"
                    value={
                      formData.manufacturingDate
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                  />

                </div>


                <div className="form-group">

                  <label>
                    Expiry Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="expiryDate"
                    value={
                      formData.expiryDate
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    required
                  />

                </div>


              </div>


              {/* BATCH / MANUFACTURER */}

              <div className="form-grid two-columns">


                <div className="form-group">

                  <label>
                    Batch Number
                  </label>

                  <input
                    type="text"
                    name="batchNumber"
                    value={
                      formData.batchNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    placeholder="e.g. BTH-2026-001"
                    maxLength="255"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Manufacturer
                  </label>

                  <input
                    type="text"
                    name="manufacturer"
                    value={
                      formData.manufacturer
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={viewMode}
                    placeholder="Manufacturer name"
                    maxLength="255"
                  />

                </div>


              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={viewMode}
                  placeholder="Enter medicine description..."
                  rows="3"
                  maxLength="255"
                />

              </div>


              {/* AVAILABILITY */}

              <div className="availability-box">

                <div>

                  <strong>
                    Medicine Availability
                  </strong>

                  <span>
                    Control whether this medicine
                    is currently available.
                  </span>

                </div>


                <label className="switch">

                  <input
                    type="checkbox"
                    checked={
                      formData.available
                    }
                    onChange={
                      handleAvailabilityChange
                    }
                    disabled={viewMode}
                  />

                  <span className="slider">
                  </span>

                </label>

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
                    className="primary-btn"
                    disabled={saving}
                  >

                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Update Medicine'
                        : 'Save Medicine'}

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


export default Pharmacy