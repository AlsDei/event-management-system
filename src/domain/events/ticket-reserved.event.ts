export class TicketReserved {
    constructor(
        public readonly bookingId: string,
        public readonly eventId: string,
        public readonly occurredAt: Date,
        public readonly ticketCategoryId: string,
        public readonly quantity: number,
    ) { }
}
