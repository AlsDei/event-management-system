import { Ticket } from '../aggregates/ticket/ticket.aggregate';

export interface ITicketRepository {
    save(ticket: Ticket): Promise<void>;
    findById(id: string): Promise<Ticket | null>;

    //US 13 & 14: Gate officers must validate a ticket using its unique code.
    findByCode(code: string): Promise<Ticket | null>;
    findByBookingId(bookingId: string): Promise<Ticket[]>;
}