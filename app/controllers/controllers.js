import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db.js';

export const registerUser = async (req, res) => {
    const { nombre, email, password, categoria } = req.body;
    if (!nombre || !email || !password || !categoria) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }
    try {
        const [userExists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password, categoria) VALUES (?, ?, ?, ?)', [nombre, email, hashedPassword, categoria]);
        res.status(201).json({ message: 'Usuario registrado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.', error: err.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }
    try {
        const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const user = users[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const token = jwt.sign({ id: user.id, categoria: user.categoria }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            message: 'Login exitoso.',
            token,
            user: { id: user.id, nombre: user.nombre, email: user.email, categoria: user.categoria }
        });
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ message: 'Error en el servidor.', error: err.message });
    }
};

//CONTROLADORES PARA PERFIL PADRES
export const obtenerPerfilTutor = async (req, res) => {
  const idTutor = req.usuario.id;

  try {
    const [datosTutor] = await pool.query('SELECT nombre, email FROM usuarios WHERE id = ?', [idTutor]);

    const [hijos] = await pool.query(`
      SELECT e.nombre AS nombre_estudiante, e.grado
      FROM tutores_estudiantes t
      JOIN estudiantes e ON t.id_estudiante = e.id
      WHERE t.id_tutor = ?`, [idTutor]);

    res.json({
      nombre: datosTutor[0].nombre,
      email: datosTutor[0].email,
      hijos
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el perfil', error: err.message });
  }
};

export const actualizarPerfilTutor = async (req, res) => {
  const { telefono, relacion } = req.body;
  const idTutor = req.usuario.id;

  try {
    await pool.query(
      'UPDATE tutores_estudiantes SET telefono = ?, relacion = ? WHERE id_tutor = ?',
      [telefono, relacion, idTutor]
    );
    res.json({ message: 'Datos actualizados correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar datos.', error: err.message });
  }
};

export const vincularEstudiante = async (req, res) => {
  const { codigo } = req.body;
  const idTutor = req.usuario.id;

  try {
    const [estudiantes] = await pool.query(
      'SELECT * FROM estudiantes WHERE codigo_vinculacion = ?',
      [codigo]
    );

    if (estudiantes.length === 0) {
      return res.status(400).json({ message: 'El código ingresado no es válido o ya ha sido usado.' });
    }

    const estudiante = estudiantes[0];

    const [yaExiste] = await pool.query(
      'SELECT * FROM tutores_estudiantes WHERE id_tutor = ? AND id_estudiante = ?',
      [idTutor, estudiante.id]
    );

    if (yaExiste.length > 0) {
      return res.status(400).json({ message: 'Ya estás vinculado a este estudiante.' });
    }

    await pool.query(
      'INSERT INTO tutores_estudiantes (id_tutor, id_estudiante, relacion, telefono) VALUES (?, ?, ?, ?)',
      [idTutor, estudiante.id, 'Padre', '']
    );

    res.json({ message: 'Estudiante vinculado correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al vincular estudiante.', error: err.message });
  }
};



export const updateProfile = async (req, res) => {
    const { id: userId, categoria } = req.user; // ID y categoría del usuario autenticado
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: 'El nuevo nombre es requerido.' });
    }

    try {
        await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, userId]);
        res.status(200).json({ message: 'Perfil actualizado correctamente.' });
    } catch (err) {
        console.error('Error al actualizar el perfil:', err);
        res.status(500).json({ message: 'Error al actualizar el perfil.', error: err.message });
    }
};

export const createClass = async (req, res) => {
    const { id: id_docente, categoria } = req.user; // Docente autenticado
    const { nombre, descripcion } = req.body;

    if (categoria !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden crear clases.' });
    }

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre de la clase es requerido.' });
    }

    try {
        // Opcional: Verificar si ya existe una clase con el mismo nombre para este docente
        const [existingClass] = await pool.query('SELECT id FROM clases WHERE nombre = ? AND id_docente = ?', [nombre, id_docente]);
        if (existingClass.length > 0) {
            return res.status(409).json({ message: 'Ya tienes una clase con ese nombre.' });
        }

        const [result] = await pool.query('INSERT INTO clases (nombre, descripcion, id_docente) VALUES (?, ?, ?)', [nombre, descripcion || null, id_docente]);
        res.status(201).json({ message: 'Clase creada correctamente.', classId: result.insertId });
    } catch (err) {
        console.error('Error al crear la clase:', err);
        res.status(500).json({ message: 'Error al crear la clase.', error: err.message });
    }
};

export const addStudentsToClass = async (req, res) => {
    const { id: id_docente, categoria } = req.user; // Docente autenticado
    const { classId } = req.params; // El ID de la clase viene de la URL
    const { studentEmails } = req.body; // Una array de emails de alumnos

    // 1. Verificar si el usuario es un docente
    if (categoria !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden añadir alumnos a clases.' });
    }

    // 2. Validar datos de entrada
    if (!studentEmails || !Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({ message: 'Se requiere una lista de emails de alumnos.' });
    }

    try {
        // 3. Verificar que la clase exista y pertenezca al docente
        const [classExists] = await pool.query('SELECT id FROM clases WHERE id = ? AND id_docente = ?', [classId, id_docente]);
        if (classExists.length === 0) {
            return res.status(404).json({ message: 'Clase no encontrada o no pertenece a este docente.' });
        }

        const class_id = classExists[0].id;
        const insertedStudents = [];
        const failedStudents = [];

        // 4. Procesar cada email de alumno
        for (const email of studentEmails) {
            // Buscar el ID del alumno por su email y verificar que sea 'nino'
            const [studentUser] = await pool.query('SELECT id, categoria FROM usuarios WHERE email = ?', [email]);

            if (studentUser.length === 0 || studentUser[0].categoria !== 'nino') {
                failedStudents.push({ email, reason: 'No existe o no es un alumno.' });
                continue;
            }

            const student_id = studentUser[0].id;

            try {
                // Insertar en la tabla clases_alumnos
                await pool.query('INSERT INTO clases_alumnos (id_clase, id_alumno) VALUES (?, ?)', [class_id, student_id]);
                insertedStudents.push({ email, id: student_id });
            } catch (insertErr) {
                // Capturar el error de duplicado (UNIQUE constraint)
                if (insertErr.code === 'ER_DUP_ENTRY') {
                    failedStudents.push({ email, reason: 'Ya está inscrito en esta clase.' });
                } else {
                    failedStudents.push({ email, reason: `Error al inscribir: ${insertErr.message}` });
                }
            }
        }

        res.status(200).json({
            message: 'Proceso de inscripción de alumnos completado.',
            insertedCount: insertedStudents.length,
            failedCount: failedStudents.length,
            insertedStudents,
            failedStudents
        });

    } catch (err) {
        console.error('Error al añadir alumnos a la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al añadir alumnos.', error: err.message });
    }
};

export const getTeacherClasses = async (req, res) => {
    const { id: id_docente, categoria } = req.user; // Docente autenticado

    // Verificar si el usuario es un docente
    if (categoria !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden ver sus clases.' });
    }

    try {
        const [classes] = await pool.query('SELECT id, nombre, descripcion, fecha_creacion FROM clases WHERE id_docente = ? ORDER BY fecha_creacion DESC', [id_docente]);
        res.status(200).json(classes); // Devuelve un array de objetos de clase
    } catch (err) {
        console.error('Error al obtener las clases del docente:', err);
        res.status(500).json({ message: 'Error al obtener las clases.', error: err.message });
    }
};

// ... (código existente hasta el final de getTeacherClasses) ...

export const getStudentsInClass = async (req, res) => {
    const { id: id_docente, categoria } = req.user; // Docente autenticado
    const { classId } = req.params; // ID de la clase de la URL

    if (categoria !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden ver los alumnos de sus clases.' });
    }

    try {
        // Verificar que la clase exista y pertenezca a este docente
        const [classCheck] = await pool.query('SELECT id FROM clases WHERE id = ? AND id_docente = ?', [classId, id_docente]);
        if (classCheck.length === 0) {
            return res.status(404).json({ message: 'Clase no encontrada o no pertenece a este docente.' });
        }

        // Obtener los alumnos inscritos en esa clase
        const [students] = await pool.query(
            `SELECT u.id AS alumno_id, u.nombre, u.email
             FROM clases_alumnos ca
             JOIN usuarios u ON ca.id_alumno = u.id
             WHERE ca.id_clase = ?
             ORDER BY u.nombre`,
            [classId]
        );
        res.status(200).json(students);
    } catch (err) {
        console.error('Error al obtener alumnos de la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al obtener alumnos.', error: err.message });
    }
};

// ... (después de getStudentsInClass o al final de controllers.js) ...

export const removeStudentFromClass = async (req, res) => {
    const { id: id_docente, categoria } = req.user; // Docente autenticado
    const { classId, studentId } = req.params; // ID de clase y de alumno de la URL

    if (categoria !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden eliminar alumnos de sus clases.' });
    }

    try {
        // 1. Verificar que la clase exista y pertenezca a este docente
        const [classCheck] = await pool.query('SELECT id FROM clases WHERE id = ? AND id_docente = ?', [classId, id_docente]);
        if (classCheck.length === 0) {
            return res.status(404).json({ message: 'Clase no encontrada o no pertenece a este docente.' });
        }

        // 2. Verificar que el alumno esté realmente en esa clase
        const [enrollmentCheck] = await pool.query('SELECT id FROM clases_alumnos WHERE id_clase = ? AND id_alumno = ?', [classId, studentId]);
        if (enrollmentCheck.length === 0) {
            return res.status(404).json({ message: 'El alumno no está inscrito en esta clase.' });
        }

        // 3. Eliminar la entrada de la tabla clases_alumnos
        await pool.query('DELETE FROM clases_alumnos WHERE id_clase = ? AND id_alumno = ?', [classId, studentId]);

        res.status(200).json({ message: 'Alumno eliminado de la clase correctamente.' });
    } catch (err) {
        console.error('Error al eliminar alumno de la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al eliminar alumno.', error: err.message });
    }
};