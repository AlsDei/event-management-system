import { Capacity } from "../../value-objects/capacity.vo";
import { EventCreated } from "../../events/event-created.event";
import { EventId } from '../../value-objects/event-id.vo';
import { EventSchedule } from '../../value-objects/event-schedule.vo';
import { TicketCategory } from "../../entities/ticket-category.entity";

export enum EventStatus {
    Draft = 'Draft',
    Published = 'Published',
    Canceled = 'Canceled',
    Completed = 'Completed'
}

export class Event {
    private id: EventId;
    private name: string;
    private description: string;
    private schedule: EventSchedule;
    private location: string;
    private maxCapacity: Capacity;
    private status: EventStatus;
    private domainEvents: any[] = [];
    private _ticketCategories: TicketCategory[] = [];


    constructor(
        name: string,
        description: string,
        startDate: Date,
        endDate: Date,
        location: string,
        maxCapacity: number,
        id: string,

    ) {
        this.id = new EventId(id);
        this.name = name;
        this.description = description;
        this.schedule = new EventSchedule(startDate, endDate);
        this.location = location;
        this.maxCapacity = new Capacity(maxCapacity);
        this.status = EventStatus.Draft;

        this.domainEvents.push(new EventCreated(id, name, new Date()));
    }

    addTicketCategory(category: TicketCategory): void {
        if (!category.salesSchedule.isValidForEvent(this.schedule.getStart())) {
            throw new Error("Ticket sales period must end before or at the event start date.");
        }
        this._ticketCategories.push(category);

        const currentTotalQuota = this._ticketCategories.reduce(
            (sum, cat) => sum + cat.quota.total,
            0
        );

        if (currentTotalQuota + category.quota.total > this.maxCapacity.Value) {
            throw new Error("Total ticket quota exceeds maximum event capacity.");
        }
    }


    getId(): string { return this.id.getValue(); }
    getStatus(): EventStatus { return this.status; }
    getEvents() { return this.domainEvents; }
}