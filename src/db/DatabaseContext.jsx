import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

const DbCtx = createContext(null)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function DatabaseProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [apps, setApps] = useState([])
  const [earningsByApp, setEarningsByApp] = useState({})
  const [statsByApp, setStatsByApp] = useState([])
  const [statsTotalOverTime, setStatsTotalOverTime] = useState([])
  const { token } = useAuth()

  const apiGet = async (path) => {
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const r = await fetch(`${BASE_URL}${path}`, { headers })
    const j = await r.json()
    if (!j.ok) throw new Error(j.error || 'Erro na API')
    return j.data
  }

  const apiPost = async (path, body) => {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const r = await fetch(`${BASE_URL}${path}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
    const j = await r.json()
    if (!j.ok) throw new Error(j.error || 'Erro na API')
    return j.data
  }

  useEffect(() => {
    (async () => {
      try {
        await apiGet('/health')
        setReady(true)
        const a = await apiGet('/applications')
        setApps(a)
      } catch (e) {
        console.error('API indisponível', e)
      }
    })()
  }, [token])

  const addApplication = async ({ name, startDate, initialValue, dueDate }) => {
    const created = await apiPost('/applications', { name, startDate, initialValue, dueDate })
    const a = await apiGet('/applications')
    setApps(a)
    return created
  }

  const listApplications = () => apps

  const addEarning = async ({ applicationId, date, gross, net }) => {
    await apiPost('/earnings', { applicationId, date, gross, net })
    const rows = await apiGet(`/earnings?applicationId=${applicationId}`)
    setEarningsByApp(prev => ({ ...prev, [applicationId]: rows }))
  }

  const fetchEarningsByApplication = async (applicationId, from, to) => {
    if (!applicationId) return []
    const params = new URLSearchParams({ applicationId })
    if (from) params.set('from', new Date(from).toISOString().slice(0, 10))
    if (to) params.set('to', new Date(to).toISOString().slice(0, 10))
    const rows = await apiGet(`/earnings?${params.toString()}`)
    setEarningsByApp(prev => ({ ...prev, [applicationId]: rows }))
    return rows
  }

  const listEarningsByApplication = (applicationId) => {
    return earningsByApp[applicationId] || []
  }

  const getGainsByApplication = async (from, to) => {
    const params = new URLSearchParams()
    if (from) params.set('from', new Date(from).toISOString().slice(0, 10))
    if (to) params.set('to', new Date(to).toISOString().slice(0, 10))
    const rows = await apiGet(`/stats/gains-by-application?${params.toString()}`)
    setStatsByApp(rows)
    return rows
  }

  const getTotalGainsOverTime = async (from, to) => {
    const params = new URLSearchParams()
    if (from) params.set('from', new Date(from).toISOString().slice(0, 10))
    if (to) params.set('to', new Date(to).toISOString().slice(0, 10))
    const rows = await apiGet(`/stats/total-over-time?${params.toString()}`)
    setStatsTotalOverTime(rows)
    return rows
  }

  const value = {
    ready,
    listApplications,
    addApplication,
    addEarning,
    fetchEarningsByApplication,
    listEarningsByApplication,
    getGainsByApplication,
    getTotalGainsOverTime,
    statsByApp,
    statsTotalOverTime,
  }

  return <DbCtx.Provider value={value}>{children}</DbCtx.Provider>
}

export function useDatabase() {
  return useContext(DbCtx)
}