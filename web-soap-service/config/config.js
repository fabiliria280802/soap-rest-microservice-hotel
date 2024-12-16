require('dotenv').config();
const mysql = require('mysql2/promise'); // Para manejar MySQL con Promises
const fs = require('fs'); // Opcional, si necesitas manejar archivos más adelante

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'luxurystay_availability',
};

// Generar URL de conexión a la base de datos
function getDatabaseUrl() {
    return `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
}

// Inicializar la base de datos
async function initializeDatabase() {
    let connection;
    try {
        // Primero conectar sin base de datos
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });

        console.log(' ✅ Conexión inicial establecida con éxito.');

        // Crear base de datos si no existe
        await connection.query(`DROP DATABASE IF EXISTS ${dbConfig.database}`);
        await connection.query(`CREATE DATABASE ${dbConfig.database}`);
        console.log(`Base de datos '${dbConfig.database}' creada.`);

        // Usar la base de datos
        await connection.query(`USE ${dbConfig.database}`);

        // Crear tabla
        await connection.query(`
            CREATE TABLE availability (
                room_id INT PRIMARY KEY AUTO_INCREMENT,
                room_type VARCHAR(50) NOT NULL,
                available_date DATE NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_room_date (room_type, available_date)
            )
        `);
        console.log('Tabla "availability" creada.');

        // Insertar datos de prueba
        await connection.query(`
            INSERT INTO availability (room_type, available_date, status)
            VALUES
                ('single', CURDATE(), 'available'),
                ('double', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'available'),
                ('suite', CURDATE(), 'available')
        `);
        console.log('Datos de prueba insertados.');

        // Cerrar la conexión inicial
        await connection.end();

        // Crear y retornar el pool de conexiones
        return mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

    } catch (error) {
        console.error(`Error en la base de datos: ${error.message}`);
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
        throw error;
    }
}

// Obtener conexión
async function getConnection() {
    try {
        return await mysql.createPool({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 10,
        });
    } catch (error) {
        console.error('Error obteniendo la conexión al pool:', error.message);
        throw error;
    }
}

// Cerrar conexión (no siempre necesario con pools)
async function closeConnection(pool) {
    try {
        if (pool) {
            await pool.end();
            console.log('Conexión cerrada correctamente.');
        }
    } catch (error) {
        console.error('Error al cerrar la conexión:', error.message);
    }
}

module.exports = {
    getDatabaseUrl,
    initializeDatabase,
    getConnection,
    closeConnection,
};
