import { PurchasedTicketDto } from '../dtos/customer/customer.dtos';

export interface INotificationService {
    /**
     * Sends issued unique ticket codes to the customer via Email or WhatsApp after a successful purchase (US 10).
     * * @param destination The customer's verified phone number or email address.
     * @param tickets An array of issued ticket data blocks containing unique ticket codes.
     */
    sendTicketNotification(
        destination: string,
        tickets: PurchasedTicketDto[]
    ): Promise<void>;

    /**
     * Alerts the customer regarding modifications to their refund request lifecycle (US 15, 16, 17).
     * * @param destination The customer's contact pointer.
     * @param updateInfo Details regarding the new refund status and any applicable rejection reasons.
     */
    sendRefundStatusUpdate(
        destination: string,
        updateInfo: { refundId: string; status: 'Requested' | 'Approved' | 'Rejected'; reason?: string }
    ): Promise<void>;
}