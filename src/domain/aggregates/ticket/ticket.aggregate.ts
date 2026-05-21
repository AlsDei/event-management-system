import { TicketCode } from '../../value-objects/ticket-id.vo';
import { TicketCheckedIn } from '../../events/ticket-checked-in.event';
import { TicketCancelled } from '../../events/ticket-cancelled.event';
import { EventId } from '../../value-objects/event-id.vo';

export enum TicketStatus {
    Active = 'Active',
    CheckedIn = 'CheckedIn',
    Cancelled = 'Cancelled'
}

export class Ticket {
    private id: string;
    private ticketCode: TicketCode;
    private bookingId: string;
    private eventId: EventId;
    private status: TicketStatus;
    private domainEvents: any[] = [];

    constructor(id: string, code: string, bookingId: string, eventId: EventId) {
        this.id = id;
        this.ticketCode = new TicketCode(code);
        this.bookingId = bookingId;
        this.eventId = eventId;
        this.status = TicketStatus.Active;
    }

    // Acceptance Criteria for US 13: Check In Logic [4]
    public checkIn(targetEventId: EventId): void {
        // 1. Must match the event
        if (!this.eventId.equals(targetEventId)) {
            throw new Error("This ticket does not match the event.");
        }

        // 2. Must be Active
        if (this.status === TicketStatus.Cancelled) {
            throw new Error("This ticket has been cancelled.");
        }

        // 3. Cannot be checked in twice
        if (this.status === TicketStatus.CheckedIn) {
            throw new Error("This ticket has already been used.");
        }

        // Update status and raise event
        this.status = TicketStatus.CheckedIn;
        this.domainEvents.push(new TicketCheckedIn(this.id, this.ticketCode.getValue(), new Date()));
    }

    // Called by ApproveRefundCommand when a refund is approved
    public cancel(): void {
        if (this.status === TicketStatus.CheckedIn) {
            throw new Error("A ticket that has already been checked in cannot be cancelled.");
        }

        if (this.status === TicketStatus.Cancelled) {
            throw new Error("This ticket is already cancelled.");
        }

        this.status = TicketStatus.Cancelled;
        this.domainEvents.push(new TicketCancelled(this.id, this.bookingId, new Date()));
    }

    // Getters
    getId(): string { return this.id; }
    getStatus(): TicketStatus { return this.status; }
    getCode(): string { return this.ticketCode.getValue(); }
    getEvents() { return this.domainEvents; }
}