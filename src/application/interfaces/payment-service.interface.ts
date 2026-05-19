import { MoneyDto } from '../dtos/customer/customer.dtos';

export interface IPaymentService {
    /**
     * Captures and settles the payment with the external gateway (US 10).
     * * @param bookingId The unique identifier of the booking being paid for.
     * @param amount The expected total price (value + currency) matching the booking.
     * @returns A promise resolving to the transaction status and gateway transaction ID.
     */
    capturePayment(
        bookingId: string,
        amount: MoneyDto
    ): Promise<{ success: boolean; transactionId: string }>;
}