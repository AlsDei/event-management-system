export class RefundRejected {
    constructor(
        public readonly refundId: string,
        public readonly reason: string,
        public readonly occurredAt: Date,
    ) { }
}