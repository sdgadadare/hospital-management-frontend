import { useEffect, useMemo, useState } from 'react'

import './Rooms.css'

import { get, post, put, remove } from '../api'

const emptyForm = {
  roomNumber: '',
  roomType: '',
  dailyCharge: '',
  description: '',
  available: true,
}

function Rooms() {
  const [rooms, setRooms] = useState([])

  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] =
    useState('ALL')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)

  const [formData, setFormData] = useState(emptyForm)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await get('/api/rooms')

      setRooms(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Rooms API error:', err)
      setError(err.message || 'Unable to load rooms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const filteredRooms = useMemo(() => {
    const value = search.toLowerCase().trim()

    return rooms.filter((room) => {
      const roomNumber = String(
        room.roomNumber ?? ''
      ).toLowerCase()

      const roomType = String(
        room.roomType ?? ''
      ).toLowerCase()

      const description = String(
        room.description ?? ''
      ).toLowerCase()

      const matchesSearch =
        !value ||
        roomNumber.includes(value) ||
        roomType.includes(value) ||
        description.includes(value)

      const matchesAvailability =
        availabilityFilter === 'ALL' ||
        (availabilityFilter === 'AVAILABLE' &&
          room.available === true) ||
        (availabilityFilter === 'OCCUPIED' &&
          room.available === false)

      return (
        matchesSearch &&
        matchesAvailability
      )
    })
  }, [
    rooms,
    search,
    availabilityFilter,
  ])

  const totalRooms = rooms.length

  const availableRooms = rooms.filter(
    (room) => room.available === true
  ).length

  const occupiedRooms = rooms.filter(
    (room) => room.available === false
  ).length

  const totalDailyRevenueCapacity = rooms.reduce(
    (sum, room) =>
      sum + Number(room.dailyCharge ?? 0),
    0
  )

  const handleInputChange = (event) => {
    const { name, value, type, checked } =
      event.target

    setFormData((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (room) => {
    setEditingId(room.id)

    setFormData({
      roomNumber: room.roomNumber ?? '',
      roomType: room.roomType ?? '',
      dailyCharge: room.dailyCharge ?? '',
      description: room.description ?? '',
      available:
        room.available !== false,
    })

    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const openViewModal = (room) => {
    setSelectedRoom(room)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setSelectedRoom(null)
    setViewModalOpen(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.roomNumber.trim()) {
      alert('Please enter room number.')
      return
    }

    if (!formData.roomType.trim()) {
      alert('Please enter room type.')
      return
    }

    if (
      formData.dailyCharge === '' ||
      Number(formData.dailyCharge) < 0
    ) {
      alert('Please enter a valid daily charge.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        roomNumber: formData.roomNumber.trim(),
        roomType: formData.roomType.trim(),
        dailyCharge: Number(
          formData.dailyCharge
        ),
        description:
          formData.description.trim(),
        available: Boolean(formData.available),
      }

      if (editingId) {
        await put(
          `/api/rooms/${editingId}`,
          payload
        )
      } else {
        await post('/api/rooms', payload)
      }

      await fetchRooms()
      closeModal()
    } catch (err) {
      console.error('Save room error:', err)
      alert(
        err.message ||
          'Unable to save room.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this room?'
    )

    if (!confirmed) return

    try {
      await remove(`/api/rooms/${id}`)

      setRooms((current) =>
        current.filter((room) => room.id !== id)
      )
    } catch (err) {
      console.error('Delete room error:', err)

      alert(
        err.message ||
          'Unable to delete room.'
      )
    }
  }

  const formatCurrency = (value) => {
    return Number(value ?? 0).toLocaleString(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }
    )
  }

  return (
    <div className="rooms-page">

      <div className="rooms-header">

        <div>
          <h1>Rooms</h1>
          <p>
            Manage hospital rooms, room types and
            availability.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          + Add Room
        </button>

      </div>

      <div className="room-summary">

        <div className="room-summary-card">
          <div className="room-summary-icon blue">
            🏥
          </div>

          <div>
            <span>Total Rooms</span>
            <strong>{totalRooms}</strong>
          </div>
        </div>

        <div className="room-summary-card">
          <div className="room-summary-icon green">
            ✓
          </div>

          <div>
            <span>Available</span>
            <strong>{availableRooms}</strong>
          </div>
        </div>

        <div className="room-summary-card">
          <div className="room-summary-icon red">
            ●
          </div>

          <div>
            <span>Occupied</span>
            <strong>{occupiedRooms}</strong>
          </div>
        </div>

        <div className="room-summary-card">
          <div className="room-summary-icon orange">
            ₹
          </div>

          <div>
            <span>Daily Charge Capacity</span>
            <strong>
              {formatCurrency(
                totalDailyRevenueCapacity
              )}
            </strong>
          </div>
        </div>

      </div>

      <div className="rooms-toolbar">

        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search room number, type..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="availability-filter"
          value={availabilityFilter}
          onChange={(event) =>
            setAvailabilityFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            All Rooms
          </option>

          <option value="AVAILABLE">
            Available
          </option>

          <option value="OCCUPIED">
            Occupied
          </option>
        </select>

      </div>

      {error && (
        <div className="rooms-error">
          {error}
        </div>
      )}

      <div className="rooms-card">

        <div className="rooms-card-heading">
          <div>
            <h2>Room Inventory</h2>
            <p>
              {filteredRooms.length} room
              {filteredRooms.length !== 1
                ? 's'
                : ''}{' '}
              found
            </p>
          </div>
        </div>

        <div className="rooms-table-wrapper">

          {loading ? (
            <div className="room-state">
              Loading rooms...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="room-state">
              <div className="room-empty-icon">
                🛏
              </div>

              <h3>No rooms found</h3>

              <p>
                Add a room to start managing room
                inventory.
              </p>
            </div>
          ) : (
            <table>

              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Room Type</th>
                  <th>Daily Charge</th>
                  <th>Description</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.id}>

                    <td>
                      <div className="room-number-cell">
                        <div className="room-icon">
                          🛏
                        </div>

                        <strong>
                          {room.roomNumber}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <span className="room-type">
                        {room.roomType || '—'}
                      </span>
                    </td>

                    <td>
                      <strong className="charge">
                        {formatCurrency(
                          room.dailyCharge
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="description">
                        {room.description || '—'}
                      </span>
                    </td>

                    <td>
                      {room.available ? (
                        <span className="availability available">
                          <span>●</span>
                          Available
                        </span>
                      ) : (
                        <span className="availability occupied">
                          <span>●</span>
                          Occupied
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="room-actions">

                        <button
                          className="room-action view"
                          title="View"
                          onClick={() =>
                            openViewModal(room)
                          }
                        >
                          👁
                        </button>

                        <button
                          className="room-action edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(room)
                          }
                        >
                          ✎
                        </button>

                        <button
                          className="room-action delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(room.id)
                          }
                        >
                          🗑
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>
      </div>

      {modalOpen && (
        <div
          className="room-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal()
            }
          }}
        >
          <div className="room-modal">

            <div className="room-modal-header">

              <div>
                <h2>
                  {editingId
                    ? 'Edit Room'
                    : 'Add New Room'}
                </h2>

                <p>
                  Enter room information below.
                </p>
              </div>

              <button
                className="room-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              className="room-form"
              onSubmit={handleSubmit}
            >

              <div className="room-form-grid">

                <div className="room-form-group">
                  <label>
                    Room Number <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 101"
                    required
                  />
                </div>

                <div className="room-form-group">
                  <label>
                    Room Type <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    placeholder="e.g. General Ward"
                    required
                  />
                </div>

                <div className="room-form-group">
                  <label>
                    Daily Charge (₹) <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="dailyCharge"
                    value={formData.dailyCharge}
                    onChange={handleInputChange}
                    placeholder="e.g. 1500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="room-form-group">
                  <label>
                    Availability
                  </label>

                  <label className="availability-toggle">

                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                    />

                    <span className="toggle-slider"></span>

                    <span>
                      {formData.available
                        ? 'Available'
                        : 'Occupied'}
                    </span>

                  </label>
                </div>

                <div className="room-form-group full">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Room description..."
                    rows="4"
                  />
                </div>

              </div>

              <div className="room-modal-footer">

                <button
                  type="button"
                  className="room-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="room-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Room'
                      : 'Add Room'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {viewModalOpen && selectedRoom && (
        <div
          className="room-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeViewModal()
            }
          }}
        >
          <div className="room-modal view-room-modal">

            <div className="room-modal-header">

              <div>
                <h2>
                  Room {selectedRoom.roomNumber}
                </h2>

                <p>
                  Room details and availability.
                </p>
              </div>

              <button
                className="room-modal-close"
                onClick={closeViewModal}
              >
                ×
              </button>

            </div>

            <div className="room-details-grid">

              <div className="room-detail">
                <span>Room Number</span>
                <strong>
                  {selectedRoom.roomNumber}
                </strong>
              </div>

              <div className="room-detail">
                <span>Room Type</span>
                <strong>
                  {selectedRoom.roomType || '—'}
                </strong>
              </div>

              <div className="room-detail">
                <span>Daily Charge</span>
                <strong>
                  {formatCurrency(
                    selectedRoom.dailyCharge
                  )}
                </strong>
              </div>

              <div className="room-detail">
                <span>Availability</span>
                <strong>
                  {selectedRoom.available
                    ? 'Available'
                    : 'Occupied'}
                </strong>
              </div>

              <div className="room-detail full">
                <span>Description</span>
                <strong>
                  {selectedRoom.description || '—'}
                </strong>
              </div>

            </div>

            <div className="room-modal-footer">

              <button
                className="room-cancel-btn"
                onClick={closeViewModal}
              >
                Close
              </button>

              <button
                className="room-save-btn"
                onClick={() => {
                  closeViewModal()
                  openEditModal(selectedRoom)
                }}
              >
                Edit Room
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Rooms