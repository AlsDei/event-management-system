import { IBookingRepository } from '../../domain/repositories/booking.repository';

/**
 * COMMAND: Carries the execution context. 
 * Since this is an automated job, it doesn't need customer inputs.
 */
export class ExpireBookingsCommand {
    constructor(
        public readonly referenceTime: Date = new Date() // Defaults to exactly right now
    ) { }
}

/**
 * HANDLER: Finds all overdue pending bookings and expires them (US 11).
 */
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
            return 0; // Nothing to clean up!
        }

        let expiredCount = 0;

        // 2. Loop through and expire each one
        for (const booking of expiredBookings) {
            try {
                // Execute the Domain Logic
                // This changes status to 'Expired' and fires the 'BookingExpired' domain event
                booking.expire();

                // 3. Save the updated state to the database
                await this.bookingRepository.save(booking);

                expiredCount++;
            } catch (error) {
                // If one specific booking fails to save, we log it and continue the loop
                // so the rest of the batch can still be processed successfully.
                console.error(`Failed to expire booking ${booking.getId()}:`, error);
            }
        }

        return expiredCount;
    }
}