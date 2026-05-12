import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class EventId {
    private readonly value: string;

    constructor(value?: string) {
        const id = value || uuidv4();

        if (!uuidValidate(id)) {
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