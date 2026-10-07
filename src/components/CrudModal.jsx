import { useEffect, useState } from 'react'
import { get } from '../api'
import './CrudModal.css'

function CrudModal({ open, title, fields, initialValues, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initialValues || {})
  const [options, setOptions] = useState({})
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    setForm(initialValues || {})
    setLoadError('')
    if (!open) return
    const optionFields = fields.filter((f) => f.optionsEndpoint)
    if (!optionFields.length) return
    Promise.all(optionFields.map(async (field) => {
      try {
        const data = await get(field.optionsEndpoint)
        return [field.name, Array.isArray(data) ? data : []]
      } catch (error) {
        setLoadError(error.message)
        return [field.name, []]
      }
    })).then((pairs) => setOptions(Object.fromEntries(pairs)))
  }, [open, initialValues, fields])

  if (!open) return null

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="crud-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <div><h2>{title}</h2><p>Enter the required information below.</p></div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        {loadError && <div className="modal-error">{loadError}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}>
          <div className="modal-form-grid">
            {fields.map((field) => (
              <div className={`modal-field ${field.fullWidth ? 'full' : ''}`} key={field.name}>
                <label>{field.label}{field.required ? ' *' : ''}</label>
                {field.type === 'textarea' ? (
                  <textarea rows="4" value={form[field.name] ?? ''} onChange={(e) => update(field.name, e.target.value)} placeholder={field.placeholder || ''} required={field.required} />
                ) : field.type === 'select' ? (
                  <select value={form[field.name] ?? ''} onChange={(e) => update(field.name, e.target.value)} required={field.required}>
                    <option value="">Select {field.label}</option>
                    {(field.options || options[field.name] || []).map((option) => {
                      const value = typeof option === 'object' ? option.value : option
                      const label = typeof option === 'object' ? option.label : option
                      return <option key={String(value)} value={value}>{label}</option>
                    })}
                  </select>
                ) : (
                  <input type={field.type || 'text'} value={form[field.name] ?? ''} onChange={(e) => update(field.name, e.target.value)} placeholder={field.placeholder || ''} required={field.required} min={field.min} />
                )}
              </div>
            ))}
          </div>
          <div className="crud-modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default CrudModal
