// app.js
const express = require('express');
const soap = require('soap');
const path = require('path');
const { initializeDatabase } = require('./config/config');
const { checkAvailability } = require('./models/availability');

// Configurar servicio SOAP
const serviceDefinition = {
    AvailabilityService: {
        AvailabilityPort: {
            checkAvailability: async function(args) {
                try {
                    const { startDate, endDate, roomType } = args;
                    const pool = await initializeDatabase();
                    const rooms = await checkAvailability(pool, startDate, endDate, roomType);
                    return {
                        result: rooms.map(room => ({
                            room_id: room.room_id.toString(),
                            room_type: room.room_type,
                            available_date: room.available_date.toISOString().split('T')[0],
                            status: room.status
                        }))
                    };
                } catch (error) {
                    console.error('SOAP Error:', error);
                    throw {
                        Fault: {
                            Code: {
                                Value: 'soap:Server',
                                Subcode: { value: 'InternalError' }
                            },
                            Reason: { Text: error.message }
                        }
                    };
                }
            }
        }
    }
};

// Crear aplicación Express
const app = express();

// Configurar rutas
app.get('/availability', async (req, res) => {
    const { start_date, end_date, room_type } = req.query;

    if (!start_date || !end_date || !room_type) {
        return res.status(400).json({
            error: "Missing parameters. Required: start_date, end_date, room_type"
        });
    }

    try {
        const pool = await initializeDatabase();
        const rooms = await checkAvailability(pool, start_date, end_date, room_type);
        res.json({
            available_rooms: rooms,
            total_rooms: rooms.length
        });
    } catch (error) {
        console.error('REST Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Configurar SOAP
const wsdlPath = path.join(__dirname, 'availability.wsdl');

// Función para inicializar la aplicación
async function initializeApp() {
    try {
        // Inicializar base de datos
        await initializeDatabase();
        
        // Configurar SOAP
        soap.listen(app, '/availability', serviceDefinition, wsdlPath);
        
        return app;
    } catch (error) {
        console.error('Error initializing app:', error);
        throw error;
    }
}

// Exportar la promesa de la app inicializada
const appPromise = initializeApp();

// Solo iniciar el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    appPromise.then(app => {
        const port = process.env.PORT || 8081;
        app.listen(port, () => {
            console.log(` 🚀 SOAP Service running at http://localhost:${port}`);
        });
    }).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = { app: appPromise };
