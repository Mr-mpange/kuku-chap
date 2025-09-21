import { DataTypes, sequelize } from '../lib/db.js';

export const ProductionLog = sequelize.define('ProductionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  batchCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  eggs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  feedKg: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  deaths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  expenses: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'production_logs'
});
