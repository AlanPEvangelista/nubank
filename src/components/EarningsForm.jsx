import React, { useMemo, useState, useEffect } from 'react'
import { useDatabase } from '../db/DatabaseContext.jsx'
import { toast } from 'react-toastify'

export default function EarningsForm({ onAppSelect }) {
  const { ready, addEarning, updateEarning, deleteEarning, listApplications, listEarningsByApplication } = useDatabase()
  const apps = ready ? listApplications() : []
  const [form, setForm] = useState({ applicationId: '', date: '', gross: '', net: '' })
  const [selectedApp, setSelectedApp] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [earnings, setEarnings] = useState([])

  useEffect(() => {
    if (!ready || !selectedApp) {
      setEarnings([])
      return
    }
    listEarningsByApplication(selectedApp)
      .then(data => setEarnings(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Erro ao buscar lançamentos:", err)
        toast.error("Erro ao carregar lançamentos")
        setEarnings([])
      })
  }, [selectedApp, ready, listEarningsByApplication])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    if (!form.applicationId || !form.date || !form.gross || !form.net) {
      toast.warn('Preencha Aplicação, Data, Valor bruto e Valor líquido')
      return
    }
    try {
      if (editingId) {
        await updateEarning({ id: editingId, ...form })
        toast.success('Lançamento atualizado')
      } else {
        await addEarning(form)
        toast.success('Lançamento realizado')
      }
      setSelectedApp(form.applicationId)
      setForm({ applicationId: form.applicationId, date: '', gross: '', net: '' })
      setEditingId(null)
    } catch (err) {
      toast.error(err?.message || 'Erro ao salvar lançamento')
    }
  }

  const startEdit = (e) => {
    setForm({
      applicationId: String(e.application_id),
      date: e.date,
      gross: String(e.gross),
      net: String(e.net),
    })
    setSelectedApp(String(e.application_id))
    setEditingId(e.id)
  }

  const cancelEdit = () => {
    setForm({ applicationId: selectedApp || '', date: '', gross: '', net: '' })
    setEditingId(null)
  }

  const removeEarning = async (id) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return
      await deleteEarning(id)
      toast.success('Lançamento excluído')
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err?.message || 'Erro ao excluir lançamento')
    }
  }

  useEffect(() => {
    if (selectedApp && !apps.some(a => String(a.id) === String(selectedApp))) {
      setSelectedApp('')
      if (editingId) cancelEdit()
    }
  }, [apps, selectedApp])

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="row-3">
          <div>
            <label>Aplicação</label>
            <select className="select" disabled={!ready} value={form.applicationId} onChange={e => {
              const val = e.target.value
              setForm({ ...form, applicationId: val })
              if (val) setSelectedApp(val)
              if (onAppSelect) onAppSelect(val)
            }}>
              <option value="">Selecione...</option>
              {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label>Data</label>
            <input className="input" disabled={!ready} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label>Valor bruto</label>
            <input className="input" disabled={!ready} type="number" step="0.01" value={form.gross} onChange={e => setForm({ ...form, gross: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Valor líquido</label>
            <input className="input" disabled={!ready} type="number" step="0.01" value={form.net} onChange={e => setForm({ ...form, net: e.target.value })} />
          </div>
          <div style={{ alignSelf: 'end', display: 'flex', gap: 6 }}>
            <button className="btn btn-sm" disabled={!ready} type="submit">{editingId ? 'Salvar alterações' : 'Lançar'}</button>
            {editingId && (
              <button className="btn btn-secondary btn-sm" type="button" onClick={cancelEdit}>Cancelar edição</button>
            )}
          </div>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <div className="section-title" style={{ textAlign: 'center' }}>Lançamentos da Aplicação</div>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Bruto</th>
              <th>Líquido</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>R$ {Number(e.gross).toFixed(2)}</td>
                <td>R$ {Number(e.net).toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm" type="button" onClick={() => startEdit(e)} style={{ marginRight: 6 }}>Editar</button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => removeEarning(e.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {earnings.length === 0 && (
              <tr><td colSpan={3} style={{ opacity: 0.7 }}>Nenhum lançamento</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
