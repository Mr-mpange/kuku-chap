import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './lib/db.js';
import { Batch } from './models/Batch.js';
import { ProductionLog } from './models/ProductionLog.js';
import { Alert } from './models/Alert.js';
import mysql from 'mysql2/promise';
import { User } from './models/User.js';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Product } from './models/Product.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.use(cors());
app.use(express.json());

// Setup uploads directory and static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));
const upload = multer({ dest: UPLOAD_DIR });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ------------------------------
// Reports
// ------------------------------
app.get('/api/reports/summary', async (_req, res) => {
  try {
    const totalChickens = await Batch.sum('chickens').then(v => v || 0);
    const eggsTotal = await ProductionLog.sum('eggs').then(v => v || 0);
    const expensesTotal = await ProductionLog.sum('expenses').then(v => v || 0);
    // Simple revenue estimate at $0.20/egg
    const revenue = Math.round(eggsTotal * 0.2 * 100) / 100;
    res.json({ revenue, eggsTotal, expensesTotal });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build summary' });
  }
});

app.get('/api/reports/production', async (req, res) => {
  try {
    const days = Number(req.query.days || 6);
    const now = new Date();
    const start = new Date(now); start.setDate(start.getDate() - days);
    const out = [];
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let i = 0; i <= days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const eggs = await ProductionLog.sum('eggs', { where: { date: { [sequelize.Op.gte]: dayStart, [sequelize.Op.lt]: dayEnd } } }).catch(() => 0) || 0;
      const feed = await ProductionLog.sum('feedKg', { where: { date: { [sequelize.Op.gte]: dayStart, [sequelize.Op.lt]: dayEnd } } }).catch(() => 0) || 0;
      const revenue = Math.round(eggs * 0.2 * 100) / 100;
      out.push({ date: `${d.getMonth()+1}/${d.getDate()}`, eggs, feed, revenue, name: labels[d.getDay()] });
    }
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build production report' });
  }
});

app.get('/api/reports/expense-breakdown', async (_req, res) => {
  try {
    // We only store total expenses on logs; provide a simple breakdown heuristic
    const total = await ProductionLog.sum('expenses').then(v => v || 0);
    const feed = Math.round(total * 0.6 * 100) / 100;
    const healthcare = Math.round(total * 0.2 * 100) / 100;
    const equipment = Math.round(total * 0.12 * 100) / 100;
    const labor = Math.round((total - feed - healthcare - equipment) * 100) / 100;
    res.json([
      { name: 'Feed', value: feed, color: '#10b981' },
      { name: 'Healthcare', value: healthcare, color: '#f59e0b' },
      { name: 'Equipment', value: equipment, color: '#ef4444' },
      { name: 'Labor', value: labor, color: '#8b5cf6' },
    ]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build expense breakdown' });
  }
});

app.get('/api/reports/batch-performance', async (_req, res) => {
  try {
    const batches = await Batch.findAll();
    const out = [];
    for (const b of batches) {
      const eggs = await ProductionLog.sum('eggs', { where: { batchCode: b.code } }).catch(()=>0) || 0;
      const efficiency = Math.min(100, Math.round((eggs / Math.max(1, b.chickens * 30)) * 100));
      out.push({ batch: b.name || b.code, eggs, efficiency, health: b.status || 'Healthy' });
    }
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build batch performance' });
  }
});

// Stats summary for dashboard
app.get('/api/stats', async (_req, res) => {
  const totalChickens = await Batch.sum('chickens').then(v => v || 0);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const dailyEggs = await ProductionLog.sum('eggs', { where: { date: { [sequelize.Op.gte]: start, [sequelize.Op.lt]: end } } }).catch(() => 0) || 0;
  // Very simple mocked finance calc based on eggs
  const monthlyStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyEggs = await ProductionLog.sum('eggs', { where: { date: { [sequelize.Op.gte]: monthlyStart } } }).catch(() => 0) || 0;
  const monthlyRevenue = Math.round(monthlyEggs * 0.2 * 100) / 100; // $0.20/egg
  const mortalityRate = 2.1; // placeholder metric from data science job
  res.json({
    totalChickens,
    dailyEggs,
    monthlyRevenue,
    mortalityRate,
    changes: { totalChickens: '+12%', dailyEggs: '+5%', monthlyRevenue: '+18%', mortalityRate: '-0.3%' }
  });
});

// Weekly production chart
app.get('/api/production/weekly', async (_req, res) => {
  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 6);
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const data = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const eggs = await ProductionLog.sum('eggs', { where: { date: { [sequelize.Op.gte]: dayStart, [sequelize.Op.lt]: dayEnd } } }).catch(() => 0) || 0;
    const feed = await ProductionLog.sum('feedKg', { where: { date: { [sequelize.Op.gte]: dayStart, [sequelize.Op.lt]: dayEnd } } }).catch(() => 0) || 0;
    data.push({ name: labels[d.getDay()], eggs, feed });
  }
  res.json(data);
});

// Recent batches
app.get('/api/batches/recent', async (_req, res) => {
  const batches = await Batch.findAll({ limit: 5, order: [['createdAt','DESC']] });
  res.json(batches);
});

// Recent alerts
app.get('/api/alerts/recent', async (_req, res) => {
  const alerts = await Alert.findAll({ limit: 5, order: [['createdAt','DESC']] });
  res.json(alerts);
});

// ------------------------------
// Products (Marketplace)
// ------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const where = {};
    if (req.query.category && String(req.query.category) !== 'All') where.category = req.query.category;
    // simple search on name/description
    if (req.query.search) {
      const s = String(req.query.search).trim();
      if (s) where[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${s}%` } },
        { description: { [sequelize.Op.like]: `%${s}%` } },
      ];
    }
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);
    const items = await Product.findAll({ where, limit, offset, order: [['createdAt','DESC']] });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// File uploads (images)
app.post('/api/uploads', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const urls = files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, category = 'General', unit = 'unit', inStock = true, seller, location, description, images, type, contact, details } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });
    const p = await Product.create({ name, price, category, unit, inStock, seller, location, description, images, type, contact, details });
    res.status(201).json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ------------------------------
// SMS (Briq) Proxy
// ------------------------------
app.post('/api/sms/send', async (req, res) => {
  try {
    const baseUrl = process.env.BRIQ_BASE_URL;
    const apiKey = process.env.BRIQ_API_KEY;
    const senderId = process.env.BRIQ_SENDER_ID;
    const smsPath = (process.env.BRIQ_SMS_PATH || '/sms/send').replace(/\s+/g, '');
    const authHeaderKey = process.env.BRIQ_AUTH_HEADER_KEY || 'Authorization';
    const useFake = process.env.SMS_FAKE === '1' || process.env.BRIQ_USE_MOCK === '1';
    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: 'to and message are required' });
    if (useFake) {
      console.log(`[SMS_FAKE] to=${to} from=${senderId || 'N/A'} msg=${message}`);
      return res.json({ ok: true, fake: true });
    }
    if (!baseUrl || !apiKey) return res.status(500).json({ error: 'Briq is not configured' });

    // Attempt a generic Briq-style request; adjust path/fields to match your account docs if needed
    const url = `${baseUrl.replace(/\/$/, '')}${smsPath.startsWith('/') ? smsPath : `/${smsPath}`}`;
    const body = { to, message, from: senderId };
    async function sendWithRetry(attempt = 1) {
      const controller = new AbortController();
      const timeoutMs = Number(process.env.SMS_TIMEOUT_MS || 10000);
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        // Allow custom header key for API key, fallback to Bearer
        if (authHeaderKey.toLowerCase() === 'authorization') {
          headers['Authorization'] = `Bearer ${apiKey}`;
        } else {
          headers[authHeaderKey] = apiKey;
        }
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(t);
        return response;
      } catch (err) {
        clearTimeout(t);
        if (attempt < 2) {
          console.warn(`Briq SMS attempt ${attempt} failed, retrying...`, err?.code || err?.name || '');
          return sendWithRetry(attempt + 1);
        }
        const msg = err && (err.code === 'ENOTFOUND' ? `DNS lookup failed for ${new URL(url).hostname}` : (err?.message || 'Network error'));
        console.error('Briq SMS fetch error:', err);
        return { ok: false, _networkError: true, _detail: msg };
      }
    }
    const r = await sendWithRetry();
    if (!r.ok) {
      if (r._networkError) {
        return res.status(502).json({ error: 'Briq SMS network error', detail: r._detail });
      }
      const t = await r.text();
      console.error('Briq SMS error:', t);
      return res.status(502).json({ error: 'Briq SMS failed', detail: t });
    }
    const data = await r.json().catch(()=>({ ok: true }));
    res.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'SMS send failed' });
  }
});

// ------------------------------
// Batches CRUD
// ------------------------------
app.get('/api/batches', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);
    const batches = await Batch.findAll({ limit, offset, order: [['createdAt', 'DESC']] });
    res.json(batches);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

app.post('/api/batches', async (req, res) => {
  try {
    const { code, name, breed, ageWeeks = 0, chickens = 0, status = 'Healthy' } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'code and name are required' });
    const exists = await Batch.findOne({ where: { code } });
    if (exists) return res.status(409).json({ error: 'Batch code already exists' });
    const batch = await Batch.create({ code, name, breed, ageWeeks, chickens, status });
    res.status(201).json(batch);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

app.get('/api/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Not found' });
    res.json(batch);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

app.put('/api/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Not found' });
    const { name, breed, ageWeeks, chickens, status } = req.body;
    Object.assign(batch, { name, breed, ageWeeks, chickens, status });
    await batch.save();
    res.json(batch);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

app.delete('/api/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Not found' });
    await batch.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// ------------------------------
// Production Logs CRUD
// ------------------------------
app.get('/api/logs', async (req, res) => {
  try {
    const where = {};
    if (req.query.batchCode) where.batchCode = req.query.batchCode;
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);
    const logs = await ProductionLog.findAll({ where, limit, offset, order: [['date','DESC']] });
    res.json(logs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { batchCode, date, eggs = 0, feedKg = 0, deaths = 0, expenses = 0, notes } = req.body;
    if (!batchCode || !date) return res.status(400).json({ error: 'batchCode and date are required' });
    const log = await ProductionLog.create({ batchCode, date: new Date(date), eggs, feedKg, deaths, expenses, notes });
    res.status(201).json(log);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

app.put('/api/logs/:id', async (req, res) => {
  try {
    const log = await ProductionLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Not found' });
    const { batchCode, date, eggs, feedKg, deaths, expenses, notes } = req.body;
    Object.assign(log, {
      batchCode: batchCode ?? log.batchCode,
      date: date ? new Date(date) : log.date,
      eggs: eggs ?? log.eggs,
      feedKg: feedKg ?? log.feedKg,
      deaths: deaths ?? log.deaths,
      expenses: expenses ?? log.expenses,
      notes: notes ?? log.notes,
    });
    await log.save();
    res.json(log);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    const log = await ProductionLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Not found' });
    await log.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});
// Register user
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    const [user, created] = await User.findOrCreate({ where: { email }, defaults: { name, phone } });
    if (!created) {
      // update in case name/phone changed
      user.name = name; user.phone = phone ?? user.phone; await user.save();
    }
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Auth: Register with password
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, passwordHash });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Gemini AI chat proxy
app.post('/api/ai/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const parts = messages.map(m => ({ text: `${m.role || 'user'}: ${m.content}` }));
    const body = { contents: [{ role: 'user', parts }] };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) {
      const t = await r.text();
      console.error('Gemini error', t);
      return res.status(500).json({ error: 'Gemini request failed' });
    }
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ reply: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI chat failed' });
  }
});

async function ensureDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASS || '';
  const db = process.env.DB_NAME || 'cluck_metrics';
  const connection = await mysql.createConnection({ host, port, user, password: pass });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``);
  await connection.end();
}

async function start() {
  if ((process.env.DB_DIALECT || 'mysql') === 'mysql') {
    await ensureDatabase();
  }
  // auto-migrate in dev to add new columns like images, type, contact, details
  await sequelize.sync({ alter: true });
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
