import jwt from 'jsonwebtoken';
import pool from '../models/db.js';

export const authenticateToken = async (req, res, next) => {
    // El token puede venir por header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Buscar usuario en la base de datos
        const [users] = await pool.query('SELECT id, nombre, email, categoria FROM usuarios WHERE id = ?', [decoded.id]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        req.user = users[0];
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido', error: err.message });
    }
};
