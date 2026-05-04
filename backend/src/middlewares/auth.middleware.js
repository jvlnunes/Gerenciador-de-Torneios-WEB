const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ error: 'Token não fornecido' })
        }
        
        const parts = authHeader.split(' ')

        if (parts.length !== 2) {
            return res.status(401).json({ error: 'Formato do token inválido' })
        }

        const [scheme, token] = parts

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({ error: 'Token mal formatado' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        return next()
        
    } catch (error){
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }
}