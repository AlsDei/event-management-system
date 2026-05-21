import { Event, EventStatus } from '../aggregates/event/event.aggregate';
import { TicketCategory } from '../entities/ticket-category.entity';
import { SalesPeriod } from '../value-objects/salesperiod.vo';
import { PriceCategory } from '../value-objects/price-category.vo';
import { Quota } from '../value-objects/quota.vo';
import { EventSchedule } from '../value-objects/event-schedule.vo';
import { Money } from '../value-objects/money.vo';
import { Capacity } from '../value-objects/capacity.vo';

describe('Event Aggregate', () => {
    // Test Case 1: Invalid Schedule
    it('should throw an error if the end date is earlier than the start date', () => {
        const start = new Date('2026-06-20');
        const end = new Date('2026-06-19');
        expect(() => new Event("Concert", "Desc", start, end, "Venue", 100, "11111111-2222-4333-8444-555555555555", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"))
            .toThrow("The event end date cannot be earlier than the start date.");
    });

    // Test Case 2: Zero/Negative Capacity
    it('should throw an error if maximum capacity is less than or equal to zero', () => {
        const start = new Date();
        const end = new Date(Date.now() + 3600000);
        expect(() => new Event("Concert", "Desc", start, end, "Venue", 0, "11111111-2222-4333-8444-555555555555", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"))
            .toThrow("Capacity must be greater than 0"); // Capacity VO should throw here
    });

    // Test Case 3: Publish without Categories
    it('should not allow publishing an event without at least one ticket category', () => {
        const event = new Event("Concert", "Desc", new Date(), new Date(), "Venue", 100, "11111111-2222-4333-8444-555555555555", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
        expect(() => event.publish()).toThrow("An event must have at least one active ticket category to be published.");
    });

    // Test Case 4: Quota vs Capacity


    it('should throw an error if ticket category quota exceeds event capacity', () => {
        const event = new Event("Concert", "Desc", new Date(), new Date(), "Venue", 10, "11111111-2222-4333-8444-555555555555", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");

        const startSales = new Date();
        const endSales = new Date(Date.now() + 3600000);
        const salesSchedule = new EventSchedule(startSales, endSales);
        const salesPeriod = new SalesPeriod(salesSchedule);

        const price = new PriceCategory(new Money(100, "IDR"));
        const quota = new Quota(new Capacity(11));

        const category = new TicketCategory("VIP", price, quota, salesPeriod, "bbbbbbbb-cccc-4dddd-8eeee-fffffffffffff");

        // Fix the error message assertion here:
        expect(() => event.addTicketCategory(category))
            .toThrow("Total ticket quota cannot exceed event capacity.");
    });
});