export class EventPublished {
    constructor(
        public readonly eventId: string,
        public readonly occurredAt: Date
    ) { }
}
