import React, { useMemo, useState, useEffect } from 'react'
import { DatabaseProvider, useDatabase } from './db/DatabaseContext.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { ToastContainer } from 'react-toastify'
import { toast } from 'react-toastify'
import { format, subDays } from 'date-fns'
import GainsByAppChart from './components/GainsByAppChart.jsx'
import TotalGainsChart from './components/TotalGainsChart.jsx'
import YieldChart from './components/YieldChart.jsx'
import TaxChart from './components/TaxChart.jsx'
import ApplicationForm from './components/ApplicationForm.jsx'
import EarningsForm from './components/EarningsForm.jsx'
import FilterBar from './components/FilterBar.jsx'
import Login from './pages/Login.jsx'
import FullScreenModal from './components/FullScreenModal.jsx'

function AppShell() {
  const { user, logout, mustChangePassword, changePassword } = useAuth()
  const { ready, listApplications, getGainsByApplication, getTotalGainsOverTime, listEarningsByApplication, setAdminUserId } = useDatabase()
  const [range, setRange] = useState(() => {
    const to = new Date()
    const from = subDays(to, 30)
    return { from, to }
  })
  
  // Admin state
  const [adminUsers, setAdminUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAppId, setSelectedAppId] = useState('')
  
  // Modal state
  const [fullScreenChart, setFullScreenChart] = useState(null) // 'gainsByApp', 'totalGains', 'yield'
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })

  // Load users if admin
  useEffect(() => {
    if (user?.role === 'admin') {
       fetch('/admin/users')
         .then(res => res.json())
         .then(data => {
           if (data.ok) setAdminUsers(data.data)
         })
         .catch(console.error)
    }
  }, [user])

  useEffect(() => {
    if (mustChangePassword) setShowPasswordModal(true)
  }, [mustChangePassword])

  // Propagate admin selection to database context
  useEffect(() => {
    if (setAdminUserId) setAdminUserId(selectedUser)
  }, [selectedUser, setAdminUserId])

  const apps = ready ? listApplications() : []
  const [byApp, setByApp] = useState([])
  const [totalOverTime, setTotalOverTime] = useState([])
  const [yieldData, setYieldData] = useState([])
  
  const selectedApp = useMemo(() => {
      return apps.find(a => String(a.id) === String(selectedAppId))
  }, [apps, selectedAppId])

  useEffect(() => {
    if (ready) {
      getGainsByApplication(range.from, range.to, selectedAppId).then(setByApp).catch(console.error)
      getTotalGainsOverTime(range.from, range.to, selectedAppId).then(setTotalOverTime).catch(console.error)
      
      if (selectedAppId) {
          listEarningsByApplication(selectedAppId, range.from, range.to)
            .then(data => setYieldData(Array.isArray(data) ? data : []))
            .catch(console.error)
      } else {
          setYieldData([])
      }
    }
  }, [ready, range, selectedAppId, getGainsByApplication, getTotalGainsOverTime, listEarningsByApplication])

  if (!user) return <Login />

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1>Controle de Aplicações Nubank</h1>
              <p>Bem-vindo, {user.name} ({user.role === 'admin' ? 'Administrador' : 'Usuário'})</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', width: 'auto' }} onClick={() => setShowPasswordModal(true)}>Alterar senha</button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', width: 'auto' }} onClick={logout}>Sair</button>
            </div>
          </div>
          
          {user.role === 'admin' && (
            <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Visualizar dados de:</label>
              <select 
                className="select" 
                style={{ maxWidth: 300 }} 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
              >
                <option value="">Eu mesmo (Admin)</option>
                {adminUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={async () => {
                  if (!selectedUser) { toast.warn('Selecione um usuário'); return }
                  try {
                    const res = await fetch('/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: selectedUser }) })
                    const data = await res.json()
                    if (data.ok) toast.success('Senha resetada. Usuário deve trocá-la no próximo login.')
                    else toast.error(data.error || 'Erro ao resetar senha')
                  } catch (e) { toast.error('Erro de conexão') }
                }}>Resetar senha</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <span className="badge">SQLite Local + Gráficos</span>
          </div>
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
            <span className="card-title" style={{ color: '#ef4444', fontWeight: 'bold' }}>Saldo da Aplicação</span>
          </div>
          <div className="card-body">
            <EarningsForm onAppSelect={setSelectedAppId} />
          </div>
        </div>

        {selectedAppId ? (
          <>
            <div className="card col-12">
              <div className="card-header">
                <span className="card-title" style={{ color: '#ef4444', fontWeight: 'bold', width: '100%', textAlign: 'center', display: 'block' }}>Filtros de Período</span>
              </div>
              <div className="card-body">
                <FilterBar value={range} onChange={setRange} />
              </div>
            </div>

            <div className="card col-6">
              <div className="card-header">
                <span className="card-title">Valor líquido por aplicação</span>
                <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setFullScreenChart('gainsByApp')}>🔍</button>
              </div>
              <div className="card-body">
                <GainsByAppChart data={byApp} applications={apps} />
              </div>
            </div>

            <div className="card col-6">
              <div className="card-header">
                <span className="card-title">Ganhos Totais por Dia</span>
                <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setFullScreenChart('totalGains')}>🔍</button>
              </div>
              <div className="card-body">
                <TotalGainsChart data={totalOverTime} initialValue={selectedApp ? selectedApp.initial_value : 0} />
              </div>
            </div>

            <div className="card col-6">
              <div className="card-header">
                <span className="card-title">Evolução do Rendimento (vs. Inicial)</span>
                <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setFullScreenChart('yield')}>🔍</button>
              </div>
              <div className="card-body">
                <YieldChart 
                  key={selectedAppId} 
                  data={yieldData} 
                  initialValue={selectedApp ? selectedApp.initial_value : 0} 
                  appName={selectedApp ? selectedApp.name : ''}
                />
              </div>
            </div>

            <div className="card col-6">
              <div className="card-header">
                <span className="card-title">Impostos por Saldo</span>
                <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setFullScreenChart('tax')}>🔍</button>
              </div>
              <div className="card-body">
                <TaxChart 
                  key={`tax-${selectedAppId}`} 
                  data={yieldData} 
                  appName={selectedApp ? selectedApp.name : ''}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="card col-12" style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>
            Selecione uma aplicação na seção "Saldo da Aplicação" para visualizar os gráficos.
          </div>
        )}
      </div>

      <FullScreenModal 
        isOpen={!!fullScreenChart} 
        onClose={() => setFullScreenChart(null)}
         title={
           fullScreenChart === 'gainsByApp' ? 'Valor líquido por aplicação' :
           fullScreenChart === 'totalGains' ? 'Ganhos Totais por Dia' :
           fullScreenChart === 'yield' ? 'Evolução do Rendimento' :
           'Impostos por Saldo'
         }
       >
         {fullScreenChart === 'gainsByApp' && (
            <div style={{ height: '600px', minWidth: '600px' }}>
                <GainsByAppChart 
                    data={byApp} 
                    applications={apps} 
                    options={{ maintainAspectRatio: false }} 
                />
            </div>
         )}
          {fullScreenChart === 'totalGains' && (
             <div style={{ height: '600px', minWidth: '600px' }}>
                 <TotalGainsChart 
                     data={totalOverTime} 
                     initialValue={selectedApp ? selectedApp.initial_value : 0}
                     options={{ maintainAspectRatio: false }} 
                 />
             </div>
          )}
         {fullScreenChart === 'yield' && (
            <div style={{ height: '600px', minWidth: '600px' }}>
               <YieldChart 
                 key={`fs-${selectedAppId}`} 
                 data={yieldData} 
                 initialValue={selectedApp ? selectedApp.initial_value : 0} 
                 appName={selectedApp ? selectedApp.name : ''}
                 options={{ maintainAspectRatio: false }}
               />
            </div>
         )}
         {fullScreenChart === 'tax' && (
            <div style={{ height: '600px', minWidth: '600px' }}>
               <TaxChart 
                 key={`fs-tax-${selectedAppId}`} 
                 data={yieldData} 
                 appName={selectedApp ? selectedApp.name : ''}
                 options={{ maintainAspectRatio: false }}
               />
            </div>
         )}
      </FullScreenModal>

      <FullScreenModal 
        isOpen={showPasswordModal} 
        onClose={() => { if (!mustChangePassword) setShowPasswordModal(false) }}
        title={mustChangePassword ? 'Defina uma nova senha' : 'Alterar senha'}
      >
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <label>Senha atual</label>
            <input className="input" type="password" value={pwdForm.current} onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Nova senha</label>
            <input className="input" type="password" value={pwdForm.next} onChange={e => setPwdForm({ ...pwdForm, next: e.target.value })} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Confirmar nova senha</label>
            <input className="input" type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
          </div>
          <button className="btn" onClick={async () => {
            const pw = pwdForm.next || ''
            const ok1 = pw.length >= 6 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)
            if (!ok1) { toast.warn('A senha deve ter maiúscula, minúscula, número, especial e 6+ caracteres'); return }
            if (pwdForm.next !== pwdForm.confirm) { toast.warn('Confirmação diferente'); return }
            const success = await changePassword(pwdForm.current, pwdForm.next)
            if (success) { setPwdForm({ current: '', next: '', confirm: '' }); setShowPasswordModal(false) }
          }}>Salvar senha</button>
        </div>
      </FullScreenModal>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <AppShell />
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </DatabaseProvider>
    </AuthProvider>
  )
}
