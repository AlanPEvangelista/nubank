import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

const DbCtx = createContext(null)

// Função auxiliar para fazer chamadas à API
const callApi = async (path, options = {}) => {
  const response = await fetch(path, options)
  if (!response.ok) throw new Error(`Erro API: ${response.statusText}`)
  const json = await response.json()
  if (!json.ok) throw new Error(json.error || 'Erro desconhecido na API')
  return json.data // Retorna apenas o array de dados (Macbook, Carro, etc.)
}

export function DatabaseProvider({ children }) {
  const [ready] = useState(true) 
  const [refreshKey, setRefreshKey] = useState(0)
  
  const triggerRefresh = () => setRefreshKey(prev => prev + 1)

  const api = useMemo(() => {
    // Funções de Leitura (GET)
    const listApplications = async () => callApi('/applications')
    
    const getGainsByApplication = async (from, to) => {
      // Converte datas para string ISO compatível com o backend
      return callApi(`/stats/gains-by-application?from=${from.toISOString()}&to=${to.toISOString()}`)
    }
    
    const getTotalGainsOverTime = async (from, to) => {
      return callApi(`/stats/total-over-time?from=${from.toISOString()}&to=${to.toISOString()}`)
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
    
    const addEarning = async ({ applicationId, date, gross, net }) => {
      await callApi('/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, date, gross, net }),
      })
      triggerRefresh()
    }

    return {
      ready,
      refreshKey,
      listApplications,
      addApplication,
      addEarning,
      getGainsByApplication,
      getTotalGainsOverTime,
    }
  }, [ready, refreshKey])

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
  }, [api.ready, api.refreshKey])

  // O retorno do hook precisa ser ajustado para ser compatível com AppShell
  return {
    ready: api.ready,
    loading: loading,
    // Retorna os estados preenchidos, atendendo a chamada síncrona do AppShell
    listApplications: () => apps,
    getGainsByApplication: () => gainsByApp,
    getTotalGainsOverTime: () => totalGains,
    ...rest 
  }
}
