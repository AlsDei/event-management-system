export type RefundAction = 'approve' | 'reject';

export interface UpdateRefundStatusRequest {
  refundId: string;
  action: RefundAction;
  rejectionReason?: string;
}
