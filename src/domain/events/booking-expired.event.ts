export class BookingExpired {
    constructor(
        public readonly bookingId: string,
        public readonly occurredAt: Date,
        public readonly eventId: string,
        public readonly ticketCategoryId: string,
        public readonly quantityToRelease: number,
    ) { }
}
