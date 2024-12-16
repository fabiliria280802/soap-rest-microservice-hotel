const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'your_user_name',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'name_of_your_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function initializeDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        console.log(' ✅ Conectado al servidor MySQL...');

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Base de datos ${dbConfig.database} verificada/creada`);

        await connection.query(`USE ${dbConfig.database}`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                reservation_id INT PRIMARY KEY AUTO_INCREMENT,
                room_number INT NOT NULL,
                room_type VARCHAR(50) NOT NULL,
                customer_name VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla reservations verificada/creada');

        const [existingData] = await connection.query('SELECT COUNT(*) as count FROM reservations');

        if (existingData[0].count === 0) {
            await connection.query(`
                INSERT INTO reservations (room_number, room_type, customer_name, start_date, end_date, status)
                VALUES
                    (101, 'single', 'John Doe', '2024-12-20', '2024-12-22', 'active'),
                    (102, 'double', 'Jane Smith', '2024-12-25', '2024-12-27', 'active'),
                    (103, 'suite', 'Alice Johnson', '2024-12-30', '2024-12-31', 'active'),
                    (104, 'single', 'Bob Brown', '2025-01-05', '2025-01-07', 'active'),
                    (105, 'double', 'Charlie Davis', '2025-01-10', '2025-01-12', 'active')
            `);
            console.log('Datos de prueba insertados');
        }

        await connection.end();

        const pool = mysql.createPool(dbConfig);
        console.log('Pool de conexiones creado exitosamente');

        await pool.query('SELECT 1');
        console.log('Conexión del pool verificada');

        return pool;

    } catch (error) {
        console.error('Error durante la inicialización de la base de datos:', error);
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error al cerrar la conexión:', endError);
            }
        }
        throw error;
    }
}

async function closeDatabase(pool) {
    try {
        await pool.end();
        console.log('Conexiones de base de datos cerradas correctamente');
    } catch (error) {
        console.error('Error al cerrar las conexiones:', error);
        throw error;
    }
}

module.exports = {
    dbConfig,
    initializeDatabase,
    closeDatabase
};