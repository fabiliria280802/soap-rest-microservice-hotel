async function checkAvailability(pool, startDate, endDate, roomType) {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM availability 
             WHERE room_type = ? 
             AND available_date BETWEEN ? AND ? 
             AND status = 'available'
             ORDER BY available_date`,
            [roomType, startDate, endDate]
        );
        return rows;
    } catch (error) {
        console.error(`Error checking availability: ${error.message}`);
        throw error;
    }
}

module.exports = { checkAvailability };
