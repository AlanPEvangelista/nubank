import React, { useState } from 'react'
import { addDays, subDays } from 'date-fns'

export default function FilterBar({ value, onChange }) {
  const [mode, setMode] = useState('30') // 7, 15, 30, custom
  const [custom, setCustom] = useState({ from: '', to: '' })

  const applyPreset = (days) => {
    const to = new Date()
    const from = subDays(to, days)
    onChange({ from, to })
    setMode(String(days))
  }

  const applyCustom = () => {
    if (!custom.from || !custom.to) return
    onChange({ from: new Date(custom.from), to: new Date(custom.to) })
    setMode('custom')
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
            <input className="input" type="date" value={custom.from} onChange={e => setCustom({ ...custom, from: e.target.value })} />
          </div>
          <div>
            <label>Fim</label>
            <input className="input" type="date" value={custom.to} onChange={e => setCustom({ ...custom, to: e.target.value })} />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="btn btn-secondary" onClick={applyCustom}>Aplicar período</button>
          </div>
        </div>
      </div>
    </div>
  )
}