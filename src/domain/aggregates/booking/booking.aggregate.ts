import { BookingId } from '../../value-objects/booking-id.vo';
import { Money } from '../../value-objects/money.vo';
import { TicketReserved } from '../../events/ticket-reserved.event';
import { BookingPaid } from '../../events/booking-paid.event';
import { BookingExpired } from '../../events/booking-expired.event';

export enum BookingStatus {
    PendingPayment = 'PendingPayment',
    Paid = 'Paid',
    Expired = 'Expired',
    Refunded = 'Refunded',
    RequiresRefund = 'RequiresRefund'
}

export class Booking {
    private id: BookingId;
    private customerId: string;
    private eventId: string;
    private ticketCategoryId: string;
    private quantity: number;
    private totalPrice: Money;
    private status: BookingStatus;
    private paymentDeadline: Date;
    private domainEvents: any[] = [];

    constructor(
        customerId: string,
        eventId: string,
        ticketCategoryId: string,
        quantity: number,
        unitPrice: Money,
        id?: string
    ) {
        // Acceptance Criteria US 8: Quantity must be > 0 
        if (quantity <= 0) {
            throw new Error("Booking quantity must be greater than zero.");
        }

        this.id = new BookingId(id);
        this.customerId = customerId;
        this.eventId = eventId;
        this.ticketCategoryId = ticketCategoryId;
        this.quantity = quantity;
        this.status = BookingStatus.PendingPayment;

        // Acceptance Criteria US 9: Total price = unit price * quantity
        this.totalPrice = unitPrice.multiply(quantity);

        // Acceptance Criteria US 8: 15-minute payment deadline
        this.paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);

        this.domainEvents.push(new TicketReserved(this.id.getValue(), this.eventId, new Date(), this.ticketCategoryId, this.quantity));
    }

    // Business Logic: US 10 - Pay Booking 
    public pay(paymentAmount: Money): void {
        if (this.status !== BookingStatus.PendingPayment) {
            throw new Error("Only pending bookings can be paid.");
        }

        if (new Date() > this.paymentDeadline) {
            throw new Error("Payment deadline has passed.");
        }

        // Acceptance Criteria US 10: Payment must equal total price 
        if (!paymentAmount.equals(this.totalPrice)) {
            throw new Error("Incorrect payment amount.");
        }

        this.status = BookingStatus.Paid;
        this.domainEvents.push(new BookingPaid(this.id.getValue(), new Date()));
    }

    // Business Logic: US 11 - Expire Booking
    public expire(): void {
        if (this.status !== BookingStatus.PendingPayment) {
            throw new Error("Only pending bookings can be expired. A paid booking cannot expire.");
        }

        this.status = BookingStatus.Expired;
        this.domainEvents.push(new BookingExpired(this.id.getValue(), new Date(), this.eventId, this.ticketCategoryId, this.quantity));
    }

    // Business Logic: Mark booking as refunded (called by ApproveRefundCommand)
    public markAsRefunded(): void {
        this.status = BookingStatus.Refunded;
    }

    // Business Logic: Mark booking as requiring refund (called when event is cancelled, US 3)
    public markAsRequiresRefund(): void {
        if (this.status !== BookingStatus.Paid) {
            throw new Error("Only paid bookings can be marked as requiring a refund.");
        }
        this.status = BookingStatus.RequiresRefund;
    }

    // Getters
    getId(): string { return this.id.getValue(); }
    getCustomerId(): string { return this.customerId; }
    getStatus(): BookingStatus { return this.status; }
    getTotalPrice(): Money { return this.totalPrice; }
    getQuantity(): number { return this.quantity; }
    getEventId(): string { return this.eventId; }
    getTicketCategoryId(): string { return this.ticketCategoryId; }
    getPaymentDeadline(): Date { return this.paymentDeadline; }
    getEvents() { return this.domainEvents; }
}