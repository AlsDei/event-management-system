import { Booking } from '../../domain/aggregates/booking/booking.aggregate';
import { BookingSummaryResponse } from '../dtos/customer/customer.dtos';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { BookingEligibilityService } from '../../domain/services/booking-eligibility.services';
import { CustomerID } from '../../domain/value-objects/customer-id.vo';
import { EventId } from '../../domain/value-objects/event-id.vo';

export class CreateBookingCommand {
    constructor(
        public readonly customerId: string,
        public readonly eventId: string,
        public readonly ticketCategoryId: string,
        public readonly quantity: number
    ) { }
}

export class CreateBookingCommandHandler {
    private readonly eligibilityService: BookingEligibilityService;

    constructor(
        private readonly bookingRepository: IBookingRepository,
        private readonly eventRepository: IEventRepository,
    ) {
        this.eligibilityService = new BookingEligibilityService(bookingRepository);
    }

    async execute(command: CreateBookingCommand): Promise<BookingSummaryResponse> {
        // 1. Load and validate event
        const event = await this.eventRepository.findById(command.eventId);
        if (!event) {
            throw new Error("Event not found.");
        }

        // US 8 AC: "A booking can only be created for an event with the status Published."
        if (event.getStatus() !== 'Published') {
            throw new Error("Cannot book tickets for an event that is not published.");
        }

        // 2. Find and validate the ticket category
        const category = event.getTicketCategories().find(
            cat => cat.id === command.ticketCategoryId
        );

        if (!category) {
            throw new Error(`Ticket category with ID ${command.ticketCategoryId} not found.`);
        }

        // US 8 AC: "A booking can only be created for an active ticket category."
        if (!category.isActive()) {
            throw new Error("This ticket category is no longer available for purchase.");
        }

        // US 8 AC: "A booking can only be created within the ticket sales period."
        const now = new Date();
        const salesStart = category.salesSchedule.getStart();
        const salesEnd = category.salesSchedule.getEnd();

        if (now < salesStart || now > salesEnd) {
            throw new Error("Ticket sales for this category are not currently open.");
        }

        // US 8 AC: "The ticket quantity must not exceed the remaining ticket quota."
        if (command.quantity > category.quota.remaining) {
            throw new Error(
                `Requested quantity (${command.quantity}) exceeds remaining quota (${category.quota.remaining}).`
            );
        }

        // US 8 AC: "A customer cannot have more than one active booking for the same event."
        const customerIdVO = CustomerID.create(command.customerId);
        const eventIdVO = new EventId(command.eventId);
        const canBook = await this.eligibilityService.canCustomerBook(customerIdVO, eventIdVO);

        if (!canBook) {
            throw new Error("You already have an active booking for this event.");
        }

        // 3. Reserve tickets from the category quota (decrements remaining)
        category.reserveTickets(command.quantity);

        // 4. Create the booking using the real unit price from the category
        const unitPrice = category.price.money;

        const booking = new Booking(
            command.customerId,
            command.eventId,
            command.ticketCategoryId,
            command.quantity,
            unitPrice
        );

        // 5. Persist both the updated event (with decremented quota) and the new booking
        await this.eventRepository.save(event);
        await this.bookingRepository.save(booking);

        return {
            bookingId: booking.getId(),
            eventId: command.eventId,
            ticketCategoryId: command.ticketCategoryId,
            quantity: booking.getQuantity(),
            unitPrice: { amount: unitPrice.getAmount(), currency: unitPrice.getCurrency() },
            totalPrice: {
                amount: booking.getTotalPrice().getAmount(),
                currency: booking.getTotalPrice().getCurrency()
            },
            paymentDeadline: booking.getPaymentDeadline().toISOString(),
            status: booking.getStatus()
        };
    }
}
