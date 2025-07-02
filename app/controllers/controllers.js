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
        message: 'Login exitoso',
        token,
        categoria: user.categoria,
        nombre: user.nombre
        });
    } catch (err) {
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


