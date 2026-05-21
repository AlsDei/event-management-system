import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class CustomerID {
    private readonly value: string;

    private constructor(value: string) {
        if(!uuidValidate(value)) {
            throw new Error("Invalid Customer ID: must be a valid UUID.");
        }
        this.value = value;
    }

    static create(value?: string): CustomerID {
        if (value) {
            return new CustomerID(value);
        } else {
            return new CustomerID(uuidv4());
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