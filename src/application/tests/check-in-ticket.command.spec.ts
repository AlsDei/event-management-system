import { CheckInTicketCommandHandler, CheckInTicketCommand } from '../commands/check-in-ticket.command';

describe('CheckInTicketCommandHandler', () => {
    let handler: CheckInTicketCommandHandler;
    let mockTicketRepository: any;
    let mockEventRepository: any;

    const fakeActiveTicket = () => ({
        getCode: () => '550e8400-e29b-41d4-a716-446655440000',
        checkIn: jest.fn(),
    });

    const fakePublishedEvent = () => ({
        getStatus: () => 'Published',
    });

    beforeEach(() => {
        mockTicketRepository = { findByCode: jest.fn(), save: jest.fn() };
        mockEventRepository = { findById: jest.fn() };

        handler = new CheckInTicketCommandHandler(mockTicketRepository, mockEventRepository);
    });

    it('should return success when ticket is valid and event is active', async () => {

        const ticket = {
            getCode: () => '550e8400-e29b-41d4-a716-446655440000',
            checkIn: jest.fn(),
        };

        mockTicketRepository.findByCode.mockResolvedValue(ticket);

        mockEventRepository.findById.mockResolvedValue({ getStatus: () => 'Published' });

        const result = await handler.execute(new CheckInTicketCommand('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'));

        expect(result.success).toBe(true);

    });

    it('should return TICKET_NOT_FOUND if ticket code does not exist', async () => {
        mockTicketRepository.findByCode.mockResolvedValue(null);

        const result = await handler.execute(new CheckInTicketCommand('INVALID-CODE', '550e8400-e29b-41d4-a716-446655440000'));

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('TICKET_NOT_FOUND');
        expect(mockTicketRepository.save).not.toHaveBeenCalled();
    });

    it('should return EVENT_CANCELLED if the event has been cancelled', async () => {
        mockTicketRepository.findByCode.mockResolvedValue(fakeActiveTicket());
        mockEventRepository.findById.mockResolvedValue({ getStatus: () => 'Canceled' });

        const result = await handler.execute(new CheckInTicketCommand('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'));

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('EVENT_CANCELLED');
    });

    it('should return ALREADY_CHECKED_IN if domain throws "already been used"', async () => {

        const ticket = {
            getCode: () => '550e8400-e29b-41d4-a716-446655440000',
            checkIn: jest.fn().mockImplementation(() => {
                throw new Error("already been used");
            })
        };

        mockTicketRepository.findByCode.mockResolvedValue(ticket);
        mockEventRepository.findById.mockResolvedValue({ getStatus: () => 'Published' });

        const result = await handler.execute(new CheckInTicketCommand('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'));

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_CHECKED_IN');
    });

    it('should return WRONG_EVENT if domain throws "does not match the event"', async () => {
        const ticket = fakeActiveTicket();
        ticket.checkIn.mockImplementation(() => { throw new Error('Ticket does not match the event.'); });
        mockTicketRepository.findByCode.mockResolvedValue(ticket);
        mockEventRepository.findById.mockResolvedValue(fakePublishedEvent());

        const result = await handler.execute(new CheckInTicketCommand('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'));

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('WRONG_EVENT');
    });

    it('should return TICKET_CANCELLED if domain throws "cancelled"', async () => {
        const ticket = fakeActiveTicket();
        ticket.checkIn.mockImplementation(() => { throw new Error('This ticket has been cancelled.'); });
        mockTicketRepository.findByCode.mockResolvedValue(ticket);
        mockEventRepository.findById.mockResolvedValue(fakePublishedEvent());

        const result = await handler.execute(new CheckInTicketCommand('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'));

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('TICKET_CANCELLED');
    });

    it('should still allow check-in if event is not found (no event validation block)', async () => {
        const ticket = fakeActiveTicket();
        mockTicketRepository.findByCode.mockResolvedValue(ticket);
        mockEventRepository.findById.mockResolvedValue(null); // event not found

        const result = await handler.execute(new CheckInTicketCommand('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'));

        // Handler only blocks if event status === 'Canceled', so null event should pass through
        expect(result.success).toBe(true);
    });
});
