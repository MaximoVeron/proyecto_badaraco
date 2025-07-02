import express from 'express';
import { registerUser, loginUser } from '../controllers/controllers.js';
import { obtenerPerfilTutor } from '../controllers/controllers.js';
import { actualizarPerfilTutor } from '../controllers/controllers.js';
import { vincularEstudiante } from '../controllers/controllers.js';


const router = express.Router();

// Registro de usuario
router.post('/register', registerUser);

// Login de usuario
router.post('/login', loginUser);

//Cambios para padres(experimental)
router.get('/api/padre/perfil', obtenerPerfilTutor);
router.put('/api/padre/perfil', actualizarPerfilTutor);
router.post('/api/padre/vincular', vincularEstudiante);

export default router;
