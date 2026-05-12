export class EventId {
    constructor(private readonly value: string) {
        if (!value || value.length < 5) {
            throw new Error("Invalid Event ID format.");
        }
    }
    getValue(): string { return this.value; }
}