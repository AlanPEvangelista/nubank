import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // We assume the proxy /api or just root path. The server is on 3001, proxy in vite.
      const res = await fetch('/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.ok) {
          setUser(data.data.user)
          setMustChangePassword(!!data.data.user?.mustChangePassword)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.ok) {
        setUser(data.data.user)
        setMustChangePassword(!!data.data.user?.mustChangePassword)
        return true
      } else {
        toast.error(data.error || 'Erro ao entrar')
        return false
      }
    } catch (err) {
      toast.error('Erro de conexão')
      return false
    }
  }

  const register = async (name, email, password) => {
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Cadastro realizado! Faça login.')
        return true
      } else {
        toast.error(data.error || 'Erro ao cadastrar')
        return false
      }
    } catch (err) {
      toast.error('Erro de conexão')
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' })
      setUser(null)
      setMustChangePassword(false)
    } catch (err) {
      console.error(err)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Senha alterada')
        setMustChangePassword(false)
        return true
      } else {
        toast.error(data.error || 'Erro ao alterar senha')
        return false
      }
    } catch (err) {
      toast.error('Erro de conexão')
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, mustChangePassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
