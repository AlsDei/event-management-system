import { IRefundRepository } from '../../domain/repositories/refund.repository';
import { IBankService } from '../interfaces/bank-service.interface';

export class MarkRefundPaidOutCommand {
    constructor(public readonly refundId: string) { }
}

export class MarkRefundPaidOutCommandHandler {
    constructor(
        private readonly refundRepository: IRefundRepository,
        private readonly bankService: IBankService
    ) { }

    async execute(command: MarkRefundPaidOutCommand): Promise<void> {
        const refund = await this.refundRepository.findById(command.refundId);
        if (!refund) throw new Error("Refund request not found.");

        if (refund.getStatus() !== 'Approved') {
            throw new Error("Only approved refunds can be paid out.");
        }

        // 1. Process the physical bank transfer via SPI
        // (Note: you will need a getAmount() method on your Refund aggregate)
        const bankResult = await this.bankService.processRefundTransfer(refund.getId(), {
            amount: refund.getAmount().getAmount(),
            currency: refund.getAmount().getCurrency()
        });

        if (!bankResult.success) {
            throw new Error("Bank transfer failed. Please try again.");
        }

        // 2. Finalize the Refund aggregate with the receipt string
        refund.markAsPaidOut(bankResult.bankReference);

        // 3. Save the final state
        await this.refundRepository.save(refund);
    }
}