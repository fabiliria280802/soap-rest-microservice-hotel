const { initializeDatabase, closeDatabase } = require('../config/db');

describe('Database Configuration', () => {
    let pool;

    afterAll(async () => {
        if (pool) {
            await closeDatabase(pool);
        }
    });

    it('should initialize database successfully', async () => {
        pool = await initializeDatabase();
        expect(pool).toBeDefined();

        // Verificar que podemos hacer una consulta
        const [rows] = await pool.query('SELECT 1 as value');
        expect(rows[0].value).toBe(1);
    });

    it('should create tables with correct schema', async () => {
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations'
        `, [process.env.DB_NAME]);

        expect(tables.length).toBe(1);

        // Verificar estructura de la tabla
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations'
        `, [process.env.DB_NAME]);

        const columnNames = columns.map(col => col.COLUMN_NAME);
        expect(columnNames).toContain('reservation_id');
        expect(columnNames).toContain('room_number');
        expect(columnNames).toContain('room_type');
        expect(columnNames).toContain('customer_name');
        expect(columnNames).toContain('start_date');
        expect(columnNames).toContain('end_date');
        expect(columnNames).toContain('status');
    });

    it('should handle database errors gracefully', async () => {
        // Forzar un error intentando crear una tabla que ya existe
        await expect(
            pool.query('CREATE TABLE reservations (id INT)')
        ).rejects.toThrow();
    });
}); 