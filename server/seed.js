import 'dotenv/config';
import { sequelize } from './lib/db.js';
import { Batch } from './models/Batch.js';
import { ProductionLog } from './models/ProductionLog.js';
import { Alert } from './models/Alert.js';
import mysql from 'mysql2/promise';

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

async function seed() {
  if ((process.env.DB_DIALECT || 'mysql') === 'mysql') {
    await ensureDatabase();
  }
  await sequelize.sync({ force: true });

  // Create batches
  const batches = await Batch.bulkCreate([
    { code: 'B001', name: 'Batch Alpha', ageWeeks: 12, chickens: 150, status: 'Healthy' },
    { code: 'B002', name: 'Batch Beta', ageWeeks: 8, chickens: 200, status: 'Monitoring' },
    { code: 'B003', name: 'Batch Gamma', ageWeeks: 16, chickens: 180, status: 'Healthy' },
  ]);

  // Create production logs for last 14 days
  const today = new Date();
  const logs = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    for (const b of batches) {
      const eggs = Math.round((120 + Math.random() * 40) * (b.chickens / 200));
      const feedKg = Math.round((40 + Math.random() * 10) * (b.chickens / 200));
      logs.push({ batchCode: b.code, date, eggs, feedKg });
    }
  }
  await ProductionLog.bulkCreate(logs);

  // Alerts
  await Alert.bulkCreate([
    { type: 'warning', message: 'Feed levels low in Coop A', time: '2 hours ago' },
    { type: 'info', message: 'Vaccination due for Batch Beta', time: '1 day ago' },
    { type: 'info', message: 'New order received for 300 eggs', time: '3 days ago' },
  ]);

  console.log('Seed completed');
}

seed().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
