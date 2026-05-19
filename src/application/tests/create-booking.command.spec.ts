import { CreateBookingCommandHandler, CreateBookingCommand } from '../commands/create-booking.command';

describe('CreateBookingCommandHandler', () => {
    let handler: CreateBookingCommandHandler;
    let mockBookingRepository: any;
    let mockEventRepository: any;

    // This runs before EVERY test to give you a fresh slate
    beforeEach(() => {
        // 1. Create fake (mock) repositories
        mockBookingRepository = {
            save: jest.fn(), // A dummy function that tracks if it was called
        };

        mockEventRepository = {
            findById: jest.fn(),
        };

        // 2. Inject the fakes into your handler
        handler = new CreateBookingCommandHandler(mockBookingRepository, mockEventRepository);
    });

    it('should successfully create a booking and save it', async () => {
        // ARRANGE: Set up the fake data your handler expects
        const command = new CreateBookingCommand('cust-123', 'event-99', 'cat-1', 2);

        // Simulate finding a published event in the database
        const fakeEvent = {
            getStatus: () => 'Published',
        };
        mockEventRepository.findById.mockResolvedValue(fakeEvent);

        // ACT: Run the handler
        const response = await handler.execute(command);

        // ASSERT: Check that everything happened correctly
        expect(mockEventRepository.findById).toHaveBeenCalledWith('event-99'); // Did it look up the right event?
        expect(mockBookingRepository.save).toHaveBeenCalledTimes(1); // Did it save to the DB exactly once?

        // Did it return the right DTO data?
        expect(response.eventId).toBe('event-99');
        expect(response.status).toBe('PendingPayment');
        expect(response.quantity).toBe(2);
        expect(response.totalPrice.amount).toBe(300000); // 2 tickets * 150000 IDR
    });

    it('should throw an error if the event does not exist', async () => {
        // ARRANGE
        const command = new CreateBookingCommand('cust-123', 'event-99', 'cat-1', 2);

        // Simulate the database finding nothing
        mockEventRepository.findById.mockResolvedValue(null);

        // ACT & ASSERT: Expect the handler to throw an error
        await expect(handler.execute(command)).rejects.toThrow("Event not found.");

        // Ensure it NEVER tried to save a bad booking
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw an error if the event is not Published', async () => {
        // ARRANGE
        const command = new CreateBookingCommand('cust-123', 'event-99', 'cat-1', 2);

        // Simulate an event that is still a 'Draft'
        const fakeDraftEvent = {
            getStatus: () => 'Draft',
        };
        mockEventRepository.findById.mockResolvedValue(fakeDraftEvent);

        // ACT & ASSERT
        await expect(handler.execute(command)).rejects.toThrow("Cannot book tickets for an event that is not published.");
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
    });
});