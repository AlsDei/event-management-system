import { Capacity } from './capacity.vo';

export class Quota {
    constructor(
        private readonly totalQuota: Capacity,
        private readonly numberSold: number = 0
  ) {
    if (numberSold < 0) {
        throw new Error("Number sold cannot be negative.");
    }
    if (numberSold > totalQuota.Value) {
        throw new Error("Number sold cannot exceed total quota.");
    }
  }

  get total(): number { return this.totalQuota.Value; }
  get remaining(): number { return this.totalQuota.Value - this.numberSold; }
  get sold(): number { return this.numberSold; }

  /**
   * Returns a new Quota with the given quantity reserved.
   * Throws if the quantity exceeds remaining capacity.
   */
  reserve(quantity: number): Quota {
    if (quantity <= 0) {
        throw new Error("Reserve quantity must be greater than zero.");
    }
    if (quantity > this.remaining) {
        throw new Error(`Cannot reserve ${quantity} tickets. Only ${this.remaining} remaining.`);
    }
    return new Quota(this.totalQuota, this.numberSold + quantity);
  }

  /**
   * Returns a new Quota with the given quantity released (e.g. booking expired or refunded).
   */
  release(quantity: number): Quota {
    if (quantity <= 0) {
        throw new Error("Release quantity must be greater than zero.");
    }
    if (quantity > this.numberSold) {
        throw new Error("Cannot release more than what has been sold.");
    }
    return new Quota(this.totalQuota, this.numberSold - quantity);
  }
}
