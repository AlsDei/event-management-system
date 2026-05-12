import { Refund } from '../aggregates/refund/refund.aggregate';

export interface IRefundRepository {
    save(refund: Refund): Promise<void>;
    findById(id: string): Promise<Refund | null>;

    // Required for US 16 & 17: Helps organizers view and manage pending refund requests.
    findPending(): Promise<Refund[]>;
}