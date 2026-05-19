import { BookingStatus } from '../../../domain/aggregates/booking/booking.aggregate';
import { TicketStatus } from '../../../domain/aggregates/ticket/ticket.aggregate';

export interface EventListItemResponse {
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  lowestPrice: MoneyDto;
}

export interface EventListResponse {
  events: EventListItemResponse[];
  total: number;
}

export interface EventListQueryParams {
  fromDate?: string;
  toDate?: string;
  location?: string;
}

export type TicketCategoryDisplayStatus =
  | 'Available'
  | 'ComingSoon'
  | 'SalesClosed'
  | 'SoldOut';

export interface TicketCategoryDetailDto {
  ticketCategoryId: string;
  name: string;
  price: MoneyDto;
  totalQuota: number;
  remainingQuota: number;
  salesStartDate: string;
  salesEndDate: string;
  displayStatus: TicketCategoryDisplayStatus;
}

export interface EventDetailResponse {
  eventId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizerName: string;
  ticketCategories: TicketCategoryDetailDto[];
}

export interface CreateBookingRequest {
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
}

export interface BookingSummaryResponse {
  bookingId: string;
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
  unitPrice: MoneyDto;
  totalPrice: MoneyDto;
  paymentDeadline: string;
  status: BookingStatus;
}

export interface PayBookingRequest {
  bookingId: string;
  paymentAmount: MoneyDto;
}

export interface MoneyDto {
  amount: number;
  currency: string;
}

export interface PurchasedTicketDto {
  ticketId: string;
  ticketCode: string;
  eventName: string;
  ticketCategoryName: string;
  status: TicketStatus;
}

export interface PurchasedTicketsResponse {
  tickets: PurchasedTicketDto[];
}

export interface RequestRefundRequest {
  bookingId: string;
}