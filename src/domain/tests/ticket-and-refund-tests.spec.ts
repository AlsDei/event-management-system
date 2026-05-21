import { Ticket, TicketStatus } from "../aggregates/ticket/ticket.aggregate";
import { Refund } from "../aggregates/refund/refund.aggregate";
import { Booking } from "../aggregates/booking/booking.aggregate";
import { Money } from "../value-objects/money.vo";
import { EventId } from "../value-objects/event-id.vo"; // Added missing import
import { RefundEligibilityService } from "../services/refund-eligibility.services"; // Ensure correct path

describe('Ticket and Refund Logic', () => {
    // Mock/Dummy global variables needed for your tests
    const sampleEventId = new EventId("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    const moneyVO = new Money(100, "USD"); // Or whatever your Money VO constructor requires

    // Test Case 9: Double Check-in
    it('should throw an error if a ticket that is already checked-in is checked-in again', () => {
        // Pass the actual EventId instance to the constructor
        const ticket = new Ticket(
            "11111111-2222-4333-8444-555555555555",
            "11111111-2222-4333-8444-555555555555",
            "11111111-2222-4333-8444-555555555556",
            sampleEventId
        );

        // Pass the required sampleEventId into the checkIn method
        ticket.checkIn(sampleEventId); // First time

        expect(() => ticket.checkIn(sampleEventId)).toThrow("already been used");
    });

    // Test Case 10: Refund & Check-in (Service Test)
    it('should not allow a refund request if a ticket has already been checked in', async () => {
        const mockRepo = { findByBookingId: jest.fn().mockResolvedValue([{ getStatus: () => 'CheckedIn' }]) };
        const service = new RefundEligibilityService(mockRepo as any);
        const booking = new Booking("cust-1", "event-1", "cat-1", 1, moneyVO);

        const isEligible = await service.canRequestRefund(booking);
        expect(isEligible).toBe(false);
    });

    // Test Case 11: Refund Approval Status
    it('should throw an error if approving a refund that is not in Requested status', () => {
        const refund = new Refund("book-1", new Money(100, "USD"));
        refund.reject("Invalid"); // Status becomes Rejected
        expect(() => refund.approve()).toThrow("Refund cannot be approved if not in Requested status.");
    });

    // Test Case 12: Rejection Reason
    it('should throw an error if a refund is rejected without a reason', () => {
        const refund = new Refund("book-1", new Money(100, "USD"));
        expect(() => refund.reject("")).toThrow("rejection reason must be provided");
    });
});