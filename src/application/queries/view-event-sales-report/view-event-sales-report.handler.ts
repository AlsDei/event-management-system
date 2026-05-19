// view-event-sales-report.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ViewEventSalesReportQuery } from './view-event-sales-report.query';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IBookingRepository } from '../../../domain/repositories/booking.repository';
import {
  SalesReportResponse,
  CategorySalesDto,
  BookingStatusCountsDto,
} from '../../dtos/operations/operations.dtos';
import { MoneyDto } from '../../dtos/customer/customer.dtos';
import { BookingStatus } from '../../../domain/aggregates/booking/booking.aggregate';

@QueryHandler(ViewEventSalesReportQuery)
export class ViewEventSalesReportHandler implements IQueryHandler<ViewEventSalesReportQuery> {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(query: ViewEventSalesReportQuery): Promise<SalesReportResponse> {
    const event = await this.eventRepository.findById(query.eventId);

    if (!event) {
      throw new Error(`Event with ID ${query.eventId} not found.`);
    }

    const categories = event.getTicketCategories();

    const categorySales: CategorySalesDto[] = categories.map((cat) => {
      const ticketsSold = cat.quota.total - cat.quota.remaining;
      const categoryRevenue: MoneyDto = {
        amount: cat.price.money.getAmount() * ticketsSold,
        currency: cat.price.money.getCurrency(),
      };

      return {
        ticketCategoryId: cat.id,
        categoryName: cat.name,
        totalQuota: cat.quota.total,
        ticketsSold,
        categoryRevenue,
      };
    });

    // Aggregate booking status counts
    // Note: In a full implementation, bookings would be loaded from the repository.
    // For now, we derive what we can from ticket category quota data.
    const bookingCounts: BookingStatusCountsDto = {
      pendingPayment: 0,
      paid: 0,
      expired: 0,
      refunded: 0,
    };

    const totalRevenueAmount = categorySales.reduce(
      (sum, cs) => sum + cs.categoryRevenue.amount,
      0,
    );

    const currency = categories.length > 0
      ? categories[0].price.money.getCurrency()
      : 'IDR';

    const totalRevenue: MoneyDto = {
      amount: totalRevenueAmount,
      currency,
    };

    return {
      eventId: event.getId(),
      eventName: event.getName(),
      categorySales,
      bookingCounts,
      totalRevenue,
    };
  }
}
