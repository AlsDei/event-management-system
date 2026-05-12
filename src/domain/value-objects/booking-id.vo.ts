import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class BookingId {
    private readonly value: string;

    constructor(value?: string) {
        if (value !== undefined) {
            if (!uuidValidate(value)) {
                throw new Error("Invalid booking ID: must be a valid UUID.");
            }
            this.value = value;
        } else {
            this.value = uuidv4();
        }
    }

    getValue(): string {
        return this.value;
    }

    equals(other: BookingId): boolean {
        return this.value === other.value;
    }
}