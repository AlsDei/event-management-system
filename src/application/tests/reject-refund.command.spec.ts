import { RejectRefundCommandHandler, RejectRefundCommand } from '../commands/reject-refund.command';

describe('RejectRefundCommandHandler', () => {
    let handler: RejectRefundCommandHandler;
    let mockRefundRepository: any;
    let mockNotificationService: any;

    const fakeRefund = () => ({
        getId: () => 'refund-001',
        reject: jest.fn(),
    });

    beforeEach(() => {
        mockRefundRepository = { findById: jest.fn(), save: jest.fn() };
        mockNotificationService = { sendRefundStatusUpdate: jest.fn() };

        handler = new RejectRefundCommandHandler(mockRefundRepository, mockNotificationService);
    });

    it('should reject the refund, save it, and notify customer with reason', async () => {
        const refund = fakeRefund();
        mockRefundRepository.findById.mockResolvedValue(refund);

        const command = new RejectRefundCommand('refund-001', 'Event policy does not allow refunds.', 'c@c.com');
        await handler.execute(command);

        expect(refund.reject).toHaveBeenCalledWith('Event policy does not allow refunds.');
        expect(mockRefundRepository.save).toHaveBeenCalledWith(refund);
        expect(mockNotificationService.sendRefundStatusUpdate).toHaveBeenCalledWith(
            'c@c.com',
            expect.objectContaining({
                refundId: 'refund-001',
                status: 'Rejected',
                reason: 'Event policy does not allow refunds.',
            })
        );
    });

    it('should throw if the refund is not found', async () => {
        mockRefundRepository.findById.mockResolvedValue(null);

        const command = new RejectRefundCommand('nonexistent', 'reason', 'c@c.com');
        await expect(handler.execute(command)).rejects.toThrow('Refund request not found.');

        expect(mockRefundRepository.save).not.toHaveBeenCalled();
        expect(mockNotificationService.sendRefundStatusUpdate).not.toHaveBeenCalled();
    });

    it('should pass the rejection reason to the domain reject() method', async () => {
        const refund = fakeRefund();
        mockRefundRepository.findById.mockResolvedValue(refund);

        const reason = 'Past the refund window.';
        await handler.execute(new RejectRefundCommand('refund-001', reason, 'c@c.com'));

        expect(refund.reject).toHaveBeenCalledWith(reason);
    });

    it('should not save if domain reject() throws', async () => {
        const refund = fakeRefund();
        refund.reject.mockImplementation(() => { throw new Error('Already rejected.'); });
        mockRefundRepository.findById.mockResolvedValue(refund);

        const command = new RejectRefundCommand('refund-001', 'reason', 'c@c.com');
        await expect(handler.execute(command)).rejects.toThrow('Already rejected.');

        expect(mockRefundRepository.save).not.toHaveBeenCalled();
    });
});
