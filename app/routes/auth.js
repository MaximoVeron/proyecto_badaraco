import express from 'express';
import { registerUser, loginUser } from '../controllers/controllers.js';

const router = express.Router();

// Registro de usuario
router.post('/register', registerUser);

// Login de usuario
router.post('/login', loginUser);

export default router;
