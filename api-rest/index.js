const express = require('express');
const bodyParser = require('body-parser');
const { initializeDatabase, closeDatabase } = require('./config/db');
const reservationRoutes = require('./routes/reservations');

const app = express();
app.use(bodyParser.json());

let pool;

async function startServer() {
    try {
        pool = await initializeDatabase();
        app.use('/reservations', reservationRoutes(pool));

        app.listen(3000, () => {
            console.log(' 🚀 REST API running on http://localhost:3000');
            console.log(' 📝 REST endpoint: http://localhost:3000/reservations');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    try {
        if (pool) {
            await closeDatabase(pool);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

startServer();
