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
