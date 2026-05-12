export class RefundRequested {
    constructor(
        public readonly refundId: string,
        public readonly bookingId: string,
        public readonly amount: number,
        public readonly occurredAt: Date,
    ) { }
}