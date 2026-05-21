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
        this.domainEvents.push(new TicketCategoryCreated(this.id.getValue(), category.id, new Date()));
    }

    public publish(): void {
        const hasActiveCategory = this.ticketCategories.some(cat => cat.isActive());
        if (!hasActiveCategory) {
            throw new Error("An event must have at least one active ticket category to be published.");
        }
        if (this.status === EventStatus.Canceled) {
            throw new Error("A cancelled event cannot be published.");
        }
        this.status = EventStatus.Published;
        this.domainEvents.push(new EventPublished(this.id.getValue(), new Date()));
    }

    public cancel(): void {
        if (this.status === EventStatus.Completed) {
            throw new Error("A completed event cannot be cancelled.");
        }
        this.status = EventStatus.Canceled;
        // Business Rule: Disable all categories when cancelled
        this.ticketCategories.forEach(cat => cat.disable());
        this.domainEvents.push(new EventCancelled(this.id.getValue(), new Date()));
    }

    getId(): string { return this.id.getValue(); }
    getName(): string { return this.name; }
    getDescription(): string { return this.description; }
    getLocation(): string { return this.location; }
    getSchedule(): EventSchedule { return this.schedule; }
    getOrganizer(): string { return this.organizer; }
    getStatus(): EventStatus { return this.status; }
    getTicketCategories(): TicketCategory[] { return this.ticketCategories; }
    getEvents() { return this.domainEvents; }

}