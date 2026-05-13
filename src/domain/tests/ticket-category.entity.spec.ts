import { TicketCategory } from '../entities/ticket-category.entity';
import { PriceCategory } from '../value-objects/price-category.vo';
import { Money } from '../value-objects/money.vo';
import { Quota } from '../value-objects/quota.vo';
import { Capacity } from '../value-objects/capacity.vo';
import { SalesPeriod } from '../value-objects/salesperiod.vo';
import { EventSchedule } from '../value-objects/event-schedule.vo';
import { describe, it, expect } from '@jest/globals';

describe('TicketCategory Entity', () => {
    // Shared valid data for testing
    const validName = 'VIP';
    const validQuota = new Quota(new Capacity(100));
    const validSalesPeriod = new SalesPeriod(
        new EventSchedule(new Date('2026-01-01'), new Date('2026-01-02'))
    );

    it('should throw an error when created with a negative ticket price', () => {
        /**
         * Acceptance Criteria (US 4): The ticket price cannot be less than zero.
         * In a non-primitive approach, the validation happens inside the VO.
         */
        expect(() => {
            // Attempting to create a Money VO with a negative amount
            const negativeMoney = new Money(-1000, 'IDR');
            
            // This PriceCategory VO should throw the error before 
            // the TicketCategory is even constructed.
            const negativePrice = new PriceCategory(negativeMoney);

            new TicketCategory(
                'cat-123',
                validName,
                negativePrice,
                validQuota,
                validSalesPeriod
            );
        }).toThrow("Price amount must be greater than or equal to 0.");
    });

    it('should successfully create a TicketCategory with a valid price and quota', () => {
        const validPrice = new PriceCategory(new Money(50000, 'IDR'));
        
        const category = new TicketCategory(
            'cat-123',
            validName,
            validPrice,
            validQuota,
            validSalesPeriod
        );

        expect(category.name).toBe(validName);
        expect(category.price.money.getAmount()).toBe(50000);
    });
});