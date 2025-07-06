
import express from 'express';
import { getClassTasks, createTask } from '../controllers/controllers.js';
import { authenticateToken } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuración de multer para archivos adjuntos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('public', 'uploads', 'tasks');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });
// Endpoint demo para devolver una clase ficticia siempre
router.get('/:classId', (req, res) => {
  res.json({ id: req.params.classId, nombre: `Clase demo ${req.params.classId}` });
});
// Endpoint demo para devolver una clase ficticia siempre
router.get('/:classId', (req, res) => {
  res.json({ id: req.params.classId, nombre: `Clase demo ${req.params.classId}` });
});

// Obtener tareas de una clase
router.get('/:classId/tasks', authenticateToken, getClassTasks);
// Crear tarea con archivo adjunto opcional
router.post('/:classId/tasks', authenticateToken, upload.single('file'), createTask);

export default router;
