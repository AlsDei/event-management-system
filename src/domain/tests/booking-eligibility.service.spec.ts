import { BookingEligibilityService } from '../services/booking-eligibility.services';
import { IBookingRepository } from '../repositories/booking.repository';
import { EventId } from '../value-objects/event-id.vo';
import { CustomerID } from '../value-objects/customer-id.vo';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('BookingEligibilityService', () => {
    let service: BookingEligibilityService;
    let mockBookingRepo: jest.Mocked<IBookingRepository>;
    const customerId = CustomerID.create('550e8400-e29b-41d4-a716-446655440000');
    const eventId = new EventId('550e8400-e29b-41d4-a716-446655440001');

    beforeEach(() => {
        mockBookingRepo = {
            findActiveByCustomer: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findActiveByEventAndCategory: jest.fn(),
        } as any;

        service = new BookingEligibilityService(mockBookingRepo);
    });

    it('should return false if the customer already has an active booking for the event', async () => {
        // Arrange: Mock repo returns an existing active booking
        mockBookingRepo.findActiveByCustomer.mockResolvedValue([{ id: 'booking-1' } as any]);

        // Act
        const result = await service.canCustomerBook(customerId, eventId);

        // Assert: Acceptance Criteria US 8
        expect(result).toBe(false);
        expect(mockBookingRepo.findActiveByCustomer).toHaveBeenCalledWith(
            customerId.getValue(),
            eventId.getValue()
        );
    });

    it('should return true if the customer has no active bookings for the event', async () => {
        // Arrange: Mock repo returns empty array
        mockBookingRepo.findActiveByCustomer.mockResolvedValue([]);

        // Act
        const result = await service.canCustomerBook(customerId, eventId);

        // Assert
        expect(result).toBe(true);
    });
});