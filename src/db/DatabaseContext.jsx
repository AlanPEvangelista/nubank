import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

const DbCtx = createContext(null)

// Função auxiliar para fazer chamadas à API
const callApi = async (path, options = {}) => {
  const response = await fetch(path, options)
  if (response.status === 401 || response.status === 403) {
    // Auth error handled by AuthContext mostly, but we can throw
    throw new Error('Acesso negado')
  }
  if (!response.ok) throw new Error(`Erro API: ${response.statusText}`)
  const json = await response.json()
  if (!json.ok) throw new Error(json.error || 'Erro desconhecido na API')
  return json.data
}

export function DatabaseProvider({ children }) {
  const [ready] = useState(true) 
  const [refreshKey, setRefreshKey] = useState(0)
  const [adminUserId, setAdminUserId] = useState('')
  
  const triggerRefresh = () => setRefreshKey(prev => prev + 1)

  const api = useMemo(() => {
    // Helper to append userId query
    const withUser = (url) => {
      const separator = url.includes('?') ? '&' : '?'
      return adminUserId ? `${url}${separator}userId=${adminUserId}` : url
    }

    // Funções de Leitura (GET)
    const listApplications = async () => callApi(withUser('/applications'))
    
    const getGainsByApplication = async (from, to) => {
      // Converte datas para string ISO compatível com o backend
      return callApi(withUser(`/stats/gains-by-application?from=${from.toISOString()}&to=${to.toISOString()}`))
    }
    
    const getTotalGainsOverTime = async (from, to) => {
      return callApi(withUser(`/stats/total-over-time?from=${from.toISOString()}&to=${to.toISOString()}`))
    }

    // Funções de Leitura adicionais
    const listEarningsByApplication = async (applicationId, from, to) => {
      const params = new URLSearchParams()
      params.set('applicationId', String(applicationId))
      if (from instanceof Date && to instanceof Date) {
        params.set('from', from.toISOString())
        params.set('to', to.toISOString())
      }
      if (adminUserId) params.set('userId', adminUserId)
      return callApi(`/earnings?${params.toString()}`)
    }

    // Funções de Escrita (POST)
    const addApplication = async ({ name, startDate, initialValue, dueDate }) => {
      await callApi('/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startDate, initialValue, dueDate }),
      })
      triggerRefresh()
    }

    const updateApplication = async ({ id, name, startDate, initialValue, dueDate }) => {
      await callApi(`/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startDate, initialValue, dueDate }),
      })
      triggerRefresh()
    }

    const deleteApplication = async (id) => {
      await callApi(`/applications/${id}`, { method: 'DELETE' })
      triggerRefresh()
    }
    
    const addEarning = async ({ applicationId, date, gross, net }) => {
      await callApi('/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, date, gross, net }),
      })
      triggerRefresh()
    }

    const updateEarning = async ({ id, applicationId, date, gross, net }) => {
      await callApi(`/earnings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, date, gross, net }),
      })
      triggerRefresh()
    }

    const deleteEarning = async (id) => {
      await callApi(`/earnings/${id}`, { method: 'DELETE' })
      triggerRefresh()
    }

    return {
      ready,
      refreshKey,
      listApplications,
      listEarningsByApplication,
      addApplication,
      updateApplication,
      deleteApplication,
      addEarning,
      updateEarning,
      deleteEarning,
      getGainsByApplication,
      getTotalGainsOverTime,
      setAdminUserId // Expose setter
    }
  }, [ready, refreshKey, adminUserId])

  return <DbCtx.Provider value={api}>{children}</DbCtx.Provider>
}

export function useDatabase() {
  const api = useContext(DbCtx)
  
  // Desconstrói as funções assíncronas para uso interno
  const { listApplications: _listApplications, getGainsByApplication: _getGainsByApplication, getTotalGainsOverTime: _getTotalGainsOverTime, ...rest } = api

  // Adiciona estados para as listas que eram síncronas (o AppShell precisa delas)
  const [apps, setApps] = useState([])
  const [gainsByApp, setGainsByApp] = useState([])
  const [totalGains, setTotalGains] = useState([])
  const [loading, setLoading] = useState(false)

  // useEffect para buscar os dados sempre que a aplicação precisar de refresh
  useEffect(() => {
    if (api.ready) {
      const fetchData = async () => {
        setLoading(true)
        try {
          // 1. Define o range de datas padrão para busca (últimos 30 dias)
          const defaultTo = new Date();
          const defaultFrom = new Date(defaultTo.getTime() - 30 * 24 * 60 * 60 * 1000);
            
          // 2. Busca de TODOS os dados de forma concorrente
          const [fetchedApps, fetchedGainsByApp, fetchedTotalGains] = await Promise.all([
            _listApplications(),
            _getGainsByApplication(defaultFrom, defaultTo),
            _getTotalGainsOverTime(defaultFrom, defaultTo),
          ]);
          
          // 3. Atualização dos estados
          setApps(fetchedApps)
          setGainsByApp(fetchedGainsByApp)
          setTotalGains(fetchedTotalGains)
          
        } catch (e) {
          console.error("Erro ao buscar dados da API:", e);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [api.ready, api.refreshKey, _listApplications, _getGainsByApplication, _getTotalGainsOverTime]) // Dependencies updated

  // O retorno do hook precisa ser ajustado para ser compatível com AppShell
  return {
    ready: api.ready,
    loading: loading,
    // Retorna os estados preenchidos, atendendo a chamada síncrona do AppShell
    listApplications: () => apps,
    getGainsByApplication: (from, to) => gainsByApp, // Simplified for now, ignoring from/to in sync call as fetched above
    getTotalGainsOverTime: (from, to) => totalGains,
    ...rest 
  }
}
