const {Pool} = require('pg')

const pool = new Pool({
    user: process.env.DB_USER         || 'postgres',
    host: process.env.DB_HOST         || 'localhost',
    port: process.env.DB_PORT         || 5432,
    database: process.env.DB_NAME     || 'torneios_db',
    password: process.env.DB_PASSWORD || 'admin',
})

module.exports = pool;