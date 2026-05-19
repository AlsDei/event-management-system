import { BookingId } from '../../value-objects/booking-id.vo';
import { Money } from '../../value-objects/money.vo';
import { TicketReserved } from '../../events/ticket-reserved.event';
import { BookingPaid } from '../../events/booking-paid.event';
import { BookingExpired } from '../../events/booking-expired.event';

export enum BookingStatus {
    PendingPayment = 'PendingPayment',
    Paid = 'Paid',
    Expired = 'Expired',
    Refunded = 'Refunded'
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

    public getQuantity(): number {
        return this.quantity;
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
        if (this.status === BookingStatus.Paid) {
            throw new Error("A paid booking cannot expire.");
        }

        this.status = BookingStatus.Expired;
        this.domainEvents.push(new BookingExpired(this.id.getValue(), new Date(), this.eventId, this.ticketCategoryId, this.quantity));
    }

    // Getters
    getId(): string { return this.id.getValue(); }
    getStatus(): BookingStatus { return this.status; }
    getTotalPrice(): Money { return this.totalPrice; }
    getEvents() { return this.domainEvents; }
    getPaymentDeadline(): Date { return this.paymentDeadline; }
    getEventId(): string { return this.eventId; }
    markAsRefunded(): void {
        this.status = BookingStatus.Refunded;
    }
}