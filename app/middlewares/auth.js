// app/middlewares/auth.js (VERSIÓN MEJORADA para tu DB y controladores)
import jwt from 'jsonwebtoken';
import pool from '../models/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // `decoded.id_usuario` y `decoded.id_rol` deben venir del token generado en loginUser

        // Buscar usuario en la base de datos, incluyendo el nombre del rol
        const [users] = await pool.query(
            'SELECT u.id_usuario, u.email, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = ? AND u.activo = 1',
            [decoded.id_usuario] // Asume que el token JWT tiene `id_usuario`
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado o inactivo.' });
        }

        // Asignar los valores esperados por tus controladores a req.user
        req.user = {
            id_usuario: users[0].id_usuario,
            email: users[0].email,
            nombre_rol: users[0].nombre_rol // Esto es crucial para tus validaciones de rol
        };

        next();
    } catch (err) {
        console.error('Error al verificar token:', err);
        return res.status(403).json({ message: 'Token inválido o expirado.', error: err.message });
    }
};