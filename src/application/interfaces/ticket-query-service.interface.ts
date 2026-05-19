// src/application/interfaces/ticket-query-service.interface.ts
import { PurchasedTicketDto } from '../dtos/customer/customer.dtos';

export interface ITicketQueryService {
    /**
     * Fetches all tickets associated with a customer's 'Paid' bookings.
     * Bypasses the domain aggregates for fast, read-only performance.
     */
    getTicketsByCustomer(customerId: string): Promise<PurchasedTicketDto[]>;
}