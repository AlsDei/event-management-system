import { Capacity } from "../../value-objects/capacity.vo";
import { EventCreated } from "../../events/event-created.event";

export enum EventStatus {
    Draft = 'Draft',
    Published = 'Published',
    Canceled = 'Canceled',
    Completed = 'Completed'
}

export class Event {
    private id: string;
    private name: string;
    private description: string;
    private startDate: Date;
    private endDate: Date;
    private location: string;
    private maxCapacity: Capacity;
    private status: EventStatus;
    private domainEvents: any[] = [];

    constructor(
        id: string,
        name: string,
        description: string,
        startDate: Date,
        endDate: Date,
        location: string,
        maxCapacity: number,

    ) {
        if (endDate < startDate) {
            throw new Error("End date must be after start date");
        }

        this.id = id;
        this.name = name;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.location = location;
        this.maxCapacity = new Capacity(maxCapacity);
        this.status = EventStatus.Draft;

        this.domainEvents.push(new EventCreated(id, name, new Date()));
    }

    getId(): string { return this.id; }
    getStatus(): EventStatus { return this.status; }
    getEvents() { return this.domainEvents; }
}