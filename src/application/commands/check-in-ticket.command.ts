import { ITicketRepository } from '../../domain/repositories/ticket.repository';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventId } from '../../domain/value-objects/event-id.vo';
import { CheckInRequest, CheckInResponse, CheckInErrorCode } from '../dtos/operations/operations.dtos';


export class CheckInTicketCommand implements CheckInRequest {
    constructor(
        public readonly ticketCode: string,
        public readonly eventId: string
    ) { }
}


export class CheckInTicketCommandHandler {
    constructor(
        private readonly ticketRepository: ITicketRepository,
        private readonly eventRepository: IEventRepository
    ) { }

    async execute(command: CheckInTicketCommand): Promise<CheckInResponse> {
        const ticket = await this.ticketRepository.findByCode(command.ticketCode);
        if (!ticket) {
            return this.fail('TICKET_NOT_FOUND', "The ticket code is invalid or not found in the system.");
        }


        const event = await this.eventRepository.findById(command.eventId);
        if (event && event.getStatus() === 'Canceled') {
            return this.fail('EVENT_CANCELLED', "This event has been cancelled. Check-in is disabled.");
        }

        try {
            const targetEventIdVO = new EventId(command.eventId);


            ticket.checkIn(targetEventIdVO);


            await this.ticketRepository.save(ticket);


            return {
                success: true,
                ticketCode: ticket.getCode(),

                customerName: "Verified Participant",
            };

        } catch (error: any) {
            const errorMessage = error.message;
            let errorCode: CheckInErrorCode = 'TICKET_CANCELLED';

            if (errorMessage.includes("does not match the event")) {
                errorCode = 'WRONG_EVENT';
            } else if (errorMessage.includes("already been used")) {
                errorCode = 'ALREADY_CHECKED_IN';
            } else if (errorMessage.includes("cancelled")) {
                errorCode = 'TICKET_CANCELLED';
            }
            return this.fail(errorCode, errorMessage);
        }
    }

    private fail(errorCode: CheckInErrorCode, errorMessage: string): CheckInResponse {
        return {
            success: false,
            errorCode,
            errorMessage
        };
    }
}