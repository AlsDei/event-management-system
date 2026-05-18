import { randomUUID } from 'crypto';

export class EventId {
    private readonly value: string;

    // Standard UUID v4 regex pattern (case-insensitive)
    private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    constructor(value?: string) {
        const id = value || randomUUID();

        if (!EventId.UUID_REGEX.test(id)) {
            throw new Error("Invalid UUID format for EventId.");
        }

        this.value = id;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: EventId): boolean {
        return this.value === other.getValue();
    }
}