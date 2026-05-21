export class EventCreated {
    constructor(
        public readonly eventId: string,
        public readonly name: string,
        public readonly occurredAt: Date
    ) { }
}