import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db.js'; // Asegúrate de que db.js esté configurado para MySQL/mysql2/promise

// --- CONTROLADORES DE AUTENTICACIÓN Y USUARIOS ---

export const registerUser = async (req, res) => {
    const { nombre, apellido, email, password, rol_nombre, dni } = req.body; // Asegúrate de que 'rol_nombre' viene del frontend

    if (!nombre || !apellido || !email || !password || !rol_nombre) {
        return res.status(400).json({ message: 'Faltan datos requeridos para el registro.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verificar si el email ya está registrado en la tabla usuarios
        const [userExists] = await connection.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
        if (userExists.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }

        // 2. Obtener el id_rol basado en el rol_nombre
        const [roles] = await connection.query('SELECT id_rol FROM roles WHERE nombre_rol = ?', [rol_nombre]);
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Rol inválido especificado.' });
        }
        const id_rol = roles[0].id_rol;

        // 3. Hashear la contraseña
        const contrasena_hash = await bcrypt.hash(password, 10);

        // 4. Insertar el nuevo usuario en la tabla 'usuarios'
        const [userResult] = await connection.query(
            'INSERT INTO usuarios (email, contrasena_hash, id_rol) VALUES (?, ?, ?)',
            [email, contrasena_hash, id_rol]
        );
        const id_usuario = userResult.insertId;

        // 5. Insertar detalles específicos según el rol en la tabla correspondiente
        if (rol_nombre === 'docente') {
            await connection.query(
                'INSERT INTO docentes (id_usuario, nombre, apellido, dni) VALUES (?, ?, ?, ?)',
                [id_usuario, nombre, apellido, dni || null]
            );
        } else if (rol_nombre === 'alumno') {
            await connection.query(
                'INSERT INTO alumnos (id_usuario, nombre, apellido, dni) VALUES (?, ?, ?, ?)',
                [id_usuario, nombre, apellido, dni || null] // Añadido id_usuario a alumnos
            );
        } else if (rol_nombre === 'padre') {
            await connection.query(
                'INSERT INTO padres (id_usuario, nombre, apellido) VALUES (?, ?, ?)',
                [id_usuario, nombre, apellido]
            );
        }
        // Puedes añadir más roles aquí (ej: 'admin')

        await connection.commit();
        res.status(201).json({ message: 'Usuario registrado correctamente.', id_usuario: id_usuario, rol: rol_nombre });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en el registro de usuario:', err);
        res.status(500).json({ message: 'Error en el servidor al registrar usuario.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const loginUser = async (req, res) => {
    // 1. Obtener el email y la contraseña del cuerpo de la solicitud (lo que envía el frontend)
    const { email, password } = req.body;

    // 2. Validación básica: Asegúrate de que se enviaron ambos campos
    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, introduce tu correo y contraseña.' });
    }

    try {
        // 3. Buscar el usuario en la base de datos por su email.
        //    Importante: También necesitamos el 'contrasena_hash' y el 'nombre_rol' (que es tu 'categoria').
        const [rows] = await pool.query( // <-- Usa 'pool.query' para mysql2/promise
            `SELECT u.id_usuario, u.email, u.contrasena_hash, r.nombre_rol AS categoria 
             FROM usuarios u 
             JOIN roles r ON u.id_rol = r.id_rol 
             WHERE u.email = ?`,
            [email]
        );

        // 4. Verificar si se encontró un usuario con ese email
        if (rows.length === 0) {
            // Si no se encuentra, NO decir "email no existe" por seguridad.
            // Siempre usa un mensaje genérico para credenciales inválidas.
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = rows[0]; // Guarda la información del usuario encontrado

        // 5. ¡CRÍTICO! Comparar la contraseña ingresada por el usuario (password)
        //    con la contraseña hasheada almacenada en la base de datos (user.contrasena_hash).
        //    ¡DEBES USAR bcrypt.compare()! No compares strings directamente.
        const isMatch = await bcrypt.compare(password, user.contrasena_hash);

        if (!isMatch) {
            // Si la contraseña no coincide
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 6. Si el email y la contraseña son correctos, generar un Token Web JSON (JWT)
        //    Este token se usará para mantener la sesión del usuario.
        //    Incluye en el token el id_usuario, email y la categoria (rol) para uso futuro.
        const token = jwt.sign(
            { id_usuario: user.id_usuario, email: user.email, categoria: user.categoria },
            process.env.JWT_SECRET, // <-- ¡Usa una variable de entorno para esto en producción!
            { expiresIn: '1h' } // El token expirará en 1 hora. Ajusta según necesites.
        );

        // 7. ¡Enviar la respuesta exitosa al frontend!
        //    Aquí es donde tu frontend espera 'token' y 'categoria'.
        res.json({ token, categoria: user.categoria });

    } catch (error) {
        // 8. Manejo de errores del servidor o base de datos
        console.error('Error al intentar iniciar sesión:', error); // Esto te ayudará a depurar en la consola del servidor
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
};

// Middleware de autenticación (requerir JWT_SECRET en .env)
// Este middleware `authenticateToken` se asume que está en `app/middlewares/auth.js`
// y que agrega `req.user` con `id_usuario`, `id_rol`, `nombre_rol`.

// --- CONTROLADORES PARA DOCENTES ---

export const getClassDetails = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;
    const { classId } = req.params; // El ID de la clase de la URL

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden ver los detalles de sus clases.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        // Verificar que la clase exista y esté asignada a este docente
        const [docenteData] = await connection.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente = docenteData[0].id_docente;

        const [classResult] = await connection.query(
            `SELECT c.id_clase, c.nombre_clase, c.descripcion, c.anio_academico, c.nivel_educativo, c.fecha_creacion
             FROM clases c
             JOIN docentes_clases dc ON c.id_clase = dc.id_clase
             WHERE c.id_clase = ? AND dc.id_docente = ?`,
            [classId, id_docente]
        );

        if (classResult.length === 0) {
            return res.status(404).json({ message: 'Clase no encontrada o no asignada a este docente.' });
        }

        const classDetails = classResult[0];

        // Obtener los alumnos inscritos en esa clase
        const [students] = await connection.query(
            `SELECT a.id_alumno, a.nombre, a.apellido, u.email
             FROM alumnos_clases ac
             JOIN alumnos a ON ac.id_alumno = a.id_alumno
             JOIN usuarios u ON a.id_usuario = u.id_usuario
             WHERE ac.id_clase = ?
             ORDER BY a.nombre, a.apellido`,
            [classId]
        );

        classDetails.alumnos = students; // Añadir los alumnos a los detalles de la clase

        res.status(200).json(classDetails);

    } catch (err) {
        console.error('Error al obtener detalles de la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al obtener detalles de la clase.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const createClass = async (req, res) => {
    // req.user viene del middleware authenticateToken
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;
    const { nombre_clase, descripcion, anio_academico, nivel_educativo } = req.body;

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden crear clases.' });
    }
    if (!nombre_clase || !anio_academico || !nivel_educativo) {
        return res.status(400).json({ message: 'El nombre, año académico y nivel educativo de la clase son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Obtener el id_docente de la tabla 'docentes' usando id_usuario
        const [docenteData] = await connection.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Perfil de docente no encontrado para el usuario autenticado.' });
        }
        const id_docente = docenteData[0].id_docente;

        // Opcional: Verificar si ya existe una clase con el mismo nombre y año para este docente
        const [existingClass] = await connection.query(
            'SELECT c.id_clase FROM clases c JOIN docentes_clases dc ON c.id_clase = dc.id_clase WHERE c.nombre_clase = ? AND c.anio_academico = ? AND dc.id_docente = ?',
            [nombre_clase, anio_academico, id_docente]
        );
        if (existingClass.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Ya tienes una clase con ese nombre para este año académico.' });
        }

        // 1. Insertar la nueva clase en la tabla 'clases'
        const [classResult] = await connection.query(
            'INSERT INTO clases (nombre_clase, descripcion, anio_academico, nivel_educativo) VALUES (?, ?, ?, ?)',
            [nombre_clase, descripcion || null, anio_academico, nivel_educativo]
        );
        const id_clase = classResult.insertId;

        // 2. Asignar el docente a la clase en la tabla 'docentes_clases'
        await connection.query(
            'INSERT INTO docentes_clases (id_docente, id_clase) VALUES (?, ?)',
            [id_docente, id_clase]
        );

        await connection.commit();
        res.status(201).json({ message: 'Clase creada y asignada correctamente.', id_clase: id_clase });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear la clase:', err);
        res.status(500).json({ message: 'Error al crear la clase.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getTeacherClasses = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden ver sus clases.' });
    }

    try {
        // Obtener el id_docente de la tabla 'docentes'
        const [docenteData] = await pool.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente = docenteData[0].id_docente;

        // Unir docentes_clases con clases para obtener las clases asignadas al docente
        const [classes] = await pool.query(
            `SELECT c.id_clase, c.nombre_clase, c.descripcion, c.anio_academico, c.nivel_educativo, c.fecha_creacion
             FROM clases c
             JOIN docentes_clases dc ON c.id_clase = dc.id_clase
             WHERE dc.id_docente = ?
             ORDER BY c.fecha_creacion DESC`,
            [id_docente]
        );
        res.status(200).json(classes);
    } catch (err) {
        console.error('Error al obtener las clases del docente:', err);
        res.status(500).json({ message: 'Error al obtener las clases.', error: err.message });
    }
};

export const addStudentsToClass = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;
    const { classId } = req.params; // El ID de la clase de la URL (id_clase)
    const { studentEmails } = req.body; // Un array de emails de alumnos

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden añadir alumnos a clases.' });
    }
    if (!studentEmails || !Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({ message: 'Se requiere una lista de emails de alumnos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verificar que la clase exista y esté asignada a este docente
        const [docenteData] = await connection.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente = docenteData[0].id_docente;

        const [classExists] = await connection.query('SELECT id_clase FROM docentes_clases WHERE id_clase = ? AND id_docente = ?', [classId, id_docente]);
        if (classExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Clase no encontrada o no asignada a este docente.' });
        }
        const id_clase = classExists[0].id_clase; // Confirmamos que el ID de clase es válido y del docente

        const insertedStudents = [];
        const failedStudents = [];

        // 2. Procesar cada email de alumno
        for (const email of studentEmails) {
            // Buscar el id_alumno en la tabla 'alumnos' (no 'usuarios')
            const [alumnoData] = await connection.query(
                `SELECT a.id_alumno
                 FROM alumnos a
                 JOIN usuarios u ON a.id_usuario = u.id_usuario
                 WHERE u.email = ?`,
                [email]
            );

            if (alumnoData.length === 0) {
                failedStudents.push({ email, reason: 'Alumno no encontrado con ese email.' });
                continue;
            }

            const id_alumno = alumnoData[0].id_alumno;

            try {
                // Insertar en la tabla 'alumnos_clases'
                await connection.query('INSERT INTO alumnos_clases (id_alumno, id_clase) VALUES (?, ?)', [id_alumno, id_clase]);
                insertedStudents.push({ email, id_alumno: id_alumno });
            } catch (insertErr) {
                // Capturar el error de duplicado (si el alumno ya está en la clase)
                if (insertErr.code === 'ER_DUP_ENTRY') {
                    failedStudents.push({ email, reason: 'Ya está inscrito en esta clase.' });
                } else {
                    failedStudents.push({ email, reason: `Error al inscribir: ${insertErr.message}` });
                }
            }
        }

        await connection.commit();
        res.status(200).json({
            message: 'Proceso de inscripción de alumnos completado.',
            insertedCount: insertedStudents.length,
            failedCount: failedStudents.length,
            insertedStudents,
            failedStudents
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al añadir alumnos a la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al añadir alumnos.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getStudentsInClass = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;
    const { classId } = req.params; // ID de la clase de la URL (id_clase)

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden ver los alumnos de sus clases.' });
    }

    try {
        // 1. Verificar que la clase exista y esté asignada a este docente
        const [docenteData] = await pool.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente = docenteData[0].id_docente;

        const [classCheck] = await pool.query('SELECT id_clase FROM docentes_clases WHERE id_clase = ? AND id_docente = ?', [classId, id_docente]);
        if (classCheck.length === 0) {
            return res.status(404).json({ message: 'Clase no encontrada o no asignada a este docente.' });
        }

        // 2. Obtener los alumnos inscritos en esa clase
        const [students] = await pool.query(
            `SELECT a.id_alumno, a.nombre, a.apellido, u.email
             FROM alumnos_clases ac
             JOIN alumnos a ON ac.id_alumno = a.id_alumno
             JOIN usuarios u ON a.id_usuario = u.id_usuario -- Unir con usuarios para obtener el email
             WHERE ac.id_clase = ?
             ORDER BY a.nombre, a.apellido`,
            [classId]
        );
        res.status(200).json(students);
    } catch (err) {
        console.error('Error al obtener alumnos de la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al obtener alumnos.', error: err.message });
    }
};

export const removeStudentFromClass = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;
    const { classId, studentId } = req.params; // ID de clase (id_clase) y ID de alumno (id_alumno) de la URL

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden eliminar alumnos de sus clases.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verificar que la clase exista y pertenezca a este docente
        const [docenteData] = await connection.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente = docenteData[0].id_docente;

        const [classCheck] = await connection.query('SELECT id_clase FROM docentes_clases WHERE id_clase = ? AND id_docente = ?', [classId, id_docente]);
        if (classCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Clase no encontrada o no asignada a este docente.' });
        }

        // 2. Verificar que el alumno esté realmente en esa clase
        const [enrollmentCheck] = await connection.query('SELECT id_alumno_clase FROM alumnos_clases WHERE id_clase = ? AND id_alumno = ?', [classId, studentId]);
        if (enrollmentCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'El alumno no está inscrito en esta clase.' });
        }

        // 3. Eliminar la entrada de la tabla alumnos_clases
        await connection.query('DELETE FROM alumnos_clases WHERE id_clase = ? AND id_alumno = ?', [classId, studentId]);

        await connection.commit();
        res.status(200).json({ message: 'Alumno eliminado de la clase correctamente.' });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al eliminar alumno de la clase:', err);
        res.status(500).json({ message: 'Error en el servidor al eliminar alumno.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// --- CONTROLADORES PARA PERFIL PADRES (ADAPTADOS) ---
// NOTA: Estas funciones asumen que `req.usuario.id` es `req.user.id_usuario`
// y que la tabla `padres` tiene `id_padre` como PK y `id_usuario` como FK.

export const obtenerPerfilTutor = async (req, res) => {
    const id_usuario = req.user.id_usuario; // Asumiendo que req.user tiene id_usuario
    const nombre_rol = req.user.nombre_rol;

    if (nombre_rol !== 'padre') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los padres pueden acceder a este perfil.' });
    }

    try {
        const [datosPadre] = await pool.query(
            'SELECT p.nombre, p.apellido, u.email, p.telefono, p.direccion FROM padres p JOIN usuarios u ON p.id_usuario = u.id_usuario WHERE p.id_usuario = ?',
            [id_usuario]
        );

        if (datosPadre.length === 0) {
            return res.status(404).json({ message: 'Perfil de padre no encontrado.' });
        }

        const id_padre = datosPadre[0].id_padre; // Necesitamos el id_padre para la siguiente consulta

        const [hijos] = await pool.query(`
            SELECT a.id_alumno, a.nombre AS nombre_estudiante, a.apellido AS apellido_estudiante, pa.relacion
            FROM padres_alumnos pa
            JOIN alumnos a ON pa.id_alumno = a.id_alumno
            WHERE pa.id_padre = ?`, [id_padre]); // Usamos id_padre aquí

        res.json({
            nombre: datosPadre[0].nombre,
            apellido: datosPadre[0].apellido,
            email: datosPadre[0].email,
            telefono: datosPadre[0].telefono,
            direccion: datosPadre[0].direccion,
            hijos
        });
    } catch (err) {
        console.error('Error al obtener el perfil del tutor:', err);
        res.status(500).json({ message: 'Error al obtener el perfil.', error: err.message });
    }
};

export const actualizarPerfilTutor = async (req, res) => {
    const { telefono, direccion } = req.body; // Asumo que se actualizan estos campos en la tabla `padres`
    const id_usuario = req.user.id_usuario;
    const nombre_rol = req.user.nombre_rol;

    if (nombre_rol !== 'padre') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }

    try {
        const [padreData] = await pool.query('SELECT id_padre FROM padres WHERE id_usuario = ?', [id_usuario]);
        if (padreData.length === 0) {
            return res.status(404).json({ message: 'Perfil de padre no encontrado.' });
        }
        const id_padre = padreData[0].id_padre;

        await pool.query(
            'UPDATE padres SET telefono = ?, direccion = ? WHERE id_padre = ?',
            [telefono || null, direccion || null, id_padre]
        );
        res.json({ message: 'Datos de perfil de padre actualizados correctamente.' });
    } catch (err) {
        console.error('Error al actualizar perfil de tutor:', err);
        res.status(500).json({ message: 'Error al actualizar datos.', error: err.message });
    }
};

export const vincularEstudiante = async (req, res) => {
    const { codigo } = req.body; // El código de vinculación del estudiante
    const id_usuario_tutor = req.user.id_usuario;
    const nombre_rol_tutor = req.user.nombre_rol;

    if (nombre_rol_tutor !== 'padre') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los padres pueden vincular estudiantes.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Obtener el id_padre
        const [padreData] = await connection.query('SELECT id_padre FROM padres WHERE id_usuario = ?', [id_usuario_tutor]);
        if (padreData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Perfil de padre no encontrado.' });
        }
        const id_padre = padreData[0].id_padre;

        // 2. Buscar al estudiante por su código de vinculación
        const [estudiantes] = await connection.query(
            'SELECT id_alumno FROM alumnos WHERE dni = ?', // Usando DNI como código de vinculación para alumnos
            [codigo]
        );

        if (estudiantes.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'El código de estudiante no es válido o no existe.' });
        }
        const id_alumno = estudiantes[0].id_alumno;

        // 3. Verificar si el padre ya está vinculado a este estudiante
        const [yaExiste] = await connection.query(
            'SELECT id_padre_alumno FROM padres_alumnos WHERE id_padre = ? AND id_alumno = ?',
            [id_padre, id_alumno]
        );
        if (yaExiste.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Ya estás vinculado a este estudiante.' });
        }

        // 4. Vincular padre y estudiante en la tabla padres_alumnos
        await connection.query(
            'INSERT INTO padres_alumnos (id_padre, id_alumno) VALUES (?, ?)',
            [id_padre, id_alumno]
        );

        await connection.commit();
        res.status(200).json({ message: 'Estudiante vinculado correctamente.' });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al vincular estudiante:', err);
        res.status(500).json({ message: 'Error al vincular estudiante.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// --- CONTROLADOR GENERAL DE PERFIL ---

export const updateProfile = async (req, res) => {
    const { id_usuario, nombre_rol } = req.user; // ID y rol del usuario autenticado
    const { nombre, apellido, email, telefono, direccion, especialidad, imagen_perfil_url } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Actualizar el email en la tabla 'usuarios' si se proporciona y es diferente
        if (email) {
            const [existingEmail] = await connection.query('SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?', [email, id_usuario]);
            if (existingEmail.length > 0) {
                await connection.rollback();
                return res.status(409).json({ message: 'El nuevo email ya está en uso por otro usuario.' });
            }
            await connection.query('UPDATE usuarios SET email = ? WHERE id_usuario = ?', [email, id_usuario]);
        }

        // Actualizar los detalles específicos según el rol del usuario
        if (nombre_rol === 'docente') {
            await connection.query(
                'UPDATE docentes SET nombre = ?, apellido = ?, telefono = ?, direccion = ?, especialidad = ?, imagen_perfil_url = ? WHERE id_usuario = ?',
                [nombre || null, apellido || null, telefono || null, direccion || null, especialidad || null, imagen_perfil_url || null, id_usuario]
            );
        } else if (nombre_rol === 'alumno') {
            await connection.query(
                'UPDATE alumnos SET nombre = ?, apellido = ?, dni = ? WHERE id_usuario = ?',
                [nombre || null, apellido || null, dni || null, id_usuario] // Asegúrate de que `dni` venga en el body si se permite actualizar
            );
        } else if (nombre_rol === 'padre') {
            await connection.query(
                'UPDATE padres SET nombre = ?, apellido = ?, telefono = ?, direccion = ? WHERE id_usuario = ?',
                [nombre || null, apellido || null, telefono || null, direccion || null, id_usuario]
            );
        } else {
            // Si es otro rol (ej. admin), tal vez solo se actualice el email en usuarios.
            // O manejar otros roles según sea necesario.
        }

        await connection.commit();
        res.status(200).json({ message: 'Perfil actualizado correctamente.' });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al actualizar el perfil:', err);
        res.status(500).json({ message: 'Error al actualizar el perfil.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// --- OTROS CONTROLADORES (Actividades, Mensajes, Recursos, etc.) ---
// Aquí puedes agregar tus otros controladores basados en la estructura de tu DB.

// Ejemplo: Obtener actividades de un docente
export const getTeacherActivities = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden ver sus actividades.' });
    }

    try {
        const [docenteData] = await pool.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente = docenteData[0].id_docente;

        const [activities] = await pool.query(
            `SELECT a.id_actividad, a.nombre_actividad, a.descripcion, a.fecha_limite_entrega, m.nombre_materia
            FROM actividades a
            JOIN materias m ON a.id_materia = m.id_materia
            WHERE a.id_docente_creador = ?
            ORDER BY a.fecha_creacion DESC`,
            [id_docente]
        );
        res.status(200).json(activities);
    } catch (err) {
        console.error('Error al obtener actividades del docente:', err);
        res.status(500).json({ message: 'Error al obtener actividades.', error: err.message });
    }
};

// Ejemplo: Crear una actividad
export const createActivity = async (req, res) => {
    const { id_usuario: docente_usuario_id, nombre_rol } = req.user;
    const { nombre_actividad, descripcion, tipo_actividad, id_materia, id_recurso, fecha_limite_entrega } = req.body;

    if (nombre_rol !== 'docente') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los docentes pueden crear actividades.' });
    }
    if (!nombre_actividad || !id_materia) {
        return res.status(400).json({ message: 'Nombre de actividad y materia son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [docenteData] = await connection.query('SELECT id_docente FROM docentes WHERE id_usuario = ?', [docente_usuario_id]);
        if (docenteData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
        }
        const id_docente_creador = docenteData[0].id_docente;

        const [result] = await connection.query(
            'INSERT INTO actividades (nombre_actividad, descripcion, tipo_actividad, id_materia, id_recurso, id_docente_creador, fecha_limite_entrega) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_actividad, descripcion || null, tipo_actividad || null, id_materia, id_recurso || null, id_docente_creador, fecha_limite_entrega || null]
        );

        await connection.commit();
        res.status(201).json({ message: 'Actividad creada correctamente.', id_actividad: result.insertId });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear actividad:', err);
        res.status(500).json({ message: 'Error al crear actividad.', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};