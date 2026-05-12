export class TicketCheckedIn {
    constructor(
        public readonly ticketId: string,
        public readonly ticketCode: string,
        public readonly occurredAt: Date,
    ) { }
}