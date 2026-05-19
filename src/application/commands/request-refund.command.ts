import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { ITicketRepository } from '../../domain/repositories/ticket.repository';
import { IRefundRepository } from '../../domain/repositories/refund.repository';
import { Refund } from '../../domain/aggregates/refund/refund.aggregate';

export class RequestRefundCommand {
    constructor(public readonly bookingId: string) { }
}

export class RequestRefundCommandHandler {
    constructor(
        private readonly bookingRepository: IBookingRepository,
        private readonly ticketRepository: ITicketRepository,
        private readonly refundRepository: IRefundRepository
    ) { }

    async execute(command: RequestRefundCommand): Promise<string> {
        const booking = await this.bookingRepository.findById(command.bookingId);
        if (!booking) throw new Error("Booking not found.");

        if (booking.getStatus() !== 'Paid') {
            throw new Error("Only paid bookings can be refunded.");
        }

        const tickets = await this.ticketRepository.findByBookingId(command.bookingId);
        const hasCheckedInTickets = tickets.some(t => t.getStatus() === 'CheckedIn');

        if (hasCheckedInTickets) {
            throw new Error("Cannot request a refund because one or more tickets have already been checked in.");
        }

        const refund = new Refund(command.bookingId, booking.getTotalPrice());

        await this.refundRepository.save(refund);

        return refund.getId();
    }
}