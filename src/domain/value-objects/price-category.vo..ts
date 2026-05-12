import { Money } from './money.vo';

export class PriceCategory {
    constructor(
        private readonly price: Money,
  ) {
    if (price.getAmount() < 0) {
        throw new Error("Price amount must be greater than or equal to 0.");
    }
  }
  get money(): Money { return this.price; }
}