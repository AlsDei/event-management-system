import { Booking } from "../aggregates/booking/booking.aggregate";
import { Ticket } from "../aggregates/ticket/ticket.aggregate";
import { EventId } from "../value-objects/event-id.vo";
import { ITicketRepository } from "../repositories/ticket.repository";
import { v4 as uuidv4 } from 'uuid';

export class TicketIssuanceService {
    constructor(private ticketRepository: ITicketRepository) { }

    async issueTickets(booking: Booking, eventId: EventId): Promise<Ticket[]> {
        const tickets: Ticket[] = [];
        for (let i = 0; i < booking.getQuantity(); i++) {
            const ticket = new Ticket(uuidv4(), uuidv4(), booking.getId(), eventId);
            await this.ticketRepository.save(ticket);
            tickets.push(ticket);
        }
        return tickets;
    }
}