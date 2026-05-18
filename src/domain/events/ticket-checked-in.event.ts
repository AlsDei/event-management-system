export class TicketCheckedIn {
    constructor(
        public readonly bookingId: string,
        public readonly ticketCode: string,
        public readonly occurredAt: Date,
    ) { }
}