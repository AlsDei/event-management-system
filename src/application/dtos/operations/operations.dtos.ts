import { TicketStatus } from '../../../domain/aggregates/ticket/ticket.aggregate';
import { MoneyDto } from '../customer/customer.dtos';

export type CheckInErrorCode =
  | 'TICKET_NOT_FOUND'
  | 'ALREADY_CHECKED_IN'
  | 'WRONG_EVENT'
  | 'EVENT_CANCELLED'
  | 'TICKET_CANCELLED';

export interface CheckInRequest {
  ticketCode: string;
  eventId: string;
}

export interface CheckInResponse {
  success: boolean;
  ticketCode?: string;
  customerName?: string;
  ticketCategoryName?: string;
  errorCode?: CheckInErrorCode;
  errorMessage?: string;
}

export interface CategorySalesDto {
  ticketCategoryId: string;
  categoryName: string;
  totalQuota: number;
  ticketsSold: number;
  categoryRevenue: MoneyDto;
}

export interface BookingStatusCountsDto {
  pendingPayment: number;
  paid: number;
  expired: number;
  refunded: number;
}

export interface SalesReportResponse {
  eventId: string;
  eventName: string;
  categorySales: CategorySalesDto[];
  bookingCounts: BookingStatusCountsDto;
  totalRevenue: MoneyDto;
}

export interface ParticipantDto {
  customerId: string;
  customerName: string;
  ticketCategoryName: string;
  ticketCode: string;
  checkInStatus: TicketStatus;
}

export interface ParticipantListResponse {
  eventId: string;
  eventName: string;
  participants: ParticipantDto[];
  totalParticipants: number;
}
