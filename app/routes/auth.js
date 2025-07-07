// app/routes/auth.js
import express from 'express';
// Solo importa las funciones de autenticación aquí
import { registerUser, loginUser } from '../controllers/controllers.js';

const router = express.Router();

// Registro de usuario
router.post('/register', registerUser);

// Login de usuario
router.post('/login', loginUser);

export default router;