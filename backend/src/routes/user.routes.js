const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/auth.middleware')
const authorizeMiddlware = require('../middlewares/authorize.middleware')

router.get('/', authMiddleware, (req, res) => {
    res.json({ message: 'Rota protegida', user: req.user })
})

router.get('/admin', authMiddleware, authorizeMiddlware(['admin']), (req, res) => {
    res.json({ message: 'Rota de admin', user: req.user})
})

module.exports = router
