import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { IEventRepository } from '../../domain/repositories/event.repository';

export class ExpireBookingsCommand {
    constructor(
        public readonly referenceTime: Date = new Date()
    ) { }
}

export class ExpireBookingsCommandHandler {
    constructor(
        private readonly bookingRepository: IBookingRepository,
        private readonly eventRepository: IEventRepository
    ) { }

    /**
     * @returns The number of bookings that were successfully expired (useful for system logging).
     */
    async execute(command: ExpireBookingsCommand): Promise<number> {
        const expiredBookings = await this.bookingRepository.findExpiredPending(command.referenceTime);

        if (expiredBookings.length === 0) {
            return 0;
        }

        let expiredCount = 0;

        for (const booking of expiredBookings) {
            try {
                booking.expire();

                // Release the reserved quota back to the ticket category
                const event = await this.eventRepository.findById(booking.getEventId());
                if (event) {
                    const category = event.getTicketCategories().find(
                        cat => cat.id === booking.getTicketCategoryId()
                    );
                    if (category) {
                        category.releaseTickets(booking.getQuantity());
                        await this.eventRepository.save(event);
                    }
                }

                await this.bookingRepository.save(booking);

                expiredCount++;
            } catch (error) {
                console.error(`Failed to expire booking ${booking.getId()}:`, error);
            }
        }

        return expiredCount;
    }
}
