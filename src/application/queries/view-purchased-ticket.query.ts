import { ITicketQueryService } from '../interfaces/ticket-query-service.interface';
import { PurchasedTicketsResponse } from '../dtos/customer/customer.dtos';

/**
 * QUERY: Carries the search parameters.
 */
export class ViewPurchasedTicketsQuery {
    constructor(
        public readonly customerId: string
    ) { }
}

/**
 * HANDLER: Orchestrates fetching the read-only data (US 12).
 */
export class ViewPurchasedTicketsQueryHandler {
    constructor(
        private readonly queryService: ITicketQueryService
    ) { }

    async execute(query: ViewPurchasedTicketsQuery): Promise<PurchasedTicketsResponse> {
        // 1. Fetch the flat DTO data directly via the read service
        // In Week 12, your infrastructure layer will implement this using a SQL JOIN
        // between the Bookings and Tickets tables, filtering by customerId and status = 'Paid'.
        const purchasedTickets = await this.queryService.getTicketsByCustomer(query.customerId);

        // 2. Wrap and return the final DTO payload
        return {
            customerId: query.customerId,
            tickets: purchasedTickets
        };
    }
}