import { IBookingRepository } from '../repositories/booking.repository';
import { CustomerID } from '../value-objects/customer-id.vo';
import { EventId } from '../value-objects/event-id.vo';

export class BookingEligibilityService {
    constructor(private bookingRepository: IBookingRepository) { }

    async canCustomerBook(customerId: CustomerID, eventId: EventId): Promise<boolean> {
        const activeBookings = await this.bookingRepository.findActiveByCustomer(
            customerId.getValue(),
            eventId.getValue()
        );
        return activeBookings.length === 0; // Return true if no existing booking found
    }
}