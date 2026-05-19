import { MarkRefundPaidOutCommandHandler, MarkRefundPaidOutCommand } from '../commands/mark-refund-paid-out.comand';

describe('MarkRefundPaidOutCommandHandler', () => {
    let handler: MarkRefundPaidOutCommandHandler;
    let mockRefundRepository: any;
    let mockBankService: any;

    const fakeApprovedRefund = () => ({
        getId: () => 'refund-001',
        getStatus: () => 'Approved',
        getAmount: () => ({ getAmount: () => 300000, getCurrency: () => 'IDR' }),
        markAsPaidOut: jest.fn(),
    });

    beforeEach(() => {
        mockRefundRepository = { findById: jest.fn(), save: jest.fn() };
        mockBankService = { processRefundTransfer: jest.fn() };

        handler = new MarkRefundPaidOutCommandHandler(mockRefundRepository, mockBankService);
    });

    it('should process bank transfer, mark refund as paid out, and save', async () => {
        const refund = fakeApprovedRefund();
        mockRefundRepository.findById.mockResolvedValue(refund);
        mockBankService.processRefundTransfer.mockResolvedValue({ success: true, bankReference: 'BANK-REF-XYZ' });

        await handler.execute(new MarkRefundPaidOutCommand('refund-001'));

        expect(mockBankService.processRefundTransfer).toHaveBeenCalledWith('refund-001', {
            amount: 300000,
            currency: 'IDR',
        });
        expect(refund.markAsPaidOut).toHaveBeenCalledWith('BANK-REF-XYZ');
        expect(mockRefundRepository.save).toHaveBeenCalledWith(refund);
    });

    it('should throw if the refund is not found', async () => {
        mockRefundRepository.findById.mockResolvedValue(null);

        await expect(handler.execute(new MarkRefundPaidOutCommand('nonexistent')))
            .rejects.toThrow('Refund request not found.');

        expect(mockBankService.processRefundTransfer).not.toHaveBeenCalled();
    });

    it('should throw if the refund is not in Approved status', async () => {
        const refund = { ...fakeApprovedRefund(), getStatus: () => 'Requested' };
        mockRefundRepository.findById.mockResolvedValue(refund);

        await expect(handler.execute(new MarkRefundPaidOutCommand('refund-001')))
            .rejects.toThrow('Only approved refunds can be paid out.');

        expect(mockBankService.processRefundTransfer).not.toHaveBeenCalled();
        expect(mockRefundRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if the bank transfer fails', async () => {
        const refund = fakeApprovedRefund();
        mockRefundRepository.findById.mockResolvedValue(refund);
        mockBankService.processRefundTransfer.mockResolvedValue({ success: false, bankReference: '' });

        await expect(handler.execute(new MarkRefundPaidOutCommand('refund-001')))
            .rejects.toThrow('Bank transfer failed. Please try again.');

        expect(refund.markAsPaidOut).not.toHaveBeenCalled();
        expect(mockRefundRepository.save).not.toHaveBeenCalled();
    });

    it('should pass the bank reference string from the bank service to markAsPaidOut', async () => {
        const refund = fakeApprovedRefund();
        mockRefundRepository.findById.mockResolvedValue(refund);
        mockBankService.processRefundTransfer.mockResolvedValue({ success: true, bankReference: 'UNIQUE-BANK-REF-999' });

        await handler.execute(new MarkRefundPaidOutCommand('refund-001'));

        expect(refund.markAsPaidOut).toHaveBeenCalledWith('UNIQUE-BANK-REF-999');
    });
});
