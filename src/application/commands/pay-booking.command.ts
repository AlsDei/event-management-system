import { randomUUID } from 'crypto';
import { Ticket } from '../../domain/aggregates/ticket/ticket.aggregate';
import { MoneyDto, PurchasedTicketDto } from '../dtos/customer/customer.dtos';
import { Money } from '../../domain/value-objects/money.vo';
import { EventId } from '../../domain/value-objects/event-id.vo';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { ITicketRepository } from '../../domain/repositories/ticket.repository';
import { IPaymentService } from '../interfaces/payment-service.interface';
import { INotificationService } from '../interfaces/notification-service.interface';
import { IEventRepository } from '../../domain/repositories/event.repository';

/**
 * COMMAND: Carries the data to pay for a booking.
 */
export class PayBookingCommand {
    constructor(
        public readonly bookingId: string,
        public readonly paymentAmount: MoneyDto,
        public readonly customerContact: string // Used to send the tickets later
    ) { }
}

/**
 * HANDLER: Orchestrates the payment, ticket generation, and notification (US 10).
 */
export class PayBookingCommandHandler {
    constructor(
        private readonly bookingRepository: IBookingRepository,
        private readonly ticketRepository: ITicketRepository,
        private readonly paymentService: IPaymentService,
        private readonly notificationService: INotificationService,
        private readonly eventRepository: IEventRepository
    ) { }

    async execute(command: PayBookingCommand): Promise<void> {
        // 1. Fetch the Booking
        const booking = await this.bookingRepository.findById(command.bookingId);
        if (!booking) {
            throw new Error("Booking not found.");
        }

        // Convert the DTO amount to a Domain Value Object for comparison
        const paymentMoneyVO = new Money(command.paymentAmount.amount, command.paymentAmount.currency);

        // 2. Process external payment FIRST
        const paymentResult = await this.paymentService.capturePayment(command.bookingId, command.paymentAmount);
        if (!paymentResult.success) {
            throw new Error("Payment gateway rejected the transaction.");
        }

        // 3. Execute Domain Logic: This will throw if it's past 15 mins or amounts don't match
        booking.pay(paymentMoneyVO);

        // 4. Spawn the Ticket Aggregates
        const generatedTickets: Ticket[] = [];
        const purchasedTicketDtos: PurchasedTicketDto[] = [];

        // We need the raw data to create tickets
        // Note: You will need to add `getEventId()` to your Booking aggregate
        const eventIdVO = new EventId(booking.getEventId());


        for (let i = 0; i < booking.getQuantity(); i++) {
            // Generate a unique code (e.g., using UUID or a custom generator)
            const uniqueCode = randomUUID();

            const newTicket = new Ticket(uniqueCode, booking.getId(), eventIdVO);
            generatedTickets.push(newTicket);

            // Map to DTO for the notification
            purchasedTicketDtos.push({
                ticketId: uniqueCode, // Assuming code acts as ID for now
                ticketCode: uniqueCode,
                eventName: "Event Name Placeholder", // You'd likely fetch the Event aggregate here to get the real name
                ticketCategoryName: "Category Placeholder",
                status: newTicket.getStatus()
            });
        }

        // 5. Save everything to the database
        await this.bookingRepository.save(booking);

        // Save all spawned tickets
        for (const ticket of generatedTickets) {
            await this.ticketRepository.save(ticket);
        }

        // 6. Side Effect: Dispatch the tickets to the customer
        await this.notificationService.sendTicketNotification(command.customerContact, purchasedTicketDtos);
    }
}