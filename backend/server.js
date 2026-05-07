require('dotenv').config()

const cors    = require('cors')
const express = require('express')
const pool    = require('./src/config/db')

const authRoutes       = require('./src/routes/auth.routes')
const userRoutes       = require('./src/routes/user.routes')
const teamRoutes       = require('./src/routes/teams.routes')
// Descomente quando criar:
// const tournamentRoutes = require('./src/routes/tournament.routes')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (_, res) => res.send('API VolleyHub ✅'))
app.use('/auth',        authRoutes)
app.use('/users',       userRoutes)
app.use('/teams',       teamRoutes)
// app.use('/tournaments', tournamentRoutes)

app.listen(PORT, async () => {
  console.log(`Servidor na porta ${PORT}`)
  try {
    const r = await pool.query('SELECT NOW()')
    console.log('Banco conectado:', r.rows[0].now)
  } catch (e) {
    console.error('Erro no banco:', e.message)
  }
})