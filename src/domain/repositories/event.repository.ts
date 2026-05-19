import { Event } from '../aggregates/event/event.aggregate';

export interface IEventRepository {
    save(event: Event): Promise<void>;
    findById(id: string): Promise<Event | null>;
    // US 6: View Available Events
    findAllPublished(): Promise<Event[]>;
    // US 19 & 20: Sales reports and participant lists
    findByOrganizer(organizerId: string): Promise<Event[]>;
}