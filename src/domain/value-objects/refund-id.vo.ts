import { randomUUID } from 'crypto';

export class RefundId {
    private readonly value: string;
    private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    constructor(value?: string) {
        if (value !== undefined) {
            if (!RefundId.UUID_REGEX.test(value)) {
                throw new Error("Invalid refund ID: must be a valid UUID.");
            }
            this.value = value;
        } else {
            this.value = randomUUID();
        }
    }

    getValue(): string {
        return this.value;
    }

    equals(other: RefundId): boolean {
        return this.value === other.value;
    }
}