import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import initSqlJs from 'sql.js'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'nubank.sqlite')
const PORT = process.env.PORT || 3001
const HOST = (process.env.HOST || '0.0.0.0').trim()
const AUTH_PIN = (process.env.AUTH_PIN || '1234').toString()
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

const app = express()
app.use(cors())
app.use(express.json())

const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

let SQL = null
let db = null

const locateWasm = () => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

function u8FromBuffer(buffer) {
  return new Uint8Array(buffer instanceof Buffer ? buffer : Buffer.from(buffer))
}

async function initDb() {
  SQL = await initSqlJs({ locateFile: locateWasm })
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(u8FromBuffer(fileBuffer))
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
    persist()
  }
}

function persist() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

const ok = (res, data) => res.json({ ok: true, data })
const bad = (res, message, code = 400) => res.status(code).json({ ok: false, error: message })

function selectAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function run(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  stmt.free()
  persist()
}

function createToken() {
  return jwt.sign({ role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function authRequired(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || ''
    const parts = hdr.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return bad(res, 'Unauthorized', 401)
    const token = parts[1]
    jwt.verify(token, JWT_SECRET)
    next()
  } catch (e) {
    return bad(res, 'Unauthorized', 401)
  }
}

app.post('/auth/login', (req, res) => {
  try {
    const { pin } = req.body || {}
    if (!pin) return bad(res, 'PIN obrigatório')
    if (String(pin) !== AUTH_PIN) return bad(res, 'PIN inválido', 401)
    const token = createToken()
    ok(res, { token })
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/applications', authRequired, (req, res) => {
  try {
    const rows = selectAll('SELECT * FROM applications ORDER BY id DESC')
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.post('/applications', authRequired, (req, res) => {
  try {
    const { name, startDate, initialValue, dueDate = '' } = req.body || {}
    if (!name || !startDate || initialValue == null) return bad(res, 'Campos obrigatórios')
    run('INSERT INTO applications (name, start_date, initial_value, due_date) VALUES (?, ?, ?, ?)',
      [name, startDate, Number(initialValue), dueDate])
    const rows = selectAll('SELECT * FROM applications ORDER BY id DESC')
    ok(res, rows[0])
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/earnings', authRequired, (req, res) => {
  try {
    const { applicationId, from, to } = req.query
    if (!applicationId) return bad(res, 'applicationId é obrigatório')
    const f = from || '0000-01-01'
    const t = to || '9999-12-31'
    const rows = selectAll(
      'SELECT * FROM earnings WHERE application_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
      [Number(applicationId), f, t]
    )
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.post('/earnings', authRequired, (req, res) => {
  try {
    const { applicationId, date, gross, net } = req.body || {}
    if (!applicationId || !date || gross == null || net == null) return bad(res, 'Campos obrigatórios')
    run('INSERT INTO earnings (application_id, date, gross, net) VALUES (?, ?, ?, ?)',
      [Number(applicationId), date, Number(gross), Number(net)])
    ok(res, { inserted: true })
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/stats/gains-by-application', authRequired, (req, res) => {
  try {
    const { from, to } = req.query
    const f = from || '0000-01-01'
    const t = to || '9999-12-31'
    const rows = selectAll(`
      SELECT a.id as application_id, a.name as name, COALESCE(SUM(e.net), 0) as net_sum
      FROM applications a
      LEFT JOIN earnings e ON e.application_id = a.id AND e.date BETWEEN ? AND ?
      GROUP BY a.id, a.name
      ORDER BY a.name ASC
    `, [f, t])
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/stats/total-over-time', authRequired, (req, res) => {
  try {
    const { from, to } = req.query
    const f = from || '0000-01-01'
    const t = to || '9999-12-31'
    const rows = selectAll(`
      SELECT date as d, COALESCE(SUM(net), 0) as net_sum
      FROM earnings
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `, [f, t])
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/health', (req, res) => ok(res, { status: 'ok' }))

initDb().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`API listening on http://${HOST}:${PORT} using ${DB_PATH}`)
  })
}).catch(err => {
  console.error('Failed to init DB', err)
  process.exit(1)
})