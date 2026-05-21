import { Booking } from '../aggregates/booking/booking.aggregate';

export interface IBookingRepository {
    save(booking: Booking): Promise<void>;
    findById(id: string): Promise<Booking | null>;
    // User Story 8: "A customer cannot have more than one active booking for the same event."
    findActiveByCustomer(customerId: string, eventId: string): Promise<Booking[]>;
    findExpiredPending(referenceTime: Date): Promise<Booking[]>;
    // User Story 3: When event is cancelled, paid bookings must be flagged for refund
    findPaidByEventId(eventId: string): Promise<Booking[]>;
}