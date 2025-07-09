// backend/config/database.js
const sql = require('mssql');
require('dotenv').config();

// Database configuration
const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000,
    }
};

class Database {
  constructor() {
    this.poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
      })
      .catch(err => {
        console.error('Database connection failed:', err);
        throw err;
      });
  }

  async query(queryString, params = []) {
    try {
      const pool = await this.poolPromise;
      const request = pool.request();
      
      // Add parameters if provided
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(queryString);
      return result;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }

  async execute(procedure, params = {}) {
    try {
      const pool = await this.poolPromise;
      const request = pool.request();
      
      // Add parameters
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
      
      const result = await request.execute(procedure);
      return result;
    } catch (err) {
      console.error('Database procedure error:', err);
      throw err;
    }
  }
}

module.exports = new Database();