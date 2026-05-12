import { Capacity } from './capacity.vo';

export class Quota {
    constructor(
        private readonly totalQuota: Capacity,
        private readonly numberSold: number = 0
        
  ) {
    if(numberSold > totalQuota.Value) {
        throw new Error("Number sold cannot exceed total quota.");
    }
  }
  get total(): number { return this.totalQuota.Value; }
  get remaining(): number { return this.totalQuota.Value - this.numberSold; }

}
