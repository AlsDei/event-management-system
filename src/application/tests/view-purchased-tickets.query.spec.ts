import { ViewPurchasedTicketsQueryHandler, ViewPurchasedTicketsQuery } from '../queries/view-purchased-ticket.query';

describe('ViewPurchasedTicketsQueryHandler', () => {
    let handler: ViewPurchasedTicketsQueryHandler;
    let mockQueryService: any;

    beforeEach(() => {
        mockQueryService = { getTicketsByCustomer: jest.fn() };
        handler = new ViewPurchasedTicketsQueryHandler(mockQueryService);
    });

    it('should return a PurchasedTicketsResponse with the correct customerId and tickets', async () => {
        const fakeTickets = [
            { ticketId: 'tkt-1', ticketCode: 'TKT-001', eventName: 'Concert A', ticketCategoryName: 'VIP', status: 'Active' as const },
            { ticketId: 'tkt-2', ticketCode: 'TKT-002', eventName: 'Concert A', ticketCategoryName: 'Regular', status: 'CheckedIn' as const },
        ];
        mockQueryService.getTicketsByCustomer.mockResolvedValue(fakeTickets);

        const result = await handler.execute(new ViewPurchasedTicketsQuery('customer-123'));

        expect(result.customerId).toBe('customer-123');
        expect(result.tickets).toHaveLength(2);
        expect(result.tickets).toEqual(fakeTickets);
        expect(mockQueryService.getTicketsByCustomer).toHaveBeenCalledWith('customer-123');
    });

    it('should return an empty tickets array if the customer has no tickets', async () => {
        mockQueryService.getTicketsByCustomer.mockResolvedValue([]);

        const result = await handler.execute(new ViewPurchasedTicketsQuery('customer-no-tickets'));

        expect(result.customerId).toBe('customer-no-tickets');
        expect(result.tickets).toEqual([]);
    });

    it('should pass the exact customerId to the query service', async () => {
        mockQueryService.getTicketsByCustomer.mockResolvedValue([]);

        await handler.execute(new ViewPurchasedTicketsQuery('customer-xyz'));

        expect(mockQueryService.getTicketsByCustomer).toHaveBeenCalledWith('customer-xyz');
    });

    it('should propagate errors thrown by the query service', async () => {
        mockQueryService.getTicketsByCustomer.mockRejectedValue(new Error('Database connection error'));

        await expect(handler.execute(new ViewPurchasedTicketsQuery('customer-123')))
            .rejects.toThrow('Database connection error');
    });
});
