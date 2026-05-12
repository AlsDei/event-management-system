export class EventSchedule {
    constructor(
        private readonly startDate: Date,
        private readonly endDate: Date
    ) {
        // Acceptance Criteria: End date cannot be earlier than start date [2]
        if (endDate < startDate) {
            throw new Error("The event end date cannot be earlier than the start date.");
        }
    }
    getStart(): Date { return this.startDate; }
    getEnd(): Date { return this.endDate; }
}