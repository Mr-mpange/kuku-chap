import { DataTypes, sequelize } from '../lib/db.js';

export const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('info', 'warning', 'error'),
    allowNull: false,
    defaultValue: 'info',
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'just now',
  }
}, {
  tableName: 'alerts'
});
