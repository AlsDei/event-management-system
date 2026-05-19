import { Booking } from '../../domain/aggregates/booking/booking.aggregate';
import { Money } from '../../domain/value-objects/money.vo';
import { BookingSummaryResponse } from '../dtos/customer/customer.dtos';
import { IBookingRepository } from '../../domain/repositories/booking.repository';

import { IEventRepository } from '../../domain/repositories/event.repository';

export class CreateBookingCommand {
    constructor(
        public readonly customerId: string,
        public readonly eventId: string,
        public readonly ticketCategoryId: string,
        public readonly quantity: number
    ) { }
}

export class CreateBookingCommandHandler {
    constructor(
        private readonly bookingRepository: IBookingRepository,
        private readonly eventRepository: IEventRepository
    ) { }

    async execute(command: CreateBookingCommand): Promise<BookingSummaryResponse> {

        const event = await this.eventRepository.findById(command.eventId);
        if (!event) {
            throw new Error("Event not found.");
        }

        if (event.getStatus() !== 'Published') {
            throw new Error("Cannot book tickets for an event that is not published.");
        }
        const extractedUnitPrice = new Money(150000, "IDR");

        const booking = new Booking(
            command.customerId,
            command.eventId,
            command.ticketCategoryId,
            command.quantity,
            extractedUnitPrice
        );

        await this.bookingRepository.save(booking);

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
            paymentDeadline: booking.getPaymentDeadline().toISOString(),
            status: booking.getStatus()
        };
    }
}