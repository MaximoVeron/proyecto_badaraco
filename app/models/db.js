import mysql from 'mysql2/promise'; 
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',     
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,        
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function connectDb() {
    try {
        const connection = await pool.getConnection(); 
        await connection.query('SELECT NOW()'); 
        connection.release(); 
        console.log('Conexión a la base de datos MySQL exitosa!');
    } catch (err) {
        console.error('Error al conectar con la base de datos MySQL/MariaDB:', err);
    }
}

connectDb(); 

export default pool; 