import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import { authenticateToken } from './middlewares/auth.js';
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
app.get('/api/usuario', (req, res) => {
    // Devuelve un nombre demo (sin autenticación)
    res.json({ nombre: 'Demo Usuario' });
});

app.get('/', (req, res) => {
    res.send('API de EducAR funcionando');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
