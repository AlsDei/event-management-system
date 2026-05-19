// view-participant-list.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ViewParticipantListQuery } from './view-participant-list.query';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { ITicketRepository } from '../../../domain/repositories/ticket.repository';
import { IBookingRepository } from '../../../domain/repositories/booking.repository';
import {
  ParticipantListResponse,
  ParticipantDto,
} from '../../dtos/operations/operations.dtos';

@QueryHandler(ViewParticipantListQuery)
export class ViewParticipantListHandler implements IQueryHandler<ViewParticipantListQuery> {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly ticketRepository: ITicketRepository,
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(query: ViewParticipantListQuery): Promise<ParticipantListResponse> {
    const event = await this.eventRepository.findById(query.eventId);

    if (!event) {
      throw new Error(`Event with ID ${query.eventId} not found.`);
    }

    // Note: In a full implementation, we would query tickets by eventId.
    // The current ITicketRepository exposes findByBookingId.
    // This handler provides the structural contract; the infrastructure
    // layer will implement the actual cross-aggregate query.
    const participants: ParticipantDto[] = [];

    return {
      eventId: event.getId(),
      eventName: event.getName(),
      participants,
      totalParticipants: participants.length,
    };
  }
}
