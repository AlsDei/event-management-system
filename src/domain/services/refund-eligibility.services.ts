import { Booking, BookingStatus } from '../aggregates/booking/booking.aggregate';
import { TicketStatus } from '../aggregates/ticket/ticket.aggregate';
import { ITicketRepository } from '../repositories/ticket.repository';

export class RefundEligibilityService {
    constructor(private ticketRepository: ITicketRepository) { }

    async canRequestRefund(booking: Booking, isEventCancelled: boolean): Promise<boolean> {
        if (booking.getStatus() !== BookingStatus.Paid) return false;

        if (isEventCancelled) return true; // AC: cancelled event always allows refund

        const tickets = await this.ticketRepository.findByBookingId(booking.getId());
        const anyCheckedIn = tickets.some(t => t.getStatus() === TicketStatus.CheckedIn);
        return !anyCheckedIn;
    }
}