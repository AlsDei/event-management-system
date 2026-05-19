import { ITicketRepository } from '../../domain/repositories/ticket.repository';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventId } from '../../domain/value-objects/event-id.vo';
import { CheckInRequest, CheckInResponse, CheckInErrorCode } from '../dtos/operations/operations.dtos';

/**
 * COMMAND: Carries the data from the Gate Officer's scanner.
 */
export class CheckInTicketCommand implements CheckInRequest {
    constructor(
        public readonly ticketCode: string,
        public readonly eventId: string
    ) { }
}

/**
 * HANDLER: Orchestrates ticket validation and check-in (US 13 & 14).
 */
export class CheckInTicketCommandHandler {
    constructor(
        private readonly ticketRepository: ITicketRepository,
        private readonly eventRepository: IEventRepository
    ) { }

    async execute(command: CheckInTicketCommand): Promise<CheckInResponse> {
        // 1. Validate the ticket exists (US 14)
        const ticket = await this.ticketRepository.findByCode(command.ticketCode);
        if (!ticket) {
            return this.fail('TICKET_NOT_FOUND', "The ticket code is invalid or not found in the system.");
        }

        // 2. Validate the event hasn't been cancelled (US 14)
        const event = await this.eventRepository.findById(command.eventId);
        if (event && event.getStatus() === 'Canceled') { // Matches your EventStatus.Canceled enum
            return this.fail('EVENT_CANCELLED', "This event has been cancelled. Check-in is disabled.");
        }

        // 3. Attempt Domain Check-In Logic
        try {
            const targetEventIdVO = new EventId(command.eventId);

            // This will throw if the ticket is already used, belongs to another event, or is cancelled
            ticket.checkIn(targetEventIdVO);

            // 4. Save the new CheckedIn state
            await this.ticketRepository.save(ticket);

            // 5. Return Success Response
            return {
                success: true,
                ticketCode: ticket.getCode(),
                // Note: In a full implementation, you might fetch the Booking to get the customer's real name.
                customerName: "Verified Participant",
            };

            // Ensure your mapping matches these exact strings thrown by Ticket.ts
        } catch (error: any) {
            const errorMessage = error.message;
            let errorCode: CheckInErrorCode = 'TICKET_CANCELLED'; // Default

            if (errorMessage.includes("does not match the event")) {
                errorCode = 'WRONG_EVENT';
            } else if (errorMessage.includes("already been used")) { // Check your Ticket.ts error message exactly!
                errorCode = 'ALREADY_CHECKED_IN';
            } else if (errorMessage.includes("cancelled")) {
                errorCode = 'TICKET_CANCELLED';
            }
            return this.fail(errorCode, errorMessage);
        }
    }

    // Helper method to keep the code clean
    private fail(errorCode: CheckInErrorCode, errorMessage: string): CheckInResponse {
        return {
            success: false,
            errorCode,
            errorMessage
        };
    }
}