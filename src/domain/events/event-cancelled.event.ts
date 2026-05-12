export class EventCancelled {
    constructor(
        public readonly eventId: string,
        public readonly occurredAt: Date
    ) { }
}
