import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLogin) {
      await login(form.email, form.password)
    } else {
      const success = await register(form.name, form.email, form.password)
      if (success) setIsLogin(true)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(180deg, var(--gray-100), var(--white))'
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', margin: 24 }}>
        <div className="card-header">
          <span className="card-title">{isLogin ? 'Login Nubank App' : 'Criar Conta'}</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Nome</label>
                <input 
                  className="input" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
              <input 
                className="input" 
                type="email"
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                required 
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Senha</label>
              <input 
                className="input" 
                type="password"
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                required 
              />
            </div>
            <button className="btn" type="submit">
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin) }} style={{ color: 'var(--blue-600)' }}>
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
