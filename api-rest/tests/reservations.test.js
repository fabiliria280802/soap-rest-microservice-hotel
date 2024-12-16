const request = require('supertest');
const express = require('express');
const nock = require('nock');
const createRouter = require('../routes/reservations');
const { initializeDatabase } = require('../config/db');

describe('Reservations API', () => {
    let app;
    let pool;

    beforeAll(async () => {
        // Inicializar la base de datos de prueba
        pool = await initializeDatabase();

        // Crear la aplicación Express
        app = express();
        app.use(express.json());
        app.use('/reservations', createRouter(pool));
    });

    afterAll(async () => {
        // Limpiar la base de datos y cerrar conexiones
        if (pool) {
            await pool.execute('DELETE FROM reservations');
            await pool.end();
        }
    });

    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        nock.cleanAll();
    });

    describe('POST /reservations', () => {
        it('should create a new reservation when all services respond correctly', async () => {
            // Mock del servicio SOAP
            nock('http://localhost:8080')
                .post('/availability')
                .reply(200, [{ room_id: '1', status: 'available' }]);

            // Mock del microservicio
            nock('http://localhost:4000')
                .get('/rooms/101')
                .reply(200, {
                    room_id: '1',
                    room_number: 101,
                    room_type: 'single',
                    status: 'available'
                });

            nock('http://localhost:4000')
                .patch('/rooms/101')
                .reply(200);

            const response = await request(app)
                .post('/reservations')
                .send({
                    startDate: '2024-03-20',
                    endDate: '2024-03-22',
                    roomType: 'single',
                    customerName: 'John Doe',
                    roomNumber: 101
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.roomType).toBe('single');
            expect(response.body.status).toBe('active');
        });

        it('should return 400 when no rooms are available', async () => {
            nock('http://localhost:8080')
                .post('/availability')
                .reply(200, []);

            const response = await request(app)
                .post('/reservations')
                .send({
                    startDate: '2024-03-20',
                    endDate: '2024-03-22',
                    roomType: 'single',
                    customerName: 'John Doe',
                    roomNumber: 101
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('No rooms available for the selected dates');
        });

        it('should return 400 when room type does not match', async () => {
            nock('http://localhost:8080')
                .post('/availability')
                .reply(200, [{ room_id: '1', status: 'available' }]);

            nock('http://localhost:4000')
                .get('/rooms/101')
                .reply(200, {
                    room_id: '1',
                    room_number: 101,
                    room_type: 'double', // Diferente al solicitado
                    status: 'available'
                });

            const response = await request(app)
                .post('/reservations')
                .send({
                    startDate: '2024-03-20',
                    endDate: '2024-03-22',
                    roomType: 'single',
                    customerName: 'John Doe',
                    roomNumber: 101
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Room type mismatch. Selected room is not of the requested type');
        });
    });

    describe('GET /reservations/:id', () => {
        it('should return a reservation when it exists', async () => {
            // Primero crear una reserva
            const [result] = await pool.execute(
                'INSERT INTO reservations (room_number, room_type, customer_name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
                [101, 'single', 'John Doe', '2024-03-20', '2024-03-22', 'active']
            );

            const response = await request(app)
                .get(`/reservations/${result.insertId}`);

            expect(response.status).toBe(200);
            expect(response.body.room_number).toBe(101);
            expect(response.body.customer_name).toBe('John Doe');
        });

        it('should return 404 when reservation does not exist', async () => {
            const response = await request(app)
                .get('/reservations/999999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Reservation not found');
        });
    });

    describe('DELETE /reservations/:id', () => {
        it('should cancel a reservation when it exists', async () => {
            // Primero crear una reserva
            const [result] = await pool.execute(
                'INSERT INTO reservations (room_number, room_type, customer_name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
                [101, 'single', 'John Doe', '2024-03-20', '2024-03-22', 'active']
            );

            const response = await request(app)
                .delete(`/reservations/${result.insertId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Reservation cancelled');

            // Verificar que el estado se actualizó en la base de datos
            const [rows] = await pool.execute(
                'SELECT status FROM reservations WHERE reservation_id = ?',
                [result.insertId]
            );
            expect(rows[0].status).toBe('cancelled');
        });

        it('should return 404 when trying to cancel non-existent reservation', async () => {
            const response = await request(app)
                .delete('/reservations/999999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Reservation not found');
        });
    });
});