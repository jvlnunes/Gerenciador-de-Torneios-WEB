const pool = require('../config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    try {
        const { username, password, email } = req.body

        if(!username || !password || !email) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
        }

        const existingEmails = await pool.query(
            'Select id From users Where email = $1',
            [email]
        )

        if(existingEmails.rows.length > 0) {
            return res.status(409).json({ error: 'Email já cadastrado' })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const result = await pool.query(
            'Insert Into users (name, password_hash, email, role) Values ($1,$2,$3,$4) Returning id, name, email, role',
            [username, passwordHash, email, 'USUARIO']
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.login = async (req, res) => {
    try{
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha obrigatórios' })
        }

        const result = await pool.query(
            'Select * from users Where email = $1',
            [email]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' })
        }

        const user = result.rows[0]

        const isPasswordValid = await bcrypt.compare(password, user.password_hash)

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Senha inválida' })
        }

        const token = jwt.sign(
            {
                id: user.id,
                perfil: user.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        res.json({ token })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}