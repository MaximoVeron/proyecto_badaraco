// app/routes/clases.js
import express from 'express';
import { createClass, addStudentsToClass, getTeacherClasses, getStudentsInClass, removeStudentFromClass } from '../controllers/controllers.js';

import { authenticateToken } from '../middlewares/auth.js'; // Ahora sí coincide con tu archivo

const router = express.Router();

// Las rutas ya están bien, solo asegurándonos que el middleware es el correcto
router.post('/', authenticateToken, createClass);
router.get('/', authenticateToken, getTeacherClasses);
router.post('/:classId/alumnos', authenticateToken, addStudentsToClass);
router.get('/:classId/alumnos', authenticateToken, getStudentsInClass);
router.delete('/:classId/alumnos/:studentId', authenticateToken, removeStudentFromClass);

export default router;