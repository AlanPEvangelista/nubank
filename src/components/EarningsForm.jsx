import { useState, useEffect, useMemo } from 'react'
import { useDatabase } from '../db/DatabaseContext.jsx'
import { toast } from 'react-toastify'
import FullScreenModal from './FullScreenModal.jsx'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EarningsForm({ onAppSelect }) {
  const { ready, addEarning, updateEarning, deleteEarning, listApplications, listEarningsByApplication } = useDatabase()
  const apps = ready ? listApplications() : []
  const [form, setForm] = useState({ applicationId: '', date: '', gross: '', net: '' })
  const [selectedApp, setSelectedApp] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showAllModal, setShowAllModal] = useState(false)

  const [earnings, setEarnings] = useState([])
  
  // Ordenar por data (mais recente primeiro)
  const sortedEarnings = useMemo(() => {
    return [...earnings].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [earnings])

  const displayedEarnings = sortedEarnings.slice(0, 6)

  const [grossDisplay, setGrossDisplay] = useState('')
  const [netDisplay, setNetDisplay] = useState('')
  
  const formatDateWithDay = (dateStr) => {
    try {
      if (!dateStr) return ''
      // Adiciona T12:00:00 para evitar problemas de fuso horário com datas YYYY-MM-DD
      const date = parseISO(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr)
      return format(date, "dd/MM (eee)", { locale: ptBR })
    } catch (e) {
      return dateStr
    }
  }

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const onMoneyChange = (key, raw) => {
    const digits = String(raw).replace(/\D/g, '')
    const num = digits ? parseInt(digits, 10) / 100 : ''
    setForm({ ...form, [key]: digits ? String(num) : '' })
    if (key === 'gross') setGrossDisplay(digits ? formatBRL(num) : '')
    if (key === 'net') setNetDisplay(digits ? formatBRL(num) : '')
  }

  useEffect(() => {
    if (!ready || !selectedApp) {
      setEarnings([])
      return
    }
    listEarningsByApplication(selectedApp)
      .then(data => setEarnings(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Erro ao buscar saldos:", err)
        toast.error("Erro ao carregar saldos")
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
        toast.success('Saldo atualizado')
      } else {
        await addEarning(form)
        toast.success('Saldo registrado')
      }
      setSelectedApp(form.applicationId)
      setForm({ applicationId: form.applicationId, date: '', gross: '', net: '' })
      setGrossDisplay('')
      setNetDisplay('')
      setEditingId(null)
    } catch (err) {
      toast.error(err?.message || 'Erro ao salvar saldo')
    }
  }

  const startEdit = (e) => {
    setForm({
      applicationId: String(e.application_id),
      date: e.date,
      gross: String(e.gross),
      net: String(e.net),
    })
    setGrossDisplay(formatBRL(Number(e.gross)))
    setNetDisplay(formatBRL(Number(e.net)))
    setSelectedApp(String(e.application_id))
    setEditingId(e.id)
    setShowAllModal(false)
  }

  const cancelEdit = () => {
    setForm({ applicationId: selectedApp || '', date: '', gross: '', net: '' })
    setGrossDisplay('')
    setNetDisplay('')
    setEditingId(null)
  }

  const removeEarning = async (id) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir este saldo?')) return
      await deleteEarning(id)
      toast.success('Saldo excluído')
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err?.message || 'Erro ao excluir saldo')
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
            <label>Aplicação {(!form.applicationId) && (<span className="attention-pulse" />)}</label>
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
            <input className="input" disabled={!ready} type="text" value={grossDisplay} onChange={e => onMoneyChange('gross', e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div>
            <label>Valor líquido</label>
            <input className="input" disabled={!ready} type="text" value={netDisplay} onChange={e => onMoneyChange('net', e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div style={{ alignSelf: 'end', display: 'flex', gap: 6 }}>
            <button className="btn btn-sm" disabled={!ready} type="submit">{editingId ? 'Salvar alterações' : 'Registrar'}</button>
            {editingId && (
              <button className="btn btn-secondary btn-sm" type="button" onClick={cancelEdit}>Cancelar edição</button>
            )}
          </div>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div className="section-title">Saldos da Aplicação (Últimos 5)</div>
           {sortedEarnings.length > 5 && (
             <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => setShowAllModal(true)}>Ver todos</button>
           )}
        </div>
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
            {displayedEarnings.map(e => (
              <tr key={e.id}>
                <td>{formatDateWithDay(e.date)}</td>
                <td>R$ {Number(e.gross).toFixed(2)}</td>
                <td>R$ {Number(e.net).toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm" type="button" onClick={() => startEdit(e)} style={{ marginRight: 6 }}>Editar</button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => removeEarning(e.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {earnings.length === 0 && (
              <tr><td colSpan={4} style={{ opacity: 0.7 }}>Nenhum saldo registrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FullScreenModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        title={`Histórico Completo - ${apps.find(a => String(a.id) === selectedApp)?.name || ''}`}
      >
        <div style={{ minWidth: '600px', width: '100%', maxHeight: '80vh' }}>
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
              {sortedEarnings.map(e => (
                <tr key={e.id}>
                  <td>{formatDateWithDay(e.date)}</td>
                  <td>R$ {Number(e.gross).toFixed(2)}</td>
                  <td>R$ {Number(e.net).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm" type="button" onClick={() => startEdit(e)} style={{ marginRight: 6 }}>Editar</button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => removeEarning(e.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FullScreenModal>
    </div>
  )
}
