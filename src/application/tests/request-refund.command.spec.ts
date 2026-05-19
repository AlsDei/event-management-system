import { RequestRefundCommandHandler, RequestRefundCommand } from '../commands/request-refund.command';

describe('RequestRefundCommandHandler', () => {
    let handler: RequestRefundCommandHandler;
    let mockBookingRepository: any;
    let mockTicketRepository: any;
    let mockRefundRepository: any;

    const fakePaidBooking = () => ({
        getId: () => 'booking-abc',
        getStatus: () => 'Paid',
        getTotalPrice: () => ({ getAmount: () => 300000, getCurrency: () => 'IDR' }),
    });

    beforeEach(() => {
        mockBookingRepository = { findById: jest.fn() };
        mockTicketRepository = { findByBookingId: jest.fn() };
        mockRefundRepository = { save: jest.fn() };

        handler = new RequestRefundCommandHandler(
            mockBookingRepository,
            mockTicketRepository,
            mockRefundRepository
        );
    });

    it('should create and save a refund and return its id', async () => {
        mockBookingRepository.findById.mockResolvedValue(fakePaidBooking());
        mockTicketRepository.findByBookingId.mockResolvedValue([
            { getStatus: () => 'Active' },
        ]);

        const refundId = await handler.execute(new RequestRefundCommand('booking-abc'));

        expect(typeof refundId).toBe('string');
        expect(refundId.length).toBeGreaterThan(0);
        expect(mockRefundRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw if booking is not found', async () => {
        mockBookingRepository.findById.mockResolvedValue(null);

        await expect(handler.execute(new RequestRefundCommand('nonexistent')))
            .rejects.toThrow('Booking not found.');

        expect(mockRefundRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if booking status is not Paid', async () => {
        const pendingBooking = { getId: () => 'b1', getStatus: () => 'PendingPayment', getTotalPrice: () => ({}) };
        mockBookingRepository.findById.mockResolvedValue(pendingBooking);

        await expect(handler.execute(new RequestRefundCommand('b1')))
            .rejects.toThrow('Only paid bookings can be refunded.');

        expect(mockRefundRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if any ticket has already been checked in', async () => {
        mockBookingRepository.findById.mockResolvedValue(fakePaidBooking());
        mockTicketRepository.findByBookingId.mockResolvedValue([
            { getStatus: () => 'Active' },
            { getStatus: () => 'CheckedIn' }, // one checked-in ticket
        ]);

        await expect(handler.execute(new RequestRefundCommand('booking-abc')))
            .rejects.toThrow('Cannot request a refund because one or more tickets have already been checked in.');

        expect(mockRefundRepository.save).not.toHaveBeenCalled();
    });

    it('should succeed when all tickets are Active (none checked in)', async () => {
        mockBookingRepository.findById.mockResolvedValue(fakePaidBooking());
        mockTicketRepository.findByBookingId.mockResolvedValue([
            { getStatus: () => 'Active' },
            { getStatus: () => 'Active' },
        ]);

        await expect(handler.execute(new RequestRefundCommand('booking-abc'))).resolves.not.toThrow();
        expect(mockRefundRepository.save).toHaveBeenCalledTimes(1);
    });
});
