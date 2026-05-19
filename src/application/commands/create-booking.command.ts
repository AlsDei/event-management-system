import { Booking } from '../../domain/aggregates/booking/booking.aggregate';
import { Money } from '../../domain/value-objects/money.vo';
import { BookingSummaryResponse } from '../dtos/customer/customer.dtos';
import { IBookingRepository } from '../../domain/repositories/booking.repository';

// Note: You will need a basic IEventRepository interface to fetch event validation data
import { IEventRepository } from '../../domain/repositories/event.repository';

/**
 * COMMAND: Carries the data required to perform the action.
 * (customerId usually comes from the authenticated user token in the API controller).
 */
export class CreateBookingCommand {
    constructor(
        public readonly customerId: string,
        public readonly eventId: string,
        public readonly ticketCategoryId: string,
        public readonly quantity: number
    ) { }
}

/**
 * HANDLER: Orchestrates the domain logic for US 8 & 9.
 */
export class CreateBookingCommandHandler {
    constructor(
        private readonly bookingRepository: IBookingRepository,
        private readonly eventRepository: IEventRepository
    ) { }

    async execute(command: CreateBookingCommand): Promise<BookingSummaryResponse> {
        // 1. Fetch the Event to ensure it exists and is Published
        const event = await this.eventRepository.findById(command.eventId);
        if (!event) {
            throw new Error("Event not found.");
        }

        if (event.getStatus() !== 'Published') {
            throw new Error("Cannot book tickets for an event that is not published.");
        }

        // ---
        // NOTE: In your real implementation, you will extract the TicketCategory from the Event
        // to check if it's active, if the sales period is valid, and to get its real price.
        // For now, we mock the extracted price so the Booking aggregate can calculate the total.
        // ---
        const extractedUnitPrice = new Money(150000, "IDR");

        // 2. Instantiate the Booking Aggregate.
        // Your domain constructor automatically validates quantity > 0, calculates the total price,
        // sets the 15-minute deadline, and fires the TicketReserved event!
        const booking = new Booking(
            command.customerId,
            command.eventId,
            command.ticketCategoryId,
            command.quantity,
            extractedUnitPrice
        );

        // 3. Persist the new Booking state
        await this.bookingRepository.save(booking);

        // 4. Construct and return the DTO response (US 9)
        return {
            bookingId: booking.getId(),
            eventId: command.eventId,
            ticketCategoryId: command.ticketCategoryId,
            quantity: booking.getQuantity(),
            unitPrice: { amount: extractedUnitPrice.getAmount(), currency: extractedUnitPrice.getCurrency() },
            totalPrice: {
                amount: booking.getTotalPrice().getAmount(),
                currency: booking.getTotalPrice().getCurrency()
            },
            // Note: You will need to add `getPaymentDeadline()` to your Booking aggregate for this to work!
            paymentDeadline: booking.getPaymentDeadline().toISOString(),
            status: booking.getStatus()
        };
    }
}