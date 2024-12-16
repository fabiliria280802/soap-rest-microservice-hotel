const express = require('express');
const axios = require('axios');

function createRouter(pool) {
    const router = express.Router();

    // Crear reserva
    router.post('/', async (req, res) => {
        const { startDate, endDate, roomType, customerName, roomNumber } = req.body;

        try {
            // 1. Verificar disponibilidad con el servicio SOAP
            const soapResponse = await axios.post('http://localhost:8080/availability', {
                startDate,
                endDate,
                roomType
            }, {
                headers: {
                    'Content-Type': 'application/soap+xml',
                    'SOAPAction': 'check_availability'
                }
            });

            // Verificar si hay habitaciones disponibles
            if (!soapResponse.data || !soapResponse.data.length) {
                return res.status(400).json({ message: "No rooms available for the selected dates" });
            }

            // 2. Obtener detalles de la habitación del microservicio
            const microserviceResponse = await axios.get(`http://localhost:4000/rooms/${roomNumber}`);
            const roomDetails = microserviceResponse.data;

            // Verificar si el tipo de habitación coincide
            if (roomDetails.room_type !== roomType) {
                return res.status(400).json({ 
                    message: "Room type mismatch. Selected room is not of the requested type" 
                });
            }

            // 3. Crear la reserva en la base de datos
            const [result] = await pool.execute(
                `INSERT INTO reservations (
                    room_number, 
                    room_type,
                    customer_name, 
                    start_date, 
                    end_date, 
                    status
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    roomNumber,
                    roomType,
                    customerName,
                    startDate,
                    endDate,
                    'active'
                ]
            );

            // 4. Actualizar el estado de la habitación en el microservicio
            await axios.patch(
                `http://localhost:4000/rooms/${roomNumber}`,
                { status: 'occupied' }
            );

            // 5. Devolver la reserva creada
            res.status(201).json({
                id: result.insertId,
                roomNumber,
                roomType,
                customerName,
                startDate,
                endDate,
                status: 'active'
            });

        } catch (error) {
            console.error('Error creating reservation:', error);
            
            // Manejar diferentes tipos de errores
            if (error.response) {
                // Error de respuesta de algún servicio
                return res.status(error.response.status).json({
                    message: "Service error",
                    details: error.response.data
                });
            }
            
            if (error.request) {
                // Error de conexión
                return res.status(503).json({
                    message: "Service unavailable",
                    details: "Could not connect to required services"
                });
            }
            
            // Error general
            res.status(500).json({
                message: "Error processing reservation",
                details: error.message
            });
        }
    });

    // Consultar reserva
    router.get('/:id', async (req, res) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM reservations WHERE reservation_id = ?',
                [req.params.id]
            );

            if (rows.length > 0) {
                res.json(rows[0]);
            } else {
                res.status(404).json({ message: "Reservation not found" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error retrieving reservation" });
        }
    });

    // Cancelar reserva
    router.delete('/:id', async (req, res) => {
        try {
            const [result] = await pool.execute(
                'UPDATE reservations SET status = ? WHERE reservation_id = ?',
                ['cancelled', req.params.id]
            );

            if (result.affectedRows > 0) {
                res.status(200).json({ message: "Reservation cancelled" });
            } else {
                res.status(404).json({ message: "Reservation not found" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error cancelling reservation" });
        }
    });

    return router;
}

module.exports = createRouter;
