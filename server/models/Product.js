import { DataTypes, sequelize } from '../lib/db.js';

export const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'General',
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unit',
  },
  inStock: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  seller: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 4.5,
  },
  reviews: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // New fields for marketplace listings
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  images: {
    type: DataTypes.TEXT, // store as JSON string
    allowNull: true,
    get() {
      const raw = this.getDataValue('images');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(val) {
      if (!val) this.setDataValue('images', null);
      else if (Array.isArray(val)) this.setDataValue('images', JSON.stringify(val));
      else if (typeof val === 'string') this.setDataValue('images', val);
      else this.setDataValue('images', JSON.stringify([]));
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'products'
});
