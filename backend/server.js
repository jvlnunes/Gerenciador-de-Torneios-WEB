require('dotenv').config()

const cors = require('cors');
const express = require('express');

const pool = require('./src/config/db')
const authRoutes = require('./src/routes/auth.routes')
const userRoutes = require('./src/routes/user.routes')

const app = express();
const SERVER_PORT = process.env.PORT || 3000;

// Middleware
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.send('Api Online ✅')
})
app.use('/auth', authRoutes)
app.use('/users', userRoutes)

app.listen(SERVER_PORT, async () => {
    console.log(`Servidor na porta ${SERVER_PORT}`)

    try {
      const res = await pool.query('Select Now()')
      console.log('Banco Conectado:', res.rows[0])
    } catch (error) {
      console.error('Erro ao tentar conectar ao Banco de Dados:', error)
    }
})



