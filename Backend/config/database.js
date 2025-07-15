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
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

class Database {
    constructor() {
        this.pool = null;
        this.poolPromise = this.initializePool();
    }

    async initializePool() {
        try {
            this.pool = new sql.ConnectionPool(config);
            await this.pool.connect();
            console.log('Connected to SQL Server');
            return this.pool;
        } catch (err) {
            console.error('Database connection failed:', err);
            throw err;
        }
    }

    async getPool() {
        if (!this.pool) {
            await this.poolPromise;
        } else if (this.pool.connecting) {
            await this.poolPromise;
        }
        return this.pool;
    }

    async query(queryString, params = {}) {
        try {
            const pool = await this.getPool();
            const request = pool.request();

            // Add named parameters with appropriate types
            Object.keys(params).forEach(key => {
                let type = sql.NVarChar; // Default type
                let value = params[key];

                // Basic type inference (can be expanded based on needs)
                if (typeof value === 'number') type = sql.Int;
                else if (value instanceof Date) type = sql.DateTime;
                else if (value === null) type = sql.NVarChar; // Handle null

                request.input(key, type, value);
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
            const pool = await this.getPool();
            const request = pool.request();

            // Add named parameters
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

    async close() {
        if (this.pool) {
            await this.pool.close();
            console.log('Database connection closed');
        }
    }
}

// Export singleton instance
const database = new Database();

// Handle process termination
process.on('SIGINT', async () => {
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await database.close();
    process.exit(0);
});

module.exports = database;