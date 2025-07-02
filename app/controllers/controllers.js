import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db.js';

export const registerUser = async (req, res) => {
    const { nombre, email, password, categoria } = req.body;
    if (!nombre || !email || !password || !categoria) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }
    try {
        const [userExists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (userExists.length > 0) {
        return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password, categoria) VALUES (?, ?, ?, ?)', [nombre, email, hashedPassword, categoria]);
        res.status(201).json({ message: 'Usuario registrado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.', error: err.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }
    try {
        const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const user = users[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const token = jwt.sign({ id: user.id, categoria: user.categoria }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
        message: 'Login exitoso',
        token,
        categoria: user.categoria,
        nombre: user.nombre
        });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.', error: err.message });
    }
};

// ... (código existente de registerUser y loginUser)

export const updateProfile = async (req, res) => {
    const { id } = req.user; // El ID del usuario se obtiene del token JWT (middleware de autenticación)
    const { nombre } = req.body; // El nuevo nombre viene del cuerpo de la solicitud

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre es requerido para la actualización.' });
    }

    try {
        await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, id]);
        res.json({ message: 'Perfil actualizado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el perfil.', error: err.message });
    }
};