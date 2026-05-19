import { MoneyDto } from '../dtos/customer/customer.dtos';

export interface IBankService {
    /**
     * Dispatches a real-time fund transfer to the customer's destination bank account (US 18).
     * * @param refundId The identifier of the approved refund aggregate.
     * @param amount The refund total amount to be credited back.
     * @returns A promise resolving to the execution status and a unique bank receipt/reference.
     */
    processRefundTransfer(
        refundId: string,
        amount: MoneyDto
    ): Promise<{ success: boolean; bankReference: string }>;
}