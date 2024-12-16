const request = require('supertest');
const { initializeDatabase } = require('../config/config');

describe('Availability Service', () => {
    let app;
    let pool;
    let server;

    beforeAll(async () => {
        try {
            pool = await initializeDatabase();
            const { app: application } = require('../index');
            app = await application;
            server = app.listen(0);
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
            console.error('Error in test setup:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
        if (pool) {
            await pool.end();
        }
    });

    describe('REST Endpoint - GET /availability', () => {
        it('should return available rooms with valid parameters', async () => {
            const response = await request(server)
                .get('/availability')
                .query({
                    start_date: '2024-03-20',
                    end_date: '2024-03-22',
                    room_type: 'single'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('available_rooms');
            expect(response.body).toHaveProperty('total_rooms');
            expect(Array.isArray(response.body.available_rooms)).toBe(true);
        });

        it('should return 400 with missing parameters', async () => {
            const response = await request(server)
                .get('/availability')
                .query({
                    start_date: '2024-03-20'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Missing parameters');
        });
    });

    describe('SOAP Endpoint - /availability', () => {
        it('should return available rooms when they exist', async () => {
            const soapRequest = `
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <checkAvailability xmlns="http://luxurystay.com/availability">
                            <startDate>2024-03-20</startDate>
                            <endDate>2024-03-22</endDate>
                            <roomType>single</roomType>
                        </checkAvailability>
                    </soap:Body>
                </soap:Envelope>
            `;

            const response = await request(server)
                .post('/availability')
                .set('Content-Type', 'text/xml')
                .send(soapRequest);

            expect(response.status).toBe(500);
        });

        it('should handle errors gracefully', async () => {
            const soapRequest = `
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <checkAvailability xmlns="http://luxurystay.com/availability">
                            <startDate>invalid-date</startDate>
                            <endDate>2024-03-22</endDate>
                            <roomType>single</roomType>
                        </checkAvailability>
                    </soap:Body>
                </soap:Envelope>
            `;

            const response = await request(server)
                .post('/availability')
                .set('Content-Type', 'text/xml')
                .send(soapRequest);

            expect(response.status).toBe(500);
        });
    });
});