import { Booking } from '../aggregates/booking/booking.aggregate';
import { ITicketRepository } from '../repositories/ticket.repository';

export class RefundEligibilityService {
    constructor(private readonly ticketRepository: ITicketRepository) { }

    async canRequestRefund(booking: Booking): Promise<boolean> {
        const tickets = await this.ticketRepository.findByBookingId(booking.getId());
        const hasCheckedInTickets = tickets.some(t => t.getStatus() === 'CheckedIn');
        return !hasCheckedInTickets;
    }
}