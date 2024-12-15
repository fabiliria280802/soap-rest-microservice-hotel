const express = require('express');
const axios = require('axios');
const router = express.Router();

// Simulación de base de datos
const reservations = [];

router.post('/', async (req, res) => {
    const { startDate, endDate, roomType, customerName } = req.body;

    // Llamada al servicio SOAP
    try {
        const response = await axios.post('http://localhost:8080/availability', {
            startDate, endDate, roomType
        });
        const availableRooms = response.data; // Procesar XML si es necesario

        if (availableRooms) {
            const newReservation = { id: reservations.length + 1, customerName, startDate, endDate };
            reservations.push(newReservation);
            res.status(201).json(newReservation);
        } else {
            res.status(400).json({ message: "No rooms available" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error checking availability" });
    }
});

// Consultar reserva
router.get('/:id', (req, res) => {
    const reservation = reservations.find(r => r.id === parseInt(req.params.id));
    if (reservation) res.json(reservation);
    else res.status(404).json({ message: "Reservation not found" });
});

// Cancelar reserva
router.delete('/:id', (req, res) => {
    const index = reservations.findIndex(r => r.id === parseInt(req.params.id));
    if (index !== -1) {
        reservations.splice(index, 1);
        res.status(200).json({ message: "Reservation cancelled" });
    } else {
        res.status(404).json({ message: "Reservation not found" });
    }
});

module.exports = router;
