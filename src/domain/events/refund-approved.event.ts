export class RefundApproved {
    constructor(
        public readonly refundId: string,
        public readonly bookingId: string,
        public readonly occurredAt: Date,
    ) { }
}