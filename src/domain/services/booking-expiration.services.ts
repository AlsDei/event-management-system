import { IBookingRepository } from "../repositories/booking.repository";


export class BookingExpirationService {
    constructor(private bookingRepository: IBookingRepository) { }

    async expireOverdueBookings(): Promise<void> {
        const overdue = await this.bookingRepository.findExpiredPending(new Date());
        for (const booking of overdue) {
            booking.expire(); // domain method already exists
            await this.bookingRepository.save(booking);
        }
    }
}