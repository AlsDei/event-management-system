import { ExpireBookingsCommandHandler, ExpireBookingsCommand } from '../commands/expire-bookings.command';

jest.spyOn(console, 'error').mockImplementation(() => { });
describe('ExpireBookingsCommandHandler', () => {
    let handler: ExpireBookingsCommandHandler;
    let mockBookingRepository: any;

    const fakeExpiredBooking = (id: string) => ({
        getId: () => id,
        getEventId: () => 'event-1',
        getTicketCategoryId: () => 'cat-1',
        getQuantity: () => 2,
        expire: jest.fn(),
    });

    beforeEach(() => {
        mockBookingRepository = {
            findExpiredPending: jest.fn(),
            save: jest.fn(),
        };

        const mockEventRepository = {
            findById: jest.fn().mockResolvedValue({
                getTicketCategories: () => [{
                    id: 'cat-1',
                    releaseTickets: jest.fn(),
                }],
            }),
            save: jest.fn(),
            findAllPublished: jest.fn(),
        };

        handler = new ExpireBookingsCommandHandler(mockBookingRepository, mockEventRepository);
    });

    it('should return 0 when no expired bookings are found', async () => {
        mockBookingRepository.findExpiredPending.mockResolvedValue([]);

        const count = await handler.execute(new ExpireBookingsCommand());

        expect(count).toBe(0);
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
    });

    it('should expire all overdue bookings and return the correct count', async () => {
        const bookings = [fakeExpiredBooking('b1'), fakeExpiredBooking('b2'), fakeExpiredBooking('b3')];
        mockBookingRepository.findExpiredPending.mockResolvedValue(bookings);

        const count = await handler.execute(new ExpireBookingsCommand());

        expect(count).toBe(3);
        bookings.forEach(b => {
            expect(b.expire).toHaveBeenCalledTimes(1);
        });
        expect(mockBookingRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should pass the referenceTime to the repository query', async () => {
        mockBookingRepository.findExpiredPending.mockResolvedValue([]);
        const referenceTime = new Date('2025-01-01T12:00:00Z');

        await handler.execute(new ExpireBookingsCommand(referenceTime));

        expect(mockBookingRepository.findExpiredPending).toHaveBeenCalledWith(referenceTime);
    });

    it('should default referenceTime to the current time', async () => {
        mockBookingRepository.findExpiredPending.mockResolvedValue([]);
        const before = new Date();

        const command = new ExpireBookingsCommand();
        await handler.execute(command);

        const after = new Date();
        const calledWith: Date = mockBookingRepository.findExpiredPending.mock.calls[0][0];
        expect(calledWith.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(calledWith.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should continue processing remaining bookings if one save fails', async () => {
        const b1 = fakeExpiredBooking('b1');
        const b2 = fakeExpiredBooking('b2');
        mockBookingRepository.findExpiredPending.mockResolvedValue([b1, b2]);
        mockBookingRepository.save
            .mockRejectedValueOnce(new Error('DB error for b1')) // b1 fails
            .mockResolvedValueOnce(undefined); // b2 succeeds

        const count = await handler.execute(new ExpireBookingsCommand());

        // b2 should still be processed despite b1 failing
        expect(count).toBe(1);
        expect(mockBookingRepository.save).toHaveBeenCalledTimes(2);
    });
});
