// app/routes/perfiles.js
import express from 'express';
import { obtenerPerfilTutor, actualizarPerfilTutor, vincularEstudiante, updateProfile } from '../controllers/controllers.js';

// Importa `authenticateToken` de tu archivo `auth.js`
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Ruta general para actualizar el perfil del usuario autenticado (docente, alumno, padre)
router.put('/me', authenticateToken, updateProfile);

// Rutas específicas para el perfil de padres (tutores)
router.get('/padre/me', authenticateToken, obtenerPerfilTutor);
router.put('/padre/me', authenticateToken, actualizarPerfilTutor);
router.post('/padre/vincular', authenticateToken, vincularEstudiante);

export default router;