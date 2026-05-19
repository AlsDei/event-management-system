import { IRefundRepository } from '../../domain/repositories/refund.repository';
import { INotificationService } from '../interfaces/notification-service.interface';

export class RejectRefundCommand {
    constructor(
        public readonly refundId: string,
        public readonly rejectionReason: string,
        public readonly customerContact: string
    ) { }
}

export class RejectRefundCommandHandler {
    constructor(
        private readonly refundRepository: IRefundRepository,
        private readonly notificationService: INotificationService
    ) { }

    async execute(command: RejectRefundCommand): Promise<void> {
        const refund = await this.refundRepository.findById(command.refundId);
        if (!refund) throw new Error("Refund request not found.");

        // Execute domain logic
        refund.reject(command.rejectionReason);

        await this.refundRepository.save(refund);

        // Notify the customer
        await this.notificationService.sendRefundStatusUpdate(command.customerContact, {
            refundId: refund.getId(),
            status: 'Rejected',
            reason: command.rejectionReason
        });
    }
}