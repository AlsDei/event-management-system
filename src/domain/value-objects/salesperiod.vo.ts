import { EventSchedule } from "./event-schedule.vo";

export class SalesPeriod {
    constructor(private readonly salesSchedule: EventSchedule) {}

    isValidForEvent(eventStartDate: Date): boolean {
        return this.salesSchedule.getEnd() <= eventStartDate;
    }

    getStart(): Date {
        return this.salesSchedule.getStart();
    }

    getEnd(): Date {
        return this.salesSchedule.getEnd();
    }
}