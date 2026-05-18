import { randomUUID } from 'crypto';

export class CustomerID {
    private readonly value: string;
    private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    private constructor(value: string) {
        if (!CustomerID.UUID_REGEX.test(value)) {
            throw new Error("Invalid Customer ID: must be a valid UUID.");
        }
        this.value = value;
    }

    static create(value?: string): CustomerID {
        if (value) {
            return new CustomerID(value);
        } else {
            return new CustomerID(randomUUID());
        }
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CustomerID): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}