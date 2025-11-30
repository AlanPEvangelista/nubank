import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'nubank.sqlite')
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this'

const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())

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
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      name TEXT
    );`)
    db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      initial_value REAL NOT NULL,
      due_date TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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
  db.run('PRAGMA foreign_keys = ON;')

  // Ensure users table exists if DB already existed without it
  try {
    db.run("SELECT count(*) FROM users LIMIT 1")
  } catch (e) {
    console.log("Creating users table...")
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      name TEXT
    );`)
    persist()
  }

  // Ensure user_id column exists in applications
  try {
    db.run("SELECT user_id FROM applications LIMIT 1")
  } catch (e) {
    console.log("Adding user_id to applications...")
    db.run("ALTER TABLE applications ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE")
    persist()
  }

  // Seed Admin User
  const admin = selectAll("SELECT * FROM users WHERE email = 'admin@nubank.com'")
  if (admin.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    run("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)", ['admin@nubank.com', hash, 'admin', 'Administrador'])
    console.log("Admin user created: admin@nubank.com / admin123")
  }
}

function persist() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

function exec(sql) {
  db.exec(sql)
  persist()
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

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ ok: false, error: 'Acesso negado' })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ ok: false, error: 'Token inválido' })
    req.user = user
    next()
  })
}

// Auth Routes
app.post('/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return bad(res, 'Email e senha obrigatórios')
    
    const existing = selectAll("SELECT * FROM users WHERE email = ?", [email])
    if (existing.length > 0) return bad(res, 'Email já cadastrado')

    const hash = bcrypt.hashSync(password, 10)
    run("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)", [email, hash, 'user', name || 'Usuário'])
    
    ok(res, { registered: true })
  } catch (e) { bad(res, e.message, 500) }
})

app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body
    const users = selectAll("SELECT * FROM users WHERE email = ?", [email])
    if (users.length === 0) return bad(res, 'Credenciais inválidas', 401)

    const user = users[0]
    if (!bcrypt.compareSync(password, user.password)) return bad(res, 'Credenciais inválidas', 401)

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' })
    
    res.cookie('token', token, { httpOnly: true, secure: false }) // secure: true in production https
    ok(res, { user: { id: user.id, email: user.email, role: user.role, name: user.name } })
  } catch (e) { bad(res, e.message, 500) }
})

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token')
  ok(res, { loggedOut: true })
})

app.get('/auth/me', authenticateToken, (req, res) => {
  ok(res, { user: req.user })
})

// Protected Data Routes
app.get('/applications', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC'
    let params = [req.user.id]

    if (req.user.role === 'admin' && req.query.userId) {
      sql = 'SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC'
      params = [req.query.userId]
    } else if (req.user.role === 'admin' && req.query.all === 'true') {
       sql = 'SELECT * FROM applications ORDER BY id DESC'
       params = []
    }

    const rows = selectAll(sql, params)
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.post('/applications', authenticateToken, (req, res) => {
  try {
    const { name, startDate, initialValue, dueDate } = req.body || {}
    if (!name || !startDate || initialValue == null) return bad(res, 'Campos obrigatórios')
    
    const ownerId = req.user.id

    run('INSERT INTO applications (name, start_date, initial_value, due_date, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, startDate, Number(initialValue), dueDate || '', ownerId])
    
    const rows = selectAll('SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC LIMIT 1', [ownerId])
    ok(res, rows[0])
  } catch (e) { bad(res, e.message, 500) }
})

app.put('/applications/:id', authenticateToken, (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, startDate, initialValue, dueDate } = req.body || {}
    if (!id) return bad(res, 'ID inválido')
    if (!name || !startDate || initialValue == null) return bad(res, 'Campos obrigatórios')
    
    const app = selectAll("SELECT * FROM applications WHERE id = ?", [id])[0]
    if (!app) return bad(res, 'Aplicação não encontrada', 404)
    if (app.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado', 403)

    run('UPDATE applications SET name = ?, start_date = ?, initial_value = ?, due_date = ? WHERE id = ?',
      [name, startDate, Number(initialValue), dueDate || '', id])
      
    const rows = selectAll('SELECT * FROM applications WHERE id = ?', [id])
    ok(res, rows[0] || null)
  } catch (e) { bad(res, e.message, 500) }
})

app.delete('/applications/:id', authenticateToken, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return bad(res, 'ID inválido')
    
    const app = selectAll("SELECT * FROM applications WHERE id = ?", [id])[0]
    if (!app) return bad(res, 'Aplicação não encontrada', 404)
    if (app.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado', 403)

    run('DELETE FROM earnings WHERE application_id = ?', [id])
    run('DELETE FROM applications WHERE id = ?', [id])
    ok(res, { deleted: true })
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/earnings', authenticateToken, (req, res) => {
  try {
    const { applicationId, from, to } = req.query
    if (!applicationId) return bad(res, 'applicationId é obrigatório')
    const f = from || '0000-01-01'
    const t = to || '9999-12-31'

    const app = selectAll("SELECT * FROM applications WHERE id = ?", [applicationId])[0]
    if (!app) return bad(res, 'Aplicação não encontrada', 404)
    if (app.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado', 403)

    const rows = selectAll(
      'SELECT e.* FROM earnings e INNER JOIN applications a ON a.id = e.application_id WHERE e.application_id = ? AND e.date BETWEEN ? AND ? ORDER BY e.date DESC',
      [Number(applicationId), f, t]
    )
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.post('/earnings', authenticateToken, (req, res) => {
  try {
    const { applicationId, date, gross, net } = req.body || {}
    if (!applicationId || !date || gross == null || net == null) return bad(res, 'Campos obrigatórios')
    
    const app = selectAll("SELECT * FROM applications WHERE id = ?", [applicationId])[0]
    if (!app) return bad(res, 'Aplicação não encontrada', 404)
    if (app.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado', 403)

    run('INSERT INTO earnings (application_id, date, gross, net) VALUES (?, ?, ?, ?)',
      [Number(applicationId), date, Number(gross), Number(net)])
    ok(res, { inserted: true })
  } catch (e) { bad(res, e.message, 500) }
})

app.put('/earnings/:id', authenticateToken, (req, res) => {
  try {
    const id = Number(req.params.id)
    const { applicationId, date, gross, net } = req.body || {}
    if (!id) return bad(res, 'ID inválido')
    if (!applicationId || !date || gross == null || net == null) return bad(res, 'Campos obrigatórios')
    
    const earning = selectAll("SELECT e.*, a.user_id FROM earnings e JOIN applications a ON a.id = e.application_id WHERE e.id = ?", [id])[0]
    if (!earning) return bad(res, 'Lançamento não encontrado', 404)
    if (earning.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado', 403)

    const targetApp = selectAll("SELECT * FROM applications WHERE id = ?", [applicationId])[0]
    if (!targetApp) return bad(res, 'Aplicação destino não encontrada', 404)
    if (targetApp.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado à aplicação destino', 403)

    run('UPDATE earnings SET application_id = ?, date = ?, gross = ?, net = ? WHERE id = ?',
      [Number(applicationId), date, Number(gross), Number(net), id])
    const rows = selectAll('SELECT * FROM earnings WHERE id = ?', [id])
    ok(res, rows[0] || null)
  } catch (e) { bad(res, e.message, 500) }
})

app.delete('/earnings/:id', authenticateToken, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return bad(res, 'ID inválido')
    
    const earning = selectAll("SELECT e.*, a.user_id FROM earnings e JOIN applications a ON a.id = e.application_id WHERE e.id = ?", [id])[0]
    if (!earning) return bad(res, 'Lançamento não encontrado', 404)
    if (earning.user_id !== req.user.id && req.user.role !== 'admin') return bad(res, 'Acesso negado', 403)

    run('DELETE FROM earnings WHERE id = ?', [id])
    ok(res, { deleted: true })
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/stats/gains-by-application', authenticateToken, (req, res) => {
  try {
    const { from, to, applicationId } = req.query
    const f = from || '0000-01-01'
    const t = to || '9999-12-31'
    
    let userId = req.user.id
    if (req.user.role === 'admin' && req.query.userId) userId = req.query.userId

    let sql = `
      SELECT a.id as application_id, a.name as name, 
      COALESCE((
        SELECT net FROM earnings e2 
        WHERE e2.application_id = a.id 
          AND e2.date BETWEEN ? AND ? 
        ORDER BY e2.date DESC, e2.id DESC 
        LIMIT 1
      ), 0) as net_sum
      FROM applications a
      WHERE a.user_id = ?
    `
    const params = [f, t, userId]

    if (applicationId) {
      sql += ' AND a.id = ?'
      params.push(Number(applicationId))
    }

    sql += ' ORDER BY a.name ASC'

    const rows = selectAll(sql, params)
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

app.get('/stats/total-over-time', authenticateToken, (req, res) => {
  try {
    const { from, to, applicationId } = req.query
    const f = from || '0000-01-01'
    const t = to || '9999-12-31'

    let userId = req.user.id
    if (req.user.role === 'admin' && req.query.userId) userId = req.query.userId

    let sql = `
      SELECT date as d, COALESCE(SUM(net), 0) as net_sum
      FROM earnings
      JOIN applications a ON a.id = earnings.application_id
      WHERE date BETWEEN ? AND ? AND a.user_id = ?
    `
    const params = [f, t, userId]

    if (applicationId) {
      sql += ' AND a.id = ?'
      params.push(Number(applicationId))
    }

    sql += ' GROUP BY date ORDER BY date ASC'

    const rows = selectAll(sql, params)
    ok(res, rows)
  } catch (e) { bad(res, e.message, 500) }
})

// Admin: List users
app.get('/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return bad(res, 'Acesso restrito', 403)
  try {
    const rows = selectAll('SELECT id, email, name, role FROM users ORDER BY name ASC')
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