import { Booking } from "../aggregates/booking/booking.aggregate";
import { Money } from "../value-objects/money.vo";

describe('Booking Aggregate', () => {
    const moneyVO = new Money(100000, 'IDR');
    // Test Case 5: Zero Quantity
    it('should throw an error if booking quantity is zero or negative', () => {
        expect(() => new Booking("cust-1", "event-1", "cat-1", 0, moneyVO))
            .toThrow("quantity must be greater than zero");
    });

    // Test Case 6: Payment Deadline
    it('should throw an error if payment is attempted after the 15-minute deadline', () => {
        const booking = new Booking("cust-1", "event-1", "cat-1", 1, moneyVO);
        // Manually manipulate the internal deadline or use a library like 'jest.useFakeTimers'
        jest.useFakeTimers().setSystemTime(new Date(Date.now() + 20 * 60 * 1000));
        expect(() => booking.pay(moneyVO)).toThrow("deadline has passed");
    });

    // Test Case 7: Incorrect Amount
    it('should throw an error if the payment amount does not match the total price', () => {
        const unitPrice = new Money(100);
        const booking = new Booking("cust-1", "event-1", "cat-1", 2, unitPrice); // Total 200
        const wrongAmount = new Money(150);
        expect(() => booking.pay(wrongAmount)).toThrow("Incorrect payment amount");
    });

    // Test Case 8: Paid Booking Expiration
    it('should not allow a paid booking to be marked as expired', () => {
        const booking = new Booking("cust-1", "event-1", "cat-1", 1, moneyVO);
        booking.pay(moneyVO);
        expect(() => booking.expire()).toThrow("paid booking cannot expire");
    });
});