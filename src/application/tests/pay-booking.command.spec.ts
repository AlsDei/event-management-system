import { PayBookingCommandHandler, PayBookingCommand } from '../commands/pay-booking.command';

describe('PayBookingCommandHandler', () => {
    let handler: PayBookingCommandHandler;
    let mockBookingRepository: any;
    let mockTicketRepository: any;
    let mockPaymentService: any;
    let mockNotificationService: any;
    let mockEventRepository: any;


    const fakeBooking = () => ({
        getId: () => '550e8400-e29b-41d4-a716-446655440000',
        getQuantity: () => 2,
        getEventId: () => '550e8400-e29b-41d4-a716-446655440001',
        getTotalPrice: () => ({ getAmount: () => 300000, getCurrency: () => 'IDR' }),
        pay: jest.fn(),
    });

    beforeEach(() => {
        mockBookingRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        };
        mockTicketRepository = {
            save: jest.fn(),
        };
        mockPaymentService = {
            capturePayment: jest.fn(),
        };
        mockNotificationService = {
            sendTicketNotification: jest.fn(),
        };
        mockEventRepository = {
            findById: jest.fn(),
        };

        handler = new PayBookingCommandHandler(
            mockBookingRepository,
            mockTicketRepository,
            mockPaymentService,
            mockNotificationService,
            mockEventRepository
        );
    });

    it('should process payment, generate tickets, save everything, and send notification', async () => {
        const booking = fakeBooking();
        mockBookingRepository.findById.mockResolvedValue(booking);
        mockPaymentService.capturePayment.mockResolvedValue({ success: true, transactionId: 'txn-001' });

        const command = new PayBookingCommand('booking-abc', { amount: 300000, currency: 'IDR' }, 'customer@example.com');
        await handler.execute(command);

        expect(mockPaymentService.capturePayment).toHaveBeenCalledWith('booking-abc', { amount: 300000, currency: 'IDR' });
        expect(booking.pay).toHaveBeenCalledTimes(1);
        expect(mockBookingRepository.save).toHaveBeenCalledTimes(1);
        expect(mockTicketRepository.save).toHaveBeenCalledTimes(2); // quantity = 2
        expect(mockNotificationService.sendTicketNotification).toHaveBeenCalledWith(
            'customer@example.com',
            expect.arrayContaining([
                expect.objectContaining({ status: expect.any(String) })
            ])
        );
    });

    it('should throw if booking is not found', async () => {
        mockBookingRepository.findById.mockResolvedValue(null);

        const command = new PayBookingCommand('nonexistent', { amount: 300000, currency: 'IDR' }, 'c@c.com');
        await expect(handler.execute(command)).rejects.toThrow('Booking not found.');

        expect(mockPaymentService.capturePayment).not.toHaveBeenCalled();
    });

    it('should throw if payment gateway rejects the transaction', async () => {
        const booking = fakeBooking();
        mockBookingRepository.findById.mockResolvedValue(booking);
        mockPaymentService.capturePayment.mockResolvedValue({ success: false, transactionId: '' });

        const command = new PayBookingCommand('booking-abc', { amount: 300000, currency: 'IDR' }, 'c@c.com');
        await expect(handler.execute(command)).rejects.toThrow('Payment gateway rejected the transaction.');

        expect(booking.pay).not.toHaveBeenCalled();
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if domain booking.pay() throws (e.g. deadline expired)', async () => {
        const booking = fakeBooking();
        booking.pay.mockImplementation(() => { throw new Error('Payment deadline has passed.'); });
        mockBookingRepository.findById.mockResolvedValue(booking);
        mockPaymentService.capturePayment.mockResolvedValue({ success: true, transactionId: 'txn-002' });

        const command = new PayBookingCommand('booking-abc', { amount: 300000, currency: 'IDR' }, 'c@c.com');
        await expect(handler.execute(command)).rejects.toThrow('Payment deadline has passed.');

        expect(mockTicketRepository.save).not.toHaveBeenCalled();
        expect(mockNotificationService.sendTicketNotification).not.toHaveBeenCalled();
    });

    it('should generate the correct number of tickets based on booking quantity', async () => {
        const booking = { ...fakeBooking(), getQuantity: () => 3 };
        mockBookingRepository.findById.mockResolvedValue(booking);
        mockPaymentService.capturePayment.mockResolvedValue({ success: true, transactionId: 'txn-003' });

        const command = new PayBookingCommand('booking-abc', { amount: 450000, currency: 'IDR' }, 'c@c.com');
        await handler.execute(command);

        expect(mockTicketRepository.save).toHaveBeenCalledTimes(3);
        const notificationCall = mockNotificationService.sendTicketNotification.mock.calls[0];
        expect(notificationCall[1]).toHaveLength(3);
    });
});
