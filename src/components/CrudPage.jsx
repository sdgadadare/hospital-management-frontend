import { useEffect, useMemo, useState } from 'react'
import { get, post, put, remove } from '../api'
import CrudModal from './CrudModal'
import './CrudPage.css'

function CrudPage({ title, subtitle, endpoint, searchPlaceholder, fields, initialForm, searchFn, columns, emptyText, summary, transformSubmit }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    try { setLoading(true); setError(''); const data = await get(endpoint); setItems(Array.isArray(data) ? data : []) }
    catch (e) { setError(e.message || `Unable to load ${title.toLowerCase()}.`) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [endpoint])

  const filtered = useMemo(() => items.filter((item) => searchFn(item, search)), [items, search, searchFn])
  const openAdd = () => { setEditing(null); setModalOpen(true); setNotice('') }
  const openEdit = (item) => { setEditing(item); setModalOpen(true); setNotice('') }
  const handleSave = async (form) => {
    try {
      setSaving(true); setNotice('')
      const payload = transformSubmit ? transformSubmit(form, editing) : form
      const saved = editing ? await put(`${endpoint}/${editing.id}`, payload) : await post(endpoint, payload)
      if (editing) setItems((current) => current.map((item) => item.id === editing.id ? (saved || { ...item, ...payload }) : item))
      else setItems((current) => [...current, saved || { ...payload, id: `temp-${Date.now()}` }])
      setModalOpen(false); setNotice(editing ? 'Updated successfully.' : 'Created successfully.')
    } catch (e) { setNotice(e.message || 'Unable to save changes.') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${title.slice(0,-1).toLowerCase() || 'record'}?`)) return
    try { await remove(`${endpoint}/${id}`); setItems((current) => current.filter((item) => item.id !== id)); setNotice('Deleted successfully.') }
    catch (e) { setNotice(e.message || 'Unable to delete record.') }
  }

  const values = editing ? fields.reduce((acc, field) => { acc[field.name] = editing[field.name] ?? ''; return acc }, {}) : initialForm

  return <div className="crud-page">
    <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><button className="primary-btn" onClick={openAdd}><span>+</span> Add {title.replace(/s$/, '')}</button></div>
    {summary && <div className="crud-summary">{summary(items).map((card) => <div className="summary-card" key={card.label}><div className={`summary-icon ${card.tone || 'blue'}`}>{card.icon || '•'}</div><div><span>{card.label}</span><strong>{card.value}</strong></div></div>)}</div>}
    <div className="crud-card">
      <div className="crud-toolbar"><div><h2>{title} Directory</h2><p>{filtered.length} records found</p></div><div className="crud-search"><span>⌕</span><input placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
      {notice && <div className={`crud-notice ${notice.includes('success') ? 'success' : 'error'}`}>{notice}</div>}
      {error && <div className="crud-notice error">{error}</div>}
      {loading ? <div className="crud-loading">Loading...</div> : <div className="crud-table-wrap"><table className="crud-table"><thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}>{columns.map((c) => <td key={c.label}>{c.render(item)}</td>)}<td><div className="crud-actions"><button className="view-btn" onClick={() => openEdit(item)}>Edit</button><button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button></div></td></tr>)}{!filtered.length && <tr><td colSpan={columns.length + 1} className="crud-empty">{emptyText || 'No records found.'}</td></tr>}</tbody></table></div>}
    </div>
    <CrudModal open={modalOpen} title={`${editing ? 'Edit' : 'Add'} ${title.replace(/s$/, '')}`} fields={fields} initialValues={values} onClose={() => setModalOpen(false)} onSubmit={handleSave} saving={saving} />
  </div>
}
export default CrudPage
