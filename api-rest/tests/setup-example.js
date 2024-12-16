// Aumentar el timeout para pruebas que involucran base de datos
jest.setTimeout(10000);

// Variables de entorno para pruebas
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'xxxxx';
process.env.DB_NAME = 'xxxxxxxxxxx';

// Limpiar la base de datos antes de las pruebas
const mysql = require('mysql2/promise');

beforeAll(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    await connection.end();
});