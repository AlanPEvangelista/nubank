import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function ApplicationForm() {
  const { ready, addApplication, updateApplication, deleteApplication, listApplications } = useDatabase()
  const [form, setForm] = useState({ name: '', startDate: '', initialValue: '', dueDate: '' })
  const [editingId, setEditingId] = useState(null)
  const apps = ready ? listApplications() : []

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    if (!form.name || !form.startDate || !form.initialValue) {
      toast.warn('Preencha Nome, Data de início e Valor inicial')
      return
    }
    try {
      if (editingId) {
        await updateApplication({ id: editingId, ...form })
        toast.success('Aplicação atualizada')
      } else {
        await addApplication(form)
        toast.success('Aplicação cadastrada')
      }
      setForm({ name: '', startDate: '', initialValue: '', dueDate: '' })
      setEditingId(null)
    } catch (err) {
      toast.error(err?.message || 'Erro ao salvar aplicação')
    }
  }

  const startEdit = (a) => {
    setForm({
      name: a.name,
      startDate: a.start_date,
      initialValue: String(a.initial_value),
      dueDate: a.due_date || ''
    })
    setEditingId(a.id)
  }

  const cancelEdit = () => {
    setForm({ name: '', startDate: '', initialValue: '', dueDate: '' })
    setEditingId(null)
  }

  const removeApp = async (id) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir esta aplicação?')) return
      await deleteApplication(id)
      toast.success('Aplicação excluída')
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err?.message || 'Erro ao excluir aplicação')
    }
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
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" disabled={!ready} type="submit">{editingId ? 'Salvar alterações' : 'Cadastrar aplicação'}</button>
          {editingId && (
            <button className="btn btn-secondary btn-sm" type="button" onClick={cancelEdit}>Cancelar edição</button>
          )}
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.start_date}</td>
                <td>R$ {Number(a.initial_value).toFixed(2)}</td>
                <td>{a.due_date}</td>
                <td>
                  <div className="actions-inline">
                    <button className="btn btn-sm" type="button" onClick={() => startEdit(a)}>Editar</button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => removeApp(a.id)}>Excluir</button>
                  </div>
                </td>
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
