import { Capacity } from "../../value-objects/capacity.vo";
import { EventCreated } from "../../events/event-created.event";
import { EventId } from '../../value-objects/event-id.vo';
import { EventSchedule } from '../../value-objects/event-schedule.vo';

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

    getId(): string { return this.id.getValue(); }
    getStatus(): EventStatus { return this.status; }
    getEvents() { return this.domainEvents; }
}