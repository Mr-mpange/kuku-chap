import { DataTypes, sequelize } from '../lib/db.js';

export const OtpCode = sequelize.define('OtpCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  }
}, {
  tableName: 'otp_codes',
  indexes: [
    { fields: ['phone'] },
    { fields: ['expires_at'] }
  ]
});
