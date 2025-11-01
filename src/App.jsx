import React, { useEffect, useState } from 'react'
import { DatabaseProvider, useDatabase } from './db/DatabaseContext.jsx'
import { format, subDays } from 'date-fns'
import GainsByAppChart from './components/GainsByAppChart.jsx'
import TotalGainsChart from './components/TotalGainsChart.jsx'
import ApplicationForm from './components/ApplicationForm.jsx'
import EarningsForm from './components/EarningsForm.jsx'
import FilterBar from './components/FilterBar.jsx'

function AppShell() {
  const { ready, listApplications, getGainsByApplication, getTotalGainsOverTime, statsByApp, statsTotalOverTime } = useDatabase()
  const [range, setRange] = useState(() => {
    const to = new Date()
    const from = subDays(to, 30)
    return { from, to }
  })

  const apps = ready ? listApplications() : []

  useEffect(() => {
    if (!ready) return
    getGainsByApplication(range.from, range.to)
    getTotalGainsOverTime(range.from, range.to)
  }, [range, ready])

  const byApp = statsByApp
  const totalOverTime = statsTotalOverTime

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-content">
          <h1>Controle de Aplicações</h1>
          <p>Cadastre aplicações, lançamentos de rendimentos e visualize ganhos por período.</p>
          <div style={{ marginTop: 12 }}>
            <span className="badge">SQLite Local + Gráficos</span>
          </div>
          {!ready && (
            <div style={{ marginTop: 10, opacity: 0.9 }}>
              Inicializando base de dados...
            </div>
          )}
        </div>
        <div className="hero-images">
          <img src="https://images.unsplash.com/photo-1454165205744-3b78555e5572?q=80&w=800&auto=format&fit=crop" alt="Finanças 1" />
          <img src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=800&auto=format&fit=crop" alt="Finanças 2" />
          <img src="https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=800&auto=format&fit=crop" alt="Finanças 3" />
          <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop" alt="Finanças 4" />
        </div>
      </section>

      <div className="grid">
        <div className="card col-6">
          <div className="card-header">
            <span className="card-title">Cadastro de Aplicação</span>
          </div>
          <div className="card-body">
            <ApplicationForm />
          </div>
        </div>

        <div className="card col-6">
          <div className="card-header">
            <span className="card-title">Lançamento de Rendimentos</span>
          </div>
          <div className="card-body">
            <EarningsForm />
          </div>
        </div>

        <div className="card col-12">
          <div className="card-header">
            <span className="card-title">Filtros de Período</span>
          </div>
          <div className="card-body">
            <FilterBar value={range} onChange={setRange} />
          </div>
        </div>

        <div className="card col-6">
          <div className="card-header">
            <span className="card-title">Ganhos por Aplicação</span>
          </div>
          <div className="card-body">
            <GainsByAppChart data={byApp} applications={apps} />
          </div>
        </div>

        <div className="card col-6">
          <div className="card-header">
            <span className="card-title">Ganhos Totais por Dia</span>
          </div>
          <div className="card-body">
            <TotalGainsChart data={totalOverTime} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <DatabaseProvider>
      <AppShell />
    </DatabaseProvider>
  )
}
