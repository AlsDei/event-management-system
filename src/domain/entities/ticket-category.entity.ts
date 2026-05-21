import { PriceCategory } from '../value-objects/price-category.vo';
import { Quota } from '../value-objects/quota.vo';
import { SalesPeriod } from '../value-objects/salesperiod.vo';
import { TicketCategoryDisabled } from '../events/ticket-category-disabled.event';

export class TicketCategory {
  private _active: boolean = true;
  private _quota: Quota;
  private domainEvents: any[] = [];

  constructor(
    public readonly name: string,
    public readonly price: PriceCategory,
    quota: Quota,
    public readonly salesSchedule: SalesPeriod,
    public readonly id: string,
  ) {
    this._quota = quota;
  }

  public disable(): void {
    // Business Rule: A ticket category can be disabled if event not completed [5]
    this._active = false;
    this.domainEvents.push(new TicketCategoryDisabled(this.id, new Date()));
  }

  /**
   * Reserves the given quantity from this category's quota.
   * Returns the updated quota (immutable pattern).
   */
  public reserveTickets(quantity: number): void {
    if (!this._active) {
      throw new Error("Cannot reserve tickets from a disabled category.");
    }
    this._quota = this._quota.reserve(quantity);
  }

  /**
   * Releases the given quantity back to this category's quota (e.g. expired/refunded booking).
   */
  public releaseTickets(quantity: number): void {
    this._quota = this._quota.release(quantity);
  }

  public isActive(): boolean { return this._active; }
  public getId(): string { return this.id; }
  public get quota(): Quota { return this._quota; }
  public getQuota(): Quota { return this._quota; }
  public getEvents() { return this.domainEvents; }
}