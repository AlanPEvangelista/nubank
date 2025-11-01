import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function EarningsForm() {
  const { ready, addEarning, listApplications, listEarningsByApplication, fetchEarningsByApplication } = useDatabase()
  const apps = ready ? listApplications() : []
  const [form, setForm] = useState({ applicationId: '', date: '', gross: '', net: '' })
  const [selectedApp, setSelectedApp] = useState('')
  const [errors, setErrors] = useState({ applicationId: false, date: false, gross: false, net: false })

  useEffect(() => {
    if (!ready || !selectedApp) return
    fetchEarningsByApplication(selectedApp)
  }, [selectedApp, ready])

  const earnings = useMemo(() => {
    if (!ready || !selectedApp) return []
    return listEarningsByApplication(selectedApp)
  }, [selectedApp, ready, listEarningsByApplication])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    const missing = []
    const nextErrors = { applicationId: false, date: false, gross: false, net: false }
    if (!form.applicationId) { missing.push('Aplicação'); nextErrors.applicationId = true }
    if (!form.date) { missing.push('Data'); nextErrors.date = true }
    if (!form.gross) { missing.push('Rendimento bruto'); nextErrors.gross = true }
    if (!form.net) { missing.push('Rendimento líquido'); nextErrors.net = true }
    setErrors(nextErrors)
    if (missing.length) { toast.error(`Preencha os campos obrigatórios: ${missing.join(', ')}`); return }
    await addEarning(form)
    toast.success('Rendimento lançado com sucesso')
    setSelectedApp(form.applicationId)
    setForm({ applicationId: form.applicationId, date: '', gross: '', net: '' })
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="row-3">
          <div>
            <label>Aplicação</label>
            <select className={`select${errors.applicationId ? ' select-error' : ''}`} disabled={!ready} value={form.applicationId} onChange={e => { setForm({ ...form, applicationId: e.target.value }); if (e.target.value) setErrors(prev => ({ ...prev, applicationId: false })) }}>
              <option value="">Selecione...</option>
              {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label>Data</label>
            <input className={`input${errors.date ? ' input-error' : ''}`} disabled={!ready} type="date" value={form.date} onChange={e => { setForm({ ...form, date: e.target.value }); if (e.target.value) setErrors(prev => ({ ...prev, date: false })) }} />
          </div>
          <div>
            <label>Rendimento bruto</label>
            <input className={`input${errors.gross ? ' input-error' : ''}`} disabled={!ready} type="number" step="0.01" value={form.gross} onChange={e => { setForm({ ...form, gross: e.target.value }); if (e.target.value) setErrors(prev => ({ ...prev, gross: false })) }} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Rendimento líquido</label>
            <input className={`input${errors.net ? ' input-error' : ''}`} disabled={!ready} type="number" step="0.01" value={form.net} onChange={e => { setForm({ ...form, net: e.target.value }); if (e.target.value) setErrors(prev => ({ ...prev, net: false })) }} />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="btn" disabled={!ready} type="submit">Lançar</button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <div className="section-title">Rendimentos da aplicação selecionada</div>
        <div style={{ marginBottom: 8 }}>
          <select className="select" disabled={!ready} value={selectedApp} onChange={e => setSelectedApp(e.target.value)}>
            <option value="">Selecione uma aplicação...</option>
            {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Bruto</th>
              <th>Líquido</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>R$ {Number(e.gross).toFixed(2)}</td>
                <td>R$ {Number(e.net).toFixed(2)}</td>
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