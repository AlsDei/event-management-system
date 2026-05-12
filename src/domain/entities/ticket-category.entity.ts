import { PriceCategory } from '../value-objects/price-category.vo.';
import { Quota} from '../value-objects/quota.vo';
import { SalesPeriod } from '../value-objects/salesperiod.vo';


export class TicketCategory {
    private_active: boolean = true;

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly price: PriceCategory, 
        public readonly quota: Quota, 
        public readonly salesSchedule: SalesPeriod,
  ) {}

  
}
