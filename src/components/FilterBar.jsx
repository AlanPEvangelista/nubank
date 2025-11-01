import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { addDays, subDays } from 'date-fns'

export default function FilterBar({ value, onChange }) {
  const [mode, setMode] = useState('30') // 7, 15, 30, custom
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [errors, setErrors] = useState({ from: false, to: false })

  const applyPreset = (days) => {
    const to = new Date()
    const from = subDays(to, days)
    onChange({ from, to })
    setMode(String(days))
    toast.success('Período aplicado')
  }

  const applyCustom = () => {
    const nextErrors = { from: false, to: false }
    if (!custom.from) nextErrors.from = true
    if (!custom.to) nextErrors.to = true
    setErrors(nextErrors)
    if (nextErrors.from || nextErrors.to) {
      toast.error('Informe as datas de início e fim para aplicar o período.')
      return
    }
    onChange({ from: new Date(custom.from), to: new Date(custom.to) })
    setMode('custom')
    toast.success('Período aplicado')
  }

  return (
    <div className="row">
      <div>
        <div className="row-3">
          <button className="btn" onClick={() => applyPreset(7)}>Última semana</button>
          <button className="btn" onClick={() => applyPreset(15)}>Últimos 15 dias</button>
          <button className="btn" onClick={() => applyPreset(30)}>Último mês</button>
        </div>
      </div>
      <div>
        <div className="row-3">
          <div>
            <label>Início</label>
            <input className={`input${errors.from ? ' input-error' : ''}`} type="date" value={custom.from} onChange={e => { setCustom({ ...custom, from: e.target.value }); if (e.target.value) setErrors(prev => ({ ...prev, from: false })) }} />
          </div>
          <div>
            <label>Fim</label>
            <input className={`input${errors.to ? ' input-error' : ''}`} type="date" value={custom.to} onChange={e => { setCustom({ ...custom, to: e.target.value }); if (e.target.value) setErrors(prev => ({ ...prev, to: false })) }} />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="btn btn-secondary" onClick={applyCustom}>Aplicar período</button>
          </div>
        </div>
      </div>
    </div>
  )
}