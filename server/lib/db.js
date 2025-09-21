import 'dotenv/config';
import { Sequelize, DataTypes, Op } from 'sequelize';

const DB_DIALECT = process.env.DB_DIALECT || 'mysql';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_NAME = process.env.DB_NAME || 'cluck_metrics';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: false,
  define: {
    underscored: false,
    freezeTableName: false,
  },
});

// Re-export helpers
sequelize.Op = Op;
export { DataTypes };
