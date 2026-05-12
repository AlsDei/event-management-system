import { PriceCategory } from '../value-objects/price-category.vo.';
import { Quota } from '../value-objects/quota.vo';
import { SalesPeriod } from '../value-objects/salesperiod.vo';


export class TicketCategory {
  private _active: boolean = true;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: PriceCategory,
    public readonly quota: Quota,
    public readonly salesSchedule: SalesPeriod,
  ) { }
  public disable(): void {
    // Business Rule: A ticket category can be disabled if event not completed [5]
    this._active = false;
    // Raise domain event TicketCategoryDisabled [6, 7]
  }

  public isActive(): boolean { return this._active; }

}
