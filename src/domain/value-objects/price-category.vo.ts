import { Money } from './money.vo';

export class PriceCategory {
  constructor(
    private readonly price: Money,
  ) {
    // Money already validates non-negative, no redundant check needed
  }
  get money(): Money { return this.price; }
}