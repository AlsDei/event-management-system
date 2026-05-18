export class Money {
    constructor(
        private readonly amount: number,
        private readonly currency: string = 'USD'
    ) {
        // Acceptance Criteria: Price cannot be less than zero 
        if (amount < 0) {
            throw new Error("This must be greater than 0");
        }
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) throw new Error("Currency mismatch");
        return new Money(this.amount + other.amount, this.currency);
    }

    multiply(quantity: number): Money {
        return new Money(this.amount * quantity, this.currency);
    }
    getAmount(): number {
        return this.amount;
    }

    getCurrency(): string {
        return this.currency;
    }



}
