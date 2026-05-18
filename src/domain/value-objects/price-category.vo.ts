import { Money } from './money.vo';

export class PriceCategory {
  constructor(
    private readonly price: Money,
  ) {
    if (price.getAmount() < 0) {
      throw new Error("This must be greater than 0");
    }
  }
  get money(): Money { return this.price; }
}