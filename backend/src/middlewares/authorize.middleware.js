module.exports = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' })
        }

        const { perfil } = req.user

        if (!requiredRoles.includes(perfil)) {
            return res.status(403).json({ error: 'Acesso negado' })
        }

        next()
    }
}