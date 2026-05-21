import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class RefundId {
    private readonly value: string;

    constructor(value?: string) {
        if (value !== undefined) {
            if (!uuidValidate(value)) {
                throw new Error("Invalid refund ID: must be a valid UUID.");
            }
            this.value = value;
        } else {
            this.value = uuidv4();
        }
    }

    getValue(): string {
        return this.value;
    }

    equals(other: RefundId): boolean {
        return this.value === other.value;
    }
}