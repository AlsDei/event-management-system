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
        public readonly customerContact: string
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
        const booking = await this.bookingRepository.findById(command.bookingId);
        if (!booking) {
            throw new Error("Booking not found.");
        }

        const paymentMoneyVO = new Money(command.paymentAmount.amount, command.paymentAmount.currency);

        const paymentResult = await this.paymentService.capturePayment(command.bookingId, command.paymentAmount);
        if (!paymentResult.success) {
            throw new Error("Payment gateway rejected the transaction.");
        }

        booking.pay(paymentMoneyVO);

        const generatedTickets: Ticket[] = [];
        const purchasedTicketDtos: PurchasedTicketDto[] = [];

        const eventIdVO = new EventId(booking.getEventId());

        // Fetch event details for ticket information
        const event = await this.eventRepository.findById(booking.getEventId());
        const eventName = event ? event.getName() : 'Unknown Event';
        const ticketCategory = event
            ? event.getTicketCategories().find((cat: any) => cat.id === booking.getTicketCategoryId())
            : null;
        const ticketCategoryName = ticketCategory ? ticketCategory.name : 'Unknown Category';

        for (let i = 0; i < booking.getQuantity(); i++) {
            const ticketId = randomUUID();
            const uniqueCode = randomUUID();

            const newTicket = new Ticket(ticketId, uniqueCode, booking.getId(), eventIdVO);
            generatedTickets.push(newTicket);

            purchasedTicketDtos.push({
                ticketId: ticketId,
                ticketCode: uniqueCode,
                eventName: eventName,
                ticketCategoryName: ticketCategoryName,
                status: newTicket.getStatus()
            });
        }

        await this.bookingRepository.save(booking);

        for (const ticket of generatedTickets) {
            await this.ticketRepository.save(ticket);
        }

        await this.notificationService.sendTicketNotification(command.customerContact, purchasedTicketDtos);
    }
}