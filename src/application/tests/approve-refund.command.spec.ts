import { ApproveRefundCommandHandler, ApproveRefundCommand } from '../commands/approve-refund.command';

describe('ApproveRefundCommandHandler', () => {
    let handler: ApproveRefundCommandHandler;
    let mockRefundRepository: any;
    let mockBookingRepository: any;
    let mockTicketRepository: any;
    let mockNotificationService: any;

    const fakeRefund = () => ({
        getId: () => 'refund-001',
        approve: jest.fn(),
        getBookingId: () => 'booking-abc',
        getAmount: () => ({ getAmount: () => 50000, getCurrency: () => 'IDR' }),
    });

    const fakeBooking = () => ({
        getId: () => 'booking-abc',
        markAsRefunded: jest.fn(),
    });

    const fakeTickets = () => [
        { cancel: jest.fn() },
        { cancel: jest.fn() },
    ];

    beforeEach(() => {
        mockRefundRepository = { findById: jest.fn(), save: jest.fn() };
        mockBookingRepository = { findById: jest.fn(), save: jest.fn() };
        mockTicketRepository = { findByBookingId: jest.fn(), save: jest.fn() };
        mockNotificationService = { sendRefundStatusUpdate: jest.fn() };

        handler = new ApproveRefundCommandHandler(
            mockRefundRepository,
            mockBookingRepository,
            mockTicketRepository,
            mockNotificationService
        );
    });

    it('should approve refund, cancel all tickets, and notify customer', async () => {
        const refund = fakeRefund();
        const booking = fakeBooking();
        const tickets = fakeTickets();

        mockRefundRepository.findById.mockResolvedValue(refund);
        mockBookingRepository.findById.mockResolvedValue(booking);
        mockTicketRepository.findByBookingId.mockResolvedValue(tickets);

        const command = new ApproveRefundCommand('refund-001', 'customer@example.com');
        await handler.execute(command);

        expect(refund.approve).toHaveBeenCalledTimes(1);
        expect(booking.markAsRefunded).toHaveBeenCalledTimes(1);
        expect(mockBookingRepository.save).toHaveBeenCalledWith(booking);
        tickets.forEach(t => expect(t.cancel).toHaveBeenCalledTimes(1));
        expect(mockTicketRepository.findByBookingId).toHaveBeenCalledWith('booking-abc');
        expect(mockRefundRepository.save).toHaveBeenCalledWith(refund);
        expect(mockNotificationService.sendRefundStatusUpdate).toHaveBeenCalledWith(
            'customer@example.com',
            expect.objectContaining({ status: 'Approved' })
        );
    });

    it('should throw if the refund is not found', async () => {
        mockRefundRepository.findById.mockResolvedValue(null);

        const command = new ApproveRefundCommand('nonexistent', 'c@c.com');
        await expect(handler.execute(command)).rejects.toThrow('Refund request not found.');

        expect(mockBookingRepository.findById).not.toHaveBeenCalled();
        expect(mockNotificationService.sendRefundStatusUpdate).not.toHaveBeenCalled();
    });

    it('should still approve the refund even if the booking is not found', async () => {
        const refund = fakeRefund();
        mockRefundRepository.findById.mockResolvedValue(refund);
        mockBookingRepository.findById.mockResolvedValue(null);

        const command = new ApproveRefundCommand('refund-001', 'c@c.com');
        await handler.execute(command);

        // Refund is still approved and saved
        expect(refund.approve).toHaveBeenCalledTimes(1);
        expect(mockRefundRepository.save).toHaveBeenCalledWith(refund);
        // But no ticket cancellation happens
        expect(mockTicketRepository.findByBookingId).not.toHaveBeenCalled();
    });

    it('should cancel all tickets associated with the booking', async () => {
        const refund = fakeRefund();
        const booking = fakeBooking();
        const tickets = [{ cancel: jest.fn() }, { cancel: jest.fn() }, { cancel: jest.fn() }];

        mockRefundRepository.findById.mockResolvedValue(refund);
        mockBookingRepository.findById.mockResolvedValue(booking);
        mockTicketRepository.findByBookingId.mockResolvedValue(tickets);

        await handler.execute(new ApproveRefundCommand('refund-001', 'c@c.com'));

        tickets.forEach(t => expect(t.cancel).toHaveBeenCalledTimes(1));
    });
});
