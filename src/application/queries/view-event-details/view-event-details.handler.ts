// view-event-details.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ViewEventDetailsQuery } from './view-event-details.query';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import {
  EventDetailResponse,
  TicketCategoryDetailDto,
  TicketCategoryDisplayStatus,
} from '../../dtos/customer/customer.dtos';

@QueryHandler(ViewEventDetailsQuery)
export class ViewEventDetailsHandler implements IQueryHandler<ViewEventDetailsQuery> {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(query: ViewEventDetailsQuery): Promise<EventDetailResponse> {
    const event = await this.eventRepository.findById(query.eventId);

    if (!event) {
      throw new Error(`Event with ID ${query.eventId} not found.`);
    }

    const now = new Date();

    const ticketCategories: TicketCategoryDetailDto[] = event
      .getTicketCategories()
      .map((cat) => {
        let displayStatus: TicketCategoryDisplayStatus;

        if (!cat.isActive()) {
          displayStatus = 'SalesClosed';
        } else if (cat.quota.remaining <= 0) {
          displayStatus = 'SoldOut';
        } else if (now < cat.salesSchedule.getStart()) {
          displayStatus = 'ComingSoon';
        } else if (now > cat.salesSchedule.getEnd()) {
          displayStatus = 'SalesClosed';
        } else {
          displayStatus = 'Available';
        }

        return {
          ticketCategoryId: cat.id,
          name: cat.name,
          price: {
            amount: cat.price.money.getAmount(),
            currency: cat.price.money.getCurrency(),
          },
          totalQuota: cat.quota.total,
          remainingQuota: cat.quota.remaining,
          salesStartDate: cat.salesSchedule.getStart().toISOString(),
          salesEndDate: cat.salesSchedule.getEnd().toISOString(),
          displayStatus,
        };
      });

    return {
      eventId: event.getId(),
      name: event.getName(),
      description: event.getDescription(),
      startDate: event.getSchedule().getStart().toISOString(),
      endDate: event.getSchedule().getEnd().toISOString(),
      location: event.getLocation(),
      organizerName: event.getOrganizer(),
      ticketCategories,
    };
  }
}
