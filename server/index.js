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
import africastalking from 'africastalking';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';
import { OtpCode } from './models/OtpCode.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
// Initialize Africa's Talking client if configured (fallback provider)
const atClient = process.env.AT_API_KEY
  ? africastalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME || 'sandbox' })
  : null;

// Briq configuration (primary provider)
const BRIQ_BASE_URL = process.env.BRIQ_BASE_URL || 'https://api.briqsms.com';
const BRIQ_API_KEY = process.env.BRIQ_API_KEY || '';
const BRIQ_SENDER_ID = process.env.BRIQ_SENDER_ID || '';
const SMS_FAKE = String(process.env.SMS_FAKE || '') === '1';
const SMS_TIMEOUT_MS = Number(process.env.SMS_TIMEOUT_MS || 10000);

async function sendSmsViaBriq(to, message) {
  const recipients = Array.isArray(to) ? to : [to];
  if (!BRIQ_API_KEY) throw new Error('BRIQ_API_KEY not configured');
  if (SMS_FAKE) {
    console.log('[SMS_FAKE] Briq send simulated:', { to: recipients, message, from: BRIQ_SENDER_ID });
    return { ok: true, provider: 'briq', simulated: true };
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);
  try {
    const url = `${BRIQ_BASE_URL.replace(/\/$/, '')}/sms/send`;
    const body = { to: recipients, message, from: BRIQ_SENDER_ID || undefined };
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIQ_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Briq HTTP ${resp.status}: ${txt}`);
    }
    const data = await resp.json().catch(() => ({}));
    return { ok: true, provider: 'briq', data };
  } finally {
    clearTimeout(id);
  }
}

async function sendSms(to, message) {
  // Prefer Briq if configured
  if (BRIQ_API_KEY) {
    return await sendSmsViaBriq(to, message);
  }
  // Fallback to Africa's Talking if configured
  if (atClient) {
    const recipients = Array.isArray(to) ? to : [to];
    const from = process.env.AT_SENDER_ID; // optional; omit for sandbox
    const options = from ? { to: recipients, message, from } : { to: recipients, message };
    const data = await atClient.SMS.send(options);
    return { ok: true, provider: 'africastalking', data };
  }
  throw new Error('No SMS provider configured');
}

// DB-backed OTP codes via OtpCode model

app.use(cors());
app.use(express.json());

// Optional auth middleware: parse Authorization: Bearer <token>
app.use((req, _res, next) => {
  try {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(String(h));
    if (m) {
      const token = m[1];
      const payload = jwt.verify(token, JWT_SECRET);
      // common fields: sub = user id, email
      req.user = { id: payload.sub || payload.id, email: payload.email };
    }
  } catch {}
  next();
});

// Setup uploads directory and static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ------------------------------
// Orders
// ------------------------------
app.post('/api/orders', async (req, res) => {
  try {
    const { productId, quantity = 1, buyerContact } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const unitPrice = Number(product.price || 0);
    const order = await Order.create({ productId, quantity: Number(quantity || 1), unitPrice, buyerContact: buyerContact || null, status: 'pending' });
    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);
    const items = await Order.findAll({ limit, offset, order: [['createdAt','DESC']] });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const { status, buyerContact } = req.body || {};
    if (status) order.status = String(status);
    if (buyerContact !== undefined) order.buyerContact = buyerContact || null;
    await order.save();
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Resend login OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!BRIQ_API_KEY && !atClient) return res.status(500).json({ error: '2FA requires SMS provider', detail: 'Configure BRIQ_API_KEY or AT_API_KEY/AT_USERNAME' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFAEnabled) return res.status(400).json({ error: '2FA not enabled' });
    const phone = (user.phone || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(500).json({ error: '2FA phone invalid' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const ttlSec = Number(process.env.OTP_TTL_SECONDS || 60);
    await OtpCode.destroy({ where: { phone } });
    await OtpCode.create({ phone, code, expiresAt: new Date(Date.now() + ttlSec * 1000) });
    const message = process.env.OTP_MESSAGE_TEMPLATE
      ? String(process.env.OTP_MESSAGE_TEMPLATE).replace(/\{code\}/g, code)
      : `Your ChickTrack verification code is ${code}`;
    try {
      const smsResp = await sendSms([phone], message);
      return res.json({ ok: true, resent: true, provider: smsResp.provider });
    } catch (err) {
      console.error('Auth resend-otp failed:', err?.message || err);
      return res.status(500).json({ error: 'Resend OTP failed' });
    }
  } catch (e) {
    console.error('Auth resend-otp failed:', e?.message || e);
    return res.status(500).json({ error: 'Resend OTP failed' });
  }
});

// ------------------------------
// OTP via SMS provider (Briq preferred)
//------------------------------
app.post('/api/otp/request', async (req, res) => {
  try {
    if (!BRIQ_API_KEY && !atClient) return res.status(500).json({ error: 'SMS provider not configured', detail: 'Set BRIQ_API_KEY or AT_API_KEY/AT_USERNAME' });
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: 'to is required' });
    const phone = (Array.isArray(to) ? to[0] : String(to)).trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone format', detail: 'Use international format like +2557XXXXXXXX' });
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const ttlSec = Number(process.env.OTP_TTL_SECONDS || 60); // default 60 seconds
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    // Upsert-like: delete existing codes for this phone and insert new
    await OtpCode.destroy({ where: { phone } });
    await OtpCode.create({ phone, code, expiresAt });

    const message = process.env.OTP_MESSAGE_TEMPLATE
      ? String(process.env.OTP_MESSAGE_TEMPLATE).replace(/\{code\}/g, code)
      : `Your ChickTrack verification code is ${code}`;
    try {
      const smsResp = await sendSms([phone], message);
      res.json({ ok: true, sent: true, ttlSeconds: ttlSec, provider: smsResp.provider, data: smsResp.data });
    } catch (err) {
      console.error('OTP request failed:', err?.message || err);
      return res.status(500).json({ error: 'OTP request failed', detail: err?.message || 'Unknown error' });
    }
  } catch (e) {
    console.error('OTP request failed:', e?.message || e);
    return res.status(500).json({ error: 'OTP request failed', detail: e?.message || 'Unknown error' });
  }
});

// Complete login after OTP when 2FA is enabled
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { userId, code } = req.body || {};
    if (!userId || !code) return res.status(400).json({ error: 'userId and code are required' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFAEnabled) return res.status(400).json({ error: '2FA not enabled' });
    const phone = (user.phone || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(500).json({ error: '2FA phone invalid' });
    const rec = await OtpCode.findOne({ where: { phone } });
    if (!rec) return res.status(400).json({ error: 'No OTP pending' });
    if (new Date() > rec.expiresAt) { await rec.destroy(); return res.status(400).json({ error: 'Code expired' }); }
    if (String(code).trim() !== String(rec.code)) return res.status(400).json({ error: 'Invalid code' });
    await rec.destroy();
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, twoFAEnabled: user.twoFAEnabled } });
  } catch (e) {
    console.error('Auth verify-otp failed:', e?.message || e);
    return res.status(500).json({ error: 'Verify OTP failed' });
  }
});

// Enable/disable 2FA and set phone (server-side)
app.post('/api/users/:id/twofa', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, phone } = req.body || {};
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (enabled) {
      if (!/^\+[1-9]\d{7,14}$/.test(String(phone || '').trim())) {
        return res.status(400).json({ error: 'Invalid phone format', detail: 'Use +countrycode format' });
      }
      user.phone = String(phone).trim();
      user.twoFAEnabled = true;
    } else {
      user.twoFAEnabled = false;
    }
    await user.save();
    res.json({ ok: true, user: { id: user.id, twoFAEnabled: user.twoFAEnabled, phone: user.phone } });
  } catch (e) {
    console.error('Update twoFA failed:', e?.message || e);
    res.status(500).json({ error: 'Update twoFA failed' });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const { to, code } = req.body || {};
    if (!to || !code) return res.status(400).json({ error: 'to and code are required' });
    const phone = (Array.isArray(to) ? to[0] : String(to)).trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone format', detail: 'Use international format like +2557XXXXXXXX' });
    const rec = await OtpCode.findOne({ where: { phone } });
    if (!rec) return res.status(400).json({ error: 'No OTP requested for this number' });
    if (new Date() > rec.expiresAt) {
      await rec.destroy();
      return res.status(400).json({ error: 'Code expired' });
    }
    if (String(code).trim() !== String(rec.code)) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    // One-time use
    await rec.destroy();
    return res.json({ ok: true, verified: true });
  } catch (e) {
    console.error('OTP verify failed:', e?.message || e);
    return res.status(500).json({ error: 'OTP verify failed', detail: e?.message || 'Unknown error' });
  }
});
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
  const feedKgToday = await ProductionLog.sum('feedKg', { where: { date: { [sequelize.Op.gte]: start, [sequelize.Op.lt]: end } } }).catch(() => 0) || 0;
  const deathsToday = await ProductionLog.sum('deaths', { where: { date: { [sequelize.Op.gte]: start, [sequelize.Op.lt]: end } } }).catch(() => 0) || 0;
  // Very simple mocked finance calc based on eggs
  const monthlyStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyEggs = await ProductionLog.sum('eggs', { where: { date: { [sequelize.Op.gte]: monthlyStart } } }).catch(() => 0) || 0;
  const monthlyRevenue = Math.round(monthlyEggs * 0.2 * 100) / 100; // $0.20/egg
  const mortalityRate = 2.1; // placeholder metric from data science job
  res.json({
    totalChickens,
    dailyEggs,
    feedKgToday,
    deathsToday,
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
    // Exclusions for "others only" view
    const andConds = [];
    const excludeSellerRaw = req.query.excludeSeller ? String(req.query.excludeSeller) : '';
    const excludeSellers = excludeSellerRaw.split(',').map(v=>v.trim()).filter(Boolean);
    if (excludeSellers.length > 0) {
      andConds.push({ seller: { [sequelize.Op.notIn]: excludeSellers } });
    }
    const excludeContactRaw = req.query.excludeContactContains ? String(req.query.excludeContactContains) : '';
    const excludeContacts = excludeContactRaw.split(',').map(v=>v.trim()).filter(Boolean);
    if (excludeContacts.length > 0) {
      for (const needle of excludeContacts) {
        andConds.push({ contact: { [sequelize.Op.notLike]: `%${needle}%` } });
      }
    }
    const excludeSellerContainsRaw = req.query.excludeSellerContains ? String(req.query.excludeSellerContains) : '';
    const excludeSellerContains = excludeSellerContainsRaw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
    if (excludeSellerContains.length > 0) {
      for (const needle of excludeSellerContains) {
        andConds.push(
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('seller')),
            { [sequelize.Op.notLike]: `%${needle}%` }
          )
        );
      }
    }
    // Also exclude by current user's email for legacy rows without userId
    if (req.user && req.user.email) {
      const email = String(req.user.email).toLowerCase();
      if (email) {
        andConds.push(
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('contact')),
            { [sequelize.Op.notLike]: `%${email}%` }
          )
        );
        andConds.push(
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('seller')),
            { [sequelize.Op.notLike]: `%${email}%` }
          )
        );
      }
    }
    if (andConds.length > 0) {
      where[sequelize.Op.and] = (where[sequelize.Op.and] || []).concat(andConds);
    }
    // Auto-exclude current user's products unless includeMine=1
    if (req.user && String(req.query.includeMine) !== '1') {
      const uid = Number(req.user.id);
      if (!Number.isNaN(uid)) where.userId = { [sequelize.Op.ne]: uid };
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { name, price, category = 'General', unit = 'unit', inStock = true, seller, location, description, images, type, contact, details } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });
    const userId = req.user && req.user.id ? Number(req.user.id) : null;
    const p = await Product.create({ name, price, category, unit, inStock, seller, location, description, images, type, contact, details, userId });
    res.status(201).json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ------------------------------
// SMS Send Proxy (Briq preferred, AT fallback)
// ------------------------------
app.post('/api/sms/send', async (req, res) => {
  try {
    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: 'to and message are required' });
    try {
      const smsResp = await sendSms(to, message);
      return res.json({ ok: true, provider: smsResp.provider, data: smsResp.data });
    } catch (err) {
      console.error('SMS send failed:', err?.message || err);
      return res.status(500).json({ error: 'SMS send failed', detail: err?.message || 'Unknown error' });
    }
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
    const where = {};
    const { search, status } = req.query;
    if (status && String(status) !== 'All') where.status = status;
    if (search) {
      const s = String(search).trim();
      if (s) where[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${s}%` } },
        { breed: { [sequelize.Op.like]: `%${s}%` } },
        { code: { [sequelize.Op.like]: `%${s}%` } },
      ];
    }
    const batches = await Batch.findAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
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
    // If server-side 2FA enabled, send OTP and require verification
    if (user.twoFAEnabled) {
      if (!BRIQ_API_KEY && !atClient) return res.status(500).json({ error: '2FA requires SMS provider', detail: 'Configure BRIQ_API_KEY or AT_API_KEY/AT_USERNAME' });
      const phone = (user.phone || '').trim();
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(500).json({ error: '2FA phone invalid', detail: 'Stored phone must be in +countrycode format' });
      // Generate and send OTP (reuse OTP logic)
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const ttlSec = Number(process.env.OTP_TTL_SECONDS || 60);
      await OtpCode.destroy({ where: { phone } });
      await OtpCode.create({ phone, code, expiresAt: new Date(Date.now() + ttlSec * 1000) });
      const message = process.env.OTP_MESSAGE_TEMPLATE
        ? String(process.env.OTP_MESSAGE_TEMPLATE).replace(/\{code\}/g, code)
        : `Your ChickTrack verification code is ${code}`;
      try {
        await sendSms([phone], message);
      } catch (e) {
        console.error('Login 2FA OTP send failed:', e?.message || e);
        return res.status(502).json({ error: 'Failed to send OTP' });
      }
      // Do not issue token yet, require OTP verification
      return res.json({ requireOtp: true, userId: user.id, phoneMasked: phone.replace(/^(\+\d{3})\d+(\d{2})$/, '$1****$2') });
    }
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, twoFAEnabled: user.twoFAEnabled } });
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
