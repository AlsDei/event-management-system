import { Capacity } from "../../value-objects/capacity.vo";
import { EventCreated } from "../../events/event-created.event";
import { EventId } from '../../value-objects/event-id.vo';
import { EventSchedule } from '../../value-objects/event-schedule.vo';
import { TicketCategory } from "../../entities/ticket-category.entity";
import { EventPublished } from "../../events/event-published.event";
import { EventCancelled } from "../../events/event-cancelled.event";
import { TicketCategoryCreated } from "../../events/ticket-category-created.event";

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
    private organizer: string; // Added per US 7
    private domainEvents: any[] = [];
    private ticketCategories: TicketCategory[] = [];


    constructor(
        name: string,
        description: string,
        startDate: Date,
        endDate: Date,
        location: string,
        maxCapacity: number,
        id: string,
        organizer: string,
    ) {
        this.id = new EventId(id);
        this.name = name;
        this.description = description;
        this.schedule = new EventSchedule(startDate, endDate);
        this.location = location;
        this.maxCapacity = new Capacity(maxCapacity);
        this.status = EventStatus.Draft;
        this.organizer = organizer;


        this.domainEvents.push(new EventCreated(id, name, new Date()));
    }

    public addTicketCategory(category: TicketCategory): void {
        const currentTotalQuota = this.ticketCategories.reduce((sum, cat) => sum + cat.quota.total, 0);

        // Validation check happens BEFORE pushing to the array
        if (currentTotalQuota + category.quota.total > this.maxCapacity.Value) {
            throw new Error("Total ticket quota cannot exceed event capacity.");
        }

        this.ticketCategories.push(category);
        this.domainEvents.push(new TicketCategoryCreated(this.id.getValue(), category.id));
    }

    public publish(): void {
        if (this.ticketCategories.length === 0) {
            throw new Error("An event must have at least one ticket category to be published.");[1]
        }
        if (this.status === EventStatus.Canceled) {
            throw new Error("A cancelled event cannot be published.");[1]
        }
        this.status = EventStatus.Published;
        this.domainEvents.push(new EventPublished(this.id.getValue(), new Date()));[1, 6]
    }

    public cancel(): void {
        if (this.status === EventStatus.Completed) {
            throw new Error("A completed event cannot be cancelled.");[2]
        }
        this.status = EventStatus.Canceled;
        // Business Rule: Disable all categories when cancelled [2]
        this.ticketCategories.forEach(cat => cat.disable());
        this.domainEvents.push(new EventCancelled(this.id.getValue(), new Date()));[2, 6]
    }

    getId(): string { return this.id.getValue(); }
    getStatus(): EventStatus { return this.status; }
    getEvents() { return this.domainEvents; }

}
