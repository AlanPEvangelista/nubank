import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const ok = localStorage.getItem('auth_pin_ok')
    const t = localStorage.getItem('auth_token')
    if (ok === 'true') setIsAuthenticated(true)
    if (t) setToken(t)
  }, [])

  const expectedPin = (import.meta.env.VITE_APP_PIN ?? '1234').toString()

  const login = async (pin) => {
    const apiBase = import.meta.env.VITE_API_URL
    // If backend available, validate via API and store JWT
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin })
        })
        const json = await res.json()
        if (!res.ok || !json.ok) return { ok: false, error: json.error || 'Falha no login' }
        const t = json.data?.token || json.token || json.data
        if (t) {
          localStorage.setItem('auth_token', t)
          setToken(t)
        }
        localStorage.setItem('auth_pin_ok', 'true')
        setIsAuthenticated(true)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e.message }
      }
    }
    // Fallback: validação local por PIN
    if (String(pin) === expectedPin) {
      localStorage.setItem('auth_pin_ok', 'true')
      setIsAuthenticated(true)
      return { ok: true }
    }
    return { ok: false, error: 'PIN inválido' }
  }

  const logout = () => {
    localStorage.removeItem('auth_pin_ok')
    localStorage.removeItem('auth_token')
    setToken(null)
    setIsAuthenticated(false)
  }

  const value = { isAuthenticated, login, logout, token }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}