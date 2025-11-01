import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const DbCtx = createContext(null)

function u8FromBase64(b64) {
  const str = atob(b64)
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i)
  return arr
}
function base64FromU8(u8) {
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
  return btoa(binary)
}

export function DatabaseProvider({ children }) {
  const [ready, setReady] = useState(false)
  const dbRef = useRef(null)
  const SQLRef = useRef(null)

  useEffect(() => {
    (async () => {
      const SQL = await initSqlJs({ locateFile: () => wasmUrl })
      SQLRef.current = SQL
      let db
      const saved = localStorage.getItem('nubank_db')
      if (saved) {
        db = new SQL.Database(u8FromBase64(saved))
      } else {
        db = new SQL.Database()
        db.run(`CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          initial_value REAL NOT NULL,
          due_date TEXT NOT NULL
        );`)
        db.run(`CREATE TABLE IF NOT EXISTS earnings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          gross REAL NOT NULL,
          net REAL NOT NULL,
          FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE
        );`)
        const data = db.export()
        localStorage.setItem('nubank_db', base64FromU8(data))
      }
      dbRef.current = db
      setReady(true)
    })()
  }, [])

  const api = useMemo(() => {
    const ensure = () => {
      if (!dbRef.current) throw new Error('DB não inicializado')
      return dbRef.current
    }
    const persist = () => {
      const data = ensure().export()
      localStorage.setItem('nubank_db', base64FromU8(data))
    }
    const selectAll = (sql, params = []) => {
      const db = ensure()
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) rows.push(stmt.getAsObject())
      stmt.free()
      return rows
    }
    const run = (sql, params = []) => {
      const db = ensure()
      const stmt = db.prepare(sql)
      stmt.bind(params)
      stmt.step()
      stmt.free()
      persist()
    }
    const addApplication = ({ name, startDate, initialValue, dueDate }) => {
      run(
        'INSERT INTO applications (name, start_date, initial_value, due_date) VALUES (?, ?, ?, ?)',
        [name, startDate, Number(initialValue), dueDate]
      )
    }
    const listApplications = () => selectAll('SELECT * FROM applications ORDER BY id DESC')
    const addEarning = ({ applicationId, date, gross, net }) => {
      run(
        'INSERT INTO earnings (application_id, date, gross, net) VALUES (?, ?, ?, ?)',
        [Number(applicationId), date, Number(gross), Number(net)]
      )
    }
    const listEarningsByApplication = (applicationId, from, to) => {
      const f = from ? new Date(from).toISOString().slice(0, 10) : '0000-01-01'
      const t = to ? new Date(to).toISOString().slice(0, 10) : '9999-12-31'
      return selectAll(
        'SELECT * FROM earnings WHERE application_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
        [Number(applicationId), f, t]
      )
    }
    const getGainsByApplication = (from, to) => {
      const f = new Date(from).toISOString().slice(0, 10)
      const t = new Date(to).toISOString().slice(0, 10)
      return selectAll(
        `SELECT a.id as application_id, a.name as name, COALESCE(SUM(e.net), 0) as net_sum
         FROM applications a
         LEFT JOIN earnings e ON e.application_id = a.id AND e.date BETWEEN ? AND ?
         GROUP BY a.id, a.name
         ORDER BY a.name ASC`,
        [f, t]
      )
    }
    const getTotalGainsOverTime = (from, to) => {
      const f = new Date(from).toISOString().slice(0, 10)
      const t = new Date(to).toISOString().slice(0, 10)
      return selectAll(
        `SELECT date as d, COALESCE(SUM(net), 0) as net_sum
         FROM earnings
         WHERE date BETWEEN ? AND ?
         GROUP BY date
         ORDER BY date ASC`,
        [f, t]
      )
    }
    return {
      ready,
      addApplication,
      listApplications,
      addEarning,
      listEarningsByApplication,
      getGainsByApplication,
      getTotalGainsOverTime,
    }
  }, [ready])

  return <DbCtx.Provider value={api}>{children}</DbCtx.Provider>
}

export function useDatabase() {
  return useContext(DbCtx)
}