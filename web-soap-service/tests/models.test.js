const { checkAvailability } = require('../models/availability');

describe('Availability Model', () => {
    describe('checkAvailability', () => {
        let mockPool;

        beforeEach(() => {
            mockPool = {
                query: jest.fn()
            };
        });

        it('should return available rooms when found', async () => {
            const mockRooms = [
                {
                    room_id: 1,
                    room_type: 'single',
                    available_date: new Date('2024-03-20'),
                    status: 'available'
                }
            ];

            mockPool.query.mockResolvedValue([mockRooms]);

            const result = await checkAvailability(
                mockPool,
                '2024-03-20',
                '2024-03-22',
                'single'
            );

            expect(result).toEqual(mockRooms);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('should return empty array when no rooms found', async () => {
            mockPool.query.mockResolvedValue([[]]);

            const result = await checkAvailability(
                mockPool,
                '2024-03-20',
                '2024-03-22',
                'single'
            );

            expect(result).toEqual([]);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(
                checkAvailability(
                    mockPool,
                    '2024-03-20',
                    '2024-03-22',
                    'single'
                )
            ).rejects.toThrow('Database error');
        });
    });
}); 