export class RefundPaidOut {
    constructor(
        public readonly refundId: string,
        public readonly paymentReference: string,
        public readonly occurredAt: Date,
    ) { }
}