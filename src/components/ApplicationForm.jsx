import React, { useState } from 'react'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function ApplicationForm() {
  const { ready, addApplication, listApplications } = useDatabase()
  const [form, setForm] = useState({ name: '', startDate: '', initialValue: '', dueDate: '' })
  const apps = ready ? listApplications() : []

  const onSubmit = (e) => {
    e.preventDefault()
    if (!ready) return
    if (!form.name || !form.startDate || !form.initialValue || !form.dueDate) return
    addApplication(form)
    setForm({ name: '', startDate: '', initialValue: '', dueDate: '' })
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="row">
          <div>
            <label>Nome da aplicação</label>
            <input className="input" disabled={!ready} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: CDB Nubank" />
          </div>
          <div>
            <label>Data do início</label>
            <input className="input" disabled={!ready} type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Valor inicial</label>
            <input className="input" disabled={!ready} type="number" step="0.01" value={form.initialValue} onChange={e => setForm({ ...form, initialValue: e.target.value })} />
          </div>
          <div>
            <label>Vencimento</label>
            <input className="input" disabled={!ready} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" disabled={!ready} type="submit">Cadastrar aplicação</button>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <div className="section-title">Aplicações cadastradas</div>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Início</th>
              <th>Inicial</th>
              <th>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.start_date}</td>
                <td>R$ {Number(a.initial_value).toFixed(2)}</td>
                <td>{a.due_date}</td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr><td colSpan={4} style={{ opacity: 0.7 }}>Nenhuma aplicação cadastrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}