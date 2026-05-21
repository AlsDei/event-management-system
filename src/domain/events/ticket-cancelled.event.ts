export class TicketCancelled {
    constructor(
        public readonly ticketId: string,
        public readonly bookingId: string,
        public readonly occurredAt: Date
    ) { }
}