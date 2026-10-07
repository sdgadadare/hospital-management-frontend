import { useEffect, useMemo, useState } from 'react'
import './Billing.css'

import { get, post, put, remove } from '../api'

const emptyBill = {
  appointmentId: '',
  billingDate: new Date().toISOString().split('T')[0],
  totalAmount: '',
  paidAmount: '',
  paymentMethod: '',
  paymentStatus: 'PENDING',
}

const emptyPayment = {
  billId: '',
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 16),
  paymentMethod: '',
  status: 'SUCCESS',
  transactionReference: '',
}

function Billing() {
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [appointments, setAppointments] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('bills')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [billModal, setBillModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)

  const [viewType, setViewType] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  const [editingBillId, setEditingBillId] = useState(null)
  const [editingPaymentId, setEditingPaymentId] = useState(null)

  const [billForm, setBillForm] = useState(emptyBill)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [billData, paymentData, appointmentData] =
        await Promise.all([
          get('/api/bills'),
          get('/api/payments'),
          get('/api/appointments'),
        ])

      setBills(Array.isArray(billData) ? billData : [])
      setPayments(Array.isArray(paymentData) ? paymentData : [])
      setAppointments(
        Array.isArray(appointmentData) ? appointmentData : []
      )
    } catch (err) {
      setError(err.message || 'Unable to load billing data.')
    } finally {
      setLoading(false)
    }
  }

  const getAppointmentId = (bill) => {
    return (
      bill?.appointment?.id ??
      bill?.appointmentId ??
      ''
    )
  }

  const getBillId = (payment) => {
    return (
      payment?.bill?.id ??
      payment?.billId ??
      ''
    )
  }

  const getPatientName = (appointment) => {
    const patient = appointment?.patient

    if (!patient) {
      return 'Unknown Patient'
    }

    const fullName = [
      patient.firstName,
      patient.lastName,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      fullName ||
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

  const getAppointmentLabel = (appointment) => {
    if (!appointment) {
      return 'Unknown Appointment'
    }

    return `${getPatientName(appointment)} • ${getDoctorName(
      appointment
    )}`
  }

  const findAppointment = (appointmentId) => {
    return appointments.find(
      (item) => Number(item.id) === Number(appointmentId)
    )
  }

  const findBill = (billId) => {
    return bills.find(
      (item) => Number(item.id) === Number(billId)
    )
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

  const formatDateTime = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value) => {
    const amount = Number(value || 0)

    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })
  }

  const getBillStatus = (bill) => {
    return (
      bill?.paymentStatus ||
      bill?.status ||
      'PENDING'
    ).toString().toUpperCase()
  }

  const getPaymentStatus = (payment) => {
    return (
      payment?.status ||
      'PENDING'
    ).toString().toUpperCase()
  }

  const billStats = useMemo(() => {
    const total = bills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    )

    const paid = bills.reduce(
      (sum, bill) => sum + Number(bill.paidAmount || 0),
      0
    )

    const pending = Math.max(total - paid, 0)

    const paidBills = bills.filter(
      (bill) => getBillStatus(bill) === 'PAID'
    ).length

    return {
      totalBills: bills.length,
      totalAmount: total,
      paidAmount: paid,
      pendingAmount: pending,
      paidBills,
    }
  }, [bills])

  const paymentStats = useMemo(() => {
    const total = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )

    const successful = payments.filter(
      (payment) =>
        ['SUCCESS', 'COMPLETED', 'PAID'].includes(
          getPaymentStatus(payment)
        )
    ).length

    return {
      totalPayments: payments.length,
      totalReceived: total,
      successful,
    }
  }, [payments])

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase()

    return bills.filter((bill) => {
      const appointment = findAppointment(
        getAppointmentId(bill)
      )

      const searchable = [
        bill.id,
        bill.billingDate,
        bill.paymentMethod,
        bill.paymentStatus,
        getPatientName(appointment),
        getDoctorName(appointment),
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchable.includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        getBillStatus(bill) === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bills, appointments, search, statusFilter])

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return payments.filter((payment) => {
      const bill = findBill(getBillId(payment))
      const appointment = bill
        ? findAppointment(getAppointmentId(bill))
        : null

      const searchable = [
        payment.id,
        payment.amount,
        payment.paymentMethod,
        payment.status,
        payment.transactionReference,
        getBillId(payment),
        getPatientName(appointment),
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchable.includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        getPaymentStatus(payment) === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [
    payments,
    bills,
    appointments,
    search,
    statusFilter,
  ])

  const openAddBill = () => {
    setEditingBillId(null)
    setBillForm(emptyBill)
    setError('')
    setBillModal(true)
  }

  const openEditBill = (bill) => {
    setEditingBillId(bill.id)

    setBillForm({
      appointmentId: getAppointmentId(bill),
      billingDate:
        bill.billingDate ||
        new Date().toISOString().split('T')[0],
      totalAmount: bill.totalAmount ?? '',
      paidAmount: bill.paidAmount ?? '',
      paymentMethod: bill.paymentMethod || '',
      paymentStatus:
        bill.paymentStatus ||
        bill.status ||
        'PENDING',
    })

    setError('')
    setBillModal(true)
  }

  const openAddPayment = () => {
    setEditingPaymentId(null)
    setPaymentForm(emptyPayment)
    setError('')
    setPaymentModal(true)
  }

  const openEditPayment = (payment) => {
    setEditingPaymentId(payment.id)

    let paymentDate = payment.paymentDate || ''

    if (paymentDate) {
      const date = new Date(paymentDate)

      if (!Number.isNaN(date.getTime())) {
        paymentDate = date.toISOString().slice(0, 16)
      }
    }

    setPaymentForm({
      billId: getBillId(payment),
      amount: payment.amount ?? '',
      paymentDate,
      paymentMethod: payment.paymentMethod || '',
      status: payment.status || 'SUCCESS',
      transactionReference:
        payment.transactionReference || '',
    })

    setError('')
    setPaymentModal(true)
  }

  const openView = (type, item) => {
    setViewType(type)
    setSelectedItem(item)
    setViewModal(true)
  }

  const handleBillChange = (event) => {
    const { name, value } = event.target

    setBillForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePaymentChange = (event) => {
    const { name, value } = event.target

    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateBill = () => {
    if (!billForm.appointmentId) {
      return 'Please select an appointment.'
    }

    if (!billForm.billingDate) {
      return 'Please select a billing date.'
    }

    if (
      billForm.totalAmount === '' ||
      Number(billForm.totalAmount) < 0
    ) {
      return 'Please enter a valid total amount.'
    }

    if (
      billForm.paidAmount === '' ||
      Number(billForm.paidAmount) < 0
    ) {
      return 'Please enter a valid paid amount.'
    }

    if (
      Number(billForm.paidAmount) >
      Number(billForm.totalAmount)
    ) {
      return 'Paid amount cannot be greater than total amount.'
    }

    return ''
  }

  const validatePayment = () => {
    if (!paymentForm.billId) {
      return 'Please select a bill.'
    }

    if (
      paymentForm.amount === '' ||
      Number(paymentForm.amount) <= 0
    ) {
      return 'Please enter a valid payment amount.'
    }

    if (!paymentForm.paymentDate) {
      return 'Please select payment date.'
    }

    if (!paymentForm.paymentMethod.trim()) {
      return 'Please enter payment method.'
    }

    return ''
  }

  const saveBill = async (event) => {
    event.preventDefault()

    const validationError = validateBill()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        appointment: {
          id: Number(billForm.appointmentId),
        },
        billingDate: billForm.billingDate,
        totalAmount: Number(billForm.totalAmount),
        paidAmount: Number(billForm.paidAmount),
        paymentMethod:
          billForm.paymentMethod.trim() || null,
        paymentStatus: billForm.paymentStatus.trim(),
      }

      if (editingBillId) {
        await put(
          `/api/bills/${editingBillId}`,
          payload
        )
      } else {
        await post('/api/bills', payload)
      }

      setBillModal(false)
      setEditingBillId(null)
      setBillForm(emptyBill)

      await fetchData()
    } catch (err) {
      setError(err.message || 'Unable to save bill.')
    } finally {
      setSaving(false)
    }
  }

  const savePayment = async (event) => {
    event.preventDefault()

    const validationError = validatePayment()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        bill: {
          id: Number(paymentForm.billId),
        },
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod:
          paymentForm.paymentMethod.trim(),
        status: paymentForm.status.trim(),
        transactionReference:
          paymentForm.transactionReference.trim() || null,
      }

      if (editingPaymentId) {
        await put(
          `/api/payments/${editingPaymentId}`,
          payload
        )
      } else {
        await post('/api/payments', payload)
      }

      setPaymentModal(false)
      setEditingPaymentId(null)
      setPaymentForm(emptyPayment)

      await fetchData()
    } catch (err) {
      setError(err.message || 'Unable to save payment.')
    } finally {
      setSaving(false)
    }
  }

  const deleteBill = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this bill?'
    )

    if (!confirmed) return

    try {
      setError('')
      await remove(`/api/bills/${id}`)
      await fetchData()
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete bill. Remove related payments first if required.'
      )
    }
  }

  const deletePayment = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this payment?'
    )

    if (!confirmed) return

    try {
      setError('')
      await remove(`/api/payments/${id}`)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Unable to delete payment.')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
  }

  return (
    <div className="billing-page">
      <div className="billing-header">
        <div>
          <span className="billing-eyebrow">
            FINANCE MANAGEMENT
          </span>

          <h1>Billing & Payments</h1>

          <p>
            Manage hospital bills, payments and
            transaction records.
          </p>
        </div>

        <div className="billing-header-actions">
          {activeTab === 'bills' ? (
            <button
              className="primary-button"
              onClick={openAddBill}
            >
              <span>＋</span>
              Create Bill
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={openAddPayment}
            >
              <span>＋</span>
              Record Payment
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="billing-error">
          <span>⚠</span>
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="billing-tabs">
        <button
          className={
            activeTab === 'bills'
              ? 'billing-tab active'
              : 'billing-tab'
          }
          onClick={() => {
            setActiveTab('bills')
            setSearch('')
            setStatusFilter('ALL')
          }}
        >
          <span className="tab-icon">▣</span>
          Bills
          <span className="tab-count">
            {bills.length}
          </span>
        </button>

        <button
          className={
            activeTab === 'payments'
              ? 'billing-tab active'
              : 'billing-tab'
          }
          onClick={() => {
            setActiveTab('payments')
            setSearch('')
            setStatusFilter('ALL')
          }}
        >
          <span className="tab-icon">₹</span>
          Payments
          <span className="tab-count">
            {payments.length}
          </span>
        </button>
      </div>

      {activeTab === 'bills' ? (
        <>
          <div className="billing-stats">
            <div className="finance-stat">
              <div className="finance-stat-icon blue">
                ₹
              </div>
              <div>
                <span>Total Billing</span>
                <strong>
                  {formatCurrency(
                    billStats.totalAmount
                  )}
                </strong>
              </div>
            </div>

            <div className="finance-stat">
              <div className="finance-stat-icon green">
                ✓
              </div>
              <div>
                <span>Paid Amount</span>
                <strong>
                  {formatCurrency(
                    billStats.paidAmount
                  )}
                </strong>
              </div>
            </div>

            <div className="finance-stat">
              <div className="finance-stat-icon orange">
                !
              </div>
              <div>
                <span>Pending Amount</span>
                <strong>
                  {formatCurrency(
                    billStats.pendingAmount
                  )}
                </strong>
              </div>
            </div>

            <div className="finance-stat">
              <div className="finance-stat-icon purple">
                #
              </div>
              <div>
                <span>Total Bills</span>
                <strong>
                  {billStats.totalBills}
                </strong>
              </div>
            </div>
          </div>

          <div className="billing-card">
            <div className="billing-toolbar">
              <div className="billing-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search bills, patients, doctors..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

                {search && (
                  <button
                    onClick={() => setSearch('')}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="billing-filters">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="ALL">
                    All Status
                  </option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="PARTIAL">
                    Partial
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>

                {(search ||
                  statusFilter !== 'ALL') && (
                  <button
                    className="clear-filter"
                    onClick={clearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="billing-loading">
                <div className="spinner"></div>
                <p>Loading bills...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="billing-empty">
                <div className="empty-icon">₹</div>
                <h3>No bills found</h3>
                <p>
                  Create your first bill to start
                  managing hospital billing.
                </p>

                {!search &&
                  statusFilter === 'ALL' && (
                    <button
                      className="primary-button"
                      onClick={openAddBill}
                    >
                      ＋ Create Bill
                    </button>
                  )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Bill</th>
                      <th>Patient</th>
                      <th>Billing Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBills.map((bill) => {
                      const appointment =
                        findAppointment(
                          getAppointmentId(bill)
                        )

                      const total = Number(
                        bill.totalAmount || 0
                      )

                      const paid = Number(
                        bill.paidAmount || 0
                      )

                      const balance = Math.max(
                        total - paid,
                        0
                      )

                      const status =
                        getBillStatus(bill)

                      return (
                        <tr key={bill.id}>
                          <td>
                            <div className="bill-number">
                              BILL-
                              {String(bill.id).padStart(
                                4,
                                '0'
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="person-cell">
                              <div className="avatar blue-avatar">
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
                                <small>
                                  {getDoctorName(
                                    appointment
                                  )}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            {formatDate(
                              bill.billingDate
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(total)}
                            </strong>
                          </td>

                          <td className="paid-text">
                            {formatCurrency(paid)}
                          </td>

                          <td>
                            <strong
                              className={
                                balance > 0
                                  ? 'balance-text'
                                  : 'paid-text'
                              }
                            >
                              {formatCurrency(balance)}
                            </strong>
                          </td>

                          <td>
                            {bill.paymentMethod ||
                              '—'}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${status.toLowerCase()}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className="view-action"
                                title="View"
                                onClick={() =>
                                  openView(
                                    'bill',
                                    bill
                                  )
                                }
                              >
                                👁
                              </button>

                              <button
                                className="edit-action"
                                title="Edit"
                                onClick={() =>
                                  openEditBill(bill)
                                }
                              >
                                ✎
                              </button>

                              <button
                                className="delete-action"
                                title="Delete"
                                onClick={() =>
                                  deleteBill(bill.id)
                                }
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="billing-stats">
            <div className="finance-stat">
              <div className="finance-stat-icon blue">
                ₹
              </div>
              <div>
                <span>Total Received</span>
                <strong>
                  {formatCurrency(
                    paymentStats.totalReceived
                  )}
                </strong>
              </div>
            </div>

            <div className="finance-stat">
              <div className="finance-stat-icon green">
                ✓
              </div>
              <div>
                <span>Successful</span>
                <strong>
                  {paymentStats.successful}
                </strong>
              </div>
            </div>

            <div className="finance-stat">
              <div className="finance-stat-icon purple">
                #
              </div>
              <div>
                <span>Total Payments</span>
                <strong>
                  {paymentStats.totalPayments}
                </strong>
              </div>
            </div>

            <div className="finance-stat">
              <div className="finance-stat-icon orange">
                ₹
              </div>
              <div>
                <span>Outstanding</span>
                <strong>
                  {formatCurrency(
                    billStats.pendingAmount
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="billing-card">
            <div className="billing-toolbar">
              <div className="billing-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search payments, bills, transactions..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

                {search && (
                  <button
                    onClick={() => setSearch('')}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="billing-filters">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="ALL">
                    All Status
                  </option>
                  <option value="SUCCESS">
                    Success
                  </option>
                  <option value="COMPLETED">
                    Completed
                  </option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="FAILED">
                    Failed
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>

                {(search ||
                  statusFilter !== 'ALL') && (
                  <button
                    className="clear-filter"
                    onClick={clearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="billing-loading">
                <div className="spinner"></div>
                <p>Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="billing-empty">
                <div className="empty-icon">₹</div>
                <h3>No payments found</h3>
                <p>
                  Record a payment against a bill to
                  see it here.
                </p>

                {!search &&
                  statusFilter === 'ALL' && (
                    <button
                      className="primary-button"
                      onClick={openAddPayment}
                    >
                      ＋ Record Payment
                    </button>
                  )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Payment</th>
                      <th>Bill</th>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Transaction</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map(
                      (payment) => {
                        const bill = findBill(
                          getBillId(payment)
                        )

                        const appointment = bill
                          ? findAppointment(
                              getAppointmentId(
                                bill
                              )
                            )
                          : null

                        const status =
                          getPaymentStatus(
                            payment
                          )

                        return (
                          <tr key={payment.id}>
                            <td>
                              <div className="bill-number">
                                PAY-
                                {String(
                                  payment.id
                                ).padStart(4, '0')}
                              </div>
                            </td>

                            <td>
                              <strong>
                                BILL-
                                {String(
                                  getBillId(payment)
                                ).padStart(
                                  4,
                                  '0'
                                )}
                              </strong>
                            </td>

                            <td>
                              <div className="person-cell">
                                <div className="avatar green-avatar">
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
                                </div>
                              </div>
                            </td>

                            <td>
                              {formatDateTime(
                                payment.paymentDate
                              )}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  payment.amount
                                )}
                              </strong>
                            </td>

                            <td>
                              {payment.paymentMethod ||
                                '—'}
                            </td>

                            <td>
                              <span className="transaction-ref">
                                {payment.transactionReference ||
                                  '—'}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`status-badge ${status.toLowerCase()}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td>
                              <div className="action-buttons">
                                <button
                                  className="view-action"
                                  title="View"
                                  onClick={() =>
                                    openView(
                                      'payment',
                                      payment
                                    )
                                  }
                                >
                                  👁
                                </button>

                                <button
                                  className="edit-action"
                                  title="Edit"
                                  onClick={() =>
                                    openEditPayment(
                                      payment
                                    )
                                  }
                                >
                                  ✎
                                </button>

                                <button
                                  className="delete-action"
                                  title="Delete"
                                  onClick={() =>
                                    deletePayment(
                                      payment.id
                                    )
                                  }
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {billModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => setBillModal(false)}
        >
          <div
            className="modal-card"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  BILL MANAGEMENT
                </span>

                <h2>
                  {editingBillId
                    ? 'Edit Bill'
                    : 'Create New Bill'}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setBillModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveBill}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>
                    Appointment
                    <span>*</span>
                  </label>

                  <select
                    name="appointmentId"
                    value={billForm.appointmentId}
                    onChange={handleBillChange}
                    required
                  >
                    <option value="">
                      Select appointment
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
                </div>

                <div className="form-group">
                  <label>
                    Billing Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="billingDate"
                    value={billForm.billingDate}
                    onChange={handleBillChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Payment Status
                    <span>*</span>
                  </label>

                  <select
                    name="paymentStatus"
                    value={billForm.paymentStatus}
                    onChange={handleBillChange}
                    required
                  >
                    <option value="PENDING">
                      Pending
                    </option>
                    <option value="PARTIAL">
                      Partial
                    </option>
                    <option value="PAID">
                      Paid
                    </option>
                    <option value="CANCELLED">
                      Cancelled
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Total Amount
                    <span>*</span>
                  </label>

                  <div className="input-prefix">
                    <span>₹</span>
                    <input
                      type="number"
                      name="totalAmount"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={billForm.totalAmount}
                      onChange={handleBillChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Paid Amount
                    <span>*</span>
                  </label>

                  <div className="input-prefix">
                    <span>₹</span>
                    <input
                      type="number"
                      name="paidAmount"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={billForm.paidAmount}
                      onChange={handleBillChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={billForm.paymentMethod}
                    onChange={handleBillChange}
                  >
                    <option value="">
                      Select method
                    </option>
                    <option value="CASH">
                      Cash
                    </option>
                    <option value="UPI">
                      UPI
                    </option>
                    <option value="CARD">
                      Card
                    </option>
                    <option value="NET_BANKING">
                      Net Banking
                    </option>
                    <option value="INSURANCE">
                      Insurance
                    </option>
                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setBillModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingBillId
                      ? 'Update Bill'
                      : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModal && (
        <div
          className="modal-overlay"
          onMouseDown={() =>
            setPaymentModal(false)
          }
        >
          <div
            className="modal-card"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  PAYMENT MANAGEMENT
                </span>

                <h2>
                  {editingPaymentId
                    ? 'Edit Payment'
                    : 'Record Payment'}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setPaymentModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={savePayment}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>
                    Bill
                    <span>*</span>
                  </label>

                  <select
                    name="billId"
                    value={paymentForm.billId}
                    onChange={handlePaymentChange}
                    required
                  >
                    <option value="">
                      Select bill
                    </option>

                    {bills.map((bill) => {
                      const appointment =
                        findAppointment(
                          getAppointmentId(
                            bill
                          )
                        )

                      return (
                        <option
                          key={bill.id}
                          value={bill.id}
                        >
                          BILL-
                          {String(
                            bill.id
                          ).padStart(4, '0')}{' '}
                          •{' '}
                          {getPatientName(
                            appointment
                          )}{' '}
                          •{' '}
                          {formatCurrency(
                            bill.totalAmount
                          )}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Amount
                    <span>*</span>
                  </label>

                  <div className="input-prefix">
                    <span>₹</span>
                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={handlePaymentChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Payment Date
                    <span>*</span>
                  </label>

                  <input
                    type="datetime-local"
                    name="paymentDate"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Payment Method
                    <span>*</span>
                  </label>

                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentChange}
                    required
                  >
                    <option value="">
                      Select method
                    </option>
                    <option value="CASH">
                      Cash
                    </option>
                    <option value="UPI">
                      UPI
                    </option>
                    <option value="CARD">
                      Card
                    </option>
                    <option value="NET_BANKING">
                      Net Banking
                    </option>
                    <option value="INSURANCE">
                      Insurance
                    </option>
                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Status
                    <span>*</span>
                  </label>

                  <select
                    name="status"
                    value={paymentForm.status}
                    onChange={handlePaymentChange}
                    required
                  >
                    <option value="SUCCESS">
                      Success
                    </option>
                    <option value="COMPLETED">
                      Completed
                    </option>
                    <option value="PENDING">
                      Pending
                    </option>
                    <option value="FAILED">
                      Failed
                    </option>
                    <option value="CANCELLED">
                      Cancelled
                    </option>
                  </select>
                </div>

                <div className="form-group full">
                  <label>
                    Transaction Reference
                  </label>

                  <input
                    type="text"
                    name="transactionReference"
                    maxLength="255"
                    placeholder="e.g. UPI123456789"
                    value={
                      paymentForm.transactionReference
                    }
                    onChange={handlePaymentChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setPaymentModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingPaymentId
                      ? 'Update Payment'
                      : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModal && selectedItem && (
        <div
          className="modal-overlay"
          onMouseDown={() =>
            setViewModal(false)
          }
        >
          <div
            className="modal-card view-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  {viewType === 'bill'
                    ? 'BILL DETAILS'
                    : 'PAYMENT DETAILS'}
                </span>

                <h2>
                  {viewType === 'bill'
                    ? `BILL-${String(
                        selectedItem.id
                      ).padStart(4, '0')}`
                    : `PAY-${String(
                        selectedItem.id
                      ).padStart(4, '0')}`}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setViewModal(false)
                }
              >
                ×
              </button>
            </div>

            {viewType === 'bill' ? (
              <div className="details-grid">
                <div className="detail-item">
                  <span>Patient</span>
                  <strong>
                    {getPatientName(
                      findAppointment(
                        getAppointmentId(
                          selectedItem
                        )
                      )
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Doctor</span>
                  <strong>
                    {getDoctorName(
                      findAppointment(
                        getAppointmentId(
                          selectedItem
                        )
                      )
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Billing Date</span>
                  <strong>
                    {formatDate(
                      selectedItem.billingDate
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Payment Method</span>
                  <strong>
                    {selectedItem.paymentMethod ||
                      '—'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Total Amount</span>
                  <strong>
                    {formatCurrency(
                      selectedItem.totalAmount
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Paid Amount</span>
                  <strong className="paid-text">
                    {formatCurrency(
                      selectedItem.paidAmount
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Balance</span>
                  <strong className="balance-text">
                    {formatCurrency(
                      Math.max(
                        Number(
                          selectedItem.totalAmount ||
                            0
                        ) -
                          Number(
                            selectedItem.paidAmount ||
                              0
                          ),
                        0
                      )
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Status</span>
                  <strong>
                    {getBillStatus(selectedItem)}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-item">
                  <span>Bill</span>
                  <strong>
                    BILL-
                    {String(
                      getBillId(selectedItem)
                    ).padStart(4, '0')}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Patient</span>
                  <strong>
                    {getPatientName(
                      findAppointment(
                        getAppointmentId(
                          findBill(
                            getBillId(
                              selectedItem
                            )
                          )
                        )
                      )
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Amount</span>
                  <strong>
                    {formatCurrency(
                      selectedItem.amount
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Payment Date</span>
                  <strong>
                    {formatDateTime(
                      selectedItem.paymentDate
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Payment Method</span>
                  <strong>
                    {selectedItem.paymentMethod ||
                      '—'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Status</span>
                  <strong>
                    {getPaymentStatus(
                      selectedItem
                    )}
                  </strong>
                </div>

                <div className="detail-item full-detail">
                  <span>
                    Transaction Reference
                  </span>
                  <strong>
                    {selectedItem.transactionReference ||
                      '—'}
                  </strong>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() =>
                  setViewModal(false)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing