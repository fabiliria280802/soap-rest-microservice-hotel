const express = require('express');
const axios = require('axios');

function createRouter(pool) {
    const router = express.Router();

    // Crear reserva
    router.post('/', async (req, res) => {
        const { startDate, endDate, roomType, customerName, roomNumber } = req.body;

        try {
            // Llamada al servicio SOAP
            const response = await axios.post('http://localhost:8080/availability', {
                startDate, endDate, roomType
            });
            const availableRooms = response.data; // Procesar XML si es necesario

            if (availableRooms) {
                const [result] = await pool.execute(
                    'INSERT INTO reservations (room_number, customer_name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
                    [roomNumber, customerName, startDate, endDate, 'active']
                );

                res.status(201).json({
                    id: result.insertId,
                    roomNumber,
                    customerName,
                    startDate,
                    endDate,
                    status: 'active'
                });
            } else {
                res.status(400).json({ message: "No rooms available" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error processing reservation" });
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
