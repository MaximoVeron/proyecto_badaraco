import express from 'express';
// Asegúrate de importar createClass, addStudentsToClass, y getTeacherClasses
import { createClass, addStudentsToClass, getTeacherClasses } from '../controllers/controllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta para crear una nueva clase
router.post('/create', verifyToken, createClass);

// Ruta para añadir alumnos a una clase específica (usando el ID de la clase en la URL)
router.post('/:classId/students', verifyToken, addStudentsToClass);

// Nueva ruta para obtener las clases de un docente
router.get('/my-classes', verifyToken, getTeacherClasses);

export default router;