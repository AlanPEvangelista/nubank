import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { toast } from 'react-toastify'

export default function Login() {
  const { login } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!pin) { setError(true); toast.error('Informe o PIN'); return }
    const res = await login(pin)
    if (res.ok) toast.success('Autenticado com sucesso')
    else toast.error(res.error || 'PIN inválido')
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <section className="card" style={{ padding: 16 }}>
        <div className="card-header">
          <span className="card-title">Login</span>
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div>
              <label>PIN de acesso</label>
              <input
                className={`input${error ? ' input-error' : ''}`}
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => { setPin(e.target.value); if (e.target.value) setError(false) }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" type="submit">Entrar</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              Dica: defina `VITE_APP_PIN` no build para personalizar.
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}