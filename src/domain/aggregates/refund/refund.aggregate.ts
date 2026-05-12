import { RefundId } from '../../value-objects/refund-id.vo';
import { Money } from '../../value-objects/money.vo';
import { RejectionReason } from '../../value-objects/rejection-reason.vo';
import { RefundRequested } from '../../events/refund-requested.event';

export enum RefundStatus {
    Requested = 'Requested',
    Approved = 'Approved',
    Rejected = 'Rejected',
    PaidOut = 'PaidOut'
}

export class Refund {
    private id: RefundId;
    private bookingId: string;
    private amount: Money;
    private status: RefundStatus;
    private rejectionReason?: RejectionReason;
    private domainEvents: any[] = [];

    constructor(bookingId: string, amount: Money, id?: string) {
        this.id = new RefundId(id);
        this.bookingId = bookingId;
        this.amount = amount;
        this.status = RefundStatus.Requested;

        this.domainEvents.push(new RefundRequested(
            this.id.getValue(),
            this.bookingId,
            this.amount.getAmount(),
            new Date()
        ));
    }

    // Business Logic: US 16 - Approve Refund
    public approve(): void {
        if (this.status !== RefundStatus.Requested) {
            throw new Error("Refund cannot be approved if it is not in Requested status.");
        }
        this.status = RefundStatus.Approved;
    }

    // Business Logic: US 17 - Reject Refund
    public reject(reason: string): void {
        if (this.status !== RefundStatus.Requested) {
            throw new Error("Only requested refunds can be rejected.");
        }
        // Encapsulating the rule: "A rejection reason must be provided"
        this.rejectionReason = new RejectionReason(reason);
        this.status = RefundStatus.Rejected;
    }

    // Getters
    getId(): string { return this.id.getValue(); }
    getStatus(): RefundStatus { return this.status; }
    getRejectionReason(): string | undefined { return this.rejectionReason?.getValue(); }
}