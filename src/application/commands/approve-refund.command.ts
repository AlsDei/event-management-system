import { IRefundRepository } from '../../domain/repositories/refund.repository';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { ITicketRepository } from '../../domain/repositories/ticket.repository';
import { INotificationService } from '../interfaces/notification-service.interface';

export class ApproveRefundCommand {
    constructor(
        public readonly refundId: string,
        public readonly customerContact: string // Used for the notification
    ) { }
}

export class ApproveRefundCommandHandler {
    constructor(
        private readonly refundRepository: IRefundRepository,
        private readonly bookingRepository: IBookingRepository,
        private readonly ticketRepository: ITicketRepository,
        private readonly notificationService: INotificationService
    ) { }

    async execute(command: ApproveRefundCommand): Promise<void> {
        const refund = await this.refundRepository.findById(command.refundId);
        if (!refund) throw new Error("Refund request not found.");

        // 1. Approve the Refund aggregate
        refund.approve();

        // 2. Fetch and update the Booking aggregate
        // (Note: you will need to add a markAsRefunded() method to your Booking aggregate)
        const booking = await this.bookingRepository.findById(refund.getBookingId());
        if (booking) {
            booking.markAsRefunded();
            await this.bookingRepository.save(booking);
        }

        // 3. Fetch and cancel all associated Ticket aggregates
        // (Note: you will need to add a cancel() method to your Ticket aggregate)
        if (booking) {
            const tickets = await this.ticketRepository.findByBookingId(booking.getId());
            for (const ticket of tickets) {
                ticket.cancel();
                await this.ticketRepository.save(ticket);
            }
        }

        // 4. Save the Refund
        await this.refundRepository.save(refund);

        // 5. Notify the customer
        await this.notificationService.sendRefundStatusUpdate(command.customerContact, {
            refundId: refund.getId(),
            status: 'Approved'
        });
    }
}