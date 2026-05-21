import { RefundId } from '../../value-objects/refund-id.vo';
import { Money } from '../../value-objects/money.vo';
import { RejectionReason } from '../../value-objects/rejection-reason.vo';
import { RefundRequested } from '../../events/refund-requested.event';
import { RefundApproved } from "../../events/refund-approved.event";
import { RefundRejected } from "../../events/refund-rejected.event";
import { RefundPaidOut } from "../../events/refund-paid-out.event";

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

    public approve(): void {
        if (this.status !== RefundStatus.Requested) {
            throw new Error("Refund cannot be approved if not in Requested status.");
        }
        this.status = RefundStatus.Approved;
        this.domainEvents.push(new RefundApproved(this.id.getValue(), this.bookingId, new Date()));
    }

    public reject(reason: string): void {
        if (this.status !== RefundStatus.Requested) {
            throw new Error("Refund cannot be rejected if not in Requested status.");
        }
        this.rejectionReason = new RejectionReason(reason);
        this.status = RefundStatus.Rejected;
        this.domainEvents.push(new RefundRejected(this.id.getValue(), reason, new Date()));
    }

    public markAsPaidOut(paymentReference: string): void {
        if (this.status !== RefundStatus.Approved) {
            throw new Error("Only approved refunds can be marked as paid out.");
        }
        this.status = RefundStatus.PaidOut;
        this.domainEvents.push(new RefundPaidOut(this.id.getValue(), paymentReference, new Date()));
    }

    // Getters
    getId(): string { return this.id.getValue(); }
    getStatus(): RefundStatus { return this.status; }
    getBookingId(): string { return this.bookingId; }
    getAmount(): Money { return this.amount; }
    getRejectionReason(): string | undefined { return this.rejectionReason?.getValue(); }
}