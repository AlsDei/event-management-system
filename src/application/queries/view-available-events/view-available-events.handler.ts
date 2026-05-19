// view-available-events.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ViewAvailableEventsQuery } from './view-available-events.query';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { EventListResponse, EventListItemResponse, MoneyDto } from '../../dtos/customer/customer.dtos';

@QueryHandler(ViewAvailableEventsQuery)
export class ViewAvailableEventsHandler implements IQueryHandler<ViewAvailableEventsQuery> {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(query: ViewAvailableEventsQuery): Promise<EventListResponse> {
    let events = await this.eventRepository.findAllPublished();

    // Apply optional filters
    if (query.fromDate) {
      const from = new Date(query.fromDate);
      events = events.filter((e) => e.getSchedule().getStart() >= from);
    }

    if (query.toDate) {
      const to = new Date(query.toDate);
      events = events.filter((e) => e.getSchedule().getStart() <= to);
    }

    if (query.location) {
      const loc = query.location.toLowerCase();
      events = events.filter((e) => e.getLocation().toLowerCase().includes(loc));
    }

    const items: EventListItemResponse[] = events.map((event) => {
      const categories = event.getTicketCategories().filter((c) => c.isActive());
      let lowestPrice: MoneyDto = { amount: 0, currency: 'IDR' };

      if (categories.length > 0) {
        const sorted = categories.sort(
          (a, b) => a.price.money.getAmount() - b.price.money.getAmount(),
        );
        lowestPrice = {
          amount: sorted[0].price.money.getAmount(),
          currency: sorted[0].price.money.getCurrency(),
        };
      }

      return {
        eventId: event.getId(),
        name: event.getName(),
        startDate: event.getSchedule().getStart().toISOString(),
        endDate: event.getSchedule().getEnd().toISOString(),
        location: event.getLocation(),
        lowestPrice,
      };
    });

    return {
      events: items,
      total: items.length,
    };
  }
}
