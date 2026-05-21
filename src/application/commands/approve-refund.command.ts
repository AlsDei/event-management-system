import { IRefundRepository } from '../../domain/repositories/refund.repository';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { ITicketRepository } from '../../domain/repositories/ticket.repository';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { INotificationService } from '../interfaces/notification-service.interface';

export class ApproveRefundCommand {
    constructor(
        public readonly refundId: string,
        public readonly customerContact: string
    ) { }
}

export class ApproveRefundCommandHandler {
    constructor(
        private readonly refundRepository: IRefundRepository,
        private readonly bookingRepository: IBookingRepository,
        private readonly ticketRepository: ITicketRepository,
        private readonly eventRepository: IEventRepository,
        private readonly notificationService: INotificationService
    ) { }

    async execute(command: ApproveRefundCommand): Promise<void> {
        const refund = await this.refundRepository.findById(command.refundId);
        if (!refund) throw new Error("Refund request not found.");

        refund.approve();

        const booking = await this.bookingRepository.findById(refund.getBookingId());
        if (booking) {
            booking.markAsRefunded();

            // Release the reserved quota back to the ticket category
            const event = await this.eventRepository.findById(booking.getEventId());
            if (event) {
                const category = event.getTicketCategories().find(
                    cat => cat.id === booking.getTicketCategoryId()
                );
                if (category) {
                    category.releaseTickets(booking.getQuantity());
                    await this.eventRepository.save(event);
                }
            }

            await this.bookingRepository.save(booking);
        }

        if (booking) {
            const tickets = await this.ticketRepository.findByBookingId(booking.getId());
            for (const ticket of tickets) {
                ticket.cancel();
                await this.ticketRepository.save(ticket);
            }
        }

        await this.refundRepository.save(refund);

        await this.notificationService.sendRefundStatusUpdate(command.customerContact, {
            refundId: refund.getId(),
            status: 'Approved'
        });
    }
}
