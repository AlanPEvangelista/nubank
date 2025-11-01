import React, { useEffect, useMemo, useState } from 'react'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function EarningsForm() {
  const { ready, addEarning, listApplications, listEarningsByApplication, fetchEarningsByApplication } = useDatabase()
  const apps = ready ? listApplications() : []
  const [form, setForm] = useState({ applicationId: '', date: '', gross: '', net: '' })
  const [selectedApp, setSelectedApp] = useState('')

  useEffect(() => {
    if (!ready || !selectedApp) return
    fetchEarningsByApplication(selectedApp)
  }, [selectedApp, ready])

  const earnings = useMemo(() => {
    if (!ready || !selectedApp) return []
    return listEarningsByApplication(selectedApp)
  }, [selectedApp, ready, listEarningsByApplication])

  const onSubmit = (e) => {
    e.preventDefault()
    if (!ready || !form.applicationId || !form.date || !form.gross || !form.net) return
    addEarning(form)
    setSelectedApp(form.applicationId)
    setForm({ applicationId: form.applicationId, date: '', gross: '', net: '' })
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="row-3">
          <div>
            <label>Aplicação</label>
            <select className="select" disabled={!ready} value={form.applicationId} onChange={e => setForm({ ...form, applicationId: e.target.value })}>
              <option value="">Selecione...</option>
              {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label>Data</label>
            <input className="input" disabled={!ready} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label>Rendimento bruto</label>
            <input className="input" disabled={!ready} type="number" step="0.01" value={form.gross} onChange={e => setForm({ ...form, gross: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Rendimento líquido</label>
            <input className="input" disabled={!ready} type="number" step="0.01" value={form.net} onChange={e => setForm({ ...form, net: e.target.value })} />
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