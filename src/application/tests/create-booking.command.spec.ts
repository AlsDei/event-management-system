import { CreateBookingCommandHandler, CreateBookingCommand } from '../commands/create-booking.command';

describe('CreateBookingCommandHandler', () => {
    let handler: CreateBookingCommandHandler;
    let mockBookingRepository: any;
    let mockEventRepository: any;

    const createFakeEvent = (overrides: any = {}) => {
        const now = new Date();
        const salesStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        const salesEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

        const fakeCategory = {
            id: 'cat-1',
            isActive: () => true,
            salesSchedule: {
                getStart: () => salesStart,
                getEnd: () => salesEnd,
            },
            quota: { remaining: 100 },
            price: {
                money: {
                    getAmount: () => 150000,
                    getCurrency: () => 'IDR',
                    multiply: (qty: number) => ({
                        getAmount: () => 150000 * qty,
                        getCurrency: () => 'IDR',
                        equals: (other: any) => other.getAmount() === 150000 * qty,
                    }),
                    equals: (other: any) => other.getAmount() === 150000,
                },
            },
            reserveTickets: jest.fn(),
            ...overrides.category,
        };

        return {
            getStatus: () => overrides.status || 'Published',
            getTicketCategories: () => overrides.categories || [fakeCategory],
        };
    };

    beforeEach(() => {
        mockBookingRepository = {
            save: jest.fn(),
            findActiveByCustomer: jest.fn().mockResolvedValue([]),
        };

        mockEventRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        };

        handler = new CreateBookingCommandHandler(mockBookingRepository, mockEventRepository);
    });

    it('should successfully create a booking and save it', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 2);

        mockEventRepository.findById.mockResolvedValue(createFakeEvent());

        const response = await handler.execute(command);

        expect(mockEventRepository.findById).toHaveBeenCalledWith('11111111-2222-4333-8444-555555555555');
        expect(mockBookingRepository.save).toHaveBeenCalledTimes(1);

        expect(response.eventId).toBe('11111111-2222-4333-8444-555555555555');
        expect(response.status).toBe('PendingPayment');
        expect(response.quantity).toBe(2);
        expect(response.totalPrice.amount).toBe(300000);
    });

    it('should throw an error if the event does not exist', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 2);

        mockEventRepository.findById.mockResolvedValue(null);

        await expect(handler.execute(command)).rejects.toThrow("Event not found.");
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw an error if the event is not Published', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 2);

        mockEventRepository.findById.mockResolvedValue(createFakeEvent({ status: 'Draft' }));

        await expect(handler.execute(command)).rejects.toThrow("Cannot book tickets for an event that is not published.");
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw an error if the ticket category is not found', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-999', 2);

        mockEventRepository.findById.mockResolvedValue(createFakeEvent());

        await expect(handler.execute(command)).rejects.toThrow("Ticket category with ID cat-999 not found.");
    });

    it('should throw an error if the ticket category is inactive', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 2);

        const inactiveCategory = { id: 'cat-1', isActive: () => false };
        mockEventRepository.findById.mockResolvedValue(createFakeEvent({ categories: [inactiveCategory] }));

        await expect(handler.execute(command)).rejects.toThrow("This ticket category is no longer available for purchase.");
    });

    it('should throw an error if sales period is not open', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 2);

        const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const futureSalesCategory = {
            id: 'cat-1',
            isActive: () => true,
            salesSchedule: { getStart: () => futureStart, getEnd: () => futureEnd },
            quota: { remaining: 100 },
            price: { money: { getAmount: () => 150000, getCurrency: () => 'IDR' } },
        };
        mockEventRepository.findById.mockResolvedValue(createFakeEvent({ categories: [futureSalesCategory] }));

        await expect(handler.execute(command)).rejects.toThrow("Ticket sales for this category are not currently open.");
    });

    it('should throw an error if quantity exceeds remaining quota', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 50);

        const now = new Date();
        const limitedCategory = {
            id: 'cat-1',
            isActive: () => true,
            salesSchedule: {
                getStart: () => new Date(now.getTime() - 60 * 60 * 1000),
                getEnd: () => new Date(now.getTime() + 60 * 60 * 1000),
            },
            quota: { remaining: 5 },
            price: { money: { getAmount: () => 150000, getCurrency: () => 'IDR' } },
        };
        mockEventRepository.findById.mockResolvedValue(createFakeEvent({ categories: [limitedCategory] }));

        await expect(handler.execute(command)).rejects.toThrow(/exceeds remaining quota/);
    });

    it('should throw an error if customer already has an active booking', async () => {
        const command = new CreateBookingCommand('550e8400-e29b-41d4-a716-446655440000', '11111111-2222-4333-8444-555555555555', 'cat-1', 2);

        mockEventRepository.findById.mockResolvedValue(createFakeEvent());
        mockBookingRepository.findActiveByCustomer.mockResolvedValue([{ id: 'existing-booking' }]);

        await expect(handler.execute(command)).rejects.toThrow("You already have an active booking for this event.");
    });
});
