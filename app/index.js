// app/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import clasesRoutes from './routes/clases.js';
import perfilesRoutes from './routes/perfiles.js'; // <-- Importa esto
// Si tienes un archivo para actividades, impórtalo también:
// import actividadesRoutes from './routes/actividades.js';

// *** CAMBIO AQUÍ ***
// Importa `authenticateToken` de tu archivo `auth.js`
import { authenticateToken } from './middlewares/auth.js';

// Si accedes a la base de datos en /api/usuario (para obtener nombre completo), necesitas importar el pool
import pool from './models/db.js';

dotenv.config();

const app = express();

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Montar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/perfiles', perfilesRoutes); // <-- Usa la ruta de perfiles
// Si tienes rutas de actividades, añádelas:
// app.use('/api/actividades', actividadesRoutes);

// Ruta protegida para obtener el usuario autenticado (ajustada para tu DB)
app.get('/api/usuario', authenticateToken, async (req, res) => {
    // req.user viene del middleware authenticateToken, que contiene:
    // { id: user.id, nombre: user.nombre, email: user.email, categoria: user.categoria }
    const { id, nombre, email, categoria } = req.user; // Usamos `id` y `categoria` como vienen del middleware

    let nombreCompleto = nombre; // Ya tenemos el nombre del usuario directamente

    // Sin embargo, si `categoria` es tu `nombre_rol` en la DB,
    // tus controladores esperan `id_usuario` y `nombre_rol`.
    // Por eso te di el código anterior para el middleware que extrae esos campos.
    // Vamos a asumir que tu `categoria` en `req.user` mapea directamente a `nombre_rol`.

    // Si necesitas el `id_docente`, `id_alumno`, o `id_padre` específicos,
    // tendrías que hacer una consulta adicional aquí, similar a los controladores.
    // Pero para esta ruta simple, `id`, `nombre`, `email`, `categoria` deberían ser suficientes.

    res.json({ id_usuario: id, nombre: nombreCompleto, email: email, rol: categoria }); // Mapeo `categoria` a `rol` para consistencia
});

// Ruta raíz
app.get('/', (req, res) => {
    res.send('API de EducAR funcionando');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});