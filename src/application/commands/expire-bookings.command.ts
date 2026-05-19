import { IBookingRepository } from '../../domain/repositories/booking.repository';

export class ExpireBookingsCommand {
    constructor(
        public readonly referenceTime: Date = new Date()
    ) { }
}

export class ExpireBookingsCommandHandler {
    constructor(
        private readonly bookingRepository: IBookingRepository
    ) { }

    /**
     * @returns The number of bookings that were successfully expired (useful for system logging).
     */
    async execute(command: ExpireBookingsCommand): Promise<number> {
        // 1. Fetch all bookings stuck in 'PendingPayment' where the deadline has passed
        const expiredBookings = await this.bookingRepository.findExpiredPending(command.referenceTime);

        if (expiredBookings.length === 0) {
            return 0;
        }

        let expiredCount = 0;


        for (const booking of expiredBookings) {
            try {
                booking.expire();

                await this.bookingRepository.save(booking);

                expiredCount++;
            } catch (error) {

                console.error(`Failed to expire booking ${booking.getId()}:`, error);
            }
        }

        return expiredCount;
    }
}