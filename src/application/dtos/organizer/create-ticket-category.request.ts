export interface CreateTicketCategoryRequest {
  eventId: string;
  name: string;
  price: number;
  currency?: string;
  quota: number;
  salesStartDate: string;
  salesEndDate: string;
}
