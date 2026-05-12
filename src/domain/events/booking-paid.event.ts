export class BookingPaid {
    constructor(
        public readonly bookingId: string,
        public readonly occurredAt: Date,
    ) { }
}
