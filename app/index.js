import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../public')));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/classes', tasksRoutes);

// Ruta protegida para obtener el usuario autenticado
import { authenticateToken } from './middlewares/auth.js';

// Si hay token válido, responde con el nombre real; si no, demo
app.get('/api/usuario', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.json({ nombre: 'Demo Usuario' });
    }
    try {
        // Decodificar y buscar usuario real
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        // Buscar usuario en la base
        const poolModule = await import('./models/db.js');
        const pool = poolModule.default;
        const [users] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [decoded.id]);
        if (users.length > 0) {
            return res.json({ nombre: users[0].nombre });
        } else {
            return res.json({ nombre: 'Demo Usuario' });
        }
    } catch (err) {
        return res.json({ nombre: 'Demo Usuario' });
    }
});

app.get('/', (req, res) => {
    res.send('API de EducAR funcionando');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
