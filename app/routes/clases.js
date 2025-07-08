// app/routes/clases.js
import express from 'express';
import { createClass, addStudentsToClass, getTeacherClasses, getStudentsInClass, removeStudentFromClass, getClassDetails } from '../controllers/controllers.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Ruta para crear una clase (POST /api/clases)
router.post('/', authenticateToken, createClass);

// Ruta para obtener TODAS las clases del docente AUTENTICADO (GET /api/clases)
// Esta es la que tu frontend ya usa en algunos lugares para cargar el selector.
router.get('/', authenticateToken, getTeacherClasses);

// Ruta para obtener los detalles de UNA CLASE ESPECÍFICA (GET /api/clases/:classId)
// Usada para el modal "Ver Detalles"
router.get('/:classId', authenticateToken, getClassDetails);

// Ruta para obtener las clases de un DOCENTE ESPECÍFICO (GET /api/clases/docente/:id_docente)
// Tu frontend está llamando a esta ruta en cargarClasesDocente
router.get('/docente/:id_docente', authenticateToken, getTeacherClasses); // <--- ¡AÑADIR O ASEGURAR ESTA RUTA!

// Rutas para añadir y gestionar alumnos en una clase
router.post('/:classId/alumnos', authenticateToken, addStudentsToClass);
router.get('/:classId/alumnos', authenticateToken, getStudentsInClass);
router.delete('/:classId/alumnos/:studentId', authenticateToken, removeStudentFromClass);

export default router;