// app.js
const express = require('express');
const soap = require('soap');
const path = require('path');
const { initializeDatabase } = require('./config/config');
const { checkAvailability } = require('./models/availability');

// Función para validar fechas
function validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
}

// Definir tipos de habitación válidos
const VALID_ROOM_TYPES = ['single', 'double', 'suite'];

// Función para validar tipo de habitación
function validateRoomType(roomType) {
    return VALID_ROOM_TYPES.includes(roomType.toLowerCase());
}

// Configurar servicio SOAP
const serviceDefinition = {
    AvailabilityService: {
        AvailabilityPort: {
            checkAvailability: async function(args) {
                try {
                    const { startDate, endDate, roomType } = args;

                    // Validar el formato de las fechas
                    const start = new Date(startDate);
                    const end = new Date(endDate);

                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        throw {
                            Fault: {
                                Code: {
                                    Value: 'soap:Client',
                                    Subcode: { value: 'InvalidDateFormat' }
                                },
                                Reason: { Text: 'Formato de fecha inválido. Use YYYY-MM-DD' }
                            }
                        };
                    }

                    // Validar el rango de fechas
                    if (start > end) {
                        throw {
                            Fault: {
                                Code: {
                                    Value: 'soap:Client',
                                    Subcode: { value: 'InvalidDateRange' }
                                },
                                Reason: { Text: 'El rango de fechas no es válido.' }
                            }
                        };
                    }

                    // Validar tipo de habitación
                    if (!validateRoomType(roomType)) {
                        throw {
                            Fault: {
                                Code: {
                                    Value: 'soap:Client',
                                    Subcode: { value: 'InvalidRoomType' }
                                },
                                Reason: { Text: 'Tipo de habitación no encontrado.' }
                            }
                        };
                    }

                    const pool = await initializeDatabase();
                    const rooms = await checkAvailability(pool, startDate, endDate, roomType.toLowerCase());

                    return {
                        availableRooms: {
                            room: rooms.map(room => ({
                                roomId: room.room_id.toString(),
                                roomType: room.room_type,
                                availableDate: room.available_date.toISOString().split('T')[0],
                                status: room.status
                            }))
                        }
                    };
                } catch (error) {
                    console.error('SOAP Error:', error);
                    throw error.Fault ? error : {
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

    // Validar que todos los parámetros estén presentes
    if (!start_date || !end_date || !room_type) {
        return res.status(400).json({
            error: "Faltan parámetros. Requeridos: start_date, end_date, room_type"
        });
    }

    // Validar el formato de las fechas
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
            error: "Formato de fecha inválido. Use YYYY-MM-DD"
        });
    }

    // Validar el rango de fechas
    if (startDate > endDate) {
        return res.status(400).json({
            error: "El rango de fechas no es válido."
        });
    }

    // Validar tipo de habitación
    if (!validateRoomType(room_type)) {
        return res.status(404).json({
            error: "Tipo de habitación no encontrado."
        });
    }

    try {
        const pool = await initializeDatabase();
        const rooms = await checkAvailability(pool, start_date, end_date, room_type.toLowerCase());
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
