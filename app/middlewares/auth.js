// app/middlewares/auth.js
import jwt from 'jsonwebtoken';
import pool from '../models/db.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    console.log('\n--- DEBUG AUTH MIDDLEWARE INICIO ---');
    console.log('authHeader recibido:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];

    console.log('Token extraído:', token);

    if (token == null) {
        console.warn('Intento de acceso sin token o token malformado. Enviando 401.');
        return res.status(401).json({ message: 'No se proporcionó token de autenticación.' });
    }

    console.log('Token presente. Intentando verificar JWT...');

    jwt.verify(token, process.env.JWT_SECRET, async (err, userPayload) => {
        if (err) {
            console.error('Error de verificación de JWT:', err.message);
            console.error('Detalles del error JWT:', err);
            return res.status(403).json({ message: 'Token inválido o expirado. Por favor, inicia sesión de nuevo.' });
        }

        console.log('JWT verificado con éxito. Payload:', userPayload);

        const { id_usuario, email, categoria } = userPayload;

        let connection;
        try {
            connection = await pool.getConnection();

            const [userRoleData] = await connection.query(
                `SELECT r.nombre_rol
                 FROM usuarios u
                 JOIN roles r ON u.id_rol = r.id_rol
                 WHERE u.id_usuario = ?`,
                [id_usuario]
            );

            if (userRoleData.length === 0) {
                console.error(`Rol no encontrado para id_usuario: ${id_usuario}. Enviando 404.`);
                return res.status(404).json({ message: 'Rol de usuario no encontrado en la base de datos.' });
            }
            // Convertimos el nombre del rol a minúsculas para una comparación consistente
            const nombre_rol = userRoleData[0].nombre_rol.toLowerCase(); // <--- ¡CAMBIO CLAVE AQUÍ!
            console.log('DEBUG: nombre_rol de la DB (convertido a minúsculas):', nombre_rol); // Nuevo log

            let nombre = '';
            let apellido = '';

            if (nombre_rol === 'docente') { // Ahora esta condición debería ser verdadera si es 'Docente'
                console.log(`DEBUG: Intentando obtener datos para docente con id_usuario: ${id_usuario} (tipo: ${typeof id_usuario})`);
                const query = 'SELECT nombre, apellido FROM docentes WHERE id_usuario = ?';
                const params = [id_usuario];
                console.log('DEBUG: Ejecutando consulta SQL:', query, 'con parámetros:', params);
                const [docenteData] = await connection.query(query, params);
                console.log('DEBUG: Resultado RAW de la consulta a la tabla docentes:', docenteData);
                if (docenteData.length > 0) {
                    nombre = docenteData[0].nombre;
                    apellido = docenteData[0].apellido;
                    console.log(`DEBUG: Nombre y Apellido encontrados: ${nombre} ${apellido}`);
                } else {
                    console.warn('DEBUG: No se encontró un registro en la tabla docentes para el id_usuario.');
                }
            } else if (nombre_rol === 'alumno') { // Asegúrate de que tus roles en la DB estén en minúsculas o ajusta aquí
                const [alumnoData] = await connection.query('SELECT nombre, apellido FROM alumnos WHERE id_usuario = ?', [id_usuario]);
                if (alumnoData.length > 0) {
                    nombre = alumnoData[0].nombre;
                    apellido = alumnoData[0].apellido;
                }
            } else if (nombre_rol === 'padre') { // Asegúrate de que tus roles en la DB estén en minúsculas o ajusta aquí
                const [padreData] = await connection.query('SELECT nombre, apellido FROM padres WHERE id_usuario = ?', [id_usuario]);
                if (padreData.length > 0) {
                    nombre = padreData[0].nombre;
                    apellido = padreData[0].apellido;
                }
            }

            req.user = {
                id_usuario: id_usuario,
                email: email,
                nombre_rol: nombre_rol, // Almacenamos el rol en minúsculas en req.user
                nombre: nombre,
                apellido: apellido
            };
            
            console.log('Usuario autenticado y datos recuperados. Pasando a la siguiente ruta.');
            console.log('req.user final:', req.user);
            console.log('--- DEBUG AUTH MIDDLEWARE FIN ---\n');
            next();

        } catch (dbError) {
            console.error('Error en el middleware authenticateToken al obtener datos de la DB:', dbError);
            res.status(500).json({ message: 'Error interno del servidor al autenticar usuario.' });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });
};